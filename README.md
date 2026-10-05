# LID-sim — Leben in Deutschland Quiz Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)

An offline-first, dual-interface simulator for the German naturalization test (**"Leben in Deutschland"** / **"Einbürgerungstest"**).

Includes the complete official catalog of **300 general questions** plus **10 state-specific questions** for each of the 16 German federal states (*Bundesländer*), verified against official BAMF answer keys.

---

## Features

- **Dual Interfaces**:
  - **Terminal REPL (`cli.py`)**: Keyboard-driven interactive CLI built with `rich`, featuring iTerm2 inline graphics for coats of arms and question illustrations.
  - **Web Application (`index.html`)**: Sleek, responsive browser app with state switcher modal, quick jump, and real-time answer validation.
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
- Any modern web browser (Chrome, Firefox, Safari, Edge).

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

### REPL Commands

Once inside the interactive REPL, navigate and answer using quick single-key or short commands:

| Command | Action |
|---|---|
| `<Enter>` / `→` | Next question |
| `←` / `p` | Previous question |
| `a` / `b` / `c` / `d` | Select an answer option (shows immediate green/red feedback) |
| `<number>` or `g <num>` | Jump to question by number (e.g. `42`, `150`, or `NW-3`) |
| `s <CODE>` | Switch active Bundesland (e.g. `s BY`, `s BE`, `s SN`) |
| `lands` or `list` | Display table of all 16 Bundesländer with coats of arms |
| `r` | Reset selected answer for current question |
| `?` or `help` | Show command reference |
| `q` or `exit` | Quit the application |

> **iTerm2 Graphics Support**:
> In iTerm2, official coats of arms and question illustrations render inline using the native iTerm2 image protocol. On other terminals, the CLI gracefully falls back to clean, colorized ANSI panels.

---

## Web Application (`index.html`)

The web simulator requires no build step and runs directly in any browser.

### Running Locally

You can open `index.html` directly in your browser:
```bash
open index.html
```

Or serve it with Python's built-in HTTP server:
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000`.

### Key Features
- **Header State Coat**: Displays the official coat of arms of the selected Bundesland. Clicking the coat or state name opens the selection modal.
- **Quick Jump**: Enter any question number or state question code (e.g. `25` or `NW-2`) and press `Enter` or click `Go`.
- **Offline Asset Loading**: Automatically loads illustrations from `Assets/cache/` for zero-latency offline use, with transparent fallback to remote sources if needed.
- **Keyboard Navigation**: Use standard browser navigation or dedicated forward/backward buttons.

---

## Repository Structure

```
├── Assets/
│   ├── cache/          # Pre-cached question illustrations (42 images)
│   └── coats/          # PNG coats of arms for all 16 Bundesländer
├── cli.py              # Interactive Python terminal REPL application
├── index.html          # Standalone responsive web application
├── questions.json      # Official question database (general + 16 states)
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
