## pi-vcc testing ⟜ compression on real sessions

🟢 target ⟜ compress old agent sessions, measure compression, test recall

---

## sessions inventory

**By project (session count | total size | largest session):**

| Project | Count | Total | Largest |
|---------|-------|-------|---------|
| **mg** | 123 | 59MB | 1.18MB |
| **outside** | 45 | 15MB | 2.53MB |
| **markdown-general** | 22 | 11MB | 2.53MB |
| **self** | 24 | 8.3MB | 1.35MB |
| **haskell-semcons** | 117 | 1.4MB | 0.02MB |
| **repos-traced** | 1 | 1.1MB | 1.07MB |
| **self-stuff** | 1 | 728KB | 0.71KB |
| **repos-pi-mono** | 2 | 592KB | 0.28MB |
| **(root)** | 7 | 1.2MB | 0.45MB |

**Total:** 432 sessions, ~116MB

---

## experiment: run pi-vcc on sample sessions

**Goal:** 
- Measure compression ratio on real sessions
- Verify `vcc_recall` finds old history
- Test graceful handling of varied session sizes
- Compare before/after readability

**Sessions to test:**
1. **mg** largest ⟜ 1.18MB (good size for measuring compression)
2. **markdown-general** largest ⟜ 2.53MB (largest overall)
3. **outside** largest ⟜ 2.53MB (verify consistency)

Find them:
```bash
# List mg sessions by size
ls -lhS ~/.pi/agent/sessions/--Users-tonyday567-mg--/*.jsonl | head -5

# Pick one for testing
SESSION="~/.pi/agent/sessions/--Users-tonyday567-mg--/2026-03-04T01-23-01-827Z_8b5c56e2-4f6c-402e-be31-528a70525dd3.jsonl"
```

---

## workflow: compress a session

**1. Open session**
```bash
pi -s <session-file>
```
(or use `pi` + `/resume` to pick from menu)

**2. Trigger compression**
```
/pi-vcc
```

(Since `overrideDefaultCompaction: true`, this also handles `/compact`)

**3. Watch compression**
- Widget shows live progress
- `/tmp/pi-vcc-debug.json` (if debug mode enabled) shows detailed stats

**4. Verify recall works**

After compaction, agent only sees summary. But history is fully searchable:

```
/pi-vcc-recall auth          # Search old history
/pi-vcc-recall hook|inject   # Regex search
/pi-vcc-recall scope:all     # Search across all branches
```

**5. Compare sizes**
```bash
# Before
wc -c <session-file>

# After
# Open compressed session, save, then:
wc -c <compressed-session-file>
```

---

## measurement template

For each test session, capture:

| Aspect | Value |
|--------|-------|
| **Session** | filename |
| **Original size** | bytes |
| **Message count** | N |
| **Compaction time** | ms |
| **After compression** | bytes |
| **Reduction** | % |
| **Sections generated** | Goal, Files, Commits, Context, Preferences, Transcript |
| **Recall test 1** | query result count |
| **Recall test 2** | regex pattern match count |
| **Issues** | (none, truncation, missing history, etc.) |

---

## batch compression

To compress all sessions in a project (faster):

```bash
#!/bin/bash
# Compress all mg sessions using pi-vcc

SESSIONS_DIR=~/.pi/agent/sessions/--Users-tonyday567-mg--

for session in "$SESSIONS_DIR"/*.jsonl; do
  echo "Processing: $(basename $session)"
  
  # Get size before
  before=$(stat -f%z "$session" 2>/dev/null || stat -c%s "$session")
  
  # Compress via pi (non-interactive, using pi-vcc as default)
  pi -s "$session" -p "
    /pi-vcc
    /exit
  " 2>&1 | tail -5
  
  # Get size after
  after=$(stat -f%z "$session" 2>/dev/null || stat -c%s "$session")
  
  ratio=$(echo "scale=1; (100 - (after * 100 / before))" | bc)
  echo "Before: ${before}b | After: ${after}b | Reduction: ${ratio}%"
  echo ""
done
```

(This is pseudocode — pi doesn't have a `-p` prompt flag. Use interactive mode or `/reload` between sessions.)

---

## things to watch for

**Graceful degradation:**
- Short sessions (< 10KB) ⟜ compression may be small or negative (overhead)
- Long sessions (> 10MB) ⟜ should see 90%+ reduction
- Sessions with no git ⟜ [Commits] section won't appear (normal)
- Sessions with no file edits ⟜ [Files And Changes] section won't appear (normal)

**Recall edge cases:**
- Search across compactions ⟜ use `scope:all` to find off-lineage history
- Pagination ⟜ `/pi-vcc-recall query page:2` for result set 2
- Expand specific entries ⟜ `/pi-vcc-recall expand:41,42` for full untruncated content
- Tool result truncation ⟜ pi core truncates at save time; `expand` can't recover what's already cut

**Quality checks:**
- Can you find recent context? ⟜ `/pi-vcc-recall token refresh` should find auth changes
- Does transcript make sense? ⟜ Tool calls collapsed, text truncated, but flow readable?
- Are sections accurate? ⟜ Goal matches initial intent? Files match actual edits?

---

## hypothesis

**Symmetric compression:**

If compression ratio is consistent across sessions (regardless of size, age, complexity), pi-vcc is treating all sessions equally. No human/agent bias.

**Recall reliability:**

If `/pi-vcc-recall` finds context equally well in:
- Recently compacted sessions
- Sessions compacted 2+ times (merged sections)
- Sessions from 2+ months ago

Then history is truly lossless for both humans and agents.

---

## results destination

Create `logs/pi-vcc-test-results.md` to track findings:

```markdown
## pi-vcc compression test results

Date: <date>
Sessions tested: <N>
Total original: <size>
Total compressed: <size>
Overall reduction: <percentage>

### Session samples

| Session | Before | After | Reduction | Recall test | Issues |
|---------|--------|-------|-----------|-------------|--------|
| ... | ... | ... | ... | ... | ... |
```

---

## next: analyze results

After running tests:
1. **Plot compression ratio by session size** ⟜ See if larger sessions compress better
2. **Measure recall accuracy** ⟜ Count search hits, check false positives/negatives
3. **Compare section quality** ⟜ Do extracted goals/files match reality?
4. **Test merge behavior** ⟜ Compact same session twice, verify sections merge cleanly
5. **Check for bias** ⟜ Is compression/recall symmetric across session types?

---

## refs

⟜ [pi-vcc card](pi-vcc.md) ⟜ quick reference
⟜ [pi-vcc repo](https://github.com/sting8k/pi-vcc) ⟜ source code
⟜ [session.md](../../docs/session.md) ⟜ pi session storage internals
