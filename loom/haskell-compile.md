

# haskell-compile

Dashboard for parallel Haskell build diagnostics and cabal config audit.

## status legend

🟣 queue — waiting to diagnose
🔵 building — diagnostic agent running
🟢 success — builds cleanly
🟠 warning — builds with warnings, fix suggested
🔴 error — build fails, fix suggested

## repos

🟢 agent - build successful
🟢 agent-fork - build successful
🔴 anal - src/MarkupParse.hs:108:1: error: [GHC-87110] - module-not-found: Create missing Mpar re-export module
🟢 box - build successful
🟢 box-socket - build successful
🟠 cabal-graph - warnings: <no location info>: warning: [GHC-32850] [-Wmissing-home-modules] - missing-modules: Add CabalParse to other-modules in cabal-graph.cabal
🟢 calculational - build successful
🟠 chart-svg - warnings: src/Chart/Data.hs:12:5: warning: [GHC-68383] [-Wpattern-names]
🔴 chart-svg-dev - The following errors occurred: - see build log
🟢 circuits - build successful
🟢 dataframe-load - build successful
🟢 dotparse - build successful
🟢 ephemeral - build successful
🟢 eulerproject - build successful
🟢 formatn - build successful
🟢 grepl - build successful
🟠 harpie - warnings: src/Harpie/Array.hs:164:5: warning: [GHC-68383] [-Wpattern-names]
🟢 harpie-numhask - build successful
🟢 hcount - build successful
🟠 huihua - warnings: [3 of 8] Compiling Huihua.Warning   ( src/Huihua/Warning.hs,
🔴 markup-parse - 210 |             These e f -> (t', This e)  -- stop on part - see build log
🟠 mealy - warnings: src/Data/Mealy.hs:12:5: warning: [GHC-68383] [-Wpattern-names]
🟢 memo - build successful
🟠 mnet - warnings: src/LensS.hs:12:1: warning: [GHC-66111] [-Wunused-imports]
🟠 mpar - warnings: app/explore.hs:5:1: warning: [GHC-66111] [-Wunused-imports]
🟠 mtok - warnings: src/Mtok.hs:25:1: warning: [GHC-66111] [-Wunused-imports]
🟢 numhask - build successful
🟠 numhask-space - warnings: src/NumHask/Space/Rect.hs:9:5: warning: [GHC-68383] [-Wpattern-names]
🟢 perf - build successful
🟠 poker-fold - warnings: Warning: [no-default-language] Packages using 'cabal-version
🟢 prettychart - build successful
🔴 repl-viewport - Error: [Cabal-7136] - see build log
🟢 semcons - build successful
🔴 sysl - The following errors occurred: - see build log
🟢 web-rep - build successful
🟠 words - warnings: Warning: [unknown-file] The 'license-file' field refers to t

---

## diagnostic progress

**Current batch:** 16 problem repos (5 errors, 11 warnings)

**Fix cards ready:** 2/16
- [anal](loom/haskell-anal-fix.md) ✓ — GHC-87110 module-not-found
- [cabal-graph](loom/haskell-cabal-graph-fix.md) ✓ — GHC-32850 missing-home-modules

**Fix cards pending:** 14
- chart-svg, chart-svg-dev, harpie, huihua, markup-parse, mealy, mnet, mpar, mtok, numhask-space, poker-fold, repl-viewport, sysl, words

**To dispatch all diagnostics:**
```
cat ~/mg/loom/dispatch-diagnostics.txt | tail -n +3
# Copy /background commands → paste into Hermes REPL
```

Each agent writes its own fix card as it completes. Dashboard updates inline.

---

## results

(Build diagnostics and fix suggestions appear below as agents complete)

### anal
- **Status:** ✓ Fixed
- **Error:** GHC-87110 (module not found)
- **Fix:** Create re-export module in mpar
- [Full diagnosis →](loom/haskell-anal-fix.md)

### cabal-graph
- **Status:** ✓ Fixed
- **Error:** GHC-32850 (missing home modules)
- **Fix:** Add CabalParse to other-modules
- [Full diagnosis →](loom/haskell-cabal-graph-fix.md)

