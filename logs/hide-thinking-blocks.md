# Hide Thinking Blocks Toggle

**Goal**: Implement `C-c C-p h` to toggle display of thinking blocks in new responses.

**Key constraint**: `hideThinkingBlock` is a **TUI settings flag**, not an RPC operation. No RPC needed.

---

## Implementation Complete

**Commit:** `715f7ae` — "feat: add toggle for hiding thinking blocks in new responses"

### 1. Global Variable (pi-coding-agent-render.el)

```elisp
(defvar pi-coding-agent--hide-thinking-block nil
  "Global flag to hide thinking blocks in new responses.")
```

### 2. Modified Render Function (pi-coding-agent-render.el)

```elisp
(defun pi-coding-agent--thinking-blockquote-text (text)
  "Convert normalized thinking TEXT to markdown blockquote lines.
If pi-coding-agent--hide-thinking-block is true, returns empty string."
  (if pi-coding-agent--hide-thinking-block
      ""
    (if (string-empty-p text)
        ""
      (concat "> " (replace-regexp-in-string "\n" "\n> " text)))))
```

### 3. Toggle Command (pi-coding-agent-menu.el)

```elisp
(defun pi-coding-agent-toggle-hide-thinking ()
  "Toggle hiding of thinking blocks in new responses."
  (interactive)
  (setq pi-coding-agent--hide-thinking-block (not pi-coding-agent--hide-thinking-block))
  (message "Pi: Hide thinking blocks %s" 
           (if pi-coding-agent--hide-thinking-block "on" "off")))
```

### 4. Menu Keybinding (pi-coding-agent-menu.el)

```elisp
("h" "hide thinking" pi-coding-agent-toggle-hide-thinking)
```

---

## Test Results

✅ **Programmatic test:**
```bash
emacsclient -e "(pi-coding-agent-toggle-hide-thinking)"
→ "Pi: Hide thinking blocks on"

emacsclient -e "(pi-coding-agent-toggle-hide-thinking)"
→ "Pi: Hide thinking blocks off"
```

✅ **Toggle works correctly**

**Behavior:**
- New responses will respect the flag
- Thinking blocks suppressed if flag is true
- No RPC involved (pure Emacs state)
- Affects only future responses (not retroactive)

**Status:** ✅ Implementation complete. Ready to test with live agent response.

