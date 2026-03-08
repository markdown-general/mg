# yarn-agent ⟜ Atomic Operations Reference

This document describes the core atoms of session-based agent forking and prompting, as implemented in TypeScript via pi-mono.

---

## The Five Atoms

### ATOM 1: Locate Current Session

**What it does:** Find the session file that represents "me now."

**TypeScript code:**
```typescript
const currentSessionPath = process.env.PI_SESSION || 
  SessionManager.findMostRecentSession(defaultSessionDir);
```

**Inputs:**
- Environment variable `PI_SESSION` (if set)
- Or: scan `~/.pi/agent/sessions/` for most recent `.jsonl` file

**Outputs:**
- `currentSessionPath: string` — Absolute path to a valid session JSONL file

**Why it matters:**
- Sessions are the coordinate system; every agent needs to know where it is
- Can be passed via env var (explicit) or discovered (implicit)
- Most recent = "where I last worked"

**Design notes:**
- SessionManager validates file format (checks header type + id)
- Returns null if no valid session found (error case)
- Haskell equivalent: Read env var or scan directory with timestamp sort

---

### ATOM 2: Fork to Child Session

**What it does:** Create a new session file as child of current session, with parent linkage.

**TypeScript code:**
```typescript
const childManager = SessionManager.forkFrom(
  parentSessionPath,    // Source session file
  process.cwd(),        // Working directory for new session
  sessionDir            // Directory where child lives
);
```

**Inputs:**
- `parentSessionPath: string` — Path to parent session JSONL
- `targetCwd: string` — Working directory (for session header)
- `sessionDir: string` — Directory to write child session file

**Outputs:**
- `childManager: SessionManager` — Loaded session manager for the child
- Child session file created at `sessionDir/ISO-TIMESTAMP_UUID.jsonl`
- Parent linkage: child's header has `parentSession: parentSessionPath`

**What happens internally:**
1. Load parent session from disk (all entries)
2. Generate new session ID (UUID)
3. Create new session header with `parentSession` field pointing to parent
4. Copy all parent entries to new file (new IDs, same structure)
5. Set leaf pointer to root (ready to append new work)

**Why it matters:**
- Branching is cheap (copy-on-write via JSONL)
- Lineage is explicit (`parentSession` link)
- Each agent spawn = new session file = isolated work + audit trail

**Design notes:**
- No locking (concurrent forks are safe; each writes to unique file)
- Leaf pointer starts at root of new session (can branch from any parent node)
- Copy happens in memory, then flushed to disk

---

### ATOM 3: Send Prompt to LLM and Collect Response

**What it does:** Stream text from LLM, collect into string.

**TypeScript code:**
```typescript
const model = getModel("anthropic", "claude-haiku-4-5-20250514");
const response: string[] = [];

model.stream(
  [{ role: "user", content: prompt }],
  { systemPrompt: "..." }
).on("text", (text) => response.push(text))
 .on("stop", () => resolve(response.join("")))
 .on("error", (err) => reject(err));
```

**Inputs:**
- `prompt: string` — User message
- `model: string` — Provider + model ID (e.g., "claude-haiku-4-5-20250514")
- `systemPrompt: string` — System context (optional)

**Outputs:**
- `responseText: string` — Complete LLM response

**Event stream:**
- `text` — Fired per token (streaming)
- `stop` — Fired when stream ends
- `error` — Fired on failure

**Why it matters:**
- LLM streaming is event-driven
- Response is collected incrementally
- Agents see output in real-time (not batched)

**Design notes:**
- `getModel()` abstracts provider (Anthropic, OpenAI, etc.)
- Streaming allows token counting and early termination
- Response is just text; structuring happens in next atom

---

### ATOM 4: Append Response to Session as Message Entry

**What it does:** Create a SessionMessageEntry and append to session JSONL.

**TypeScript code:**
```typescript
const entryId = manager.appendMessage({
  role: "assistant",
  content: responseText,
});
```

**Inputs:**
- `manager: SessionManager` — Loaded session
- `message: Message` — `{role: "assistant", content: string}`

**Outputs:**
- `entryId: string` — Unique ID of new entry

**What happens internally:**
1. Generate new entry ID (UUID)
2. Build SessionMessageEntry: `{type: "message", id, parentId, timestamp, message}`
3. `parentId` = current leaf ID (forms tree structure)
4. Append to JSONL file: one line = `JSON.stringify(entry)`
5. Update in-memory `byId` map
6. Move leaf pointer to new entry (optional; depends on use case)

**Why it matters:**
- Sessions are immutable trees; entries never change, only append
- parentId forms the tree topology
- Each append creates a new node in the tree

**Design notes:**
- Leaf pointer tracks "where we are now"
- Can append without moving leaf (creates sibling)
- No file rewrite; pure append (cheap, atomic)

---

### ATOM 5: Read Result from Session

**What it does:** Retrieve an entry from the session by ID and verify it's a message.

