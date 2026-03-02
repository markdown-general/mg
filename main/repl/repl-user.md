# repl-user ⟜ query pattern for GHCi via files

How to send a query to GHCi and get a reliable answer back.

◊ ⊢ query GHCi via file-based protocol ⊣
  ⟜ write query to `/tmp/ghci-in.txt`
  ⟜ wait (50-500ms, your choice)
  ⟜ read `/tmp/ghci-out.txt`
  ⟜ search for expected response pattern (e.g., `::` for type, `*` for kind)
  ⟜ extract response (matching lines)
  ⟜ validate (does it contain what you expected?)
  ⟜ retry or continue (got it? ask next. not yet? loop or timeout.)

## key insight

**No synchronization overhead.** No markers. No locks. No complex state tracking. Write to file, read from file, search for pattern. Protocol is simple and robust: it doesn't require handshakes or probe responses, just the ability to recognize answers.
