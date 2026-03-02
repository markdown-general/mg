## engineering patterns ⟜ efficiency principles for agent systems

**queue architecture** ⟜ efficient access and compression
- write to head ⟜ new work at top
- read from head ⟜ current state first
- compress from tail ⟜ periodic pruning by archivist
- prevents context overload ⟜ hot state accessible, cold state archived
- O(1) access to current ⟜ don't scan entire history

**idempotent agents** ⟜ safe to run multiple times
- check state before acting ⟜ "does this file exist already?"
- same input → same output ⟜ cabal build passes/fails consistently
- compressed return values ⟜ ✓/✗ + minimal summary
- mark recipes ⟜ idempotent vs non-idempotent flags
- dangerous writers ⟜ non-idempotent agents need care
- always idempotent is costly ⟜ milliseconds matter between agents
- cycling is annoying not catastrophic ⟜ wasted tokens, not corrupted state

**pattern cost analysis** ⟜ scan logs for expensive repetition
- search foreman-queue and archive-log ⟜ identify costly patterns
- compilation spam ⟜ foreman spinning expensive cabal build cycles
- cache lookup opportunity ⟜ could check file instead of recomputing
- temporal pattern detection ⟜ "did this 5 times in last session"
- flag expensive operations ⟜ builds, doctests, full repo scans
- suggest caching strategy ⟜ write results to lookup file

