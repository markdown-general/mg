---
name: circuits-channel-design
description: "Circuit.Channel redesign: atomic Emit/Commit, state threaded externally. API change May 2026."
---

# Circuit.Channel Design (May 2026)

## Summary

**Breaking change**: `Circuit.Channel` replaced stateful Producer/Consumer constructors 
(`prod`, `cons`, `yield`, `accept`) with atomic Emit/Commit primitives. State is now 
threaded externally via Hyper composition, not baked into types.

**Why**: Atomic types compose more cleanly. The old design threaded state through a monad 
parameter (`m`) and result carrier (`r`), adding indirection. The new design: Hyper handles 
duality natively; state lives in closures and continuation chains.

**Status**: Commit `da5d6f2` (May 11, 2026). Landed in circuits main. Examples need rewrites.

## Old API (archived)

```haskell
-- May 2026 — REMOVED
type Producer m r a = (a -> m r) ↬ m r
type Consumer m r a = a ↬ (a -> m r)

prod :: a -> Producer m r a -> Producer m r a
cons :: (a -> m r -> m r) -> Consumer m r a -> Consumer m r a
yield :: m r -> Producer m r a
accept :: m r -> Consumer m r a
unit :: Applicative m => r -> (Producer m r a, Consumer m r a)
glue :: Producer m r a -> Consumer m r a -> m r
```

Reference: git history up to `debf455` (examples: convert .hs to .md, fix API drift, update SKILL.md gotchas).

## New API

```haskell
-- May 2026 — CURRENT
type Emit a = () ↬ a                    -- atomic producer
type Commit a = a ↬ ()                  -- atomic consumer
type Channel r i o = (o -> r) ↬ (i -> r)  -- bidirectional pipe

emit :: a -> Emit a
commit :: Commit a

-- Composition: invoke or Category (.)
(⇸) :: Hyper a b -> Hyper b c -> Hyper a c  -- alias for invoke or Category composition
```

## Design rationale

**Old way**: State threaded through monad + result carrier. Types carried infrastructure.

```haskell
-- Conceptually:
-- Producer m r a sends a, in monad m, with result r
-- Consumer m r a receives a, in monad m, with result r
-- prod/cons builders added messages to the chain
```

**New way**: Atomic types, state in composition.

```haskell
-- Conceptually:
-- Emit a produces a; ignores continuation
-- Commit a consumes a; produces ()
-- Hyper composition threads state via closures and recursion
```

**Benefits**:
- No monad indirection for pure pipelines
- State is explicit in the calling code, not hidden in types
- Lighter types: Emit/Commit are just type aliases, not GADTs
- Aligns with Kidney & Wu's presentation (§2.4 atomics first)

## Migration path

### Step 1: Replace type aliases

```haskell
-- OLD
type MyProducer r a = Producer (Maybe a) [a]

-- NEW: inline the Hyper definition
type MyProducer r a = () ↬ (Maybe a)  -- or build with Emit
```

### Step 2: Replace prod/cons with Hyper composition

**Old pattern** (not valid anymore):

```haskell
emitSingles :: [a] -> Producer (Maybe a) [a]
emitSingles = foldr (\x p -> prod (Just x) p) (prod Nothing (yield []))

collectSingles :: Consumer (Maybe a) [a]
collectSingles = h where h = cons step h
  where step mx acc = case mx of
          Just x  -> x : acc
          Nothing -> acc
```

**New pattern** (draft; see channel-basics.md for real example):

```haskell
emitSingles :: [a] -> Emit (Maybe a)
emitSingles xs = go xs
  where
    go [] = emit Nothing
    go (x:xs) = Hyper $ \_ -> invoke (go xs) (emit (Just x))

collectSingles :: Commit (Maybe a)
collectSingles = h
  where
    h = Hyper $ \k mx -> 
      case mx of
        Just x  -> -- process and recurse
        Nothing -> -- return result
```

State (the list, the accumulator) lives in the closure variables `xs` and the 
recursion, not in a type parameter.

### Step 3: Update glue calls

```haskell
-- OLD
pipeline = glue consumer producer

-- NEW
pipeline = producer ⇸ consumer
```

The direction flips: producer first, then consumer. `⇸ = invoke`, which applies 
the left Hyper to the right (continuation).

## Affected example files

**Needs rewrite to match new API:**
- `examples/channel-basics.md` — references `prod`, `cons`, `yield`, `accept` in narrative; code blocks need updating
- `examples/stable-marriage.md` — uses old Producer/Consumer in the explanation

**Can stay as-is (or minimal updates):**
- `examples/coroutine-hyper.md` — shows Coro→Channel pattern; mostly orthogonal to prod/cons
- `examples/theory-delim.md` — delimited continuations; no prod/cons used

## Key insight for rewrites

The old `prod`/`cons` chain WAS the state mechanism. Each `cons` in the chain 
was a snapshot of the Consumer at a certain message count. Now:

- The chain is implicit in the continuation (Hyper's recursive definition)
- State is stored in closure variables
- Recursion unwinds as messages arrive

**channel-basics.md rewrite priority**: This card is the entry point for Channel. 
It MUST show atomic Emit/Commit, explain why the old design was replaced, and 
demonstrate the new state-threading pattern.

## Pitfalls during migration

1. **Don't reach for monad parameters**: You might think "I need to thread state through IO". Use `lift` instead: `lift readLn :: Hyper () (IO String)`.

2. **Composition direction**: `channel . consumer` puts the channel closer to the input. Test with: `(channel . consumer) ⇸ producer`.

3. **Coinductive Consumer**: The pattern `h = step h` still works; it's just Hyper-based now. The Consumer doesn't decide when to stop — the Producer does (via message type, e.g., Maybe).

4. **Don't export prod/cons/yield/accept from Circuit.Channel**: These are removed. If downstream code uses them, that code is on an old branch (parser-fix branches).

## References

- Commit: `da5d6f2` Channel: replace Producer/Consumer with Emit/Commit atomic primitives
- Paper: Kidney & Wu, POPL 2026, §2.4 (atomic Emit/Commit), §5.1 (Channel)
- Implementation: `~/haskell/circuits/src/Circuit/Channel.hs`
- Example (in progress): `~/haskell/circuits/examples/channel-basics.md`
- Old API (archive): git log from `a60adbf` Add Circuit.Channel module onwards
