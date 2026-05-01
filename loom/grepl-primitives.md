# Grepl Primitives ⟜ Design Working Notes

**Goal:** Simplify grepl to a minimal, concrete interface. Eliminate Pty. Understand what TChan actually is.

---

## The Desired Interface

```haskell
repl-open :: IO Repl
repl-close :: Repl -> IO ()
repl-commit :: Repl -> ByteString -> IO ()  -- send input
repl-emit :: Repl -> IO ByteString         -- read output
```

Three operations on a `Repl`:
1. Create it
2. Send input
3. Receive output
4. Destroy it

No callbacks. No listeners. No async machinery. Just IO.

---

## Current Architecture

### Fifo Path (what we want to keep)

```
Agent → repl-commit → FIFO stdin
                        ↓
                     cabal repl
                        ↓
Process stdout → File ./log/cabal-repl-stdout.md
                 ↑
              Watcher detects change
                 ↓
               TChan ← Agent reads from TChan
```

**Problem:** 5 hops. Agent writes to FIFO, but reading happens through file monitoring + TChan.

### Pty Path (what we're retiring)

```
Agent → sendCommand
          ↓
       writePty → PTY stdin
                   ↓
                cabal repl
                   ↓
               PTY stdout → readUntilPrompt (blocking)
                 ↑
              Returns immediately with Text
```

**Advantage:** Direct bidirectional channel. No files, no watching, no queuing.
**Disadvantage:** Complex prompt detection, ANSI stripping, timeout logic. Tightly coupled to PTY specifics.

---

## What is the TChan, Abstractly?

The TChan in Watcher is a **pull-based event notification system**:

- **What it notifies:** "The stdout file changed" (filepath goes into channel)
- **Who produces:** FSNotify file watcher (background thread)
- **Who consumes:** Agent code (calls readTChan)
- **Abstraction:** Concurrent queue of external events

But here's the key: **The agent doesn't want events. The agent wants output.**

Current flow:
1. Agent needs to know "did my query finish?"
2. So it watches files
3. When file changes, it reads it

Better flow:
1. Agent sends query
2. Agent asks "give me the output"
3. When output is ready, return it

---

## Recasting Fifo in Primitive Terms

### Grepl.Fifo Today

```haskell
channel :: ChannelConfig -> IO ProcessHandle
```

Returns: A process handle. No I/O primitives. Agent has to:
- Write directly to FIFO path
- Watch the stdout file path
- Parse updates from file

### Grepl.Fifo Recast

Wrap the channel and file I/O into a `Repl` type:

```haskell
data Repl = Repl
  { stdinPath :: FilePath
  , stdoutPath :: FilePath
  , stderrPath :: FilePath
  , processHandle :: ProcessHandle
  , lastOutputLine :: IORef Int  -- track what we've read
  }

repl-open :: ChannelConfig -> IO Repl
repl-open cfg = do
  ph <- channel cfg
  ref <- newIORef 0
  pure $ Repl (stdinPath cfg) (stdoutPath cfg) (stderrPath cfg) ph ref

repl-commit :: Repl -> ByteString -> IO ()
repl-commit r bs = BS.writeFile (stdinPath r) bs

repl-emit :: Repl -> IO ByteString
repl-emit r = do
  -- Read stdout file, return new lines since last read
  -- This blocks until something appears (via Watcher or polling)
  lastLine <- readIORef (lastOutputLine r)
  contents <- BS.readFile (stdoutPath r)
  let allLines = BS.lines contents
      newLines = drop lastLine allLines
  writeIORef (lastOutputLine r) (length allLines)
  pure $ BS.unlines newLines

repl-close :: Repl -> IO ()
repl-close r = terminateProcess (processHandle r)
```

**Problem with this approach:** `repl-emit` has to **poll** the file. It blocks but doesn't know when new data arrives. Inefficient.

**Better approach:** Keep TChan but hide it inside `Repl`:

```haskell
data Repl = Repl
  { stdinPath :: FilePath
  , processHandle :: ProcessHandle
  , outputChan :: TChan ByteString
  }

repl-open :: ChannelConfig -> IO Repl
repl-open cfg = do
  ph <- channel cfg
  chan <- newTChanIO
  -- Spawn watcher in background, but instead of returning TChan,
  -- the watcher writes output chunks to our internal chan
  watchMarkdownWith (stdinPath cfg) chan
  pure $ Repl (stdinPath cfg) ph chan

repl-emit :: Repl -> IO ByteString
repl-emit r = atomically $ readTChan (outputChan r)
```

