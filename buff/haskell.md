# buff-haskell

*Named session: Haskell library standardization via checklist, with focus on agent-fork as foundation for shared REPL coordination.*

---

Haskell libraries tend to go in ~/haskell/. The repos there are mostly Haskell libraries and can be a good resource for pattern matching solutions.

Default choices:

⟜ language: GHC2024
⟜ cabal stanzas for options and extensions from ~/haskell/numhask-space
⟜ CI as per numhask-space
⟜ doctests in haddocks and no test stanza. testing happens using an independent test runner: cabal-docspec
⟜ CI workflow: copy from ~/haskell/numhask-space/.github/workflows/haskell-ci.yml
⟜ tested-with: GHC 9.14, 9.12, 9.10 (last three versions)

## Import Style

⟜ **Recipe for Prelude conflicts (id, (.))**

When using `Category` or `Arrow` instances:

```haskell
import Prelude hiding (id, (.))
import Control.Category (id, (.))
```

**Why:** `id` and `(.)` from Prelude clash with categorical versions. Hide Prelude's, import Category's explicitly.

⟜ **Development imports: unqualified by default**

Import unqualified during development to catch name clashes for free. Only use `import Prelude qualified` when replacing Prelude entirely (e.g., NumHask).

⟜ **Avoid explicit import list edits**

Don't maintain tight import lists (`import Data.Foo (bar, baz)`). Import unqualified, let the compiler warn on actual namespace conflicts. This avoids cascading bugs from list maintenance.

⟜ **Intent encoding**

- Usually using Prelude? Import unqualified.
- Replacing Prelude? Import qualified and add qualified imports as needed.
- Short-lived conflicts? Hide just the clashing names, import the rest unqualified.

## Agentic Documentation Philosophy

Readme.md and haddocks should be **well-crafted for an agentic landscape**:
- Explain design choices and why they matter in agent contexts
- Provide concrete usage examples for agent workflows
- Document not just _what_ the code does, but _why_ the architecture supports agentic interaction
- Use **bold haddocks** (100% coverage, detailed examples, design sections)
- Readmes have grown in depth as agentic support increased

## agent-fork Library

◉ **COMPLETE** — Published to GitHub https://github.com/tonyday567/agent-fork

- **Module**: Agent.Fork (pi harness for Claude-style LLM interface)
- **Design**: Named pipes (FIFO) for decoupled I/O, pattern from grepl
- **Purpose**: Agentic platform for interactive code exploration, type wrangling
- **Version**: 0.1.0.0, BSD-2-Clause, GHC2024

✓ All sections complete:
- Project initialization (cabal init, module structure, dependencies)
- Code quality (ormolu, hlint, cabal-gild)
- Documentation (readme.md, 100% haddock coverage)
- Release preparation (changelog, tested-with: 9.14, 9.12, 9.10)
- Verification (CI workflow copied, pushed to main)

Status: Awaiting CI final confirmation, ready for Hackage publishing.

## grepl Library (In Progress)

⊢ Status: Ready for GitHub and CI verification

- **Modules**: Grepl, Grepl.Watcher (cabal-repl harness for agentic GHCi interaction)
- **Design**: Named pipes (FIFO) for decoupled I/O from console buffering
- **Purpose**: File-based message passing protocol with markdown-driven workflows
- **Repository**: https://github.com/tonyday567/grepl (awaiting creation)
- **Version**: 0.1.0.0, BSD-3-Clause, GHC2024

✓ Completed:
- Environment check, dependency management
- Code quality: ormolu, hlint, cabal-gild all ✓
- Documentation: readme.md ✓, 100% haddock coverage ✓
- Release Preparation: author updated (Tony Day), changelog, version confirmed
- Verification: CI workflow copied, tested-with expanded (9.14/9.12/9.10)

✓ Published to GitHub: https://github.com/tonyday567/grepl

✓ Fixed: cabal.project local perf dependency → GitHub branch reference (haskell-9.14-working)
  Pattern: Commit current working state of perf to branch, push to GitHub, reference by branch
  No state change—just transparency across machines and CI runners

◆ CI workflow re-triggered on GitHub Actions
  Expected to pass: hlint, ormolu, build (GHC 9.14/9.12/9.10), cabal-docspec
  Status: https://github.com/tonyday567/grepl/actions

