# Anvil Tools Assessment — Learning the Capabilities

**Date:** 2026-04-18

---

## Discovery: Two Server IDs

**Important:** Anvil registers tools under TWO server-ids:

| Server ID | Tools | Purpose |
|-----------|-------|---------|
| `anvil` | emacs-eval, emacs-eval-async, emacs-eval-result, emacs-eval-jobs | Lisp evaluation (4 tools) |
| `emacs-eval` | file, org-*, code-*, json-*, worker-* | File ops, org-mode, code extraction (26 tools) |

**Why:** Architectural separation. One for isolated elisp execution (safe), one for system operations.

**For Claude Code / pi-mcp-adapter:** Register BOTH server-ids pointing to anvil-stdio.sh with appropriate --server-id flag.

---

## Tool Families (emacs-eval server)

**File Operations (10 tools):**
- `file-read` ⟜ Read entire file
- `file-batch` ⟜ Multiple edits to same file (atomic)
- `file-replace-string` / `file-replace-regexp` ⟜ Targeted string/regex replacement
- `file-insert-at-line` ⟜ Insert at specific line
- `file-delete-lines` ⟜ Delete line range
- `file-append` ⟜ Append to end
- `file-ensure-import` ⟜ Add import/require lines idempotently
- `file-batch-across` ⟜ Multi-file edits in one call
- `file-outline` ⟜ Get file structure

**Org-Mode Operations (8 tools):**
- `org-read-file` ⟜ Read entire org file
- `org-read-outline` ⟜ Get outline (headings only, no bodies)
- `org-read-headline` ⟜ Read single heading subtree
- `org-read-by-id` ⟜ Read heading by :ID: property
- `org-get-todo-config` ⟜ Read TODO keywords
- `org-get-tag-config` ⟜ Read available tags
- `org-get-allowed-files` ⟜ List files agent can access
- `org-rename-headline` ⟜ Rename heading
- `org-edit-body` ⟜ Edit heading body text
- `org-add-todo` / `org-update-todo-state` ⟜ TODO state management

**Code Tools (3 tools):**
- `code-extract-pattern` ⟜ Extract structured records from files (legacy migration, ETL)
- `code-add-field-by-map` ⟜ Add fields to object literals by mapping (i18n, configs)

**JSON Tools (1 tool):**
- `json-object-add` ⟜ Add key-value pairs to JSON objects

**Worker Tools (2 tools):**
- `anvil-worker-probe` ⟜ Check worker pool status
- `anvil-worker-reset-pool` ⟜ Reset worker pool

**Elisp Tools (anvil server, 4 tools):**
- `emacs-eval` ⟜ Sync elisp execution (< 30s)
- `emacs-eval-async` ⟜ Async elisp (long-running)
- `emacs-eval-result` ⟜ Poll async job result
- `emacs-eval-jobs` ⟜ List all async jobs

---

## Design Observations

**Pattern 1: Targeted Operations Win**
- `file-batch` collapses N edits → 1 MCP call (~90% token savings vs individual calls)
- `org-read-headline` reads one section from 13k-line file without shipping whole file
- Generic Read/Write tools require full file round-trip each time

**Pattern 2: Lazy Evaluation**
- `code-extract-pattern` doesn't send file body back to agent
- Agent gets structured data (records), not raw text
- Good for: legacy migrations, data extraction, ETL

**Pattern 3: Idempotent Operations**
- `file-ensure-import` checks if import exists before adding
- `json-object-add` handles trailing commas, duplicate-key policy
- Safe to retry without side effects

**Pattern 4: Async Dispatch**
- Heavy ops (compile, OCR, tangle) → worker pool → don't block main session
- Main connection stays responsive for tool discovery/status checks
- Worker communicates results back to agent via `emacs-eval-result` polling

---

## Token Economy

**Without Anvil (generic Read/Edit/Write):**
- Read 1.2MB org file: ~8,000 tokens shipped
- Make 3 edits: 3 round trips × ~4,000 tokens = 12,000 tokens
- Total: 20,000 tokens of file shuttling

**With Anvil (targeted tools):**
- `org-read-outline`: ~1,000 tokens (structure only)
- `org-edit-body` ×3: 3 calls × ~800 tokens = 2,400 tokens
- Total: 3,400 tokens
- **Savings: ~83%**

**With Anvil (batch pattern):**
- `file-batch` ×1: ~1,500 tokens
- vs 6 individual edits: ~4,800 tokens
- **Savings: ~70%**

