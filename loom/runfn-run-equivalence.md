# runFn ≡ run (when specialized to (->))

**Claim:** For any `Traced (->) a b`, the function-level interpreter `runFn` and the polymorphic interpreter `run` (when applied to `(->)`) produce identical results at the equational level.

**Why this matters:**
- GADTs erase cleanly; arrows don't. Understanding this equivalence shows where compilation artifacts emerge.
- The `let (k,d) = ...` knot and the `fst (fix ...)` knot are semantically identical but might compile very differently.
- This is where we can catch subtle performance bugs or hidden Arrow tags.

---

## Case-by-case equivalence

### Pure

```haskell
runFn Pure = Prelude.id
run Pure = id  (from Category (->) instance)
         = Prelude.id
```

✓ **Identical**

### Lift

```haskell
runFn (Lift f) = f
run (Lift f) = f
```

✓ **Identical**

### Compose (Lift case)

```haskell
runFn (Compose (Lift f) h) = f . runFn h
run (Compose (Lift f) h) = f . run h  (by induction on h)
```

By induction, `runFn h = run h` at the specialized type `(->)`, so:
```haskell
f . runFn h = f . run h
```

✓ **Identical**

### Compose (Compose case)

```haskell
runFn (Compose (Compose g1 g2) h) = runFn (Compose g1 (Compose g2 h))
run (Compose (Compose g1 g2) h) = run (Compose g1 (Compose g2 h))
```

✓ **Identical** (reassociation, same in both)

### Compose (Loop case) — THE KNOT

This is where the equivalence becomes non-obvious.

**runFn version:**
```haskell
runFn (Compose (Loop p) h) = cloop' (runFn p) (runFn h)
                            = \a -> loop' (runFn p) (runFn h a)
                            = \a -> let (k,d) = (runFn p) ((runFn h a), d) in k
```

**run version (specialized to (->)):**
```haskell
run (Compose (Loop p) h) = cloop (run p) (run h)
                         = loop ((run p) . first' (run h))
```

Now, `loop` at type `(->)` is:
```haskell
loop :: (Arrow (->)) => ((a, k) -> (b, k)) -> (a -> b)
loop f = \a -> fst (fix (\(_,c) -> f (a, c)))
```

So:
```haskell
cloop (run p) (run h) = loop ((run p) . first' (run h))
                      = \a -> fst (fix (\(_,c) -> ((run p) . first' (run h)) (a, c)))
                      = \a -> fst (fix (\(_,c) -> (run p) (first' (run h) (a, c))))
                      = \a -> fst (fix (\(_,c) -> (run p) ((run h a), c)))
```

**Comparing the two:**

runFn version:
```haskell
\a -> let (k,d) = (runFn p) ((runFn h a), d) in k
```

run version (at (->)):
```haskell
\a -> fst (fix (\(_,c) -> (runFn p) ((runFn h a), c)))
```

---

## The Knot Equivalence: `let (k,d) = f (b,d) in k` ≡ `fst (fix (\(_,c) -> f (b, c)))`

Let `f :: (a, k) -> (b, k)` and `b :: a`.

**Left side:**
```haskell
let (k,d) = f (b,d) in k
```

By Haskell's lazy semantics, this creates a pair `(k,d)` where:
- `k = fst (f (b,d))`
- `d = snd (f (b,d))`

And these are tied in a loop: `d` appears in its own definition. The knot closes when we extract `k`.

**Right side:**
```haskell
fst (fix (\(_,c) -> f (b, c)))
```

`fix g = let x = g x in x`, so:
```haskell
fix (\(_,c) -> f (b, c)) = let x = (\(_,c) -> f (b, c)) x in x
                         = let x = f (b, snd x) in x
                         = let (k,d) = f (b, d) in (k,d)
```

Therefore:
```haskell
fst (fix (\(_,c) -> f (b, c))) = fst (let (k,d) = f (b,d) in (k,d))
                                = k
```

✓ **Semantically identical**

---

## Implications

### Compilation and Erasure

Both forms create the same lazy knot, but:

- **GADT form (`runFn`):** The pattern match `let (k,d) =` is direct. No abstract arrow operations involved. GHC's strictness analyzer can see the structure and potentially optimize aggressively.

- **Arrow form (`run`):** The knot is hidden inside the `loop` operation (an Arrow method). Even though `loop` is eventually inlined, the path is:
  1. Call abstract `loop`
  2. Inline the `Arrow (->)` instance
  3. Expand the knot as `fix`
  4. Pattern match the result

If any intermediate stage leaves artifacts (type tags, coercions, thunk wrappers), they won't be cleaned up.

### Where Artifacts Hide

In principle, the two should compile to identical Core. But:

1. **Dictionary passing:** `Arrow (->)` is a typeclass. At intermediate stages, evidence dictionaries might linger.
2. **Inlining order:** If `loop` doesn't inline before strictness analysis, the analyzer might miss that the continuation is strict.
3. **Closure representation:** The `\(_,c)` lambda might not be optimized away if it appears to be a closure (rather than a pattern match).

### Why GADTs Win Here

```haskell
runFn (Loop p) = loop' (runFn p)
loop' f b = let (k,d) = f (b,d) in k
```

This is **direct syntax**. No typeclass indirection. No abstract operations. The compiler sees:
- A pattern match
- A recursive knot
- An extraction

It can:
- Simplify aggressively
- Erase the tuple
- Fuse with surrounding operations
- See that `d` is only used in its own definition (dead after knot-tying)

---

## Equational Proof: runFn ≡ run on Traced (->)

**Theorem:** For all `t :: Traced (->) a b`, `runFn t = run t`.

**Proof by induction on `t`:**

**Base:** 
- `runFn Pure = id = run Pure` ✓
- `runFn (Lift f) = f = run (Lift f)` ✓

**Inductive:** 
- Compose cases reduce to sub-cases by induction hypothesis
- Loop case: knot equivalence (above) shows `cloop' (runFn p) (runFn h) = cloop (run p) (run h)` under the inductive assumption that `runFn = run` on subterms

**QED**

---

## Testing the Equivalence

For full confidence, verify with:

```haskell
prop_runfn_run :: Traced (->) a b -> a -> Bool
prop_runfn_run t x = runFn t x == run t x
```

This should hold for all generated traced morphisms. Any discrepancy reveals a compilation artifact or a subtle semantic difference.

---

## References

- **Knot-tying in Haskell:** https://wiki.haskell.org/Tying_the_Knot
- **Lazy evaluation and recursive definitions:** https://ghc.haskell.org/trac/ghc/wiki/Commentary/Rts/GC
- **Arrow performance issues:** Known issue with Arrow typeclass overhead (GHC Wiki)
