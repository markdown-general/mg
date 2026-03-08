# fork-and-prompt ⟜ Minimal yarn-agent PoC

A working demonstration of the five atomic operations: locate, fork, prompt, append, read.

---

## What It Does

```
You (agent A) are in a session with conversation history.

fork-and-prompt:
  1. Finds your current session file
  2. Creates a child session (forked from you)
  3. Sends a prompt to Claude via pi-ai
  4. Appends Claude's response to the child session
  5. Reads back the response from the session

Result: A new session file with your prompt + Claude's answer, linked to your session.
```

---

## Prerequisites

```bash
# Must have pi-mono built and installed
cd ~/other/pi-mono
yarn install
npm run build

# Must have anthropic API key
export ANTHROPIC_API_KEY=your-key

# Must be in an existing session (or create one)
pi-coding-agent  # Run once to create a session
```

---

## Running It

### Option 1: Explicit session (safest)

```bash
export PI_SESSION=~/.pi/agent/sessions/--Users-tonyday567-mg--/2026-03-07T...uuid.jsonl
tsx ~/mg/tool/fork-and-prompt.ts "What is a planar traced monoidal category?"
```

### Option 2: Auto-discover latest session

```bash
tsx ~/mg/tool/fork-and-prompt.ts "Your prompt here"
```

The script will scan `~/.pi/agent/sessions/` for the most recent session file.

### Option 3: From within pi-coding-agent

Open a pi session, then:
```bash
# In another terminal, with your session running
tsx ~/mg/tool/fork-and-prompt.ts "Explain sessions"
```

---

## Output

```
======================================================================
FORK + PROMPT + READ
======================================================================

[step 1] Locating current session...
[fork] Parent session: ~/.pi/agent/sessions/.../abc-123-uuid.jsonl
[fork] Parent session ID: abc-123-uuid

[step 2] Forking to child session...
[fork] Child session ID: def-456-uuid
[fork] Child session file: ~/.pi/agent/sessions/.../2026-03-07T14-36-00_def-456-uuid.jsonl

[step 3] Prompting LLM...
[prompt] Sending: "What is a planar traced monoidal category?"
A planar traced monoidal category is a categorical structure that... (streaming)

[step 4] Appending response to child session...
[append] Response appended as entry: msg-001

[step 5] Reading result from session...
[read] Successfully read message from session: msg-001
[read] Role: assistant
[read] Content preview: A planar traced monoidal category is...

======================================================================
SUCCESS
======================================================================
Child session: ~/.pi/agent/sessions/.../2026-03-07T14-36-00_def-456-uuid.jsonl
Entry ID: msg-001
```

---

## Verify the Session File

```bash
# Look at the child session file
cat ~/.pi/agent/sessions/.../2026-03-07T14-36-00_def-456-uuid.jsonl | jq

# First line is the header
{"type":"session","version":3,"id":"def-456-uuid",...,"parentSession":"...abc-123-uuid.jsonl"}

# Last lines are your prompt + response
{"type":"message","id":"msg-0","parentId":null,"timestamp":"...","message":{"role":"user","content":"..."}}
{"type":"message","id":"msg-1","parentId":"msg-0","timestamp":"...","message":{"role":"assistant","content":"..."}}
```

---

## How to Teach Haskell Team

1. **Show the atoms** — `yarn-agent-atoms.md` lists what each operation does
2. **Run the PoC** — Show the output above (real LLM response, real session file)
3. **Inspect the file** — Show the JSONL structure
4. **Ask them to translate** — One atom at a time:
   - Read env var + find session file
   - Parse JSONL, fork entries
   - Call LLM (or mock), collect response
   - Append to JSONL
   - Read back entry by ID
5. **Verify** — Haskell implementation reads same session file, produces same structure

---

## Design Notes for Haskell Team

**No mocking.** This uses real:
- pi-mono SessionManager (no shim)
- pi-ai LLM streaming (real Anthropic API)
- Real session files on disk

**Concurrency model:**
- Currently sequential (fork → prompt → append)
- STM version: all agents fork simultaneously, no race (each gets unique ID)
- Session file is append-only (multiple writers possible, each appends to end)

**Session tree structure:**
```
Parent session (ABC)
  │
  └─ Child session (DEF) [parentSession: ABC]
      │
      ├─ msg-0 (copied from parent)
      ├─ msg-1 (copied from parent)
      │
      └─ msg-2 (new, appended by fork-and-prompt)
          └─ parentId: msg-1 (forms tree)
```

**Why this matters for Haskell:**
- Sessions are immutable log files (same format everywhere)
- Forking is copy-on-write (cheap, no coordination)
- Appending is lock-free (each agent appends unique entry)
- Reading is O(1) hash lookup (in-memory map)

---

## Next Steps

Once Haskell team understands the atoms:

1. **Rewrite SessionManager in Haskell** (1400 LOC of TypeScript)
   - Same JSONL format
   - STM for concurrency
   - Can run against same test sessions

2. **Implement fork/forks/forkBy** (CLI layer on top)
   - Uses Haskell SessionManager
   - optparse-applicative for CLI

3. **Verify against pi-mono**
   - Haskell SessionManager reads TypeScript-written sessions
   - TypeScript SessionManager reads Haskell-written sessions
   - Same JSONL round-trip

---

## Troubleshooting

**"No session found"**
```bash
# Create one first
pi-coding-agent
# Quit (Ctrl-D), then try fork-and-prompt
```

**"Module not found"**
```bash
# Rebuild pi-mono
cd ~/other/pi-mono
npm run build
npm link  # or yarn link
```

**"API key error"**
```bash
# Check key
echo $ANTHROPIC_API_KEY

# Or pass directly
ANTHROPIC_API_KEY=sk-... tsx fork-and-prompt.ts "prompt"
```

**Session file not readable**
```bash
# Verify file exists and is valid JSONL
jq . ~/.pi/agent/sessions/.../uuid.jsonl | head -5

# Should show valid JSON lines
```

---

## Code Layout

```
fork-and-prompt.ts
  ├─ locateCurrentSession()      [ATOM 1]
  ├─ forkSession()                [ATOM 2]
  ├─ promptLLM()                  [ATOM 3]
  ├─ appendResponseToSession()    [ATOM 4]
  ├─ readResultFromSession()      [ATOM 5]
  └─ main() — orchestrates all
```

Each function is documented with:
- What it does
- TypeScript code
- Inputs/outputs
- Why it matters
- Design notes

---

## For yarn-agent Design

This PoC proves:
- ✓ SessionManager.fork() works (parent → child)
- ✓ LLM streaming works (prompt → response text)
- ✓ Append-only JSONL works (no corruption, concurrent-safe)
- ✓ Entry lookup works (by ID, O(1))
- ✓ Lineage is preserved (parentSession link)

Next: Design forks (multi-agent) and forkBy (experimentation).
