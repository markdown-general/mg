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

There are edge cases where, if the agent starts the server and then a client, the frame will default to the *server* buffer rather than the visible one (if there are any). When in doubt, use `with-selected-frame`:

```bash
# current buffer in visible frame
emacsclient -e "(with-selected-frame (car (last (frame-list))) (buffer-name (window-buffer (selected-window))))"

# read buffer contents (no properties)
emacsclient -e "(with-selected-frame (car (last (frame-list))) (with-current-buffer \"*Org Agenda*\" (buffer-substring-no-properties (point-min) (point-max))))"
```

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
