# LID-sim — Leben in Deutschland Quiz Simulator

<p align="center">
  <img src="public/logo.svg" alt="LID-sim Logo" width="128" height="128"><br>
  <img src="public/badge.svg" alt="LID-sim Version Badge">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/python-3.8+-blue.svg" alt="Python 3.8+"></a>
</p>

An offline-first, dual-interface simulator for the German naturalization test (**"Leben in Deutschland"** / **"Einbürgerungstest"**).

Includes the complete official catalog of **300 general questions** plus **10 state-specific questions** for each of the 16 German federal states (*Bundesländer*), verified against official BAMF answer keys.

---

## Features

- **Dual Interfaces**:
  - **Terminal REPL (`cli/lid-quiz.py`)**: Keyboard-driven interactive CLI built with `rich`, featuring question sets, exam simulation, ordering toggle (numerical vs. textbook page order), and iTerm2 inline graphics for coats of arms and question illustrations.
  - **Modern Web Application (`src/` / `index.html`)**: Next-generation React + Vite application with dark mode, question sets (thematic & textbook chapters), quick-jump drawer, exam simulation (33 questions, 60 minutes, scoring breakdown), and responsive design.
- **Unified Semantic Versioning**: Single source of truth (`VERSION` and `version.json`), starting from `1.0.0`.
- **Dynamic Logo & Badge**: Generated via [logogen](https://github.com/arkk4/logogen) through Git pre-push hook.
- **Question Sets (Fragensets)**: Group questions by textbook chapters (*Lehrbuch: Seiten 10–25*) or thematic blocks (*Politik*, *Geschichte*, *Gesellschaft*).
- **Official Exam Simulation (Prüfungssimulation)**: Realistic test mode with 33 randomized questions (30 general + 3 state), 60-minute countdown, passing thresholds (≥15 for integration courses, ≥17 for citizenship), and wrong-answer review.
- **Complete Offline Support**: Pre-cached illustrations (`assets/cache/`) and coats of arms (`assets/coats/`) with automatic fallback to remote mirrors.
- **Verified Official Questions**: Curated and cleaned database (without redundant technical IDs or categories) synchronized with official *Bundesamt für Migration und Flüchtlinge* (BAMF) catalog.
- **State Selection**: Seamlessly switch between all 16 federal states with state-specific question IDs (`NW-1`, `BY-10`, etc.).

---

## Repository Structure

```
LID-sim/
├── VERSION                         ← єдина семантична версія ("1.0.0")
├── version.json                    ← { "version": "1.0.0", "date": "2026-10-13" }
│
├── assets/                         ← статичні медіа-ресурси
│   ├── coats/                      ← PNG гербів 16 федеральних земель (BE.png, BY.png…)
│   ├── cache/                      ← кешовані зображення до питань (у .gitignore)
│   └── README.md
│
├── data/
│   ├── questions/
│   │   ├── questions.json          ← очищена база питань (300 загальних + 160 регіональних)
│   │   └── README.md
│   └── sets/
│       ├── sets.json               ← тематичні та посторінкові сети питань
│       └── README.md
│
├── tools/                          ← утиліти обслуговування (Python)
│   ├── parse_pdf_sets.py           ← вилучення сетів з PDF підручника
│   ├── sync_from_pdf.py            ← синхронізація questions.json з офіційним PDF BAMF
│   ├── requirements.txt            ← pymupdf
│   └── README.md
│
├── materials/                      ← офіційні PDF BAMF та підручники (у .gitignore)
│   └── README.md
│
├── cli/                            ← консольний тренажер
│   ├── lid-quiz.py                 ← інтерактивний CLI REPL
│   ├── requirements.txt            ← rich>=13.0
│   └── README.md
│
├── src/                            ← React/Vite web application
│   ├── App.tsx
│   ├── data/
│   ├── types.ts
│   ├── version.ts                  ← імпортує єдину версію з version.json
│   └── ...
│
├── public/                         ← статичні файли веб-додатку
│   ├── questions.json              ← symlink → ../data/questions/questions.json
│   ├── sets.json                   ← symlink → ../data/sets/sets.json
│   ├── logo.svg                    ← логотип (генерований logogen)
│   └── badge.svg                   ← бейдж версії (генерований logogen)
│
├── .github/
│   ├── hooks/
│   │   └── pre-push                ← шаблон git-хука бампу версії та генерації лого
│   └── workflows/
│       └── deploy.yml              ← GitHub Pages deploy
│
├── Makefile                        ← setup, install-hooks, badge, dev, build
├── package.json                    ← версія 1.0.0, скрипти збірки
├── LICENSE                         ← ліцензія MIT
└── README.md                       ← головна документація
```

---

## Quick Start

### 1. Setup Environment

```bash
# Клонування репозиторію
git clone https://github.com/arkk4/LID-sim.git
cd LID-sim

# Налаштування symlink у public/ та встановлення pre-push хука
make setup
```

### 2. Terminal CLI (`cli/lid-quiz.py`)

Встановлення залежностей:
```bash
pip install -r cli/requirements.txt
```

Запуск тренажера:
```bash
python3 cli/lid-quiz.py -s BY
```

Ключові параметри:
- `-s CODE` — вибір федеральної землі (наприклад `-s NW`, `-s BY`, `-s BE`).
- `-g N` — швидкий старт з питання номер `N`.
- `--set SET_ID` — активація конкретного сету (наприклад `--set book-p14`).
- `--sort` — сортування питань у сеті чисельно (за замовчуванням — порядок підручника).
- `--exam` — прямий запуск офіційної 33-хвилинної симуляції екзамену.

Детальніше у [cli/README.md](cli/README.md).

### 3. Web Application (`src/`)

```bash
# Встановлення npm-пакетів
npm install

# Запуск dev-сервера
npm run dev

# Збірка продакшн версії
npm run build
```

---

## Maintenance & Tools

Усі інструменти парсингу та синхронізації знаходяться у теці `tools/`:

- **Синхронізація питань з PDF BAMF**:
  ```bash
  python3 tools/sync_from_pdf.py --apply --report
  ```
- **Парсинг сетів з підручника**:
  ```bash
  python3 tools/parse_pdf_sets.py --merge
  ```

Детальніше у [tools/README.md](tools/README.md).

---

## Versioning & Git Hooks

У репозиторії налаштовано pre-push хук (`.github/hooks/pre-push`):
- При кожному `git push` у гілку `main` хук запитує нову версію (або залишає поточну).
- Автоматично оновлює `VERSION`, `version.json` та `package.json`.
- Запускає `logogen` для синхронної регенерації `public/logo.svg` та `public/badge.svg`.

Вручну згенерувати бейджі можна через:
```bash
make badge
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
