---
name: nle
description: NetHack Learning Environment — agent play surface
---

**nle** ⟜ NetHack Learning Environment for agent play
  ⟜ NLE wraps NetHack 3.6.6 as a gymnasium environment
  ⟜ one action per step, structured observations (glyphs, chars, stats)
  ⟜ server keeps one env alive in RAM; client sends moves

---

## install

```bash
cd ~/mg && python3 -m venv .venv/nle
source .venv/nle/bin/activate
pip install nle
```

Requires `cmake` (via Homebrew: `brew install cmake`).

---

## start

```bash
cd ~/mg/nle
source ../.venv/nle/bin/activate
python3 nle_server.py &
```

Server prints discovered actions on startup. It reads from `/tmp/nle_cmd.json` and writes rendered state to `/tmp/nle_out.txt`.

---

## play

```bash
cd ~/mg/nle
source ../.venv/nle/bin/activate
python3 nle_client.py <action> [commentary...]
```

Each call sends one move, waits for the server, appends result to Emacs `*nle-history*` buffer, and prints to stdout.

---

## actions

Discovered dynamically from `env.actions`. Common ones:

| action | meaning |
|--------|---------|
| north / east / south / west | compass movement |
| northeast / southeast / southwest / northwest | diagonal |
| wait | `.` — do nothing for one turn |
| pickup | `,` — pick up items on current square |
| inventory | `i` — list carried items |
| eat | `e` — eat something |
| quaff | `q` — drink a potion |
| read | `r` — read a scroll or spellbook |
| wield | `w` — wield a weapon |
| wear | `W` — wear armor |
| takeoff | `T` — remove armor |
| drop | `d` — drop an item |
| look | `:` — look at a square |
| open | `o` — open a door |
| kick | `k` — kick something |
| cast | `Z` — cast a spell |
| pray | `p` — pray to your god |
| engrave | `E` — engrave on the floor (Elbereth!) |
| up / down | `<` / `>` — use stairs |

Movement into a monster = attack. Movement into a pet = swap places.

---

## emacs

`*nle-history*` buffer accumulates every step. To open:

```bash
emacsclient -c *nle-history*
```

Or evaluate:

```elisp
(with-current-buffer "*nle-history*" (buffer-substring-no-properties (point-min) (point-max)))
```

---

## survival rules for agents

**don't die**
  ⟜ HP < maxHP/3 → retreat, don't fight
  ⟜ never attack peaceful creatures (lowercase glyphs near you)
  ⟜ your starting pet swaps places; other lowercase animals may be hostile
  ⟜ pits and traps can instakill pets and chunk your HP
  ⟜ starvation is real — pick up and eat food

**early game priorities**
  ⟜ grab visible items (food, armor, weapons)
  ⟜ find downstairs (`>`) to descend
  ⟜ avoid unidentified potions/scrolls until desperate
  ⟜ Elbereth (engrave `Elbereth`) scares most monsters

---

## files

| path | purpose |
|------|---------|
| `~/mg/nle/nle_server.py` | persistent env daemon |
| `~/mg/nle/nle_client.py` | action sender + emacs renderer |
| `~/mg/nle/history.txt` | plain-text history backup |
| `/tmp/nle_cmd.json` | command pipe |
| `/tmp/nle_out.txt` | latest rendered state |

---

## reset

Send `reset` action to start a new game with the same seed:

```bash
python3 nle_client.py reset
```

---

## nle_server.py

