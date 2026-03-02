Now I have a comprehensive picture. Let me synthesize everything.

---

# Sabela: A Deep Analysis

## What It Is

**Sabela** (`DataHaskell/sabela`) is a reactive Haskell notebook server. The name is Ndebele for *"to respond"* — the entire design is an answer to the question: *what does it mean for a Haskell document to respond to itself?*

It is a browser-served, single-page application backed by a Warp/Servant HTTP server. Notebooks are plain Markdown files with fenced Haskell blocks. The server holds a live GHCi process, and when cells change, affected downstream cells re-execute automatically. The primary use-case is exploratory Haskell work — data analysis, plotting, teaching — where a REPL session and a living document need to be the same thing.

---

## The Seven Layers of Architecture

### 1. `Sabela.Session` — The GHCi Process Contract

This is the foundation. Everything rests on it.

```
Session
  sessLock    :: MVar ()           -- serialises runBlock callers
  sessStdin   :: Handle            -- writes to ghc --interactive
  sessStdout  :: Handle            -- (fed into sessLines by readLoop)
  sessStderr  :: Handle            -- (fed into sessErrBuf by errLoop)
  sessProc    :: ProcessHandle
  sessLines   :: TBQueue Text      -- async line buffer (stdout)
  sessErrBuf  :: IORef [Text]      -- accumulating stderr
  sessCounter :: IORef Int         -- marker nonce
  sessConfig  :: SessionConfig     -- deps, exts, ghc options
```

GHCi is launched as `ghc --interactive -ignore-dot-ghci v0 [env/ext/option flags]`. Two background threads (`readLoop`, `errLoop`) drain stdout and stderr respectively into a `TBQueue` and an `IORef`. The session lock (`MVar ()`) serialises all callers of `runBlock`.

**The marker protocol** is the cleverest piece. Because GHCi stdout is a continuous stream without natural message boundaries, Sabela injects a unique sentinel after each block:

```haskell
putStrLn "---SABELA_MARKER_n---"
```

`drainUntilMarker` then blocks on the `TBQueue`, accumulating lines until the sentinel (or the `---EOF---` guard) appears. This is out-of-band coordination through an in-band channel — a recurring motif in the design.

The REPL prompt is suppressed with `:set prompt ""` and `:set prompt-cont ""` on startup so raw output is clean.

### 2. `Sabela.Model` — The Shared World

```
AppState
  stNotebook       :: MVar Notebook
  stSession        :: MVar (Maybe Session)
  stTmpDir         :: FilePath
  stWorkDir        :: FilePath
  stEnvFile        :: IORef (Maybe FilePath)
  stNextId         :: IORef Int
  stInstalledDeps  :: IORef (Set Text)
  stInstalledExts  :: IORef (Set Text)
  stBroadcast      :: TChan NotebookEvent
  stGeneration     :: IORef Int
  stDebounceRef    :: MVar (Maybe (Int, Set Int))
```

`AppState` is the entire universe. Notice the granularity of locking: `stNotebook` and `stSession` are `MVar`s (exclusive read-modify-write), while `stInstalledDeps`, `stInstalledExts`, `stEnvFile`, `stNextId`, and `stGeneration` are `IORef`s (atomically modified with `atomicModifyIORef'`). The broadcast channel is a `TChan NotebookEvent` — fan-out to all SSE subscribers via `dupTChan`.

`NotebookEvent` is the external protocol: `EvCellUpdating`, `EvCellResult`, `EvExecutionDone`, `EvSessionStatus`. These map directly to what the browser renders.

### 3. `Sabela.Handlers` — Reactive Logic

The heart of the reactivity is here. The `ReactiveNotebook` record bundles the four fundamental operations:

```haskell
data ReactiveNotebook = ReactiveNotebook
  { rnCellEdit :: Int -> Text -> IO ()
  , rnRunCell  :: Int -> IO ()
  , rnRunAll   :: IO ()
  , rnReset    :: IO ()
  }
```

**Generation-based optimistic concurrency** is the coordination mechanism. Every user action calls `bumpGeneration`, which increments a monotonic `IORef Int`. Every async worker checks `isCurrentGen` before broadcasting. If a new action has arrived, the in-flight worker silently discards its result. This is how Sabela avoids stale results without locking the entire pipeline.

