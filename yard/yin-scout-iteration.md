# Yin Scout Iteration ⟜ Improve startup protocol, extend context, test field agent

**Status:** ◊ Ready to fork and execute
**Owner:** Claude Code (field agent)
**Purpose:** Harden yin-startup.md into yin-scout.md by iterating in live context

---

## Context

**Problem:** Preconceptions slip in via multiplicity (AI chat, design team, agents, LLMs). Not a bug, a feature to fix.

**Solution:** Create field agent, instantiate with yin-startup.md, execute this card, observe what breaks, iterate.

**Expected output:** yin-scout.md (startup protocol extended with wider context from flow.md, grammar.md, etc.)

---

## Execution (thinking: low)

⊢ Read yin-startup.md ⊣
  ⟜ Four reads only: readme.md, work/yin.md, words/poise.md, words/curate.md
  ⟜ No preconceptions injected

⊢ Read supporting docs ⊣
  ⟜ work/flow.md (flow encoding, how cards execute)
  ⟜ work/grammar.md (semantic density, language choice)
  ⟜ Any others that clarify yin operation

⊢ Draft yin-scout.md ⊣
  ⟜ Extend yin-startup.md with richer context
  ⟜ Add: flow markers, grammar principles, decision framework
  ⟜ Keep: sparse, idempotent, queue architecture
  ⟜ Test: could another field agent read this and operate correctly?

◊ ⊢ Test field agent ⊣
  ⟜ [test-method]✓ ← TBD: how do we verify improvement?
    - Load yin-scout.md in fresh pi session?
    - Have it execute a simple card?
    - Compare token efficiency vs. LONG-TERM-MEMORY.md?
  ⟜ Standard: if agent can operate independently on first read, scout is working

⊢ Report findings ⊣
  ⟜ What worked
  ⟜ What preconceptions still snuck in
  ⟜ What to iterate next

---

## Success Criteria

✓ yin-scout.md is complete and ready to use
✓ Field agent instantiated with it operates without asking clarifying questions
✓ Improvement over LONG-TERM-MEMORY.md approach identified
✓ Next iteration direction clear

---

## Notes

- Preconceptions are expected; we're isolating and fixing them
- This is the first field agent test in the pi world
- Real execution beats abstract design
