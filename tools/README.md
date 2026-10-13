# Maintenance Utilities (`tools/`)

Python developer tools for parsing official BAMF PDFs and synchronizing questions and question sets.

## Installation

Install Python dependencies:
```bash
pip install -r tools/requirements.txt
```
Primary dependency: `pymupdf` (PyMuPDF) for PDF layout extraction and spatial text analysis.

## Utilities

### 1. `parse_pdf_sets.py`
Extracts sidebar question numbers from the textbook *«Mein Leben in Deutschland – Der Orientierungskurs»* and formats them into `QuestionSet` entries in `data/sets/sets.json`.

**Usage:**
```bash
# Preview extracted sets as JSON (stdout)
python3 tools/parse_pdf_sets.py

# Merge newly extracted sets into data/sets/sets.json (skips existing IDs)
python3 tools/parse_pdf_sets.py --merge

# Only extract chapter summary pages (Lernseite)
python3 tools/parse_pdf_sets.py --lernseite-only

# Only extract regular content pages
python3 tools/parse_pdf_sets.py --content-only

# Specify a custom PDF path
python3 tools/parse_pdf_sets.py --pdf /path/to/custom.pdf
```

### 2. `sync_from_pdf.py`
Synchronizes question text and canonical answer ordering with the official BAMF *«Gesamtfragenkatalog zum Test Leben in Deutschland»* PDF.
Remaps answer choices while adjusting the `solution` letter to ensure it continually points to the correct text.

**Usage:**
```bash
# Dry run (prints diff without writing changes)
python3 tools/sync_from_pdf.py

# Apply changes to data/questions/questions.json (creates a .bak backup)
python3 tools/sync_from_pdf.py --apply

# Apply changes and append an entry to data/questions/sync_report.txt
python3 tools/sync_from_pdf.py --apply --report
```