**TypeScript code:**
```typescript
const entry = manager.getEntry(entryId);
if (entry.type === "message") {
  const message = (entry as SessionMessageEntry).message;
  console.log(message.content);
}
```

**Inputs:**
- `manager: SessionManager` — Loaded session
- `entryId: string` — ID of entry to retrieve

**Outputs:**
- `entry: SessionEntry` — The entry (various types: message, branch_summary, etc.)
- If message: `message.content` is the text

**What happens internally:**
1. Look up entry ID in in-memory `byId` map
2. Return entry (or null if not found)
3. Type guard: check `entry.type === "message"`
4. Cast to SessionMessageEntry
5. Extract `message` field

**Why it matters:**
- Sessions are the audit trail; you can replay any agent's work
- Random access by ID (O(1) via hash map)
- Type system prevents reading wrong entry types

**Design notes:**
- Entries are immutable once written
- All entries have parentId → can reconstruct full tree path
- Can filter by type (message, branch_summary, compaction, etc.)

---

## The Loop: Fork + Prompt + Append + Read

```
[Agent A]
  │
  ├─ ATOM 1: Locate session → sessionPath
  │
  ├─ ATOM 2: Fork → childManager, new sessionFile
  │   └─ parentSession link: Agent A → Agent B
  │
  ├─ ATOM 3: Prompt LLM → responseText
  │
  ├─ ATOM 4: Append to childManager → entryId
  │   └─ parentId points to last entry in child
  │
  └─ ATOM 5: Read entryId → message.content
      └─ Verify it's there; can replay anytime

[Agent B's session tree]
  root
    │
    ├─ msg-1 (user)
    ├─ msg-2 (assistant)
    └─ msg-3 (assistant) ← entryId points here
```

---

## Haskell Translation Guide

Each atom maps to a Haskell function (via SessionManager equivalent):

| Atom | TypeScript | Haskell sketch |
|------|-----------|-----------------|
| 1 | `locateCurrentSession()` | `findSessionByEnvOrRecent :: IO FilePath` |
| 2 | `SessionManager.forkFrom()` | `forkSession :: FilePath -> FilePath -> IO SessionId` |
| 3 | `model.stream()` | `promptLLM :: LLMModel -> Text -> IO Text` |
| 4 | `manager.appendMessage()` | `appendMessage :: SessionId -> Message -> IO EntryId` |
| 5 | `manager.getEntry()` | `getEntry :: SessionId -> EntryId -> IO SessionEntry` |

### Key Haskell Patterns

**Session as record:**
```haskell
data Session = Session {
  sessionId :: SessionId,
  sessionFile :: FilePath,
  entries :: Map EntryId SessionEntry,
  byParent :: Map (Maybe EntryId) [EntryId],  -- tree structure
  leafId :: Maybe EntryId
}
```

**Forking (STM-safe):**
```haskell
forkSession :: SessionId -> IO SessionId
forkSession parentId = atomically $ do
  parent <- readTVar sessionVar
  let child = Session {
        sessionId = newUUID,
        parentSession = Just (sessionId parent),
        entries = entries parent,  -- copy-on-write
        leafId = Nothing
      }
  -- Write to disk (JSONL)
  -- Return child session ID
```

**Concurrent agents (no race):**
```haskell
-- Multiple agents forking simultaneously
agents <- forConcurrently [1..10] $ \i ->
  forkSession baseSessionId >>= promptAndAppend

-- STM ensures all writes are serializable
-- No two agents write same entry ID
-- All operations atomic w.r.t. session state
```

---

## Testing & Verification

**Round-trip test:**
```typescript
// TypeScript
const manager = SessionManager.open(sessionPath);
const entryId = manager.appendMessage({role: "assistant", content: "test"});
const entry = manager.getEntry(entryId);
assert(entry.message.content === "test");
```

**Verify Haskell implementation matches:**
```haskell
-- Haskell
session <- openSession sessionPath
entryId <- appendMessage session (Message Assistant "test")
entry <- getEntry session entryId
assert (messageContent entry == "test")
```

**Session file inspection (both languages read same JSONL):**
```bash
# Cat the session file
cat ~/.pi/agent/sessions/.../.../uuid.jsonl | jq

# Verify entries are identical whether read by TypeScript or Haskell
```

---

## Why These Five Atoms

1. **Locate**: "Where am I?" — establishes coordinate system
2. **Fork**: "Create new work context" — enables branching
3. **Prompt**: "Get information" — interacts with LLM
4. **Append**: "Record what happened" — immutable log
5. **Read**: "What did we learn?" — audit trail + replay

Together they form the minimal cycle for agent work:
- Sessions as coordinate system (1)
- Isolation via forking (2)
- Thinking via LLM (3)
- Recording via append (4)
- Verification via read (5)

Every more complex operation (forks for multi-agent, forkBy for experimentation) builds on these atoms.
