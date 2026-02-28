card pi-keymap ⟜ create which-key menu for pi-coding-agent under SPC y

Organize pi-coding-agent commands in a discoverable which-key menu bound to `SPC y`.

---

## Goal

Instead of memorizing `C-c C-p` for the menu, expose pi-coding-agent commands via leader key with which-key hints.

Binding: `SPC y` (y for "yet another agent" or "your agent" or just available)

---

## Plan: Grouped Organization

**SPC y** — Pi coding agent commands (grouped by function)

```
SPC y s — Session Management
  n     — New session
  r     — Resume session
  m     — Set session name
  l     — Reload session
  t     — Toggle windows

SPC y m — Model & Thinking
  m     — Select model
  h     — Cycle thinking level (off/low/med/high)

SPC y f — Fork & Branching
  f     — Fork conversation
  F     — Fork at point

SPC y a — Actions
  s     — Send prompt
  a     — Abort streaming
  q     — Quit session
  >     — Queue follow-up
  .     — Queue steering message

SPC y i — Info & Export
  i     — Session stats
  p     — Process info
  c     — Copy last message
  e     — Export HTML

SPC y d — Display & Navigation
  n     — Next message
  p     — Previous message
  t     — Toggle tool sections
  v     — Visit file at point

SPC y x — Commands & Tools
  /     — Run custom command
  ?     — Refresh command list
```

## Implementation

◊ ✓ **Investigated:** Found all commands, organized by function

✓ **Implemented:**
  ⟜ Created keymap in config.el with 7 groups under SPC y
  ⟜ Added :desc for which-key on all 34 bindings
  ⟜ `doom sync` completed successfully

⟝ **Verify (next session):**
  ⟜ Restart Emacs
  ⟜ Test: `SPC y` shows groups with hints
  ⟜ Test: navigate and use (e.g., `SPC y s n` creates session)
  ⟜ Test: `SPC y m h` cycles thinking level

---

## Findings

**Interactive commands (non-private):**
- `pi-coding-agent` — Start/open session
- `pi-coding-agent-toggle` — Hide/show windows
- `pi-coding-agent-new-session` — Create named session
- `pi-coding-agent-reload` — Reload session
- `pi-coding-agent-resume-session` — Resume previous
- `pi-coding-agent-set-session-name` — Rename session
- `pi-coding-agent-select-model` — Choose model
- `pi-coding-agent-cycle-thinking` — Cycle thinking levels (off/low/med/high)
- `pi-coding-agent-session-stats` — Show stats
- `pi-coding-agent-process-info` — Show process info
- `pi-coding-agent-compact` — Compact context
- `pi-coding-agent-export-html` — Export as HTML
- `pi-coding-agent-copy-last-message` — Copy last response
- `pi-coding-agent-fork` — Fork conversation
- `pi-coding-agent-fork-at-point` — Fork at cursor
- `pi-coding-agent-run-custom-command` — Run /command
- `pi-coding-agent-refresh-commands` — Refresh command list
- `pi-coding-agent-send` — Send prompt
- `pi-coding-agent-abort` — Abort streaming
- `pi-coding-agent-quit` — Quit session
- `pi-coding-agent-queue-steering` — Queue steering msg
- `pi-coding-agent-queue-followup` — Queue follow-up
- `pi-coding-agent-next-message` — Navigate messages
- `pi-coding-agent-previous-message` — Navigate messages
- `pi-coding-agent-toggle-tool-section` — Expand/collapse tools
- `pi-coding-agent-visit-file` — Open file at point
- (history: `pi-coding-agent-previous-input`, `pi-coding-agent-next-input`, `pi-coding-agent-history-isearch-backward`)

**Thinking visibility:**
- No separate "hide thinking" toggle in Emacs version
- Use `pi-coding-agent-cycle-thinking` to cycle off/low/med/high
- (Terminal pi has `ctrl-t` toggle; Emacs cycles instead)
