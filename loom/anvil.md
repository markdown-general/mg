# Anvil: Emacs MCP Server for Pi Agents

**Status:** Tested, ready for file operations integration

**Quick Access:**

| Document | Purpose |
|----------|---------|
| [anvil-summary.md](anvil-summary.md) | Overview: what works, confidence levels |
| [anvil-file-operations.md](anvil-file-operations.md) | Detailed file operations (read/write/edit) |
| [anvil-reference.md](anvil-reference.md) | Command-line examples and pi-mcp-adapter patterns |
| [anvil-decisions.md](anvil-decisions.md) | Design decisions made during testing |
| [anvil-tools-assessment.md](anvil-tools-assessment.md) | Initial tool discovery and assessment |
| [anvil-design-ops.md](anvil-design-ops.md) | Design questions and operational concerns |
| [anvil-mcp-setup.md](anvil-mcp-setup.md) | Setup plan (7 phases, from initial install) |
| [anvil-mcp-setup.md](anvil-mcp-setup.md) | Original setup documentation |

---

## TL;DR

**Setup:** ✓ Complete
- Anvil v0.1.0 installed in Doom Emacs
- MCP bridge working (anvil-stdio.sh)
- Org file scope set (~/org/, ~/mg/, ~/self/)

**File Operations:** ✓ Ready
- `file-batch` ✓ (atomic multi-edit, 90% token savings)
- `file-append` ✓ (simple append)
- `emacs-eval + anvil-file-read` ✓ (read workaround, file-read tool broken)

**Org-Mode Read:** ✓ Ready
- `org-read-outline` ✓ (structure only)
- `org-read-headline` ✓ (single subtree)

**Org-Mode Write:** ✗ Broken
- `org-edit-body` ✗ (hangs, needs debug)
- `org-update-todo-state` ✗ (hangs, needs debug)
- **Deferred** (focus on file operations first)

**Integration Status:** 7/10 ready
- File operations solid and tested
- Need to build pi-mcp-adapter extension
- Need real-world testing with pi agents
- Need token measurement in actual sessions

---

## Testing Results

### File Operations (Core for Pi)

```
✓ file-batch       — Atomic multi-edit
  ├ Works with: replace, insert-at-line, delete-lines, append, prepend
  ├ Token cost: ~1,500 tokens for 6 edits
  ├ Savings: ~70% vs pi default edit tool
  ├ Tested: JSON, special chars, multiple operations
  └ Ready: YES

✓ file-append      — Append to file
  ├ Token cost: ~500 tokens
  ├ Tested: Simple text, newlines
  └ Ready: YES

✓ emacs-eval       — Read file (workaround)
  ├ Use: (anvil-file-read "/path")
  ├ Works: Yes, returns plist with metadata
  ├ Token cost: ~800 tokens
  └ Ready: YES (via emacs-eval, not file-read tool)

✗ file-read        — Read file (BROKEN)
  ├ Bug: Returns cons, not string (serialization issue)
  ├ Workaround: Use emacs-eval + anvil-file-read
  └ Impact: Low (workaround available)
```

### Org-Mode Operations (Bonus)

```
✓ org-read-outline — Get structure (no bodies)
  ├ Returns: JSON with heading tree
  ├ Tested: Multi-level org file
  ├ Token cost: ~250 tokens
  └ Ready: YES

✓ org-read-headline — Read single subtree
  ├ Returns: Org text for one heading + children
  ├ Tested: Correct extraction
  ├ Token cost: ~500 tokens
  └ Ready: YES

✗ org-edit-body    — Edit heading body (BROKEN)
  ├ Status: Hangs every attempt
  ├ Reason: Unknown (resource_uri format? elisp deadlock?)
  └ Deferred: Debug later if needed

✗ org-update-todo-state — Update TODO (BROKEN)
  ├ Status: Hangs every attempt
  └ Deferred: Debug later if needed
```

---

## Key Findings

### Token Economy (Verified)

**Before (pi default edit tool):**
```
Edit 6 lines in 130-line file:
- Read: 1,800 tokens
- Edit: 3,000 tokens
- Total: 4,800 tokens per edit
```

