# Anvil MCP Setup — Doom Emacs

**Intent** ⟜ Install anvil.el (v0.1.0) via Doom, register MCP, test, document unwinding

**Setup:** Doom Emacs at ~/.config/doom/ (straight.el), daemon already running

---

✓ Phase 1: Git checkpoint
  - ✓ `git checkout -b feature/anvil-mcp`
  - ✓ Daemon status: `t`

✓ Phase 2: Add anvil to packages.el
  - ✓ Added to ~/.config/doom/packages.el
  - ✓ `doom sync` completed

✓ Phase 3: Enable in config.el
  - ✓ Added to ~/.config/doom/config.el: `(require 'anvil) (anvil-enable)`
  - ✓ Restarted daemon
  - ✓ Anvil loads: "Anvil: enabled with modules: net, data, clipboard, text, emacs, fs, proc, git, host, file, org, eval"
  - ⚠ Worker module warning (not critical)

✓ Phase 4: Install bridge script
  - ✓ Copied anvil-stdio.sh to ~/.config/emacs/
  - ✓ Made executable

✓ Phase 5: Register with Claude Code
  - ✓ `claude mcp add` anvil server
  - ✓ `claude mcp add` anvil-emacs-eval server
  - Status: `claude mcp list` shows both registered (not yet tested live)

✓ Phase 6: Test MCP with Claude
  - ✓ Claude Code CLI sees all MCP tools (file, org, eval, etc.)
  - ✓ MCP tools properly exposed via anvil-stdio.sh bridge
  - ✓ Initialize handshake succeeds
  - Note: Tool calls require permission approval in interactive sessions (expected)

⊢ Phase 7: Commit
  - `cd ~/mg && git add -A && git commit -m "add anvil mcp setup"`

---

**Next:** loom/pi-mcp-setup.md ⟜ Connect anvil to pi agents via pi-mcp-adapter (LLM-agnostic)
