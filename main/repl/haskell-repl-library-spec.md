# haskell-repl-library ⟜ specification for file-based REPL bridge

**Purpose:** Library wrapping cabal repl with file-based query protocol (no markers, no synchronization).

**Location:** ~/repos/repl/ (Haskell library)

---

## Core Abstraction

**Repl** ⟜ persistent `cabal repl` session accessed via files

**Type signature (Haskell):**
```haskell
data ReplicState = ReplicState
  { process :: ProcessHandle
  , inFile  :: FilePath    -- /tmp/ghci-in.txt
  , outFile :: FilePath    -- /tmp/ghci-out.txt
  , errFile :: FilePath    -- /tmp/ghci-err.txt
  }

startRepl :: FilePath -> IO ReplState
queryRepl :: ReplState -> String -> IO (Either String String)  -- query ⟜ response
stopRepl  :: ReplState -> IO ()
```

---

## startRepl ⟜ spawn cabal repl with file stdio

**Input:**
- Project directory (where .cabal file lives)

**Output:**
- ReplState (process handle + file paths)

**Behavior:**
- Opens `/tmp/ghci-in.txt` for reading (cabal repl stdin)
- Opens `/tmp/ghci-out.txt` for writing (cabal repl stdout)
- Opens `/tmp/ghci-err.txt` for writing (cabal repl stderr)
- Spawns `cabal repl` in project directory
- Process persists until stopRepl called
- Returns immediately (async, non-blocking)

**Verification:**
- [ ] Process launches without error
- [ ] All three temp files exist and are writable
- [ ] `cabal repl` prompt appears in out file within 2 seconds
- [ ] Process PID is tracked and valid

**Errors:**
- If `.cabal` file missing: throw `NoCabalFile`
- If cabal not found: throw `CabalNotFound`
- If spawn fails: throw `ProcessSpawnFailed`

---

## queryRepl ⟜ send query, wait for response

**Input:**
- ReplState (from startRepl)
- Query string (e.g., `:t putStrLn` or `:i fold`)
- Implicit: timeout (default 5 seconds, configurable)

**Output:**
- Right String (response, parsed and trimmed)
- Left String (error message or timeout)

**Behavior:**
1. Write query to `/tmp/ghci-in.txt`
2. Wait (poll `/tmp/ghci-out.txt` every 50ms, max 5 sec)
3. Search for expected pattern in output:
   - For `:t` queries: look for `::` (type signature)
   - For `:i` queries: look for type or definition
   - For `:k` queries: look for `*` or `->`
   - For other: look for prompt `>` or error
4. Extract response (lines matching pattern)
5. Return response or timeout error

**Verification:**
- [ ] Query written to inFile
- [ ] Polling starts and continues
- [ ] Response pattern found within timeout
- [ ] Response extracted and cleaned
- [ ] Subsequent queries still work (no state corruption)

**Errors:**
- If timeout (5 sec): return `Left "Timeout: no response after 5s"`
- If pattern never found: return `Left "No response pattern found"`
- If parse error: return `Left "Response unparseable: <content>"`

---

## Pattern Recognition (Core Logic)

**For `:t` (type):**
```
:t putStrLn
putStrLn :: String -> IO ()
```
Search: `::` → extract lines containing `::` and signature

**For `:k` (kind):**
```
:k Maybe
Maybe :: * -> *
```
Search: `*` or `->` → extract kind line

**For `:i` (info):**
```
:i fold
fold :: (a -> b -> b) -> b -> [a] -> b
```
Search: `::` or function name followed by `=` → extract definition

**For errors:**
```
:t undefined_var
<interactive>:1:1: error: Variable not in scope: undefined_var
```
Search: `error:` → extract error message

---

## stopRepl ⟜ terminate repl session

**Input:**
- ReplState

**Output:**
- IO () (async)

**Behavior:**
- Send `:quit` to stdin (or SIGTERM to process)
- Wait max 1 second for process to exit
- If still running: SIGKILL
- Delete temp files
- Return

**Verification:**
- [ ] Process terminates
- [ ] Temp files cleaned up
- [ ] No zombie processes

---

## Design Decisions (Why This Works)

### No Markers
**Problem:** Adding markers (e.g., `@@START@@response@@END@@`) requires cooperation from GHCi.
**Solution:** Just search for natural patterns (`::`  for types, `error:` for errors). They're unambiguous.

### No Synchronization
**Problem:** How do we know when response is complete?
**Solution:** Sequential queries. By the time we poll for response to query N, no other queries are in flight.

### File-Based Not Socket-Based
**Problem:** Sockets require connection/protocol management.
**Solution:** Files are simpler, observable, debuggable. `tail /tmp/ghci-out.txt` shows state immediately.

### Polling Not Blocking
**Problem:** Blocking I/O requires threads/async.
**Solution:** Poll every 50ms, max 5 sec. Cheap, portable, handles timeouts naturally.

### No Markers, No Locks
**Problem:** Complex state machines are fragile.
**Solution:** Queries are stateless. Caller controls polling loop. Simple.

---

## Configuration & Future Work

**Current (MVP):**
- Fixed timeout: 5 seconds
- Fixed poll interval: 50ms
- Fixed temp file locations: /tmp/ghci-*.txt

**Future (if needed):**
- Configurable timeout
- Configurable poll interval
- Configurable temp file paths
- Configurable cabal flags (`:set args`, etc.)
- Pattern hints per query type

---

## Testing Strategy

**Unit tests:**
- startRepl: verify process launches, files created
- queryRepl: verify type queries, info queries, errors
- stopRepl: verify process terminates, cleanup

**Integration tests:**
- End-to-end: spawn repl, query types, stop
- Multiple queries: ensure no state corruption
- Error handling: timeout, bad queries, missing functions
- Concurrent queries: (not supported in first version, but document limitation)

**Property tests:**
- queryRepl always returns within timeout OR error
- stopRepl always terminates process
- No temp files leaked

---

## Known Limitations

1. **Sequential only** — One query at a time. Concurrent queries not supported yet.
2. **Timeout handling** — If query hangs, we timeout. No graceful recovery.
3. **Pattern matching** — If pattern is ambiguous, response extraction may fail.
4. **GHCi version dependent** — Output format varies by GHC version. May need pattern adjustments.

---

## Next Steps

1. **Implement core (startRepl, queryRepl, stopRepl)** in Haskell
2. **Test with sample repo** (~/repos/repl/)
3. **Document edge cases** (what happens with partial responses, etc.)
4. **Add async support** (for concurrent queries, optional)
5. **Integrate with larger system** (type wrangling, agentic exploration)

---

## See Also

- ~/mg/yin/repl-user.md (query pattern documentation)
- ~/mg/yin/repl-startup.md (process spawning details)
- ~/mg/yin/repl-mock.md (mock for testing)
- ~/mg/yin/drift-ghci-echo.md (why echo behavior differs, handled by patterns)
