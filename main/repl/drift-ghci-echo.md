# drift: GHCi echo behavior with piped input

GHCi behaves differently depending on how input arrives. The file-based protocol handles this transparently.

## the difference

**Mock-repl (terminal behavior):** Echoes commands back.
```
Prelude> :t fmap
fmap :: Functor f => (a -> b) -> f a -> f b
```

**Real cabal repl (piped input):** Does NOT echo commands. Shows only response.
```
ghci> fmap :: Functor f => (a -> b) -> f a -> f b
```

## implication for query protocol

⊢ adapt search strategy to backend ⊣
  - Initial approach: search for both query echo AND expected pattern
    ```bash
    grep "$QUERY" "$OUTPUT" && grep "$EXPECT" "$OUTPUT"
    ```
  - Revised approach: search for expected pattern only
    ```bash
    grep "$EXPECT" "$OUTPUT"
    ```
  ⟜ works because queries are sent sequentially
  ⟜ if we see `fmap ::`, we know it's a response to a type query
  ⟜ no ambiguity—same protocol, different search

## why this matters

The protocol is **robust to backend differences**. Mock and real cabal repl work with the same query code—only the search pattern changes. This shows the file-based approach absorbs environmental variation without requiring protocol changes.

## next

- Protocol verified with both mock and real backends
- Ready to wrap into Haskell library (startRepl, queryRepl)
- File-based message passing is the foundation
