#!/usr/bin/env python3
"""
sync_from_pdf.py — синхронізує questions.json з BAMF PDF.

Що робить:
  1. Парсить gesamtfragenkatalog-lebenindeutschland.pdf (частина I, питання 1–300)
  2. Для кожного питання: оновлює текст питання і відновлює порядок відповідей a/b/c/d
     відповідно до PDF, при цьому коригує поле solution так, щоб воно вказувало на
     той самий ТЕКСТ (не позицію).
  3. Записує оновлений questions.json (backup → questions.json.bak)
  4. Генерує звіт змін → questions_source_report.txt (додає секцію)

Запуск:
    python3 sync_from_pdf.py            # dry-run, друкує diff
    python3 sync_from_pdf.py --apply    # застосовує зміни до questions.json
    python3 sync_from_pdf.py --apply --report  # також оновлює звіт
"""

import re
import json
import sys
import unicodedata
import argparse
import shutil
from pathlib import Path
from datetime import datetime

try:
    import pymupdf
except ImportError:
    sys.exit("pymupdf not installed. Run: pip install pymupdf")

PDF_PATH  = Path(__file__).parent / "gesamtfragenkatalog-lebenindeutschland.pdf"
JSON_PATH = Path(__file__).parent / "questions.json"
REPORT_PATH = Path(__file__).parent / "questions_source_report.txt"


# ── PDF parsing ──────────────────────────────────────────────────────────────

def normalize(s: str) -> str:
    """Collapse whitespace and normalize unicode for fuzzy matching."""
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def extract_general_questions(pdf_path: Path) -> dict:
    """
    Returns {num: {"question": str, "answers": [str, str, str, str]}}
    for questions 1-300 (Teil I).
    PDF uses "Aufgabe N" as question markers, \uf0a3 as checkbox.
    """
    doc = pymupdf.open(str(pdf_path))
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
    doc.close()

    # locate Teil I ... Teil II
    teil1_match = re.search(r"Teil\s+I\b", full_text)
    teil2_match = re.search(r"Teil\s+II\b", full_text)
    if teil1_match:
        full_text = full_text[teil1_match.start():]
    if teil2_match:
        m2 = re.search(r"Teil\s+II\b", full_text)
        if m2:
            full_text = full_text[: m2.start()]

    questions = {}

    lines = full_text.split("\n")
    i = 0
    current_num = None
    current_q_lines = []
    answer_lines = []
    in_answers = False

    # "Aufgabe N" pattern (used in this PDF instead of bare numbers)
    AUFGABE   = re.compile(r"^\s*Aufgabe\s+(\d{1,3})\s*$")
    # Checkbox char \uf0a3 is the main one; others as fallback
    CHECKBOX  = re.compile(r"^[\u25a1\uf0a3\u2610\u2751\u2752\u2753\u25fb\u25a1☐□▢◻]\s*")

    def flush(num, q_lines, a_lines):
        if num is None or not q_lines:
            return
        q_text = normalize(" ".join(q_lines))
        answers = [normalize(CHECKBOX.sub("", a)) for a in a_lines]
        if len(answers) == 4:
            questions[num] = {"question": q_text, "answers": answers}

    while i < len(lines):
        line = lines[i].rstrip()
        m = AUFGABE.match(line)
        if m:
            n = int(m.group(1))
            if 1 <= n <= 300:
                flush(current_num, current_q_lines, answer_lines)
                current_num = n
                current_q_lines = []
                answer_lines = []
                in_answers = False
                i += 1
                continue
        if current_num is not None:
            stripped = line.strip()
            if CHECKBOX.match(stripped):
                in_answers = True
                after_cb = CHECKBOX.sub("", stripped).strip()
                if after_cb:
                    answer_lines.append(after_cb)
                else:
                    # Checkbox alone — text is on the next non-empty line
                    j = i + 1
                    while j < len(lines) and not lines[j].strip():
                        j += 1
                    if j < len(lines):
                        next_s = lines[j].strip()
                        if (not CHECKBOX.match(next_s)
                                and not re.match(r"^Seite\s+\d+", next_s)
                                and not AUFGABE.match(next_s)):
                            answer_lines.append(next_s)
                            i = j
            elif in_answers and answer_lines and not CHECKBOX.match(stripped) and stripped:
                if re.match(r"^Seite\s+\d+\s+von\s+\d+", stripped):
                    pass
                else:
                    answer_lines[-1] += " " + stripped
            elif not in_answers and stripped and not re.match(r"^Seite\s+\d+", stripped):
                current_q_lines.append(stripped)
        i += 1

    flush(current_num, current_q_lines, answer_lines)
    return questions


