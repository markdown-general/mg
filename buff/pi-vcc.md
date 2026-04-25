## pi-vcc ⟜ algorithmic session compaction

🟢 installed globally ⟜ `npm:@sting8k/pi-vcc`

**Purpose** ⟜ Fast, deterministic, lossless session compaction for pi. No LLM calls, no hallucination risk, extreme compression.

---

## why pi-vcc over pi default

| aspect | pi default | pi-vcc |
|--------|-----------|--------|
| **method** | LLM-generated summary | Algorithmic extraction |
| **latency** | Waits for API | 30-470ms, instant |
| **cost** | Token burn on summarization | Zero API calls |
| **determinism** | Can hallucinate | Same input = same output always |
| **compression** | Varies | 35-99% (higher on long sessions) |
| **history after compact** | Discarded forever | Searchable via `vcc_recall` |
| **repeated compactions** | Each pass risks data loss | Sections merge, accumulate safely |

---

## structure of compacted session

```
[Session Goal]
  Initial intent + scope changes

[Files And Changes]
  Modified/created files (capped, paths trimmed)

[Commits]
  Git commits from session (last 8)

[Outstanding Context]
  Unresolved items — errors, pending questions

[User Preferences]
  Extracted from user messages (always, never, prefer...)

[Brief Transcript]
  Rolling window of ~120 recent lines
  Tool calls: one-liners with (#N) refs
  Text: truncated to keep compact
```

Sections appear only when relevant — no commits section if no git activity.

---

## commands

**Manual compaction** ⟜ `/pi-vcc`
  Trigger compaction on demand using pi-vcc algorithm instead of LLM

**Search old history** ⟜ `/pi-vcc-recall <query> [options]`
  Query raw session JSONL directly — searchable even after multiple compactions
  ⟜ default searches active lineage only
  ⟜ `scope:all` searches across all branches
  ⟜ regex patterns supported: `hook|inject`, `fail.*build`
  ⟜ multi-word OR ranked by term relevance

**Browse recent** ⟜ `/pi-vcc-recall` (no query)
  Last 25 entries as brief summaries

**Expand specific entries** ⟜ `/pi-vcc-recall expand:41,42`
  Full untruncated content for indices found via search

---

## config

Config lives at `~/.pi/agent/pi-vcc-config.json` (auto-scaffolded on first run):

```json
{
  "overrideDefaultCompaction": false,
  "debug": false
}
```

**overrideDefaultCompaction** *(default `false`)*
  ⟜ `false` — pi-vcc only runs for `/pi-vcc`; `/compact` and auto-threshold use pi core
  ⟜ `true` — pi-vcc handles all compaction paths (replace default entirely)

**debug** *(default `false`)*
  ⟜ `true` writes detailed compaction info to `/tmp/pi-vcc-debug.json`
  ⟜ shows message counts, cut boundary, summary preview, sections

---

## workflow notes

⟜ **Use `/pi-vcc` when** session is long and approaching context limit, but you want zero API cost and deterministic results

⟜ **Use `/pi-vcc-recall auth token`** after compaction to search old history. Agent can't see pre-compaction messages anymore, but full JSONL is still there and searchable.

⟜ **Set `overrideDefaultCompaction: true`** if you want pi-vcc as your primary strategy. But be aware: `-/compact` will then use algorithmic summary instead of LLM reflection.

⟜ **Real-world compression** — 997KB session (2,943 messages) → 7.9KB (99.2% reduction in 64ms)

---

## real session metrics

Measured on actual sessions from `~/.pi/agent/sessions`:

| Session | Messages | Before | After | Reduction | Time |
|---------|----------|--------|-------|-----------|------|
| A | 2,943 | 997KB | 7.9KB | 99.2% | 64ms |
| B | 1,703 | 428KB | 7.7KB | 98.2% | 29ms |
| C | 1,657 | 424KB | 9.5KB | 97.7% | 54ms |
| D | 1,004 | 2.2MB | 4.4KB | 99.8% | 30ms |
| E | 486 | 295KB | 11KB | 96.2% | 30ms |
| F | 46 | 5.2KB | 3.3KB | 35.7% | 5ms |
| G | 27 | 8.5KB | 2.4KB | 71.0% | 2ms |

---

## lossless recall

Traditional LLM compaction **discards history**. After summary, agent only sees digest. Old context is gone.

pi-vcc's `vcc_recall` reads raw JSONL directly. Active-lineage history stays searchable across multiple compactions.

**Typical workflow:**
1. Session gets long, run `/pi-vcc`
2. Need old context later? `/pi-vcc-recall hook|inject` to search
3. Find relevant entry indices from search results
4. `/pi-vcc-recall expand:41,42` to get full untruncated content
5. Context fed to agent as reference

---

## refs

⟜ [VCC](https://github.com/lllyasviel/VCC) ⟜ original transcript-preserving conversation compiler
⟜ [pi-vcc repo](https://github.com/sting8k/pi-vcc) ⟜ source + detailed docs
⟜ [pi packages](../../docs/packages.md) ⟜ how pi manages extensions and packages
