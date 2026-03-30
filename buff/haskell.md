# buff-haskell

Haskell libraries tend to go in ~/haskell/. The repos there are mostly Haskell libraries and can be a good resource for pattern matching solutions.

## Defaults

**Language & tooling:**
- Language edition: GHC2024
- Cabal stanzas for options and extensions from ~/haskell/numhask-space
- CI workflow: copy from ~/haskell/numhask-space/.github/workflows/haskell-ci.yml
- Tested-with: GHC 9.14, 9.12, 9.10 (last three versions)

**Testing:**
- Doctests in haddocks, no test stanza
- Testing via cabal-docspec (independent test runner)

## Build Performance

⊢ cabal build is the #1 wait-point for agents

Agents frequently pause at `cabal build` steps during checklist execution.
This is a natural bottleneck (compilation time) but worth tracking for optimization.

Potential mitigations:
- Incremental builds (already default in cabal)
- Caching strategy in CI/local workflows
- Parallel compilation flags
- Consider when designing library features vs. compilation cost

## Development Practices

### Explicit Export Lists & Development

**Pattern:** Modules with explicit export lists signal frozen APIs. If you're adding new functions, the module should have implicit exports.

When pairing:
- If a module has an explicit export list (`module Foo (bar, baz) where`), you're in publication mode
- New functions from pairing should be added to the list, OR the module should switch to implicit exports to return to development mode
- If neither happens, a cleanup agent will see the new function as unused and delete it

**Rule:** Before adding development code to a published module, remove the export list:

```haskell
-- During development, implicit exports:
module Agent.Fork where

-- After finalization, explicit exports:
module Agent.Fork (PiConfig(..), piChannel) where
```

### Import Style

**Prelude conflicts (id, (.))**

When using `Category` or `Arrow` instances:

```haskell
import Prelude hiding (id, (.))
import Control.Category (id, (.))
```

Why: `id` and `(.)` from Prelude clash with categorical versions. Hide Prelude's, import Category's explicitly.

**Unqualified by default during development**

Import unqualified to catch name clashes for free. Only use `import Prelude qualified` when replacing Prelude entirely (e.g., NumHask).

Don't maintain tight import lists (`import Data.Foo (bar, baz)`) during development—import whole modules, let the compiler warn on actual conflicts. This avoids cascading bugs from list maintenance.

### Cabal-docspec in Development

Run tests during development:

```bash
cabal-docspec
```

Doctests use `>>>` format (tested) and live in haddock comments. See Module Header Structure section for setup patterns.

## Code Quality & Preservation

### Keep Implementations, Not Warnings

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

Add a haddock comment explaining *why* it's there. Don't export it unless it's useful now. The warning `-Wunused-top-binds` is a signal to document intent, not necessarily to delete code.

### Comments: Haddock-Attached vs Floating

**Pattern:** Only comments attached to haddock documentation are preserved. Floating comments drift and get deleted.

Floating comments (comments not bound to definitions):
```haskell
-- Section explanation
-- This describes what comes next

foo :: Int -> Int
foo = ...
```

These comments are **fragile**. They drift from context, agents delete them to clean code, they become stale anchors.

Haddock-attached comments (comments bound to definitions):
```haskell
-- | Section explanation: what foo does.
-- 
-- This describes the purpose and usage.
foo :: Int -> Int
foo = ...
```

These comments are **safe**. They're semantically bound to the definition, preserved during refactoring, available in generated documentation.

**Rule:** Put all explanatory intent into haddocks (`-- |` for definitions, `-- ^` for fields). Don't rely on floating comments to preserve design intent—they will be deleted or drift.

If you need structural commentary: make it a haddock doc block. For temporary notes: use an issue or card, not code comments. For architecture: put it in the module header haddock or README.

## Module Header, Haddocks & Doctests

Standard Haskell module structure:

```haskell
-- | One-line summary of module.
--
-- A paragraph or so discussing the intentions of the module.
module MyModule where

import Data.Text
import System.IO

-- $setup
-- >>> import MyModule
-- >>> import Data.Text
--
-- Setup block for module-level doctest imports.
-- Code here runs before each doctest example.

-- | Haddock for first definition with doctest example.
-- 
-- >>> add 2 3
-- 5
add :: Int -> Int -> Int
add x y = x + y
```

**Haddocks:**
- Module header: brief description and design philosophy
- Functions/types: clear doc comments with purpose and typical use
- Data constructors: document each field's meaning and constraints
- Examples: include code blocks (doctest format) for key functions when possible

Aim for 100% coverage. Verify with:

```bash
cabal haddock
```

**Doctests:**
- Use `>>>` format (tested by cabal-docspec)
- Keep examples focused on basic behavior
- Even simple examples help agents understand signatures and patterns
- Use `-- $setup` blocks for common imports across module

Run tests with:

```bash
cabal-docspec
```

## Dependency Management

### allow-newer: Relaxing outdated dependency bounds

**Pattern:** When a transitive dependency has outdated version constraints (e.g., `base>=4.12.0.0 && <4.22` failing on GHC 9.14's base-4.22.0.0), use `allow-newer** in cabal.project to override.

**Using wildcards**
1. Run `cabal build` with no allow-newer
2. If dependency errors occur, try allow-newer: *:base or whatever the underlying stale bound is pointing to.
3. Look at the first error, not the last.
4. Repeat once or twice but no more. After twice you will be heading down a dodgy build plan.

**finding Exact Flags:**

1. Run `cabal build` with no allow-newer
2. Read the **first rejection** in the error output (not the last)
3. Extract `package:library` format: `[__N] rejecting: PACKAGE (conflict: ... => LIBRARY>=...)`
4. Add `PACKAGE:LIBRARY` to allow-newer
5. Repeat until build succeeds or hits a real compilation error

Example from web-rep 0.14.1.0:
```
[__8] next goal: http-api-data (dependency of scotty)
[__8] rejecting: http-api-data-0.7 (conflict: scotty => http-api-data<0.7)
     → add: scotty:http-api-data

[__9] next goal: uuid-types
[__9] rejecting: uuid-types-1.0.6 (conflict: time => template-haskell==2.24.0.0, uuid-types => template-haskell>=2.14 && <2.24)
     → add: uuid-types:template-haskell
```

**Add to cabal.project:**
```
allow-newer:
  package-a:base,
  package-b:template-haskell,
  package-c:time
```

**When to use:**
- After GHC upgrades (9.14) where transitive deps have stale bounds
- During development on cutting-edge GHC versions
- When waiting for upstream to release fixed versions

**Goal:** Keep allow-newer minimal and explicit. Track upstream issues for when bounds get updated.

Ask if documentation of tracked github issues is warranted.
