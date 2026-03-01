# filesystem reorganization complete ⟜ 2026-03-01

## What happened

- ✓ Created `~/haskell/` directory
- ✓ Moved 19 Haskell libraries from `~/repos/` to `~/haskell/`
- ✓ Renamed `~/markdown-general/` → `~/mg/`
- ✓ `~/other/` organized (pi-mono, pi-skills, conversations, external repos)
- ✓ `~/repos/` now contains mg-associated projects and others
- ✓ `~/org/`, `~/stuff/`, `~/.config/doom/` unchanged
- ✓ `~/other/dotfiles/` symlinks preserved

## Moved to ~/haskell/

box, box-socket, cabal-graph, chart-svg, chart-svg-dev, dataframe-load, ghcid, harpie, harpie-numhask, hyp, hyp1, machines, mealy, mpar, mtok, numhask, numhask-space, prettychart, rlm-minimal

## Remaining in ~/repos/

anal, apps, calculational, claude-code-showcase, claude-md-skill, distributors, dotfiles, dotparse, ephemeral, eulerproject, formatn, functorio, grepl, hcount, huihua, haskell-language-server, machines, markup-parse, perf, pi-mono, poker-fold, skills, superpowers, synthesis, tcat, tonyday567, web-rep, words

## Org structure now

```
~
├── haskell/         ⟜ 19 Haskell libraries
├── repos/           ⟜ mg-associated (non-Haskell) + mixed
├── other/           ⟜ Research, external repos, dependencies
├── mg/              ⟜ Repository (was markdown-general)
├── org/             ⟜ Private org (unchanged)
├── stuff/           ⟜ Private docs (unchanged)
├── self/            ⟜ Private mg version (unchanged)
├── site/            ⟜ Broken Hugo site [side-quest]
└── .config/doom/    ⟜ Doom config (unchanged)
```

## Side-quests captured

- Review unclear repos: dotfiles (in repos/), skills, perf, synthesis, ephemeral, tonyday567, distributors, eulerproject, formatn, grepl, huihua, hcount, pokerfold, repl-viewport, tcat, web-rep
- Fix broken Hugo site (~/site/)
- Verify all Haskell project dependencies still resolve

## Git history

All repositories preserved with full history (used `mv`, not `cp`).

## Next

Structure is now consistent. Task categories align with directory names. Easier to navigate and organize work.
