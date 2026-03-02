# repl ⟜ Haskell repl design and patterns (specifications)

Design specifications for file-based GHCi protocol. Separates concerns: spawning, querying, observing.

## Specifications

### Core Design

**haskell-repl-library-spec.md** ⟜ complete specification for file-based REPL bridge
- Purpose: library wrapping cabal repl with file-based query protocol (no markers, no synchronization)
- Core abstractions: ReplicState, startRepl, queryRepl, stopRepl
- Pattern recognition logic (type sigs, kind info, error detection)
- Design decisions: why no markers, why files not sockets, why polling not blocking
- Testing strategy: unit tests, integration tests, property tests
- Known limitations and future work

**process-design.md** ⟜ why the design works
- Separation of concerns: each component has a single job
- No synchronization complexity, no locks
- Hyperfunction insight: all variables are local
- Composability: agents can be added without breaking others

### Research & Exploration

**process-createProcess.md** ⟜ System.Process API study
- Documents for process spawning approach

**async-key.md** ⟜ async/race design for timeouts and composition
- Designs for concurrent query handling with timeouts
- Error recovery patterns

## Operations

Work cards and probed implementations are in ~/mg/yin/repl/. Specs guide the work; operations handle the trials.
