# system-process-exploration ⟜ what GHCi told us

Queried System.Process API via repl. Got the essential signatures.

## createProcess signature

```haskell
createProcess :: CreateProcess -> IO (Maybe Handle, Maybe Handle, Maybe Handle, ProcessHandle)
```

Takes a `CreateProcess` record.
Returns a tuple of 4 values in IO:
1. `Maybe Handle` — stdin (optional)
2. `Maybe Handle` — stdout (optional)
3. `Maybe Handle` — stderr (optional)
4. `ProcessHandle` — the running process handle

## key types

- **CreateProcess** — A record type that describes how to spawn a process (command, cwd, env, stdin/stdout/stderr redirection, etc.)
- **Handle** — System.IO.Handle, a reference to an open file
- **ProcessHandle** — A reference to a running process (can check exit code, kill, wait, etc.)

## what we need to know

For `startRepl`:

1. We need to create `CreateProcess` record with:
   - `cmdspec` set to spawn "cabal repl"
   - `cwd` set to the project directory
   - `std_in` set to read from a file handle
   - `std_out` set to write to a file handle
   - `std_err` set to write to a file handle

2. Open files with `openFile`:
   - `/tmp/ghci-in.txt` in `ReadMode`
   - `/tmp/ghci-out.txt` in `WriteMode`
   - `/tmp/ghci-err.txt` in `WriteMode`

3. Pass those handles to `createProcess`

4. Return the `ProcessHandle` (and maybe keep the file handles open)

## next questions (if needed)

- What's the exact syntax for `CreateProcess` record?
- Do we need `shell "cabal repl"` or `RawCommand`?
- How do we handle the `tail -f` behavior? (keep input file open, reading growing content)
- What's `getProcessExitCode`? (check if process is still running)

## bash implementation reference

Working version that this should replicate:

```bash
(tail -f /tmp/ghci-in.txt 2>/dev/null) | cabal repl > /tmp/ghci-out.txt 2> /tmp/ghci-err.txt &
```

This pipes `tail -f` (continuous input) to `cabal repl`, capturing output. In Haskell, we wire handles instead.
