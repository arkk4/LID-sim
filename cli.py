#!/usr/bin/env python3
"""
LID-sim CLI — Leben in Deutschland Quiz REPL & Prüfungssimulation

Commands:
  <Enter> / →      next question
  ← / p            previous question
  a / b / c / d    select answer (auto-resets on navigation in practice mode)
  <number>         jump to question by number  (e.g. 42 or NW-3)
  g <num>          same as above
  s <CODE>         switch Bundesland  (e.g. s BY, s NW)
  set [<id>]       switch or list question sets (e.g. set book-p10-25 or set 1)
  set all          show all questions (reset set filter)
  exam             start official 33-question simulation (30 general + 3 regional)
  r                reset current answer
  lands            list all Bundesländer (with coats of arms in iTerm2)
  ? / help         this help
  q / exit         quit
"""

import json, os, sys, base64, readline, re, shutil, hashlib, random, time

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
    from rich.table import Table
    from rich import box
except ImportError:
    print("pip install rich"); sys.exit(1)

SCRIPT_DIR     = os.path.dirname(os.path.abspath(__file__))
QUESTIONS_FILE = os.path.join(SCRIPT_DIR, "questions.json")
SETS_FILE      = os.path.join(SCRIPT_DIR, "sets.json")
COATS_DIR      = os.path.join(SCRIPT_DIR, "Assets", "coats")
CACHE_DIR      = os.path.join(SCRIPT_DIR, "Assets", "cache")

BUNDESLAENDER = [
    ("BW","Baden-Württemberg"), ("BY","Bayern"),       ("BE","Berlin"),
    ("BB","Brandenburg"),       ("HB","Bremen"),        ("HH","Hamburg"),
    ("HE","Hessen"),            ("MV","Meckl.-Vorpommern"), ("NI","Niedersachsen"),
    ("NW","Nordrhein-Westfalen"),("RP","Rheinland-Pfalz"),  ("SL","Saarland"),
    ("SN","Sachsen"),           ("ST","Sachsen-Anhalt"), ("SH","Schleswig-Holstein"),
    ("TH","Thüringen"),
]
STATE_NAMES   = {c: n for c, n in BUNDESLAENDER}
OPTION_COLORS = {"a":"bright_blue","b":"bright_magenta","c":"bright_cyan","d":"bright_yellow"}

console = Console(highlight=False)


# ── Terminal helpers ──────────────────────────────────────────────────────────

def term_cols() -> int:
    return shutil.get_terminal_size((80, 24)).columns

def is_iterm2() -> bool:
    return ("iTerm" in os.environ.get("TERM_PROGRAM","") or
            "iTerm" in os.environ.get("LC_TERMINAL",""))

def _b64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")

def _iterm2(b64: str, name: str, w, h) -> str:
    """Build iTerm2 inline-image escape. w/h: int = char cells, str ending 'px' = pixels."""
    nb = base64.b64encode(name.encode()).decode()
    return f"\033]1337;File=name={nb};width={w};height={h};preserveAspectRatio=1;inline=1:{b64}\a"


# ── Header ────────────────────────────────────────────────────────────────────

def render_header(state: str, num_str: str, set_title: str = None, exam_info: str = None) -> None:
    """
    Renders top header with coat of arms and state / set / exam badge.
    """
    title = "Leben in Deutschland"
    if exam_info:
        label = f"  {title}   {num_str}   [{state}]  [EXAM: {exam_info}]"
    elif set_title:
        label = f"  {title}   {num_str}   [{state}]  [Set: {set_title}]"
    else:
        label = f"  {title}   {num_str}   [{state}]"

    png = os.path.join(COATS_DIR, f"{state}.png")
    if is_iterm2() and os.path.exists(png):
        b64   = _b64(png)
        img_w = 3   # character cells wide
        img_h = 2   # character cells tall
        sys.stdout.write(_iterm2(b64, state, img_w, img_h))
        sys.stdout.write("\033[1A")
        cols = term_cols()
        pad  = max(0, cols - img_w - len(label) - 1)
        sys.stdout.write(f"\033[1m\033[93m{label}{' ' * pad}\033[0m")
        sys.stdout.write("\n\n")
        sys.stdout.flush()
    else:
        cols = term_cols()
        pad  = max(0, cols - len(label) - 1)
        sys.stdout.write(f"\033[1m\033[93m{label}{' ' * pad}\033[0m\n")
        sys.stdout.flush()


