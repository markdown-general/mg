---
name: haskell-checklist
description: Release process, publishing standards, and quality gates for Haskell packages
---

# Release Checklist ⟜ Haskell Package Publishing

◊ ⬡

## Environment Check

⊢ ghcup

version check ⟜ Verify ghcup setup and upgrade tools as needed.

```bash
ghcup list -c set -r
```

Expected: ghc 9.14+, cabal 3.16+, hls 2.13+, stack 3.7+

Ask for upgrades if needed.

⊢ cabal update ⟜ Refresh package index.

```bash
cabal update
```


⬡ toolchain current → proceed to Initialization

## Initialization

⊢ review and confirm current project state and version.

Capture the current state of the project before proceeding. These data points may need reverification later:

◆ repo location and branch ⟜ Path to repo and current branch (new project, feature branch, main, etc.)

◆ library version in .cabal ⟜ Version string (e.g., 0.1.0.0 for new projects)

◆ github tags ⟜ Existing release tags (usually none for new projects)

◆ hackage version ⟜ Current published version on Hackage (usually none for new projects)

⊢ end state understood and described ⟜ Write a clear statement of what publishing this version means.

**For new libraries starting from scratch:**

- **Skip** versioning checks (start at 0.1.0.0)
- **Skip** upstream publishing checks (first release)
- **Skip** ChangeLog entries for 0.1.0.0 or start fresh
- **Modify** tested-with in .cabal file to include only the GHC versions you support
- **All other sections apply** in the same order

## Dependency Management

⊢ cabal.project inspection ⟜ Review cabal.project & cabal.project.local files.

**Default cabal.project pattern:**

```
packages:
  <name>.cabal

write-ghc-environment-files: always
```

**Local Dependency Pattern:**

If cabal.project references local packages (e.g., `../perf/perf.cabal`):

1. Commit the local dependency state to its own branch (e.g., `haskell-9.14-working`)
2. Push that branch to GitHub
3. Reference by branch name in cabal.project:

```cabal
packages:
  <name>.cabal

source-repository-package
  type: git
  location: https://github.com/<user>/<dep>.git
  branch: haskell-9.14-working
```

Why: This pattern makes current working state available to CI without changing the dependency itself. No version bumps, no published releases—just transparency across machines.

Notes:
- Single package is the default; most projects follow this
- `write-ghc-environment-files: always` enables GHCi and IDE integration
- Local paths work for development; use GitHub branches for CI and publishing
- When upgrading GHC across many interdependent libraries, commit working states to branches
- Goal: Keep cabal.project minimal; resolve local paths before releasing

⊢ Check dependencies

cabal outdated ⟜ Check for outdated dependencies.

cabal gen-bounds ⟜ Generate and apply version bounds.

⬡ ⟜ dependencies resolved → proceed to Code Quality

## Code Quality Checks

⊢ Verify code builds cleanly and passes lints

build check with warnings for unused dependencies.

```bash
cabal clean && cabal build --ghc-options=-Wunused-packages
```

cabal formatter ⟜ fix cabal file formatting.

```bash
cabal-gild -m check --input=<package>.cabal
cabal-gild --io=<package>.cabal
```

pragma cleanup ⟜ Review and update to GHC2024 extensions where possible.

ormolu (code formatting) ⟜ fix Haskell formatting.

```bash
ormolu --mode check $(git ls-files '*.hs')
ormolu --mode inplace $(git ls-files '*.hs')
```

hlint ⟜ fix style or add exclusions

```bash
hlint .
```

⬡ ⟜ all checks pass → proceed to Documentation

## Documentation & Testing

⊢ Verify doctests, haddocks, and readme

**readme.md** ⟜ Should cover:
- Badges (Hackage, CI workflow)
- Title and brief description (what problem it solves)
- Architecture or design overview (especially for agentic/complex libraries)
- Usage section with code examples (basic + advanced scenarios)
- For agentic libraries: explain design choices and agent workflow integration
- Related work / references (links to dependencies or inspiration)

Length varies by library age and complexity; agentic libraries trend longer. Avoid org-mode literate docs in readme; use simple markdown with code blocks.

**haddock documentation** ⟜ Aim for 100% coverage:
- Module header: Overview, usage examples, design philosophy
- Exported functions/types: Clear doc comments with purpose and typical use
- Data constructors: Document each field's meaning and constraints
- Examples: Include code blocks (doctest-style) for key functions when possible
- Cross-references: Link to related items and external resources

