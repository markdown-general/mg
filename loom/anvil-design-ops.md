# Anvil: Design & Operations — Discussion

**Status:** Learning through testing. What patterns emerge?

---

## Design Question 1: Permission Scoping

**Current State:** `anvil-org-allowed-files` is a static Lisp list.

**Problem for Agents:**
- Must be configured at Emacs startup
- No runtime way for agent to change scope
- Dynamic discovery of "what can I access?" not supported

**Options:**
1. **All-or-nothing** ⟜ `(setq anvil-org-allowed-files '(t))` to allow any org file
   - Simplest for agent freedom
   - No security isolation

2. **Config upfront** ⟜ Set list in ~/.config/doom/config.el
   - Works for known workflows (e.g., ~/org/**, ~/mg/**)
   - Breaks for: "agent discovers user has new org files"

3. **Emacs-eval bridge** ⟜ Agent calls `emacs-eval` to change allowed-files
   - Runtime control ✓
   - Requires agent to know Lisp syntax (not ideal)
   - Could wrap in skill/instruction

4. **Per-path whitelist in pi-mcp-adapter** ⟜ Adapter layer handles auth
   - Agent sees: "which org files can I see"
   - Adapter enforces: "agent can only see these paths"
   - Pi extension controls scope, not Emacs

**Best for mg?** Option 4 (defer to pi layer) or Option 2 (predefined scope).

---

## Design Question 2: Resource URIs vs Paths

**Current:** org-edit-body uses `org-headline:///path#headline-path`

**Problem:**
- Headline path needs URL encoding
- Format is opaque to agent (can't construct from first principles)
- Fragile: "agent reads outline, tries to edit, wrong URI format = hang"

**Options:**

1. **Keep URIs, standardize encoding**
   - URI is canonical (survives IDs that change)
   - Encode strictly, document well
   - Agent must remember format from tool discovery

2. **Switch org tools to path-based**
   - "file + headline_path" (like org-read-outline)
   - Consistent across all org tools
   - Lose ID-based addressing (but rarely needed?)

3. **Dual interface**
   - org-edit-body accepts BOTH resource_uri AND (file + headline_path)
   - Tool schema shows both patterns
   - Agent picks whichever it got from read operation

**Best for mg?** Option 2 (consistency) or Option 3 (flexibility).

**Action:** Check if anvil maintainers have considered this.

---

## Design Question 3: Tool Return Types

**Observation:** Some tools return elisp sexp strings, some return JSON.

| Tool | Returns | Format |
|------|---------|--------|
| file-batch | `(:ok t :operations 2 ...)` | Elisp sexp as string |
| org-read-outline | JSON structure | JSON string |
| org-read-headline | Org text | Plain text |
| file-read | ??? | (Errored, returned cons) |

**Problem:**
- Agent has to parse 3 different formats
- Inconsistent return types = more error handling

**Option:**
- Standardize: all tools return JSON or all return text
- Or: clearly document which returns what

**Best for mg?** JSON for all (easiest for pi agents to handle).

---

## Design Question 4: Asyncevs Sync

**Current:** 
- emacs-eval: sync, < 30s timeout
- emacs-eval-async: fire-and-forget, poll for result

**For Agents:**
- Sync tools are simpler (call → immediate result)
- Async tools are cheaper (don't block while waiting)
- Agent needs to: spawn job, poll, handle timeout

**Pattern in mg:**
- Most file ops should be fast (sync)
- Org tangles, git operations, compiles → async
- How does pi-mcp-adapter expose this choice?

**Options:**
1. **Adapter hides async** ⟜ Poll automatically, return result (agent sees: sync)
2. **Adapter exposes async** ⟜ Tool returns job ID, separate poll tool (agent decides)
3. **Heuristic** ⟜ Adapter times operation, switches to async if slow

**Best for mg?** Option 1 (simplest) with Option 2 available for power users.

---

## Operational Question 1: Error Recovery

**Observed Issues:**
- org-edit-body hangs (no clear error)
- file-read returns wrong type
- URI format mismatches fail silently

**For Operations:**
- How do agents know if tool call is stuck?
- How do we debug "why didn't org-edit-body work?"
- Can we kill a hung MCP tool?

**Pi Patterns:**
- Tool timeouts (global or per-tool)?
- Error logging to session (so forensics are available)?
- Retry + circuit breaker patterns?

**Action:** Test tool timeouts, add error instrumentation.

---

## Operational Question 2: Large Files

**Anvil Claim:** Handles 1.2MB org files safely.

**To Test:**
- Create 10k-line org file
- Read outline (should be fast, small)
- Read one headline in middle (should ship only that subtree)
- Batch edit 5 lines (should be atomic)
- Measure response sizes & times

**Expected:** Should see 90%+ token savings vs reading whole file.

**For mg:** org files are usually < 500KB. Verify with real data.

---

## Operational Question 3: Concurrent Access

**Scenario:** Two agents editing same file simultaneously.

**Current State:** Unknown. Likely one wins, one fails or overwrites.

**For mg:**
- Agents might fork and work in parallel
- Both want to edit ~/mg/some-file.md
- Who wins?

**Options:**
1. **Last-write wins** ⟜ No locking, agent B overwrites A
2. **First-edit wins** ⟜ Lock acquired, agent B fails with "file busy"
3. **Merge** ⟜ Apply both edits (if non-overlapping)

**Current anvil behavior:** Unknown, needs testing.

**For mg:** Probably OK with "first wins" (agents can retry), test to confirm.

---

## Summary of Next Actions

| Priority | Action | Owner | Impact |
|----------|--------|-------|--------|
| 1 | Fix org-edit-body hang (URI format?) | Test | Can't edit org bodies |
| 2 | Test file-read (why returns cons?) | Test | Blocks reading files via MCP |
| 3 | Document permission model | Design | Security, agent freedom |
| 4 | Test large file (10k lines) | Ops | Verify token savings claims |
| 5 | Test concurrent access | Ops | Parallel agent safety |
| 6 | Standardize tool return types | Design | Agent error handling |

---

## Philosophy: Anvil as Capability, Not Abstraction

**Key insight:** Anvil doesn't hide Emacs. It *exposes* Emacs.

This means:
- Agents see elisp types (cons cells, symbols)
- Agents see Org structure (headings, properties, IDs)
- Agents see file paths and permission boundaries
- Not a simplified "unified interface" to text files

**Implications:**
- Agents need to understand Emacs/Org semantics
- But they get full power (can call elisp directly)
- pi-mcp-adapter becomes translator layer (elisp → JSON schema)

**For mg:** This is good. Emacs is our shared tool.

Agents who understand Emacs idioms (org-mode, elisp, dired) can do more.

We're not hiding complexity. We're *bridging* to it.

