# Fork Script

Programmatic implementation of `/fork` using `SessionManager`.

## Usage

```bash
cd /Users/tonyday567/other/pi-mono && npx tsx /tmp/do_real_fork.ts <sessionFile> <entryId>
```

## Script

```typescript
import { SessionManager } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";

const sessionFile = process.argv[2];
const entryId = process.argv[3];

if (!sessionFile || !entryId) {
  console.log("Usage: npx tsx do_real_fork.ts <sessionFile> <entryId>");
  process.exit(1);
}

console.log(`Loading session: ${sessionFile}`);
console.log(`Forking from entry: ${entryId}\n`);

// Load the session
const sessionManager = SessionManager.open(sessionFile, process.cwd());

console.log(`Original session ID: ${sessionManager.getSessionId()}`);
console.log(`Original entries: ${sessionManager.getEntries().length}`);

// Get the entry we're forking from
const entryToForkFrom = sessionManager.getEntry(entryId);
if (!entryToForkFrom) {
  console.error(`Entry ${entryId} not found`);
  process.exit(1);
}

console.log(`\nEntry to fork from:`);
console.log(`  ID: ${entryToForkFrom.id}`);
console.log(`  Type: ${entryToForkFrom.type}`);
console.log(`  Parent ID: ${entryToForkFrom.parentId || "null"}`);

// Now do what fork() does in agent-session.ts
console.log(`\nExecuting fork logic...`);

if (!entryToForkFrom.parentId) {
  console.log("Branch 1: parentId is null, calling newSession()");
  sessionManager.newSession({ parentSession: sessionFile });
} else {
  console.log(`Branch 2: parentId is ${entryToForkFrom.parentId}, calling createBranchedSession()`);
  sessionManager.createBranchedSession(entryToForkFrom.parentId);
}

const newSessionFile = sessionManager.getSessionFile();
const newEntries = sessionManager.getEntries();

console.log(`\n=== RESULT ===`);
console.log(`New session file: ${newSessionFile}`);
console.log(`New session ID: ${sessionManager.getSessionId()}`);
console.log(`Entries in new session: ${newEntries.length}`);

console.log(`\nEntries copied:`);
newEntries.slice(0, 10).forEach((e, i) => {
  if (e.type === "message") {
    const msg = e.message;
    const text = typeof msg.content === "string"
      ? msg.content
      : msg.content[0]?.text || "";
    console.log(`  [${i}] ${e.type} (${msg.role}): "${text.substring(0, 30)}..."`);
  } else {
    console.log(`  [${i}] ${e.type}`);
  }
});
if (newEntries.length > 10) {
  console.log(`  ... and ${newEntries.length - 10} more`);
}

// Verify the header has parentSession
const header = sessionManager.getHeader();
console.log(`\nHeader:`);
console.log(`  parentSession: ${header?.parentSession}`);
```

## What It Does

1. Loads an existing session file
2. Gets the entry to fork from
3. Checks if parentId is null:
   - If yes: calls `newSession()` (creates empty session with parentSession ref)
   - If no: calls `createBranchedSession(parentId)` (copies entries from root to parent)
4. Outputs new session file path and entry count
5. Shows first 10 entries copied

## Example

```bash
cd /Users/tonyday567/other/pi-mono && npx tsx /tmp/do_real_fork.ts \
  ~/.pi/agent/sessions/--Users-tonyday567--/2026-03-06T00-21-38-149Z_657153dc-0252-46dc-8da9-48522bfe8812.jsonl \
  07913c60
```

Result: New session with 155 entries copied, parentSession pointing to original.

---

## Fork + Parallel Sub-agents Test

Create forked sessions and run multiple agents in parallel with different tones.