# ── Matching helpers ─────────────────────────────────────────────────────────

def _degender(s: str) -> str:
    """Strip gender suffixes to make Bundeskanzlerin==Bundeskanzler for matching."""
    # Remove /suffix patterns: Bundeskanzlerin/Bundeskanzler → bundeskanzlerin bundeskanzler
    # Then remove common feminine -in suffix from each token
    s = re.sub(r"([A-Za-zÄÖÜäöüß]+)/([A-Za-zÄÖÜäöüß]+)", r"\1 \2", s)
    return s


def _normalize_ans(s: str) -> str:
    """Normalize an answer string for fuzzy matching."""
    s = normalize(s).lower()
    s = _degender(s)
    # Remove trailing/leading punctuation from single-word answers
    s = re.sub(r"\.$", "", s.strip())
    # Normalize spaces around = (Q176 style: "1 = GB" == "1=GB")
    s = re.sub(r"\s*=\s*", "=", s)
    # Remove surrounding quotes
    s = s.strip('"\'„"')
    # Normalize % spacing: "5 %" → "5%"
    s = re.sub(r"(\d)\s+%", r"\1%", s)
    return s.strip()


def token_overlap(a: str, b: str) -> float:
    na, nb = _normalize_ans(a), _normalize_ans(b)
    if na == nb:
        return 1.0
    ta = set(na.split())
    tb = set(nb.split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / max(len(ta), len(tb))


def find_answer_slot(json_answers: dict, pdf_text: str) -> tuple:
    """Return (slot_key, score) whose text best matches pdf_text."""
    best_slot, best_score = None, 0.0
    for slot, text in json_answers.items():
        score = token_overlap(text, pdf_text)
        if score > best_score:
            best_score = score
            best_slot = slot
    return best_slot, best_score


# ── Main sync logic ──────────────────────────────────────────────────────────

def sync(apply: bool, write_report: bool):
    print(f"[sync_from_pdf] Parsing PDF: {PDF_PATH}", file=sys.stderr)
    pdf_qs = extract_general_questions(PDF_PATH)
    print(f"[sync_from_pdf] Extracted {len(pdf_qs)} questions from PDF", file=sys.stderr)

    with open(JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)

    changes = []
    errors  = []
    skipped = []
    total_q_updated = 0
    total_order_updated = 0

    SLOTS = ["a", "b", "c", "d"]

    for entry in data["general"]:
        num = int(entry["num"])
        if num not in pdf_qs:
            skipped.append(f"Q{num}: not found in PDF (>300?)")
            continue

        pdf = pdf_qs[num]
        pdf_answers = pdf["answers"]

        if len(pdf_answers) != 4:
            errors.append(f"Q{num}: PDF has {len(pdf_answers)} answers (expected 4), skipping")
            continue

        changed = False
        log = []

        # 1. Question text
        old_q = normalize(entry["question"])
        new_q = pdf["question"]
        q_sim = token_overlap(old_q, new_q)
        if q_sim < 0.85 and len(new_q) > 10:
            log.append(f"  Q text ({q_sim:.2f}): «{old_q[:70]}»\n           → «{new_q[:70]}»")
            if apply:
                entry["question"] = new_q
            changed = True
            total_q_updated += 1

        # 2. Answer order
        json_answers = {s: entry[s] for s in SLOTS}
        correct_text = json_answers[entry["solution"]]

        new_slot_texts = {}
        used_slots = set()
        mapping_ok = True

        for pdf_idx, pdf_ans in enumerate(pdf_answers):
            new_slot = SLOTS[pdf_idx]
            remaining = {s: t for s, t in json_answers.items() if s not in used_slots}
            matched, score = find_answer_slot(remaining, pdf_ans)
            if matched is None or score < 0.4:
                errors.append(
                    f"Q{num}: cannot match PDF answer[{pdf_idx+1}] «{pdf_ans[:55]}» "
                    f"(best score={score:.2f})"
                )
                mapping_ok = False
                break
            used_slots.add(matched)
            new_slot_texts[new_slot] = json_answers[matched]

        if not mapping_ok:
            continue

        # Find new solution slot
        new_solution = None
        for slot, text in new_slot_texts.items():
            if normalize(text) == normalize(correct_text):
                new_solution = slot
                break

        if new_solution is None:
            errors.append(f"Q{num}: cannot find correct answer after remapping")
            continue

        # Check if order actually changed
        order_changed = (
            new_solution != entry["solution"]
            or any(normalize(new_slot_texts[s]) != normalize(json_answers[s]) for s in SLOTS)
        )

        if order_changed:
            log.append(
                f"  order: sol {entry['solution']}→{new_solution}  "
                + " | ".join(f"{s}:{new_slot_texts[s][:25]}" for s in SLOTS)
            )
            if apply:
                for s in SLOTS:
                    entry[s] = new_slot_texts[s]
                entry["solution"] = new_solution
            changed = True
            total_order_updated += 1

        if changed:
            changes.append(f"Q{num}:\n" + "\n".join(log))

    # Print summary
    print(f"\n{'='*60}")
    print(f"Questions with text changes:   {total_q_updated}")
    print(f"Questions with order changes:  {total_order_updated}")
    print(f"Errors:                        {len(errors)}")
    print(f"Skipped (>300 or not in PDF):  {len(skipped)}")
    if not apply:
        print("\n[DRY RUN — use --apply to write changes]")
    print(f"{'='*60}")

    if errors:
        print("\nERRORS:")
        for e in errors:
            print(" ", e)

    if not apply and changes:
        print(f"\nCHANGES (first 50 of {len(changes)}):")
        for c in changes[:50]:
            print(c)

    # Write JSON
    if apply:
        bak = JSON_PATH.with_suffix(".json.bak")
        shutil.copy2(JSON_PATH, bak)
        print(f"\n[sync_from_pdf] Backup: {bak}", file=sys.stderr)
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[sync_from_pdf] Written: {JSON_PATH}", file=sys.stderr)

    # Write report
    if apply and write_report:
        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        section = f"""
---

## Оновлення від {ts} (sync_from_pdf.py)

### Статистика
- Питань з оновленим текстом питання: {total_q_updated}
- Питань з оновленим порядком відповідей: {total_order_updated}
- Помилок парсингу/маппінгу: {len(errors)}

### Деталі змін
"""
        for c in changes:
            section += c + "\n"
        if errors:
            section += "\n### Помилки\n"
            for e in errors:
                section += f"- {e}\n"

        with open(REPORT_PATH, "a", encoding="utf-8") as f:
            f.write(section)
        print(f"[sync_from_pdf] Report updated: {REPORT_PATH}", file=sys.stderr)

    return len(changes), len(errors)


def main():
    parser = argparse.ArgumentParser(description="Sync questions.json with BAMF PDF")
    parser.add_argument("--apply",  action="store_true", help="Write changes to questions.json")
    parser.add_argument("--report", action="store_true", help="Append sync summary to questions_source_report.txt")
    args = parser.parse_args()
    sync(apply=args.apply, write_report=args.report)


if __name__ == "__main__":
    main()
