# Pi Ecosystem: Research Base, Not Default

**Source:** Grok analysis, 2026-04-18

---

## The Constraint

Default pi.dev/packages world injects **imperative fluff**: auto-plans, guardrails, heavy system prompts, opinionated workflows. That's the opposite of mg's functional, composing, zero-nonsense discipline.

## The Strategy

**95% research base. 5% selective install.**

### Research Mode (Primary)

Scan pi.dev/packages (1,358 entries) as a **library**, not a requirement list.

- Pattern-match against mg grammar (lead ⟜ dash ⟜ slug)
- Compress interesting ones into buff/pi-patterns.md
- Use manual pi sessions (`pi -p` one-shots or emacs buffer interface) to investigate promising packages
- Spin field agents later when automation matures; for now, read outputs from logs manually

This is low-cost, high-signal. You stay in control.

### Selective Install (5%)

Only install if:
- ✓ Adds capability without imperative defaults, plans, todos, or heavy system prompts
- ✓ Syncs via files/logs (your async bridge)
- ✓ Composes with your prompts (markdown-first)
- ✓ Works with manual or semi-manual agent topology (file handoff)

**Test first:** `pi -e npm:<package>` in a throwaway session. If it drifts from functional style, drop it and capture the lesson in a 🚩-marked deck.

### Useful Categories (Already Aligned)

- **Markdown handling:** pi-markdown-preview (rendered cards + LaTeX)
- **Multi-agent orchestration:** pi-subagents, pi-teams (file-based handoff, map to card links + flow marks)
- **Prompt composition:** Lightweight prompt-template packages (.md-based, no fluff)
- **Context/memory:** File-backed (write MEMORY.md, not opaque state)
- **UI/minimal:** Themes or status tools that don't touch core prompting

### Ignore the Rest

Most packages reinject the separation of syntax/semantics you eliminated. Pi's *core* philosophy matches yours; installing indiscriminately breaks it.

---

## Pi Core vs mg Discipline

**Alignment:**

- Pi: zero default extensions (you install what you need)
- mg: zero fluff, cards compose, syntax/semantics integrated
- Both: markdown-first, file-sync for multi-agent handoff, minimal core

**Difference:**

- Pi: tool runner (good for agent work)
- mg: strategy + flow (cards + yin + decks + buff)

**Result:** Pi executes. mg coordinates. They fit together.

---

## Current Engagement Model

Until field agents automate:

1. **Manual research:** `pi -p` one-shots to vet interesting packages
2. **Emacs buffer:** Multi-round exploration with pi in Emacs
3. **Log tracking:** Read outputs from `~/mg/logs/` after each session
4. **Pattern capture:** Deck what you learn into buff/ or core/

This is not "sloppy." It's honest about current automation level.

---

## Next Card: core/pi-integration.md

```
pi-assessment ⟜ research → selective buff

zero-default ⟜ matches mg discipline perfectly

catalog ⟜ pi.dev/packages as raw deck source

research-mode ⟜ manual pi sessions to vet patterns
  ⊢ one-shot with pi -p
  ⊢ or emacs buffer interface for multi-turn
  ⊢ logs/ as async bridge

install-filter ⟜ only file-sync + no-fluff + composable

next ⟜ manual vet top 20 packages in categories:
  ⊢ multi-agent orchestration
  ⊢ markdown tools
  ⊢ prompt composition
  ⊢ context/memory
```

Run this card when you want to dive in. No automation required yet.
