# Thematic and Textbook Question Sets (`data/sets/`)

This directory contains configurations for grouped question sets used across the web application and CLI.

## Structure of `sets.json`

`sets.json` is an array of `QuestionSet` objects:

```json
[
  {
    "id": "book-p10-25",
    "title": "Kapitel 1: Politik in der Demokratie (S. 10–25)",
    "description": "Grundgesetz, Verfassungsorgane und Wahlen",
    "category": "book",
    "questions": ["1", "2", "3", "4", "5", "10", "15"]
  }
]
```

### Field Specification

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique set identifier (e.g. `book-p14`, `topic-politik`, `state-regional-10`) |
| `title` | string | Display title shown in the web navigation and CLI |
| `description` | string | Brief description of topics, book pages, or competencies covered |
| `category` | string | Group category: `"book"` (textbook pages), `"topic"` (thematic module), `"custom"`, or `"review"` |
| `questions` | string[] | Array of question numbers (preserves book appearance order by default) |

## Set Categories

1. **Book Sets (`category: "book"`)** — Groups questions matching specific pages of the textbook *«Mein Leben in Deutschland – Der Orientierungskurs»*.
2. **Topic Sets (`category: "topic"`)** — Broad thematic modules:
   - *Politik in der Demokratie*
   - *Geschichte und Verantwortung*
   - *Mensch und Gesellschaft*
3. **Regional (`state-regional-10`)** — 10 state-specific questions for the currently selected Bundesland.

## Generating and Updating Sets

To extract sidebar question numbers from a textbook PDF into `sets.json`:
```bash
python3 tools/parse_pdf_sets.py --merge
```
See [tools/README.md](../../tools/README.md) for further usage flags.
