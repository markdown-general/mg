# agent-log ⟜ Multi-agent session coordination via immutable, branching conversation trees

## Current Work

◊ **Polish, test, and fully document agent-fork**

agent-fork was created during development of this card. It provides the concrete mechanism for spawning agents and managing I/O. The library needs a good working, testing, and documentation pass.

---

## agent-fork: Pi Channel Harness

**Location:** ~/haskell/agent-fork/ (v0.1.0.0)

**What it is:** A Haskell library that wraps the `pi` executable for agentic workflows. Uses named pipes (FIFOs) to decouple I/O from console buffering, enabling agents to write queries and read output asynchronously without blocking.

**Core:** 
- `PiConfig` — configuration (command, workdir, FIFO paths)
- `piChannel` — spawns pi process with I/O wired to named pipes, returns ProcessHandle

**Key pattern:** Agents write to stdin FIFO, spawn returns immediately, agents read logs from stdout.md whenever ready. No console buffering. No blocking.

**Current state:** Builds cleanly, minimal surface area (Agent.Fork.hs ~150 lines), untested operationally.

---

## Related

⊢ [sem-tail.md](sem-tail.md) ⟜ Semantic tail search for sessions
  ⟜ How to understand which concepts are central to an agent log (tail bias via decay)
  ⟜ How to detect drift (moving-average vs full-memory divergence)
  ⟜ How to infer intent by tracing backward from session tail

⊢ [reef.md](reef.md) ⟜ Theoretical foundation
  ⟜ Sessions as planar traced monoidal categories
  ⟜ Stateless workers vs stateful inhabitants
  ⟜ How to accrete meaning without full context

---

## Context

**Three live outputs:**

⊢ yarn (tcat renamed) ⊣
  ⟜ fast Haskell lexer in the world
  ⟜ direct line to fast JSON parsing in memo
  ⟜ intended as published library and functional pearl

⊢ memo (session tree model) ⊣
  ⟜ embodies planar traced monoidal structure
  ⟜ should map to pi-mono JSONL + branching sessions
  ⟜ yarn-agent would be a set of tools to engage in agent computational graphs.

