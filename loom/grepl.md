---

grepl ⟜ repl query protocol; FIFO for repl sharing

repl ⟜ file-based message passing protocol for querying console-based repls.

haskell ⟜ current design hardcodes ◉ cabal repl as the repl. ◉ old feature of ghc with a reputation of being difficult. ◉ separate stderr usage for errors and warnings

design ⟜ an agent can't use cabal repl interactively ⟜ FIFO because of current agent tool use focused on the file system. ⟜ design leaves stdin and stdout separated.

purpose ⟜ cheap alternative to cabal build ⟜ enables filtering and specialization (eg warnings, errors and token slop is filtered for most agents, and warnings and errors are handled by a specialist agent) ⟜ comms between operator and agents type wrangling and interactive code exploration; enables agentic coordination across Haskell ecosystem
 ⟜ automatic discovery sharing via observing the input and output flow. decouple cabal repl from console buffering; agents write queries non-blocking,

status ⟜ compiles; pushed to GitHub

integration ⟜ works with agent-fork for multi-agent REPL coordination; markdown logs support agent learning and state recovery

---

FIFO ⟜ named pipes ⟜ file-like object in /tmp that acts as a one-way FIFO channel between processes

how it works ⟜ mkfifo creates it, processes open for read/write, blocks until both ends connected, kernel buffers the flow

grepl usage ⟜ decouples cabal repl from console buffering; agents write queries non-blocking, read results from logged files

tradeoff ⟜ simpler than sockets, more reliable than stdin/stdout redirection, but requires coordination if multiple writers

failure mode ⟜ orphaned pipe persists if both reader/writer close; buffer overflow if reader is slow; agent must handle gracefully

---

## Core Architecture

### Modules

**Grepl** ⟜ Main API for process management with named pipes
- `ChannelConfig` — Configuration for `cabal repl` process execution
- `defaultChannelConfig` — Library REPL (cabal repl)
- `exeChannelConfig` — Executable REPL (cabal repl grepl-explore)
- `channel` — Spawns a `cabal repl` process with stdin/stdout/stderr wired to named pipes

**Grepl.Watcher** ⟜ FSNotify wrapper for monitoring markdown log files
- `watchMarkdown` — Watch directory for .md file changes, push filepaths to TChan
- `watchMarkdownWith` — Watch with caller-provided TChan
- Filters: `.md` extension only, stdout files only (not stderr)

### Design Patterns

**Named Pipe Pattern** ⟜ Decouples process I/O from console buffering

```
Agent writes to stdin FIFO
    ↓
cabal repl reads input
    ↓
stdout/stderr logged to markdown files
    ↓
Watcher detects file changes
    ↓
Agent reacts to query results
```

**Executable: grepl-explore** ⟜ runner and performance tester; CLI driver with command-line argument parsing
- Uses `optparse-applicative` for CLI interface
- Integrates with `perf` library for performance measurement

---

## Usage Examples

### Basic Setup

```haskell
import Grepl

-- Spawn a cabal repl session with default configuration
ph <- channel defaultChannelConfig
```

### Custom Configuration

```haskell
let cfg = ChannelConfig
      { processCommand = "cabal repl"
      , projectDir = "./my-project"
      , stdinPath = "/tmp/ghci-in"
      , stdoutPath = "./log/cabal-repl-stdout.md"
      , stderrPath = "./log/cabal-repl-stderr.md"
      }
ph <- channel cfg
```

### Agent Workflow Pattern

```haskell
-- Write a type query to the stdin FIFO (non-blocking)
writeFile "/tmp/ghci-in" ":type someFunction\n"

-- Watch for markdown log changes
chan <- watchMarkdown "./log"

-- Read logged output when ready
stdout <- readFile "./log/cabal-repl-stdout.md"
stderr <- readFile "./log/cabal-repl-stderr.md"

-- Analyze results, branch on outcome, re-query as needed
```

---
