#!/usr/bin/env python3
"""
LID-sim CLI — Leben in Deutschland Quiz REPL

Commands:
  <Enter> / →      next question
  ← / p            previous question
  a / b / c / d    select answer (auto-resets on navigation)
  <number>         jump to question by number  (e.g.  42  or  NW-3)
  g <num>          same as above
  s <CODE>         switch Bundesland  (e.g. s BY)
  lands            list all Bundesländer (with coat of arms in iTerm2)
  r                reset current answer
  ? / help         this help
  q / exit         quit
"""

import json, os, sys, base64, readline, re, shutil, hashlib

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

def render_header(state: str, num_str: str) -> None:
    """
    iTerm2: coat (3 cells wide, 2 cells tall) inline-left, title text on same
            top row, second coat row left blank.
    Other:  plain ANSI colour bar.
    """
    title = "Leben in Deutschland"
    label = f"  {title}   {num_str}   [{state}]"

    png = os.path.join(COATS_DIR, f"{state}.png")
    if is_iterm2() and os.path.exists(png):
        b64   = _b64(png)
        img_w = 3   # character cells wide
        img_h = 2   # character cells tall → cursor lands at (row+1, img_w)
        sys.stdout.write(_iterm2(b64, state, img_w, img_h))
        # cursor is now at (row+1, img_w); move up 1 → (row, img_w)
        sys.stdout.write(f"\033[1A")
        # write title in bold yellow on the same row as coat top
        cols = term_cols()
        pad  = max(0, cols - img_w - len(label) - 1)
        sys.stdout.write(f"\033[1m\033[93m{label}{' ' * pad}\033[0m")
        # two newlines: first reaches (row+1, 0) = coat bottom row; second clears it
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

    # Dynamic scaling based on terminal window dimensions:
    # Use character cells instead of low-DPI fixed pixels so images
    # scale sharply on Retina displays and adapt to window resize.
    # Leave room for header, question panel, options, and prompt (~14 lines).
    max_w = max(40, min(cols - 4, int(cols * 0.85)))
    max_h = max(8, min(int(lines * 0.48), max(8, lines - 14)))

    b64 = _b64(local)
    sys.stdout.write(_iterm2(b64, os.path.basename(local), max_w, max_h) + "\n")
    sys.stdout.flush()


# ── Lands ─────────────────────────────────────────────────────────────────────

def show_lands(current_state: str) -> None:
    console.print()
    if is_iterm2():
        sys.stdout.write(f"\033[1m\033[34m  Bundesländer\033[0m\n\n")
        sys.stdout.flush()
        img_w, img_h = 4, 2   # cells
        for code, name in BUNDESLAENDER:
            png    = os.path.join(COATS_DIR, f"{code}.png")
            active = (code == current_state)
            if os.path.exists(png):
                b64 = _b64(png)
                sys.stdout.write(_iterm2(b64, code, img_w, img_h))
                # cursor at (row+1, img_w) → up 1 → (row, img_w)
                sys.stdout.write("\033[1A")
                if active:
                    sys.stdout.write(f"  \033[1m\033[32m{code}  {name} ◀\033[0m")
                else:
                    sys.stdout.write(f"  \033[1m\033[36m{code}\033[0m  {name}")
                # move past image's second row
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


# ── Question renderer ─────────────────────────────────────────────────────────

def render_question(state: str, q: dict, index: int, total: int,
                    answer, url_map: dict) -> None:
    console.clear()

    num        = q.get("num", "?")
    is_regional = "-" in str(num)
    num_str    = f"{num}  {index+1}/{total}" if is_regional else f"Q {num} / {total}"

    render_header(state, num_str)

    # Image for this question (external URL, served from cache)
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
        if answer is not None:
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
            Text(text, style=style if answer else "white"),
        ))

    console.print()


def show_help() -> None:
    table = Table(box=box.SIMPLE, show_header=True, header_style="bold blue")
    table.add_column("Command", style="bold cyan", no_wrap=True)
    table.add_column("Action")
    rows = [
        ("<Enter> / →",    "Next question"),
        ("← / p",          "Previous question"),
        ("a / b / c / d",  "Select answer  (auto-resets on navigation)"),
        ("<number>",       "Jump to question  (e.g.  42  or  NW-3)"),
        ("g <num>",        "Same: jump to question"),
        ("s <CODE>",       "Switch Bundesland  (e.g. s BY, s NW)"),
        ("r",              "Reset current answer"),
        ("lands",          "List all Bundesländer"),
        ("? / help",       "This help"),
        ("q / exit",       "Quit"),
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

    # pick up anything already cached that wasn't in url_map
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


# ── REPL ──────────────────────────────────────────────────────────────────────

# Regex for direct-number navigation (bare "42" or "NW-3")
_DIRECT_NAV = re.compile(r"^(\d+|[a-z]{2}-\d+)$")


def prompt_line(state: str, idx: int, total: int) -> str:
    prompt = f"\n  [{state}] [{idx+1}/{total}] > "
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
                elif seq in ("[A", "OA"):  # Up arrow -> also previous if empty
                    if not buffer:
                        sys.stdout.write("\n")
                        sys.stdout.flush()
                        return "p"
                elif seq in ("[B", "OB"):  # Down arrow -> also next if empty
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

            # Backspace / Delete
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


def run_repl(raw: dict, url_map: dict, state: str = "NW", goto=None) -> None:
    questions      = build_question_list(raw, state)
    index          = 0
    current_answer = None   # auto-resets on every navigation

    if goto:
        i2 = find_q(questions, str(goto))
        if i2 != -1:
            index = i2

    if questions:
        render_question(state, questions[index], index, len(questions), current_answer, url_map)
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

        # ── Jump: "g <target>"  or  direct bare number/id ────────────────────
        elif cmd_lower.startswith("g ") or _DIRECT_NAV.match(cmd_lower):
            target = cmd.split(None, 1)[1].strip() if cmd_lower.startswith("g ") else cmd
            i2     = find_q(questions, target)
            if i2 != -1:
                index          = i2
                current_answer = None
            else:
                console.print(f'[red]Question "{target}" not found.[/red]')
                refresh = False

        # ── Switch state ──────────────────────────────────────────────────────
        elif cmd_lower.startswith("s "):
            code = cmd.split(None, 1)[1].strip().upper()
            if code in STATE_NAMES:
                state          = code
                questions      = build_question_list(raw, state)
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
            render_question(state, questions[index], index, len(questions), current_answer, url_map)
        elif refresh:
            console.print(f"[yellow]No questions for {state}.[/yellow]")


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="LID-sim CLI — Leben in Deutschland Quiz",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("-s", "--state", default="NW", metavar="CODE",
                        help="Bundesland code (e.g. BY). Default: NW")
    parser.add_argument("-g", "--goto",  metavar="N",
                        help="Jump to question N on start")
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
    run_repl(raw, url_map, state=state, goto=args.goto)


if __name__ == "__main__":
    main()
