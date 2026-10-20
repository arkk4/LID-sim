#!/usr/bin/env python3
"""
Parse Mein_Leben_in_Deutschland_Orientierungskurs.pdf → sets.json entries.

Strategy:
  - Lernseite pages  (have "Prüfungsaufgaben" text): one consolidated set per chapter summary.
  - Content pages    (have sidebar question numbers in left margin, x0 < 45, y0 < 740):
                     one set per page, IDs keyed to the printed book page number.

Sidebar lines are right-aligned, so a short line ("275") has its left edge (x0)
shifted to the right of the margin threshold. We therefore also accept spans whose
RIGHT edge (x1) lines up with the sidebar's right edge.

Usage:
    python3 parse_pdf_sets.py                   # preview as JSON to stdout
    python3 parse_pdf_sets.py --diff            # dry-run: report differences vs sets.json
    python3 parse_pdf_sets.py --patch-missing   # insert only missing questions into existing sets
    python3 parse_pdf_sets.py --reorder-questions  # overwrite question lists (fixes order too)
    python3 parse_pdf_sets.py --merge           # add brand-new sets
    python3 parse_pdf_sets.py --lernseite-only
    python3 parse_pdf_sets.py --content-only
    python3 parse_pdf_sets.py --pdf /other.pdf
"""
import pymupdf
import re
import json
import sys
import argparse
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = REPO_ROOT / "materials" / "Mein_Leben_in_Deutschland_Orientierungskurs.pdf"
SETS_PATH = REPO_ROOT / "data" / "sets" / "sets.json"

Q_MIN, Q_MAX = 1, 310
# Left-margin bounding box for sidebar question annotations (points)
SIDEBAR_X_MAX = 60.0
SIDEBAR_X1_MAX = 68.0
# Exclude bottom-of-page book-page-number text
SIDEBAR_Y_MAX = 740.0
# Header zone for chapter title
HEADER_Y_MAX = 80.0


def get_book_page_num(page):
    """Return the printed book page number from the page footer (~y=760)."""
    page_h = page.rect.height
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            for span in line["spans"]:
                text = span["text"].strip()
                y0 = span["bbox"][1]
                # Book page number: bottom margin, 1-3 digits
                if y0 > page_h - 50 and re.match(r'^\d{1,3}$', text):
                    n = int(text)
                    if 1 <= n <= 200:
                        return n
    return None


def get_chapter_title(page):
    """Return the running chapter header from y0 < HEADER_Y_MAX."""
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            for span in line["spans"]:
                text = span["text"].strip()
                y0 = span["bbox"][1]
                if y0 < HEADER_Y_MAX and len(text) > 4 and not re.match(r'^(MODUL|MODULE)', text):
                    return text
    return ""


def get_sidebar_questions(page):
    """Return question numbers from left-margin sidebar annotations, top-to-bottom.

    Sidebar question annotations are gray marginalia (Klein-Medium, color != 0)
    located in the left margin area (x0 < 60.0, x1 <= 68.0, y0 < SIDEBAR_Y_MAX).
    This handles both multi-question lines and single-question pages uniformly.
    """
    spans = []  # (y0, text)
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            for span in line["spans"]:
                text = span["text"].strip()
                if not text or not re.match(r'^[\d,\s]+$', text):
                    continue
                # Line numbers in reading texts (5, 10, 15...) are black body text (Klein-Regular, color=0);
                # sidebar question annotations are gray marginalia (Klein-Medium, color!=0).
                if span.get("font") != "Klein-Medium" or span.get("color") == 0:
                    continue
                x0, y0, x1, _ = span["bbox"]
                if x0 < SIDEBAR_X_MAX and x1 <= SIDEBAR_X1_MAX and y0 < SIDEBAR_Y_MAX:
                    spans.append((y0, text))

    spans.sort(key=lambda t: t[0])  # top-to-bottom order
    seen = set()
    qs = []
    for _, text in spans:
        for tok in re.findall(r'\d+', text):
            n = int(tok)
            if Q_MIN <= n <= Q_MAX and str(n) not in seen:
                seen.add(str(n))
                qs.append(str(n))
    return qs


