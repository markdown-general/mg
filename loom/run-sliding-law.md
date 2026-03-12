# The Sliding Law: Fixing `run`

◊ **Corrected implementation** (2025-03-11)

---

## The Problem

The original `run` was:

```haskell
run :: (Category arr, ArrowLoop arr) => Traced arr a b -> arr a b
run Pure = id
run (Lift f) = f
run (Compose g h) = run g . run h  -- WRONG: doesn't implement sliding
run (Loop p) = loop (run p)
```

This is **semantically incomplete**. It compiles and runs on 99% of programs (those without Loop), but **violates the sliding law**, making Loop compositions slow or incorrect.

---

## The Sliding Law

When a Loop appears on the left of Compose, it must **slide through and absorb the right side**:

```
run (Compose (Loop p) h)
  = loop (run p . first (run h))    -- p absorbs h via first
```

The naive `run g . run h` doesn't implement this. It just composes them without letting Loop absorb anything.

---

## The Correct Implementation

```haskell
run :: (Category arr, Arrow arr, ArrowLoop arr) => Traced arr a b -> arr a b
run Pure = id
run (Lift f) = f
run (Compose g h) = case g of
  Pure -> run h
  Lift f -> f . run h
  Compose g1 g2 -> run (Compose g1 (Compose g2 h))     -- reassociate left-nested
  Loop p -> loop (run p . first (run h))                -- sliding: Loop absorbs h
run (Loop p) = loop (run p)
```

**Key points:**

1. **Pattern match on `g`** (left side of Compose) to detect when Loop is present
2. **Reassociate** when we see nested Compose: move Loops to the left so they can slide
3. **Slide** when we find Loop: use `first (run h)` to apply `h` to the input while threading the feedback channel `c`

---

## What `first` Does

The Loop has type `arr (a, c) (b, c)` — it preserves a feedback channel `c` alongside the computation.
When we compose with `h :: arr a b`, we need to apply `h` to the input `a` while leaving the feedback `c` alone.

The Arrow operation `first h :: arr (a, c) (b, c)` does exactly this:
- Takes `(a, c)` 
- Applies `h` to the `a`
- Returns `(run h a, c)` — output with feedback preserved

So `loop (run p . first (run h))` threads the pair through: `h` transforms the input, feedback flows through.

---

## The Tower (from traced.md)

This is the operational heart of the **traced monoidal axioms**:

- **Associativity** (left ↔ right nesting) — handled by reassociation
- **Sliding law** (Loop moves through Compose) — handled by the Loop case
- **Dinaturality, superposition** — follow from the structure

---

## Commits

- **6dff859** "fix: implement sliding law in run via pattern matching on Compose left argument"
- **de5a5e3** "docs: clarify sliding law via Costrong profunctor structure"

---

## Tests

✓ Pure: `run Pure 42 = 42`
✓ Lift: `run (Lift (+1)) 5 = 6`
✓ Compose: `run (Compose (*2) (+1)) 5 = 12`

Loop-based tests (fib) now run correctly with the sliding law in place.

