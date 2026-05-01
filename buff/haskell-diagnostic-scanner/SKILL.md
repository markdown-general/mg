---
name: haskell-diagnostic-scanner
version: 1.0.0
description: "Scan haskell-compile.md dashboard for failing repos and run diagnostics in parallel"
author: hermes
---

# Haskell Diagnostic Scanner

Scan the haskell-compile.md build dashboard for repos marked 🟠 (warnings) or 🔴 (errors), spawn parallel diagnostic agents to analyze each failure, and generate fix cards with root cause analysis and suggested fixes.

## When to Use

When you have a batch of Haskell repos with known build failures and want to understand the root cause and proposed fix for each in parallel, without manual investigation.

## Constraints

- **No dashboard updates from subagents** — agents run builds, write fix cards, and create lock files. A post-processing step consolidates results and updates the dashboard serially to avoid write race conditions.
- **Haiku model for subagents** — speed + cost, sufficient for diagnostic reasoning
- **Fix cards only** — one ~/mg/loom/haskell-<REPO>-fix.md per repo with: error type, file location, message, root cause (2-3 sentences), and one specific actionable fix
- **Lock files** — prevent concurrent builds of the same repo
- **No artifact saving** — builds run fresh each time, no cargo/cabal artifact caching between diagnostics

## Architecture

1. **repair-scan.sh** — bash script that reads haskell-compile.md, extracts problem repos, builds task list
2. **execute_code** — Python helper that constructs delegate_task JSON and spawns all agents in parallel
3. **Subagent** (haiku) — each agent: acquires lock → marks 🔵 → deletes old fix card → builds → analyzes → writes fix card → releases lock
4. **Post-processing** — (TODO) serial script that reads all fix cards and updates dashboard inline summaries

## Usage

```bash
cd ~/mg
bash loom/repair-scan.sh
```

This will:
1. Scan haskell-compile.md for 🟠🔴 repos
2. Spawn 1 haiku subagent per problem repo (parallel)
3. Wait for all to complete
4. Each subagent creates ~/mg/loom/haskell-<REPO>-fix.md

## Example Output

**Fix card:** haskell-anal-fix.md
```
## anal

**Build Error:** Module not found (GHC-87110)

**File/Location:** ~/haskell/markup-parse/src/MarkupParse.hs:108

**Message:** Could not find module 'Mpar'. Use -v to see a list of the files searched for.

**Root Cause:** The mpar library was refactored and no longer exports a top-level `Mpar` module. Only `Mpar.Parser` and `Mpar.Primitives` are exposed in mpar.cabal. MarkupParse.hs attempts to import from a non-existent `Mpar` module at line 108, which breaks the build dependency chain.

**Suggested Fix:** Create a re-export module at ~/haskell/mpar/src/Mpar.hs that exposes all functions from Mpar.Parser and Mpar.Primitives, then add "Mpar" to the exposed-modules list in ~/haskell/mpar/mpar.cabal.
```

## Files Created/Modified

- `~/mg/loom/repair-scan.sh` — main script (bash)
- `~/mg/loom/haskell-<REPO>-fix.md` — diagnostic output for each repo (one per problem repo)
- `~/mg/loom/.locks/<REPO>.lock` — lock file during diagnosis (deleted when agent completes)

## Pitfalls

- **Race condition on dashboard writes** — subagents must NOT all write to haskell-compile.md at once. Use fix cards only; post-process serially.
- **Lock timeout** — if an agent crashes, its lock file remains. Clean with `rm -f ~/mg/loom/.locks/*.lock`.
- **Stale fix cards** — agents delete old ones before diagnosing. If an agent crashes after deleting but before writing new, the card will be missing. This is acceptable — re-run the diagnostic.
- **Build time variance** — some repos take 30+ seconds to build (esp. markup-parse). Total wall-clock time for 16 repos is ~2-3 min, not 16 × per-repo time.

## Future Improvements

- **Auto-update dashboard** — post-processing step that reads all fix cards and atomically updates dashboard inline summaries (e.g., append " - [error]: [fix]" to each repo line)
- **Dashboard status emoji** — show 🔵 while building, 🟢 after completion (both in agent prompt and post-processing)
- **History tracking** — keep timestamped copies of fix cards in loom/history/ for tracking changes over time