# ── Question image (cached URL) ───────────────────────────────────────────────

def show_question_image(url: str, url_map: dict) -> None:
    if not url or url == "-":
        return
    if not is_iterm2():
        console.print(f"  [dim][image: {url[:70]}][/dim]")
        return
    local = url_map.get(url)
    if not local or not os.path.exists(local):
        console.print(f"  [dim][image not cached][/dim]")
        return

    size = shutil.get_terminal_size((80, 24))
    cols, lines = size.columns, size.lines

    max_w = max(40, min(cols - 4, int(cols * 0.85)))
    max_h = max(8, min(int(lines * 0.48), max(8, lines - 14)))

    b64 = _b64(local)
    sys.stdout.write(_iterm2(b64, os.path.basename(local), max_w, max_h) + "\n")
    sys.stdout.flush()


# ── Lands ─────────────────────────────────────────────────────────────────────

def show_lands(current_state: str) -> None:
    console.print()
    if is_iterm2():
        sys.stdout.write("\033[1m\033[34m  Bundesländer\033[0m\n\n")
        sys.stdout.flush()
        img_w, img_h = 4, 2
        for code, name in BUNDESLAENDER:
            png    = os.path.join(COATS_DIR, f"{code}.png")
            active = (code == current_state)
            if os.path.exists(png):
                b64 = _b64(png)
                sys.stdout.write(_iterm2(b64, code, img_w, img_h))
                sys.stdout.write("\033[1A")
                if active:
                    sys.stdout.write(f"  \033[1m\033[32m{code}  {name} ◀\033[0m")
                else:
                    sys.stdout.write(f"  \033[1m\033[36m{code}\033[0m  {name}")
                sys.stdout.write("\n\n")
            else:
                if active:
                    sys.stdout.write(f"  \033[1m\033[32m{code}  {name} ◀\033[0m\n\n")
                else:
                    sys.stdout.write(f"  \033[1m\033[36m{code}\033[0m  {name}\n\n")
            sys.stdout.flush()
        print()
    else:
        table = Table(box=box.SIMPLE, show_header=True, header_style="bold blue")
        table.add_column("Code", style="bold cyan", width=4)
        table.add_column("State")
        for code, name in BUNDESLAENDER:
            if code == current_state:
                table.add_row(Text(code, style="bold green"), Text(f"{name} ◀", style="bold green"))
            else:
                table.add_row(code, name)
        console.print(Panel(table, title="[bold]Bundesländer[/bold]", border_style="blue"))


# ── Sets List ─────────────────────────────────────────────────────────────────

def show_sets(sets: list, current_set_id: str = None) -> None:
    table = Table(box=box.SIMPLE, show_header=True, header_style="bold blue")
    table.add_column("#", style="bold dim", width=3)
    table.add_column("ID", style="bold cyan", width=18)
    table.add_column("Titel / Thema", style="white")
    table.add_column("Fragen", style="dim", justify="right", width=8)

    # All questions entry
    mark = " ◀" if current_set_id is None else ""
    table.add_row("0", "all", f"Alle Fragen (Gesamtkatalog){mark}", "310")

    for i, s in enumerate(sets, 1):
        sid = s.get("id", f"set-{i}")
        stitle = s.get("title", f"Set {i}")
        count = str(len(s.get("questions", [])))
        if current_set_id == sid:
            stitle = f"[bold green]{stitle} ◀[/bold green]"
            sid_style = "bold green"
        else:
            sid_style = "bold cyan"
        table.add_row(str(i), Text(sid, style=sid_style), stitle, count)

    console.print(Panel(table, title="[bold]Verfügbare Fragensets (Themen & Lehrbuchseiten)[/bold]", border_style="blue"))
    console.print("[dim]Aktivieren mit: 'set <id>' oder 'set <#>' (z. B. 'set 1' oder 'set topic-politics')[/dim]\n")


# ── Question renderer ─────────────────────────────────────────────────────────

