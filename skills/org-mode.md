#---
name: org-mode
description: Note taking, task management, and org protocol integration
---

## org-mode ⟜ shared task state

**What it is:** Agenda items hold shared task state. Keywords: `ToDo` → `Next` → `Blocked` | `Done`.

**Where to find it:**
- **View:** `SPC o z` (org-agenda, all states) or `SPC o n` (next-agenda, filtered)
- **Files:** ~/org/ (personal), ~/self/org/ (self), ~/mg/org/ (shared)
- **Locations:** captain.org, loom.org, side-quests.org, refile.org

**What you can do:**
- Click on an item to open its linked card
- Change state: `t` (cycle keyword), `SPC m t N` (set to Next), `SPC m t d` (set to Done)
- Capture quickly: `C-c c r` (personal), `C-c c s` (self), `C-c c m` (mg)

**When to use org:** Active tracking, coordination, state that needs temporal awareness. **Narrative goes in markdown cards.** If you need full workflow guidance, read ~/self/buff/org-mode.md.

