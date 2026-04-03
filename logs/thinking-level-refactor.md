# Thinking Level Selection (Refactored)

**Goal**: Split `pi-coding-agent-select-thinking-level` into:
- Programmatic version ⟜ can be called by agent or scripts
- Interactive version ⟜ UI layer with completing-read

This allows testing without needing interactive minibuffer input.

---

## Programmatic Backend

```elisp
(defun pi-coding-agent-set-thinking-level (level)
  "Set thinking level directly (programmatic).
LEVEL should be one of: minimal, low, medium, high, off."
  (let ((chat-buf (pi-coding-agent--get-chat-buffer))
        (input-buf (pi-coding-agent--get-input-buffer)))
    (when (buffer-live-p chat-buf)
      (with-current-buffer chat-buf
        (when-let ((proc (pi-coding-agent--get-process)))
          (pi-coding-agent--rpc-async proc (list :type "set_thinking_level"
                                                 :level level)
                     (lambda (resp)
                       (when (plist-get resp :success)
                         (with-current-buffer chat-buf
                           (pi-coding-agent--update-state-from-response resp)
                           (force-mode-line-update))
                         (when (buffer-live-p input-buf)
                           (with-current-buffer input-buf
                             (force-mode-line-update)))
                         (message "Pi: Thinking level set to %s" level)))))))))
```

**Key insight:** Must call `pi-coding-agent--get-process` while chat buffer is current.

---

## Interactive Frontend

```elisp
(defun pi-coding-agent-select-thinking-level ()
  "Select a thinking level via completing-read (interactive UI)."
  (interactive)
  (let* ((levels '("minimal" "low" "medium" "high" "off"))
         (current-level (or (plist-get pi-coding-agent--state :thinking-level) "medium"))
         (choice (completing-read
                  (format "Thinking level (current: %s): " current-level)
                  (mapcar (lambda (x) (list x)) levels) nil t)))
    (when (and choice (not (equal choice current-level)))
      (pi-coding-agent-set-thinking-level choice))))
```

---

## Integration in Menu

Transient menu keybinding (line ~883):

```elisp
("T" "select level" pi-coding-agent-select-thinking-level)
```

---

## Test Results

**Final commit:** `e0b68e0` — "fix: call pi-coding-agent--get-process inside chat buffer context"

✅ **Programmatic test (verified working):**
```bash
emacsclient -e "(with-current-buffer \"*pi-coding-agent-chat:~/outside/*\" (pi-coding-agent-set-thinking-level \"high\"))"
```

Header updates instantly: `Haiku 4.5 • high idle ...` ✓

✅ **Interactive test:** `C-c C-p T` shows menu, selection updates header

**Benefits:**
- Programmatic control: callable from bash, scripts, agents
- UI layer stays separate (completing-read wrapper)
- Both paths use same RPC mechanism
- Buffer context properly managed
- Header-line refreshes in both chat and input buffers

**Status:** ✅ T keybinding working. Ready for next: hide thinking blocks (h).