def extract_lernseite_sets(doc):
    sets = []
    for i, page in enumerate(doc):
        text = page.get_text()
        # Lernseite question list header: e.g. "prüfungsaufgaben:", "!rüfungsaufgaben:", "prüfungsaufga2en"
        # followed directly by question numbers.
        m = re.search(r'(?:[Pp!][rüü]{1,2}f[%u]ngs[a-z0-9\-%/]+)\s*[:\s]\s*([0-9,\s\n]+)', text)
        if not m:
            continue

        nums = []
        for tok in re.findall(r'\d+', m.group(1)):
            n = int(tok)
            if Q_MIN <= n <= Q_MAX:
                nums.append(str(n))
            elif n > Q_MAX:
                break  # stop at first out-of-range (year, etc.)

        if not nums:
            continue

        book_pg = get_book_page_num(page)
        chapter = get_chapter_title(page)
        pg_label = str(book_pg) if book_pg else str(i + 1)

        sets.append({
            "id": f"lernseite-p{pg_label}",
            "title": f"Lernseite S.{pg_label}",
            "subtitle": chapter,
            "description": f"Prüfungsaufgaben S.{pg_label}",
            "questions": nums,
        })

    return sets


def extract_content_page_sets(doc):
    sets = []
    for i, page in enumerate(doc):
        text = page.get_text()

        # Skip Lernseite summary pages
        if 'Lernseite' in text:
            continue

        qs = get_sidebar_questions(page)
        if not qs:
            continue

        book_pg = get_book_page_num(page)
        chapter = get_chapter_title(page)
        pg_label = str(book_pg) if book_pg else f"pdf{i + 1}"

        sets.append({
            "id": f"book-p{pg_label}",
            "title": f"S.{pg_label}",
            "subtitle": "",
            "description": chapter,
            "questions": qs,
        })

    return sets