◆ Next: Await CI completion, then Publishing (hkgr tagdist → Hackage)

## Strategic Context: Agent Communication & Forking

The ~35 libraries in ~/haskell/ form an interdependent ecosystem. The challenge:
- GHC 9.14 upgrade cascades across all projects
- One library's allow-newer change likely affects others
- Agents need bi-directional communication and shared context

**Solutions in development:**
- **grepl**: Agents share a single cabal repl, listen for types and upstream function changes
- **agent-fork**: Ability for agents to fork themselves (or reading lists / other agents), all held as [Text] in JSONL
  - Token absorber: condensing interaction history
  - Differently-read you: alternative framings of the same agent
  - Communication via jsonl: standardized format for agent state/reading lists

This session's focus: **agent-fork as the foundation for multi-agent coordination in Haskell development.**

---

## Reference: Analysis Documents

⊢ Study (unverified, requires code review):

- **~/self/intake/sabela-analysis.md** — Reactive Haskell notebook patterns
- **~/self/intake/scripths-analysis.md** — Minimal execution engine patterns

These documents propose architectural approaches to shared REPL coordination. Verify against source code before adopting patterns.

## Verified Patterns

⊢ From grepl source code (verified):

- **Marker protocol** — `---SABELA_MARKER_n---` injected into stdout for cell demarcation
- **Named pipes (FIFO)** — Decoupled I/O pattern from console buffering
- **Local dependency coordination** — Reference upstream via GitHub branches during development

These are proven patterns already in use. grepl integrates both analysis frameworks (Sabela + scripths) implicitly in its design.

---

## Build Performance

⊢ cabal build is #1 waiting-point for agents

Agents frequently pause at `cabal build` steps during checklist execution.
This is a natural bottleneck (compilation time) but worth tracking for optimization.

Potential mitigations:
- Incremental builds (already default in cabal)
- Caching strategy in CI/local workflows
- Parallel compilation flags
- Consider when designing library features vs. compilation cost

---

## allow-newer audit

⊢ Review allow-newer specifications across 35 libraries
  After upgrading to GHC 9.14, allow-newer constraints should be minimal.
  Goal: Most projects need no allow-newer (or just *:base if still pinned to older deps).
  Survey shows patterns; audit each cabal.project to cut back to defaults.
  
## Doctest Skeleton

To add to module docs:

```haskell
-- | Identity morphism
-- >>> runFn Pure 42
-- 42
--
-- | Lift a function
-- >>> runFn (Lift (\x -> x + 1)) 5
-- 6
--
-- | Compose: right runs first
-- >>> runFn (Compose (Lift (*2)) (Lift (\x -> x + 1))) 5
-- 12
--
-- | Category instance (. and id)
-- >>> let f = Lift (\x -> x + 1) :: Traced (->) Int Int
-- >>> let g = Lift (\x -> x * 2) :: Traced (->) Int Int
-- >>> runFn (f . g) 5
-- 11
```

---

## Key Pattern: Composition Order

⚠️ **Critical to remember:**

```
Compose f g means: apply g first, then apply f to the result
```

This is **right-to-left** order (standard function composition).

```haskell
-- BAD intuition: "add then times"
-- Compose times2 addOne  would mean: addOne then times2
--                               (5 + 1 = 6, then 6 * 2 = 12)

-- CORRECT: Think of it as (f . g) x = f (g x)
--          where f = times2, g = addOne
--          Compose f g = f . g
```

---

## Keep Implementations, Not Warnings

**Pattern:** Better to keep an unused implementation with a doc comment than delete it to silence a warning.

Implementations are proof. They show *alternative approaches* that may become important later:
- Reference implementations (e.g., `loop''` as fixed-point form vs. `loop'` as knot-tying)
- Witness to earlier design decisions
- Foundation for future bridges or transformations

**Example:**
```haskell
-- | Alternative knot form via fixed point (equivalent to @loop'@).
-- Kept as reference for understanding lazy fixed points.
loop'' :: ((a, k) -> (b, k)) -> (a -> b)
loop'' f = \a -> fst (fix (\(_,c) -> f (a, c)))
```

Add a comment explaining *why* it's there. Don't export it unless it's useful now. The warning `-Wunused-top-binds` is a signal to document intent, not necessarily to delete code.

