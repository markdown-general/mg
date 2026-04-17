# Pi MCP Setup — Anvil → Pi Agents

**Intent** ⟜ Connect anvil.el to pi-mcp-adapter, test pi agents calling Emacs tools

**Status:** anvil.el ✓, pi-mcp-adapter exists (v2.4.0, lazy proxy pattern)

---

## Key Insight

pi-mcp-adapter solves context bloat: 40+ MCP tools → 1 proxy tool (~200 tokens).

Lazy loading: servers only connect when tools are actually called.

---

⊢ Phase 1: Install pi-mcp-adapter
  - `pi install npm:pi-mcp-adapter`
  - Verify: `npm list -g pi-mcp-adapter` (or check ~/.pi/agent/)

⊢ Phase 2: Configure anvil in mcp.json
  - Create ~/.pi/agent/mcp.json:
    ```json
    {
      "mcpServers": {
        "anvil": {
          "command": "sh",
          "args": ["-c", "~/.config/emacs/anvil-stdio.sh --server-id=anvil"]
        }
      }
    }
    ```

⊢ Phase 3: Test pi discovery (print mode)
  - `pi --print "Use the mcp tool to search for 'file' tools. Show me what you find."`
  - Should see: `mcp({ search: "file" })` result
  - Expect: file-read, file-batch, file-replace-string, etc.

⊢ Phase 4: Test pi tool call (print mode)
  - Create test file: `echo "test content" > /tmp/pi-anvil-test.txt`
  - `pi --print "Use anvil file tools to read /tmp/pi-anvil-test.txt and show me the content"`
  - Should call: `mcp({ tool: "file-read", args: '{"path": "/tmp/pi-anvil-test.txt"}' })`
  - Expect: content returned

⊢ Phase 5: Test interactive mode
  - `pi` (start interactive session)
  - "Use mcp tools to list org files I have access to"
  - Explore org-mode tools via proxy

⊢ Phase 6: Test multiple providers
  - Switch model: `SPC y m` (pi keybinding)
  - Try with OpenAI or other provider
  - Verify: anvil tools still available (MCP is provider-agnostic)

⊢ Phase 7: Test subagent spawning
  - If using subagent extension: spin sub-agent requesting `mcp:anvil`
  - Sub-agent should inherit access to anvil tools

⊢ Phase 8: Commit & document
  - `cd ~/mg && git add -A && git commit -m "add pi-mcp integration"`
  - Update loom/stack.md with flow

---

**Next frontier:** Test with local models via pi-ai (ollama, llama.cpp)

**Long-term:** Wrap other MCP servers (PDF, Kubernetes, Figma, etc.) same way
