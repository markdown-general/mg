# traced-kleisli optimizations ⊙ Attempts and insights

**Status:** Optimization plateau reached at 3.4x improvement. Identified hard ceiling.

## Optimization Journey

### Baseline (original)
- Kleisli: **844,000 cycles** (10.9x vs State direct)
- Generic `run` + dictionary passing per byte

### Attempt 1: INLINABLE run + INLINE stepMarkupK
- Result: **1,000,000 cycles** (worse!)
- Issue: INLINE forced bad inlining at call site in loop context

### Attempt 2: Bypass generic run, fuse directly
- Added `stepMarkupK = runKleisli (run markupLexerK)` as direct State composition
- Added `{-# INLINE stepMarkupK #-}`
- Result: **265,000 cycles** (3.2x improvement)
- Progress: Eliminated generic `run` dictionary passing overhead

### Attempt 3: INLINE stage1K and stage2K
- Result: **265,000 cycles** (no further improvement)
- Kleisli wrapping still visible in core

### Attempt 4: Eliminate Kleisli, use direct State operations
- Removed Kleisli constructor entirely
- Write directly: `State $ \acc -> let !bc = ... in (emit, acc')`
- Result: **263,000 cycles** (plateau)
- Issue: `state` constructor + newtype machinery still has cost

## Hard Ceiling: 3.4x

The remaining 263k cycles (~3.4x slower than direct 77k) comes from:

1. **StateT newtype wrapping/unwrapping per iteration**
   - Even with INLINE, the `state` constructor wraps computation in StateT
   - Each iteration: wrap computation, unwrap result

2. **Identity functor layer (even though it's a newtype)**
   - StateT wraps `Identity (a, s)` not plain `(a, s)`
   - Coercions are free but they're still present in core, preventing other optimizations

3. **Monad composition structure preserved**
   - `evalState` creates a function that calls the stateful computation
   - Per-iteration overhead: call + unwrap state tuple + rewrap for next iteration

## Why Direct State Version is Faster

```haskell
-- Direct (Lexer.hs): runMarkupStateBS  
stepMarkupS wi acc = stage2S (stage1S (wi, acc))
-- Plain function composition. No newtype. State is just (a, s) tuple.
```

vs

```haskell
-- LexerK after optimizations
stepMarkupK (WI w i) = state $ \acc -> ...
-- state :: (s -> (a, s)) -> State s a
-- Still wraps in StateT Identity newtype, creates per-iteration closure
```

## Conclusion

**Kleisli (State s) is not suitable for tight loops.** The monad machinery—even minimally—adds irreducible overhead. The generic `run` function fundamentally cannot specialize away StateT/Identity for per-byte iteration.

**The fix:** Don't use Kleisli for this. The direct State threading in `Lexer.hs` is the right abstraction level for hot code. Kleisli shines for compositional pipeline definitions (like this one), but at runtime it pays a cost.

**Recommendation:** Keep the design—it's beautiful and correct. But don't expect Kleisli (State s) to match the performance of `(->) a (State s b)`. They're semantically equivalent but operationally different.