⊢ reef theory ⊣
  ⟜ research claims in original report
  ⟜ backward pass (dual operations: asking = answering)
  ⟜ drift as trace failure (loop doesn't close)
  ⟜ closed structure (run backwards to find better spawn points)
  ⟜ stateless workers → stateful inhabitants

**multi-agent tools:**

⊢ browser chat ↔ local agents ⊣
  ⟜ state: ???

⊢ REPL sharing between agents ⊣
  ⟜ state: ???

⊢ agent spinning ⊣
  ⟜ state: current practice is to use "pi -p". Move to fork model
  ⟜ blocked by: session wiring (memo → pi-mono sessions)
  ⟜ required by: yin tools to spin agents and reduce slop context exposure.

---

## The Questions

### Session Understanding Gap

[Q1-session-wiring] ⟜ What exactly do memo's tree model + pi-mono sessions need to bridge?
  - How do memo nodes map to JSONL entries?
  - Are they 1:1 or is there a shape mismatch?
  - What entry types does memo generate/consume?

[Q2-card-serialization] ⟜ How do yin cards serialize into sessions?
  - Does a card ⊢ action ⊣ become a SessionMessageEntry?
  - Do flow markers (◊ ⊢ ⊣ 🚩) get encoded in entry fields or metadata?
  - How does yin track position (◊) across branching?

[Q3-branch-flow] ⟜ How do branches become flow markers?
  - When an agent creates a new branch, what session entry fires?
  - Does branching automatically set ◊ to the branch point?
  - Do we mark branch points with 🚩 divergence or ⬡ branch-point?

[Q4-field-agent-writes] ⟜ How do field agents write session entries?
  - Can field agents append custom entries directly?
  - Or must all session writes flow through yin?
  - What's the contract for an agent writing a branch?

### Yarn Scope

[Q5-yarn-scope] ⟜ What exactly does yarn include?
  - JSON lexer → parser (tcat foundation)?
  - Tree traversal + branching operations?
  - Session entry type definitions + serialization?
  - All of above, or staged?

[Q6-yarn-published] ⟜ What does published look like?
  - Haskell library on Hackage with cabal metadata?
  - What's the API surface (lexer, parser, tree ops, session types)?
  - Dependencies on pi-mono or independent?

### Spinning Mechanism

[Q7-first-spin] ⟜ What does the first agent spin look like?
  - Read a card from core/, station agent at a session node?
  - Agent reads what context (card + prior session messages)?
  - Agent writes what (session entries? branches? custom messages)?
  - Return path back to yin (how does result feed back)?

[Q8-spinning-contract] ⟜ What's the contract for spinning?
  - yin-narrow: "read card, look at session node, spin field agent, listen for result"?
  - Field agent: "read card, read session context, work, append to session or file, exit"?
  - Does field agent need access to SessionManager or just JSONL read/write?

[Q9-stateful-inhabitants] ⟜ How does "stateful inhabitant" manifest?
  - Does an agent that spins multiple times stay alive (persistent state)?
  - Or spawn-work-exit model with state in session?
  - How does the 60% elder threshold affect agent behavior across spins?

### Memo Runtime & Integration

[Q10-memo-role] ⟜ What is memo's runtime role vs. yarn's?
  - Is memo the in-memory tree representation, yarn the serialization layer?
  - Or is memo a full session manager (like pi-mono's SessionManager)?
  - Does memo live in yin process or run as separate service?

[Q11-memo-performance] ⟜ Why does memo matter if yarn has the fast parser?
  - Is memo the query/traversal engine (fast lookups, branching ops)?
  - Does memo handle tree mutations (rebalancing, compaction)?
  - What operations must be fast: random access? sequential replay? branch lookup?

### Tools & Ecosystem

[Q12-browser-integration] ⟜ How do browser chat + local agents wire into yarn-agent?
  - Does browser extension write session entries directly?
  - Or send messages to yin, which writes on behalf?
  - What's the contract between browser client ↔ local session?

[Q13-grepl-integration] ⟜ How does REPL sharing fit into agent spinning?
  - Is grepl a shared cabal repl that agents fork/join?
  - Or session-backed state (agents read/write REPL output to session)?
  - How does 60% elder threshold affect REPL agent behavior?

[Q14-slop-reduction] ⟜ What does "reduce slop context exposure" mean exactly?
  - Current practice (pi -p): agent sees full chat context by default?
  - Fork model: agent sees only branched path + context card?
  - What's the concrete exposure reduction in tokens/wall-clock?

[Q15-drift-mid-spin] ⟜ What happens if drift is detected while agent is spinning?
  - Agent detects world changed mid-execution, marks 🚩?
  - Or yin detects divergence and cancels spin?
  - How do we recover: rewind, continue, or pivot branch?

### Session Navigation & Discovery

[Q16-session-discovery] ⟜ How does yin discover and navigate existing sessions?
  - Tool to list sessions by name/age/recent-activity?
  - Tool to show session tree (branches, named waypoints, elders)?
  - Can yin jump directly to a named waypoint or branch point?

[Q17-session-naming] ⟜ How do sessions get named and what's the scope?
  - Global across all projects, or per-project?
  - Can a single session have multiple names (aliases for different views)?
  - How do names interact with flow markers (◊ position)?

### Work Sequence & Implementation

[Q18-landing-order] ⟜ What lands first to unblock the rest?
  - (A) Yarn published + yarn docs (foundation)?
  - (B) Memo↔pi-mono bridge documented (theory)?
  - (C) One field agent spin proof-of-concept (unlock others)?
  - (D) All three in parallel with checkpoints?

[Q19-proof-of-concept] ⟜ If we pick a field agent spin PoC, what does it do?
  - Simplest case: "read a card, append result to session as custom entry"?
  - Or: "read a card, fork a branch, write work to branch, return branch ID"?
  - What's the smallest example that proves memo + yarn + session wiring works?

[Q20-yin-tools] ⟜ What yin tools are needed first?
  - Tool to list available session spawn points?
  - Tool to spin a field agent at a given node?
  - Tool to listen for completion + integrate result?
  - Tool to visualize tree (branches, elders, labels, position)?
  - Tool to manage (fork, name, compact, archive sessions)?

---

## Decision Points

[decision-staged-or-atomic] ⟜ Ship yarn + wiring + spinning as one release, or staged checkpoints?

[decision-session-write-locus] ⟜ Can field agents write sessions directly, or must it go through yin?

[decision-stateful-model] ⟜ Spawn-work-exit, or persistent agent state in session?

---

## Success Criteria

⊢ Shape locked ⊣
  ⟜ all [Q1-Q12] answered
  ⟜ no 🚩 conflicts between answers
  ⟜ clear blocking order visible

⊢ yin-tools drafted ⊣
  ⟜ list of 3-5 tools needed
  ⟜ each tool's input/output/purpose

⊢ field agent contract clear ⊣
  ⟜ what it reads, what it writes, how it reports
  ⟜ ready for implementation

⊢ sequence decided ⊣
  ⟜ yarn → bridge → PoC, or parallel checkpoints?
  ⟜ dates/milestones if applicable

⊢ agent-fork verified ⊣
  ⟜ operationally tested
  ⟜ fully documented
  ⟜ gaps identified for memo integration
