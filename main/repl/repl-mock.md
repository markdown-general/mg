# repl-mock ⟜ test double simulating GHCi

Simulates a GHCi REPL for testing the query protocol before running real cabal repl.

◊ ⊢ simulate GHCi for protocol testing ⊣
  ⟜ read queries from `/tmp/ghci-in.txt`
  ⟜ look up answers in knowledge base (e.g., Hyp.hs types)
  ⟜ respond based on query type:
    - `:t Expression` → type signature
    - `:k Type` → kind signature
    - `:i Name` → info (definition, instances)
    - `import Module` → acknowledge with `Loaded.`
    - Unknown → `error: not in scope`
  ⟜ write responses to `/tmp/ghci-out.txt` (with prompt and answer)
  ⟜ continue processing until killed

## purpose

Proves the file-based protocol works before running real cabal repl. Mock reads queries, responds from a knowledge base, and continues running. Uses the same communication files as the real backend (only the responder changes).

## next

Once mock-repl works, swap it with real cabal repl via repl-startup. Same queries, same protocol, different backend.
