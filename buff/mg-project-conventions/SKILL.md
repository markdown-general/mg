---
name: mg-project-conventions
description: "mg project conventions: card consolidation, loom triage, examples management"
---

# Project Conventions

Conventions for managing project knowledge cards and looms in the mg system.

## Card design

**Consolidation over proliferation.** Prefer class-level cards that absorb
smaller, narrower ones. When a territory is covered by multiple thin cards,
merge them into a single focused card with tiers/sections. A card like
`resource-io.md` covering countdown → echo → file in three tiers is
preferred over three separate cards.

**Markdown cards, not modules.** During module-freeze phases, new code goes in
`examples/*.md` as self-contained example cards. Cards can become modules
later once design stabilises. Cards use `⟝ name` header format.

**Absorption, not deletion.** When consolidating, the absorbed file list
should be recorded (in the loom or card) so provenance is traceable.

## Loom

Project task management lives in `~/mg/loom/<project>.md` with status markers:

| marker | meaning |
|--------|---------|
| 🟣 | todo item, work unit |
| 🟠 | in testing, active |
| 🟢 | done, completed |
| 🔴 | blocked, removed, or moved out |
| ◊ | cursor, current task |
| ⧈ | weave, light check (runner-directed) |
| ⥁ | run, verify standard process |
| ⊲ | push, propagate into mg structure |

The loom is the source of truth. Update it when items change status.

## Triage flow

When working through a project's `examples/` or `cards/` directory:

1. Survey existing cards for overlap
2. Identify cards covering the same territory
3. Consolidate into a single class-level card with tiered sections
4. Move deferred/aspirational items to `~/mg/loom/` (not deletion)
5. Remove truly absorbed cards; record in the loom as 🔴 with absorption notes
6. Update the loom to reflect the new state

## Directory conventions

```
~/haskell/<project>/
  examples/          — example cards (.md) during module-freeze
  src/               — library modules (frozen or stable)
  other/             — narrative prose, research notes

~/mg/loom/
  <project>.md       — project task list with status markers
```

## Cross-project moves

When a card belongs to a different project (e.g., agent cards in circuits/),
move it to `~/mg/loom/` and create a placeholder noting the move. The loom
gets a 🔴 entry with the destination.
