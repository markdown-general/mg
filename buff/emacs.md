## emacs ⟡ our agent setup

start server ⟡ `emacs --daemon`
verify ⟡ `emacsclient -e "(server-running-p)"`

open (visible) frame ⟡ `emacsclient -c`

evaluate elisp ⟡ `emacsclient -e (your-elisp-here)`

find buffer name  ⟡ `emacsclient -e "(buffer-name (current-buffer))"`

hot-load ⟡ send fixed Elisp without restart

open org agenda ⟡ `emacsclient -e "(with-selected-frame (car (last (frame-list))) (with-current-buffer \"*Org Agenda*\" (buffer-substring-no-properties (point-min) (point-max)))))"`

read current buffer ⟡ `emacsclient -e "(with-selected-frame (car (last (frame-list))) (buffer-name (window-buffer (selected-window))))"`

---

## emacsclient ⟡ shared surface intent

emacsclient is being developed as an extensible agent user experience — not primary yet, not closing any doors.

⟜ a shared surface approach to file/card generation
⟜ tmux replacement
⟜ emacsclient -c as adhoc agent user interfaces
⟜ a tool with 40 years of extensibility and an active ecosystem

The immediacy is the point: read and write live buffer state before it reaches disk, open shared visible frames on demand, extend the environment in elisp without restart.

---

## emacs ⟡ our developing design

As a part of the mg ways and means, emacs is an agency collaborative tool. We are developing in emacs:

- as a common interface between an agent and a runner using pi-coding-agent and some API tweaks. See [[~/other/pi-coding-agent.md]] for the bespoke emacs package changes, and [[buff/pi-mono.md]] for details on pi.

- as the API for our todo system via org-mode and org-agenda.

- as an adhoc shared editing and analysis tool.

The use of emacs is being driven by the project design of being neutral in tool use:

- Experientially, we found that agent support for elisp and emacs usage was limited if human fat fingers were in the [[../buff/loop.md]]. Using our setup, an agent can fully debug elisp code using the actual and live environment being used by itself and the runner.

- An agent can also be taught runner moves more easily so that delegation and handoff pipelines work. There will be more efficient ways to spin agents, but emacs is one way a human and AI can carry out identical tasks. This is the one-task principle (see one, do one, teach one), creating a rapid learning loop.

---

## emacsclient: -e or -e -c or -c

**Targeting the visible frame, or not**

- `emacsclient -e` runs elisp in server context and does not open a visible frame.
- `emacsclient -e -c` runs elisp but also opens a new frame.
- `emacsclient -c` opens a new frame

**Gotcha:** Frame selection is fragile.

`emacsclient -e "(buffer-name (current-buffer))"` returns the *server* buffer, not your visible editing buffer. Frame order is unpredictable because:
- Minibuffer appears/disappears as processes run and warnings fire
- Old emacsclient instances linger as stale frames
- Cursor movement by running code shifts which frame is "active"
- The *server* buffer is always present but never what you want

**Don't use `with-selected-frame`**. Use `with-current-buffer` instead, targeting by name:

```bash
# Direct access by buffer name (reliable)
emacsclient -e "(with-current-buffer \"loop-examples.md\" (buffer-substring-no-properties (region-beginning) (region-end)))"

# Get the list of actual buffers (when you need to discover a buffer name)
emacsclient -e "(mapcar #'buffer-name (buffer-list))"
```

**If you must find visible frames** (rare), check visibility:

```bash
# Frame list with visibility and buffer names
emacsclient -e "(mapcar (lambda (f) (list (buffer-name (window-buffer (frame-selected-window f))) (frame-visible-p f))) (frame-list))"
```

This shows which frames are actually visible (`t`) vs modal/stale (`nil`). But still: **prefer `with-current-buffer` with an explicit buffer name.**

### hot loading of fixes

Restarting emacs is often expensive. Fix up emacs by using elisp without a restart:

```bash
# Eval a function definition (quote lists as '(...))
emacsclient -e '
(defun my-func ()
  "Fixed version."
  (interactive)
  (message "updated"))
'

# Eval multiple statements
emacsclient -e '(setq my-var 42) (force-mode-line-update)'
```

### agent elisp workflow

**Problem:** Editing elisp directly causes JSON encoding issues when multi-line code passes through agent tool parameters.

**Solution:** Write elisp as markdown cards (code fence blocks) and load via `emacsclient -e "(load-file \"path.el\")"`.

**Workflow:**
1. **Compose** ⟜ Write elisp in markdown with code fence blocks and comments
2. **Review** ⟜ Human reads and optionally edits
3. **Extract** ⟜ Agent writes fence block content to .el file
4. **Load** ⟜ `emacsclient -e "(load-file \"path.el\")"`
5. **Test** ⟜ Run commands, capture output
6. **Record** ⟜ Add results back to card

---

## doom

See `~/.config/doom/init.el` for full module list.

**Active modules:** vertico, company, evil, dired, lookup, lsp, magit, tree-sitter, eshell, haskell-ng-mode, org (+pomodoro), spell, syntax.

**Config files:**
- `~/.config/doom/init.el` ⟜ Module declarations
- `~/.config/doom/packages.el` ⟜ Custom package declarations with pins/branches
- `~/.config/doom/config.el` ⟜ Operational config (28K)

Remember to run `doom sync` if packages are affected by changes.