**`selectAffected`** is the reactive planner:

```haskell
selectAffected :: Int -> [Cell] -> [Cell]
selectAffected editedSet = go S.empty
  where
    go _ [] = []
    go changed (c : cs) =
      let (defs, uses) = cellNames (cellSource c)
          isEdited    = cellId c == editedSet
          isAffected  = not (S.null (S.intersection uses changed))
      in if isEdited || isAffected
           then c : go (S.union changed defs) cs
           else go changed cs
```

This is a single forward pass over the ordered cell list. A cell is included if it was the edited cell, or if it *uses* something *defined* by an already-included cell. The accumulated `changed` set grows as it sweeps forward. It's linear in time, correct for acyclic top-down notebooks, and deliberately approximate for everything else.

`cellNames` does textual heuristic analysis: definition extraction by pattern-matching on `let x =`, `data X`, `x <- ...`, `x = ...` prefixes; use extraction by splitting on non-identifier characters.

**Dependency management** flows through `collectMetadata → ensureSessionAlive → installAndRestart → startSessionWith`. It calls `resolveDeps` from `scripths`, which runs `cabal install --lib` and writes a GHC environment file. When deps change, the session is killed and reborn. The installed dep/ext sets are tracked in `IORef (Set Text)` so the check is a pure set equality test.

### 4. `Sabela.Output` — The MIME Bridge

```haskell
displayPrelude :: Text
displayPrelude = T.unlines
  [ ":{"
  , "let { displayMime_ t c = putStrLn (\"---MIME:\" ++ t ++ \"---\") >> putStrLn c"
  , "    ; displayHtml     = displayMime_ \"text/html\""
  , "    ; displayMarkdown = displayMime_ \"text/markdown\""
  ...
  , ":}"
  ]
```

Five helper functions, injected as a multi-line GHCi block (`:{ ... :}`) at session start and re-injected before every `handleRunCell`. They work by prefixing output with `---MIME:type---`. `parseMimeOutput` strips this prefix and returns `(mimeType, body)`. Jupyter calls this the "output display protocol"; Sabela calls it a `putStrLn` with a prefix.

`builtinExamples` is a curated gallery: 14 examples in 5 categories (Basics, Libraries, Display, Advanced), each a self-contained string of Haskell. No runtime, no file system — just values.

### 5. `Sabela.Errors` — GHCi Stderr Parsing

Structured error extraction from GHCi's `<interactive>:line:col:` format. `splitErrors` partitions stderr on error-header lines, `parseErrorHeader` extracts `(line, col)` pairs. The result is `[CellError]`, which the frontend can use to annotate specific cell positions.

### 6. `Sabela.Api` / `Sabela.Server` — The Servant Contract

A clean Servant type-level API. Notable elements:
- SSE as a `Raw` endpoint (`sseApp`), using `dupTChan` so each browser connection gets its own channel view.
- The file explorer (`listFilesH`, `readFileH`) enforces a path-containment invariant: `isWithinPath rootCanon pathCanon` prevents directory traversal.
- `loadNotebookH` parses markdown with `ScriptHs.Markdown.parseMarkdown`, builds `[Cell]` from `[Segment]` (Prose and CodeBlock), then immediately triggers `rnRunAll`.
- `saveNotebookH` inverts: `[Cell] → [Segment] → reassemble → Text → writeFile`. Saved SVG/HTML output is embedded in the markdown as blockquotes with `<!-- sabela:mime type -->` comments (visible in the `plotting.md` example).
- `infoH` does a three-stage IDE query: `:info` first, then `:type`, then `:doc`, each as a fallback.

### 7. `scripths` — The Invisible Foundation

Sabela's `cabal` file declares `scripths >= 0.2.0.1` as a dependency, and Handlers imports:

```haskell
import ScriptHs.Parser (CabalMeta(..), ScriptFile(..), mergeMetas, parseScript)
import ScriptHs.Render (toGhciScript)
import ScriptHs.Run   (resolveDeps)
import ScriptHs.Markdown (CodeOutput(..), MimeType(..), Segment(..), parseMarkdown, reassemble)
```

