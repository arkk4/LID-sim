# Assets — Static Media Resources (`assets/`)

This directory contains static graphical media used by both the web app and terminal CLI.

## Structure

```
assets/
├── coats/          # Official coats of arms for all 16 German federal states
│   ├── BB.png      # Brandenburg
│   ├── BE.png      # Berlin
│   ├── BW.png      # Baden-Württemberg
│   ├── BY.png      # Bayern
│   ├── HB.png      # Bremen
│   ├── HE.png      # Hessen
│   ├── HH.png      # Hamburg
│   ├── MV.png      # Mecklenburg-Vorpommern
│   ├── NI.png      # Niedersachsen
│   ├── NW.png      # Nordrhein-Westfalen
│   ├── RP.png      # Rheinland-Pfalz
│   ├── SH.png      # Schleswig-Holstein
│   ├── SL.png      # Saarland
│   ├── SN.png      # Sachsen
│   ├── ST.png      # Sachsen-Anhalt
│   └── TH.png      # Thüringen
│
└── cache/          # Locally cached question illustrations and maps
```

## Details

- **`coats/`** — High-resolution transparent PNG images of state coats of arms. Rendered in the web header and state switcher, as well as in terminal sessions via the iTerm2 inline graphics protocol.
- **`cache/`** — Contains local fallback images for questions featuring maps or diagrams (e.g. outline maps for questions 56–99, 148, 160, 212, etc.). Tracked in `.gitignore` to avoid versioning runtime cache files.
