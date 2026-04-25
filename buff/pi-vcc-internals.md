## pi-vcc internals ⟜ understanding compression architecture

🟢 deep dive ⟜ How pi-vcc compresses sessions and builds searchable history

---

## pipeline overview

**Input:** Raw pi session messages (user, assistant, toolCall, toolResult, thinking)

**Pipeline:**
1. **Normalize** ⟜ Convert raw messages to uniform blocks
2. **Filter noise** ⟜ Strip system messages, empty content
3. **Extract sections** ⟜ Parse goals, files, commits, preferences, blockers
4. **Build transcript** ⟜ Chronological flow with tool calls collapsed to one-liners
5. **Format sections** ⟜ Render each section as markdown
6. **Merge with previous** ⟜ If session was already compacted, merge sections intelligently
7. **Output** ⟜ Bounded summary + brief transcript + recall note

---

## step 1: normalize

**Input:** Message objects from pi

**Process:** Convert to uniform "blocks"

```typescript
// Each message becomes NormalizedBlock[] (can expand to multiple blocks)
user message    → [{ kind: "user", text, sourceIndex }]
assistant text  → [{ kind: "assistant", text, sourceIndex }]
tool call       → [{ kind: "tool_call", name, args, sourceIndex }]
tool result     → [{ kind: "tool_result", name, text, isError, sourceIndex }]
thinking        → [{ kind: "thinking", text, redacted, sourceIndex }]
```

**Why:** Uniform structure makes extraction easier. sourceIndex preserves message order.

---

## step 2: filter noise

**Input:** Blocks

**Process:** Drop system messages, empty blocks, pure whitespace

**Output:** Filtered blocks

This is lightweight — mostly just `if (!block.text.trim()) skip;`

---

## step 3: extract sections

Five extractors run in parallel over normalized blocks:

### 3a. Session Goal

**Regex patterns:**
- `TASK_RE` ⟜ matches "fix|implement|add|create|refactor|debug|investigate|..."
- `SCOPE_CHANGE_RE` ⟜ matches "instead|actually|change of plan|switch to|pivot|..."
- Filter noise (one-word responses like "ok", "yes") via `NOISE_SHORT_RE`
- Reject pasted output, code, paths via `NON_GOAL_RE`

**Algorithm:**
1. Collect substantive lines from first user message → goal seed
2. Continue through blocks, looking for scope changes
3. When SCOPE_CHANGE_RE matches in leading 200 chars, capture next 1-3 lines as scope change
4. Cap at 8 total goals

**Example:**
```
Input user block:  "Fix auth bug. Instead, add token refresh too."
Output goals:
  - Fix auth bug
  - [Scope change]
  - Add token refresh
```

### 3b. Files And Changes

**Tool-based extraction:**
- `FILE_READ_TOOLS` = {Read, read_file, View}
- `FILE_WRITE_TOOLS` = {Edit, Write, edit, write}
- `FILE_CREATE_TOOLS` = {Write, write, write_file}

**Algorithm:**
1. Scan all tool_call blocks
2. Extract file_path from each call
3. Bucket into read / modified / created sets
4. Dedup: if file in modified, remove from created (existed before)
5. Find longest common directory prefix among all paths
6. Trim paths relative to prefix for readability
7. Cap each category at 10 visible entries, suffix with (+N more)

**Example:**
```
Tool calls:
  write "src/auth/session.ts"
  read "src/auth/session.ts"
  write "tests/auth.test.ts"

Output:
  - Modified: auth/session.ts
  - Created: tests/auth.test.ts
```

### 3c. Commits

**Extraction:** Regex match `^[0-9a-f]{7,}: ` on assistant and user blocks

**Algorithm:**
1. Find all lines matching commit hash pattern
2. Extract hash + first line of commit message
3. Keep last 8 commits
4. Format as "a1b2c3d: fix(auth): message"

### 3d. User Preferences

**Regex patterns:** `always`, `never`, `prefer` followed by substantive phrase

**Algorithm:**
1. Scan user blocks for preference statements
2. Extract full sentence (up to 150 chars)
3. Deduplicate against session goals (avoid "prefer X" if already in goals)
4. Cap at 15 items

**Example:**
```
User: "Always run tests before committing"
Output: - Always run tests before committing
```

