#!/usr/bin/env python3
"""
Parse Mein_Leben_in_Deutschland_Orientierungskurs.pdf → sets.json entries.

Strategy:
  - Lernseite pages  (have "Prüfungsaufgaben" text): one consolidated set per chapter summary.
  - Content pages    (have sidebar question numbers in left margin, x0 < 45, y0 < 740):
                     one set per page, IDs keyed to the printed book page number.

Usage:
    python3 parse_pdf_sets.py                   # preview as JSON to stdout
    python3 parse_pdf_sets.py --merge           # merge new entries into sets.json
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

PDF_PATH = Path(__file__).parent / "Mein_Leben_in_Deutschland_Orientierungskurs.pdf"
SETS_PATH = Path(__file__).parent / "sets.json"

Q_MIN, Q_MAX = 1, 310
# Left-margin threshold for sidebar question annotations (points)
SIDEBAR_X_MAX = 45.0
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
                x0, y0 = span["bbox"][0], span["bbox"][1]
                # Book page number: bottom margin, left or right side, 2-3 digits
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
    """Return question numbers from left-margin sidebar annotations, in top-to-bottom page order."""
    seen = set()
    qs = []  # list of (y0, question_str)
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            for span in line["spans"]:
                text = span["text"].strip()
                x0, y0 = span["bbox"][0], span["bbox"][1]
                if x0 < SIDEBAR_X_MAX and y0 < SIDEBAR_Y_MAX:
                    if re.match(r'^[\d,\s]+$', text) and text.strip():
                        for tok in re.findall(r'\d+', text):
                            n = int(tok)
                            if Q_MIN <= n <= Q_MAX and str(n) not in seen:
                                seen.add(str(n))
                                qs.append((y0, str(n)))
    qs.sort(key=lambda t: t[0])
    return [q for _, q in qs]


def extract_lernseite_sets(doc):
    sets = []
    for i, page in enumerate(doc):
        text = page.get_text()
        m = re.search(r'Prüfungsaufgaben[^\d]*([\d,\s\n]+)', text)
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
        if 'Prüfungsaufgaben' in text:
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


def merge_into_existing(new_sets, existing_path):
    with open(existing_path) as f:
        existing = json.load(f)
    existing_ids = {s["id"] for s in existing}
    added = [s for s in new_sets if s["id"] not in existing_ids]
    return existing + added, len(added)


def reorder_questions_in_existing(new_sets, existing_path):
    """Update only the `questions` list of existing sets whose questions changed."""
    with open(existing_path) as f:
        existing = json.load(f)
    new_by_id = {s["id"]: s["questions"] for s in new_sets}
    changed = 0
    for s in existing:
        new_qs = new_by_id.get(s["id"])
        if new_qs is not None and new_qs != s["questions"]:
            s["questions"] = new_qs
            changed += 1
    return existing, changed


def main():
    parser = argparse.ArgumentParser(description="Parse Hueber PDF into sets.json format")
    parser.add_argument("--lernseite-only", action="store_true")
    parser.add_argument("--content-only", action="store_true")
    parser.add_argument("--merge", action="store_true",
                        help="Merge new entries into sets.json (skips existing IDs)")
    parser.add_argument("--reorder-questions", action="store_true",
                        help="Update only the questions list of existing sets (preserves everything else)")
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

    if args.reorder_questions:
        updated, changed = reorder_questions_in_existing(result, SETS_PATH)
        with open(SETS_PATH, "w") as f:
            json.dump(updated, f, ensure_ascii=False, indent=2)
        print(f"# Updated questions in {changed} sets → {SETS_PATH}", file=sys.stderr)
    elif args.merge:
        merged, added = merge_into_existing(result, SETS_PATH)
        with open(SETS_PATH, "w") as f:
            json.dump(merged, f, ensure_ascii=False, indent=2)
        print(f"# Added {added} new sets → {SETS_PATH}", file=sys.stderr)
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
