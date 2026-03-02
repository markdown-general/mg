# Intern Reading List ⟜ Context Compaction & Reentry

**This session:** exploration of shared REPL coordination for Haskell field agents, design philosophy, async agent patterns, and design-as-executable-proof.

**Your mission as intern:** understand the ecosystem, test the architecture, help build the platform.

---

## Foundation Layer (Read First)

### 1. ~/mg/readme.md
**Why:** The manifesto. Establishes the philosophy of markdown-general (now mg): pattern ⊙ reflect, maker ethos, why we structure work the way we do.

**Key concepts:**
- pattern ⊙ reflect cycle
- yin coordination (Flow ⟜ Work ⟜ Breathe)
- loom/ as conversation space between yin and operator
- 4-letter directories (core, side, main, buff, tool, word, tape, loom, logs)

**Read time:** 15 min

---

### 2. ~/mg/core/yin.md
**Why:** The operational spine. How a single yin (coordinator) manages field agents, spins them concurrently, handles failures, synchronizes via sessions.

**Key concepts:**
- yin-narrow vs yin-wide modes
- Flow encoding (⊢ ⊣ ◊ 🚩 markers for state tracking)
- Spinning agents (what it means, how it works)
- Session trees (JSONL, fork, resume)
- The reader-spinner relationship

**Read time:** 20 min

---

### 3. ~/mg/word/poise.md, ~/mg/word/curate.md, ~/mg/core/duality.md
**Why:** The philosophical backbone. Every design decision in this session was filtered through these lenses.

**What to understand:**
- **Poise:** observe before acting, let things unfold
- **Curate:** keep only what deserves to exist, sparse is better
- **Duality:** hold opposites without forcing resolution (document ↔ program, ephemeral ↔ persistent, etc.)

**Read time:** 10 min total

---

## Technical Infrastructure

### 4. ~/mg/buff/pi-mono.md (sections: tree browser, local installation)
**Why:** Context on the agent runtime (pi-coding-agent, pi-mono). Understand the tool we're using to spin field agents.

**Focus on:**
- Sessions as living JSONL records
- Agent spinning pattern (extensions spawn sub-agents)
- Session trees with branching

**Read time:** 15 min (skim the rest, focus on tree browser + pi-mono integration sections)

---

### 5. ~/mg/main/repl/ directory
**Why:** The REPL coordination design we're building on.

**Read in order:**
- `repl.md` (overview of specs and operations)
- `haskell-repl-library-spec.md` (the design specification)
- `process-design.md` (why the design works)

**What to understand:**
- File-based query protocol (no markers, no synchronization, just files)
- ReplicState, startRepl, queryRepl, stopRepl abstractions
- Why no markers/locks/sockets—keep it simple

**Read time:** 30 min

---

## The Ecosystem: scripths & sabela

### 6. ~/other/scripths/ (structure and README)
**Why:** The stateless execution engine for Haskell notebooks. Core infrastructure we're building on.

**What to read:**
- `README.md` (purpose, approach, examples)
- `src/ScriptHs/Parser.hs` (how it classifies lines, extracts cabal metadata)
- `src/ScriptHs/Notebook.hs` (the marker protocol — critical for understanding agent demarcation)
- `src/ScriptHs/Render.hs` (how it renders Haskell for GHCi batch mode)

**Key insight:** The marker protocol (`---SCRIPTHS_BLOCK_n_END---`) is how you know where one agent's output ends and another's begins in a shared stream.

**Read time:** 45 min (code + comments)

---

### 7. ~/other/sabela/ (structure and README)
**Why:** The stateful reactive notebook server. Shows how to extend scripths' batch execution into long-lived session coordination.

**What to read:**
- `README.md` (purpose, features, limitations)
- `src/Sabela/Session.hs` (the GHCi process abstraction, the MVar lock, marker injection)
- `src/Sabela/Handlers.hs` (reactive scheduling, generation-based staleness detection)
- `src/Sabela/Model.hs` (AppState structure, the coordination layer)

**Key insights:**
- `MVar sessLock` serialises multi-caller REPL access
- Generation counter prevents stale results from async operations
- Broadcast channel (TChan NotebookEvent) fans out results to all subscribers

**Read time:** 60 min (code + architecture)

---

## The Field Agent Pattern

### 8. ~/mg/loom/sabela-analysis.md and ~/mg/loom/scripths-analysis.md
**Why:** Deep analysis of both systems through the poise/curate/duality lenses. Shows architectural coherence.

**Focus on:**
- How Sabela's session layer is already suited for multi-agent coordination (with extensions)
- Why scripths' marker protocol is the right boundary mechanism
- The duality of shared state (agent definitions persist globally)
- What gaps exist (namespace isolation, agent identity, competing writes)