`scripths` handles: `-- cabal:` metadata parsing, GHCi script rendering, Markdown I/O, and `cabal install --lib` invocation. Sabela is, in a meaningful sense, a web front-end and reactive scheduler layered on top of `scripths`. The seam is explicit and clean.

---

## Purpose

Sabela has two declared purposes from the README:

1. **A modern reactive Haskell notebook** where reactivity is a first-class concern, not bolted on.
2. **An experiment in package/environment management** for Haskell notebooks — addressing IHaskell's notorious dependency pain by embedding `-- cabal:` directives inside cells.

The deeper purpose, readable in the code, is: *make the GHCi REPL into a document.* The document persists to the filesystem (Markdown), the REPL persists in memory (GHCi process), and they are kept in sync by the load/save/execute cycle.

---

## Design Philosophy

### Simplicity as a commitment, not an apology

Sabela's README says explicitly: "These are not necessarily flaws; many are reasonable early tradeoffs for a simple and understandable architecture." This is rare intellectual honesty in software documentation. The heuristic dependency tracking, the linear cell scheduling, the single-session model — each is a deliberate narrowing that keeps the system comprehensible.

### Markdown as truth, GHCi as interpreter

The notebook lives on disk as Markdown. The REPL is ephemeral, reconstructed from the document. This is the opposite of Jupyter, where the `.ipynb` JSON blob *is* the truth (including embedded kernel state, execution counts, raw outputs). Sabela's approach is more Unix-like: text files are the source of truth, processes are transient.

### The boundary between session and notebook

Sabela maintains a hard boundary: the `Session` abstraction knows nothing about notebooks or cells. It only knows about `runBlock Text → (Text, Text)`. The entire reactive scheduling logic lives in `Handlers`, above the session layer. This separation is architecturally sound and directly supports reuse.

### In-band protocols

Both the MIME output protocol (`---MIME:type---`) and the marker protocol (`---SABELA_MARKER_n---`) are in-band: they piggyback on GHCi's stdout. This is simpler than setting up a side channel but requires that cell code not accidentally emit these patterns. The README notes "rich output text must be the only thing output in the cell" — an acknowledgment of this constraint.

---

## Relation to Shared REPL Coordination for Haskell Field Agents

Here the architecture speaks most directly. "Field agents" — autonomous Haskell-executing agents that share a live GHCi session — would encounter every problem Sabela has solved, and several it hasn't.

### What Sabela solves that agents need:

**1. Serialised multiplexed REPL access.**
`MVar sessLock` in `runBlock` is exactly the primitive for multi-agent REPL sharing. Multiple agents can call `runBlock` concurrently; the lock ensures their stdio isn't interleaved. The marker protocol ensures each agent gets only its own output back, not another agent's.

**2. Async output separation.**
The `TBQueue Text` + background `readLoop` decouples GHCi's stdout production from any agent's consumption pace. In a multi-agent scenario, the queue absorbs bursts from any single agent without starving others waiting for the lock.

**3. Structured result typing.**
`(Text, Text)` from `runBlock` — stdout and stderr separately — is exactly what an agent needs. Not raw bytes, not interleaved streams, but a clean stdout/stderr split.

**4. Session lifecycle management.**
`newSession`, `resetSession`, `closeSession` form a complete lifecycle API. Agents can request a session reset when the shared namespace becomes polluted, analogous to `handleReset` clearing all cell outputs.

**5. IDE-style queries.**
`queryComplete`, `queryType`, `queryInfo`, `queryDoc` — these are the "thinking tools" for an agent operating in a Haskell environment. An agent that doesn't know the type of a function it's about to call can ask the REPL.

**6. Generation-based staleness detection.**
`bumpGeneration` + `isCurrentGen` is a clean pattern for multi-agent coordination: if agent A's result arrives after agent B has already overwritten the relevant state (a newer generation), agent A's result is silently discarded. This prevents the classic "last writer wins" race corruption.

### What Sabela doesn't have that agents would need:

**1. Per-agent namespace isolation.**
In a shared GHCi session, all top-level bindings are global. Agent A's `x = 42` and agent B's `x = 99` collide silently — `x` is just whatever was bound last. Sabela has one user editing one notebook; agent coordination would need either module-namespaced definitions, or a namespace allocation protocol.

