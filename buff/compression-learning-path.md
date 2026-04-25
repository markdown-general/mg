## compression learning path ⟜ study pi-vcc, build your own

🟢 reading order ⟜ From user-facing to implementation to building your own

---

## tier 0: quick reference

Start here if you just want to *use* pi-vcc:

⟜ [pi-vcc](pi-vcc.md) ⟜ commands, UI, settings, persistent memory

**Key commands:**
- `/pi-vcc` — compress now
- `/pi-vcc-recall <query>` — search old history
- `/agents` ⟜ Settings ⟜ join mode, max concurrency (for subagents, not compression)

---

## tier 1: understand the mechanism

Then learn *how* it works:

⟜ [pi-vcc-internals](pi-vcc-internals.md) ⟜ deep dive into compression pipeline

**Read in order:**
1. Pipeline overview (7 steps)
2. Step 1-5 (normalize → format)
3. Key design decisions (why each choice?)
4. Sizes: before/after (real metrics)

**Takeaway:** Compression is deterministic extraction + smart merging, not LLM magic.

---

## tier 2: build from scratch

Finally, *implement* your own:

⟜ [building-compressors](building-compressors.md) ⟜ practical guide with code

**Follow the layers:**
1. Types (define input/output shape)
2. Normalize (raw messages → uniform blocks)
3. Extract (blocks → sections)
4. Format (sections → markdown)
5. Merge (new summary + previous)
6. Test (measure compression ratio)
7. Integrate (hook into pi or standalone tool)

**Code:** Full 500-line example provided.

---

## experiments to try

With pi-vcc source code open + your own compressor being built:

### Experiment 1: Asymmetry Check

**Question:** Do goals extracted from agent-run sessions differ from human-run sessions?

**Method:**
1. Run `/pi-vcc` on a human-driven session → examine [Session Goal]
2. Run `/pi-vcc` on an agent-driven session → examine [Session Goal]
3. Compare extraction results

**Hypothesis:** Same patterns should match both — no bias.

### Experiment 2: Compression Ratio by Session Type

**Question:** Do different project types compress equally?

**Data:** Your 432 sessions across projects
- mg (123) ⟜ markdown/general framework
- haskell-semcons (117) ⟜ code-heavy
- outside (45) ⟜ mixed
- markdown-general (22) ⟜ doc-heavy

**Method:**
1. Compress 5 sessions from each project
2. Measure ratio: (original - compressed) / original
3. Plot ratio vs. original size
4. Compare across project types

**Hypothesis:** Ratio should be similar (90%+ for 100KB+ sessions), regardless of content type.

### Experiment 3: Recall Accuracy

**Question:** Is recall symmetric across lineages?

**Method:**
1. Run `/compact` on session A (creates summary)
2. Search for old context: `/pi-vcc-recall auth` → see results
3. Also search off-lineage: `/pi-vcc-recall auth scope:all` → compare
4. Expand top result and verify it's accurate

**Hypothesis:** Recall works equally well before and after compaction. Both human and agent can find context.

### Experiment 4: Build a Variant

**Question:** What if we change the extraction rules?

**Method:**
1. Copy pi-vcc source code locally
2. Modify `extract/goals.ts` to be more aggressive (lower threshold)
3. Compress same session with original and variant
4. Compare quality: Do goals make sense? Too noisy?

**Hypothesis:** Tuning extraction rules trades precision vs. recall (more goals = more context but noisier).

---

## integration paths

### Option A: Use pi-vcc As-Is

✅ Works now. Fast, lossless, overrides /compact.

```bash
pi -s <session-file>
/pi-vcc
```

---

### Option B: Understand + Extend

Study [pi-vcc-internals.md](pi-vcc-internals.md), then:
- Add custom extractors (e.g., "decision checkpoints")
- Change section merge rules (what's sticky vs. fresh?)
- Add custom rendering (different markdown format)
- Hook into pi as extension

---

### Option C: Build From Scratch

Follow [building-compressors.md](building-compressors.md):
1. Implement basic compressor (normalize → extract → format)
2. Test on real sessions, measure compression ratio
3. Add recall indexing
4. Deploy as pi extension or standalone tool
5. Iterate: Compare results with pi-vcc, refine

---

## metrics to track

As you build or experiment:

| Metric | Why | Example |
|--------|-----|---------|
| **Compression ratio** | How much space do you save? | 90% = 10x smaller |
| **Time to compress** | Latency matters for UX | <100ms is great |
| **Recall accuracy** | Can you find old context? | 95%+ of searches hit relevant entries |
| **Section quality** | Do extracted sections make sense? | Do goals match reality? Files accurate? |
| **Merge correctness** | Do repeated compactions accumulate cleanly? | No duplicates, no stale context |
| **Symmetry** | Is compression/recall unbiased? | Same ratio for human/agent sessions |

---

## related concepts

**Conversation summarization** vs. **compression:**
- Summarization: High-level semantic digest (LLM-driven, lossy)
- Compression: Preserve fidelity while reducing size (deterministic, lossless recall)

**Session history** vs. **compaction:**
- History: Raw messages preserved (search via recall)
- Compaction: Summarized messages in context window (what LLM sees)

**Lineage tracking:**
- Active path: Current branch of the session tree (default search scope)
- All lineages: Branches where you forked/branched (use `scope:all` to include)

---

## next steps

1. **Run `/pi-vcc` on your 432 sessions** ⟜ Get baseline compression metrics
2. **Read pi-vcc-internals.md** ⟜ Understand each step
3. **Pick one experiment** (asymmetry check, recall accuracy, or variant)
4. **Follow building-compressors.md** if you want to implement your own

---

## refs

⟜ [pi-vcc card](pi-vcc.md) — Quick reference
⟜ [pi-vcc-internals](pi-vcc-internals.md) — Deep dive (read this)
⟜ [building-compressors](building-compressors.md) — Hands-on guide (code this)
⟜ [pi-vcc-testing](pi-vcc-testing.md) — Test plan for your sessions
⟜ [pi-vcc repo](https://github.com/sting8k/pi-vcc) — Source code
