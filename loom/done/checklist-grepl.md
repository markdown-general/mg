# Checklist: grepl

Reference: [Release Checklist](checklist.md)  
Reference: [grepl Library Report](grepl-report.md)

## Environment Check

version check ⟜ Verify ghcup setup and upgrade tools as needed.

```bash
ghcup list -c set -r
```

Expected: ghc 9.14+, cabal 3.16+, hls 2.13+, stack 3.7+

cabal update ⟜ Refresh package index.

```bash
cabal update
```

✓ toolchain verified

## Initialization

⊢ review and confirm current project state and version.

◆ repo: ~/haskell/grepl (git main branch, pushed)
◆ library version in grepl.cabal: 0.1.0.0
◆ github: https://github.com/tonyday567/grepl (exists)
◆ hackage version: none (not published)

⊢ end state understood

Publishing grepl 0.1.0.0 to Hackage for first time. Standardizing per checklist.

✓ Initialization complete

## Dependency Management

⊢ cabal.project inspection

✓ cabal.project fixed for CI compatibility:
```
packages:
  grepl.cabal

source-repository-package
  type: git
  location: https://github.com/tonyday567/perf.git
  branch: haskell-9.14-working
```

Changed from: local `../perf/perf.cabal` (works locally, breaks CI)
Changed to: GitHub reference to perf branch `haskell-9.14-working` (current state)

This pattern: commit local dependency state to a working branch, push to GitHub, reference by branch name. No state change—just making local state available to CI. Keeps iteration transparent across machines and CI runners.

⊢ Check dependencies

cabal outdated ⟜ Check for outdated dependencies.

Outdated bounds detected:
- filepath: pinned to 1.4, latest 1.5.5.0
- time: pinned to 1.9, latest 1.15

These can be widened when tested-with is expanded to GHC 9.12, 9.10.

cabal gen-bounds ⟜ Generate and apply version bounds.

Current bounds are conservative (based on GHC 9.14). Will revisit after tested-with expansion.

⬡ ⟜ dependency review complete → proceed to Code Quality

## Code Quality Checks

⊢ Verify code builds cleanly and passes lints

build check with warnings for unused dependencies.

```bash
cabal clean && cabal build --ghc-options=-Wunused-packages
```

✓ Build successful (warning on process not used in exe, acceptable)

cabal formatter ⟜ fix cabal file formatting.

```bash
cabal-gild -m check --input=grepl.cabal
cabal-gild --io=grepl.cabal
```

✓ cabal-gild applied and verified ✓

pragma cleanup ⟜ Review and update to GHC2024 extensions where possible.

✓ Using GHC2024, minimal pragmas

ormolu (code formatting) ⟜ fix Haskell formatting.

```bash
ormolu --mode inplace $(git ls-files '*.hs')
ormolu --mode check $(git ls-files '*.hs')
```

✓ ormolu applied and verified ✓

hlint ⟜ fix style or add exclusions

Issues fixed:
- Removed unused LANGUAGE pragma (OverloadedLabels)
- Removed redundant $ operators (2 occurrences)
- Replaced manual unless definition with Control.Monad.unless

```bash
hlint .
```

✓ hlint check ✓ (no hints)

✓ Code Quality Checks complete

## Documentation & Testing

⊢ Verify doctests, haddocks, and readme

readme.md ✓ Created with agentic focus:
- Overview of cabal-repl harness and named-pipe design
- Architecture with core components and design rationale
- Usage examples (basic, custom config, executable channel, agent workflows)
- Integration guidance for agentic systems with specific use cases
- Design highlights and related work

doctests ⟜ run docspec tests.

✓ cabal-docspec executed
✓ Library component: 0 examples (none in source, appropriate for initial release)
Note: Executable has dependency on local `perf` library; doctest focuses on library.

generate and review haddock

```bash
cabal haddock
```

✓ cabal haddock generated
✓ **100% haddock coverage:**
  - Grepl: 100% (5/5 items documented, including module header)
  - Grepl.Watcher: 100% (3/3 items documented, including module header)

Haddock documentation output:
./dist-newstyle/build/aarch64-osx/ghc-9.14.1/grepl-0.1.0.0/doc/html/grepl

Module headers include:
- Overview with agentic design philosophy
- Usage examples with code blocks
- Design rationale explaining named-pipe pattern
- Cross-references to related modules

✓ Documentation & Testing complete

## Release Preparation

⊢ Update version, changelog, and documentation

ChangeLog ✓ Created CHANGELOG.md:
```
## 0.1.0.0 -- 2026-03-08

File-based message passing protocol for querying GHCi instances.

* Initial release: ChannelConfig and channel for cabal-repl process management
* Named pipe (FIFO) design for reliable console application interaction
* Grepl.Watcher for monitoring markdown output logs with FSNotify
* 100% haddock coverage with agentic workflow examples
* Comprehensive readme with usage patterns and design rationale
```

Versioning ✓ Confirmed version: 0.1.0.0 in grepl.cabal

Author ✓ Updated: Anonymous → Tony Day

✓ Release Preparation complete

## Verification

⊢ Verify CI workflow and confirm commits

CI workflow ✓ Copied from ~/haskell/numhask-space/.github/workflows/haskell-ci.yml

tested-with ✓ Expanded grepl.cabal:
```cabal
tested-with:
  ghc ==9.14.1,
  ghc ==9.12.2,
  ghc ==9.10.1
```

Commits pushed to GitHub:
- 2737be8 release: update author, add changelog, add extra-doc-files
- 15e6f73 verify: expand tested-with to GHC 9.14/9.12/9.10, add CI workflow

✓ Pushed to origin/main: https://github.com/tonyday567/grepl

◆ CI verification: GitHub Actions triggered on tonyday567/grepl

Expected to pass:
- hlint
- ormolu
- build: GHC 9.14, 9.12, 9.10 on ubuntu-latest
- build: GHC 9.14 on windows-latest, macos-latest
- cabal-docspec

Status: https://github.com/tonyday567/grepl/actions

◊ Next: Wait for CI to pass, then Publishing