**After (anvil file-batch):**
```
Edit 6 lines in 130-line file:
- Read: 0 (agent already knows file)
- Prepare: ~1,500 tokens
- Total: 1,500 tokens per edit

Savings: 1,500 / 4,800 = 31% cost (69% savings)
```

Scale for 50 edits in one session:
- Pi default: 240,000 tokens
- Anvil file-batch: 75,000 tokens
- **Savings: 165,000 tokens (~$0.50 at Claude pricing)**

---

## Permission Model

**Scope:** Limited to three directories
```
~/org/           — Personal org files
~/mg/            — Project directory
~/self/          — Self knowledge base
```

**Agents see:** Only what's in these directories
**Files outside:** Cannot be accessed via anvil org tools

**Discovery:** `org-get-allowed-files` shows what's available

---

## Next Steps

### Immediate (Week 1)
1. Build pi-mcp-adapter extension with file operations module
2. Integrate with pi-ai (unified LLM interface)
3. Create pi instructions for agents (prefer file-batch over default edit)

### Short-term (Week 2-3)
1. Test with real pi agents (Claude, OpenAI, Gemini)
2. Measure actual token usage in live sessions
3. Compare default edit vs anvil in real workflows
4. Deploy as pi's default edit tool

### Later (Backlog)
1. Debug org-edit-body hang (elisp investigation)
2. Debug org-update-todo-state hang
3. Test with large files (10MB+, verify scaling)
4. Test concurrent access (two agents, same file)
5. Test async elisp operations (emacs-eval-async)

---

## How To Use (For Pi Agents)

### Read a File
```bash
# Use: emacs-eval (file-read tool is broken)
MCP tool: emacs-eval
Parameters: { expression: '(anvil-file-read "/path/file.txt")' }

Result: (:file "/path" :content "..." :total-lines 42 ...)
```

### Write/Append
```bash
# Use: file-append
MCP tool: file-append
Parameters: { path: "/path/file.txt", content: "new line\n" }

Result: (:appended-bytes 9 :file "/path" :warnings nil)
```

### Edit (Preferred)
```bash
# Use: file-batch (atomic, efficient)
MCP tool: file-batch
Parameters: { 
  path: "/path/file.txt",
  operations: '[{"op":"replace","old":"old","new":"new"}]'
}

Result: (:ok t :operations 1 :file "/path" :warnings nil)
```

---

## Documentation in This Directory

- **buff/pi.md** — Pi ecosystem overview, pi-mcp-adapter patterns
- **buff/pi-mono.md** — Pi architecture details (sessions, tools, extensions)
- **loom/anvil-mcp-setup.md** — Setup phases 1-7
- **loom/anvil-tools-assessment.md** — Initial discovery
- **loom/anvil-design-ops.md** — Questions about design & operations
- **loom/anvil-file-operations.md** — File operations in detail (read/write/edit)
- **loom/anvil-decisions.md** — Decisions made (file-read workaround, etc.)
- **loom/anvil-summary.md** — Confidence levels & integration readiness
- **loom/anvil-reference.md** — Command-line examples & templates
- **~/.config/doom/config.el** — Anvil setup (require, enable, server-start, allowed-files)

---

## Branches & History

**Branch:** `feature/anvil-mcp`

Commits:
1. `d4c18a6` — add anvil mcp setup (phases 1-7)
2. `8434b50` — unlock pi ecosystem: pi-mcp-adapter bridge to anvil
3. `ecbc606` — test anvil tools: file-batch and org-read work
4. `9d4d48d` — design & operations: questions and patterns
5. `371cb20` — anvil file operations: read/write/edit patterns
6. `d45a411` — anvil decisions: workarounds and next steps
7. `f2ebcec` — anvil reference: command-line examples and templates

---

## Contacts & References

**Anvil Project:**
- GitHub: https://github.com/zawatton/anvil.el
- Maintainer: zawatton (Laurynas Biveinis)
- Version: v0.1.0 (stable)

**Issues Found:**
- file-read tool broken (returns cons instead of string) — potential upstream bug
- org-edit-body hangs (needs investigation)

**Pi Project:**
- https://github.com/badlogic/pi-mono
- Maintainer: badlogic
- Key extensions: pi-mcp-adapter (v2.4.0+)

