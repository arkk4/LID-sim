#!/usr/bin/env python3
"""
extract_hueber_pdf.py — extract PDFs from the Hueber interaktiv app's disk cache.

The Hueber interaktiv desktop app (Electron/Chromium) stores downloaded textbook
PDFs in the operating system's Chromium "Simple Cache" (not as plain .pdf files).
This script scans that cache, identifies embedded PDF payloads, presents a
selection menu when multiple textbooks are found, and copies them to an output
directory ready for use with parse_pdf_sets.py.

⚠️  LEGAL NOTICE — READ BEFORE USE ⚠️
─────────────────────────────────────────────────────────────────────────────
This tool only copies files that the Hueber interaktiv app has already downloaded
to YOUR device with YOUR valid licence.  It does NOT circumvent DRM, crack
encryption, or bypass authentication.

DO NOT:
  • Distribute the extracted PDFs to others.
  • Upload them to file-sharing sites, torrents, or public repositories.
  • Use them without a valid Hueber licence.
  • Remove or obscure copyright notices inside the PDFs.

Copyright of the textbook content remains with Hueber Verlag GmbH & Co. KG.
Violation of copyright law can result in civil and criminal liability.

This script is provided for personal backup and research use only, consistent
with §53 UrhG (DE) / fair-use provisions in your jurisdiction.
─────────────────────────────────────────────────────────────────────────────

Usage:
    python3 tools/extract_hueber_pdf.py
    python3 tools/extract_hueber_pdf.py --out materials/
    python3 tools/extract_hueber_pdf.py --cache /custom/cache/path --out /tmp/pdfs
    python3 tools/extract_hueber_pdf.py --list          # list found PDFs, don't copy
    python3 tools/extract_hueber_pdf.py --all           # copy all found PDFs without prompting
"""

import argparse
import platform
import struct
import sys
from pathlib import Path

# ── Chromium Simple Cache constants ───────────────────────────────────────────
# Source: net/disk_cache/simple/simple_entry_format.h
_EOF_MAGIC = struct.pack("<Q", 0xF4FA6F45970D41D8)  # kSimpleCacheFinalMagicNumber
_EOF_RECORD_LEN = 24  # magic(8) + flag(4) + crc32(4) + stream_size(8) — but
                       # in practice the last 8 bytes are the magic; we search
                       # for it rather than rely on exact layout.

PDF_MAGIC = b"%PDF-"

# ── Platform-specific default cache paths ─────────────────────────────────────
APP_NAME = "Hueber-APP"  # Electron userData name used by Hueber interaktiv


def default_cache_roots() -> list[Path]:
    """Return candidate cache directories in priority order for this platform."""
    system = platform.system()
    home = Path.home()
    if system == "Darwin":  # macOS
        return [
            home / "Library" / "Application Support" / APP_NAME / "Cache" / "Cache_Data",
            home / "Library" / "Application Support" / APP_NAME / "Cache",
        ]
    if system == "Linux":
        return [
            home / ".config" / APP_NAME / "Cache" / "Cache_Data",
            home / ".config" / APP_NAME / "Cache",
        ]
    if system == "Windows":
        appdata = Path.home() / "AppData" / "Roaming"
        return [
            appdata / APP_NAME / "Cache" / "Cache_Data",
            appdata / APP_NAME / "Cache",
        ]
    return []


def find_cache_dir(override: str | None) -> Path | None:
    if override:
        p = Path(override)
        return p if p.is_dir() else None
    for candidate in default_cache_roots():
        if candidate.is_dir():
            return candidate
    return None


# ── Simple Cache entry parsing ─────────────────────────────────────────────────

def extract_pdf_from_entry(data: bytes) -> bytes | None:
    """
    Given the raw bytes of a Simple Cache entry file, return the embedded PDF
    payload or None.

    Strategy: locate `%PDF-` in the file, then trim any trailing Chromium
    footer by searching for the last `%%EOF` marker (standard PDF end-of-file)
    and keeping everything up to and including it plus a small margin.
    """
    offset = data.find(PDF_MAGIC)
    if offset == -1:
        return None

    pdf_data = data[offset:]

    # Strip Simple Cache EOF record if present at the end (8-byte magic)
    eof_magic_pos = pdf_data.rfind(_EOF_MAGIC)
    if eof_magic_pos != -1 and eof_magic_pos > len(pdf_data) - 64:
        pdf_data = pdf_data[:eof_magic_pos]

    # Trim to last %%EOF (PDF spec: file ends after %%EOF + optional \n)
    last_eof = pdf_data.rfind(b"%%EOF")
    if last_eof != -1:
        # Keep up to 3 bytes after %%EOF (CR/LF)
        pdf_data = pdf_data[: last_eof + 8]

    # Sanity: must still start with %PDF-
    if not pdf_data.startswith(PDF_MAGIC):
        return None

    return pdf_data


def guess_title(data: bytes, fallback: str) -> str:
    """
    Try to extract a human-readable title from the PDF metadata bytes.
    Looks for `/Title (...)` in the first 4 KB of the PDF.
    Falls back to the provided string.
    """
    header = data[:4096]
    import re
    m = re.search(rb"/Title\s*\(([^)]{3,80})\)", header)
    if m:
        try:
            return m.group(1).decode("latin-1").strip()
        except Exception:
            pass
    return fallback


# ── Discovery ──────────────────────────────────────────────────────────────────

