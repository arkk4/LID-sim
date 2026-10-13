# Тематичні та підручникові сети питань (`sets.json`)

У цій теці зберігаються конфігурації наборів (сетів) питань тесту «Leben in Deutschland».

## Структура `sets.json`

`sets.json` — це масив об'єктів `QuestionSet`:

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

### Специфікація полів

| Поле | Тип | Опис |
|---|---|---|
| `id` | string | Унікальний ідентифікатор сету (наприклад, `book-p14`, `topic-politik`, `state-regional-10`) |
| `title` | string | Назва сету, що відображається в інтерфейсі та CLI |
| `description` | string | Короткий опис змісту та охоплених сторінок або тем |
| `category` | string | Тип сету: `"book"` (сторінки підручника), `"topic"` (тематичний), `"custom"` або `"review"` |
| `questions` | string[] | Масив номерів питань (порядок за замовчуванням відповідає порядку в підручнику) |

## Категорії сетів

1. **Book Sets (`category: "book"`)** — питання, розбиті за сторінками підручника *«Mein Leben in Deutschland – Der Orientierungskurs»*.
2. **Topic Sets (`category: "topic"`)** — тематичні блоки:
   - *Politik in der Demokratie*
   - *Geschichte und Verantwortung*
   - *Mensch und Gesellschaft*
3. **Regional (`state-regional-10`)** — 10 спеціальних земельних питань обраної федеральної землі.

## Генерація та оновлення сетів з підручника

Для вилучення маргінальних номерів питань з PDF підручника використовується тул:
```bash
python3 tools/parse_pdf_sets.py --merge
```
Детальніше дивіться у [tools/README.md](../../tools/README.md).
