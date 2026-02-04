# end-of-card protocol ⟜ close + clean + capture + commit

Run this after a card is complete. Leaves markdown-general pristine. Captures lessons to ltm.md. Ships a clean commit.

---

## Phase 1: Assessment ⊢ read state ⊣

```bash
git status                    # what changed?
git diff --cached             # staged changes
git diff                      # unstaged
ls -la yin/log/              # temp files from session
find . -name "*.txt" -type f # orphaned prompts, temp junk
```

**Inventory:**
⟜ Staged changes (renames, deletions, files ready to commit)
⟜ Unstaged modifications (edited cards, updates in progress)
⟜ Untracked files (new cards, logs, artifacts)
⟜ Temp files (*.txt prompts, session dumps)

---

## Phase 2: Integrity ⊢ check + prune ⊣

**Broken links?**
```bash
rg --type md '\[.*\]\(.*\.md\)' . | while read line; do
  path=$(echo "$line" | sed -E 's/.*\(([^)]+\.md)\).*/\1/')
  [ ! -f "$path" ] && echo "ORPHAN: $path"
done
```

**Orphaned files?** (unreferenced .md files)
```bash
find . -name "*.md" -type f | while read f; do
  grep -q "$(basename $f .md)" **/*.md || echo "ORPHAN: $f"
done
```

**Semantic drift?** (card content vs filename, internal inconsistency)
⟜ Read the completed card; does it match its purpose?
⟜ Read modifications; do they cohere or scatter?
⟜ Spot fake work (busy-ness without signal)

**Action:**
⟜ Fix broken links
⟜ Delete orphans or relocate to yard/ (experimental)
⟜ Flag coherence issues; don't ship inconsistency

---

## Phase 3: Extraction ⊢ insights → ltm ⊣

Read the completed card + logs. Ask:

**What landed?**
⟜ What patterns emerged?
⟜ What was unclear? How was it clarified?
⟜ What assumptions proved wrong?

**What's still fuzzy?**
⟜ Gaps identified (name them)
⟜ Concepts that need more time
⟜ Questions unanswered

**What's reusable?**
⟜ Priming sequences that worked
⟜ Tone shifts that landed
⟜ Structural patterns (deck shapes, notation)

**What goes to ltm.md?**

Format:
```
✓ Card: [name] ✓
  ⟜ Key finding 1
  ⟜ Key finding 2
  ~ Caution or contrast
  ? Open question
  → Next step or reusable artifact
```

---

## Phase 4: Cleanup ⊢ tidy repo ⊣

**Move/organize untracked files:**
```bash
# Logs stay in yin/log/ (dated, archived)
# Temp prompts (.txt) → delete or move to yin/temp/ (gitignored)
# Completed cards → work/ or yin/ (depends on usage)
# Experimental branches → yard/ (versioned but separated)
```

**Stage what's ready:**
```bash
git add work/[card-name].md    # new completed card
git add ltm.md                 # updated memory
git rm log/[old-file].md       # if obsolete
git add .                      # stage everything clean
```

**Review staged state:**
```bash
git status  # should be clear, no surprises
git diff --cached --stat  # what's going in
```

---

## Phase 5: Commit ⊢ ship it ⊣

**Commit message pattern:**

```
card: [card-name] ⟜ one-liner of the insight

- key finding 1
- key finding 2
~ contrasting note or caution
→ next phase or reusable artifact
```

Example:
```
card: yin-start ⟜ startup protocol reaches 4.5/5 readiness

- tone shift more impactful than score increase
- shorter cards compress better than elaborate explanations
- direct naming of concepts beats implicit understanding
~ danger: undefined terms trigger fake work
→ deploy in live Flow⟜Work⟜Breathe cycles; see yin/log/NEXT-PHASE.md
```

**Ship:**
```bash
git commit -m "card: [name] ⟜ insight"
git log --oneline -3  # verify
```

---

## Checklist (copy & adapt)

- [ ] Phase 1: `git status` shows what changed; inventory clear
- [ ] Phase 2: Broken links fixed; orphans moved or deleted
- [ ] Phase 2: Card content matches filename; no semantic drift
- [ ] Phase 3: Insights extracted and written to ltm.md
- [ ] Phase 4: Temp files cleaned; untracked files organized
- [ ] Phase 4: `git status` clean (only intended changes staged)
- [ ] Phase 5: Commit message captures essence + next signal
- [ ] Phase 5: `git log --oneline` shows clean commit history
- [ ] Final: `git status` clean (nothing to commit, working tree clean)

---

## Tips

**Don't ship noise:**
⟜ If a log or artifact isn't referenced, it's clutter
⟜ Temp prompts (*.txt) clutter the working tree; move to gitignored dir or delete
⟜ Yarn balls of experiment belong in yard/, not work/

**Commit hygiene:**
⟜ One card completion = one logical commit
⟜ Message should be greppable (card: [name] as prefix)
⟜ Include a reference to ltm entry or next phase

**ltm.md is cumulative:**
⟜ Don't replace; append with ✓ Card: [name] ✓
⟜ Use consistent format for scanning
⟜ Link to completed cards or yin/log/ artifacts if relevant

---

**This protocol lives here.** Refine it with each card completion.