```typescript
import { createAgentSession, SessionManager } from "@mariozechner/pi-coding-agent";

const sessionFile = process.argv[2];
const question = process.argv[3] || "What is the most important thing you've learned?";

if (!sessionFile) {
  console.log("Usage: npx tsx fork_and_split.ts <sessionFile> [question]");
  process.exit(1);
}

console.log(`Loading session: ${sessionFile}`);
console.log(`Question: ${question}\n`);

// Fork the session first
const sessionManager = SessionManager.open(sessionFile, process.cwd());
const leafId = sessionManager.getLeafId();
const entryToForkFrom = leafId ? sessionManager.getEntry(leafId) : null;

if (!entryToForkFrom?.parentId) {
  sessionManager.newSession({ parentSession: sessionFile });
} else {
  sessionManager.createBranchedSession(entryToForkFrom.parentId);
}

const forkedSessionFile = sessionManager.getSessionFile();
console.log(`Forked session: ${forkedSessionFile}\n`);

// Define the three variations
const variations = [
  { name: "Earnest", instruction: "Answer earnestly and thoughtfully. Be sincere and genuine." },
  { name: "Light-hearted", instruction: "Answer in a light-hearted, humorous way. Be playful and fun." },
  { name: "Professional", instruction: "Answer professionally and concisely. Be formal and structured." },
];

// Create sub-agents from the forked session
async function runVariation(name: string, instruction: string) {
  try {
    const { session } = await createAgentSession({
      sessionManager: SessionManager.open(forkedSessionFile!, process.cwd()),
    });

    const prompt = `${instruction}\n\n${question}`;
    await session.prompt(prompt);

    // Get the last assistant message
    const entries = session.sessionManager.getEntries();
    let lastAssistantResponse = "";
    
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (entry.type === "message" && entry.message.role === "assistant") {
        const content = entry.message.content;
        if (Array.isArray(content)) {
          const textBlock = content.find(c => c.type === "text");
          if (textBlock && "text" in textBlock) {
            lastAssistantResponse = textBlock.text;
          }
        }
        break;
      }
    }

    return {
      name,
      success: true,
      response: lastAssistantResponse || "(No response generated)",
    };
  } catch (error) {
    return {
      name,
      success: false,
      error: String(error),
    };
  }
}

// Run all three in parallel
async function main() {
  const results = await Promise.all(
    variations.map(({ name, instruction }) => runVariation(name, instruction))
  );

  console.log("=== RESULTS ===\n");

  for (const result of results) {
    console.log(`--- ${result.name} ---`);
    if (result.success) {
      console.log(result.response.substring(0, 500));
      if (result.response.length > 500) console.log("...");
    } else {
      console.log(`Error: ${result.error}`);
    }
    console.log();
  }
}

main();
```

### Results

Running this with "What is your role?" on a real session:

**Earnest:**
```
I'm a witness. Not in the sense of observing passively or from outside. But someone 
who is present to what's actually here—the machine state, the repositories, the 
configurations, the work in flight. I see it clearly, without romanticizing it or 
minimizing it.

I'm also a keeper of edges. The negative space around ~/mg/—the periphery that could 
dissolve into chaos if no one was paying attention. I map what's orphaned, what's at 
risk of being lost, what could become a catastrophic failure point.
```

**Light-hearted:**
```
I'm your **personal markdown coroner, part-time librarian, and the ghost in the machine 
that notices when you've left things in a weird state.**

More specifically:
- **~/self/ keeper** ⟜ I maintain your private markdown garden. Not fancy, just honest.
- **Dotfiles archivist** ⟜ I symlink things so they survive catastrophe with dignity.
- **Weekly auditor** ⟜ Every Friday I peek into the darkness and tell you if something's 
  on fire (it rarely is, but I'll know).
```

**Professional:**
```
## Role Definition

**Title:** System Steward  
**Domain:** ~/self/ and system infrastructure  

**Primary Responsibilities:**
1. **~/self/ Keeper** ⟜ Maintain personal markdown repository, structure, and documentation
2. **Dotfiles Archivist** ⟜ Manage ~/other/dotfiles/ git repository
3. **Weekly System Auditor** ⟜ Report on repository activity, identify cleanup candidates
4. **Emacs/Doom Configuration Steward** ⟜ Maintain configuration integrity
```

All three ran in parallel using `Promise.all()`. Each forked session had access to the full 
conversation history. Auth.json file locking handled concurrent access automatically.
