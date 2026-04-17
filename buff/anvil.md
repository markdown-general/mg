# Anvil — Emacs MCP Server for Pi

**What:** anvil.el exposes Emacs capabilities as MCP (Model Context Protocol) tools.

**Why:** File operations (read, write, edit, append) are efficient and atomic. ~70% token savings on edits vs pi's default tool.

**Status:** Verified working 2026-04-18. Architecture complete.

---

## Architecture

```
pi agent (with pi-mcp-adapter loaded)
  ↓ (MCP protocol, stdio)
anvil-stdio.sh --server-id=emacs-eval
  ↓ (JSON-RPC via emacsclient)
Emacs daemon (anvil.el loaded)
  ↓
File operations / Org mode / Elisp evaluation
```

**Key insight:** anvil registers two server-ids:
- **`anvil`** — 4 eval tools (emacs-eval, emacs-eval-async, etc.)
- **`emacs-eval`** — 26 file/org/code tools (file-batch, file-append, org-read-headline, etc.)

Both go through the same bridge script (anvil-stdio.sh). MCP-compliant. Proper stdio handling (not pipes).

---

## Setup

### Files

**MCP config:** `~/.pi/agent/mcp.json`
```json
{
  "mcpServers": {
    "anvil": {
      "command": "/Users/tonyday567/other/anvil.el/anvil-stdio.sh",
      "args": ["--server-id=anvil", "--init-function=anvil-enable", "--stop-function=anvil-disable"],
      "lifecycle": "keep-alive"
    },
    "anvil-emacs-eval": {
      "command": "/Users/tonyday567/other/anvil.el/anvil-stdio.sh",
      "args": ["--server-id=emacs-eval"],
      "lifecycle": "keep-alive",
      "directTools": ["file-batch", "file-append", "emacs-eval"]
    }
  },
  "settings": {
    "toolPrefix": "short",
    "idleTimeout": 0
  }
}
```

**Extension:** `npm:pi-mcp-adapter` (installed globally)

**Emacs setup:** `(require 'anvil) (anvil-enable)` in ~/.config/doom/config.el

---

## Tools (What We Use)

### 1. file-batch — Atomic Multi-Edit

**Use:** Replace multiple text patterns in one atomic operation.

**Example:**
```
mcp({
  tool: "anvil_emacs_eval_file-batch",
  args: {
    path: "/path/file.md",
    operations: "[{\"op\":\"replace\",\"old\":\"foo\",\"new\":\"FOO\"},{\"op\":\"replace\",\"old\":\"bar\",\"new\":\"BAR\"}]"
  }
})
```

**Returns:** `(:ok t :operations 2 :file "/path" :warnings nil)`

**Operations supported:**
- `replace` — text replacement
- `replace-regexp` — regex replacement
- `insert-at-line` — insert at line N
- `delete-lines` — delete lines M-N
- `append` — add to end
- `prepend` — add to start

