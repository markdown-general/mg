# card repl ⟜ agentic GHCi channel via named pipes

File-based message passing protocol for querying GHCi instances. Core use: agentic type wrangling and interactive code exploration.

## state

**Current structure:**
- `cabal-repl-channel.sh` — shell wrapper (named pipes setup, tail -f listener)
- `src/Repl.hs` — module with `ChannelConfig` + `channel` function (ProcessHandle)
- `test/Main.hs` — test executable (test-repl)
- `log/` — output logs (cabal-repl-stdout.md, cabal-repl-stderr.md, etc.)
- `repl.cabal` — GHC 9.14.1, async 2.2, process 1.6

**What works:**
- `ChannelConfig` data type defined (processCommand, projectDir, stdinPath, stdoutPath, stderrPath)
- Default config points to /tmp/ghci-in (FIFO stdin)
- `channel` function opens handles + wires to process
- Stdout/stderr redirected to log files (append mode, no buffering)

**The hard fail:**
Test calls `startRepl` and `queryRepl` — **these functions don't exist yet.**

Test tries:
1. `startRepl "."` — should start the channel
2. `queryRepl ":t fmap" "fmap ::"` — write to FIFO, poll stdout for response

Stdout shows: repeated "id :: a -> a" then signal 15 (SIGTERM), never returned results.

---

## plan ⟜ validate channel primitive

✓ ⊢ test channel defaultChannelConfig ⊣

**Findings:**
- ✓ Channel boots successfully
- ✓ GHCi holds stdin from /tmp/ghci-in FIFO
- ✓ Commands sent to FIFO execute in GHCi
- ✓ Output logged to cabal-repl-stdout.md
- Tested: `echo "putStrLn \"Hello from pipe\"" > /tmp/ghci-in` → "Hello from pipe" appeared in logs

**The protocol works.** FIFO → GHCi execution → log file.

✓ ⊢ add repl-explore executable with optparse-applicative ⊣
  - Pattern from ~/repos/dataframe-load/app/ (executable stanza in .cabal)
  - `app/repl-explore.hs` — RunChannel with --keepAlive flag (seconds)
  - `cabal run repl-explore -- --keepAlive 60` (or default 30s)
  - Can test interactively, full CLI interface

✓ ⊢ timing experiments ⊣
  - Run `cabal run repl-explore` in background
  - Measure: write query → detect it in log → match response → filter → report

✓ ⊢ implement runBenchmark in grepl-explore.hs ⊣
  - benchChannelConfig: isolated log files (*.bench.md)
  - Channel + watcher run in async threads (setup outside measured code)
  - benchmarkChannelThroughput :: TChan String -> IO () (measures via perf library)
  - Writes query to FIFO, waits on TChan signal (no polling)
  - Latency measured: ~41 microseconds (--runs 1)
  - Usage: `cabal run grepl-explore -- --benchmark --runs 1`

✓ ⊢ grepl rename ⊣
  - repo renamed to grepl (general repl)
  - channel and channel-exe verified and reestablished

✓ ⊢ add fsnotify watcher ⊣
  - ✓ Add fsnotify + stm + filepath to cabal deps
  - ✓ Create Grepl.Watcher module (watchMarkdown, watchMarkdownWith)
  - ✓ Filter for .md file events (Added/Modified only)
  - ✓ Push filepaths to TChan for async event handling
  - ⟜ Proof of concept: String-based, IORef-ready for signal flow

⟝ [orchestration] ⟞
  - ✓ fsnotify (done)
  - ✓ [integrate watcher with channel] (benchmark working with --runs 1)
  - 🚩 Blocking issue: --runs 3+ freezes after first signal
  - ^ [queries in logged]
  - [queries matched]
  - (initial) filtering
  - [tail crew]

⟝ [warnings and errors] ⟞