**Read time:** 40 min

---

### 9. ~/other/rlm-minimal/ (structure and examples)
**Why:** A concrete success case: shows how a root agent orchestrates many field agents over a shared Python REPL.

**What to read:**
- `README.md` and `main.py` (the pattern)
- `rlm/rlm_repl.py` and `rlm/repl.py` (how llm_query() injects field agents)
- One trajectory log (e.g., `alice.md` if it exists) to see the full execution

**Key insight:** The pattern is: shared REPL as coordination medium, field agents as `llm_query()` calls, persistent namespace across all agents.

**Read time:** 30 min

---

## The Design-Card Pattern

### 10. ~/mg/loom/sonnet-repl-rebuild.md
**Why:** A deep architectural decision point. Shows how to reason about reuse vs. rebuild.

**Focus on:**
- The "salvage from grepl" section (what to keep)
- The philosophical analysis (poise/curate/duality applied to a concrete choice)
- Why batch GHCi + sentinel prompts are the right direction

**Read time:** 20 min

---

### 11. (To be written) ~/mg/loom/design-cards.md
**Why:** The testing methodology. How to freeze design decisions in executable form before a refactor.

**What it will cover:**
- Using scripths `.md` notebooks as design buffers
- Embedding outputs to create immutable evidence
- Running cards before/after refactor to catch regressions
- Examples: perf baseline, dependency impact, design justification

**Read time:** (will be ~30 min when written)

---

## Session Artifacts (Reference)

### Deep Dives in ~/mg/loom/
- `sonnet-repl-rebuild.md` — Should we reuse grepl+repl-viewport or start fresh? (The answer: selective salvage)
- `haiku-repl-rebuild.md` — Lightweight perspective on the same question
- `sabela-analysis.md` — Full architecture of the reactive notebook system
- `scripths-analysis.md` — Full architecture of the stateless execution engine
- `intake-repos-*.md` — Analysis of ui-ux-pro-max and other intake repos (if relevant)

---

## Knowledge Graph (How It All Connects)

```
mg/readme.md (philosophy)
    ↓
core/yin.md (operations)
    ↓
{poise, curate, duality} (thinking tools)
    ↓
pi-mono.md (runtime for agents)
    ↓
main/repl/ (REPL design specifications)
    ↓
scripths (stateless execution, marker protocol)
    ↓
sabela (stateful session, multi-agent coordination)
    ↓
rlm-minimal (example: root + field agents over shared REPL)
    ↓
Your task: Build the same for Haskell
```

---

## Reading Path for Intern

**Day 1 (Philosophy & Operations):**
- readme.md
- core/yin.md
- poise/curate/duality

**Day 2 (Infrastructure & Design):**
- pi-mono.md (tree browser section)
- main/repl/ specs
- sonnet-repl-rebuild.md (architectural choice)

**Day 3 (Concrete Ecosystems):**
- scripths (README + Parser + Notebook modules)
- sabela (README + Session + Handlers)
- rlm-minimal (one example trajectory)

**Day 4 (Synthesis):**
- sabela-analysis.md (full deep dive)
- scripths-analysis.md (full deep dive)
- Understand the seams between them

**Day 5 (Testing & Planning):**
- design-cards.md (when written)
- Plan: sketch ReplHandle for Haskell REPL
- First design card: "Why we chose batch GHCi"

---

## Questions for the Intern to Answer (After Reading)

1. **On REPL coordination:** What does a marker protocol do that a prompt sentinel doesn't? Why did scripths choose markers but the new design should use sentinels?

2. **On generation counters:** Why is `stGeneration` in Sabela necessary? What race condition does it prevent?

3. **On field agents:** What's the difference between rlm-minimal's `llm_query()` (Python REPL) and what we're trying to build (Haskell REPL)? What's the same pattern?

4. **On design cards:** If you have a `.md` card with embedded output, how do you know if a refactor broke something?

5. **On duality:** Give three examples of opposites that merge in scripths or sabela.

---

## What Comes Next (After Reading)

1. **Intern writes first design card:** "Batch GHCi: Why Markers Aren't Enough" (using scripths as the vehicle)
2. **Sketch ReplHandle:** A Haskell type that represents a shared cabal repl (based on sabela's Session layer)
3. **Test async coordination:** Spin two field agents that both use the same REPL, compare their outputs
4. **Iterate:** Write more design cards documenting the decisions

---

**Total reading time:** ~3.5 hours

**Total understanding gained:** Everything needed to extend this architecture for Haskell field agents.

**Brought to you by:** One elder + sonnet's deep dives + the design philosophy compressed into a single session.
