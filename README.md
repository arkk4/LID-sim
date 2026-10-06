# LID-sim — Leben in Deutschland Quiz Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)

An offline-first, dual-interface simulator for the German naturalization test (**"Leben in Deutschland"** / **"Einbürgerungstest"**).

Includes the complete official catalog of **300 general questions** plus **10 state-specific questions** for each of the 16 German federal states (*Bundesländer*), verified against official BAMF answer keys.

---

## Features

- **Dual Interfaces**:
  - **Terminal REPL (`cli.py`)**: Keyboard-driven interactive CLI built with `rich`, featuring question sets, exam simulation, and iTerm2 inline graphics for coats of arms and question illustrations.
  - **Modern Web Application (`index.html` / `src/`)**: Next-generation React + Vite application with dark mode, question sets (thematic & textbook chapters), quick-jump drawer, exam simulation (33 questions, 60 minutes, scoring breakdown), and responsive design.
- **Question Sets (Fragensets)**: Group questions by textbook chapters (e.g. *Lehrbuch: Seiten 10–25*) or thematic blocks (*Politik*, *Geschichte*, *Gesellschaft*).
- **Official Exam Simulation (Prüfungssimulation)**: Realistic test mode with 33 randomized questions (30 general + 3 state), 60-minute countdown, passing thresholds (≥15 for integration courses, ≥17 for citizenship), and wrong-answer review.
- **Complete Offline Support**: Pre-cached illustrations (`Assets/cache/`) and coats of arms (`Assets/coats/`) with automatic fallback to remote mirrors.
- **Verified Official Questions**: Curated and verified against the official *Bundesamt für Migration und Flüchtlinge* (BAMF) catalog.
- **State Selection**: Seamlessly switch between all 16 federal states with state-specific question IDs (`NW-1`, `BY-10`, etc.).

---

## Quick Start

### Prerequisites

For the CLI:
- Python 3.8+
- The `rich` library:
  ```bash
  pip install rich
  ```

For the Web App:
- Node.js 18+ (for development & building):
  ```bash
  npm install
  npm run dev
  ```

---

## CLI Usage (`cli.py`)

Run the interactive terminal simulator:

```bash
python3 cli.py
```

### Command-line Arguments

| Flag | Argument | Description | Example |
|---|---|---|---|
| `-s`, `--state` | `CODE` | Set active Bundesland (default: `NW`) | `python3 cli.py -s BY` |
| `-g`, `--goto` | `N` | Jump directly to question on start | `python3 cli.py -g 42` or `python3 cli.py -g NW-1` |
| `--set` | `SET_ID` | Activate a specific question set on start | `python3 cli.py --set book-p10-25` |
| `--exam` | | Launch directly into 33-question exam simulation | `python3 cli.py --exam` |

### REPL Commands

Once inside the interactive REPL, navigate and answer using quick single-key or short commands:

| Command | Action |
|---|---|
| `<Enter>` / `→` | Next question |
| `←` / `p` | Previous question |
| `a` / `b` / `c` / `d` | Select an answer option (shows immediate green/red feedback in practice) |
| `<number>` or `g <num>` | Jump to question by number (e.g. `42`, `150`, or `NW-3`) |
| `s <CODE>` | Switch active Bundesland (e.g. `s BY`, `s BE`, `s SN`) |
| `set` | List all available question sets (textbook chapters & themes) |
| `set <id\|num>` | Activate a question set (e.g. `set 1` or `set book-p10-25`) |
| `set all` | Return to full catalog (all 310 questions) |
| `exam` | Start official 33-question simulation exam with 60-min timer and grading |
| `lands` or `list` | Display table of all 16 Bundesländer with coats of arms |
| `r` | Reset selected answer for current question |
| `?` or `help` | Show command reference |
| `q` or `exit` | Quit the application |

> **iTerm2 Graphics Support**:
> In iTerm2, official coats of arms and question illustrations render inline using the native iTerm2 image protocol. On other terminals, the CLI gracefully falls back to clean, colorized ANSI panels.

---

## Generating / Updating Question Sets (`parse_pdf_sets.py`)

The `parse_pdf_sets.py` script extracts question sets from the **Hueber *Mein Leben in Deutschland – Orientierungskurs* PDF** (not included in this repo — you need your own purchased copy) and converts them into the `sets.json` format.

### Requirements

```bash
pip install pymupdf
```

### Usage

