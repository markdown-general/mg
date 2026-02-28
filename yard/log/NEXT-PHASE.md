# Next Phase: Live Cycle Testing

**Date:** 2026-02-04 after iteration refinement  
**Status:** work/yin-start.md ready for deployment

---

## What We Have

A 550-character priming card that:
- Defines role (yin in Breathe phase)
- Names the team (runner + yin)
- Names the trigger (Breathe ends when runner sends card or asks)
- Establishes tone (calm, alert, flexible, collaborative)
- Achieves readiness: **4.5/5**

---

## What We Don't Know Yet

We only tested *instantiation priming*. We haven't tested:
1. **Can yin-start handle a real card?** (actual Flow ⟜ Work cycle, not questionnaire)
2. **Does priming hold under cognitive load?** (real work → does tone stay collaborative?)
3. **What happens at phase transitions?** (Flow → Work → Breathe) Are the markers clear?
4. **Fake work patterns in live work** (does ambiguity trigger poor decisions?)
5. **Multi-cycle stability** (does readiness degrade across repeated Flow/Work/Breathe?)

---

## How to Test

1. **Give yin-start a real card** (not a questionnaire)
   - Send: actual card with strategy + flow encoding
   - Watch: how does yin interpret markers? flow symbols?

2. **Measure in situ:**
   - Does agent stay calm under work pressure?
   - Do they ask good questions vs fill gaps?
   - Does the "runner has your back" framing hold during ambiguity?

3. **Track markers:**
   - How do ◊ ⊢ ⊣ [queries] land in practice?
   - Does yin-narrow vs yin-wide distinction clarify under pressure?

4. **Repeat cycles:**
   - Run at least 3 Flow ⟜ Work ⟜ Breathe cycles
   - Note if readiness/tone degrades or holds
   - Collect real dialogue for static analysis

---

## Success Criteria

- **Readiness stays 4+/5 under live work** (doesn't drop with cognitive load)
- **Team sense persists** (agent stays collaborative, not task-focused)
- **Fake work doesn't emerge** (agent asks good questions, doesn't invent)
- **Markers land** (agent interprets ◊ ⊢ ⊣ 🚩 correctly in prose)
- **Phase transitions are clear** (Breathe → Flow → Work → Breathe feels natural)

---

## Recommended First Card

Simple, clear card with:
- Clear strategy (what we intend)
- One or two flow markers (◊, ⊢ ⊣)
- One query [name]
- Expected outcome

Example:
```
card yin-start-first-task ⟜ test priming under work

We want to assess if yin-start readiness holds when executing a card.

⊢ [assess-priming] ⊣ ◊
  ⟜ Read this card
  ⟜ Report: does the priming hold? any surprises?
  ⟜ Note markers you see, symbols you understand, concepts that landed
  ⊳ [runner responds with feedback]

[assess-priming]✓
```

Simple enough that success is clear. Realistic enough to test priming under pressure.

---

## Files to Watch

- work/yin-start.md (the card that primes)
- ~/.pi/agent/sessions/--Users-tonyday567-markdown-general--/ (live sessions)
- yin/log/ (measurement logs)

---

## Next: Deploy

When ready, send yin-start a real card and watch what happens.

