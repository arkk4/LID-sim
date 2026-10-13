# Питання тесту «Leben in Deutschland» (BAMF)

У цій теці зберігається основна база питань тесту «Leben in Deutschland» (LID) та «Einbürgerungstest» Федерального відомства з питань міграції та біженців (BAMF).

## Файли

- `questions.json` — канонічна база питань (300 загальнонаціональних + 160 регіональних по 16 землях).
- `sync_report.txt` — журнал змін при синхронізації з офіційними PDF.

## Структура `questions.json`

JSON складається з двох основних розділів:

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

### Специфікація полів

| Поле | Тип | Обов'язкове | Опис |
|---|---|---|---|
| `num` | string | Так | Номер питання (`"1"`..`"300"` для федеральних, `"NW-1"`..`"NW-10"` для земель) |
| `question` | string | Так | Текст німецького питання |
| `a`, `b`, `c`, `d` | string | Так | Варіанти відповідей |
| `solution` | string | Так | Правильна літера відповіді (`"a"`, `"b"`, `"c"` або `"d"`) |
| `image` | string | Ні | Посилання на локальне зображення або URL карти/герба (відсутнє, якщо зображення немає) |
| `translationUk` | object | Ні | Опціональний український переклад питання та відповідей |

> [!NOTE]
> Застарілі технічні поля `id` та `category` видалено для оптимізації розміру та підтримки єдиного формату.

## Синхронізація з офіційним каталогом BAMF

Оновлення та перевірка питань виконується інструментом:
```bash
python3 tools/sync_from_pdf.py --apply --report
```
Офіційні матеріали PDF завантажуються в теку `materials/`.