**This makes sense, but:** Watcher gives us filepath updates, not the actual output. We'd still need to read the file after being notified of the change.

---

## What TChan Actually Is

The TChan is trying to solve: **"How does the agent know when output is ready?"**

But it's solving it indirectly:
- Watcher detects file change
- Notifies agent via TChan
- Agent reads file

This is **event notification for file changes**, not **output streaming**.

---

## The Real Design Choice

**Option A: Fifo + Watcher (current)**
- Fifo for process I/O (files)
- Watcher for "did the file change?" notifications
- TChan as the notification queue
- Agent reads notifications, then reads file

**Option B: Fifo + Direct Polling**
- Fifo for process I/O
- Agent polls stdout file directly
- No Watcher, no TChan
- Simpler but less efficient (busy-waiting)

**Option C: PTY-based Direct Channel**
- PTY for bidirectional I/O (no files)
- Direct read/write on PTY handles
- Agent gets output immediately
- More complex prompt/timeout logic

---

## Why We Have TChan (The Real Reason)

The FIFO+file approach is **asynchronous and decoupled**:
- Process writes to file continuously
- Agent doesn't block on the process
- Multiple agents can read the same file
- Output is logged persistently

The TChan is the **notification mechanism** for "something changed externally."

But the abstraction leaks:
- Agent has to understand files exist
- Agent has to understand Watcher exists
- Agent has to handle the TChan + file reading dance

---

## Proposal: Hide the Machinery

```haskell
data Repl = Repl
  { config :: ChannelConfig
  , processHandle :: ProcessHandle
  , outputChan :: TChan ByteString  -- INTERNAL
  , inputBuffer :: IORef [ByteString]  -- pending commits
  }

repl-open :: ChannelConfig -> IO Repl
repl-open cfg = do
  ph <- channel cfg
  chan <- newTChanIO
  buf <- newIORef []
  -- Watcher is spawned, but the agent never sees it
  watchMarkdownWith (directory cfg) chan
  -- Background thread reads file updates and chunks them into output
  _ <- forkIO $ watchAndBuffer cfg chan outputChan
  pure $ Repl cfg ph chan buf

repl-commit :: Repl -> ByteString -> IO ()
repl-commit r bs = do
  -- Either write directly to FIFO or buffer it
  BS.writeFile (stdinPath (config r)) bs

repl-emit :: Repl -> IO ByteString
repl-emit r = atomically $ readTChan (outputChan r)
```

**Key insight:** The agent calls `repl-emit`, and the internal machinery (Watcher + file reading) is hidden. The agent doesn't know about files or Watcher.

---

## Simplification: Why Keep Files At All?

If we're hiding the machinery, why not just use PTY but simplify the interface?

```haskell
data Repl = Repl
  { pty :: Pty
  , outputChan :: TChan ByteString
  }

repl-open :: IO Repl
repl-open = do
  (pty, _ph) <- spawnCabalRepl
  chan <- newTChanIO
  -- Spawn background reader that reads from PTY and chunks to chan
  _ <- forkIO $ readPtyAndBuffer pty chan
  pure $ Repl pty chan

repl-commit :: Repl -> ByteString -> IO ()
repl-commit r bs = writePty (pty r) bs

repl-emit :: Repl -> IO ByteString
repl-emit r = atomically $ readTChan (outputChan r)
```

**This is closer to what we want.** But:
- PTY is complex (ANSI codes, prompt detection, timeouts)
- FIFO is simpler (just files)
- Which approach do we actually need?

---

## Next Step: Understand the Real Requirement

⟝ **Question for you:** What's the actual agent workflow?

Option A:
- Agent sends a query
- Agent waits for complete output (prompt + all results)
- Agent parses and acts
- Agent sends next query

Option B:
- Agent sends multiple queries (pipelined)
- Agent reads streaming output as it arrives
- Agent reacts to partial results
- Concurrent reading/writing

Option C:
- Agent sends query, gets back immediately
- Agent polls periodically for updates
- Flexible timing, decoupled

The interface should match the actual need, not abstract over multiple incompatible patterns.

---

## Status

🟣 **Blocked:** Need clarity on the actual agent workflow to choose between Fifo vs PTY
🟢 **Clear:** The primitives interface is well-defined (open, close, commit, emit)
🟢 **Clear:** TChan is an internal implementation detail, can be hidden from agents
🚩 **Unresolved:** Do we need the `lastOutputLine` tracking, or just stream everything through TChan?
🚩 **Unresolved:** How does prompt detection work in the abstracted interface?
