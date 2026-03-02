# haskell-env-check ⟜ Pre-work environment verification

**Status:** ◊ routine  
**Intent:** Before starting any Haskell work, verify the machine state. Quick sanity check, not deep debugging.

**Runner:** Tony  
**Yin operator:** YinOperator

---

## Purpose

Haskell tooling is sensitive to state:
- GHC versions matter (type system, syntax, libraries)
- HLS versions can conflict
- Cabal cache can be stale
- Project dependencies can be misaligned

Before we start real work, announce what we're running on. Prevents silent failures later.

---

## Routine

### ◊ Check Installed Tools

**Command:**
```bash
~/.ghcup/bin/ghcup list
```

**What to capture:**
Look for tools marked with `✔✔` (currently active/set):
- Active GHC version (look for `✔✔ ghc X.Y.Z`)
- Active Cabal version (look for `✔✔ cabal X.Y.Z`)
- Available HLS versions (any marked `✓` or `✔✔`)
- Any warnings (e.g., "New stack version available")

**Report format:**
```
🏗️ Haskell Environment
━━━━━━━━━━━━━━━━━━━━━━
GHC:   9.X.X (marked with ✔✔)
Cabal: Y.Z.W (marked with ✔✔)
HLS:   A.B.C (marked with ✓ or ✔✔)
Status: [OK | WARNINGS]
```

**Example current state (from your machine):**
```
GHC:   9.14.1 (latest, recommended)
Cabal: 3.16.1.0 (latest, recommended)
HLS:   2.13.0.0 (latest, recommended)
Stack: 3.7.1 (active)
Status: OK
```

---

### ◊ Update Cabal Package Index

**Command:**
```bash
cabal update
```

**What to expect:**
- Downloading package index (first time, or if stale)
- Quick return if index is recent
- Any errors from network or corrupted cache

**What to document:**
- Did it succeed?
- Any warnings or errors?
- Timestamp of index (tells us if it's current)

---

### ◊ Check Project Dependencies (if in a project)

**Command (if inside a project directory with .cabal file):**
```bash
cabal build --dry-run 2>&1 | head -50
```

**What to look for:**
- Can dependencies resolve?
- Any version conflicts?
- Missing packages?

**Report format:**
```
Dependencies: [OK | CONFLICT | MISSING]
Issues (if any): [list them]
```

---

### ◊ Announce Environment

**To Tony:**
```
🏗️ Haskell Environment
━━━━━━━━━━━━━━━━━━━━━━
GHC:   9.X.X
Cabal: Y.Z.W
HLS:   A.B.C
Cabal index: [date]
Project: [project name or N/A]
Status: [OK | WARNINGS]
```

If any issues: list them. If all good: proceed.

---

## Possible Extensions

(Tony: add/remove as needed)

- [ ] Check cabal cache size (if growing dangerously)
- [ ] Verify a specific project builds (`cabal build --dry-run` in project directory)
- [ ] Check for stale .hi files or build artifacts
- [ ] Verify PATH includes cabal/ghcup bin directories
- [ ] Test a simple GHCi query (to verify toolchain sanity)
- [ ] List available GHC versions (in case upgrade is needed)

---

## When to Run

**Before starting:**
- New Haskell work card
- Switching between projects
- After system updates
- If anything seems weird

**How often:**
- Once per work session
- Don't run obsessively — it's a sanity check, not a monitor

---

## If Issues Found

**Process:**
1. Document the issue to memory/YYYY-MM-DD.md
2. Ask Tony: Should we fix it now, or note it for later?
3. Don't proceed to real work until resolved (or consciously deferred)

---

## Quick Checklist

- [ ] `ghcup list` run, versions captured
- [ ] `cabal update` run, status noted
- [ ] Project check run (if in a project)
- [ ] Environment announced to Tony
- [ ] Issues (if any) documented

Done = ready to start work.

