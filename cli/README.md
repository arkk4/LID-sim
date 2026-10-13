# LID-sim CLI — Terminal Quiz & Exam Simulator (`cli/`)

A feature-rich command-line trainer for the German naturalization test (**"Leben in Deutschland"** / **"Einbürgerungstest"**).

## Highlights

- **Interactive REPL Interface**: Colorized question presentation and multiple-choice interaction using `rich`.
- **iTerm2 Inline Graphics**: Automatic display of federal state coats of arms and application logo.
- **Official Exam Simulation**: 33 randomized questions (30 general + 3 state), 60-minute countdown, and scoring evaluation (≥15 points for integration course, ≥17 for naturalization).
- **Question Sets**: Practice specific textbook pages or thematic modules.
- **Flexible Ordering**: Toggle between textbook page order and ascending numerical order.

## Installation

```bash
pip install -r cli/requirements.txt
```

## Running the CLI

```bash
# Standard launch (default state: Nordrhein-Westfalen)
python3 cli/lid-quiz.py

# Select a different Bundesland
python3 cli/lid-quiz.py -s BY     # Bayern
python3 cli/lid-quiz.py -s BE     # Berlin

# Jump directly to a question number
python3 cli/lid-quiz.py -g 42

# Start with a specific question set active
python3 cli/lid-quiz.py --set book-p14

# Sort questions within a set numerically instead of textbook page order
python3 cli/lid-quiz.py --set book-p14 --sort

# Launch directly into the 33-question exam simulation mode
python3 cli/lid-quiz.py --exam -s BY
```

## Interactive REPL Commands

| Command | Action |
|---|---|
| `<Enter>` / `→` | Next question |
| `p` / `←` | Previous question |
| `a` / `b` / `c` / `d` | Select answer choice |
| `<number>` / `g <num>` | Jump to question number (e.g. `142` or `BY-5`) |
| `s <CODE>` | Switch active federal state (e.g. `s BY`, `s HH`) |
| `set` | List all available question sets |
| `set <page\|id>` | Switch to a set (e.g. `set 14` or `set book-p14`) |
| `set all` | Reset set filter (show all questions) |
| `sort` | Toggle question order in set (numerical ↔ book order) |
| `exam` | Start official 33-question exam simulation |
| `r` | Reset selected answer for current question |
| `lands` | Display table of all 16 federal states with coats of arms |
| `?` / `help` | Show command reference |
| `q` / `exit` | Quit simulator |
