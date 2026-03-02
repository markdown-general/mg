Warning (startup, global settings): Lock file is already being held
Error: Lock file is already being held
    at /Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/lib/lockfile.js:68:47
    at newFs.<computed> [as stat] (/Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/lib/adapter.js:20:13)
    at /Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/lib/lockfile.js:56:20
    at newFs.<computed> [as mkdir] (/Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/lib/adapter.js:17:24)
    at acquireLock (/Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/lib/lockfile.js:29:16)
    at RetryOperation._fn (/Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/lib/lockfile.js:233:13)
    at RetryOperation.attempt (/Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/node_modules/retry/lib/retry_operation.js:112:8)
    at /Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/lib/lockfile.js:232:19
    at resolveCanonicalPath (/Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/lib/lockfile.js:17:16)
    at lock (/Users/tonyday567/other/pi-mono/node_modules/proper-lockfile/lib/lockfile.js:224:5)
Now I have a complete picture. The stdout log reveals a critical fact — `ghci>` prompt appears in stdout. Let me synthesize the full analysis.

---

## Cabal REPL for Haskell Field Agents: Rebuild Analysis

### What Exists (Ground Truth)

**`grepl`** — Haskell library, two modules:
- `Grepl`: spawns cabal repl via `System.Process`, wires a **named FIFO** (`/tmp/ghci-in`) to stdin, **appends** stdout/stderr to `.md` files
- `Grepl.Watcher`: `fsnotify`-based `TChan String` — fires when `.md` stdout files are modified

**`repl-viewport`** — Python + HTML, not Haskell:
- Python HTTP server bridges browser ↔ `/tmp/ghci-in.txt` / `/tmp/ghci-out.txt`
- Browser polls `/response` at 200ms, pattern-matches heuristically to detect completion (`::`/`*`/`error:`)
- Single-file overwrite protocol (not append), human-facing

**The log reveals the sentinel hiding in plain sight:**
```
ghci> 4
ghci> Leaving GHCi.
ghci> Hello, YinOperator!
```
The `ghci>` prompt appears in stdout. This is GHCi's response terminator — it's already there.

---

### The Core Problem for Field Agents

A field agent needs exactly one thing: `Query → IO Response`. That requires:

1. **Write query** to REPL stdin
2. **Detect response boundary** — know precisely when output for *this* query is done
3. **Read response text** — clean, typed, extractable

Everything else (viewports, watchers, HTTP bridges, markdown logs) is scaffolding for a different audience.

---

## Option A: Reuse `repl-viewport` + `grepl`

### What you'd actually take

**From `grepl`:**
- `ChannelConfig` data type — clean, reusable
- `channel` function — process spawning via `System.Process` ✓
- `Grepl.Watcher` — `TChan String` of file events ✓

**From `repl-viewport`:**
- The file protocol concept (read/write `/tmp/ghci-*.txt`)
- The response-completion detection idea (but not the heuristic implementation)
- The Python server — **nothing, this is dead weight for agents**

### Pros

| Dimension | Value |
|---|---|
| Working protocol | The FIFO-in / file-out pattern is proven (stdout log confirms it works) |
| Haskell process management | `channel` is correct — handles, no-buffering, cwd, `CreateProcess` all right |
| Reactive notification | `Grepl.Watcher` via `fsnotify` + `TChan` is idiomatic and correct |
| STM | `TChan` composes naturally with agent concurrency |
| Cabal-awareness | `ChannelConfig.processCommand = "cabal repl"` already handles project context |
| Append semantics | Multiple query sessions accumulate — useful audit trail |

### Cons

| Dimension | Problem |
|---|---|
| **Response demarcation** | Neither system solves this. `grepl` detects *file change* (coarse). `repl-viewport` uses heuristic pattern matching on `::` and `*` — **fragile and wrong** for agents (`:t map` returns `(a → b) → [a] → [b]` which has `→` not `->`, multiline type sigs break it, etc.) |
| **`.md` extension convention** | Semantic mismatch. Markdown for machine-parsed Haskell output is noise. The watcher `isMarkdownFile` and `isStdout` filters are tied to this accident. |
| **FIFO blocking** | A named FIFO blocks `open()` until both reader and writer are ready. If cabal repl dies, the writing side of the agent will hang forever on `openFile`. |
| **Append accumulation** | Stdout file grows unboundedly per session. Agents must track `lastResponseLength` — which is exactly what `repl-viewport`'s `state.lastResponseLength` does, in JavaScript, fragily. |
| **Python dependency** | `repl-viewport`'s server is alien to a Haskell project. Adds runtime dependency, CORS, HTTP overhead, port conflicts — all irrelevant to field agents. |
| **Response framing missing** | The watcher tells you *a file changed*, not *this query's response is complete*. You still need to solve the framing problem on top. |
| **No handle to stdout** | `channel` discards the stdout `Handle` — redirects to file. Agent must go back to file system to read responses. Indirect, racy. |

