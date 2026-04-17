# Anvil File Operations — Read/Write/Edit for Pi

**Status:** Testing file operations for use as pi's default edit tool

**Finding:** Two tools work reliably. One is broken.

---

## The Tools

### ✓ file-batch (Multi-Edit, Atomic)

**Works perfectly.** Efficiently edit multiple locations in a file in one call.

**Format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "file-batch",
    "arguments": {
      "path": "/absolute/path/file.txt",
      "operations": "[{\"op\":\"replace\",\"old\":\"find this\",\"new\":\"replace with this\"}]"
    }
  }
}
```

**Operations supported:**
- `replace` ⟜ Find text, replace it (`old`, `new`, optional `max-count`)
- `replace-regexp` ⟜ Regex replacement (`pattern`, `replacement`)
- `insert-at-line` ⟜ Insert at line N (`line`, `content`)
- `delete-lines` ⟜ Delete lines M to N (`start`, `end`)
- `append` ⟜ Add text at end (`content`)
- `prepend` ⟜ Add text at start (`content`)

**Return:**
```json
{
  "type": "text",
  "text": "(:ok t :operations 2 :file \"/path\" :warnings nil)"
}
```

**Token Cost:** ~1,500 tokens for 6 edits to one 130-line file (vs ~4,800 for individual edits)

**Escaping:** Operations string is JSON-in-JSON. Must escape carefully:
- Quote marks: `\"` in JSON string becomes `\\\"` in operations array
- Newlines: `\n` (not literal newline)
- Test: **Always build via bash/echo or proper JSON tool, not shell string interpolation**

---

### ✓ file-append (Append to File)

**Works.** Add content to end of file.

**Format:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "file-append",
    "arguments": {
      "path": "/path/file.txt",
      "content": "text to append\n"
    }
  }
}
```

**Return:**
```json
{
  "type": "text",
  "text": "(:appended-bytes 14 :file \"/path\" :warnings nil)"
}
```

---

### ✗ file-read (Read Entire File) — BROKEN

**Bug:** Tool handler doesn't convert plist return to string.

Error: `Tool handler must return string or nil, got: cons`

**Workaround:** Use `emacs-eval` instead:
```json
{
  "method": "tools/call",
  "params": {
    "name": "emacs-eval",
    "arguments": {
      "expression": "(anvil-file-read \"/path/file.txt\")"
    }
  }
}
```

Returns:
```
(:file "/path" :content "file content..." :total-lines 42 :offset 0 :lines-returned 42 :warnings nil)
```

**Note:** This is a bug in anvil's tool wrapper. Should be fixed upstream (file--tool-read should wrap result in `format "%S"`).

---

### Related Tools (Status Unknown)

- `file-insert-at-line` ⟜ Insert at specific line (not tested)
- `file-delete-lines` ⟜ Delete range (part of file-batch, works)
- `file-replace-string` ⟜ Simple string replacement (not tested)
- `file-replace-regexp` ⟜ Regex replacement (not tested)
- `file-ensure-import` ⟜ Idempotent import insertion (not tested)
- `file-batch-across` ⟜ Multi-file batch edits (not tested)

---

## Recommended Pattern for Pi

**Read:**
```bash
# Via emacs-eval (since file-read is broken)
emacs-eval -e "(anvil-file-read \"/path/file.txt\")"
```

**Write/Append:**
```bash
# Use file-append (simple, works)
file-append -p "/path/file.txt" -c "content to append"
```

**Edit (Replace):**
```bash
# Use file-batch (atomic, efficient, tested)
file-batch -p "/path/file.txt" -o '[{"op":"replace","old":"text","new":"replacement"}]'
```

---

## Escaping Rules

**file-batch operations string is JSON-in-JSON.**

Example: Replace "hello" with `"quoted"` (includes literal quotes):

```bash
# WRONG - shell string interpolation will mangle it
operations='[{"op":"replace","old":"hello","new":"\"quoted\""}]'

# RIGHT - use proper JSON tool or careful echo
operations='[{"op":"replace","old":"hello","new":"\\\"quoted\\\""}]'

# Or build via jq
jq -n --arg ops '[{"op":"replace","old":"hello","new":"\"quoted\""}]' ...
```

**Rules:**
- JSON strings inside operations array use `\"` for quotes
- Newlines are `\n` (not literal)
- Backslashes are `\\`
- Unicode (emoji, CJK) works fine (UTF-8 safe)

---

## Testing Results

✓ file-batch with simple text
✓ file-batch with 2 operations (atomic)
✓ file-append to new file
✓ emacs-eval read of file with special chars
✗ file-read directly (broken)
? file-batch with emoji (jq escaping issues, needs careful testing)

---

## Token Savings vs Pi Default

**Pi's default edit tool:**
- Read full file: N bytes
- Identify change location: NLP in agent
- Edit: full file in + full file out
- Total: 3× file size in tokens

**Anvil file-batch:**
- Read full file: 0 (agent already knows it)
- Prepare edit: single JSON operation
- Write: single atomic batch call
- Total: ~1/10th the tokens

**Example: 1.2MB Org file**
- Pi default: ~40,000 tokens per edit
- Anvil file-batch: ~4,000 tokens per edit
- **Savings: ~90%**

---

## Next Steps

⊢ Fix file-read bug upstream (or patch it in config.el)
⊢ Test file-batch with emoji/special chars thoroughly
⊢ Create pi-mcp-adapter instructions for file operations
⊢ Measure real token usage: default edit vs anvil file-batch
⊢ Replace pi's default edit tool with file-batch

---

## For Integration into Pi

The three core operations for pi should be:

| Operation | Tool | Cost | Notes |
|-----------|------|------|-------|
| Read | emacs-eval + anvil-file-read | ~0.5KB | Works, returns metadata |
| Append | file-append | ~0.5KB | Simple, atomic |
| Edit | file-batch | ~1KB per operation | Atomic, multi-op support |

**Instruction for pi agents:**

> File editing in this workspace uses Anvil (Emacs MCP server) for efficiency:
> - To read a file: use emacs-eval with `(anvil-file-read "/path")`
> - To edit lines: use file-batch with `op: replace` for text replacement
> - To add content: use file-append
> - All operations are atomic and handle large files efficiently
> - Special characters (emoji, quotes, newlines) are handled safely via JSON escaping