```bash
# Preview generated sets as JSON (stdout)
python3 parse_pdf_sets.py

# Merge new sets into sets.json (skips IDs already present)
python3 parse_pdf_sets.py --merge

# Only Lernseite summary sets (one per chapter)
python3 parse_pdf_sets.py --lernseite-only

# Only per-content-page sets
python3 parse_pdf_sets.py --content-only

# Use a different PDF path
python3 parse_pdf_sets.py --pdf /path/to/orientierungskurs.pdf
```

The PDF must be named `Mein_Leben_in_Deutschland_Orientierungskurs.pdf` in the repo root, or passed via `--pdf`.

### How it works

Two extraction passes:

1. **Lernseite pages** — each chapter summary page contains a `Prüfungsaufgaben` block listing all relevant question numbers for that module. One set per Lernseite.
2. **Content pages** — question numbers appear as left-margin sidebar annotations (printed at `x < 45 pt` from the page edge). Extracted spatially — no brittle regex on prose text. One set per book page.

After extraction, `--merge` adds only sets whose `id` is not already present in `sets.json`, so hand-crafted entries are never overwritten.

---

## Web Application (`src/` / `index.html`)

A modern web application built with React, Vite, Tailwind CSS, and Lucide icons.

### Development & Running Locally

```bash
npm install
npm run dev
```

Build for static hosting (e.g., GitHub Pages or static web servers):
```bash
npm run build
```
The output is generated in `dist/` with all assets, questions, and sets ready to serve.

### Key Features
- **Header State Coat & Selector**: Modal to select from all 16 federal states with coats of arms.
- **Question Sets (Fragensets)**: Group questions by textbook pages or topic modules.
- **Navigator Bottom Sheet**: Quick jump by number or interactive 310-question grid.
- **Exam Simulation (Prüfung)**: 33 randomized questions with timer, early submission, and detailed results breakdown.
- **Dark Mode**: Supports light, dark, and system themes.
- **Keyboard Navigation**: Arrow keys (`←` / `→`) and numbers `1`–`4` for fast practice.

---

## Repository Structure

```
├── Assets/
│   ├── cache/          # Pre-cached question illustrations (42 images)
│   └── coats/          # PNG coats of arms for all 16 Bundesländer
├── cli.py              # Interactive Python terminal REPL & exam simulator
├── parse_pdf_sets.py   # PDF parser: extracts question sets → sets.json
├── index.html          # Web application HTML entry point
├── package.json        # Node.js project & Vite build scripts
├── questions.json      # Official question database (general + 16 states)
├── sets.json           # Curated question sets (textbook pages & topics)
├── src/                # Modern React web app source code
├── LICENSE             # Software and content license information
└── README.md           # Documentation
```

---

## Federal State Codes

| Code | State (*Bundesland*) | Code | State (*Bundesland*) |
|---|---|---|---|
| `BW` | Baden-Württemberg | `NI` | Niedersachsen |
| `BY` | Bayern | `NW` | Nordrhein-Westfalen |
| `BE` | Berlin | `RP` | Rheinland-Pfalz |
| `BB` | Brandenburg | `SL` | Saarland |
| `HB` | Bremen | `SN` | Sachsen |
| `HH` | Hamburg | `ST` | Sachsen-Anhalt |
| `HE` | Hessen | `SH` | Schleswig-Holstein |
| `MV` | Mecklenburg-Vorpommern | `TH` | Thüringen |

---

## Legal & Licensing Information

### Software
The source code of this simulator (CLI and web application) is licensed under the **[MIT License](LICENSE)**.

### Questions & Official Test Content
- **Origin**: *Bundesamt für Migration und Flüchtlinge* (BAMF), Federal Republic of Germany.
- **Copyright Status**: Under **§ 5 Abs. 1 of the German Copyright Act** (*Urheberrechtsgesetz - UrhG*), official works (*amtliche Werke*) such as laws, decrees, and official examination questionnaires published by federal agencies are in the **Public Domain** (*gemeinfrei*).
- **Official Source**: [BAMF Online-Testcenter](https://oet.bamf.de/ords/oetws/f?p=943:1).

### State Coats of Arms (*Landeswappen*)
- **Status**: Official state symbols and coats of arms are official works under **§ 5 Abs. 1 UrhG** and free of copyright.
- **Notice**: Official emblems are protected by administrative law (such as **§ 124 OWiG** in Germany) against misuse or deceptive representation of government authority. Their use in this project is strictly for civic education, identification, and test preparation.