**2. Agent identity in the event stream.**
`NotebookEvent` has no "who asked for this" field. In a multi-agent broadcast scenario, every agent sees every event. Routing results back to the requesting agent would require either filtering on `cellId` (which maps to agent requests) or a per-agent `dupTChan` subscription.

**3. Competing write resolution.**
Sabela's generation mechanism handles a single actor's concurrent requests (edit then run-all in quick succession). It does not handle two *different* agents both editing state simultaneously. A true multi-agent coordinator would need either a CRDT approach to notebook state, or explicit agent turns, or a request queue.

**4. Persistent cross-session state.**
When `resetSession` is called, all GHCi definitions vanish. Agents that have built up expensive state (loaded data, compiled templates, established connections) would need either a "prelude replay" mechanism (like Sabela's `loadSabelaPrelude`) or a distinction between durable and ephemeral session state.

**5. Computational cost attribution.**
`execCell` just runs a block and measures nothing. In an agent system, you'd want to know: which agent caused this computation, how long did it take, how much of the session's capacity is this agent consuming?

### The architectural pattern Sabela offers:

```
┌─────────────────────────────────────────────────┐
│  Agent 1     Agent 2     Agent 3    Agent N      │
│     ↓            ↓           ↓         ↓         │
│  ┌──────────────────────────────────────────┐   │
│  │   Coordinator (AppState + ReactiveNB)    │   │
│  │   generation   stBroadcast (TChan)       │   │
│  │   stNotebook   stSession                 │   │
│  └──────────────────┬───────────────────────┘   │
│                     ↓                           │
│           ┌─────────────────┐                   │
│           │  Session Layer  │  (MVar lock)       │
│           │  GHCi process   │                   │
│           │  TBQueue stdout │                   │
│           │  IORef stderr   │                   │
│           └─────────────────┘                   │
└─────────────────────────────────────────────────┘
```

The coordinator holds the shared world. Agents make requests; the coordinator serialises them through the session lock, tracks generations to prevent stale results, and broadcasts outcomes through the `TChan`. This is already the correct topology for shared REPL coordination. Sabela just has one agent (the human user + browser) rather than many.

---

## The Three Philosophical Lenses

### Poise — Observe

*Poise is the capacity to remain still in the presence of motion — to observe without collapsing into reaction.*

Sabela is saturated with poised observation:

- **`errLoop`**: a background thread that runs forever, watching stderr, doing nothing but accumulating. It never acts; it only receives.
- **`drainUntilMarker`**: blocks on a `TBQueue`, accumulating lines patiently until a signal arrives. It doesn't poll, doesn't time out, doesn't interpret — it waits.
- **`isCurrentGen`**: a predicate that observes the world's current generation and compares it to what was true when an action began. It doesn't do anything itself; it enables everything else to decide.
- **SSE (`sseApp`)**: a permanently open HTTP response that does nothing but `forever $ readTChan chan >> write`. The browser observes; the server is the medium.
- **`stDebounceRef`**: a `MVar (Maybe (Int, Set Int))` that watches accumulated edits before acting on them.

For Haskell field agents, poise means: hold a live session, watch its output stream, accumulate faithfully, and resist the temptation to interpret prematurely. The REPL is a river; an agent stands at the bank, watching. Only after the marker appears — the signal that a thought is complete — does action become appropriate.

The `TBQueue` with its bounded capacity (`newTBQueueIO 256`) is an architectural embodiment of poise: it can absorb a burst of output without losing data, without rushing, applying back-pressure to the producer rather than dropping lines.

### Curate — Sparse

*Curation is the discipline of choosing less so that what remains is more.*

Sabela curates at every level:

- **`selectAffected`**: does not re-run everything. It computes the minimal forward slice from the edited cell. This is curation as computation — keeping only what the change could have touched.
- **`displayPrelude`**: five functions. The entire bridge between Haskell computation and browser display is five `putStrLn` wrappers. No library, no type class, no abstraction. Just enough.
- **`ensureSessionAlive`**: before installing anything, it checks `S.fromList (metaDeps metas) == installed`. If nothing has changed, nothing happens. Curation as idempotence.
- **`infoH`**: three-stage escalation — `:info` first, then `:type`, then `:doc`. Each is tried only if the previous was insufficient. No waterfall of queries; just enough to serve the request.
- **`builtinExamples`**: 14 examples. Not exhaustive; representative. Each is self-contained, runnable, and teaches one thing.
- **The markdown notebook format**: prose and code, nothing else. No metadata blocks, no execution counts, no kernel state, no output formats beyond what `parseMimeOutput` handles. The format cannot accumulate cruft.
- **`scGhcOptions = []`** in `defaultCfg`: ghc options are plumbed through but left empty by default. The session is as bare as it can be.

The `-- cabal:` directive syntax is itself sparse: exactly `-- cabal: key: value`, read by `scripths`, merged by `mergeMetas`. No YAML frontmatter, no JSON blocks, no config files. The notebook carries only what it needs.

For agents: sparse REPL usage means defining only names that will genuinely be reused, letting the session's namespace remain navigable, and exercising `queryInfo` before redefining anything. An agent that curates its REPL footprint is a better citizen of a shared session.

### Duality — Opposites Merge

*Duality is not contradiction resolved but contradiction held — two things that are each other.*

Sabela is built from productive tensions:

**Document / Program**: A `.md` file is a document for readers and a program for the session. `parseMarkdown` reads it as structured data; `reassemble` writes it back as text. The notebook is simultaneously a thing you read and a thing you run. These aren't separate modes; they're the same file.

**Interactive / Compiled**: GHCi is an interpreter, but `toGhciScript` from `scripths` renders cell source into a form that respects Haskell's top-level/expression distinction. The cell feels like a script; the runtime is an interpreter. Neither is quite the truth.

**In-band / Out-of-band**: `---MIME:text/html---` is extra-protocol information transmitted through the protocol. `---SABELA_MARKER_n---` is session control through session output. The signal is embedded in the noise it distinguishes itself from.

**Isolation / Sharing**: `MVar sessLock` gives each `runBlock` caller the illusion of exclusive session access. But the session is shared — every previous binding is visible to every future call. Isolation and sharing coexist in the same `MVar`.

**Reactive / Linear**: Sabela is reactive — upstream changes propagate downstream automatically. But `selectAffected` works on a linearly ordered list of cells with a single forward sweep. Reactivity is implemented through linearity. The graph is a list; the propagation is a scan.

**Ephemeral / Persistent**: The GHCi session is ephemeral — it dies on `resetSession`, loses all bindings. The notebook is persistent — it lives on disk, survives restarts. The two representations are kept in tension by the load/execute/save cycle. Neither one is the ground truth; both are.

**Local / Remote**: The notebook runs locally (GHCi on the server process), but the user sees it in a browser. The SSE channel is the membrane between these two topologies. Every `broadcast st ev` is a moment where local computation becomes remote perception.

For agents: the duality of a shared REPL is that an agent's private computation lives in a public namespace. What an agent defines becomes part of the shared world. What other agents defined is already in that world, visible, reusable, potentially collision-prone. The agent's `x` and the world's `x` are the same `x`. This is both the power of a shared REPL (agents can build on each other's work) and its hazard (they can also erase it).

---

## Summary Assessment

Sabela is a mature, clear-eyed piece of software. It does not pretend to be more than it is. The architecture is stratified cleanly: session management, reactive scheduling, HTTP API, and static serving are separate concerns with explicit seams. The dependency on `scripths` is honest — Sabela doesn't reimplement what `scripths` already provides.

The design philosophy is one of *productive restraint*: heuristic dependency tracking rather than compiler-accurate graphs; markdown rather than binary notebooks; five display helpers rather than a display library; a generation counter rather than distributed consensus. Each restraint is a deliberate choice that keeps the system comprehensible, fast, and correct in the common case.

For shared REPL coordination among Haskell field agents, Sabela provides the right primitive substrate: a serialised, marker-demarcated, broadcast-event session with clean lifecycle management. The extension work would be at the coordination layer — agent identity, namespace partitioning, competing write resolution — rather than at the session layer, which is already well-suited to the task.

The name *sabela* — "to respond" — is more philosophically loaded than it first appears. Responsiveness is not just a feature; it is the stance. The system is poised, waiting to observe. It curates its response to the minimum necessary. And it holds the duality of document and program, interactive and compiled, ephemeral and persistent, without forcing a resolution.
