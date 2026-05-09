---
name: commit
description: Commit on milestones. One-liner intent, optional detail. Modern, minimal.
---

# commit

**Commit when:**
- A task finishes
- You're asked to
- It feels like a natural stopping point

**Don't commit:**
- Every typo fix
- Mid-task "just in case"
- Because it's been a while

## Format

```
intent summary

optional: what changed and why
```

**Good:**
```
Consolidate haskell-ng-mode and ob-haskell-ng into haskell-lite

All elisp files now in one repo. Doom config updated for stand-alone branch.
```

**Good (one-liner):**
```
Add read-ghc-core skill for GHC Core dump analysis
```

**Bad:**
```
wip
update
fix stuff
```

## Shortcut

Before committing, ask: *"If I came back to this in a month, what would I need to know?"*

Write that. One line. Send.