**Maintenance notes:**
- `compat pin: (package! compat :pin "9a234d0")` ⟜ Fixes transient/magit compatibility issue (doomemacs#8089). Pinned to avoid Emacs downgrade issues.

---

## pi-coding-agent interface

Multi-turn agentic development in Emacs. Sessions are immutable `.jsonl` streams with branching and forking.

**Direct keybindings:**
- `C-c C-c` ⟜ Send prompt (queues follow-up if agent busy)
- `C-c C-s` ⟜ Queue steering (interrupt after current tool)
- `C-c C-k` ⟜ Abort streaming
- `C-c C-r` ⟜ Resume session (from input buffer)

**Chat buffer:**
- `n / p` ⟜ Navigate messages
- `TAB` ⟜ Toggle tool output / Cycle all folds with `S-TAB`
- `RET` ⟜ Visit file at point

**Input buffer:**
- `M-p / M-n` ⟜ History navigation
- `TAB` ⟜ Path/file completion
- `@` ⟜ File reference (search project files)

**Doom leader menu** (`SPC y` prefix):
- `y RET` / `y SPC` ⟜ Send
- `y m` ⟜ Select model
- `y t` ⟜ Cycle thinking level
- `y T` ⟜ Select thinking level directly
- `y h` ⟜ Toggle hide thinking blocks
- `y X` ⟜ Toggle hide tool calls and results
- `y x` ⟜ Toggle hide results only
- `y n` ⟜ New session
- `y r` ⟜ Resume session
- `y R` ⟜ Reload
- `y N` ⟜ Name session
- `y c` ⟜ Compact
- `y f` ⟜ Fork
- `y Q` ⟜ Quit

See [pi-coding-agent](https://github.com/dnouri/pi-coding-agent) for full documentation.

---

## keybindings

Organized by context. Most follow Doom convention: `SPC` (leader) + `m` (major mode) + context char.

### global

| key       | command                     |
|-----------|-------------------------------------|
| `v` `V`   | expand/contract region      |
| `SPC s o` | consult-outline             |
| `SPC s f` | consult-find                |
| `SPC s y` | consult-yank-from-kill-ring |
| `SPC b o` | consult-buffer-other-window |
| `SPC r l` | consult-register-load       |
| `SPC r s` | consult-register-store      |
| `SPC r r` | consult-register            |
| `M-SPC`   | cycle-spacing               |
| `SPC t m` | style/max-frame             |
| `SPC t d` | style/default-frame         |
| `gss`     | evil-avy-goto-char-timer    |
| `gs/`     | evil-avy-goto-char-2        |
| `C-r`     | isearch-backwards           |
| `M-s-s`   | isearch-forward-regexp      |
| `M-j`     | avy-isearch                 |
| `M-n`     | flycheck-next-error         |
| `M-p`     | flycheck-previous-error     |
| `C-c C-p` | pi-coding-agent (transient menu) |

#### insert symbol (SPC i prefix)

**Circles** `SPC i c` — Status/flow color markers
| key       | symbol  |
|-----------|----------|
| `SPC i c g` | 🟢 |
| `SPC i c o` | 🟠 |
| `SPC i c r` | 🔴 |
| `SPC i c b` | 🔵 |
| `SPC i c p` | 🟣 |

**Marks** `SPC i m` — Core mg marks
| key       | symbol  | description   |
|-----------|---------|---------------|
| `SPC i m e` | ⟜ | elab          |
| `SPC i m a` | ⟝ | action/gate   |
| `SPC i m ]` | ⟞ | right gate    |
| `SPC i m l` | ◊ | lozenge       |
| `SPC i m h` | ⬡ | hexagon       |
| `SPC i m w` | ⧈ | weave         |

**Symbols** `SPC i s` — Circuit/hyper notation
| key       | symbol  | description   |
|-----------|---------|---------------|
| `SPC i s l` | η | lift          |
| `SPC i s w` | ε | lower         |
| `SPC i s .` | ⊙ | compose       |
| `SPC i s p` | ⊲ | push          |
| `SPC i s o` | ↬ | loop          |
| `SPC i s r` | ⥁ | run           |
| `SPC i s t` | ⥀ | trace         |
| `SPC i s u` | ↯ | untrace       |

### markdown

| key         | command                     |
|-------------|-----------------------------|
| `v` `V`     | expand/contract region      |

### org-mode

#### agenda

Custom commands:
- `SPC o z` ⟜ z-agenda (agenda + next + blocked + todo)
- `SPC o n` ⟜ next agenda (agenda + next todos)

#### yank-into-block

| key        | command                      |
|------------|------------------------------|
| `SPC m z b` | org-yank-into-new-block      |
| `SPC m z e` | org-yank-into-new-block-elisp |
| `SPC m z s` | org-yank-into-new-block-sh   |
| `SPC m z h` | org-yank-into-new-block-haskell |
| `SPC m z n` | org-new-block-haskell        |
| `SPC m z z` | org-new-block (empty)        |
| `SPC m z q` | org-yank-into-new-quote      |

---

## haskell

See [[~/self/stuff/haskell-lite.md]] for haskell-lite integration (REPL, overlay, tree-sitter).

**Quick reference:**
- `SPC m h` ⟜ hoogle lookup
- `SPC m p` ⟜ hackage lookup
- `SPC m ' ` ⟜ haskell-ng-repl-run
- `SPC m m m` ⟜ haskell-lite-repl-overlay

---

## tips and trickery

Haskell type/doc lookup ⟡ `SPC m h` (hoogle), `SPC m p` (hackage). LSP: `SPC m l l`.

---

## R&D and alternatives

See [[~/self/stuff/emacs-alt.md]] for alternative agent packages (agent-shell, gptel, claude-code.el) and MCP integration options.