def scan_cache(cache_dir: Path, verbose: bool = False) -> list[dict]:
    """
    Walk cache_dir, parse every `*_0` entry file, return a list of dicts:
      { "path": Path, "size": int, "title": str, "pdf": bytes }
    """
    # Simple Cache entry files end with `_0` (stream 0 = headers+body)
    candidates = list(cache_dir.glob("*_0"))
    if not candidates:
        # Fallback: try all non-index files
        candidates = [f for f in cache_dir.iterdir() if f.is_file() and "index" not in f.name]

    found: list[dict] = []
    for entry_file in candidates:
        try:
            raw = entry_file.read_bytes()
        except OSError:
            continue

        pdf = extract_pdf_from_entry(raw)
        if pdf is None:
            continue

        if len(pdf) < 1024:  # too small to be a real textbook PDF
            continue

        title = guess_title(pdf, entry_file.stem)
        found.append({
            "path": entry_file,
            "size": len(pdf),
            "title": title,
            "pdf": pdf,
        })
        if verbose:
            print(f"  \u2713 {entry_file.name}  ({len(pdf) // 1024} KB)  '{title}'", file=sys.stderr)

    return found


# ── Selection UI ───────────────────────────────────────────────────────────────

def select_books(books: list[dict], select_all: bool) -> list[dict]:
    if not books:
        return []
    if select_all or len(books) == 1:
        return books

    print("\nFound multiple PDFs in the Hueber cache:\n")
    for i, b in enumerate(books, 1):
        print(f"  [{i}] {b['title']}  ({b['size'] // 1024} KB)")
    print("  [A] All of the above")
    print("  [Q] Quit\n")

    while True:
        raw = input("Select [1-{}/A/Q]: ".format(len(books))).strip().upper()
        if raw == "Q":
            sys.exit(0)
        if raw == "A":
            return books
        try:
            idx = int(raw)
            if 1 <= idx <= len(books):
                return [books[idx - 1]]
        except ValueError:
            pass
        print("Invalid choice, try again.")


# ── Output ─────────────────────────────────────────────────────────────────────

def safe_filename(title: str) -> str:
    import re
    name = re.sub(r'[^\w\s\-.]', '_', title)
    name = re.sub(r'\s+', '_', name.strip())
    return name[:80] + ".pdf"


def copy_books(books: list[dict], out_dir: Path, dry_run: bool = False) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for b in books:
        fname = safe_filename(b["title"])
        dest = out_dir / fname
        if dry_run:
            print(f"  [dry-run] would write {dest}  ({b['size'] // 1024} KB)")
            continue
        dest.write_bytes(b["pdf"])
        print(f"  ✓ {dest}  ({b['size'] // 1024} KB)")


# ── Main ───────────────────────────────────────────────────────────────────────

LEGAL_NOTICE = """
⚠️  LEGAL NOTICE ⚠️
This tool extracts PDFs that the Hueber interaktiv app downloaded to YOUR
device under YOUR valid licence. Do NOT distribute the extracted PDFs.
Copyright remains with Hueber Verlag GmbH & Co. KG.
"""


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract Hueber interaktiv textbook PDFs from the app's disk cache.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=LEGAL_NOTICE,
    )
    parser.add_argument(
        "--cache",
        metavar="DIR",
        help="Path to the Chromium Cache_Data directory "
             "(auto-detected if omitted).",
    )
    parser.add_argument(
        "--out",
        metavar="DIR",
        default="materials",
        help="Output directory for extracted PDFs (default: materials/).",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List found PDFs and exit without copying.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Copy all found PDFs without interactive selection.",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Print each scanned cache entry.",
    )
    args = parser.parse_args()

    # ── Locate cache ──────────────────────────────────────────────────────────
    cache_dir = find_cache_dir(args.cache)
    if cache_dir is None:
        candidates = "\n  ".join(str(p) for p in default_cache_roots())
        sys.exit(
            f"ERROR: Hueber cache not found.\n"
            f"Tried:\n  {candidates}\n\n"
            f"Make sure the Hueber interaktiv app is installed and has downloaded\n"
            f"at least one textbook. You can also specify --cache <path> manually."
        )

    print(f"Scanning: {cache_dir}")
    books = scan_cache(cache_dir, verbose=args.verbose)

    if not books:
        sys.exit(
            "No PDF files found in the Hueber cache.\n"
            "Possible reasons:\n"
            "  • The app hasn't downloaded any textbooks yet — open the app and\n"
            "    navigate through the textbook to trigger caching.\n"
            "  • The cache was cleared.\n"
            "  • The cache path is wrong (use --cache to override)."
        )

    print(f"\nFound {len(books)} PDF(s):\n")
    for i, b in enumerate(books, 1):
        print(f"  {i}. {b['title']}  ({b['size'] // 1024} KB)")

    if args.list:
        return

    print(LEGAL_NOTICE)

    selected = select_books(books, select_all=args.all)

    out_dir = Path(args.out)
    # Resolve relative paths against the repo root (two levels up from tools/)
    if not out_dir.is_absolute():
        repo_root = Path(__file__).resolve().parent.parent
        out_dir = repo_root / out_dir

    print(f"\nOutput directory: {out_dir}\n")
    copy_books(selected, out_dir)
    print("\nDone. You can now run:")
    print("  python3 tools/parse_pdf_sets.py --pdf <output-file> --merge")


if __name__ == "__main__":
    main()
