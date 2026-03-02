card emacs-pi-integration ⟜ integrate Pi with pi-coding-agent in Doom Emacs

**Status: ✓ Complete**

Installed pi-coding-agent as Emacs frontend for pi coding agent. Tested and working.

---

## Solution: pi-coding-agent

**What it is:** Native Emacs frontend for pi coding agent. Compose prompts in Emacs buffers, chat history as markdown, direct Pi integration.

**Features:**
- Compose prompts in full Emacs buffer (multi-line, copy/paste, keybindings)
- Chat history as markdown buffer (save, search, navigate, fork)
- Live streaming output (bash commands, tool operations)
- Syntax-highlighted code blocks and diffs
- Collapsible tool output with smart preview
- Input history with search (`M-p`/`M-n`, `C-r`)
- Magit-style transient menu for all commands (`C-c C-p`)
- Multiple sessions per project
- Fork conversation at any point

**Requirements:**
- Emacs 28.1+
- pi coding agent 0.51.3+ installed and in PATH

---

## Implementation

**Changes to Doom config:**

✓ **packages.el:**
- Removed: shell-maker, acp, agent-shell
- Added: `(package! pi-coding-agent)`

✓ **config.el:**
- Removed: agent-shell use-package block and keybindings
- Added:
```elisp
(use-package! pi-coding-agent
  :init (defalias 'pi 'pi-coding-agent))
```

✓ `doom sync` completed
✓ pi binary verified: `/opt/homebrew/bin/pi`
✓ Emacs restarted and tested

---

## Usage

**Start a session:**
```
M-x pi
```
or
```
M-x pi-coding-agent
```

**Key Bindings:**
- `C-c C-c` — Send prompt
- `C-c C-p` — Open menu (model, thinking level, session mgmt)
- `M-x pi` — Start session
- `TAB` — Toggle/expand sections
- `f` — Fork conversation
- `@` — File reference (search)

**Workflow:**
1. Compose prompt in input buffer (bottom)
2. Send with `C-c C-c`
3. Watch response stream in chat buffer (top)
4. Save chat as `.md` file, close, resume later
5. Use `@` to reference project files in prompts
6. Fork with `f` to branch conversation

---

## Notes

- Chat history is native Markdown, fully searchable and editable
- Each project directory gets its own session automatically
- Multiple sessions in same directory: `C-u M-x pi-coding-agent` to name
- Input buffer is full Emacs buffer—macros, registers, kill-ring all work
- Tool output collapsed by default, expand with `TAB`
- Click model name or thinking level to change them on the fly

---

## Related

- [pi-coding-agent GitHub](https://github.com/dnouri/pi-coding-agent)
- [pi coding agent](https://github.com/badlogic/pi-mono)
- [Doom Emacs documentation](https://docs.doomemacs.org/)

---

## Session Context

**Agent:** yin-emacs
**Resumed in:** Emacs with pi-coding-agent active
**Time to resolution:** Single session with research + implementation + testing
**Removed:** agent-shell (ACP-based approach, wrong look-and-feel)
**Avoided:** MCP, claude-code-ide, gptel (not suitable)