### 3e. Outstanding Context (Blockers)

**Regex patterns:** `fail|broken|cannot|blocked|crash|error|still.*failing`

**Algorithm:**
1. Look at tail 20 blocks (recent activity)
2. Find lines matching blocker pattern
3. Skip single-word lines, continuation fragments, parentheticals
4. Require sentence-like start (capital letter or code identifier)
5. Attach tool_result errors with `[toolname]` prefix
6. Cap at 5 items

**Example:**
```
Tool result error: bash failed
User message: "Still broken on line 42"
Output:
  - [bash] Exit code 1
  - Still broken on line 42
```

---

## step 4: build transcript

**Input:** Normalized blocks

**Process:** Create chronological flow with compression

### Transaction Rules

**For user blocks:**
- Truncate to 256 content words
- Strip common self-talk prefixes ("hmm", "wait", "actually", "okay")
- Render as `[user]`
- Lines starting with pasted output (code fences, tool output) get one-liner summary

**For assistant blocks:**
- Truncate to 200 content words
- Strip thinking blocks (save space)
- Render as `[assistant]`

**For tool calls:**
- **Collapse identical consecutive calls** ⟜ e.g., 5x bash with same command becomes `* bash "cmd" (#5)`
- **Compress bash commands** ⟜ strip `cd && ` prefix, strip trailing pipes (| head, | tail, | wc, etc.), cap at 120 chars
- **Extract semantic summary** ⟜ file path for read/edit/write, query for grep/find, command for bash
- Render as `* ToolName "arg"` with `(#N)` ref for collapse count
- Tool result → either success or `[tool_error] name` with first line of error

### Word Budgeting

Uses `Intl.Segmenter` for Unicode-aware word tokenization. Counts only "real" words — skip stop words (a, the, is, of, in, to, etc.). This means truncate limits preserve semantic density.

**Example:**
```
Tool calls:
  bash "cd src && ls"
  bash "cd src && ls"
  bash "cd src && ls"

Output:
  * bash "ls" (#3)

Tool result:
  file1.ts
  file2.ts

Output (after compression):
  ⎿ Listed 2 files
```

---

## step 5: format sections

**Output format:**

```markdown
[Session Goal]
- Fix auth bug
- Add token refresh
- [Scope change]
- Review error handling

[Files And Changes]
- Modified: src/auth/session.ts, src/utils.ts
- Created: tests/auth.test.ts
- Read: src/types.ts (+3 more)

[Commits]
- a1b2c3d: fix(auth): refresh token after reset
- 7f8e9d0: test(auth): add refresh coverage

[Outstanding Context]
- [bash] Exit code 1: "lint failed"
- Line 42 still has the old logic

[User Preferences]
- Always run tests before committing
- Prefer Vietnamese responses

---

[user]
Fix the auth bug, users can't log in

[assistant]
Root cause is missing token refresh...

[assistant-thinking]
(hidden — not in summary)

[assistant]
Let me check the code

* read "src/auth/session.ts"
⎿ Found the bug on line 42

* edit "src/auth/session.ts"
⎿ Added refresh logic

* bash "bun test tests/auth.test.ts" (#2)
⎿ Tests passed
```

---

## step 6: merge with previous summary

If the session was **already compacted**, merge intelligently:

### Merge Rules

**Header sections ([Session Goal], [Files And Changes], etc.):**

