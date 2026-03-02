# repl-protocol-verify ⟜ Experimental verification of file-based GHCi protocol

**Status:** ✓ Complete (baseline verified)  
**Intent:** Prove the file-based query protocol works by running real experiments. No library, no abstractions — just manual testing against actual cabal repl.

**Context:** Previous attempt (building a library) failed because polling was tested against mock-repl only. The field agent never caught that real cabal repl behaves differently. Result: overconfidence, wasted work, library verification failed.

**This card:** Go back to basics. Run experiments. Verify protocol with reality before building abstractions.

**Runner:** Tony  
**Yin operator:** YinOperator

---

## Step 1: Environment Setup

**Goal:** Create the file infrastructure and verify it works.

**Tasks:**
- [ ] Ensure `/tmp/` is writable (`touch /tmp/test.txt`, `rm /tmp/test.txt`)
- [ ] Create input, output, error files: `/tmp/ghci-in.txt`, `/tmp/ghci-out.txt`, `/tmp/ghci-err.txt` (empty to start)
- [ ] Verify files exist and are readable/writable

**Evidence:** Run this:
```bash
ls -la /tmp/ghci-*.txt
```

Should show three files, all readable/writable.

---

## Step 2: Spawn cabal repl with file-based stdio

**Goal:** Launch a real GHCi session pointed at the temp files.

**Project to use:** Pick a simple Haskell project with a working `.cabal` file. Candidates:
- ~/repos/hyp/ (if it exists and builds)
- ~/repos/chart-svg/ (if it exists and builds)
- Or create a minimal test project

**Tasks:**
- [ ] Pick a project, verify it has `.cabal` and builds
- [ ] Spawn cabal repl with stdio redirection:
  ```bash
  cd ~/repos/CHOSEN_PROJECT
  cabal repl < /tmp/ghci-in.txt > /tmp/ghci-out.txt 2> /tmp/ghci-err.txt &
  ```
- [ ] Wait 2 seconds
- [ ] Check `/tmp/ghci-out.txt` for GHCi prompt

**Evidence:** Read `/tmp/ghci-out.txt`. Should contain something like:
```
GHCi, version 9.X.X: ...
[1 of N] Compiling ...
Loaded module: Prelude
Prelude>
```

If not: check `/tmp/ghci-err.txt` for errors.

---

## Step 3: Critical Problem — stdin EOF

**Discovery:** When stdin is redirected from a regular file (`< /tmp/ghci-in.txt`), `cabal repl` reads it, hits EOF, and exits immediately.

This breaks the file-based protocol entirely. The process doesn't stay alive to receive queries.

**Solutions to test:**
- Option A: Named pipes (FIFOs) — don't have EOF
- Option B: `tail -f` on input file — keeps stdin stream open indefinitely

---

## Step 3a: Named Pipe (FIFO) Approach

**Goal:** Use a named pipe for stdin so the process doesn't see EOF.

**Tasks:**
- [ ] Clean up previous files:
  ```bash
  rm -f /tmp/ghci-*.txt /tmp/ghci-in
  pkill -f "cabal repl"
  ```
- [ ] Create a named pipe for stdin:
  ```bash
  mkfifo /tmp/ghci-in
  touch /tmp/ghci-out.txt /tmp/ghci-err.txt
  ```
- [ ] Spawn cabal repl with the FIFO:
  ```bash
  export PATH="$HOME/.ghcup/bin:$PATH"
  cd ~/repos/hyp
  cabal repl < /tmp/ghci-in > /tmp/ghci-out.txt 2> /tmp/ghci-err.txt &
  sleep 3
  ```
- [ ] Verify process is still running (should not have exited):
  ```bash
  ps aux | grep "cabal repl" | grep -v grep
  ```
- [ ] Send a query:
  ```bash
  echo ":t id" > /tmp/ghci-in
  sleep 0.2
  cat /tmp/ghci-out.txt | tail -5
  ```
- [ ] Send another query (verify process stayed alive):
  ```bash
  echo ":t map" > /tmp/ghci-in
  sleep 0.2
  cat /tmp/ghci-out.txt | tail -5
  ```

**Expected behavior:**
- Process stays alive after first query
- Second query is processed
- Responses appear in `/tmp/ghci-out.txt`
- Pattern `::` found in responses

**Document:**
- Did the process stay alive? (check ps)
- Did both queries get answered?
- Any timing issues?
- How does FIFO behave vs regular file?

---

## Step 3b: tail -f Approach (Alternative)

**Goal:** Keep stdin stream alive by piping `tail -f` on the input file.

**Tasks:**
- [ ] Clean up from previous test:
  ```bash
  pkill -f "cabal repl"
  rm -f /tmp/ghci-*.txt /tmp/ghci-in
  touch /tmp/ghci-in.txt /tmp/ghci-out.txt /tmp/ghci-err.txt
  ```
- [ ] Spawn cabal repl with `tail -f` for stdin:
  ```bash
  export PATH="$HOME/.ghcup/bin:$PATH"
  cd ~/repos/hyp
  tail -f /tmp/ghci-in.txt | cabal repl > /tmp/ghci-out.txt 2> /tmp/ghci-err.txt &
  sleep 3
  ```
