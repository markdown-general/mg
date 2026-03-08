# emacs ⟡ our setup

---

## inventory

### doom baseline

Minimal, vanilla-close Doom Emacs configuration. Active modules:

**UI/Completion:**
- vertico (search engine)
- company (code completion)
- doom-dashboard (splash)
- modeline (Doom aesthetic)
- ligatures (iosevka + extra)
- window-select, popup

**Editor:**
- evil (vim everywhere)
- dired (file browsing)
- undo (persistent)
- vc (git)

**Tools:**
- lookup (documentation navigation)
- lsp (language servers)
- magit (git porcelain)
- tree-sitter (syntax, parsing)
- eshell, shell (terminals)
- eval + overlay (run code inline)

**Languages:**
- emacs-lisp, markdown, latex, org (+pomodoro), sh, yaml
- haskell (via haskell-lite; see below)

**Checkers:**
- syntax, spell

**OS:**
- macos

---

## haskell-lite ⟜ integrated workflow

Consolidated Haskell development environment. Three packages working together:

**Core:**
- `haskell-lite` (github.com/tonyday567/haskell-lite) ⟜ REPL + evaluation overlay (eros.el derived)
- `haskell-ng-mode` (gitlab.com/tonyday567/haskell-ng-mode, lite-fixes) ⟜ Tree-sitter major mode, replaces haskell-mode
- `lsp-haskell` (github.com/magthe/lsp-haskell) ⟜ Language Server Protocol bridge to HLS

**State:** Solid code, library sync broken. All three are functional but got knocked out of alignment in recent refactor.

⊢ haskell-lite consolidation ◊
  [best practices review] — Before merging packages, study emacs library layout
  ⟜ create stand-alone branch (ready)
  ⟜ copy haskell-ng-mode + lsp-haskell into stand-alone
  ⟜ retest with `doom sync`
  ⟜ verify composition (no conflicts, clean seams)
  ⟜ commit

**How it works:**
1. Major mode (haskell-ng-mode, tree-sitter) for editing
2. Type info + docs (lsp-haskell → HLS) for IDE features
3. Interactive dev (haskell-lite REPL + overlay) for exploration
4. Markdown execution (moving from org-babel to markdown cards)

**Keybindings:**

| key        | command                 |
|------------|-------------------------|
| `M-n`      | flycheck-next-error     |
| `M-p`      | flycheck-prev-error     |
| `SPC m h`  | hoogle-name             |
| `SPC m p`  | hackage-package         |
| `SPC m '`  | haskell-ng-repl-run     |
| `SPC m = =` | ormolu-format-buffer   |
| `SPC m e e` | eglot                   |
| `SPC m l l` | lsp                     |
| `SPC m l r` | lsp-restart             |
| `SPC m m m` | haskell-lite-repl-overlay |
| `SPC m m s` | haskell-ng-repl-run     |
| `SPC m m p` | haskell-lite-prompt     |
| `SPC m m g` | haskell-lite-run-go     |
| `SPC m m r` | haskell-lite-repl-restart |

See ~/self/buff/haskell-lite.md for full workflow details.

---

## pi-coding-agent ⟜ multi-agent session interface

**Keybinding:** `C-c C-p`

Multi-turn agentic development in Emacs. Sessions are immutable `.jsonl` streams with branching.

**Core idea:**
- Sessions have id/parentId structure (DAG)
- Fork at any point to spawn parallel conversations
- Use case: Get 5 different opinions on the same code problem in parallel, from one session root

⊢ pi-keymap integration ◊
  Current state: SPC y menu (which-key) is broken/unused
  [verify need] — Is SPC y menu actually desired, or is C-c C-p sufficient?
  ⋆ repair and test which-key groups (7 groups × 34 bindings)
  ⋆ deprecate SPC y entirely, stick with C-c C-p + transient menu

**Working memory for agents:**

When agents read this card on entry, they should know:

1. **Where things are** ⟜ Keybindings are context-specific (see below). Custom packages live in ~/.config/doom/packages.el. Config is ~/.config/doom/config.el.
2. **How to reach code** ⟜ Haskell: C-c C-p for multi-turn dev. Elisp: Same. Navigation: `SPC s f` (find), `SPC s o` (outline), `SPC b o` (buffer).
3. **Type/doc lookup** ⟜ Haskell: `SPC m h` (hoogle), `SPC m p` (hackage). Elisp: built-in help. LSP: `SPC m e e` (eglot).
4. **Eval/test** ⟜ Haskell: `SPC m '` REPL or overlay. Elisp: `C-c C-e`, `M-x ert`.
5. **Pair flow** ⟜ Use pi-coding-agent for refinement loops. Session branching explores alternatives without losing context.

---

## recent R&D (March 2026)

**Landscape:** Agent integration in Emacs is rapidly evolving.

**Trending:**
- `agent-shell` (143⭐) ⟜ Native ACP agent interface (Claude Code, Gemini CLI)
- `gptel` (83⭐, by karthink) ⟜ Extensible LLM client, shifted to "programmable agents via APIs"
- `claude-code.el` (71⭐) ⟜ IDE pair programming, strong REPL-bridge work
- `gptel-agent` (46⭐) ⟜ Agent wrapper with presets

**Patterns:**
- **Sub-agent spawning** (like pi-coding-agent) is not yet widespread. Most packages focus on single-agent chat or tool-calling loops.
- **REPL-agent fusion** (interactive eval + agentic flow) is emerging but immature. No canonical pattern yet.
- **MCP (Model Context Protocol)** becoming integration seam. Karthink views it as bridge for tool orchestration.

**Pain points:**
- Context management (multi-modal, per-buffer contexts)
- Tool/agent orchestration (MCP errors, tool call IDs)
- Workflow clarity (when to use agents vs simple LLM queries)

**Our position:**
- We use pi-coding-agent (jsonl session branching, not MCP)
- Our ethos: cards + emacs working memory, not protocols
- Haskell vision (REPL + overlay + markdown) is ahead of ecosystem

---

## MCP reference (future)

If we need to expose Emacs as tool to external agents, these libraries are worth studying:

**elisp-dev-mcp** (github.com/laurynas-biveinski/elisp-dev-mcp)
- Stdio-based MCP server for Elisp introspection
- Tools: get-function-definition, get-variable-definition, info-lookup-symbol, eval-expression
- Security: Restricts file reads to load-path + custom dirs, rejects .. paths
- Pattern: Tool handlers via `(mcp-register-tool "name" "desc" handler)`, return JSON or error

**emacs-mcp** (github.com/mpontus/emacs-mcp)
- Introspection server (packages, functions, keybindings, docs)
- Loads user init on startup (--batch mode) for accuracy
- Config via mcp.json, Doom bootstrap script
- Use case: Claude Code agent with live Emacs context

Both are stdio, synchronous, minimal. Study only if/when we need MCP hookup.

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
| `C-c C-p` | pi-coding-agent             |

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

## config files

- `~/.config/doom/init.el` ⟜ Module declarations
- `~/.config/doom/config.el` ⟜ Operational config (28K)
- `~/.config/doom/packages.el` ⟜ Custom package declarations with pins/branches

To modify: Edit .el files, then `doom sync && doom build`.

---

## maintenance

**compat pin:** `(package! compat :pin "9a234d0")` ⟜ Fixes transient/magit compatibility issue (doomemacs#8089: "Error in pre-command-hook (transient--pre-command)"). Pinned to specific commit to avoid Emacs downgrade issues.

**Performance:** lsp, tree-sitter are heavy. Monitor startup time.

**Dead code:** SPC y menu is unused. Remove or repair? (See pi-keymap integration note above.)

---

## next

⊢ haskell-lite consolidation ◊ (in progress, pending review)
⊢ pi-keymap decision ◊ (broken, needs direction)
⟜ watch MCP maturity (informational only)
⟜ explore markdown-based Haskell execution (sabela/scripths templates)