- **Session Goal, User Preferences** ⟜ Line-level dedup, keep most recent, cap at 8/15
- **Outstanding Context** ⟜ Always fresh (replace, don't merge) — old blockers may be resolved
- **Commits** ⟜ Unique union across compactions, dedup by hash, cap at 8 most recent
- **Files And Changes** ⟜ Category-level merge (Modified, Created, Read), path-level dedup

**Brief Transcript:**
- Append new brief to old brief (rolling window)
- Older lines drop off as window fills

**Example:** First compaction captures init, goals, first 3 tool uses. Second compaction merges new goals, adds new tool uses to transcript, reuses modified files.

---

## step 7: recall mechanism

**Challenge:** After compaction, old messages are gone from context. But you need to search them.

**Solution:** `vcc_recall` reads raw session JSONL directly.

### Recall Logic

**Input:** Query string (plain text or regex)

**Process:**
1. Load raw JSONL (not compacted messages)
2. Filter by scope (active lineage default, `scope:all` to include branches)
3. Search within selected messages
4. Rank results by term rarity (rare terms weighted higher)
5. Return paginated results with entry indices

**Output:**
```
Results for "auth token":
  [41] assistant: "Let me check auth token logic"
  [42] tool call: read "src/auth/token.ts"
  [43] tool result: "Found refresh bug on line 28"
```

**Expand:** User can then `/pi-vcc-recall expand:41,42,43` to see full content.

---

## key design decisions

### 1. Regex-Based Extraction

**Why:** Fast, zero LLM cost, deterministic, transparent.

**Trade-off:** Can miss subtle goals or blockers that don't match patterns.

**Example:** If user says "The login flow is broken", without matching "break|fail", it might miss this as a blocker.

### 2. Tail-Focused Extraction

**Outstanding Context** looks at last 20 blocks only.

**Why:** Recent blockers matter most. Old resolved issues clutter the summary.

**Trade-off:** If the user mentions an ongoing issue in the middle, it might be forgotten.

### 3. Section Merge Strategy

**Goals, Preferences** deduplicate line-by-line.
**Context** replaces (don't accumulate stale blockers).
**Files** dedup by path but accumulate (show all touched files).

**Why:** Balances memory (sticky notes) with freshness (context updates).

### 4. Scope Changes as Markers

Instead of trying to recompute intent, pi-vcc marks scope changes explicitly:

```
[Scope change]
- New goal that diverged from original
```

**Why:** Preserves decision history. You can see what changed and when.

### 5. Brief Transcript over Free Prose

Tool calls collapsed to one-liners with refs: `* bash "cmd" (#N)`

**Why:** 
- Humans skim by scanning tool names, args, ref counts
- Agents can parse refs to find related entries
- Dramatic space savings (90%+ compression on long sessions)

---

## sizes: before and after

Real data (from README):

| Session | Before | After | Reduction | Time |
|---------|--------|-------|-----------|------|
| A | 997KB | 7.9KB | 99.2% | 64ms |
| B | 428KB | 7.7KB | 98.2% | 29ms |
| C | 424KB | 9.5KB | 97.7% | 54ms |

**Key insight:** Final size is not proportional to input size. A 997KB session and a 428KB session both compress to ~8KB because:
- Section sizes stabilize (8 goals, 5 blockers, etc.)
- Brief transcript is capped at ~120 lines
- After first compaction, merges accumulate sections within same bounds

**Long tail behavior:** Sessions over 10MB usually compress to 5-15KB (99%+ reduction).

---

## building your own compression

To build something similar:

### Minimum Viable Compressor

1. **Normalize** messages to uniform blocks (1 function)
2. **Extract goals** via regex on user blocks (regex + dedup)
3. **Build brief transcript** from all blocks (truncate + collapse)
4. **Format** as markdown (string concatenation)

**Result:** Rough summary in ~100 lines of code.

### Production-Grade Additions

- **File extraction** (track read/write/create)
- **Commit parsing** (regex on message bodies)
- **Blocker detection** (tail-based, regex patterns)
- **Preference learning** (scan for "always", "never", "prefer")
- **Transcript compression** (collapse identical tool calls, bash compression, path extraction)
- **Merge logic** (compare new summary to previous, update sections intelligently)
- **Recall indexing** (read raw JSONL, search, rank by rarity, paginate)

### Architecture Questions to Answer

1. **What's your compression target?** (90%, 98%, something else?)
2. **What sections matter?** (goals, files, commits, preferences, blockers, all of the above?)
3. **How many messages can you afford in the final transcript?** (50 lines? 200 lines?)
4. **Should sections merge across compactions?** (sticky accumulation or fresh replacement?)
5. **Do you need recall after compaction?** (if yes, store raw JSONL separately)

---

## refs

⟜ [pi-vcc source](https://github.com/sting8k/pi-vcc/tree/main/src) ⟜ full implementation
⟜ [pi session format](../../docs/session.md) ⟜ pi's internal message structure
⟜ [VCC paper](https://github.com/lllyasviel/VCC) ⟜ original conversation compiler research
⟜ [pi-vcc buff card](pi-vcc.md) ⟜ user-facing guide
