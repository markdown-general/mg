# <<loop>> in parser-speed ⊙ Deep Dive & Fix Attempts

## Problem

Running `cabal exec parser-speed --mealy` triggers:
```
parser-speed: Uncaught exception ghc-internal:GHC.Internal.Control.Exception.Base.NonTermination:
<<loop>>
```

## Root Cause Analysis (Confirmed)

The issue is in `compiledMarkupLexer` inject at line ~507 in src/Lexer.hs.

### The Circular Dependency

```haskell
(\wi@(WI _ i) ->
  let t0 = s1i (wi, c0)          -- Depends on c0
      s0 = s2i ((undefined, i), lazy c0)  -- Depends on c0
      c0 = snd (s2e s0)          -- Depends on s0
  in  (s0, t0))
```

This is a lazy knot (mutual recursion), which is fine in Haskell. But there's a CRITICAL strictness issue.

### The Deadlock Mechanism

1. When `fi` is called (first time), the lambda body evaluates
2. `s0 = s2i ((undefined, i), lazy c0)` is evaluated
3. `s2i` is the stage2 init function, which does:
   ```haskell
   (\input -> let ~((_, i), ctx) = input in (Nothing, OAccState i 0 ctx))
   ```
4. The irrefutable pattern `~((_, i), ctx)` doesn't force the tuple (good)
5. BUT: `OAccState i 0 ctx` **forces ctx** because `oCtx` field is **strict** (`!MarkupCtx`)
6. `ctx = lazy c0`, so forcing ctx forces c0
7. `c0 = snd (s2e s0)`
8. `s2e` tries to extract from s0, which means evaluating it fully
9. But s0 is STILL BEING CONSTRUCTED in step 2!
10. **DEADLOCK**: Circular forcing

### Why Comments Were Wrong

The inject function comments claim:
```haskell
-- i is passed via a lazy tuple so OAccState i 0 ctx does not force ctx.
```

**This is false.** Data constructors in Haskell are strict in their arguments.
Even with `lazy c0` wrapping, the constructor application `OAccState i 0 ctx` forces all arguments.

## Fix Attempts Made

### Attempt 1: Make oCtx lazy (remove !)
```haskell
data OAccState = OAccState
  { oStart :: {-# UNPACK #-} !Int
  , oLen   :: {-# UNPACK #-} !Int
  , oCtx   :: MarkupCtx  -- removed !
  }
```
**Result:** Still loops. Reason: removing `!` from a field doesn't make the constructor lazy in that argument.

### Attempt 2: Wrap context in LazyCtx newtype
```haskell
newtype LazyCtx = LazyCtx { unLazyCtx :: MarkupCtx }

data OAccState = OAccState
  { oStart :: {-# UNPACK #-} !Int
  , oLen   :: {-# UNPACK #-} !Int
  , oCtx   :: LazyCtx
  }
```
**Result:** Still loops. Reason: newtype doesn't change constructor strictness.

### Attempt 3: Restructure let bindings with irrefutable pattern
```haskell
(\wi@(WI _ i) ->
  let ~(s0, (_, c0)) = (s0, s2e s0)
          where s0 = s2i ((undefined, i), lazy c0)
      t0 = s1i (wi, c0)
  in  (s0, t0))
```
**Result:** Still loops. Reason: pattern matching `(_, c0)` from `s2e s0` still forces s0.

## The Real Problem

The fundamental issue is:
- `OAccState` data constructor is **strict in all arguments**
- Haskell data constructors are strict by default
- There's no way to make a data constructor lazy in an argument
- The only way to defer evaluation is to NOT construct the value yet

## Possible Real Fixes (Unimplemented)

### Option A: Change stage2 architecture
Don't return OAccState from init. Return a wrapper that defers construction:
```haskell
data StateThunk = StateThunk { forceState :: () -> OAccState }

-- In init:
(\input -> let ~((_, i), ctx) = input 
           in (Nothing, StateThunk (\() -> OAccState i 0 ctx)))
```
**Problem:** Requires changing stage2's type signature and all downstream code.

### Option B: Use unsafePerformIO or ST monad
Store the context in mutable state and return an IO/ST computation:
```haskell
(\input -> let ~((_, i), ctx) = input 
           in unsafePerformIO $ do { ref <- newIORef ctx; return (Nothing, OAccState i 0 ???) })
```
**Problem:** Very hacky, breaks purity, defeats the purpose of lazy evaluation.

### Option C: Don't use a Loop at all
Restructure the architecture to compute the context some other way (feed-forward instead of feedback).
**Problem:** Defeats the entire design philosophy.

### Option D: Accept and use explicit thunks
Create a separate data type for "lazy state" that holds the raw constructor arguments without calling the constructor:
```haskell
data LazyState = LazyState !Int !Int !(IO MarkupCtx)
```
**Problem:** Requires thread through everything, not practical.

### Option E: Use GHC.Magic.lazy more aggressively
The `lazy` function from GHC.Exts already tries to defer forcing. Maybe apply it at a different level or use it with NOINLINE.

## The Knot Works... Sometimes?

The same lazy knot pattern works in `runMealy` (src/Lexer.hs:159):
```haskell
runMealy (Loop p) = ... 
  mkMealy
    (\a   -> let s0 = fi (a, c0); c0 = snd (fe s0) in s0)
```

**Why doesn't it deadlock?** The key difference is that `runMealy` is a generic interpreter, so `fi` and `fe` are opaque to GHC. They're not inlined, so GHC can't see that `fi` forces its argument. This allows the lazy evaluation to work.

In `compiledMarkupLexer`, we've manually unrolled the `runMealy` interpreter, so GHC CAN see through `s2i` to the actual init function that forces ctx.

## Recommendation

The cleanest fix requires either:
1. **Keep using runMealy** - don't manually unroll it (costs performance but works)
2. **Change the architecture** - use feed-forward instead of loop (design change)
3. **Accept the loop** - maybe add lazy forcer helpers or restructure init phase

## Evidence

**File:** ~/repos/traced/src/Lexer.hs
**Loop location:** line ~507
**OAccState definition:** line ~326
**Stage2 definition:** line ~394

Run test: `cabal exec parser-speed -- --mealy --file other/line.svg`
