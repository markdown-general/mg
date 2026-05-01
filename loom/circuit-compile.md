# circuit-compile

Dashboard and build coordination system for cabal projects in ~/haskell/*.

## status legend

🟣 queue — waiting to build
🔵 building — build in progress
🟢 success — builds cleanly
🟠 warning — builds with warnings
🔴 error — build fails

## repos

🟣 agent
🟣 agent-fork
🔴 anal
🟣 box
🟣 box-socket
🟠 cabal-graph
🟣 calculational
🟠 chart-svg
🔴 chart-svg-dev
🟣 circuits
🟣 dataframe-load
🟣 dotparse
🟣 ephemeral
🟣 eulerproject
🟣 formatn
🟣 grepl
🟠 harpie
🟣 harpie-numhask
🟣 hcount
🟠 huihua
🔴 markup-parse
🟠 mealy
🟣 memo
🟠 mnet
🟠 mpar
🟠 mtok
🟣 numhask
🟠 numhask-space
🟣 perf
🟠 poker-fold
🟣 prettychart
🔴 repl-viewport
🟣 semcons
🔴 sysl
🟣 web-rep
🟠 words

---

## reset dashboard

Wipe and regenerate from ~/haskell/ directory. All repos start as 🟣 (queue).

```elisp
(defun agent-update-reset ()
  "Reset haskell-compile.md dashboard to initial state with all repos in queue (🟣).
Reads repo list from ~/haskell/ directory."
  (interactive)
  (let* ((haskell-dir (expand-file-name "~/haskell/"))
         (repos (directory-files haskell-dir nil "^[^.]" t))
         (repos-sorted (sort repos #'string<)))
    (with-current-buffer "haskell-compile.md"
      (erase-buffer)
      (insert "# haskell-compile\n\n")
      (insert "Dashboard for parallel cabal build coordination across ~/haskell/* repos.\n\n")
      (insert "## status legend\n\n")
      (insert "🟣 queue\n")
      (insert "🔵 building\n")
      (insert "🟢 success\n")
      (insert "🟠 warning\n")
      (insert "🔴 error\n\n")
      (insert "## repos\n\n")
      (dolist (repo repos-sorted)
        (insert (format "🟣 %s\n" repo)))
      (insert "\n---\n\n")
      (insert "## results\n\n")
      (insert "(builds report below)\n")
      (save-buffer)
      (message "Dashboard reset: %d repos ready to build" (length repos-sorted)))))
```

Load with: `M-x eval-region` or `(load-file "~/mg/loom/agent-update.el")`

---

## update status

Update a single repo line in dashboard with emoji + summary.

```elisp
(defun agent-update-status (repo status summary)
  "Update repo status in haskell-compile.md buffer.
REPO: repo name (e.g., 'agent')
STATUS: circle emoji (🟣, 🔵, 🟢, 🟠, 🔴)
SUMMARY: text to append after the status"
  (with-current-buffer "haskell-compile.md"
    (goto-char (point-min))
    (let ((pattern (concat "^[🟣🔵🟠🔴🟢] " (regexp-quote repo) "\\( .*\\)?$")))
      (if (re-search-forward pattern nil t)
          (progn
            (replace-match (format "%s %s - %s" status repo summary))
            (message "Updated %s to %s" repo status))
        (message "Not found: %s" repo)))))
```

---

## build loop

Find next 🟣 repo in dashboard, build it, parse output, update status.

Run multiple instances in parallel (one per core, or manually):

```bash
#!/bin/bash
# Build loop: coordinate via dashboard buffer in emacs

# Load the elisp functions
emacsclient -e '(load-file "~/mg/loom/agent-update.el")'

# Agent number (passed as argument)
AGENT_ID=${1:-1}

# Loop: find next purple (🟣) repo and build it
while true; do
  # Read the dashboard buffer and find first 🟣 repo (search past legend, start from ## repos)
  REPO=$(emacsclient -e '(with-current-buffer "haskell-compile.md" (goto-char (point-min)) (re-search-forward "^## repos" nil t) (when (re-search-forward "^🟣 \\\\([^ \\n]+\\\\)" nil t) (substring-no-properties (match-string 1))))' 2>/dev/null | tr -d '"' | grep -v "^nil$")
  
  # If no more purple repos, exit
  if [ -z "$REPO" ]; then
    echo "Agent $AGENT_ID: no more repos to build"
    break
  fi
  
  # Mark as building (blue)
  emacsclient -e "(agent-update-status \"$REPO\" \"🔵\" \"building...\")" 2>/dev/null
  emacsclient -e '(with-current-buffer "haskell-compile.md" (save-buffer))' 2>/dev/null
  
  # Run the build
  cd ~/haskell/"$REPO" || continue
  BUILD_OUTPUT=$(cabal build 2>&1)
  BUILD_EXIT=$?
  
  # Parse output for errors and warnings
  if [ $BUILD_EXIT -eq 0 ]; then
    # Check for warnings in output
    if echo "$BUILD_OUTPUT" | grep -iq "warning"; then
      WARNINGS=$(echo "$BUILD_OUTPUT" | grep -i "warning" | head -1 | cut -c1-60)
      emacsclient -e "(agent-update-status \"$REPO\" \"🟠\" \"warnings: $WARNINGS\")" 2>/dev/null
    else
      emacsclient -e "(agent-update-status \"$REPO\" \"🟢\" \"build successful\")" 2>/dev/null
      emacsclient -e '(with-current-buffer "haskell-compile.md" (save-buffer))' 2>/dev/null
    fi
  else
    # Extract error summary
    ERRORS=$(echo "$BUILD_OUTPUT" | grep -i "error" | head -1 | cut -c1-60)
    SUGGESTION=$(echo "$BUILD_OUTPUT" | grep -iq "allow-newer" && echo "check allow-newer" || echo "see build log")
    emacsclient -e "(agent-update-status \"$REPO\" \"🔴\" \"$ERRORS - $SUGGESTION\")" 2>/dev/null
    emacsclient -e '(with-current-buffer "haskell-compile.md" (save-buffer))' 2>/dev/null
  fi
done

echo "Agent $AGENT_ID: done"
```

---

## results

(Builds update dashboard in real-time as they complete)