Generate and review:

```bash
cabal haddock
```

Verify 100% coverage in output: `X% (Y / Z) in 'ModuleName'`

**doctests** ⟜ Encourage simple examples for exposed functions.

For each exported function, consider a doctest example:

```haskell
-- | Add two numbers
-- >>> add 2 3
-- 5
add :: Int -> Int -> Int
add x y = x + y
```

Run docspec tests:

```bash
cabal-docspec
```

Keep doctests focused on basic behavior; avoid complex setup. Even simple examples help agents understand function signatures and common patterns.

Alternative (if using doctest-parallel):

```bash
cabal run doctests
```

cabal install ⟜ test library can be imported and used.

```bash
cabal install
```

⬡ ⟜ docs and tests pass → proceed to Release Preparation

## Release Preparation

⊢ Update version, changelog, and documentation

ChangeLog ⟜ Update ChangeLog.md with release notes.

Versioning ⟜ Check current Hackage version and bump package version in .cabal file using [PVP](https://pvp.haskell.org/).

⬡ ⟜ version and changelog updated → proceed to Verification

---

## Verification

⊢ Verify CI workflow and confirm commits

CI workflow ⟜ Copy from ~/haskell/numhask-space/.github/workflows/haskell-ci.yml if not present.

tested-with ⟜ Update .cabal file to test against last three GHC versions.

```cabal
tested-with:
  ghc ==9.14.1,
  ghc ==9.12.2,
  ghc ==9.10.1
```

For Stack-supported libraries: also update stack.yaml resolver as needed.

branch, commit, and push

```bash
git branch feature/release-X.Y.Z
git add -A
git commit -m "release X.Y.Z: update changelog, version, CI workflow"
git push origin feature/release-X.Y.Z
```

verify CI passes ⟜ Wait for GitHub Actions to complete.

All workflows should pass:
- hlint
- ormolu
- build (GHC 9.14, 9.12, 9.10 on ubuntu-latest + 9.14 on windows/macos)
- cabal-docspec

stack checks ⟜ (optional, for Stack-supported libraries)

```bash
stack init --resolver nightly --ignore-subdirs
stack build --resolver nightly --haddock --test --bench --no-run-benchmarks
```

Reference: [Stackage verification](https://github.com/commercialhaskell/stackage/blob/master/verify-package)

⬡ ⟜ CI passes and commits verified → proceed to Publishing

## Publishing

⊢ Publish package to Hackage

merge to main ⟜ After Verification passes, merge feature branch to main:

```bash
git checkout main
git pull origin main
git merge feature/release-X.Y.Z
git push origin main
```

final check on main

```bash
cabal clean && cabal build && cabal-docspec
```

git tag ⟜ Tag the release commit.

```bash
git tag vX.Y.Z
```

cabal check ⟜ Verify package metadata.

```bash
cabal check
```

cabal sdist ⟜ Build source distribution.

```bash
cabal sdist
```

git push tag ⟜ Push tag to GitHub.

```bash
git push origin vX.Y.Z
```

cabal upload ⟜ Publish to Hackage.

```bash
cabal upload --publish dist-newstyle/sdist/<package>-X.Y.Z.tar.gz
```

check Hackage ⟜ Verify package appears on Hackage and haddocks build correctly.

If haddocks fail on Hackage, build and upload docs manually:

```bash
cabal haddock --builddir=docs --haddock-for-hackage --enable-doc
cabal upload -d --publish docs/*-docs.tar.gz
```

◉ ⟜ package published and verified on Hackage → release complete

---

## Quick Reference: Tool Versions

Current recommended versions (as of March 2026):

- GHC: 9.14.1 (latest) or 9.12+ (stable)
- Cabal: 3.16.1.0 (latest)
- HLS: 2.13.0.0 (latest)
- Stack: 3.9.1 (latest)
- cabal-gild, hlint, ormolu: latest from cabal install
- cabal-docspec: latest from cabal-extras repo

Verify with:

```bash
ghcup list -c set -r
which hlint ormolu hkgr cabal-gild cabal-docspec
```

---

## Case Study: grepl ⟜ Applying the Checklist

**Project:** ~/haskell/grepl (REPL I/O protocol for agents)

**Status:** Engineered, compiles cleanly. Needs standardization.

**Checklist Application:**

### Documentation Gap

**Current:** No readme.md, missing module headers (Grepl, Grepl.Watcher)

**Action:** Create readme.md with:
- Title: "grepl — Agent-Friendly REPL I/O Protocol"
- Problem: Agents need bidirectional REPL interaction; named pipes solve buffering issues
- Architecture: ChannelConfig pattern, FSNotify watcher, PTY spawning
- Usage: Basic example (cabal repl setup) + PTY interaction example (spawnCabalRepl)
- Design philosophy: Why aux primitives matter (aux ≠ replacement, agent-optimized primitives)
- Related: Grepl.CircuitDev for interactive development, cards/dev-guide.md for patterns

**Action:** Add haddock module headers:
```haskell
-- | Grepl: REPL protocol for agent-to-GHCi communication.
-- 
-- = Architecture
-- 
-- Grepl uses named pipes (FIFOs) for decoupled I/O:
-- - stdin/stdout/stderr redirected to separate files
-- - Prevents buffering issues when agents interact with @cabal repl@
-- - Process lifecycle independent of I/O consumption
-- 
-- = Usage
-- 
-- For interactive development, use 'Grepl.CircuitDev':
--
-- > import Grepl.CircuitDev
-- > (pty, ph) <- spawnCabalRepl
-- > writePty pty "1 + 1\n"
-- > output <- readPty pty
--
module Grepl where
```

### Metadata Updates

**Current:** author = "Anonymous", tested-with = GHC 9.14.1 only

**Action:** Update grepl.cabal:
```cabal
author:              Tony Day
maintainer:          tonyday567@gmail.com

tested-with:
  ghc ==9.14.1,
  ghc ==9.12.2,
  ghc ==9.10.1
```

**Action:** Populate CHANGELOG.md:
```markdown
# Changelog

## 0.1.0.0 — 2026-04-28

- Initial release
- Named pipe protocol for REPL communication (ChannelConfig, piping)
- PTY spawning (spawnCabalRepl, spawnCmd)
- FSNotify watcher for file-based triggers (Grepl.Watcher)
- Grepl.CircuitDev module for interactive circuit development
- posix-pty integration for live cabal repl processes
```

### Code Quality

**Actions:**
```bash
cd ~/haskell/grepl

# Format
cabal-gild --io=grepl.cabal
ormolu --mode inplace $(git ls-files '*.hs')

# Lint
hlint .

# Build clean
cabal clean && cabal build --ghc-options=-Wunused-packages

# Test
cabal-docspec

# Haddock
cabal haddock
```

Expect: 100% haddock coverage after module header additions.

### CI Workflow

**Current:** CI workflow missing (check .github/workflows/)

**Action:** Copy template:
```bash
cp ~/haskell/numhask-space/.github/workflows/haskell-ci.yml ~/haskell/grepl/.github/workflows/
```

Update matrix to test GHC 9.14, 9.12, 9.10.

### Dependency Verification

**Current:** posix-pty dependency (posix only—note platform constraint)

**Verify:** cabal.project correctly references circuits as local dependency

```cabal
packages:
  grepl.cabal

source-repository-package
  type: git
  location: https://github.com/tonyday567/circuits.git
  branch: main

write-ghc-environment-files: always
```

### Session Value Preservation

**Recent engineering session (2026-04-26 to 2026-04-28):**
- Grepl.CircuitDev module created (interactive harness for circuits)
- cards/dev-guide.md written (patterns, workflow, examples)
- PTY spawning integrated and tested
- Circuit tensor types proven (simultaneous vs sequential feedback)

**Preservation action:** Ensure dev-guide.md content is mirrored in module haddocks so knowledge persists beyond one session.

### Estimated Effort

1. **Documentation** (60 min): readme.md, module headers
2. **Metadata** (15 min): cabal, CHANGELOG
3. **Code quality** (30 min): formatting, linting, doctest
4. **CI setup** (15 min): workflow copy, matrix update
5. **Verification** (20 min): build, haddock, test

**Total:** ~2-3 hours for complete standardization

### Execution Path

1. Start with documentation (readme + module headers)
2. Update cabal metadata
3. Run code quality checks (formatting, lint)
4. Set up CI workflow
5. Final verification (build clean, haddock, doctest, CI pass)
6. Commit and push
