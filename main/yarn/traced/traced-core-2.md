# traced-core-2 analysis ⊙ lazy knot inspection

**Status:** Core dump at -O0 examined. Lazy knot found and analyzed.

## The Lazy Knot in compiledMarkupLexer

**Location:** Inside the inject lambda at line ~5645 in Lexer.dump-simpl (at -O0)

The inject function creates a composite Mealy state from the two-stage pipeline (stage1 ⊙ stage2).

### The Knot Structure

```haskell
letrec {
  c0 :: MarkupCtx
  c0 = snd @(...) (s2e s0);

  s0 [Occ=LoopBreaker] :: s1
  s0 = s2i ((undefined @... , i), c0);
} in
(s0, s1i (wild, c0))
```

### Mutual Recursion Analysis

✓ **GHC correctly identified the recursion:** It's a `letrec {}` group, not sequential lets
- c0 depends on s0: `c0 = snd (s2e s0)`
- s0 depends on c0: `s0 = s2i ((undefined, i), c0)`
- **LoopBreaker annotation on s0** - GHC chose s0 as the breaking point

### Critical Details

**1. OAccState construction** (found at line ~4911):
```haskell
OAccState i (I# 0#) ctx
```
- OAccState is applied directly, NOT wrapped in lazy
- Arguments: i (positional), 0# (length), ctx (context)
- No lazy wrapper visible

**2. The undefined argument:**
```haskell
undefined @LiftedRep @ByteClass (C:IP @"callStack" @CallStack $dIP1)
```
- Placeholder for ByteClass in stage2 init
- Never actually used in the knot (dead code)
- Passed to s2i but not evaluated until stage2 actually processes data

**3. How i flows:**
- Comes from pattern match: `case wi of { WI ds i -> ... }`
- Passed into the knot as a parameter (not created by it)
- Type: extracted from WI (wordindex wrapper)

### The Circularity Problem

**The knot will deadlock if:**

- `s1i` (stage1 init) is strict in its second argument
  - Returns: `s1i (wild, c0)`
  - If s1i forces c0 before returning, c0 tries to evaluate s0
  - But s0 is still being constructed by s2i, waiting for c0

**Safe if:**

- `s1i` is **lazy** - just wraps `(wild, c0)` without forcing
- `s2i` is **lazy** - just wraps `((undefined, i), c0)` without forcing
- `s2e` is **lazy** - returns pair structure without forcing all fields

### What Actually Happens

In the step function (not the init):
```haskell
case s1s t (wi, snd @(...) (s2e s2)) of { (mid, t') -> ... }
```

Here, `snd (s2e s2)` is used to extract the context from stage2 state for feeding into stage1's step. This is where the actual forcing happens — **during stepping, not init**.

### Red Flags

❌ **No visible `lazy` wrapper on the OAccState or state tuple** - relies entirely on data constructor laziness

❌ **The knot depends on parameter passivity** - if init functions become stricter over time, this breaks silently

✓ **GHC marked LoopBreaker** - shows it understands the potential issue

## Recommendations

1. **Verify s1i and s2i are marked lazy** in source code (check for `~` patterns or lazy function signatures)

2. **Consider wrapping the knot explicitly** if not already:
   ```haskell
   c0 = lazy (snd (s2e s0))
   s0 = lazy (s2i ((undefined, i), c0))
   ```

3. **Add strictness annotations audit** - trace who calls s1i, s2i, s2e to ensure they don't force unexpectedly

4. **Test knot evaluation** - add a simple test that checks the knot doesn't hang on first entry

## Evidence

**File:** `dist-newstyle/build/aarch64-osx/ghc-9.14.1/traced-0.1.0.0/build/src/Lexer.dump-simpl` (O0 build)

**The knot:** lines ~5645–5670
**OAccState construction:** lines ~4906–4950
**Stage init functions:** passed in as parameters to inject lambda
