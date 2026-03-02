# repl-startup ⟜ spawn cabal repl process with file-based stdio

Spawn `cabal repl` in a Haskell project. Point stdin, stdout, stderr at temp files. Process runs and stays alive.

◊ ⊢ spawn cabal repl with file-based stdio ⊣
  ⟜ open `/tmp/ghci-in.txt` for stdin
  ⟜ open `/tmp/ghci-out.txt` for stdout
  ⟜ open `/tmp/ghci-err.txt` for stderr
  ⟜ spawn `cabal repl` in target project directory
  ⟜ return `ProcessHandle` for monitoring
  ⟜ process persists until explicitly killed

## result

Three files for communication:
- `/tmp/ghci-in.txt` — queries written here arrive at cabal repl stdin
- `/tmp/ghci-out.txt` — cabal repl stdout appears here
- `/tmp/ghci-err.txt` — cabal repl stderr appears here

## requirements

- Haskell project with working `cabal repl`
- GHCi ready to accept queries
- `/tmp/` writable

## function signature

```haskell
startRepl :: FilePath -> IO ProcessHandle
```

Takes a project directory, spawns the process, returns a handle for monitoring.

## signals

- Process alive: `getProcessExitCode` returns `Nothing`
- Process dead: `getProcessExitCode` returns `Just code`
- Output in files: read them anytime

## next

Once running, observe queries written to `/tmp/ghci-in.txt` arriving at stdin, and responses in `/tmp/ghci-out.txt`. Protocol works with any reader respecting file-based message passing.