### The accumulation + position-tracking trap

Reusing both means inheriting this loop from `repl-viewport`'s JS:
```javascript
const newContent = fullResponse.substring(lastCheckedLength);
if (isResponseComplete(query, newContent)) { ... }
```
You'd replicate this in Haskell: track file byte offset, read new bytes after each query, apply fragile pattern matching. This is the worst of both worlds — file I/O indirection with no type safety.

---

## Option B: Start Blank

### What you'd build

A minimal, typed, agent-facing REPL handle:

```haskell
data ReplHandle = ReplHandle
  { sendQuery  :: Text -> IO ()
  , readResponse :: IO Text   -- blocks until response complete
  , closeRepl  :: IO ()
  }

withCabalRepl :: FilePath -> (ReplHandle -> IO a) -> IO a
```

Using `CreatePipe` for stdout, the `ghci>` prompt as sentinel, bracketed resource management.

### The Key Insight Already in the Logs

The stdout log shows:
```
ghci> 4
ghci> Hello, YinOperator!
```
GHCi prints its prompt to stdout after every response. The prompt *is* the frame delimiter. Set it explicitly:

```
:set prompt "GHCI_READY\n"
```

Then `readResponse = readUntilSentinel handle "GHCI_READY"` — deterministic, zero heuristics.

### Pros

| Dimension | Value |
|---|---|
| **Correct framing** | Sentinel prompt = reliable `Query → Response` boundary, no pattern matching |
| **Direct pipes** | `CreatePipe` gives you a `Handle` — read directly in Haskell, no filesystem roundtrip |
| **No FIFO blocking** | Bidirectional `Handle` pair from `System.Process` — symmetric, no blocking `open()` |
| **No `.md` convention** | Output is just `Text`, no file extension semantics |
| **Type-safe** | `ReplHandle` is a first-class value; can compose, mock, bracket |
| **No Python** | Pure Haskell stack |
| **No polling** | Direct `hGetLine` on `Handle` — blocking read, no interval timer |
| **Bracket safety** | `withCabalRepl` ensures process cleanup on exception |
| **Agent-composable** | `sendQuery :: Text -> IO ()` is a pure Haskell action — trivially parallel, concurrent, queued |

### Cons

| Dimension | Problem |
|---|---|
| Rebuild process management | ~50 lines — but grepl's `channel` is a good template, just replace `UseHandle fileHandle` with `CreatePipe` |
| No `.md` audit trail | The file accumulation in grepl is an accidental feature — agents don't need it, but you lose it |
| Cabal startup latency | Still have to wait for cabal to compile on first start — nothing changes here |
| Lose `fsnotify` reactive watch | `Grepl.Watcher` is unused if you have direct pipes — it solved a problem you no longer have |

---

## Philosophical Analysis: Poise / Curate / Duality

### Poise (observe before acting)

Observing honestly what each system actually is:

- **`grepl`** is a *process management and reactive notification* library. Its job is: spawn the REPL, redirect I/O to files, watch files for changes. It is a **log-and-watch** pattern, not a **request-response** pattern.
- **`repl-viewport`** is a *human interface* — browser, dark theme, keyboard shortcuts. It is maximally the wrong surface for machine agents.
- The **file append + watcher** pattern is elegant for human workflows (human writes to FIFO, glances at browser). It is the **wrong shape** for agent workflows (agent needs `Query → Text` not `write file → watch file → read file → parse position`).

Poised observation: the existing code solves a **different problem**. Not a bad problem — but not the agent problem.

### Curate (sparse)

The minimum viable agent REPL:

```
spawn process → get (stdin Handle, stdout Handle) → set sentinel prompt → loop: write query → read until sentinel → return text
```

That's 4 concepts. Everything else is for other audiences.

What to curate from existing code:
- ✅ `ChannelConfig` shape (configurable projectDir, processCommand) — reuse the struct idea
- ✅ The `cabal repl` invocation pattern
- ✅ The `NoBuffering` setting for handles
- ❌ FIFO — replace with `CreatePipe`
- ❌ `.md` files — replace with direct pipe reads
- ❌ `Grepl.Watcher` — superseded by blocking pipe reads
- ❌ Python server — discard entirely
- ❌ HTML viewport — discard (separate concern)
- ❌ Heuristic pattern matching — replace with prompt sentinel

### Duality (opposites merge)

The genuine duality here: **human viewport ↔ machine agent**.

They share one thing: the running `cabal repl` process. The question is how to mediate.

The file-based protocol is the bridge that merges both:
- Humans can `cat /tmp/ghci-out.txt` or watch a browser
- Machines can read the same file

But the file protocol only works for *one* of them natively. For agents, the pipe protocol is native. The duality resolves not by picking one protocol, but by recognizing:

**The REPL process is shared. The access pattern is dual.** The right architecture is:

```
                    stdin pipe ←──── Agent (ReplHandle)
cabal repl ──────┤
                    stdout pipe ────► Agent (blocking read)
                    stderr pipe ────► Log file (for human inspection)
```

Stdout goes directly to the agent. Stderr goes to a file (human can `tail -f` it). This merges both audiences without the Python bridge: stderr is the human window, stdout is the agent wire.

The duality of **sync (agent)** and **async (process)** is resolved by the prompt sentinel: you get synchronous `Query → Response` semantics over an asynchronous process channel. The FIFO/file/watcher approach tries to solve this with polling + heuristics. The prompt sentinel solves it structurally.

---

## Verdict: Selective Salvage, Not Binary Choice

Neither pure option is right. The real answer:

### Salvage from `grepl`
```haskell
-- Keep the shape, change the wiring
data ReplConfig = ReplConfig
  { processCommand :: String   -- "cabal repl"
  , projectDir     :: FilePath -- where .cabal lives
  , sentinelPrompt :: String   -- "GHCI_READY\n" (new)
  }
```
Keep: config struct, `NoBuffering`, `cwd`, the `shell` invocation pattern.  
Change: `UseHandle fileHandle` → `CreatePipe`.

### Discard from `grepl`
- FIFO (`mkfifo`, blocking `open`)
- `.md` file convention
- `Grepl.Watcher` (solved differently)
- The `channel` return of `ProcessHandle` without I/O handles

### Discard entirely from `repl-viewport`
- Python server
- Browser viewport
- 200ms polling loop
- Heuristic pattern matching (`::`/`*`/`error:`)

### Build new
```haskell
-- Core agent API
data ReplHandle = ReplHandle
  { sendQuery    :: Text -> IO ()
  , readResponse :: IO Text         -- blocks until sentinel
  , replProcess  :: ProcessHandle
  }

withCabalRepl :: ReplConfig -> (ReplHandle -> IO a) -> IO a
withCabalRepl cfg action = bracket acquire release action
  where
    acquire = do
      let spec = (shell (processCommand cfg))
            { cwd     = Just (projectDir cfg)
            , std_in  = CreatePipe
            , std_out = CreatePipe
            , std_err = Inherit  -- or UseHandle for log file
            }
      (Just inh, Just outh, _, ph) <- createProcess spec
      hSetBuffering inh  NoBuffering
      hSetBuffering outh NoBuffering
      -- Install sentinel prompt
      hPutStrLn inh ":set prompt \"GHCI_READY\\n\""
      _ <- readUntilSentinel outh "GHCI_READY"  -- drain startup
      pure $ ReplHandle
        { sendQuery    = \q -> hPutStrLn inh (Text.unpack q)
        , readResponse = readUntilSentinel outh "GHCI_READY"
        , replProcess  = ph
        }
    release h = do
      sendQuery h ":quit"
      waitForProcess (replProcess h)

readUntilSentinel :: Handle -> String -> IO Text
readUntilSentinel h sentinel = go []
  where
    go acc = do
      line <- hGetLine h
      if line == sentinel
        then pure (Text.unlines (reverse acc))
        else go (Text.pack line : acc)
```

### What `Grepl.Watcher` becomes
Not deleted — repurposed. If field agents need to watch Haskell source files for changes (recompile trigger), `fsnotify + TChan` is exactly right for *that* problem. But it's not needed for the REPL response loop itself. Move it to a `FieldAgent.Watch` module with the `.md` constraint removed.

---

## Summary Table

| Concern | repl-viewport | grepl | New |
|---|---|---|---|
| Process spawn | ❌ shell script | ✅ Haskell `createProcess` | ✅ `createProcess` + `CreatePipe` |
| Stdin delivery | File `/tmp/ghci-in.txt` | FIFO `/tmp/ghci-in` | Direct `Handle` |
| Stdout capture | File `/tmp/ghci-out.txt` | File `log/*.md` | Direct `Handle` |
| Response framing | Heuristic pattern match | ❌ none (file change signal only) | **Sentinel prompt** |
| Agent API | ❌ HTTP POST + polling | ❌ file offset tracking | ✅ `Query → IO Text` |
| Human visibility | Browser viewport | `cat log/*.md` | `tail -f` stderr |
| Language | Python + JS | Haskell | Haskell |
| Reactive watch | 200ms JS poll | `fsnotify` TChan | Not needed (blocking read) |
| Concurrency | None | STM `TChan` | STM (multiple agents) |
| Philosophy fit | ❌ maximally complex | ⚠️ log-and-watch | ✅ poise/curate/duality |

**Start from grepl's Haskell skeleton. Add `CreatePipe` + sentinel prompt. Discard the Python layer entirely. The viewport lives on as a separate human tool — it just reads stderr now, which needs no bridge.**
