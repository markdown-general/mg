# actorio ⟜ factories for agent interactions

yarn ⟡ reef ⟡ factorio

---

A factory is a traced monoidal category.
An agent interaction is a factory.
actorio ⟜ the bridge.

---

## the analogy

```
Factorio                    Yarn / Reef
--------                    -----------
Item                        Content (card, message, file, RateVec)
Recipe                      Morphism (prompt, tool, transformation)
RateVec                     Context (Map of what flows, at what rate)
Assembler                   Agent (runs a recipe on inputs, produces outputs)
Belt                        Tape (append-only, ordered, items flow)
Throughput                  Token budget (items/sec ↔ tokens/turn)
Shared intermediate         Shared context (one card feeds many agents)
Knot / feedback loop        Iterative refinement, drift recovery
Blueprint                   Card (description before execution)
spin                        Run the blueprint, place the machines
```

---

## RateVec as context

In the factory planner:

```haskell
type RateVec = Map Item Rational   -- items/sec for each item type
```

In agent interactions:

```haskell
type ContextVec = Map ContentType TokenRate  -- tokens/turn for each content type
```

A context is a rate vector. Spinning a sub-agent consumes context at a rate.
The prime agent (yin) manages the context budget —
what flows in, what flows out, what gets delegated.

yin must spin ⟜ protect the prime context
             ⟜ delegate token-heavy work to field agents
             ⟜ hold the RateVec, not the content

---

## shared intermediates

Red science and green science both need iron gears.
One assembler feeds both lines.
Combined factory: 18 machines vs 20 separate.

Cards are shared intermediates.
`yin.md` feeds every yin agent spawned this session.
One card, many consumers, computed once.

The Oracle agent ⟜ stationed at the shared card
               ⟜ sees all downstream consumers
               ⟜ knows the throughput (how many agents read this card)
               ⟜ knows the drift (when the card changed mid-production)

---

## planar structure

JSONL is the time axis ⟜ append-only, sequential, tape
File system is the space axis ⟜ directories, cards, tools

Together:

```
Tape × FileSystem → Content
```

The two Πs commute when the structure is healthy.
They fail to commute when drift happens —
a file changed while an agent was mid-execution,
the trace doesn't close,
the loop back doesn't land where it started.

Planar constraint ⟜ JSONL entries and file paths cannot cross
                 ⟜ an agent reading a file creates a dependency edge
                 ⟜ a file edit while that agent runs is a crossing
                 ⟜ underground belt = explicit lock or version pin

---

## throughput and token budget

```
Factorio                    Agent
--------                    -----
crafting time               latency (seconds per turn)
items/sec                   tokens/turn  
machine count               agent count
belt capacity               context window
buffer chest                cache.md
```

The factory planner computes:
```
machines needed = target_rate / throughput
```

The agent planner computes:
```
agents needed = target_quality / (tokens_per_agent * quality_per_token)
```

Quality is harder to measure than rate.
That's the open problem actorio points at.

---

## Knot ⟜ iterative refinement

Oil processing: crude → heavy oil + light oil + petroleum gas
Excess heavy oil → cracking → more light oil → cracking → more gas
Knot finds the fixed point.

Agent refinement: draft → critique → redraft → critique → ...
Knot finds the fixed point.

```haskell
-- Stubbed in Factory.hs: "no convergence yet"
-- Full implementation: fixed point iteration on RateVec / ContextVec
runKnot :: Yarn arr a a -> a -> IO a
runKnot body seed = fixedPoint (spin body) seed
```

Drift ⟜ the Knot doesn't converge
      ⟜ the world changed between iterations
      ⟜ mark 🚩, re-station, spawn from updated context

---

## cards as session nodes

Current state ⟜ cards live in the file system
              ⟜ sessions live in the JSONL tape
              ⟜ two separate structures

Unified state ⟜ a card edit IS a tape entry
             ⟜ a card IS a session node
             ⟜ the Oracle agent stationed at a card
                sees every edit, every agent that read it,
                every downstream decision that cited it

Short-term payoff ⟜ easy access to factory state
                 ⟜ spawn a Factorio planning agent with
                    Recipe.hs + Factory.hs as context nodes
                 ⟜ query: what machine count for 20 red science/min?
                 ⟜ the card answers from its session history

---

## what actorio is not yet

drift  ⟜ semantic attitude, not a Haskell type yet
merge  ⟜ semantic attitude, not a Haskell type yet  
query  ⟜ semantic attitude, not a Haskell type yet

Yarn needs more structure before these crystallise.
actorio is the thought experiment that will pressure-test them.

---

## next

⟜ yarn-agent ⟜ spin as fork + await over SessionManager API
⟜ Oracle ⟜ agent stationed at a card, sees bidirectional traffic
⟜ Knot convergence ⟜ fixed point on ContextVec, oil cracking style
⟜ planar reasoning ⟜ file locks as underground belts
⟜ Bartosz follow-up ⟜ Functorio Revisited: Traced Monoidal Factories
