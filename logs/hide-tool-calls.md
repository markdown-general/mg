# Hide Tool Calls and Results Toggle

**Goal**: Implement `C-c C-p C` to toggle display of tool calls/results in new responses.

Same pattern as thinking blocks: pure Emacs state, no RPC.

---

## Implementation

**Commit:** `43a3355` — "feat: add toggle for hiding tool calls and results"

### 1. Global Variable (pi-coding-agent-render.el)

```elisp
(defvar pi-coding-agent--hide-tool-calls nil
  "Global flag to hide tool calls and results in new responses.")
```

### 2. Toggle Command (pi-coding-agent-menu.el)

```elisp
(defun pi-coding-agent-toggle-hide-tool-calls ()
  "Toggle hiding of tool calls and results in new responses."
  (interactive)
  (setq pi-coding-agent--hide-tool-calls (not pi-coding-agent--hide-tool-calls))
  (message "Pi: Hide tool calls %s"
           (if pi-coding-agent--hide-tool-calls "on" "off")))
```

### 3. Menu Keybinding (pi-coding-agent-menu.el)

```elisp
("C" "hide tools" pi-coding-agent-toggle-hide-tool-calls)
```

---

## Test Results

✅ **Toggle works:**
```bash
emacsclient -e "(pi-coding-agent-toggle-hide-tool-calls)"
→ "Pi: Hide tool calls on"

emacsclient -e "(pi-coding-agent-toggle-hide-tool-calls)"
→ "Pi: Hide tool calls off"
```

**Status:** ✅ Infrastructure complete (variable + toggle + keybinding). Render function wiring in progress.

---

## Render Wiring (In Progress)

Need to guard `display-tool-start`, `display-tool-update`, `display-tool-streaming-text` with:

```elisp
(unless pi-coding-agent--hide-tool-calls
  ;; ... function body
  )
```

Paren balancing is tricky with Python. Better approach: manually edit in Emacs, test snippets, commit when working.

**Pattern established:** Infrastructure ready for render integration.

