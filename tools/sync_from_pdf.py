#!/usr/bin/env python3
"""
sync_from_pdf.py — синхронізує questions.json з BAMF PDF.

Що робить:
  1. Парсить gesamtfragenkatalog-lebenindeutschland.pdf (частина I, питання 1–300)
     та частину II (регіональні питання для 16 земель).
  2. Для кожного питання: оновлює текст питання і відновлює порядок відповідей a/b/c/d
     відповідно до PDF, при цьому коригує поле solution так, щоб воно вказувало на
     той самий ТЕКСТ (не позицію).
     Регіональні питання зіставляються за схожістю тексту (не за номером), бо
     нумерація в JSON і PDF може відрізнятись.
  3. Записує оновлений questions.json (backup → questions.json.bak)
  4. Генерує звіт змін → sync_report.txt (додає секцію)

Запуск:
    python3 sync_from_pdf.py                       # dry-run (загальні + регіональні)
    python3 sync_from_pdf.py --general-only         # тільки питання 1–300
    python3 sync_from_pdf.py --states-only          # тільки регіональні
    python3 sync_from_pdf.py --apply                # застосовує зміни до questions.json
    python3 sync_from_pdf.py --apply --report       # також оновлює звіт
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

REPO_ROOT   = Path(__file__).resolve().parent.parent
PDF_PATH    = REPO_ROOT / "materials" / "gesamtfragenkatalog-lebenindeutschland.pdf"
JSON_PATH   = REPO_ROOT / "data" / "questions" / "questions.json"
REPORT_PATH = REPO_ROOT / "data" / "questions" / "sync_report.txt"


# ── PDF parsing ──────────────────────────────────────────────────────────────

def normalize(s: str) -> str:
    """Collapse whitespace and normalize unicode for fuzzy matching."""
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


# State name → JSON key
_STATE_MAP = {
    "Baden-Württemberg": "BW", "Bayern": "BY", "Berlin": "BE", "Brandenburg": "BB",
    "Bremen": "HB", "Hamburg": "HH", "Hessen": "HE", "Mecklenburg-Vorpommern": "MV",
    "Niedersachsen": "NI", "Nordrhein-Westfalen": "NW", "Rheinland-Pfalz": "RP",
    "Saarland": "SL", "Sachsen": "SN", "Sachsen-Anhalt": "ST",
    "Schleswig-Holstein": "SH", "Thüringen": "TH",
}

# "Bild N" (image placeholder) ↔ "N" normalization
_BILD_RE = re.compile(r"^Bild\s+(\d+)$", re.IGNORECASE)


def _normalize_image_ans(text: str) -> str:
    """Collapse 'Bild N' → 'N' so image answers match between JSON and PDF."""
    m = _BILD_RE.match(text.strip())
    return m.group(1) if m else text


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


def extract_state_questions(pdf_path: Path) -> dict:
    """
    Returns {state_code: {1: {"question": str, "answers": [str,str,str,str]}, ...}}
    for Teil II of the PDF (10 questions per Bundesland).
    Image answers are stored as "Bild N" strings.
    """
    doc = pymupdf.open(str(pdf_path))
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
    doc.close()

    teil2_match = re.search(r"Teil\s+II\b", full_text)
    if not teil2_match:
        return {}
    teil2_text = full_text[teil2_match.start():]

    HEADER = re.compile(
        r"Teil\s+II\s*\nFragen für das Bundesland\s+"
        r"([\w\s\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\u00df-]+?)\n"
    )
    parts = HEADER.split(teil2_text)
    # parts: [pre, state_name, chunk, state_name, chunk, ...]

    AUFGABE  = re.compile(r"^\s*Aufgabe\s+(\d{1,3})\s*$")
    CHECKBOX = re.compile(r"^[\u25a1\uf0a3\u2610\u2751\u2752\u2753\u25fb\u25a1\u2610\u25fb]")

    def parse_chunk(text):
        qs = {}
        lines = text.split("\n")
        i = 0
        cur_num = None
        cur_q = []
        cur_a = []
        in_a = False

        def flush(n, q, a):
            if n and q:
                qs[n] = {"question": normalize(" ".join(q)), "answers": a[:]}

        while i < len(lines):
            line = lines[i].rstrip()
            m = AUFGABE.match(line)
            if m:
                flush(cur_num, cur_q, cur_a)
                cur_num = int(m.group(1))
                cur_q, cur_a, in_a = [], [], False
                i += 1
                continue
            if cur_num is not None:
                s = line.strip()
                if CHECKBOX.match(s):
                    in_a = True
                    after = CHECKBOX.sub("", s).strip()
                    if after:
                        cur_a.append(after)
                    else:
                        j = i + 1
                        while j < len(lines) and not lines[j].strip():
                            j += 1
                        if j < len(lines):
                            ns = lines[j].strip()
                            if (not CHECKBOX.match(ns)
                                    and not re.match(r"^Seite\s+\d+", ns)
                                    and not AUFGABE.match(ns)):
                                cur_a.append(ns)
                                i = j
                elif in_a and cur_a and s and not re.match(r"^Seite\s+\d+", s):
                    cur_a[-1] += " " + s
                elif not in_a and s and not re.match(r"^Seite\s+\d+", s):
                    # Skip bare "Bild N" image-placeholder lines before checkboxes
                    if not re.match(r"^Bild\s+\d+$", s):
                        cur_q.append(s)
            i += 1
        flush(cur_num, cur_q, cur_a)
        return qs

    result = {}
    for idx in range(1, len(parts), 2):
        state_name = parts[idx].strip().split("\n")[0].strip()
        code = _STATE_MAP.get(state_name)
        if code:
            result[code] = parse_chunk(parts[idx + 1])
    return result


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

def _sync_one_question(entry: dict, pdf_answers: list, apply: bool, label: str,
                       use_image_norm: bool = False) -> tuple:
    """
    Sync a single JSON entry against the 4 PDF answer strings.
    Returns (changed: bool, log_lines: list, error: str|None, q_updated: bool, order_updated: bool).
    """
    SLOTS = ["a", "b", "c", "d"]
    changed = False
    log = []
    q_updated = False
    order_updated = False

    if len(pdf_answers) != 4:
        return False, [], f"{label}: PDF has {len(pdf_answers)} answers (expected 4)", False, False

    # Normalize JSON answers for matching (image questions: 'N' == 'Bild N')
    def norm_json_ans(t):
        return _normalize_image_ans(t) if use_image_norm else t

    json_answers = {s: norm_json_ans(entry[s]) for s in SLOTS}
    # PDF answers: normalize image placeholders too
    pdf_ans_norm = [_normalize_image_ans(a) if use_image_norm else a for a in pdf_answers]

    correct_text = json_answers[entry["solution"]]

    new_slot_texts = {}
    used_slots = set()
    for pdf_idx, pdf_ans in enumerate(pdf_ans_norm):
        new_slot = SLOTS[pdf_idx]
        remaining = {s: t for s, t in json_answers.items() if s not in used_slots}
        matched, score = find_answer_slot(remaining, pdf_ans)
        if matched is None or score < 0.4:
            return (False, [], f"{label}: cannot match PDF answer[{pdf_idx+1}] "
                    f"«{pdf_ans[:55]}» (best score={score:.2f})", False, False)
        used_slots.add(matched)
        new_slot_texts[new_slot] = json_answers[matched]

    new_solution = next(
        (s for s, t in new_slot_texts.items() if normalize(t) == normalize(correct_text)),
        None
    )
    if new_solution is None:
        return False, [], f"{label}: cannot find correct answer after remapping", False, False

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
            # Write back original (un-normalized) answer texts
            orig_answers = {s: entry[s] for s in SLOTS}
            # Build slot→original mapping via normalized key
            norm_to_orig = {norm_json_ans(orig_answers[s]): orig_answers[s] for s in SLOTS}
            for s in SLOTS:
                entry[s] = norm_to_orig.get(new_slot_texts[s], new_slot_texts[s])
            entry["solution"] = new_solution
        changed = True
        order_updated = True

    return changed, log, None, q_updated, order_updated


def sync_general(data: dict, pdf_path: Path, apply: bool) -> tuple:
    """Sync data['general'] against Teil I of the PDF. Returns (changes, errors, skipped)."""
    pdf_qs = extract_general_questions(pdf_path)
    print(f"[sync_from_pdf] Extracted {len(pdf_qs)} general questions from PDF", file=sys.stderr)

    SLOTS = ["a", "b", "c", "d"]
    changes, errors, skipped = [], [], []
    total_q_updated = total_order_updated = 0

    for entry in data["general"]:
        num = int(entry["num"])
        if num not in pdf_qs:
            skipped.append(f"Q{num}: not found in PDF (>300?)")
            continue

        pdf = pdf_qs[num]
        label = f"Q{num}"
        log = []
        changed = False

        # 1. Question text
        old_q = normalize(entry["question"])
        new_q = pdf["question"]
        if token_overlap(old_q, new_q) < 0.85 and len(new_q) > 10:
            log.append(f"  Q text: «{old_q[:70]}»\n           → «{new_q[:70]}»")
            if apply:
                entry["question"] = new_q
            changed = True
            total_q_updated += 1

        # 2. Answer order
        ok, order_log, err, _, order_upd = _sync_one_question(
            entry, pdf["answers"], apply, label
        )
        if err:
            errors.append(err)
            continue
        if ok:
            log.extend(order_log)
            changed = True
            total_order_updated += 1

        if changed:
            changes.append(f"{label}:\n" + "\n".join(log))

    print(f"[sync_from_pdf] General — text changes: {total_q_updated}, "
          f"order changes: {total_order_updated}, errors: {len(errors)}, "
          f"skipped: {len(skipped)}", file=sys.stderr)
    return changes, errors, skipped


def sync_states(data: dict, pdf_path: Path, apply: bool) -> tuple:
    """
    Sync data['states'] against Teil II of the PDF.
    State questions are matched by question-text similarity (not by number).
    Returns (changes, errors, skipped).
    """
    pdf_states = extract_state_questions(pdf_path)
    print(f"[sync_from_pdf] Extracted state questions for: {sorted(pdf_states)}", file=sys.stderr)

    changes, errors, skipped = [], [], []
    total_q_updated = total_order_updated = 0

    for code, json_qs in data["states"].items():
        pdf_qs = pdf_states.get(code)
        if not pdf_qs:
            skipped.append(f"{code}: no questions in PDF")
            continue

        # Build list of PDF entries for text-based matching
        pdf_list = list(pdf_qs.values())  # each: {question, answers}
        used_pdf = set()  # indices already matched

        for entry in json_qs:
            raw_num = entry["num"]  # e.g. "BB-1"
            json_q = normalize(entry["question"])

            # Find best-matching PDF question by text overlap
            best_idx, best_sim = -1, 0.0
            for i, pq in enumerate(pdf_list):
                if i in used_pdf:
                    continue
                sim = token_overlap(json_q, pq["question"])
                if sim > best_sim:
                    best_sim, best_idx = sim, i

            if best_idx == -1 or best_sim < 0.5:
                skipped.append(f"{raw_num}: no PDF match (best sim={best_sim:.2f})")
                continue

            used_pdf.add(best_idx)
            pdf = pdf_list[best_idx]
            label = raw_num
            log = []
            changed = False

            # 1. Question text
            new_q = pdf["question"]
            if best_sim < 0.85 and len(new_q) > 10:
                log.append(f"  Q text ({best_sim:.2f}): «{json_q[:60]}»\n               → «{new_q[:60]}»")
                if apply:
                    entry["question"] = new_q
                changed = True
                total_q_updated += 1

            # 2. Answer order (image answers need 'Bild N'↔'N' normalization)
            is_image_q = all(_BILD_RE.match(a.strip()) or a.strip().isdigit()
                             for a in pdf["answers"])
            ok, order_log, err, _, order_upd = _sync_one_question(
                entry, pdf["answers"], apply, label, use_image_norm=is_image_q
            )
            if err:
                errors.append(err)
                continue
            if ok:
                log.extend(order_log)
                changed = True
                total_order_updated += 1

            if changed:
                changes.append(f"{label}:\n" + "\n".join(log))

    print(f"[sync_from_pdf] States  — text changes: {total_q_updated}, "
          f"order changes: {total_order_updated}, errors: {len(errors)}, "
          f"skipped: {len(skipped)}", file=sys.stderr)
    return changes, errors, skipped


def sync(apply: bool, write_report: bool, general_only: bool = False, states_only: bool = False):
    print(f"[sync_from_pdf] Parsing PDF: {PDF_PATH}", file=sys.stderr)

    with open(JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)

    all_changes, all_errors, all_skipped = [], [], []

    if not states_only:
        ch, er, sk = sync_general(data, PDF_PATH, apply)
        all_changes.extend(ch)
        all_errors.extend(er)
        all_skipped.extend(sk)

    if not general_only:
        ch, er, sk = sync_states(data, PDF_PATH, apply)
        all_changes.extend(ch)
        all_errors.extend(er)
        all_skipped.extend(sk)

    # ── Summary ──────────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"Total questions changed: {len(all_changes)}")
    print(f"Errors:                  {len(all_errors)}")
    print(f"Skipped:                 {len(all_skipped)}")
    if not apply:
        print("\n[DRY RUN — use --apply to write changes]")
    print(f"{'='*60}")

    if all_errors:
        print("\nERRORS:")
        for e in all_errors:
            print(" ", e)

    if all_skipped:
        print("\nSKIPPED:")
        for s in all_skipped:
            print(" ", s)

    if not apply and all_changes:
        print(f"\nCHANGES (first 50 of {len(all_changes)}):")
        for c in all_changes[:50]:
            print(c)

    # ── Write JSON ────────────────────────────────────────────────────────────
    if apply:
        bak = JSON_PATH.with_suffix(".json.bak")
        shutil.copy2(JSON_PATH, bak)
        print(f"\n[sync_from_pdf] Backup: {bak}", file=sys.stderr)
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[sync_from_pdf] Written: {JSON_PATH}", file=sys.stderr)

    # ── Write report ──────────────────────────────────────────────────────────
    if apply and write_report:
        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        section = f"""\n---\n
## Оновлення від {ts} (sync_from_pdf.py)

### Деталі змін\n"""
        for c in all_changes:
            section += c + "\n"
        if all_errors:
            section += "\n### Помилки\n"
            for e in all_errors:
                section += f"- {e}\n"

        with open(REPORT_PATH, "a", encoding="utf-8") as f:
            f.write(section)
        print(f"[sync_from_pdf] Report updated: {REPORT_PATH}", file=sys.stderr)

    return len(all_changes), len(all_errors)


def main():
    parser = argparse.ArgumentParser(description="Sync questions.json with BAMF PDF")
    parser.add_argument("--apply",         action="store_true", help="Write changes to questions.json")
    parser.add_argument("--report",        action="store_true", help="Append sync summary to sync_report.txt")
    parser.add_argument("--general-only",  action="store_true", help="Only process Teil I (questions 1–300)")
    parser.add_argument("--states-only",   action="store_true", help="Only process Teil II (regional questions)")
    args = parser.parse_args()
    sync(
        apply=args.apply,
        write_report=args.report,
        general_only=args.general_only,
        states_only=args.states_only,
    )


if __name__ == "__main__":
    main()
