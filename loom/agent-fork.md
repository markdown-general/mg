# agent-fork: Haskell Agents Forking Sessions

**Status**: Exploratory pair-programming session  
**Date**: March 8, 2026  
**Focus**: Placing a fellow session in the harness, chatting carefully, and expanding fork capability

---

## Landscape Reading

### Three Pillars of Understanding

**1. markdown-general** (`~/mg/`)  
Complete cartography of Pi's `/fork` mechanism (JavaScript/TypeScript side). Key insight:
- **Fork creates new session files** with complete conversation history up to a point
- **Preserves parentage** via JSONL format
- Two branches: fork from first message (empty session + parent ref) vs. later message (copy entries from root to fork point)
- Immutable original, traceable branch, efficient append-only file structure

**2. buff-haskell** (`buff/haskell.md`)  
Strategic context: agent-fork is **foundational for multi-agent coordination in Haskell development**
- Named pipes (FIFO) for decoupled I/O (proven in grepl)
- Agentic documentation philosophy: design choices matter in agent contexts
- GHC 9.14 ecosystem with 35+ interdependent libraries

**3. loom/fork.md**  
The missing piece: **how fork enables parallel sub-agents**
- Fork + parallel variations: run multiple branches with same context but different behaviors
- Example: "earnest", "light-hearted", "professional" responses from same conversation point
- Power: branching + parallelization for coordinated multi-agent exploration

### Current State of agent-fork (Haskell)

✓ Structurally complete (named pipes, process I/O, haddocks)  
✗ Contextually sparse (no forking semantics, no session management, no JSONL awareness)

The readme has **words but no narrative** about forking in agentic context.

---

## Emerging Questions

