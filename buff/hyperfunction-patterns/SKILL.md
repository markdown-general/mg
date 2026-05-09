---
name: hyperfunction-patterns
description: "Hyperfunction patterns from Kidney & Wu (POPL 2026) — Producer/Consumer/Channel for stepwise communication"
---

# Hyperfunction Patterns

Stepwise communication with `Hyper a b` via the Producer/Consumer duality
from Kidney & Wu, *Hyperfunctions: Communicating Continuations* (POPL 2026).
The paper: `~/self/external/hyperfunctions.md`.

## When to use

The user hits a wall with `lower`/`run` on Hyper (constant continuation or
all-or-nothing) and needs stepwise state threading. The answer is the
Producer/Consumer constructor chain — `cons`/`prod` build linked Hypers
that communicate one message at a time via `invoke`.

## Core types

```haskell
type Producer o a = (o -> a) ↬ a    -- produces messages o, result a
type Consumer i a = a ↬ (i -> a)    -- consumes messages i, result a
type Channel r i o = (o -> r) ↬ (i -> r)  -- bidirectional: consumes i, produces o
```

## Constructors (from paper §2.4, Eqs 10-11)

```haskell
prod :: o -> Producer o a -> Producer o a
-- 𝜄 (prod o p) q = 𝜄 q p o

cons :: (i -> a -> a) -> Consumer i a -> Consumer i a
-- 𝜄 (cons f p) q i = f i (𝜄 q p)

doneP :: a -> Producer o a    -- producer that just returns result
doneC :: a -> Consumer i a    -- consumer that ignores input, returns result
```

## Coinductive Consumer

The key pattern for open-ended consumption:

```haskell
h :: Consumer (Maybe a) [a]
h = cons step h          -- coinductive: infinite chain
  where
    step mx acc = case mx of
      Just x  -> x : acc
      Nothing -> acc
```

This processes any number of messages. Termination comes from the Producer
stopping, not from the Consumer. Contrast with the finite Consumer built
via `foldr` in the paper's zip example — that requires known length.

## Channel composition

A Channel sits between Producer and Consumer. Compose with Consumer via
Category `(.)`:

```haskell
-- Channel r i o = (o→r) ↬ (i→r) = Hyper (o→r) (i→r)
-- Consumer o r = r ↬ (o→r)     = Hyper r (o→r)
-- (.) :: Hyper b c -> Hyper a b -> Hyper a c
-- channel . consumer :: Hyper r (i→r) = Consumer i r  ✓

pipeline = producer ⧅ (channel . consumer)
```

The Channel intercepts each message, transforms/passes/filters, and recurses.

## Coro-to-Channel encoding

A state-machine coroutine `Coro s i o` encodes directly as a Channel:

```haskell
coroToChannel :: Coro s i o -> (s -> r) -> Channel r i o
coroToChannel (Coro step s0) done = go s0
  where
    go s = Hyper $ \out i ->
      let (o, s') = step s i
      in invoke out (go s') o
```

The state `s` is captured in the closure chain. For terminating coroutines,
use `Maybe o` as output — Nothing signals done, triggering `done s`.

## Trace-to-Hyper mappings

- `Trace (->) Either` → Producer/Consumer with Maybe protocol (Just=continue, Nothing=stop)
- `Trace (->) (,)` → `run` on a self-referential Hyper (lazy knot = Hyper's recursive knot)
- `Trace (->) These` → dual-channel (emit AND continue simultaneously)

## Delimited continuations

For heap-allocated coroutines, `prompt`/`control0` (in `Circuit.Traced`)
can capture delimited continuations. `yieldIO` stores the continuation in
an IORef; `send` resumes it. Cleaner than `callCC` because the capture is
bounded by the prompt tag.

## Reference files

- `~/haskell/circuits/examples/spec-hyper.hs` — Producer/Consumer/Channel pipeline
- `~/haskell/circuits/examples/channel.md` — full writeup with turn-based vs concurrent
- `~/haskell/circuits/examples/stable-marriage.hs` — pure coroutine-based stable marriage
- `~/haskell/circuits/examples/coroutine-hyper.hs` — Coro→Channel, Trace→Hyper, delimited cont
- `references/hyperfunctions-paper.md` — condensed paper excerpts (key equations, types, patterns)

## Pitfalls

- Don't reach for `lower` or `run` for stepwise — they're one-shot and all-or-nothing
- The continuation chain (`cons`/`prod`) IS the state mechanism
- Category composition order matters: `channel . consumer` not `consumer . channel`
- `ScopedTypeVariables` + `forall` needed for local type signatures in Channel encoding
- Coinductive Consumer is correct for open-ended streams; finite Consumer (foldr) only for known-length