def render_question(state: str, q: dict, index: int, total: int,
                    answer, url_map: dict, set_title: str = None, exam_info: str = None,
                    is_exam_review: bool = False) -> None:
    console.clear()

    num        = q.get("num", "?")
    is_regional = "-" in str(num)
    if exam_info:
        num_str = f"Frage {index+1}/{total} ({num})"
    elif is_regional:
        num_str = f"{num}  {index+1}/{total}"
    else:
        num_str = f"Q {num} / {total}"

    render_header(state, num_str, set_title=set_title, exam_info=exam_info)

    img_raw = str(q.get("image", "") or "").strip()
    if img_raw and img_raw != "-":
        if img_raw.startswith("http"):
            show_question_image(img_raw, url_map)

    console.print()
    console.print(Panel(q.get("question", ""), style="bold white", padding=(1, 2)))
    console.print()

    solution = q.get("solution", "").lower().strip()
    for letter in ("a", "b", "c", "d"):
        text = q.get(letter, "")
        if not text:
            continue
        if answer is not None or is_exam_review:
            if letter == solution:
                style, prefix = "bold green", "✓"
            elif letter == answer:
                style, prefix = "bold red",   "✗"
            else:
                style, prefix = "dim",        " "
        else:
            style, prefix = OPTION_COLORS.get(letter, "white"), " "

        console.print(Text.assemble(
            Text(f"  {prefix} [{letter.upper()}] ", style=style),
            Text(text, style=style if (answer or is_exam_review) else "white"),
        ))

    console.print()


def show_help(is_exam: bool = False) -> None:
    table = Table(box=box.SIMPLE, show_header=True, header_style="bold blue")
    table.add_column("Command", style="bold cyan", no_wrap=True)
    table.add_column("Action")
    if not is_exam:
        rows = [
            ("<Enter> / →",    "Next question"),
            ("← / p",          "Previous question"),
            ("a / b / c / d",  "Select answer (auto-resets on navigation)"),
            ("<number>",       "Jump to question (e.g. 42 or NW-3)"),
            ("g <num>",        "Same: jump to question"),
            ("s <CODE>",       "Switch Bundesland (e.g. s BY, s NW)"),
            ("set",            "List all question sets (thematic / textbook pages)"),
            ("set <id|num>",   "Switch to question set (e.g. 'set 1', 'set book-p10-25')"),
            ("set all",        "Reset to full catalog"),
            ("exam",           "Start official 33-question simulation exam"),
            ("r",              "Reset current answer"),
            ("lands",          "List all Bundesländer"),
            ("? / help",       "This help"),
            ("q / exit",       "Quit"),
        ]
    else:
        rows = [
            ("<Enter> / →",    "Next exam question"),
            ("← / p",          "Previous exam question"),
            ("a / b / c / d",  "Answer / change answer for current exam question"),
            ("<number>",       "Jump to exam question 1..33"),
            ("finish",         "Finish and grade the exam"),
            ("abort",          "Discard exam and return to practice"),
            ("? / help",       "This help"),
            ("q / exit",       "Quit CLI"),
        ]
    for cmd, desc in rows:
        table.add_row(cmd, desc)
    console.print(Panel(table, title="[bold]Help[/bold]", border_style="blue"))


# ── Image cache ───────────────────────────────────────────────────────────────

def _cache_path(url: str) -> str:
    fn   = re.sub(r"[^a-zA-Z0-9._-]", "_", url.split("/")[-1].split("?")[0]) or "img"
    h    = hashlib.md5(url.encode()).hexdigest()[:8]
    base, ext = os.path.splitext(fn)
    return os.path.join(CACHE_DIR, f"{base}_{h}{ext or '.png'}")


def _collect_urls(raw: dict) -> set:
    urls  = set()
    all_q = list(raw.get("general", []))
    for qs in raw.get("states", {}).values():
        all_q.extend(qs)
    for q in all_q:
        img = str(q.get("image", "") or "").strip()
        if img and img != "-" and img.startswith("http"):
            urls.add(img)
    return urls


def download_images(raw: dict) -> dict:
    """Pre-download all external images. Returns {url: local_path}."""
    import urllib.request
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

    os.makedirs(CACHE_DIR, exist_ok=True)
    urls    = _collect_urls(raw)
    url_map = {}
    missing = []

    for url in urls:
        p = _cache_path(url)
        if os.path.exists(p):
            url_map[url] = p
        else:
            missing.append(url)

    if missing:
        with Progress(
            SpinnerColumn(),
            TextColumn("[blue]{task.description}"),
            BarColumn(), TaskProgressColumn(),
            console=console,
        ) as prog:
            task = prog.add_task(f"Caching {len(missing)} image(s)…", total=len(missing))
            for url in missing:
                p = _cache_path(url)
                try:
                    urllib.request.urlretrieve(url, p)
                    url_map[url] = p
                except Exception:
                    pass
                prog.advance(task)

    for url in urls:
        if url not in url_map:
            p = _cache_path(url)
            if os.path.exists(p):
                url_map[url] = p

    return url_map