1. **Process vs. Semantics Level**  
   Should `agent-fork` stay at the process level (just managing Pi's I/O)?  
   Or should it understand **JSONL session trees** and fork points?

2. **Agent Coordination Mechanism**  
   How do agents in Haskell coordinate?
   - Reading session files and parsing history?
   - Sharing a session FIFO and reading branched contexts?
   - Building decision trees via parallel forks?

3. **Narrative Reorientation**  
   What changes if we shift from **"How to wrap pi as a subprocess"** to **"How Haskell agents branch and parallelize using Pi sessions"**?

---

## Design Principle

> We spoof the JSONL behavior. We replicate what Pi does on the JSONL side in managing sessions and provide a seamless experience for the Pi IO routines we use.
>
> **agent-fork owns all JSONL interaction beyond Pi IO effects.**

This is the major intersection: **Pi handles agent I/O effects; agent-fork handles session state and branching semantics.**

---

## The Flow: Harness → Chat → Fork → Test → Prompt → Response

### Phase 1: Place a Fellow Session in the Harness

What does "placing a session in the harness" mean?
- Load an existing JSONL session file
- Maintain it as an open, readable resource
- Prepare it for interaction and forking

### Phase 2: Chat Carefully with the Session

- Send queries through Pi's I/O
- Read responses
- Build interaction history (new entries to JSONL)
- Track state: current leaf, parentage, branching points

### Phase 3: Expand Fork Capability

- Identify fork points in the session tree
- Create new branches with semantic branching (not just file copy)
- Support parallel agent coordination via forked contexts

### Phase 4: Nail What It Is to Fork (Test)

Define the semantics rigorously:
- What is a fork point?
- What does "copying history" mean in JSONL terms?
- How do we track parentage?

### Phase 5: Nail Prompting the Fork

How do we construct a prompt that:
- Acknowledges the branching point?
- Provides full context from the root to the fork point?
- Signals to the agent what conversation state they're in?

### Phase 6: Nail What the Response Was

How do we:
- Capture the response in JSONL format?
- Link it to the fork point via parentId?
- Preserve it for later analysis or further branching?

---

## Terminology: Definitions

### Core Terms

**Session**  
A JSONL file representing a conversation history, structured as an append-only log of entries.
- Path: `~/.pi/agent/sessions/{sessionId}/session.jsonl`
- Entry types: message, compaction, label, etc.
- Has a header (metadata) and body (entries)

**Entry**  
A single line in the JSONL file, one of:
- `message`: LLM interaction (user, assistant, tool)
- `compaction`: Compressed history (optimization)
- `label`: User-defined annotation
- Other: custom entry types

**Fork**  
Creation of a new session file containing conversation history up to a selected point, with a `parentSession` reference to the source.
- Immutable: original session never modified
- Traceable: metadata maintains lineage
- Efficient: append-only structure preserved

**Fork Point**  
The entry ID and message in the conversation where a fork decision is made.
- Can be the first message (creates empty session with parent ref)
- Or a later message (requires copying entries from root to fork point)

**Leaf (Session Leaf)**  
The current position in a session tree; the ID of the most recent entry.
- Determines where new entries are appended
- Critical for identifying "current context" when forking

**Branching**  
When multiple sessions share a `parentSession` ancestor, they form a tree structure.
- In-place branching: Pi's `/tree` command (uses id/parentId)
- Fork branching: cross-file branching (uses parentSession field)

**Parentage**  
The metadata chain linking a forked session back to its source(s).
- `parentSession`: path to source session file
- `id` / `parentId`: tree navigation within a session

**JSONL (JSON Lines)**  
Text format where each line is a valid JSON object, one entry per line.
- Append-only: new interactions added as new lines
- Parseable incrementally: read streaming without loading entire file
- Immutable history: old lines never modified

---

## JSONL in Haskell: Search Card

### Question
**What's the fastest way to read JSONL in Haskell?**

Common solutions and trade-offs:

#### Option A: aeson + bytestring streaming
**Pros:**
- Industry standard (aeson is de facto JSON parser in Haskell)
- Streaming support via pipes/conduit
- Type-safe: use FromJSON instances
- Well-documented

**Cons:**
- Decoding overhead for each line
- Requires defining data types for each entry type

**Pattern:**
```haskell
import qualified Data.ByteString.Streaming.Char8 as Q
import Data.Aeson (FromJSON, decode)

readJsonLines :: (FromJSON a) => FilePath -> IO [a]
readJsonLines path = do
  contents <- readFile path
  pure $ catMaybes $ map (decode . fromString) $ lines contents
```

#### Option B: Data.Csv.Streaming (for simpler CSV-like JSONL)
**Pros:**
- Lightweight
- Streaming support
- Fast for simple schemas

**Cons:**
- Not idiomatic for JSON
- Requires manual parsing

#### Option C: Megaparsec + bytestring
**Pros:**
- Custom parsing logic
- Full control over parsing behavior
- Fast for specific schemas

**Cons:**
- More boilerplate
- Requires writing parser combinators

#### Option D: attoparsec + bytestring
**Pros:**
- Designed for fast incremental parsing
- Streaming support
- Lower overhead than aeson for some use cases

**Cons:**
- More manual work than aeson
- Less type safety

### Hypothesis
**For agent-fork, we want: aeson + streaming**

Rationale:
- Session entries are polymorphic (message, compaction, label, custom)
- Streaming is essential for large sessions
- Type safety matters for correctness (agent coordination relies on correct parsing)
- Standard library ecosystem is mature

#### Research Path
- [ ] Benchmark aeson streaming vs. attoparsec for typical session sizes (1K–100K entries)
- [ ] Prototype with Data.Aeson + pipes or conduit
- [ ] Define FromJSON instances for JSONL entry types
- [ ] Test incremental reading (read first N entries, then append)
- [ ] Explore error recovery (skip malformed lines? fail fast?)

---

## Architecture Simplification

**Old Model**: Pi subprocess + agent-fork state mgmt
**New Model**: ollama-haskell direct + agent-fork state mgmt

This means agent-fork focuses entirely on:
- Reading/writing JSONL session files
- Managing session tree (parentage, forking)
- Bridging ollama-haskell responses to JSONL format
- No subprocess, no named pipes

---

## Type Sketch: Foundations

### Session Model

```haskell
-- | A session in the Pi agent system
data Session = Session
  { sessionId :: SessionId
  , sessionFile :: FilePath
  , header :: SessionHeader
  , entries :: [Entry]  -- or streaming version
  , leaf :: EntryId     -- current position
  }

-- | Session metadata (from JSONL header)
data SessionHeader = SessionHeader
  { sessionIdField :: SessionId
  , parentSession :: Maybe FilePath  -- fork lineage
  , createdAt :: Timestamp
  , model :: String  -- "claude-3.5-sonnet", etc.
  }

-- | An entry in the JSONL log
data Entry
  = MessageEntry Message
  | CompactionEntry Compaction
  | LabelEntry Label
  deriving (Show, Eq, FromJSON, ToJSON)

-- | A message in the conversation
data Message = Message
  { id :: EntryId
  , parentId :: Maybe EntryId
  , timestamp :: Timestamp
  , role :: Role            -- User | Assistant | Tool
  , content :: Content      -- Text | ToolCall | ToolResult
  }
  deriving (Show, Eq, FromJSON, ToJSON)

-- | Role in conversation
data Role = User | Assistant | Tool
  deriving (Show, Eq, Ord, FromJSON, ToJSON)

-- | Content types
data Content
  = TextContent Text
  | ToolCall { toolName :: String, toolInput :: Value }
  | ToolResult { result :: Value }
  deriving (Show, Eq, FromJSON, ToJSON)

-- | Unique identifiers
newtype SessionId = SessionId { unSessionId :: String }
  deriving (Show, Eq, Ord)

newtype EntryId = EntryId { unEntryId :: String }
  deriving (Show, Eq, Ord)

newtype Timestamp = Timestamp { unTimestamp :: String }
  deriving (Show, Eq, Ord)
```

### Forking Model

```haskell
-- | Fork point specification: where to branch from
data ForkPoint = ForkPoint
  { forkSessionFile :: FilePath
  , forkFromEntry :: EntryId  -- the message we're branching at
  }

-- | Result of a fork operation
data ForkedSession = ForkedSession
  { originalSession :: FilePath
  , newSessionFile :: FilePath
  , newSessionId :: SessionId
  , entriesCopied :: Int        -- how many entries were transferred
  , parentageChain :: [SessionId]  -- full lineage
  }

-- | Fork semantics
fork :: ForkPoint -> IO ForkedSession
fork fp = do
  -- 1. Load source session
  source <- loadSession (forkSessionFile fp)
  
  -- 2. Determine fork strategy (empty vs. copy)
  let entryToForkFrom = lookupEntry (forkFromEntry fp) (entries source)
  
  -- 3. Create new session file with appropriate entries
  newSession <- case parentId entryToForkFrom of
    Nothing -> newEmptySession { parentSession = Just (forkSessionFile fp) }
    Just pid -> copyEntriesUpTo pid source
  
  -- 4. Write session file
  writeSessionFile newSession
  
  -- 5. Return metadata
  pure $ ForkedSession
    { originalSession = forkSessionFile fp
    , newSessionFile = sessionFile newSession
    , newSessionId = sessionId newSession
    , entriesCopied = length (entries newSession)
    , parentageChain = traceParentage newSession
    }
```

### Agent Coordination Model

```haskell
-- | An agent in the multi-agent system
data Agent = Agent
  { agentId :: AgentId
  , currentSession :: Session
  , capabilities :: [Capability]
  }

newtype AgentId = AgentId { unAgentId :: String }

-- | What can an agent do?
data Capability
  = CanRead       -- read sessions
  | CanWrite      -- append to sessions
  | CanFork       -- create forks
  | CanParallelize  -- run multiple forks in parallel
  deriving (Show, Eq)

-- | Multi-agent coordination: parallel fork execution
data ParallelFork = ParallelFork
  { baseSession :: FilePath
  , forkPoint :: EntryId
  , agents :: [Agent]
  , branchConfigs :: [BranchConfig]  -- e.g., tone, strategy, instruction
  }

data BranchConfig = BranchConfig
  { branchName :: String
  , branchInstruction :: Text
  , agentOverrides :: Maybe AgentConfig
  }

-- | Run multiple agents in parallel from a fork point
runParallelForks :: ParallelFork -> IO [ForkedSession]
runParallelForks pf = do
  let base = baseSession pf
  forkedBases <- forM (branchConfigs pf) $ \cfg ->
    fork $ ForkPoint { forkSessionFile = base, forkFromEntry = forkPoint pf }
  
  results <- concurrently forM forkedBases $ \forked -> do
    let agent = selectAgent (agents pf)
    chatWithAgent agent (newSessionFile forked) (branchInstruction cfg)
  
  pure results
```

---

## Intersection of Concerns

### What ollama-haskell Does (LLM I/O)

```haskell
chat :: ChatOps -> Maybe OllamaConfig -> IO (Either OllamaError ChatResponse)
```

Returns:
```haskell
data ChatResponse = ChatResponse
  { message :: Maybe Message          -- role, content, tool_calls
  , model :: Text
  , done :: Bool
  , loadDuration, evalDuration :: Maybe Integer
  , ...
  }
```

**Responsibility**: Call local Ollama, get typed responses

### What agent-fork Does (Session State & Branching)

```haskell
data Session = Session
  { sessionId :: SessionId
  , sessionFile :: FilePath
  , entries :: [JsonlEntry]
  , leaf :: EntryId
  }

data JsonlEntry = JsonlEntry
  { entryType :: EntryType
  , id :: EntryId
  , parentId :: Maybe EntryId
  , timestamp :: String
  , payload :: Value  -- Opaque JSON
  }
```

**Responsibility**: 
- Load/save JSONL session files
- Track conversation tree (id/parentId)
- Manage forking (parentSession field)
- Build token index for semantic lookup

### Integration Point: The Bridge

```haskell
-- ollama-haskell ChatResponse → JSONL JsonlEntry
ollamaToJsonl :: ChatResponse -> IO JsonlEntry
ollamaToJsonl resp = do
  eid <- generateId
  now <- getCurrentTime
  pure JsonlEntry
    { entryType = MessageEntry
    , id = eid
    , parentId = Nothing  -- Set by session management
    , timestamp = formatTime now
    , payload = object
        [ "message" .= Message
            { role = role (message resp)
            , content = [TextBlock (content msg)]
            , timestamp = epochMillis now
            }
        ]
    }
```

**Flow**:
1. Call `chat ops config` (ollama-haskell)
2. Get `ChatResponse`
3. Convert with `ollamaToJsonl`
4. `appendToSession sessionFile entry`
5. Update session tree (parentage, leaf, fork points)
6. Return updated Session


---

## Major Pivot: ollama-haskell as Core Backend

**User Question**: Does ollama-haskell do everything we need, including the Pi bit?

**Answer**: YES. Completely different architecture possible.

### What Changed

Instead of:
```
user → Pi (subprocess) → named pipes → JSONL state mgmt
```

Use:
```
user → ollama-haskell (direct HTTP) → convert to JSONL → state mgmt
```

**Key Discovery**: ollama-haskell provides:
- ✓ Chat with multi-turn messages
- ✓ Native tool/function calling
- ✓ Streaming support
- ✓ Image support
- ✓ Structured output (JSON)
- ✓ Lifecycle hooks
- ✓ Retry logic with exponential backoff
- ✓ Full type safety

**Implication**: agent-fork becomes purely about JSONL session management + forking.

### Dependency Exploration Cards

Three cards created for key dependencies, using scripths to experiment on real data:

1. **[loom/aeson.md](aeson.md)**
   - Polymorphic JSON entry decoding
   - Lazy vs. strict parsing
   - Token indexing for semantic lookup
   - Real session file baseline

2. **[loom/bytestring.md](bytestring.md)**
   - Lazy vs. Strict ByteString trade-offs
   - File I/O patterns (streaming vs. bulk)
   - Memory profiling on real data
   - Chunked reading for large files

3. **[loom/ollama.md](ollama.md)** ⭐ UPDATED
   - Complete API reference (not just speculation)
   - 5 runnable experiments
   - Architecture decision: **Use ollama-haskell directly**
   - Type bridge: `ChatResponse → JsonlEntry`

**Test Location**: `~/haskell/agent-fork/test/experiments/`

---

## Next Moves (No Ordering, Exploratory)

- **Run aeson experiments**: Load real session file, decode entries, measure performance
- **Run bytestring experiments**: Compare lazy/strict approaches, profile memory
- **Session Model**: Flesh out Entry types from actual Pi session files (use aeson output)
- **Fork Logic**: Implement the two branches (empty vs. copy) with proper parentage tracking
- **Prompting Strategy**: How do we tell the agent "you're in a fork from here"?
- **Parallel Coordination**: How do we keep parallel agents from interfering? (file locking? separate FIFOs?)
- **Testing**: Create a test harness with a real Pi session, fork it, chat with it
- **Types as Specification**: Make types so clear they're self-documenting for agents
- **Install ollama**: Set up local LLM for future experiments

---

## Artifacts So Far

- **buff/haskell.md** — Context: GHC ecosystem, grepl patterns, strategic vision
- **loom/fork.md** — Pi's fork mechanism (JavaScript reference)
- **loom/agent-fork.md** (this file) — Haskell design, terminology, type sketches
- **loom/aeson.md** — JSON parsing experiments (polymorphic entries, token indexing)
- **loom/bytestring.md** — I/O patterns (lazy vs. strict, streaming vs. static)
- **loom/ollama.md** — Local LLM option (future exploration, reserved name)
- **~/haskell/agent-fork/** — Implementation target (structure ready, test/ directory created)
- **Real session file** — `/Users/tonyday567/.pi/agent/sessions/--Users-tonyday567-repos-pi-mono--/2026-02-03T18-04-45-234Z_467948cf-b477-4628-95be-c1d52178f004.jsonl` (used in all experiments)