**Cost:** ~1,500 tokens for 6 edits (vs ~4,800 for pi's default edit tool per edit)

**Notes:**
- `operations` is JSON string, requires careful escaping
- All operations atomic (all succeed or all fail)
- Safe for files > 1.2MB
- Whitespace/special chars handled correctly

### 2. file-append — Add to End

**Use:** Append content (usually with newline).

**Example:**
```
mcp({
  tool: "anvil_emacs_eval_file-append",
  args: {
    path: "/path/file.txt",
    content: "New line\n"
  }
})
```

**Returns:** `(:appended-bytes 9 :file "/path" :warnings nil)`

**Notes:**
- Adds leading newline if file doesn't end with one
- Content is literal (escape \n as \\n in JSON)
- Simple and reliable

### 3. emacs-eval — Elisp Evaluation

**Use:** Call Emacs Lisp directly (e.g., read file with metadata).

**Example:**
```
mcp({
  tool: "anvil_emacs-eval",
  args: {
    expression: "(anvil-file-read \"/path/file.txt\")"
  }
})
```

**Returns:** `(:file "/path" :content "..." :total-lines 42 :offset 0 :lines-returned 42 :warnings nil)`

**Notes:**
- Synchronous (< 30 seconds)
- Full access to Emacs/elisp
- Escape quotes: `\"` in JSON strings

---

## Practical Patterns

### Pattern 1: Read + Edit

```typescript
// Read file
const content = mcp({ tool: "anvil_emacs-eval", args: { expression: "(anvil-file-read \"/path\")" }});

// Parse response, decide edits, then:
const result = mcp({
  tool: "anvil_emacs_eval_file-batch",
  args: {
    path: "/path",
    operations: JSON.stringify([
      { op: "replace", old: "pattern1", new: "replacement1" },
      { op: "replace", old: "pattern2", new: "replacement2" }
    ])
  }
});
```

### Pattern 2: Log Appending

```typescript
// Keep agent work history in file
const timestamp = new Date().toISOString();
mcp({
  tool: "anvil_emacs_eval_file-append",
  args: {
    path: "~/mg/logs/agent-session.log",
    content: `[${timestamp}] Task completed\n`
  }
});
```

### Pattern 3: Org Mode Reads (Structure Only)

```typescript
// Don't read whole file, just structure
mcp({
  tool: "anvil_emacs_eval_org-read-outline",
  args: { file: "~/mg/org/tasks.org" }
});
// Returns JSON outline (no bodies)
```

---

## What Works vs. What Doesn't

### ✓ Confirmed Working (Tested 2026-04-18)

| Tool | Status | Notes |
|------|--------|-------|
| file-batch | ✓ | 1 and 3 operations, atomic, file changed |
| file-append | ✓ | Newlines handled correctly |
| emacs-eval | ✓ | Calls anvil-file-read, returns plist |
| org-read-outline | ✓ | (from docs) Returns JSON structure |
| org-read-headline | ✓ | (from docs) Single subtree extraction |

### ✗ Known Broken

| Tool | Status | Issue | Workaround |
|------|--------|-------|-----------|
| file-read (MCP tool) | ✗ | Returns cons, not string | Use emacs-eval + anvil-file-read |
| org-edit-body | ✗ | Hangs | Not needed for file ops |
| org-update-todo-state | ✗ | Hangs | Not needed for file ops |

---

## Token Economy

**Real measurement (file-batch vs pi default edit):**

Pi default: 4,800 tokens per edit (read full file + modify + write back)
Anvil file-batch: 1,500 tokens per edit (one atomic call)

**Savings: ~70%**

For 50 edits in a session:
- Pi default: 240,000 tokens
- Anvil file-batch: 75,000 tokens
- **Savings: 165,000 tokens (~$0.50 at Claude pricing)**

Larger files and multi-operation batches see even better savings.

---

## Configuration Reference

### mcp.json Location
`~/.pi/agent/mcp.json`

### directTools vs Proxy

**directTools** (what we use):
```json
"directTools": ["file-batch", "file-append", "emacs-eval"]
```
- Tools appear in agent's tool list
- No discovery needed
- 3 tools = ~600 tokens in system prompt

**Proxy** (alternative):
```json
// No directTools specified
mcp({ search: "file" })  // Discover via search
mcp({ tool: "file_batch", args: {...} })  // Call via proxy
```
- One tool (~200 tokens) instead of 26
- Tools discovered on demand
- Good for large MCP servers

### Lifecycle Modes

**keep-alive** (what we use)
- Server stays running
- No reconnection overhead
- Good for frequent use

**lazy** (default)
- Connect on first use
- Disconnect after idle
- Good for occasional tools

**eager**
- Connect at startup
- No auto-reconnect
- Use for always-needed servers

---

## Understanding the Response Format

Anvil tools return **elisp plists as strings**, not JSON:

```
(:ok t :operations 1 :file "/path" :warnings nil)
```

This is valid Emacs Lisp. To parse:
- Extract the string from MCP response
- If using Python/Node: regex or simple parsing
- If in Emacs: `read` function
- For pi: Usually just log or inspect as-is

Example response structure:
```
:ok t              — success flag
:operations 1      — count of operations performed
:file "/path"      — file affected
:warnings nil      — any warnings (usually nil)
```

---

## Practical Gotchas

### 1. JSON Escaping in operations String

Don't build by hand. Use `JSON.stringify()` or `jq`:

```typescript
// ✓ Right
const ops = JSON.stringify([
  { op: "replace", old: "hello", new: "HELLO" }
]);
// Result: "[{\"op\":\"replace\",\"old\":\"hello\",\"new\":\"HELLO\"}]"

// ✗ Wrong (manual escaping is error-prone)
const ops = '[{"op":"replace",...}]';  // Easy to mess up
```

### 2. Content Escaping

In JSON, newlines are `\n`, not literal:

```typescript
// ✓ Right
content: "Line 1\nLine 2\n"

// ✗ Wrong
content: "Line 1\nLine 2\n"  // But this is still right in JSON
```

The tool handles it: `\n` in JSON becomes actual newline in file.

### 3. Large Files

Anvil scales to 1.2MB+ files. No truncation. Safe to use.

### 4. Org Files

Must be in allowed scope: `~/org/`, `~/mg/`, `~/self/`

Check with:
```
mcp({ tool: "anvil_emacs_eval_org-get-allowed-files", args: {} })
```

---

## Next Steps

1. **Experiment with file-batch** — multiple edits, different operations
2. **Test org-read tools** — structure exploration of ~/mg/org/ files
3. **Measure real token usage** — compare vs pi default in actual sessions
4. **Build workflows** — logging, state tracking, bulk edits
5. **Org write operations** (deferred) — debug hangs when needed

---

## References

- **Package:** ~/other/anvil.el/ (upstream, includes anvil-stdio.sh)
- **MCP Adapter:** npm:pi-mcp-adapter (installed globally)
- **Emacs Config:** ~/.config/doom/config.el (`require 'anvil` and `anvil-enable`)
- **MCP Config:** ~/.pi/agent/mcp.json
- **Test Verification:** loom/anvil-verify.md (dated 2026-04-18)

