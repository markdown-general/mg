---
name: haskell
description: Language standards, patterns, and best practices for Haskell development
---

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

---

## Typed Holes for Primop Integration

When wrapping raw primops (especially unlifted types), manually constructing the wrapper is error-prone because:
- GHC infers fresh type variables instead of using scoped ones
- Explicit type signatures can shadow the outer forall
- The nesting of State# threading is complex

**Technique: Use `_hole` to ask GHC what it needs.**

Instead of guessing the wrapper structure, write:

```haskell
{-# LANGUAGE MagicHash, UnboxedTuples, ScopedTypeVariables, RankNTypes #-}
import GHC.Exts

data Tag a = Tag (PromptTag# a)

-- Defer type checking to see what control0# expects
myWrapper :: forall a b. Tag a -> ((IO b -> IO a) -> IO a) -> IO b
myWrapper (Tag t) f = IO (control0# t _hole)
```

Compile with typed holes enabled:
```bash
ghc -fdefer-typed-holes -fno-diagnostics-show-caret myfile.hs
```

GHC outputs the exact type needed:

```
Found hole:
  _hole :: ((State# RW -> (# State# RW, b #))
            -> State# RW -> (# State# RW, a #))
           -> State# RW -> (# State# RW, a #)
```

Now you know:
- The argument is a **function** (takes `g`, returns a computation)
- `g` is the captured continuation with type `(State# RW -> (# State# RW, b #)) -> State# RW -> (# State# RW, a #)`
- You must return a computation of type `State# RW -> (# State# RW, a #)`

Use this to build the wrapper correctly.

**Why this works:**
- ScopedTypeVariables ensures `a` and `b` from the outer `forall` are visible to GHC
- GHC's type inference respects the signature's quantification
- You get concrete feedback instead of guessing at lambda structures

This is especially useful for:
- Primops with complex unlifted/lifted boundaries (catch#, control0#, etc.)
- Multi-level State# threading
- Testing wrapper candidates before committing to code

## Markdown cards as doctest repositories

Cards are **complete, working designs** with prose, code, and doctests. They are doctest repositories waiting for tooling to mature.

**Current workflow (manual extraction & testing):**

Cards contain fence blocks with doctests in comments. Extract and test:

```bash
# Extract fence blocks to temporary .hs file
markdown-unlit -h card.md card.md /tmp/card.hs

# Run doctests on extracted file
cabal exec doctest -- /tmp/card.hs
```

All doctests in the extracted file should pass. When they do, the card is a **valid, working design**.

**Future:** When markdown-unlit and cabal integration matures, this extraction will be automatic.

**What cards contain:**

- Prose narrative (design explanation, reasoning, context)
- Haskell fence blocks with doctests in comments
- Alternative implementations (reference forms, design witnesses)
- Examples with doctest validation
- Mermaid diagrams and visual reasoning

**Guidelines for writing cards:**

- Include doctests in fence block comments (`-- >>>` format)
- Use `import` statements at the top of fence blocks
- Keep examples focused and representative
- A passing doctest means the card's design is validated and ready
- A broken card is a bug—doctests verify it's not

**Testing flow:**

1. Write card with narrative + fence blocks + doctests
2. Extract with markdown-unlit
3. Run doctests on extracted .hs file
4. Passing doctests = card is a valid, ready-to-use design
5. Commit card as proof-by-narrative

**Note:** Markdown cards are NOT integrated into cabal build stanzas. The *.md files are reference material and doctest repositories. Testing happens via manual extraction; when technology catches up, integration will be automatic. Haddock doctests in module definitions are still the standard for compiled libraries.

## core library skills

**core library skills** ⟜ living cards for how we use Haskell libraries

Each card documents one library (containers, text, bytestring, profunctors, kan-extensions, aeson, lens, etc.) as a **recipe**: import qualifications, common patterns, type-level conventions, and the idioms we actually use.

**The workflow:**

1. **Start a project** — `cabal init`, add dependencies (e.g., `containers` and `lens`)
2. **Open the cards** — read `buff/haskell-containers.md` and `buff/haskell-lens.md`
3. **Test in a fresh repl** — `cabal repl`, import qualified as the card specifies, run the examples
4. **Discover friction** — existing code clashes with the introduced encodings (wrong qualifiers, missing patterns, unfamiliar combinators)
5. **Resolve immediately** — the card shows the right way; friction becomes education

**Why this works:**
- Cards are **tested artifacts**, not documentation you read once
- A fresh repl forces honesty — if the card is wrong, the type checker complains
- Friction between existing code and library idioms surfaces early, when it's cheap to fix
- Over time, the cards become **team conventions** encoded as working examples

**Candidate libraries:**
- containers (Map, Set, Seq patterns)
- text (Text vs String, strict/lazy, builder patterns)
- bytestring (ByteString packing, parsing, builder)
- profunctors (dimap, lmap, rmap, strong, choice)
- kan-extensions (Ran, Lan, Yoneda, Coyoneda)
- aeson (ToJSON/FromJSON, generic deriving, lens-aeson)
- lens (folds, traversals, prisms, basic optics)
- mtl (Reader, State, Except — transformer stacks)
- unordered-containers (HashMap as default map)
- vector (loop fusion, mutable interfaces)

⟝ each card: import style, 5-10 essential combinators, common gotchas, doctest-validated examples
⟝ cards live in `buff/haskell-<library>.md` or as skills in `buff/haskell-<library>/`

---

## module type check

A module type check is where:

- Existing type signatures for top-level functions are commented out.
- GHC inference is checked and any polymorphism or change to signatures is added to get a compile, and then commented in to compare with the old signature.

This can be a fast but comprehesive step to simplifying/verifying/refactoring a Haskell module:
 - GHC does the type inference work
 - You immediately see polymorphism, degeneration, or structural flaws hidden ny monomorphism.
 - Comparing inferred vs. written signatures reveals design intent vs. reality
 - Minimal changes to get compile—only adding what's necessary
