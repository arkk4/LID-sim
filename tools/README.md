# Інструменти обслуговування (Tools)

Утиліти для парсингу офіційних PDF-матеріалів BAMF та синхронізації бази питань і сетів.

## Встановлення залежностей

```bash
pip install -r tools/requirements.txt
```
Основна бібліотека — `pymupdf` (PyMuPDF) для вилучення тексту та координат блоків у PDF.

## Утиліти

### 1. `parse_pdf_sets.py`
Вилучає маргінальні номери запитань зі сторінок підручника *«Mein Leben in Deutschland – Der Orientierungskurs»* і формує набори `QuestionSet` у `data/sets/sets.json`.

**Використання:**
```bash
# Попередній перегляд у форматі JSON (stdout)
python3 tools/parse_pdf_sets.py

# Об'єднати знайдені сети з існуючим data/sets/sets.json
python3 tools/parse_pdf_sets.py --merge

# Тільки узагальнюючі блоки розділів (Lernseite)
python3 tools/parse_pdf_sets.py --lernseite-only

# Тільки посторінкові сети основного матеріалу
python3 tools/parse_pdf_sets.py --content-only

# Вказати інший шлях до PDF
python3 tools/parse_pdf_sets.py --pdf /path/to/custom.pdf
```

### 2. `sync_from_pdf.py`
Синхронізує текст питань і варіантів відповідей з офіційним каталогом *«Gesamtfragenkatalog zum Test Leben in Deutschland»* (BAMF).
Коригує порядок відповідей та поле `solution` так, щоб літери вказували на правильний текст варіанта.

**Використання:**
```bash
# Dry run (перевірка розбіжностей без запису)
python3 tools/sync_from_pdf.py

# Застосувати зміни до data/questions/questions.json (створює backup .bak)
python3 tools/sync_from_pdf.py --apply

# Застосувати зміни та додати запис у звіт data/questions/sync_report.txt
python3 tools/sync_from_pdf.py --apply --report
```
