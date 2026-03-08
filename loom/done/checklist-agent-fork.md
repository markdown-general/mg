# Checklist: agent-fork

◉ **COMPLETE** — 2026-03-08

Published to GitHub: https://github.com/tonyday567/agent-fork  
✓ CI passed: hlint, ormolu, build (GHC 9.14/9.12/9.10), cabal-docspec  
Ready for Hackage publishing

---

Reference: [Release Checklist](checklist.md)

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

◆ repo: ~/haskell/agent-fork (new library, not yet created)
◆ library version: 0.1.0.0 (new project)
◆ github tags: none
◆ hackage version: none (not published)

⊢ end state understood

First version: agent-fork 0.1.0.0 wrapping pi executable with Claude-style LLM interface.
Harness for agentic experimentation similar to grepl architecture.

✓ Initialization complete

◊ Next: Project Initialization (cabal init)

## Project Initialization

⊢ cabal init

```bash
mkdir -p ~/haskell/agent-fork
cd ~/haskell/agent-fork
cabal init --non-interactive --minimal --lib --language=GHC2024 --license=BSD-2-Clause -p agent-fork -d process -d containers
```

✓ Project created at ~/haskell/agent-fork/

✓ Module structure: src/Agent/Fork.hs (Agent.Fork)

✓ cabal file updated:
- synopsis: Agent harness for pi executable with Claude-style LLM interface
- description: Harness wrapping pi for agentic code exploration and type wrangling
- exposed-modules: Agent.Fork
- dependencies: base, process, containers
- version: 0.1.0.0, GHC2024, BSD-2-Clause

✓ Dependencies used in module:
- System.Process (from process)
- Data.Map.Strict (from containers)

✓ Initial compile signal: `cabal build` ✓ (builds successfully)

✓ Project Initialization complete

## Dependency Management

⊢ cabal.project inspection

✓ Created cabal.project with default pattern:
```
packages:
  agent-fork.cabal

write-ghc-environment-files: always
```

⊢ Check dependencies

cabal outdated ✓ All dependencies are up to date.

cabal gen-bounds ✓ Generated and applied version bounds:
```
base >=4.14 && <5
containers >=0.8 && <0.9
process >=1.6.26 && <1.7
```

✓ Verified build succeeds with applied bounds

✓ Dependency Management complete

## Code Quality Checks

⊢ Copy relevant code from grepl

✓ Adapted Grepl.hs to Agent.Fork:
- PiConfig structure (replaces ChannelConfig)
- Named pipe FIFO channel management (ensureFifo, piChannel)
- Process spawning with stdin/stdout/stderr handle management
- Pattern: stdin as FIFO for agent queries, stdout/stderr logged to markdown

✓ Updated dependencies in cabal file:
```
async >=2.2 && <2.3
directory >=1.3 && <1.4
```

✓ Verified clean build: `cabal build` ✓

⊢ Verify code builds cleanly and passes lints

build check with warnings for unused dependencies.

```bash
cabal clean && cabal build --ghc-options=-Wunused-packages
```

✓ Removed unused dependencies (containers, async)
✓ Build clean with no unused package warnings

cabal formatter ⟜ fix cabal file formatting.

✓ cabal-gild applied (cabal-version: 3.16 → 3.0 for ormolu compatibility)
✓ cabal-gild check ✓

pragma cleanup ⟜ Review and update to GHC2024 extensions where possible.

✓ Using GHC2024 language edition (no pragmas needed)

ormolu (code formatting) ⟜ fix Haskell formatting.

✓ ormolu applied formatting
✓ ormolu check ✓

hlint ⟜ fix style or add exclusions

✓ Fixed: replaced manual unless with Control.Monad.unless
✓ hlint check ✓ (no hints)

✓ Code Quality Checks complete

## Repository Setup

⊢ Initialize git and push to GitHub

✓ Local git repository initialized
✓ Initial commit: agent-fork library with pi channel harness
✓ Remote added: https://github.com/tonyday567/agent-fork.git
✓ Pushed to origin/main ✓

✓ Repository Setup complete

## Documentation & Testing

⊢ Verify doctests, haddocks, and readme

readme.md ✓ Created with agentic focus:
- Overview of pi harness and named-pipe design
- Architecture and design rationale
- Usage examples (basic, custom config, agent workflows)
- Integration guidance for agentic systems
- Cross-references to related work

doctests ⟜ run docspec tests.

✓ cabal-docspec executed successfully
✓ 0 examples (none added yet, appropriate for initial release)

generate and review haddock

✓ cabal haddock generated
✓ 100% haddock coverage (4/4 items documented)
- Module overview with agentic design philosophy
- PiConfig data type with field documentation
- defaultPiConfig with usage notes
- ensureFifo with description
- piChannel with detailed workflow example

Haddock documentation output:
./dist-newstyle/build/aarch64-osx/ghc-9.14.1/agent-fork-0.1.0.0/doc/html/agent-fork

✓ Documentation & Testing complete

## Release Preparation

⊢ Update version, changelog, and documentation

ChangeLog ✓ Updated CHANGELOG.md:
```
## 0.1.0.0 -- 2026-03-08

Agent harness for pi executable with Claude-style LLM interface.

* Initial release: PiConfig and piChannel for agent-driven pi interaction
* Named pipe (FIFO) design for reliable console application interaction
* 100% haddock coverage with agentic workflow examples
* Comprehensive readme with usage patterns and design rationale
```

Versioning ✓ Confirmed version: 0.1.0.0 in agent-fork.cabal

✓ Release Preparation complete

## Verification

⊢ Verify CI workflow and confirm commits

CI workflow ✓ Copied from ~/haskell/numhask-space/.github/workflows/haskell-ci.yml

tested-with ✓ Updated agent-fork.cabal:
```cabal
tested-with:
  ghc ==9.14.1,
  ghc ==9.12.2,
  ghc ==9.10.1
```

branch, commit, and push ✓ Completed:

```bash
git add -A
git commit -m "release: update changelog, add tested-with, add CI workflow"
git push origin main
```

Commits on main:
- 11436fa format: apply cabal-gild
- 7bc5e6b release: update changelog, add tested-with, add CI workflow
- 921163d docs: add readme.md and enhance haddock documentation for agentic workflows
- 7570b27 initial commit: agent-fork library with pi channel harness

Local verification (all passed):
✓ cabal clean && cabal build
✓ hlint . (no hints)
✓ ormolu --mode check
✓ cabal-gild formatting
✓ cabal-docspec (0 examples, OK)

◆ CI verification: GitHub Actions triggered on push to tonyday567/agent-fork

Workflows running:
- hlint
- ormolu
- build: GHC 9.14, 9.12, 9.10 on ubuntu-latest
- build: GHC 9.14 on windows-latest, macos-latest
- cabal-docspec

Status: https://github.com/tonyday567/agent-fork/actions

◊ Next: Confirm CI passes, then Publishing
