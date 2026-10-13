# Assets — Медіа-ресурси LID-sim

Ця тека містить графічні ресурси для веб-додатка та CLI-інтерфейсу.

## Структура

```
assets/
├── coats/          # Офіційні герби 16 федеральних земель Німеччини
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
└── cache/          # Локально закешовані ілюстрації до питань тесту
```

## Примітки

- **`coats/`** — високоякісні прозорі PNG файли гербів. Використовуються як у веб-інтерфейсі (вибір землі, бейджі), так і в терміналі через iTerm2 протокол вбудованих зображень.
- **`cache/`** — містить локальні копії карт та діаграм до запитань (наприклад, контурні карти ФРН до питань 56–99, 148, 160, 212 тощо). Тека внесена до `.gitignore` для уникнення надлишкового версіонування тимчасових медіа.
