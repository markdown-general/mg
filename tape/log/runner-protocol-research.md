# runner protocol ⟜ signal, handoff, listening

From the yin-start baseline spin, we discovered that **sub-agents are primed successfully but lack clarity on how to receive next work.**

The gap: "Who is the runner?" and "How do I know when the next card arrives?"

---

## The Problem

yin.md says:
> "Check in with the runner ⊳ if they're not out for a cuppa"

But:
- Runner is never defined
- No listening protocol documented
- Sub-agent correctly respects "Wait" but has no mechanism to un-wait
- Implicit async coordination lacks explicit handoff

---

## Solution Sketch

### Option A: Event Listener Pattern
Runner publishes work cards to a shared directory or event stream.
Yin listens on startup and polls/watches for new cards.

```
runner ⟜ writes card to work/ or yin/queue/
yin     ⟜ on instantiation, checks queue
yin     ⟜ picks up next card from work stack or explicit queue file
yin     ⟜ proceeds
```

**Pros:** Simple, async, no bidirectional comms needed
**Cons:** Polling latency, race conditions with multiple yins

### Option B: Explicit Handoff in Previous Card
Current card ends with "Wait." But it could be:
```
⊳ [receive-next-work-card-from-work-directory]
```

Sub-agent reads this, knows to list work/ and look for their name or next sequential card.

**Pros:** Self-discovering, no external listener
**Cons:** Requires convention (card naming)

### Option C: Runner as yin-in-charge
"Runner" is the yin in the chair at that moment. Yin-scout waits, then reports to yin-start (the runner), who then issues next card.

This is already in yin.md:
> "The yin chair is the only place where an agent can do actual pattern ⊙ reflection work"

So maybe the flow is:
1. yin-scout instantiates, reads prerequisites, reports readiness
2. yin-scout awaits instruction from yin-start (the current runner)
3. yin-start reviews report, decides next work
4. yin-start queues next card or sends command

**Pros:** Explicit control, human in the loop, matches intended design
**Cons:** Requires yin-start to be actively monitoring

---

## Recommendation

Start with **Option C** (runner = active yin in chair) because:
1. It matches the philosophical design (yin coordinates)
2. It's human-centred (runner makes decisions)
3. It's testable in this conversation flow

Update yin-start.md to say something like:

```
⊳ yin-scout reports readiness
  ⊣ [assess report and queue next work]
  ⊣ [send work card to yin-scout session]
```

Then test whether yin-scout can be given an explicit next card in the conversation.

---

## Next Test

✓ Baseline spin complete
⊢ Update yin-start.md with explicit runner coordination ⊣
⊢ Spin yin-scout again with updated card ⊣
⊢ Measure: does explicit handoff improve readiness score? ⊣
