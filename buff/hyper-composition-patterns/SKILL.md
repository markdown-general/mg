---
name: hyper-composition-patterns
description: Composing Hyper components via invoke and lowering. Extraction of Emit/Commit from prod/cons unification. Profunctorial duality in message-passing primitives.
---

# Hyper Composition Patterns

Techniques for building Hyper compositions from atomic primitives and understanding the unification between prod/cons patterns.

## Emit/Commit Extraction from prod/cons

### The Unification

prod and cons are **the same categorical shape** applied to dual types:

```haskell
-- Original shapes (clean variable names)
prod :: o -> Producer o a -> Producer o a
prod o p = Hyper $ \q -> invoke q p o

cons :: (i -> a -> a) -> Consumer i a -> Consumer i a
cons f p = Hyper $ \q i -> f i (invoke q p)

-- Types
Producer o a = Hyper (o -> a) a           -- covariant o
Consumer i a = Hyper a (i -> a)           -- contravariant i
```

Both construct `Hyper` by:
1. Taking a continuation `q` (the dual)
2. Invoking it with the inner Hyper `p` via `invoke q p`
3. Threading a message/function on either side: `invoke q p o` or `f i (invoke q p)`

**Profunctorial duality**: Producer and Consumer types are flipped — `Hyper (o -> a) a` vs `Hyper a (i -> a)` — but the implementation pattern is identical.

### Removing m (Pure Case)

The original design threaded a monad parameter `m`:

```haskell
Producer m r a = Hyper (a -> m r) (m r)
Consumer m r a = Hyper (m r) (a -> m r)
```

In the pure case (`m = Identity`), this collapses:

```haskell
Producer r a = Hyper (a -> r) r
Consumer a = Hyper r (a -> r)
```

Dropping `m` simplifies to the unparametrized versions above.

### Extracting Atomic Types

Both prod and cons build chains from atomic endpoints. These endpoints are:

```haskell
type Emit a = Hyper () a      -- atomic producer: produces a
type Commit a = Hyper a ()    -- atomic consumer: consumes a
```

- `Emit a = () ↬ a` — stateless value source. `emit a = Hyper $ \_ -> a`
- `Commit a = a ↬ ()` — stateless value sink. `commit = Hyper $ \_ -> ()`

**Why atomic?** No internal state threading — the `r` parameter that existed in Producer/Consumer is removed. State composition becomes **external** via Hyper category composition.

### The Key Insight

In the old design, state lived in the types:
```
Producer m r a = (a → m r) ↬ (m r)    [r is threaded]
```

In the new design, state is composed externally:
```
Emit a = () ↬ a
Commit a = a ↬ ()
[both atomic, state threaded via Hyper composition]
```

## Composing Emit, Carrier, and Result

### The Pattern

When composing three components:
- `emit_val :: Hyper () a` (atomic producer)
- `carrier :: Hyper (a -> r) r` (stateful component)
- `result :: Hyper r r` (composed result)

Use lowering to compose, then lift back:

```haskell
result = Hyper $ \q -> (lower carrier) (const (lower emit_val))
```

Where:
- `lower emit_val :: () -> a`
- `const (lower emit_val) :: x -> (() -> a)` (ignores its argument)
- `lower carrier :: (a -> r) -> r`
- `(lower carrier) (const (lower emit_val)) :: r`

The Hyper constructor ignores the continuation `q` and directly returns the composed result.

### The invoke Pattern

Both prod/cons and multi-component composition use the same underlying pattern:

```
Hyper $ \continuation -> (invoke continuation inner_hyper) (message | function)
```

**On the left**: the result of `invoke`, potentially transformed (`f i ...`)
**On the right**: messages, functions, or other Hypers threaded through `invoke`

This is the core unification: all Hyper composition is "placing something on either side of invoke."

## Pitfalls

### Variable Naming
Use **meaningful names** in patterns:
- `q` for continuation/dual (from "queue" in some contexts, but better: `k` for "kontination")
- `p` for the inner Hyper ("producer" / "prime")
- `o` for output message type
- `i` for input message type
- `f` for step function (process/filter)

Avoid random single letters (`x`, `m` as a type parameter that doesn't stay consistent).

### Lowering Loss
`lower` flattens the Hyper structure and loses introspectability. If you need to inspect or manipulate the Circuit GADT structure, don't lower prematurely. Lowering is a **terminal operation** — once you're in plain functions, you can't recover the structure.

### Type Parameter Order
Be consistent:
- `Hyper a b` is contravariant in `a`, covariant in `b`
- `Producer o a = Hyper (o -> a) a` puts the message type `o` on the input (contravariant)
- `Consumer i a = Hyper a (i -> a)` puts the message type `i` on the output (covariant)

Flipping these breaks duality.

## References

See `references/prod-cons-shapes.md` for detailed type-level analysis and composition examples.
