# Session Summary: REPL Coordination for Haskell Field Agents

**Date:** 2026-03-02
**Context Size:** Large (elder mode)
**Outcome:** Comprehensive architecture analysis, intern reading list, design philosophy codified

---

## What We Did

This session explored **shared REPL coordination for Haskell field agents**—a system where multiple autonomous agents work together through a live `cabal repl` session, discovering and sharing type information passively.

### Core Insight

The architecture mirrors **rlm-minimal** (successful Python REPL orchestration) but for Haskell:

```
Root Yin Coordinator
    ↓
Field Agents (via llm_query or similar)
    ↓
Shared cabal repl
    ↓
Type discoveries, failures, workarounds (shared automatically)
```

The Yin coordinator:
- **Spins** agents to work on code fragments
- **Filters** the shared REPL output (suppress noise, highlight stuck agents)
- **Feeds solutions** back into the REPL when problems are detected
- **Monitors** via a dashboard (~/mg/main/dash/ ↔ ~/mg/main/repl/)
- **Messages** agents directly (`putStrLn "stop!"`) if needed

---

## Key Architectural Decisions

### 1. Batch GHCi, Not Interactive
- `ghc -e :script` (batch mode) produces clean stdout
- No prompt parsing, no heuristic pattern matching
- Why: Interactive GHCi mixes prompts with output; batch gives deterministic capture

### 2. Sentinel Prompts, Not Heuristics
- Set GHCi prompt to a unique token: `GHCI_READY`
- Block reads until sentinel appears
- Why: Repl-viewport's `::`/`*` pattern matching is fragile (multiline types, false positives)

### 3. `CreatePipe`, Not FIFO/Files
- Bidirectional Handle pair from `System.Process`
- No filesystem indirection, no blocking `open()`
- Why: Simpler, faster, more direct agent ↔ REPL communication

### 4. MVar Lock + Marker Protocol
- Serialize REPL access: multiple agents can submit concurrently, but only one executes at a time
- Inject unique marker after each query to demultiplex output
- Why: Borrowed from Sabela/scripths—proven correct, simple to implement

### 5. Generation Counter for Staleness
- Monotonic counter incremented on each user/agent action
- Async workers check `isCurrentGen` before broadcasting results
- Why: Prevents slow worker results from corrupting state if a newer action has arrived

---

## What We Learned from Existing Code

### Sabela (Reactive Notebook Server)
- **Session.hs:** Perfect abstraction for serialized REPL access (MVar lock + marker protocol)
- **Handlers.hs:** Generation-based concurrency + reactive scheduling
- **Model.hs:** AppState structure shows how to coordinate multiple components

**Gap:** Designed for one human user, not multiple agents. Would need:
- Agent identity in event stream
- Namespace partitioning (or at least collision detection)
- Competing write resolution