# ── Data helpers ──────────────────────────────────────────────────────────────

def load_data() -> dict:
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_sets() -> list:
    if os.path.exists(SETS_FILE):
        try:
            with open(SETS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception:
            pass
    return []


def build_question_list(raw: dict, state: str) -> list:
    general  = list(raw.get("general", []))
    state_qs = []
    code     = state.upper()

    if isinstance(raw.get("states"), dict):
        key = next((k for k in raw["states"] if k.upper() == code), None)
        if key:
            state_qs = list(raw["states"][key])
    if not state_qs:
        key = next((k for k in raw if isinstance(raw.get(k), list) and k.upper() == code), None)
        if key:
            state_qs = list(raw[key])

    general.sort(key=lambda q: int(q["num"]) if re.match(r"^\d+$", str(q.get("num",""))) else 0)
    state_qs.sort(key=lambda q: int(str(q.get("num","0-0")).split("-")[-1]))
    return general + state_qs


def filter_by_set(all_questions: list, q_set: dict) -> list:
    if not q_set:
        return all_questions
    nums = [str(n).strip() for n in q_set.get("questions", [])]
    clean = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
    clean_nums = set(clean(n) for n in nums)

    # Special handling for regional set: only match the state questions
    if q_set.get("id") == "state-regional-10":
        return [q for q in all_questions if "-" in str(q.get("num", ""))]

    result = []
    for q in all_questions:
        q_num = str(q.get("num", "")).strip()
        # General questions match clean numbers
        if "-" not in q_num and clean(q_num) in clean_nums:
            result.append(q)
        elif "-" in q_num and clean(q_num) in clean_nums:
            result.append(q)
    return result if result else all_questions


def find_q(questions: list, target: str) -> int:
    clean = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
    idx = next(
        (i for i, q in enumerate(questions) if clean(str(q.get("num",""))) == clean(target)),
        -1,
    )
    if idx == -1 and re.match(r"^\d+$", target):
        n = int(target)
        if 1 <= n <= len(questions):
            idx = n - 1
    return idx


# ── Exam Simulation ───────────────────────────────────────────────────────────

def run_exam_simulation(raw: dict, url_map: dict, state: str) -> None:
    """
    Official 33-question simulation (30 general + 3 regional).
    60-minute duration, pass with 17 (citizenship) or 15 (integration).
    """
    general = list(raw.get("general", []))
    state_code = state.upper()
    state_pool = raw.get("states", {}).get(state_code, [])

    if len(general) < 30 or len(state_pool) < 3:
        console.print("[red]Not enough questions to start exam.[/red]")
        return

    exam_questions = random.sample(general, 30) + random.sample(state_pool, 3)
    user_answers = {}  # {idx: 'a'|'b'|'c'|'d'}
    start_time = time.time()
    total_time = 60 * 60  # 60 minutes
    idx = 0

    console.clear()
    console.print(Panel(
        f"[bold green]Offizielle Prüfungssimulation gestartet![/bold green]\n\n"
        f"• [bold]33 Fragen[/bold] (30 Bund + 3 Land {state})\n"
        f"• [bold]Zeit:[/bold] 60 Minuten\n"
        f"• [bold]Bestehensgrenze:[/bold] ≥ 15 Punkte (Integrationskurs), ≥ 17 Punkte (Einbürgerung)\n\n"
        f"Navigiere mit [bold]<Enter>[/bold]/[bold]p[/bold], wähle Antworten mit [bold]a/b/c/d[/bold].\n"
        f"Tippe [bold]finish[/bold] zum Abgeben oder [bold]abort[/bold] zum Abbrechen.",
        title="[bold yellow]LID Prüfung[/bold yellow]",
        border_style="green"
    ))
    input("\n  Drücke <Enter> zum Beginnen…")

    while True:
        elapsed = time.time() - start_time
        remaining = max(0, int(total_time - elapsed))
        mins, secs = divmod(remaining, 60)
        time_str = f"{mins:02d}:{secs:02d}"

        if remaining <= 0:
            console.print("\n[bold red]Die Prüfungszeit ist abgelaufen![/bold red]")
            break

        ans_count = len(user_answers)
        exam_info = f"{ans_count}/33 beantwortet | Zeit: {time_str}"
        q = exam_questions[idx]
        cur_ans = user_answers.get(idx)

        render_question(state, q, idx, 33, cur_ans, url_map, exam_info=exam_info)

        prompt = f"\n  [EXAM {state} {idx+1}/33 ({time_str})] > "
        cmd = prompt_line(state, idx, 33, custom_prompt=prompt)
        cmd_lower = cmd.lower()

        if cmd_lower in ("q", "exit", "abort"):
            console.print("[yellow]Prüfung abgebrochen.[/yellow]")
            return
        elif cmd_lower in ("finish", "submit", "done"):
            break
        elif cmd_lower == "":
            if idx < 32:
                idx += 1
        elif cmd_lower in ("p", "prev", "back"):
            if idx > 0:
                idx -= 1
        elif cmd_lower in ("a", "b", "c", "d"):
            user_answers[idx] = cmd_lower
            if idx < 32:
                idx += 1
        elif cmd_lower in ("?", "help"):
            show_help(is_exam=True)
            input("\nDrücke <Enter> zum Fortsetzen…")
        elif re.match(r"^\d+$", cmd_lower):
            n = int(cmd_lower)
            if 1 <= n <= 33:
                idx = n - 1

    # ── Evaluation & Results ──────────────────────────────────────────────────
    console.clear()
    correct = 0
    gen_correct = 0
    state_correct = 0
    wrong_questions = []

    for i, q in enumerate(exam_questions):
        sol = q.get("solution", "").lower().strip()
        ans = user_answers.get(i)
        is_reg = "-" in str(q.get("num", ""))
        if ans == sol:
            correct += 1
            if is_reg:
                state_correct += 1
            else:
                gen_correct += 1
        else:
            wrong_questions.append((i, q, ans, sol))

    passed_einbuergerung = correct >= 17
    passed_integration = correct >= 15

    score_text = Text()
    score_text.append(f"Ergebnis: {correct} von 33 Punkten ({int(correct/33*100)}%)\n", style="bold")
    score_text.append(f"• Bundesfragen: {gen_correct}/30\n")
    score_text.append(f"• Landesfragen ({state}): {state_correct}/3\n\n")

    if passed_einbuergerung:
        status = "[bold green]BESTANDEN! (Einbürgerungsvoraussetzung erfüllt 🎉)[/bold green]"
    elif passed_integration:
        status = "[bold yellow]BESTANDEN! (Integrationskurs-Niveau, ≥17 für Einbürgerung benötigt)[/bold yellow]"
    else:
        status = "[bold red]NICHT BESTANDEN (Mindestens 15 Punkte erforderlich)[/bold red]"

    score_panel = Panel(
        Text.assemble(score_text, Text.from_markup(status)),
        title="[bold]Prüfungsergebnis[/bold]",
        border_style="green" if passed_einbuergerung else "red"
    )
    console.print(score_panel)

    if wrong_questions:
        console.print(f"\n[bold red]Falsch beantwortete oder ausgelassene Fragen ({len(wrong_questions)}):[/bold red]\n")
        table = Table(box=box.SIMPLE)
        table.add_column("#", width=3)
        table.add_column("Frage", style="white")
        table.add_column("Ihre Wahl", style="red")
        table.add_column("Richtig", style="green")

        for i, q, ans, sol in wrong_questions:
            q_text = q.get("question", "")[:60] + "…"
            table.add_row(str(i+1), q_text, (ans or "—").upper(), sol.upper())
        console.print(table)

    input("\nDrücke <Enter> um zum Übungsmodus zurückzukehren…")


# ── REPL ──────────────────────────────────────────────────────────────────────

_DIRECT_NAV = re.compile(r"^(\d+|[a-z]{2}-\d+)$")


def prompt_line(state: str, idx: int, total: int, custom_prompt: str = None) -> str:
    prompt = custom_prompt if custom_prompt else f"\n  [{state}] [{idx+1}/{total}] > "
    if not sys.stdin.isatty():
        try:
            return input(prompt).strip()
        except (EOFError, KeyboardInterrupt):
            return "q"

    import tty, termios

    sys.stdout.write(prompt)
    sys.stdout.flush()

    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    buffer = []
    cursor_pos = 0

    try:
        tty.setcbreak(fd)
        while True:
            ch = sys.stdin.read(1)
            if not ch:
                return "q"

            # Escape sequence (e.g. arrow keys)
            if ch == "\x1b":
                seq = sys.stdin.read(2)
                if seq in ("[D", "OD"):  # Left arrow
                    if not buffer:
                        sys.stdout.write("\n")
                        sys.stdout.flush()
                        return "p"
                    elif cursor_pos > 0:
                        cursor_pos -= 1
                        sys.stdout.write("\x1b[D")
                        sys.stdout.flush()
                elif seq in ("[C", "OC"):  # Right arrow
                    if not buffer:
                        sys.stdout.write("\n")
                        sys.stdout.flush()
                        return ""
                    elif cursor_pos < len(buffer):
                        cursor_pos += 1
                        sys.stdout.write("\x1b[C")
                        sys.stdout.flush()
                elif seq in ("[A", "OA"):  # Up arrow
                    if not buffer:
                        sys.stdout.write("\n")
                        sys.stdout.flush()
                        return "p"
                elif seq in ("[B", "OB"):  # Down arrow
                    if not buffer:
                        sys.stdout.write("\n")
                        sys.stdout.flush()
                        return ""
                continue

            # Enter
            if ch in ("\r", "\n"):
                sys.stdout.write("\n")
                sys.stdout.flush()
                return "".join(buffer).strip()

            # Backspace
            if ch in ("\x7f", "\x08"):
                if cursor_pos > 0:
                    cursor_pos -= 1
                    del buffer[cursor_pos]
                    tail = "".join(buffer[cursor_pos:]) + " "
                    sys.stdout.write(f"\b{tail}\x1b[{len(tail)}D")
                    sys.stdout.flush()
                continue

            # Ctrl+C or Ctrl+D
            if ch in ("\x03", "\x04"):
                sys.stdout.write("\n")
                sys.stdout.flush()
                return "q"

            # Printable characters
            if ch >= " ":
                buffer.insert(cursor_pos, ch)
                tail = "".join(buffer[cursor_pos:])
                cursor_pos += 1
                sys.stdout.write(f"{tail}\x1b[{len(tail)-1}D" if len(tail) > 1 else ch)
                sys.stdout.flush()

    except Exception:
        return "".join(buffer).strip()
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)


