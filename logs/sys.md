# sys ⟜ System configuration decisions and setup log

Record of intentional architectural choices and their rationale.

---

## pi-mono: rpc-browsing-surface branch

**Decision:** Use local pi-mono on `rpc-browsing-surface` branch, not standard npm release.

**Reason:** pi-coding-agent's `browser` branch (tree browser, session browser) requires RPC commands that only exist in the rpc-browsing-surface feature branch:
- `list_sessions`
- `get_tree`
- `navigate_tree`
- `set_label`
- `abort_branch_summary`

The standard npm pi (0.55.4) lacks these commands. The feature branches are paired.

**Installation:**
```bash
cd ~/other/pi-mono
npm install -g ./packages/coding-agent
```

**Version:** 0.55.0 (rpc-browsing-surface branch)

**Status:** Both branches on feature branches, not main. Waiting for upstream merge to main.

**2026-03-04:** Installed after pi-coding-agent browser branch was set up in Doom config.

---

## exec-path-from-shell for Emacs env vars

**Decision:** Use `exec-path-from-shell` + `.zshenv` for API keys in Emacs.

**Reason:** macOS GUI Emacs doesn't inherit shell environment. `.zshrc` is interactive-only; exec-path-from-shell runs a login shell which sources `.zshenv`. 

**Implementation:**
- `~/.zshenv` ← `~/other/dotfiles/zsh/.zshenv` (symlinked)
- `exec-path-from-shell-copy-envs` in config.el copies `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
- Avoids oh-my-zsh startup overhead (no `-i` flag)

**Status:** Working. Auth flows into Emacs, pi-coding-agent can authenticate.

---

## Session model

**Decision:** One pi instance at a time. Lock on settings.json prevents concurrent writes.

**Reason:** JSONL session tree structure requires single writer. Parentid integrity, no race conditions on immutable records.

**Workflow:** Exit TUI → resume same session in Emacs. Context ball reattaches from JSONL. Sequential, not concurrent.

**Status:** Correct by design. Not a bug.

---

## Browser branch status

pi-coding-agent on `browser` branch brings:
- Session browser (`C-c C-r`)
- Tree browser (`C-c C-p`)
- Advanced session navigation

Still in-flight, feature branch status, merged to main pending.

---
