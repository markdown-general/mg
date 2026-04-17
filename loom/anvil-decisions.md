# Anvil Decisions — Path Forward

**Date:** 2026-04-18

---

## Decision 1: File-Read Bug Fix

**Issue:** anvil-file--tool-read doesn't convert result to string (returns cons instead).

**Options:**

### A. Patch anvil.el locally (in ~/.config/doom/)
```elisp
(advice-add 'anvil-file--tool-read :filter-return
  (lambda (result) (if (consp result) (format "%S" result) result)))
```
- Pro: Fixes immediately, local to our setup
- Con: Maintenance burden if anvil updates

### B. Use emacs-eval workaround (as documented)
```elisp
emacs-eval: (anvil-file-read "/path")
```
- Pro: No patching, upstream fix available
- Con: Two-step (read via eval, not via file-read tool)

### C. File issue with anvil upstream
- Pro: Gets fixed for everyone
- Con: Delayed, not our responsibility

**Decision:** **Go with B (emacs-eval workaround)** for now.
- Gives upstream time to fix
- Our documentation already shows the pattern
- Org-mode reads use org-read-file/org-read-headline anyway (those work)

---

## Decision 2: Special Character Handling

**Issue:** JSON-in-JSON escaping is tricky. Emoji works, quotes need care.

**Options:**

### A. Build operations via shell script (careful escaping)
- Pro: Works, transparent
- Con: Fragile, easy to get wrong

### B. Use jq or Python to build JSON
- Pro: Safer, handles edge cases
- Con: Adds dependency (jq should be available)

### C. Use emacs-eval to build and execute batch operations
```elisp
emacs-eval: (anvil-file-batch "/path" '(((:op . replace) (:old . "x") (:new . "y"))))
```
- Pro: No JSON escaping issues
- Con: Agents must write elisp (not ideal)

**Decision:** **Use jq (Option B) for pi-mcp-adapter.**

Pi's environment already has jq available. The adapter can safely build JSON operations without shell quoting nightmares.

---

## Decision 3: Allowed Files Scope

**Issue:** anvil-org-allowed-files must be set before tools run.

**Current:** Set in ~/.config/doom/config.el to ~/org/, ~/mg/, ~/self/

**Options:**

### A. Open it up (allow any file)
```elisp
(setq anvil-org-allowed-files-enabled nil)
```
- Pro: Agents have full freedom
- Con: No security boundary

### B. Keep restricted list (current)
```elisp
(setq anvil-org-allowed-files (list (expand-file-name "~/org") ...))
```
- Pro: Scope limited to known areas
- Con: Agents can't discover/edit other org files

### C. Make it configurable via environment
```elisp
(setq anvil-org-allowed-files (split-string (or (getenv "ANVIL_ORG_PATHS") "~/org:~/mg:~/self") ":"))
```
- Pro: Flexible per-session
- Con: Added complexity

**Decision:** **Keep Option B + document it.**

Our files are in ~/org/, ~/mg/, ~/self/. That's enough. If we need more, we can add them to config.el.

---

## Decision 4: Tool Return Format

**Issue:** Inconsistent returns (elisp sexp vs JSON vs text).

**Current State:**
- file-batch returns: `(:ok t :operations 2 :file ...)`
- org-read-outline returns: JSON
- org-read-headline returns: Org text

**Options:**

### A. Accept inconsistency (current)
- Pro: No changes needed
- Con: Agent parsing is complex

### B. Wrap anvil tools in pi-mcp-adapter converter
- Standardize all returns to JSON
- Extract :content from file-batch results
- Parse elisp returns into JSON
- Pro: Agents see consistent interface
- Con: Adapter layer adds processing

### C. File feature request with anvil
- Ask for consistent JSON returns
- Pro: Upstream solution
- Con: Delayed

**Decision:** **Option B - build converter in pi-mcp-adapter.**

The adapter is the right place for this. It can present a clean, consistent JSON interface to pi agents while anvil does its thing internally.

---

## Decision 5: Org-Edit-Body Hang

**Issue:** org-edit-body and org-update-todo-state hang when called.

**Status:** Needs investigation, probably resource_uri format.

**For Now:** 
- Document that org write tools are not ready
- Focus on file operations (read, batch edit)
- Org-mode tools need separate testing

**Later:** 
- Debug the hang (is it elisp deadlock? URI parsing issue?)
- Test org-write operations when working

---

## Summary: Path Forward

1. **File Operations Ready for Pi:**
   - file-batch ✓ (edit/replace)
   - file-append ✓ (write)
   - emacs-eval + anvil-file-read ✓ (read, via workaround)

2. **Org-Mode Operations:**
   - org-read-outline ✓ (read structure)
   - org-read-headline ✓ (read single section)
   - org-edit-body ✗ (hang, needs debug)
   - org-update-todo-state ✗ (hang, needs debug)

3. **Next Action:**
   - Build pi-mcp-adapter extension with:
     - File read/write/edit tools
     - Consistent JSON output interface
     - jq-based JSON building for operations
   - Test with real pi agents (Claude, OpenAI, Gemini)
   - Measure token savings vs pi default edit tool

4. **Defer:**
   - Org write operations (file issues to debug later)
   - Large file testing (10MB+ files)
   - Concurrent access patterns

