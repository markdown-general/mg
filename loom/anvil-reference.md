# Anvil Tools Reference — Command-Line Examples

**Quick reference for testing and pi-mcp-adapter implementation**

---

## Setup (One-time)

```bash
# Ensure anvil is running in Emacs
emacsclient -e "(anvil-enable)"

# Set org file scope
emacsclient -e "(setq anvil-org-allowed-files (list (expand-file-name \"~/org\") (expand-file-name \"~/mg\") (expand-file-name \"~/self\")))"

# Verify tools are available
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | \
  jq '.result.tools | map(.name) | length'
```

---

## File Operations

### Read File (via emacs-eval workaround)

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"emacs-eval","arguments":{"expression":"(anvil-file-read \\\"/path/to/file.txt\\\")"}}}' | \
  ~/.config/emacs/anvil-stdio.sh --server-id=anvil 2>&1 | \
  jq '.result.content[0].text' -r
```

Returns: `(:file "/path" :content "..." :total-lines 42 :offset 0 :lines-returned 42 :warnings nil)`

Extract just content:
```bash
# Get the :content field from the plist
echo '...' | jq '.result.content[0].text' -r | sed -n 's/.*:content "\(.*\)".*/\1/p'
```

### Append to File

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"file-append","arguments":{"path":"/path/file.txt","content":"new line\n"}}}' | \
  ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | \
  jq '.result.content[0].text'
```

Returns: `(:appended-bytes 9 :file "/path" :warnings nil)`

### Edit File (file-batch)

**Single replacement:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"file-batch","arguments":{"path":"/path/file.txt","operations":"[{\"op\":\"replace\",\"old\":\"old text\",\"new\":\"new text\"}]"}}}' | \
  ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | \
  jq '.result.content[0].text'
```

**Multiple replacements (atomic):**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"file-batch","arguments":{"path":"/path/file.txt","operations":"[{\"op\":\"replace\",\"old\":\"a\",\"new\":\"A\"},{\"op\":\"replace\",\"old\":\"b\",\"new\":\"B\"}]"}}}' | \
  ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | \
  jq '.result.content[0].text'
```

**Insert at line:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"file-batch","arguments":{"path":"/path/file.txt","operations":"[{\"op\":\"insert-at-line\",\"line\":5,\"content\":\"inserted line\"}]"}}}' | \
  ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | \
  jq '.result.content[0].text'
```

---

## Building Safe JSON (For Pi-MCP-Adapter)

### Using jq (Recommended)

```bash
#!/bin/bash
# Build file-batch request safely

path="/path/to/file.txt"
old_text="find me"
new_text="replace with this"

# Build operations array via jq
operations=$(jq -n --arg o "$old_text" --arg n "$new_text" \
  '[{"op":"replace","old":$o,"new":$n}]')

# Build full request via jq
request=$(jq -n \
  --arg path "$path" \
  --argjson ops "$operations" \
  '{jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"file-batch",arguments:{path:$path,operations:($ops|tostring)}}}')

echo "$request" | ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | jq '.'
```

### Using bash (Careful Escaping)

```bash
path="/path/to/file.txt"
old="find me"
new="replace with"

# Escape quotes in old/new
old_esc="${old//\"/\\\"}"
new_esc="${new//\"/\\\"}"

# Build operations string
operations="[{\"op\":\"replace\",\"old\":\"$old_esc\",\"new\":\"$new_esc\"}]"

# Build request
request="{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"file-batch\",\"arguments\":{\"path\":\"$path\",\"operations\":\"$operations\"}}}"

echo "$request" | ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | jq '.'
```

**Note:** jq is safer. Use bash only if jq isn't available.

---

## Org-Mode Operations

### Read Outline (Structure Only)

```bash
file="/path/to/file.org"

echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"org-read-outline\",\"arguments\":{\"file\":\"$file\"}}}" | \
  ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | \
  jq '.result.content[0].text | fromjson'
```

Returns JSON:
```json
{
  "headings": [
    {"title":"Section 1","level":1,"children":[...]},
    {"title":"Section 2","level":1,"children":[...]}
  ]
}
```

### Read Single Headline

```bash
file="/path/to/file.org"
headline_path="Section 1"  # or "Section 1/Subsection 1.1"

echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"org-read-headline\",\"arguments\":{\"file\":\"$file\",\"headline_path\":\"$headline_path\"}}}" | \
  ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | \
  jq '.result.content[0].text' -r
```

Returns Org text (that headline and all children).

### Get Allowed Files

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"org-get-allowed-files","arguments":{}}}' | \
  ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | \
  jq '.result.content[0].text | fromjson'
```

Returns:
```json
{"files":["~/org","~/mg","~/self"]}
```

---

## Error Handling

### Timeout

```bash
timeout 5 bash -c 'echo ... | ~/.config/emacs/anvil-stdio.sh ...' || echo "Timeout or error"
```

### JSON Parse Errors

If the tool returns an error:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Missing required parameter: ..."
  }
}
```

Check:
1. Parameter names (vary per tool: "file" vs "path", "headline_path" vs "resource_uri")
2. JSON escaping (operations string is double-JSON-encoded)
3. File permissions (must be in anvil-org-allowed-files)

### Check Tool Schema

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1 | \
  jq '.result.tools[] | select(.name=="tool-name") | .inputSchema'
```

Use this to verify required parameters and formats.

---

## Pi-MCP-Adapter Patterns

**Read file:**
```typescript
const result = await callMCPTool("emacs-eval", {
  expression: `(anvil-file-read "${escapePath(path)}")`
});
// Parse result from elisp sexp
```

**Batch edit:**
```typescript
const operations = [
  { op: "replace", old: "search", new: "replace" },
  { op: "insert-at-line", line: 10, content: "new content" }
];

const result = await callMCPTool("file-batch", {
  path: path,
  operations: JSON.stringify(operations)
});
// Result: (:ok t :operations 2 ...)
```

**Return JSON to agent:**
```typescript
// Convert sexp to JSON
function parseSexp(sexp) {
  // Extract :content, :warnings, etc.
  // Return clean JSON
}

// Standardize all tool returns as JSON
return {
  status: "ok",
  file: parseSexp(result).file,
  operationsCompleted: parseSexp(result).operations,
  warnings: parseSexp(result).warnings
};
```

---

## Debugging

### Enable Debug Logging

```bash
export EMACS_MCP_DEBUG_LOG=/tmp/anvil-debug.log

echo '...' | ~/.config/emacs/anvil-stdio.sh --server-id=emacs-eval 2>&1

# View logs
tail -50 /tmp/anvil-debug.log
```

### Check Emacs Logs

```bash
# View Emacs daemon messages
emacsclient -e "(buffer-string)" -a "*Messages*"

# Or check if daemon is alive
emacsclient -e "(server-running-p)"
```

### Test Tool Directly in Emacs

```bash
# Inside Emacs
M-x eval-expression
(anvil-file-read "/path/file.txt")
```

---

## Token Costs (Approximate)

| Operation | Size | Tokens |
|-----------|------|--------|
| file-batch call (1 op) | ~1.5KB | ~400 |
| file-batch call (6 ops) | ~2.5KB | ~700 |
| org-read-outline (20 headings) | ~1KB | ~250 |
| org-read-headline (1 section) | ~2KB | ~500 |
| emacs-eval + file-read (42 lines) | ~3KB | ~800 |

Compare to pi default:
- Read file (130 lines): ~3KB → ~800 tokens
- Full-file edit: ~4.5KB → ~1,200 tokens
- **Total per edit: ~2,000 tokens**

With file-batch: ~400 tokens per edit (80% savings)

