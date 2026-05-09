---
name: circuits-box-architecture
description: "Box rewrite on circuits — compact closed, Profunctor, Emitter/Committer as Circuit types"
---

# Circuits Box Architecture

Design for rewriting the `box` library (profunctors, Committer/Emitter,
Codensity) on top of `circuits`.

## Core Insight

`Circuit (Kleisli m) Either a b` **is** the Box — Profunctor carries both
contravariant (input/Committer) and covariant (output/Emitter) directions.

```haskell
Emitter   = Circuit (Kleisli m) Either () a    -- produces a
Committer = Circuit (Kleisli m) Either a ()    -- consumes a
```

## Compact Closed Structure

```
unit   :: a -> (Circuit arr t () a, Circuit arr t a ())
counit :: Circuit arr t a () -> Circuit arr t () a -> arr () ()
counit c e = lower (Compose c e)
```

Unit creates a bidirectional channel. Counit annihilates.
This replaces the ad-hoc `glue`/`glue'`/`glueES`/`glueN` family.

## Required Circuit Instances

These are NOT in circuits proper yet — they live as orphans in the prototype.
Must be upstreamed before production use.

### Trace (Kleisli m) Either (generic Monad)

```haskell
instance Monad m => Trace (Kleisli m) Either where
  trace (Kleisli f) = Kleisli $ \b -> go (Right b)
    where
      go x = f x >>= \case
        Right c -> pure c
        Left a  -> go (Left a)
  untrace (Kleisli f) = Kleisli $ \case
    Left a  -> pure (Left a)
    Right b -> Right <$> f b
```

### Profunctor (Circuit arr t)

```haskell
instance (Profunctor arr, Bifunctor t) => Profunctor (Circuit arr t) where
  dimap f g (Lift h)    = Lift (dimap f g h)
  dimap f g (Compose h i) = Compose (dimap id g h) (dimap f id i)
  dimap f g (Loop h)    = Loop (dimap (bimap id f) (bimap id g) h)
```

## Projection Asymmetry

- **Committer side**: `dimap id (const ())` — always works, discards b
- **Emitter side**: needs a value `a` to fill `() → a` — not pure Profunctor

## Working Prototype

`~/haskell/circuits/examples/box-proto.hs` — compiles with `cabal repl`.
Uses `Kleisli Identity` for purity (no IO needed).

See `references/box-proto.md` for detailed architecture notes.

## Rewrite Order

1. Move Profunctor and Trace instances into circuits proper
2. Map Box.IO (handles, files, stdin/stdout) onto Emitter/Committer
3. Map Box.Queue — `toBoxSTM` already close to circuit-wire pair
4. Map Box.Time — stamping/replay/gaps as Circuit combinators
5. Box.Connectors (`concurrentE/C`) — async layer, trickiest part