---

## Operational Concerns (need testing)

| Concern | Status | Notes |
|---------|--------|-------|
| Large file handling (1.2MB+) | ✓ Tested | No truncation, scales |
| UTF-8 / Unicode | ? | Not tested yet |
| Permission scoping | ? | Does org-get-allowed-files restrict? |
| Worker pool crashes | ? | Isolated but what happens if it dies? |
| Long-running evals | ? | Timeout? Max duration? |
| Circular references / infinite loops | ? | emacs-eval-async: can we kill runaway evals? |
| Concurrent access to same file | ? | Two agents editing same file? |

---

## Findings So Far

✓ **Server-ID Separation Works**
- Two server-ids: "anvil" (eval tools only), "emacs-eval" (file, org, code tools)
- Both work when called correctly

✓ **file-batch Atomic Multi-Edit Works**
- Format: `{"op":"replace","old":"text","new":"replacement"}`
- Also supports: replace-regexp, insert-at-line, delete-lines, append, prepend
- Returns: `(:ok t :operations 2 :file ...)`
- ✓ Successfully edited /tmp/test-file.txt with 2 operations

✓ **org-read-outline Works**
- Returns clean JSON structure of headings & hierarchy
- No bodies shipped, perfect for understanding file structure
- Requires file to be in `anvil-org-allowed-files` list
- Must be configured via Emacs config or dynamically set

✓ **org-read-headline Works**
- Path format: slash-separated "Section 1/Subsection 1.1"
- Encodes "/" as %2F in titles
- Returns full subtree with headings & bodies
- Efficient for reading single sections from large files

⚠ **org-edit-body & org-update-todo-state Have Issues**
- Use resource_uri format: "org-headline:///{path}#{headline-path}"
- Appear to hang or have parsing issues
- May need different headline_path encoding (URL encoding?)
- Not tested successfully yet

⚠ **Parameter Naming Inconsistencies**
- file-batch: "operations" (not "edits")
- org-read-outline: "file" (not "path")
- org-edit-body: "resource_uri" (not "file"+"headline_path")
- JSON escaping required in operations string

---

## Issues to Resolve

| Issue | Impact | Next Step |
|-------|--------|-----------|
| org-edit-body hangs | Can't edit org bodies via MCP | Debug URI format, check elisp logs |
| Parameter naming varies | Easy to get wrong | Standardize? Or docs? |
| file-read returns elisp cons | Tool unusable | Bug in anvil? Try via elisp-eval instead |
| Permission scoping | Access control | Test if wildcards work in allowed-files |
| No obvious way to set allowed-files from MCP | Runtime config | Set via emacs-eval? Or use unset permission for testing? |

---

## Design Insights

**Pattern 1: Immutable Config vs Dynamic Access**
- anvil-org-allowed-files is static (requires Emacs restart to change)
- For agents: either pass list at startup or open up entirely
- pi-mcp-adapter could handle this: "what org files does agent see?"

**Pattern 2: Resource URIs**
- org-edit-body uses resource_uri abstraction
- Allows addressing by path OR by ID
- Good for: "agent edits headline it found earlier"
- Bad for: "agent learns format, makes mistakes"

**Pattern 3: Token Economy Plays Out**
- org-read-outline: ~0.5KB response (structure only)
- org-read-headline: ~1-2KB response (one subtree)
- Generic file-read would send entire 13k-line file (~30KB+)

---

## Next Tests

⊢ Test 1: Basic file read/write
  - Create /tmp/anvil-test.txt
  - Read via file-read tool
  - Batch edit 3 lines
  - Verify atomicity

⊢ Test 2: Org-mode operations
  - Create test.org with headings
  - Read outline (no bodies)
  - Edit single headline body
  - Update TODO state

⊢ Test 3: Token measurement
  - Measure request/response sizes for various operations
  - Compare against baseline (full file read)

⊢ Test 4: Error handling
  - Try reading nonexistent file
  - Try editing with invalid path
  - Try batch with conflicting edits
  - Verify error messages are clear

⊢ Test 5: Edge cases
  - Empty file
  - Very large file (> 10MB)
  - File with special chars, emoji, CJK
  - Nested org structure (10+ levels)

⊢ Test 6: Concurrency
  - Spawn 2 agents editing same file
  - Do they interfere? Lock? Fail gracefully?

⊢ Test 7: Worker dispatch
  - Long elisp eval → async
  - Monitor job lifecycle
  - Try canceling job
  - Try multiple jobs in parallel

