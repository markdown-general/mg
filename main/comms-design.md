# comms-design ⟜ CLI design for browser-comms wrapper

In-flight design for the `comms` Haskell CLI tool. Not yet built. Captures decisions and shape from session ending 2026-03-04.

---

## Purpose

Hide browser complexity from agents. Provide a clean CLI at conversation cadence — the same level as operator instructions. Agents call `comms`, never touch Chrome, CDP, puppeteer, or DOM selectors.

---

## API Shape

```
comms open grok
comms open claude
comms write grok "Your message here"
comms read grok                    -- last response
comms read grok --full             -- full conversation
comms read grok --tail 5           -- last 5 turns
comms close grok
comms record grok                  -- store conversation for static analysis
```

"grok" and "claude" are **agent names** — named configs covering URL, input mechanics, and quirks. Not just a URL.

---

## Key Design Decisions

### Haskell + process library (grepl pattern)

Model on `~/haskell/grepl/`. Grepl uses:
- `process` library to spawn/manage subprocesses
- Named FIFOs for IPC
- `optparse-applicative` for CLI
- Config as data (`ChannelConfig`) with named instances per target

`comms` follows the same pattern:
- Haskell owns CLI, config, conversation storage, sync/async
- Node.js CDP script owns browser connection, DOM interaction, message extraction
- Clean split: we own the Haskell layer end-to-end

### AgentConfig as data

```haskell
data AgentConfig = AgentConfig
  { agentName       :: String      -- "grok", "claude"
  , agentUrl        :: String      -- "https://grok.com"
  , stdinFifo       :: FilePath    -- /tmp/comms-grok-in
  , conversationLog :: FilePath    -- ~/mg/loom/grok-session.jsonl
  }
```

Named instances for each supported system. Adding a new system = adding a new `AgentConfig` value.

### Command ADT

```haskell
data Command
  = Open   AgentName
  | Close  AgentName
  | Write  AgentName Text
  | Read   AgentName ReadMode
  | Record AgentName

data ReadMode = Last | Full | Tail Int
```

### Async/sync

- Sync: `comms write grok "message"` blocks until response, prints to stdout
- Async: `comms write grok "message" --async` writes response to conversation log, returns immediately
- Agents can use async for fire-and-forget, sync for interactive turns

### Conversation storage

All conversations stored as JSONL (like pi sessions) or markdown in `~/mg/loom/`. Enables static analysis — same pattern as reading yin's session history. `comms record grok` starts/stops a named recording session.

---

## Architecture

```
comms (Haskell CLI)
  ↓ optparse-applicative
  ↓ AgentConfig lookup
  ↓ process library → Node.js CDP script (browser-tools/)
                          ↓ puppeteer-core
                          ↓ Chrome :9222 (shared, persistent)
                          ↓ claude.ai / grok tab
  ↓ response via stdout/FIFO
  ↓ append to conversation log
  → stdout to caller
```

### Shared Chrome model

Chrome runs independently (`browser-start.js --profile`), persists on :9222. Multiple agents connect via CDP without ownership conflicts. Tab isolation handles concurrency. No daemon needed — Chrome is the daemon.

### Node.js layer stays thin

The Node.js CDP scripts are the implementation detail. They handle:
- connect to Chrome :9222
- find/open target tab
- paste message (not type — avoid newline-triggers-send)
- wait for streaming response
- extract conversation

Per-system quirks (TipTap input, message-bubble selector, etc.) live in the Node.js layer, invisible to comms callers. See `~/mg/buff/browser-comms.md` for the full quirks reference.

---

## Project Location

`~/haskell/comms/` — new Haskell project, same structure as grepl:

```
comms/
  comms.cabal
  src/Comms.hs          -- library: AgentConfig, channel management
  src/Comms/Agents.hs   -- named agent configs (grok, claude, ...)
  app/comms.hs          -- executable: optparse-applicative CLI
  scripts/              -- Node.js CDP scripts (or symlink to pi-skills)
```

---

## Not Yet Decided

- FIFO vs direct subprocess stdout for response passing
- JSONL vs markdown for conversation log format
- Whether `record` is a mode flag or a separate command
- File upload via comms (context priming — currently manual)
- How comms integrates with pi as an allowed-tool

---

## References

- `~/mg/buff/browser-comms.md` ⟜ Browser mechanics, per-system selectors, quirks
- `~/mg/side/browser-aria.md` ⟜ ARIA snapshot/ref system (future layer)
- `~/haskell/grepl/` ⟜ Template project (process + optparse-applicative pattern)
- `~/mg/loom/agent-browser-repo.md` ⟜ Field agent report on agent-browser (evaluated, not adopted)
- `~/other/pi-skills/browser-tools/` ⟜ Existing Node.js CDP scripts