def run_repl(raw: dict, url_map: dict, state: str = "NW", goto=None, initial_set_id=None) -> None:
    available_sets = load_sets()
    active_set     = None
    if initial_set_id:
        active_set = next((s for s in available_sets if s.get("id") == initial_set_id), None)

    all_questions  = build_question_list(raw, state)
    questions      = filter_by_set(all_questions, active_set)
    index          = 0
    current_answer = None

    if goto:
        i2 = find_q(questions, str(goto))
        if i2 != -1:
            index = i2

    set_title = active_set.get("title") if active_set else None
    if questions:
        render_question(state, questions[index], index, len(questions), current_answer, url_map, set_title=set_title)
    else:
        console.print(f"[yellow]No questions for {state}.[/yellow]")

    while True:
        cmd       = prompt_line(state, index, len(questions))
        cmd_lower = cmd.lower()
        refresh   = True

        # ── Quit ──────────────────────────────────────────────────────────────
        if cmd_lower in ("q", "exit", "quit"):
            console.print("[dim]Goodbye! Viel Erfolg![/dim]")
            break

        # ── Next (Enter) ──────────────────────────────────────────────────────
        elif cmd_lower == "":
            if index < len(questions) - 1:
                index += 1
                current_answer = None
            else:
                console.print("[dim]Last question. Use p or q.[/dim]")
                refresh = False

        # ── Previous ──────────────────────────────────────────────────────────
        elif cmd_lower in ("p", "prev", "back"):
            if index > 0:
                index -= 1
                current_answer = None
            else:
                console.print("[dim]First question.[/dim]")
                refresh = False

        # ── Answer ────────────────────────────────────────────────────────────
        elif cmd_lower in ("a", "b", "c", "d"):
            if current_answer is None:
                current_answer = cmd_lower
            else:
                console.print("[dim]Already answered. Type r to reset.[/dim]")
                refresh = False

        # ── Reset answer ──────────────────────────────────────────────────────
        elif cmd_lower == "r":
            current_answer = None

        # ── Question Sets ─────────────────────────────────────────────────────
        elif cmd_lower == "set" or cmd_lower == "sets":
            show_sets(available_sets, active_set.get("id") if active_set else None)
            refresh = False

        elif cmd_lower.startswith("set "):
            target_set = cmd.split(None, 1)[1].strip()
            if target_set.lower() in ("all", "reset", "none", "0"):
                active_set = None
                questions  = all_questions
                index      = 0
                current_answer = None
                set_title  = None
                console.print("[green]Alle Fragen aktiviert (Gesamtkatalog).[/green]")
            else:
                found_set = None
                if re.match(r"^\d+$", target_set):
                    s_idx = int(target_set) - 1
                    if 0 <= s_idx < len(available_sets):
                        found_set = available_sets[s_idx]
                if not found_set:
                    clean = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
                    found_set = next((s for s in available_sets if clean(s.get("id","")) == clean(target_set)), None)

                if found_set:
                    active_set = found_set
                    questions  = filter_by_set(all_questions, active_set)
                    index      = 0
                    current_answer = None
                    set_title  = active_set.get("title")
                    console.print(f"[green]Fragenset aktiviert: {set_title} ({len(questions)} Fragen)[/green]")
                else:
                    console.print(f"[red]Set '{target_set}' nicht gefunden. Tippe 'set' für eine Übersicht.[/red]")
                    refresh = False

        # ── Exam Simulation ───────────────────────────────────────────────────
        elif cmd_lower == "exam":
            run_exam_simulation(raw, url_map, state)
            refresh = True

        # ── Jump: "g <target>" or direct number/id ────────────────────────────
        elif cmd_lower.startswith("g ") or _DIRECT_NAV.match(cmd_lower):
            target = cmd.split(None, 1)[1].strip() if cmd_lower.startswith("g ") else cmd
            i2     = find_q(questions, target)
            if i2 != -1:
                index          = i2
                current_answer = None
            else:
                console.print(f'[red]Question "{target}" not found in active set.[/red]')
                refresh = False

        # ── Switch state ──────────────────────────────────────────────────────
        elif cmd_lower.startswith("s "):
            code = cmd.split(None, 1)[1].strip().upper()
            if code in STATE_NAMES:
                state          = code
                all_questions  = build_question_list(raw, state)
                questions      = filter_by_set(all_questions, active_set)
                index          = 0
                current_answer = None
            else:
                console.print(f"[red]Unknown state: {code}. Available: {', '.join(c for c,_ in BUNDESLAENDER)}[/red]")
                refresh = False

        # ── Lands ─────────────────────────────────────────────────────────────
        elif cmd_lower in ("lands", "list"):
            show_lands(state)
            refresh = False

        # ── Help ──────────────────────────────────────────────────────────────
        elif cmd_lower in ("?", "help"):
            show_help()
            refresh = False

        else:
            console.print(f"[dim]Unknown command: '{cmd}'. Type ? for help.[/dim]")
            refresh = False

        if refresh and questions:
            set_title = active_set.get("title") if active_set else None
            render_question(state, questions[index], index, len(questions), current_answer, url_map, set_title=set_title)
        elif refresh:
            console.print(f"[yellow]No questions for {state}.[/yellow]")


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="LID-sim CLI — Leben in Deutschland Quiz & Prüfungssimulation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("-s", "--state", default="NW", metavar="CODE",
                        help="Bundesland code (e.g. BY). Default: NW")
    parser.add_argument("-g", "--goto",  metavar="N",
                        help="Jump to question N on start")
    parser.add_argument("--set", dest="set_id", metavar="SET_ID",
                        help="Start with a specific question set active (e.g. book-p10-25)")
    parser.add_argument("--exam", action="store_true",
                        help="Start directly in exam simulation mode")
    args  = parser.parse_args()
    state = args.state.upper()

    if state not in STATE_NAMES:
        print(f"Unknown state: {state}")
        print(f"Available: {', '.join(c for c, _ in BUNDESLAENDER)}")
        sys.exit(1)

    console.print("[bold blue]Loading…[/bold blue]")
    try:
        raw = load_data()
    except FileNotFoundError:
        console.print(f"[red]File not found: {QUESTIONS_FILE}[/red]")
        sys.exit(1)

    url_map = download_images(raw)
    readline.parse_and_bind("tab: complete")

    if args.exam:
        run_exam_simulation(raw, url_map, state)
    else:
        run_repl(raw, url_map, state=state, goto=args.goto, initial_set_id=args.set_id)


if __name__ == "__main__":
    main()
