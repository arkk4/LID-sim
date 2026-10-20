#!/usr/bin/env python3
"""
test_parse_pdf_sets.py — runnable self-check for parse_pdf_sets.py logic.
Verifies:
1. Book pages 3 and 9 (preface/intro) produce 0 questions / 0 sets.
2. Single-question content pages (41, 55, 75, 101) are correctly detected.
3. Reading text line numbers (5, 10, 15) on p84 are excluded.
4. All 12 real Lernseite summary sets are correctly extracted.
"""

import sys
from pathlib import Path
import pymupdf

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "tools"))

from parse_pdf_sets import (
    PDF_PATH,
    get_book_page_num,
    get_sidebar_questions,
    extract_lernseite_sets,
    extract_content_page_sets,
)


def main():
    assert PDF_PATH.is_file(), f"PDF not found at {PDF_PATH}"
    doc = pymupdf.open(str(PDF_PATH))

    # 1. Book pages 3 (Vorwort) and 9 (Orientierung im Lehrwerk)
    p3_pdf = next(p for p in doc if get_book_page_num(p) == 3)
    p9_pdf = next(p for p in doc if get_book_page_num(p) == 9)
    assert get_sidebar_questions(p3_pdf) == [], "Book page 3 should have 0 sidebar questions"
    assert get_sidebar_questions(p9_pdf) == [], "Book page 9 should have 0 sidebar questions"

    # 2. Single-question pages
    single_q_expected = {
        41: ["41"],
        55: ["162"],
        75: ["267"],
        101: ["118"],
    }
    for bp, expected_qs in single_q_expected.items():
        page = next(p for p in doc if get_book_page_num(p) == bp)
        qs = get_sidebar_questions(page)
        assert qs == expected_qs, f"Book page {bp} expected {expected_qs}, got {qs}"

    # 3. Line numbers 5, 10, 15 on book page 84 (must contain questions, not line numbers)
    p84_pdf = next(p for p in doc if get_book_page_num(p) == 84)
    p84_qs = get_sidebar_questions(p84_pdf)
    for bad in ["5", "10", "15"]:
        assert bad not in p84_qs, f"Line number '{bad}' leaked into book-p84 questions: {p84_qs}"
    assert p84_qs == ["248", "249", "251", "255", "258", "273"], f"Unexpected questions for book-p84: {p84_qs}"

    # 4. Lernseite summary sets
    ls_sets = extract_lernseite_sets(doc)
    assert len(ls_sets) == 12, f"Expected 12 Lernseite sets, got {len(ls_sets)}"
    ls_ids = [s["id"] for s in ls_sets]
    assert "lernseite-p3" not in ls_ids, "lernseite-p3 should not be extracted"
    assert "lernseite-p9" not in ls_ids, "lernseite-p9 should not be extracted"

    # 5. Content page sets
    cs_sets = extract_content_page_sets(doc)
    assert len(cs_sets) == 51, f"Expected 51 content page sets, got {len(cs_sets)}"
    cs_ids = {s["id"] for s in cs_sets}
    for bp in [41, 55, 75, 101]:
        assert f"book-p{bp}" in cs_ids, f"book-p{bp} missing from content page sets"

    print("✓ All parse_pdf_sets checks passed successfully.")


if __name__ == "__main__":
    main()