```python
#!/usr/bin/env python3
"""NLE persistent server. Keeps one gym env alive in memory.

Communicates via files:
  /tmp/nle_cmd.json  -> client writes command here
  /tmp/nle_out.txt   -> server writes rendered state here
"""
import json
import os
import time
import nle
import gymnasium as gym

CMD_FILE = "/tmp/nle_cmd.json"
OUT_FILE = "/tmp/nle_out.txt"
HISTORY_FILE = os.path.expanduser("~/mg/nle/history.txt")


def discover_actions(env):
    """Build a name -> index map by scanning env.actions."""
    base = env.unwrapped
    mapping = {}
    names = {
        107: "north", 108: "east", 106: "south", 104: "west",
        117: "northeast", 110: "southeast", 98: "southwest", 121: "northwest",
        60: "up", 62: "down", 46: "wait", 13: "more",
        44: "pickup", 105: "inventory", 101: "eat", 69: "engrave",
        113: "quaff", 114: "read", 119: "wield", 87: "wear",
        84: "takeoff", 100: "drop", 58: "look", 111: "open",
        4: "kick", 90: "cast", 240: "pray", 115: "search",
        27: "escape",
        97: "apply", 120: "swap", 116: "throw", 122: "zap",
        95: "travel",
    }
    for idx, code in enumerate(base.actions):
        if code in names:
            mapping[names[code]] = idx
    return mapping


def format_inventory(obs):
    """Render inventory from inv_strs and inv_letters."""
    lines = []
    inv_strs = obs.get("inv_strs")
    inv_letters = obs.get("inv_letters")
    if inv_strs is None or inv_letters is None:
        return lines
    lines.append("Inventory:")
    for letter, line in zip(inv_letters, inv_strs):
        if letter == 0:
            break
        item = "".join(chr(c) if 32 <= c < 127 else " " for c in line if c != 0).strip()
        if item:
            lines.append(f"  {chr(letter)} - {item}")
    if len(lines) == 1:
        lines.append("  (empty)")
    return lines


def format_state(obs, step_num, action_name, hp_prev=None):
    lines = []
    lines.append(f"=== Step {step_num} | {action_name} ===")
    lines.append("")

    msg = "".join(chr(c) for c in obs["message"] if c != 0).strip()
    if msg:
        lines.append(f"Message: {msg}")
        lines.append("")

    chars = obs["chars"]
    lines.append("Dungeon:")
    for row in chars:
        line = "".join(chr(c) if 32 <= c < 127 else " " for c in row)
        lines.append(line)
    lines.append("")

    bl = obs["blstats"]
    hp, maxhp = bl[10], bl[11]
    pw, maxpw = bl[14], bl[15]
    ac = bl[16]
    dlvl = bl[12]
    turn = bl[20]

    hp_str = f"{hp}/{maxhp}"
    if hp_prev is not None and hp < hp_prev:
        hp_str += f" (-{hp_prev - hp})"
    elif hp_prev is not None and hp > hp_prev:
        hp_str += f" (+{hp - hp_prev})"

    lines.append(f"HP: {hp_str}  Pw: {pw}/{maxpw}  AC: {ac}  Dlvl: {dlvl}  Turn: {turn}")
    lines.append("")

    # Status lines from tty_chars (rows 22-23) show name, title, stats, alignment
    tty = obs.get("tty_chars")
    if tty is not None:
        for row_idx in (22, 23):
            if row_idx < tty.shape[0]:
                line = "".join(chr(c) if 32 <= c < 127 else " " for c in tty[row_idx]).rstrip()
                if line:
                    lines.append(line)
        lines.append("")

    # Inventory
    inv_lines = format_inventory(obs)
    if inv_lines:
        lines.extend(inv_lines)
        lines.append("")

    return "\n".join(lines)


def main():
    env = gym.make(
        "NetHack-v0",
        actions=nle.nethack.ACTIONS,
        observation_keys=(
            "chars", "message", "blstats", "tty_chars",
            "inv_strs", "inv_letters", "inv_glyphs", "inv_oclasses",
        ),
        allow_all_modes=True,
    )
    obs, info = env.reset(seed=42)
    step_num = 0
    actions = discover_actions(env)

    print("NLE server ready.")
    print("Actions:", ", ".join(sorted(actions.keys())))

    # Write initial state
    text = format_state(obs, step_num, "initial")
    with open(OUT_FILE, "w") as f:
        f.write(text)

    while True:
        time.sleep(0.2)
        if not os.path.exists(CMD_FILE):
            continue

        try:
            with open(CMD_FILE) as f:
                cmd = json.load(f)
            os.remove(CMD_FILE)
        except Exception:
            continue

        action = cmd.get("action", "wait")
        if action == "quit":
            break

        if action == "reset":
            obs, info = env.reset(seed=42)
            step_num = 0
            text = format_state(obs, step_num, "initial")
            with open(OUT_FILE, "w") as f:
                f.write(text)
            with open(HISTORY_FILE, "w") as f:
                f.write(text + "\n")
            continue

        if action not in actions:
            text = f"Unknown action: {action}\nKnown: {', '.join(sorted(actions.keys()))}"
            with open(OUT_FILE, "w") as f:
                f.write(text)
            continue

        act_idx = actions[action]
        hp_prev = obs["blstats"][10]
        obs, reward, done, truncated, info = env.step(act_idx)
        step_num += 1

        text = format_state(obs, step_num, action, hp_prev)
        with open(OUT_FILE, "w") as f:
            f.write(text)

        with open(HISTORY_FILE, "a") as f:
            f.write(text + "\n")

        if done:
            with open(HISTORY_FILE, "a") as f:
                f.write("\n*** YOU DIED ***\n\n")
            break

    env.close()
    print("Server shut down.")


if __name__ == "__main__":
    main()
```

---

## nle_client.py

```python
#!/usr/bin/env python3
"""Send one action to the NLE server and render result to Emacs."""
import json
import os
import subprocess
import sys
import time

CMD_FILE = "/tmp/nle_cmd.json"
OUT_FILE = "/tmp/nle_out.txt"
HISTORY_FILE = os.path.expanduser("~/mg/nle/history.txt")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 nle_client.py <action> [commentary...]")
        return

    action = sys.argv[1]
    commentary = sys.argv[2:] if len(sys.argv) > 2 else []

    cmd = {"action": action, "commentary": commentary}
    with open(CMD_FILE, "w") as f:
        json.dump(cmd, f)

    # Wait for server to process
    for _ in range(50):
        time.sleep(0.1)
        if not os.path.exists(CMD_FILE):
            break

    with open(OUT_FILE) as f:
        text = f.read()

    # Append to Emacs history buffer
    elisp = (
        '(with-current-buffer (get-buffer-create "*nle-history*") '
        '  (goto-char (point-max)) '
        '  (if (> (buffer-size) 0) (insert "\n\n")) '
        '  (insert-file-contents "/tmp/nle_out.txt") '
        '  (goto-char (point-max)))'
    )
    subprocess.run(["emacsclient", "-e", elisp], capture_output=True)

    print(text)


if __name__ == "__main__":
    main()
```
