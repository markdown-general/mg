# traced-reports Summary

Located: ~/other/traced-reports/

---

## Key Files

### Core Theory
- **traced.md** (25KB) — The main paper/pearl. Complete exposition of the Traced GADT.
  - Abstract: Free traced monoidal category over Haskell functions
  - Problem: Church-encoded naturals can't encode coroutines in Haskell's type system
  - Solution: The Traced GADT with Apply, Compose, Untrace constructors
  - Central law: **"Keep sliding until yanked"** — Loop constructors slide left through Compose chains
  - **The sliding law**: `run (Compose (Loop p) h) = \a -> fst $ fix $ \(b, c) -> run p (run h a, c)`
  - Why `run (Compose g h) = run g . run h` is wrong: doesn't implement sliding
  - Tower: Coyoneda (Apply) → Free (Compose) → Traced (Untrace)

- **GUIDE.md** — Finally Tagless vs Initially Tagged
  - Hyp: protocol in types (erased at runtime, no inspection)
  - Loop (Traced): protocol in values (inspectable, serializable)
  - Both encode the same morphism on different sides of Haskell's compile/runtime divide

- **hyper.md** — Hyperfunctions and the Kidney & Wu paper
  - Explanation of `a ↬ b` notation and continuations

### Implementation & Debugging
- **IMPLEMENTATION_NOTES.md** — How the GADT constructors work
- **traced-loop-fix.md** — Fixing the Loop behavior
- **traced-kleisli-core.md** — Alternative using Kleisli composition
- **traced-kleisli-optimizations.md** — Performance notes for Kleisli variant

### Integration & Testing
- **INTEGRATION_COMPLETE.md** — Full integration status
- **FINAL_INTEGRATION.md** — Final test results
- **traced-machinery-test-report.md** — Machinery test outcomes
- **FIB-HANG-INVESTIGATION.md** — Debugging fib hang in interpreter

### Session Notes
- **session-checkpoint.md** — Checkpoint during development
- **session-summary-2026-02-25.md** — Development summary
- **GHC-CONSTRAINT-BUG.md** — GHC version constraints and workarounds
- **MIGRATION.md** — Migration notes

### Small Reference
- **zip.md** — The zip example

---

## Critical Finding

The **sliding law** is the core insight. The Compose case in `run` must pattern-match on the left argument to detect when Loop is present and apply sliding:

```haskell
run (Compose g h) = case g of
  -- ... other cases ...
  Loop p -> \a -> fst $ fix $ \(b, c) -> run p (run h a, c)  -- SLIDE
```

The naive `run (Compose g h) = run g . run h` fails because it doesn't implement this.

The reassociation case moves all Loops to the left of the Compose chain, making them available to slide.

---

## Key Insight (from GUIDE.md)

> **Finally Tagless puts protocol in types (erased at runtime).
> Initially Tagged puts protocol in values (present at runtime).**

Hyp (protocol in types) vs Traced/Loop (protocol in values) are the same morphism, different representations.

---

## Status

The library is complete. All constructions verified. The sliding law and reassociation are not optimizations—they are the operational content of the traced monoidal axioms.
