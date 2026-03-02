# Session Checkpoint - Traced Lazy Knot Investigation

## Status: POISED AT PUZZLE

We have a clean commit. The lazy knot deadlocks when certain functions are called at runtime.

## Known Facts

**Working:**
- `runMarkupLexerBS` (direct driver, no Loop) ✓
- parser-speed builds fine
- Other benchmark modes work (whitespace, markup)

**Deadlocking:**
- `runMarkupMealyBS` - calls `runMealy markupLexerI` where `markupLexerI = Loop body`
- `runCompiledMarkupBS` - calls `compiledMarkupLexer = runMealy markupLexerI`

**Root:**
- `runMealy (Loop p)` at line 89 in src/Lexer.hs creates lazy knot
- When called, forces circular evaluation: c0 depends on s0, s0 init depends on c0
- The knot itself is theoretically sound in Haskell
- But stage2's init forces all OAccState fields, including oCtx which is a thunk

## The Clue

User observed: **never used bangs in 11 years of Haskell**

The `!` annotations in OAccState are forcing strictness that breaks the knot:
```haskell
data OAccState = OAccState
  { oStart :: {-# UNPACK #-} !Int
  , oLen   :: {-# UNPACK #-} !Int
  , oCtx   :: !MarkupCtx          -- <-- THIS
  }
```

These bangs force evaluation of fields during constructor application.

## Core Dump Findings (O2)

**The lazy knot IS present and marked correctly in Core:**

```
letrec {
  s0 [Occ=LoopBreaker] :: s
  s0 = fi (a1, case fe s0 of { (_ [Occ=Dead], y) -> y })
}
```

s0 is defined recursively, marked as LoopBreaker, in a letrec group.

**The issue:** When `fi` (stage2's init) is called with the tuple `(a1, y)`, does it force the second element immediately?

If stage2's init does `OAccState i 0 ctx` where ctx is the y-thunk, and OAccState has strict fields, the knot forces before it's ready.

## Tested So Far

- Removed `!` from oCtx: **still deadlocks** (bangs aren't the direct culprit)
- Core shows letrec/LoopBreaker correctly set up
- The forcing must happen inside fi (stage2's init)

## Test: Single Definition

Disabled compiledMarkupLexer and runCompiledMarkupBS. Only markupLexerI and runMarkupMealyBS remain.

**Core changed:** 
- markupLexerI disappeared (no longer a top-level def, probably inlined)
- runMarkupMealyBS still exists but structure changed
- Stage2 init (runMarkupMealyBS10) shows: `OAccState unbx 0# ctx` without forcing ctx

**Key observation:** ctx flows through the pattern match without being forced in that snippet.

## Removed ArrowLoop Abstraction

Deleted the generic `run :: (Category arr, ArrowLoop arr) => Traced arr a b -> arr a b` function. It was adding abstraction layers that obscured what Loop actually does.

Now we have explicit interpreters:
- `runFn` for functions (->)
- `runHyp` for hyperfunctions (↬)
- `runMealy` for MealyM

This removes the Church-encoding complexity and forall boundaries that were confusing the semantics.

## Latest Finding

Tested without the `!` bang on `oCtx` in OAccState: **still deadlocks**.

So the bang is not the culprit. The circular forcing is inherent to the knot structure itself.

## Fresh Start: RunMealy Module

Created `src/RunMealy.hs` with clean, explicit `runMealy :: Traced MealyM a b -> MealyM a b`.

Built one constructor at a time:
- **Pure:** identity - `Mealy id (\_ a -> a) id`
- **Lift:** passthrough
- **Compose:** threads state as pair, h processes first then g
- **Loop:** uses `fix` on output pair `(b, c)` where c feeds back

The Loop case is now explicit:
```haskell
let output = fix (\(_, c) -> let (out, _) = fs (fi (a, c)) (a, c) in out)
in fi (a, snd output)
```

No Church encoding, no foralls hiding the knot. Just pure, direct semantics.

**Ready to test:** Can use RunMealy in place of the old runMealy and see if deadlock persists.
