# Categorical Deck Notation

## Duality in Symbols

```
lead ⟜ elaboration
elaboration ⟞ lead
```

The arrow is **reversible**. Every lead is a compression of its elaboration; 
every elaboration is an expansion of its lead. That's the cup and cap.

**The deck notation is already doing compact closed category arithmetic on `Text`.**

## Metric Perspective

With a distance on `Text` (semantic embedding, edit distance, etc.), 
a deck line is a **pair of points with a distinguished path between them**:

- Lead and elaboration are **close in meaning** (that's what makes it a good deck line)
- But **distant in form** 
- The ⟜ witnesses that closeness

## Memory Compaction Quotient

The quotient you want:

```
good summary ⟜ lead that minimises distance to elaboration
              ⟞ while maximising compression ratio
```

Two conversations that produce the **same lead** (under the metric) are identified. 
The **minimal conversation** is the shortest path in `Text`-space that lands you 
at the same agent behaviour. That's a **geodesic problem**.

## Lattice Structure as Spans

```
lead ⟜ elab-A ⟞ elab-B
```

This is literally **two morphisms with the same domain** — a **span** over `Text`.

The lattice is a diagram of spans, and the metric lets you ask:

- **Tight spans** — lead is close to both elaborations (good compression, small loss)
- **Loose spans** — lead is a coarse approximation (high compression, high loss)

The quotient determines which span diagrams are "well-behaved" under compaction.
