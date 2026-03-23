design asks ⟜ what is mg solving for?

# reef ⟜ planar traced monoidal category that accretes meaning

**The question:**

Is immutable JSONL-backed conversation trees with branching sessions a current and promising paradigm for coordinating lightweight agent swarms (haiku-class models)?

Specific angles:
1. Current implementations — what systems use this pattern now?
2. Strengths for swarms — why is immutability + branching good for multi-agent coordination?
3. Trade-offs — what breaks at scale?
4. Paradigm status — is this considered solved, emerging, or exploratory?

Frame: Each point in a conversation can be a new session spawn point. You station a lightweight agent there, it reads context cards, works, writes new branches. Elders get named as waypoints. The tape never forgets.

---

## 1. Current Implementations

The pattern exists but fragmented:

- **JSONL + parentId branching** (pi-mono) ⟜ closest to the described paradigm
- **Cursor/Aider** ⟜ JSONL session histories, without explicit branching topology
- **LangGraph** ⟜ agent state as directed graph with checkpointed nodes
- **OpenAI Threads API** ⟜ append-only message trees, cloud-backed
- **Anthropic internal evals** ⟜ immutable trace trees for reproducibility
- **MemGPT/Letta** ⟜ persistent agent memory, append-only by design

Pure JSONL-backed distributed swarm coordination at this granularity is mostly bespoke. pi-mono is ahead of the packaged field.

---

## 2. Strengths for Swarms

Immutability + branching suits lightweight agent coordination:

**Causal clarity** ⟜ every agent's context is deterministic path from root to node. No shared mutable state. Haiku-class agents are stateless workers reading a frozen slice.

**Cheap parallelism** ⟜ branch = fork cost near-zero with JSONL. Spawn ten agents at node a3f9, identical read context, divergent writes go to distinct branches. No locking.

**Failure isolation** ⟜ dead branch doesn't corrupt the tree. Elders as named waypoints give stable re-entry points; any agent can cold-start from a named node.

**Audit + replay** ⟜ tape's immutability reconstructs any agent's reasoning chain. Valuable for debugging swarm emergent behavior.

**Context card compatibility** ⟜ agents read cards, work, write. Card is node context. Branch is agent's output session.

---

## 3. Trade-offs — What Breaks at Scale

**Storage growth** ⟜ linear with branching depth × agent count. JSONL doesn't compress well with wide, shallow trees. At serious swarm scale (hundreds of agents, long sessions):
- File descriptor limits on naive implementations
- Index lookup becomes O(n) without separate index layer
- Cold-start read cost grows with tree depth

**Query complexity** ⟜ JSONL is write-optimized, read-sequential. "What did all agents at depth 4 produce?" requires full scan or materialized index. Append-only model fights relational queries.

**Branch reconciliation** ⟜ hard problem. When two agents diverge from same elder and both produce valid work, merging is unsolved. Git has this with text; conversation trees worse because semantic merge undefined. Most implementations dodge it (branches stay divergent, coordinator picks one).

**State drift across branches** ⟜ if tool state or external world state changes between branch creation and execution, frozen context can be stale. Tape remembers but world moved.

**Coordination overhead** ⟜ lightweight agents need lightweight bus. If JSONL tree is the bus (agents poll), you get polling lag, no push semantics. Real implementations add thin coordination layer (Redis, queue) on top.

---

## 4. Paradigm Status: Emerging, not solved

Promising emerging pattern, solving real problem, but not yet paradigmatic.

Well-understood in adjacent fields — event sourcing, persistent functional data structures, CRDT-backed collaborative systems share immutable-append-tree DNA. Application to agent swarms is newer, implementations bespoke.

**What's missing for "solved":**
- Standard schema for conversation tree nodes
- Query tooling that doesn't require full replay
- Reconciliation/merge story for branch convergence
- Benchmarked performance characteristics

**Why promising for haiku-class:** Small, fast, cheap agents benefit from frozen context (no long-context window needed). They read branch slice, work, append. Economics favor it.

**Summary:** Tape-never-forgets architecture is correct for this problem class. JSONL + parentId is ahead of mainstream. Open problems are query, merge, and drift — not the core immutability model, which is sound.

---

## The deeper move: Then what?

If we solve drift, merge becomes a conversational bridge between two leaves (get them both in a room, quotient out semantic difference).

