◊ issues

Clarifications and gaps discovered during alignment work.

---

**card-agency ambiguity** (round 1)

In readme.md, cards are where strategy lives and agents execute. But core/design.md shows card ↔ agent as bidirectional (dashed arrows), suggesting they mutually shape each other. Are cards the strategy-holder that agents execute, or are agents supposed to elaborate the card's intent as they work?

**card-agency inversion** (round 1)

readme.md treats agents as external executors ("instruct an agent to do it; they read and write to the log directory"). But core/design.md shows agent ↔ card as mutually recursive. The design suggests cards change through agent thinking, not just get executed. Silent collision between "card as strategy holder" and "card as collaborative artifact that elaborates through agent work."
