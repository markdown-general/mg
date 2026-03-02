# Yin Baseline Instantiation ⟜ Session startup protocol

**Status:** ◊ Template (ready to execute)
**Owner:** Yin (any instance)
**Purpose:** Flexible baseline for all activity types

---

## Startup (thinking: low)

⊢ Read context ⊣
  ⟜ LONG-TERM-MEMORY.md (what we've done, where we are)
  ⟜ readme.md (landscape orientation)
  ⟜ AGENTS.md (operating instructions)

⊢ Set mode ⊣
  ⟜ Thinking: low (unless decision point)
  ⟜ Working directory: ~/mg/
  ⟜ Session: new or `/resume` based on activity

⊢ Identify activity ⊣
  ⟜ [activity-type]✓ ← select one:
    - Coding/Theorem (specific problem, high context)
    - System Design (abstract thinking, clean space)
    - Experimentation (loose, exploratory)
    - Yin Framework (meta-work, improving patterns)
    - Coordination (baseline, decision-making)

◊ ⊢ Fork if needed ⊣
  ⟜ If not coordination: `/fork` to separate session
  ⟜ Name session: `/name "Activity: [activity-type]"`
  ⟜ Load activity-specific card from work/ or yard/

⊢ Begin work ⊣
  ⟜ Read current card
  ⟜ Execute following flow markers
  ⟜ Update ◊ as progress moves forward

⊢ Breathe on completion ⊣
  ⟜ Review what happened vs. plan
  ⟜ Log results to log/ directory
  ⟜ Return to baseline session or halt

---

## Design Notes

**Flexibility:**
- Same instantiation card works for all activity types
- Fork creates separation of concern
- Thinking stays low until decision point
- Breathe cycle ties threads back together

**Context Isolation:**
- Coordination baseline stays lean
- Activity-specific sessions carry only relevant context
- Compilation noise, design abstractions, experimentation mess each have their own session
- `/tree` shows you all branches when needed

**Multiplicity:**
- Multiple yin instances can run in parallel (separate forks)
- Each reports back to baseline
- Coordination decides next moves

---

## Flow Encoding

```
Startup → Identify activity → Fork (if needed) → Work → Breathe → Report
```

Simple, same for all activities, maximum flexibility.