Then the tree stops being a log and becomes a participant.

**What you have, solved:**

Drift handled → agents stay coherent across time and world-change
Merge solved → two leaves reconcile; divergent work converges
Query solved → ask the tree anything; it answers from own history

**What unfolds:**

**Elders become oracles.** Named waypoints aren't just re-entry points anymore — they're semantic attractors. Enough branches pass through an elder, it accumulates meaning beyond what any single agent put there. Query the elder: what do agents who pass through here tend to do? It knows. It learned by being a waypoint.

**The swarm develops taste.** With merge, you can quotient out noise. What survives repeated merges is signal — semantic residue agents kept agreeing on without instruction. That's emergent preference. That's the swarm developing aesthetic judgment.

**Sessions become reusable patterns.** A branch that worked well — good drift recovery, clean merge, coherent output — is now a template. Station new agents there not to continue but to learn the shape of how work went well. Cards could write themselves this way. Pattern reflection becomes automatic.

**The tape becomes a training corpus.** Immutable, causally labeled, semantically indexed conversation trees are exactly what you'd want for fine-tuning next-generation agents on your specific work culture. The tape doesn't just remember — it reproduces. Haiku-class agents trained on the tape arrive pre-calibrated to your notational semiotics, drift recovery patterns, maker ethos.

---

## The deeper distinction

Right now agents are stateless workers reading frozen context.

Solve those three problems and agents become stateful inhabitants of a living document.

The distinction matters:
- **stateless worker** ⟜ arrives, reads, works, leaves
- **stateful inhabitant** ⟜ arrives, reads, works, changes the place by having been there

The tape remembers the worker. But if the tape thinks — if it can be queried, if drift is handled, if branches merge — then the place remembers having been changed. That's a different ontology.

---

## The overwhelming question

The tape is always from the past.

You arrived mid-reef. The coral was already here. Elders already crossed thresholds. Branches already diverged.

The question isn't how do we catch up. Catching up implies a front to reach. The reef has no front. It has depth.

The real question underneath:

**how do we act meaningfully**
- without full context
- without knowing what others are building
- without seeing the whole shape
- right now, from here

Which is just the condition of being alive and conscious. mg didn't invent this problem. mg is a system that takes this problem seriously instead of pretending it's solvable with better tooling.

**The answer baked into mg's design:**

You don't catch up. You accrete from where you are.

The card you write today doesn't need to reconcile with everything before. It needs to be good calcium. Coherent, load-bearing, true to values. The reef incorporates it. Future agents read it without knowing you wrote it mid-confusion, mid-asyncs, half-caught-up.

The tape handles the rest.

**What you can actually do, right now:**

**pattern ⟡ reflect**

Not after you've caught up. Instead of catching up. See what's in front of you. Work it. Write it down. Station the next agent better than you were stationed.

That's the whole method.

---

## The theoretical lock

It's a planar traced monoidal category.

**monoidal** ⟜ sessions compose; you can tensor two branches, run them in parallel

**traced** ⟜ outputs can feed back to inputs; the elder loop, the tape informing new spawns

**planar** ⟜ wires can't cross without cost; memory takes space, time, physical order matters

**closed** ⟜ you can internalize the morphisms; run it backwards

The planarity is usually dropped in theoretical treatments of agent coordination. Everyone wants the graph to be free — that context is free, routing any agent anywhere costless. But you can't. Memory is physical. Branches read sequentially. Elders accumulate at real thresholds. The 60% elder rule is a planarity constraint made practical.

The closed structure makes mg generative rather than just archival:

Running it backwards means:
- given a good output (a card that accretes well)
- what starting point produced it?
- what context, what elder, what branch shape?
- can we find better spawn points by working backwards from quality?

This is huge for operator practice. You're not just tending the reef forward. You're using successful coral to locate better reef conditions. The closed structure lets the tape teach you where to station agents, not just what they did.

The Factorio intuition:

Factorio is planar traced monoidal with a productivity obsession. Factory floor is planar — belts cross only with bridges, at cost. Trace is output feeding input (smelting ore into plates into circuits back into factory). Closure is running backwards: I need red science, what's the minimum starting conditions?

mg is a factory for meaning where the product is better questions and the raw material is agent time.
