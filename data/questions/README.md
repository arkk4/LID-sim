# Test Questions Database (`data/questions/`)

This directory houses the primary question database for the "Leben in Deutschland" (LiD) test and "Einbürgerungstest" administered by BAMF.

## Files

- `questions.json` — Canonical question database (300 nationwide general questions + 160 regional questions across all 16 federal states).
- `sync_report.txt` — Audit log of text and answer ordering synchronizations with official BAMF PDFs.

## Structure of `questions.json`

The JSON file contains two main sections:

```json
{
  "general": [
    {
      "num": "1",
      "question": "In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil...",
      "a": "hier Religionsfreiheit gilt.",
      "b": "die Menschen Steuern zahlen.",
      "c": "die Menschen das Wahlrecht haben.",
      "d": "hier Meinungsfreiheit gilt.",
      "solution": "d"
    }
  ],
  "states": {
    "NW": [
      {
        "num": "NW-1",
        "question": "Welches Wappen gehört zum Land Nordrhein-Westfalen?",
        "a": "...",
        "b": "...",
        "c": "...",
        "d": "...",
        "solution": "a",
        "image": "assets/coats/NW.png"
      }
    ]
  }
}
```

### Field Specification

| Field | Type | Required | Description |
|---|---|---|---|
| `num` | string | Yes | Question number (`"1"`..`"300"` for federal, `"NW-1"`..`"NW-10"` for state questions) |
| `question` | string | Yes | German question text |
| `a`, `b`, `c`, `d` | string | Yes | Multiple-choice options |
| `solution` | string | Yes | Correct choice key (`"a"`, `"b"`, `"c"`, or `"d"`) |
| `image` | string | No | Optional reference to a local asset or URL for map/coat of arms (omitted if no image exists) |
| `translationUk` | object | No | Optional Ukrainian translations for civic study |

> [!NOTE]
> Deprecated technical fields `id` and `category` as well as placeholder values (`image: "-"`) have been removed for clean schema consistency.

## Synchronizing with BAMF Catalog

To synchronize question texts and answer keys against the official BAMF PDF:
```bash
python3 tools/sync_from_pdf.py --apply --report
```
The official PDF must be present in `materials/` (see [materials/README.md](../../materials/README.md)).
