## Process Design

◊ ⊢ design file-based repl protocol with three components ⊣
  ⟜ repl-startup — spawn cabal repl, wire stdio to files
  ⟜ repl-mock — simulate GHCi (proves the protocol works)
  ⟜ repl-user — ask questions, wait for answers (the actual pattern)

✓ tested with both agents (mock and observer) — five test queries, all passed

## Why This Design Works

⊢ separation of concerns ⊣
- `repl-startup` doesn't know about queries. It just starts the process.
- Writer doesn't care if reader exists. It just appends.
- Reader doesn't care when queries were sent. It just reads.
- Observer knows what it sent and can search for it. Local reasoning.

⊢ no synchronization complexity ⊣
- No markers to inject
- No prompt parsing
- No buffer management
- No locks or condition variables
- Just: append queries, read output, search for answers

⊢ hyperfunction insight ⊣

All variables are local. When the observer computes "did I get my answer?", it only needs:
- What it wrote (in its own memory)
- What's in the output file (current state)

There's no hidden state outside the observer's concern horizon. Each query-response cycle is a **continuation**: given the current files, what do I do next? The answer comes from local computation, not from watching shared state.

⊢ composability ⊣

Want to add filtering? New agent reads output file, filters startup noise, writes to `/tmp/ghci-filtered.txt`. Doesn't break anything.

Want to add a matching service? Agent reads both input and output, lines up questions with answers, writes to `/tmp/ghci-matched.json`. Still decoupled. One field agent, one job to do and verify.

Want per-agent output files? Each observer writes to its own file. No contention.

The **category** (hyperfunctions) says this can't go wrong if you follow the rules. And the rules are simple:
- Each agent has a local concern horizon
- Information flows through applicative functors (IO, effects)
- No hidden state outside the computation