def load_sets(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_sets(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def merge_into_existing(new_sets, existing_path):
    existing = load_sets(existing_path)
    existing_ids = {s["id"] for s in existing}
    added = [s for s in new_sets if s["id"] not in existing_ids]
    return existing + added, len(added)


def reorder_questions_in_existing(new_sets, existing_path):
    """Overwrite the `questions` list of existing sets whose questions changed."""
    existing = load_sets(existing_path)
    new_by_id = {s["id"]: s["questions"] for s in new_sets}
    changed = 0
    for s in existing:
        new_qs = new_by_id.get(s["id"])
        if new_qs is not None and new_qs != s["questions"]:
            s["questions"] = new_qs
            changed += 1
    return existing, changed


# ---------------------------------------------------------------------------
# Dry-run diff
# ---------------------------------------------------------------------------

def diff_against_existing(new_sets, existing_path):
    """Compare parser output with sets.json without writing anything.

    Detects three kinds of problems per set:
      missing - question found by the parser but absent from sets.json
                (with the neighbour it would be inserted after)
      extra   - question present in sets.json but not found by the parser
      order   - questions present in both, but in a different relative order
    """
    existing = {s["id"]: s for s in load_sets(existing_path)}

    report = {"missing": [], "extra": [], "order": [], "new_sets": []}
    for s in new_sets:
        old = existing.get(s["id"])
        if old is None:
            report["new_sets"].append(s["id"])
            continue

        parsed, current = s["questions"], old["questions"]

        # missing, with the predecessor (in parser order) after which it belongs
        for idx, q in enumerate(parsed):
            if q in current:
                continue
            prev = next((p for p in reversed(parsed[:idx]) if p in current), None)
            report["missing"].append((s["id"], q, prev))

        # extra
        extra = [q for q in current if q not in parsed]
        if extra:
            report["extra"].append((s["id"], extra))

        # order: compare relative order of the questions both sides share
        parsed_common = [q for q in parsed if q in current]
        current_common = [q for q in current if q in parsed]
        if parsed_common != current_common:
            report["order"].append((s["id"], current_common, parsed_common))

    return report


def report_is_clean(report):
    return not any(report[k] for k in ("missing", "extra", "order", "new_sets"))


def print_report(report):
    print("=== DRY-RUN (nothing was written) ===", file=sys.stderr)

    for sid, q, prev in report["missing"]:
        where = f"after {prev}" if prev else "at the start"
        print(f"  [+] {sid}: question {q} is missing in sets.json (would be inserted {where})",
              file=sys.stderr)

    for sid, qs in report["extra"]:
        print(f"  [?] {sid}: in sets.json but not detected by the parser: {', '.join(qs)} "
              f"(manual edit, or another class of parsing bug)", file=sys.stderr)

    for sid, current, parsed in report["order"]:
        first = next(i for i, (a, b) in enumerate(zip(current, parsed)) if a != b)
        print(f"  [~] {sid}: order differs (first mismatch at position {first + 1})", file=sys.stderr)
        print(f"        sets.json: {', '.join(current)}", file=sys.stderr)
        print(f"        parser:    {', '.join(parsed)}", file=sys.stderr)

    if report["new_sets"]:
        print(f"  [new] sets not yet in sets.json (use --merge): {', '.join(report['new_sets'])}",
              file=sys.stderr)

    if report_is_clean(report):
        print("  No differences found ✔", file=sys.stderr)
    else:
        print("\n  Fixes: --patch-missing adds [+] items only; "
              "--reorder-questions also fixes [~] (and drops [?] items).", file=sys.stderr)


# ---------------------------------------------------------------------------
# Patch
# ---------------------------------------------------------------------------

def patch_missing_questions(new_sets, existing_path):
    """Insert only missing questions into existing sets, preserving everything else
    (including manual edits and the existing ordering)."""
    existing = load_sets(existing_path)
    new_by_id = {s["id"]: s["questions"] for s in new_sets}

    patched = 0
    for s in existing:
        new_qs = new_by_id.get(s["id"])
        if not new_qs:
            continue
        result = list(s["questions"])
        added = False
        for idx, q in enumerate(new_qs):
            if q in result:
                continue
            # insert after the nearest preceding neighbour (in parser order) already present
            pos = 0
            for prev in reversed(new_qs[:idx]):
                if prev in result:
                    pos = result.index(prev) + 1
                    break
            result.insert(pos, q)
            added = True
        if added:
            s["questions"] = result
            patched += 1
    return existing, patched


def main():
    parser = argparse.ArgumentParser(description="Parse Hueber PDF into sets.json format")
    parser.add_argument("--lernseite-only", action="store_true")
    parser.add_argument("--content-only", action="store_true")
    parser.add_argument("--diff", action="store_true",
                        help="Dry-run: report missing/extra questions and order mismatches vs "
                             "sets.json (exit code 1 if any differences)")
    parser.add_argument("--patch-missing", action="store_true",
                        help="Insert only missing questions into existing sets "
                             "(nothing is removed or reordered)")
    parser.add_argument("--merge", action="store_true",
                        help="Merge new entries into sets.json (skips existing IDs)")
    parser.add_argument("--reorder-questions", action="store_true",
                        help="Overwrite the questions list of existing sets (preserves everything else)")
    parser.add_argument("--pdf", default=str(PDF_PATH))
    args = parser.parse_args()

    doc = pymupdf.open(args.pdf)
    print(f"# Opened: {args.pdf}  ({len(doc)} pages)", file=sys.stderr)

    result = []
    if not args.content_only:
        ls = extract_lernseite_sets(doc)
        print(f"# Lernseite sets: {len(ls)}", file=sys.stderr)
        result.extend(ls)

    if not args.lernseite_only:
        cs = extract_content_page_sets(doc)
        print(f"# Content-page sets: {len(cs)}", file=sys.stderr)
        result.extend(cs)

    if args.diff:
        report = diff_against_existing(result, SETS_PATH)
        print_report(report)
        sys.exit(0 if report_is_clean(report) else 1)
    elif args.patch_missing:
        updated, n = patch_missing_questions(result, SETS_PATH)
        save_sets(updated, SETS_PATH)
        print(f"# Patched {n} sets with missing questions → {SETS_PATH}", file=sys.stderr)
    elif args.reorder_questions:
        updated, changed = reorder_questions_in_existing(result, SETS_PATH)
        save_sets(updated, SETS_PATH)
        print(f"# Updated questions in {changed} sets → {SETS_PATH}", file=sys.stderr)
    elif args.merge:
        merged, added = merge_into_existing(result, SETS_PATH)
        save_sets(merged, SETS_PATH)
        print(f"# Added {added} new sets → {SETS_PATH}", file=sys.stderr)
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()