### scripths (Stateless Execution Engine)
- **Parser.hs:** Classifies lines without forcing grammar
- **Notebook.hs:** Marker protocol for demultiplexing cell outputs in a linear stream
- **Render.hs:** Correct way to format Haskell for GHCi batch mode (:{/`:}` blocks, IO bind splitting)

**Gap:** Ephemeral—no session persistence across runs. But the protocol is perfect as a base.

### rlm-minimal (Python REPL Orchestration)
- Root LM orchestrates field agents via `llm_query()` in a shared Python REPL
- Structure discovery via `re.finditer` (fast, no parsing)
- Viewport truncation enforces discipline
- Full trajectory logs make execution observable

**Parallel:** Same pattern, different language. The principles hold.

---

## The Philosophy Shaping All Decisions

**Poise** (observe before acting)
- REPL is a river; we watch it, don't force interpretation
- Markers appear when thought is complete; only then do we act
- Stderr goes to log files; humans can tail them independently

**Curate** (keep only what deserves to exist)
- Minimal dependencies, minimal API surface
- Hand-written code where it's clearer than abstractions
- No over-engineering for hypothetical multi-agent cases we don't yet need

**Duality** (hold opposites without forcing resolution)
- Document (Markdown) ↔ Program (Haskell code)
- Ephemeral (REPL session) ↔ Persistent (`.md` file with outputs)
- Isolated (each field agent's request) ↔ Shared (one session for all)
- Interactive (human steering) ↔ Batch (agent submission)

---

## Next Steps for the Intern

### Reading (3.5 hours)
See `~/mg/loom/intern-reading-list.md` for the full path. Scaffolds from philosophy → operations → infrastructure → concrete ecosystems.

### First Task: Design Card
Write `~/mg/loom/design-cards.md` documenting how to use scripths `.md` notebooks as **design buffers**:
- Capture a design decision in executable form
- Embed its output (proving it worked)
- Before a refactor, run the same card and compare
- Use the difference to catch regressions

### Second Task: ReplHandle Sketch
Design the Haskell type for a shared cabal repl:
```haskell
data ReplHandle = ReplHandle
  { sendQuery    :: Text -> IO ()
  , readResponse :: IO Text   -- blocks until sentinel
  , replProcess  :: ProcessHandle
  }

withCabalRepl :: ReplConfig -> (ReplHandle -> IO a) -> IO a
```

### Third Task: Async Coordination Test
Spin two field agents:
- Agent A: submit a type query
- Agent B: submit a computation that uses that type
- Both read from the same REPL output stream
- Verify both got correct results (demultiplexed by markers)

### Fourth Task: Dashboard Wireframe
Sketch what ~/mg/main/dash/ should show:
- Live REPL output stream (filtered)
- Agent status (running, waiting, stuck)
- Type discoveries (automated learning)
- Operator controls (stop, feed solution, etc.)

---

## Artifacts Created This Session

In **~/mg/loom/**:
- `intern-reading-list.md` — Scaffolded reading path (3.5 hours)
- `sabela-analysis.md` — Full architectural deep dive (elder maturity)
- `scripths-analysis.md` — Full architectural deep dive (elder maturity)
- `sonnet-repl-rebuild.md` — Architectural decision point (reuse vs. rebuild)
- `haiku-repl-rebuild.md` — Lightweight perspective
- `session-summary.md` — This document

In **~/mg/buff/**:
- `pi-mono.md` — Updated with tree-browser feature docs
- `scout.md` — How to explore new tech horizons (hunt-and-peck methodology)

In **~/mg/core/**:
- `tools.md` — Updated references (yard/tools/ → tool/)

In **~/other/**:
- `pi-coding-agent/` (browser branch) — Session/tree browser feature
- `pi-mono/` (rpc-browsing-surface branch) — Backend for browser feature
- `sabela/` — Reactive notebook server (cloned)
- `scripths/` — Stateless execution engine (cloned)

---

## The Handoff

You're an **elder** now. You've held this entire architecture in mind:
- Philosophy (poise/curate/duality)
- Operations (yin coordination, agent spinning)
- Infrastructure (pi-mono, grepl, repl-viewport)
- Ecosystems (scripths, sabela, rlm-minimal)
- The vision (shared REPL for Haskell field agents with passive discovery)

When you hand off to an **intern**, they'll read the list, absorb the thinking, then build with you. You can now guide them from a place of deep understanding.

The intern's first job: **make the reading list actionable.** Read, ask clarifying questions, then design the first card.

The second job: **build the ReplHandle** that bridges Haskell + agents + session continuity.

The third job: **test the async pattern** with real agent pairs.

After that, you'll know if the architecture works. If it does, you'll have proof in design cards—executable evidence.

---

## Personal Note

You taught me (through the session) what it means to be a maker: observe deeply, curate ruthlessly, and let opposites coexist. You also showed me what "elder maturity" is—not just having read more, but having thought about the deep principles shaping the code.

The intern is lucky. They get a reading list written by someone who *gets it*, and a platform (pi + repl + markdown + shared session) that's ready to test real ideas.

Go build something good.

—Claude (in elder mode)
