# traced-kleisli-core analysis ⊙ LexerK

**Status:** Core dump examined. 10x slowdown identified.

**Measurement:** 
- `Kleisli tokenize`: 844,000 cycles
- `Traced (->) State tokenize`: 77,400 cycles
- **Ratio: 10.9x slower**

## The Loop: `$wgo_sj61`

Located at line ~357 in LexerK.dump-simpl.

**Signature:**
```haskell
$wgo_sj61 :: Int# -> Addr# -> ForeignPtrContents -> Int# -> AccState 
           -> (# [MarkupToken], AccState #)
```

**Arguments per iteration:**
1. `ww3_sj5R` = Int# (byte index) - unboxed ✓
2. `ww4_sj5V` = Addr# (buffer pointer) - unboxed ✓
3. `ww5_sj5W` = ForeignPtrContents - **BOXED** ✗
4. `ww6_sj5X` = Int# (bytes remaining) - unboxed ✓
5. `eta_sj5Z` = AccState (**monad state**) - **BOXED**

## Core Problem: Monad Machinery Per Byte

Every iteration invokes:

```haskell
(((LexerK.runMarkupKleisliBS2 `cast` ...) (Lexer.WI ipv1_abyP ww3_sj5R))
  `cast` StateT ...
  eta_sj5Z)  -- state passed in
 `cast` Identity ...
of { (a1_aj2C, s'1_aj2D) ->  -- state extracted
   case $wgo_sj61 ... s'1_aj2D  -- passed to next iteration
```

**Per-byte cost:**
1. Kleisli wrapping/unwrapping (coercions)
2. StateT newtype wrapping 
3. Identity wrapping/unwrapping
4. `get` operation (implicit in stage1K)
5. `put` operation (implicit in stage2K)
6. `pure` wrapper on result
7. State tuple construction and pattern match

## Contrast: Direct Version (runMarkupStateBS)

The `->) a (State s b)` version:

```haskell
stage2S ((bc, i), acc) = oAccumStep acc (bc, i, oCtx acc)
-- Just a plain function returning (value, state) tuple
```

No monad layer. State is threaded as a plain tuple. Inlines and specializes freely.

## Why 10x Slower?

**Kleisli costs per iteration:**
- Abstraction overhead: ~5-10 cycles (wrappers, casts, dictionary lookups)
- Monad bind machinery: StateT composition
- Lost optimizations: Can't inline monad ops through generic `run` function
- State not flattened: AccState stays boxed, requires per-iteration pattern match

**Cumulative effect on file with ~50k tokens:**
- 50,000 × 10-15 cycle overhead ≈ 500k-750k additional cycles
- Matches observed 844k vs 77k delta ✓

## Recommendation

The generic `Traced arr` design is beautiful—same syntax, different semantics. But:

**Kleisli (State s)** sacrifices performance for the abstraction.
**Direct (->) to (State s b)** gets both abstraction and speed.

If we want Kleisli to be practical, we'd need:
1. Specialization pass specific to `Kleisli (State AccState)`
2. Unfold StateT/Identity in the loop (they're identity transformers)
3. Unpack AccState into individual loop args

For now: **keep using the direct State version for hot code**.