- [ ] Verify process is still running:
  ```bash
  ps aux | grep "cabal repl" | grep -v grep
  ps aux | grep "tail -f" | grep -v grep
  ```
- [ ] Send a query (append to file):
  ```bash
  echo ":t id" >> /tmp/ghci-in.txt
  sleep 0.2
  cat /tmp/ghci-out.txt | tail -5
  ```
- [ ] Send another query:
  ```bash
  echo ":t map" >> /tmp/ghci-in.txt
  sleep 0.2
  cat /tmp/ghci-out.txt | tail -5
  ```

**Expected behavior:**
- Both `tail -f` and `cabal repl` processes stay alive
- Queries get answered
- Responses in `/tmp/ghci-out.txt`

**Document:**
- Did both processes stay running?
- Did queries arrive and get answered?
- How does this compare to FIFO?
- Any differences in timing or output format?

---

## Step 4: Compare Approaches

**After testing both:**
- [ ] Document which approach worked best
- [ ] Note any advantages/disadvantages of each
- [ ] Pick one for further testing

**Questions:**
- Which felt more reliable?
- Which was easier to set up?
- Any edge cases (process hangs, delayed responses, etc.)?

---

## Step 5: Query `:k Bool` (kind query)

**Goal:** Test a different query type to verify generality.

**Tasks:**
- [ ] Write query:
  ```bash
  echo ":k Bool" >> /tmp/ghci-in.txt
  ```
- [ ] Wait 100ms
- [ ] Read response, search for pattern: `*` or `Type` (kind marker)
- [ ] Extract response

**Expected output:**
```
:k Bool
Bool :: Type
```

Or (GHC < 9.0):
```
Bool :: *
```

**Document:**
- Did pattern matching work for a different query?
- Are kind responses noisier/cleaner than type responses?

---

## Step 6: Query `:i foldr` (info query)

**Goal:** Test info queries (more complex responses).

**Tasks:**
- [ ] Write query:
  ```bash
  echo ":i foldr" >> /tmp/ghci-in.txt
  ```
- [ ] Wait 150ms (info responses are longer)
- [ ] Read response, search for pattern: `::` or `defined in`
- [ ] Extract first 3 lines of response

**Expected output:**
```
foldr :: (a -> b -> b) -> b -> [a] -> b
	-- Defined in 'Prelude'
```

**Document:**
- Did we get the full definition?
- Did polling time (150ms) work?
- Any truncation or weirdness?

---

## Step 7: Stress test — rapid queries

**Goal:** Send multiple queries in sequence, verify polling handles backpressure.

**Tasks:**
- [ ] Write 3 queries in quick succession:
  ```bash
  echo ":t map" >> /tmp/ghci-in.txt
  sleep 0.05
  echo ":t filter" >> /tmp/ghci-in.txt
  sleep 0.05
  echo ":t foldl" >> /tmp/ghci-in.txt
  ```
- [ ] Wait 500ms
- [ ] Read `/tmp/ghci-out.txt`, count how many type signatures appear
- [ ] Verify all 3 responses are in the output (not mixed up)

**Expected behavior:**
- All 3 queries answered
- Responses in order
- No cross-talk

**Document:**
- Did all 3 queries get answered?
- Were responses distinguishable?
- Any lost queries?

---

## Step 8: Cleanup & Protocol Summary

**Tasks:**
- [ ] Kill the cabal repl process:
  ```bash
  pkill -f "cabal repl"
  ```
- [ ] Verify it's dead:
  ```bash
  ps aux | grep cabal
  ```

**Document:**
Write a summary to memory/YYYY-MM-DD.md:
- **What worked:** Which queries succeeded, which patterns worked
- **Timing:** How long to wait for responses? (100ms, 150ms, 500ms?)
- **Polling strategy:** Which pattern-matching approach was most reliable?
- **Gotchas:** Anything unexpected? (echo behavior, timing, output format)
- **Next step decision:** Ready to build a mock-repl test? Ready to write a library?

---

## Verification Checklist

Before marking this ✓:
- [ ] **Critical problem identified:** stdin EOF kills process with regular file redirect
- [ ] **Named pipe (FIFO) tested:** process stays alive, queries answered
- [ ] **tail -f approach tested:** process stays alive, queries answered
- [ ] **Approach chosen:** document which solution will be used going forward
- [ ] All 6 query types tested against **real cabal repl** (using chosen approach)
- [ ] Responses captured and pattern-matched
- [ ] Timing for polling documented
- [ ] At least one stress test completed
- [ ] Summary written to memory/YYYY-MM-DD.md
- [ ] **No assumptions — everything verified against actual output**

---

## If It Breaks

**Process:**
1. Stop. Don't continue.
2. Capture the exact error/output to memory/YYYY-MM-DD.md
3. Ask: What did we expect? What did we get? Why the gap?
4. Iterate (adjust polling time, change query type, try the other approach, etc.)

**Don't assume.** Test.

**Known issue to watch:**
- If process exits immediately after spawning, check if stdin is hitting EOF (regular file redirect problem). Try FIFO or tail -f.

---

## Next After This

Once verified:
- Option A: Implement mock-repl simulator and test protocol against it
- Option B: Start wrapping protocol into a Haskell library (startRepl, queryRepl)
- Option C: Both in parallel

**Tony's call.** But don't move forward until this card is ✓.

