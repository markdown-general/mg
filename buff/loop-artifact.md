# Loop: Four Knot-Tying Implementations

Feedback requires tying a lazy knot: `c` is defined in terms of itself. These implementations show different approaches across abstractions.

---

## The Base Pattern: `loop'`

Arrow's basic loop operation:

```haskell
loop' f b = let (c, d) = f (b, d) in c
```

**Structure:**
- Apply `f` to `(b, d)` 
- `d` appears in output position *and* input position (recursion)
- Extract `c`, discard the feedback `d`

**This is the simplest: apply, extract, knot tied by `let`.**

---

## Simple Fixed Point: `fix`

From Traced.hs:

```haskell
fix :: (a -> a) -> a
fix f = let x = f x in x
```

**Structure:**
- Apply `f` to itself
- `x` appears on both sides of `=`
- Works for any function type

**Use case:** Closing `Traced (->)` when we already have the plain function.

**Example in Traced.hs:**
```haskell
runFn (Loop p) = \a -> fst $ fix $ \t -> runFn p (a, snd t)
```

---

## Arrow's Generic Loop: `run` case

From Traced.hs:

```haskell
run (Loop p) = loop (run p . first' (run h))
```

**Structure:**
- `loop` is an Arrow operation (abstract)
- Compose `run p . first'` via categorical composition
- Defers knot-tying to the `arr` instance's `loop` operation

**Why composition?** Sliding law: the feedback wire slides through and absorbs the right side.

---

## Mealy-Specific Loop: `loopH`

From Traced/Mealy.hs:

```haskell
loopH :: Hyp Mealy (a, c) (b, c) -> Hyp Mealy a b
loopH p =
  let self = Hyp $ case ι p of
        M pi ps pe ->
          M
            (\h ->
              let a = getA h self
                  dual = mkFeedback a c0
                  s0 = pi dual
                  c0 = snd (pe s0)  -- lazy knot here
               in s0)
            (\s h -> ...)
            (fst . pe)
   in self
```

**Structure:**
- `self` references itself (Hyp tower)
- Build a `dual` continuation that references `self`
- Extract state and feedback value through Mealy machine operations
- Lazy knot: `c0 = snd (pe s0)` but `c0` appears in `dual` which is used to compute `s0`

**Why complex?** Mealy machines have explicit state (`s`). The knot must thread state through while maintaining laziness.

---

## Continuation-Based Loop: `closeHypFn`

From Hyp.hs:

```haskell
closeHypFn :: Hyp (->) (a, c) (b, c) -> Hyp (->) a b
closeHypFn p = Hyp $ \k ->
  let (b, _) = ι p dual
      dual = Hyp $ \_ -> (ι k (closeHyp p), snd (ι p dual))
   in b
```

**Structure:**
- Apply `ι p` to a `dual` continuation
- The `dual` references the result of applying `ι p`
- `dual` is itself a Hyp (towers all the way down)
- Extract `b`, discard feedback

**Why towers?** We're working in the hyperfunction tower `Hyp arr`. The continuation must be a hyperfunction too, and it recursively references the result.

---

## Costrong Pattern (Profunctor Version)

```haskell
instance Costrong (->) where
  unfirst f a = b where (b, d) = f (a, d)

instance MonadFix m => Costrong (Kleisli m) where
  unfirst (Kleisli f) = Kleisli (liftM fst . mfix . f')
    where f' x y = f (x, snd y)
```

**Structure:**
- Costrong is the profunctor dual of Strong
- `unfirst` closes a feedback wire via `where` binding (or `mfix`)
- Same knot-tying as `loop'`, just in profunctor language

---

## Comparison Table

| Form | Target | Knot Method | Abstraction |
|------|--------|-------------|-------------|
| `loop'` | Arrow | `let (c,d) = f (b,d) in c` | Simplest |
| `fix` | `->` | `let x = f x in x` | Plain recursion |
| `runFn (Loop p)` | `->` | `fix $ \t -> ...` | Wrapped in function |
| `run (Loop p)` | Any arrow | `loop (...)` via instance | Abstract operation |
| `unfirst` | Profunctor | `where (b,d) = f (a,d)` | Profunctor syntax |
| `loopH` | Mealy | Explicit state threading | Machine-specific |
| `closeHypFn` | Hyp (->) | Recursive dual continuation | Tower-specific |

---

## Key Insight

All implementations use the same core pattern:
```
let feedback_value = compute_something feedback_value in extract_result
```

The differences are in:
- **What you're computing** (arrow ops, functions, Mealy steps, continuations)
- **How you extract** (fst, identity, state extract, result value)
- **Whether you're polymorphic** (abstract arrow) or **specialized** (->)

The laziness is always provided by Haskell's `let`. The knot is always: *the bound variable appears in its own definition*.

---

## For `closeHyp` polymorphic version

You need `ArrowLoop arr`:

```haskell
closeHyp :: ArrowLoop arr => Hyp arr (a, c) (b, c) -> Hyp arr a b
closeHyp p = Hyp $ loop (...)
```

The `loop` operation (from ArrowLoop) will handle the knot-tying in whatever category `arr` is.
