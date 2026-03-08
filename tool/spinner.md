# spinner ⟜ fork a session and spin 20 agents sequentially, each answers one question

**What it does:**

You have a card with 20 questions [Q1-slug], [Q2-slug], ..., [Q20-slug]. You fork the session at a known good leaf node. Then you spin 20 agents in sequence, each gets the same templated prompt but with their question number filled in. Each agent writes its response to the same session file. Responses are appended automatically. No yin attention needed during execution.

**Why:**

Testing design decisions fast. Gathering multiple perspectives on a single card. No manual context switching. All work lands in one session for later aggregation.

**The pattern:**

1. **Prepare:** You have a card (loom/yarn-agent.md or similar) with questions marked [Qn-slug]
2. **Choose:** Pick a session file and a good leaf node (known good state to branch from)
3. **Fork:** Create a branched session (new JSONL, copy history up to leaf, set parentSession link)
4. **Spin:** For each [Qn-slug]:
   - Load the branched session
   - Create an AgentSession (uses defaults: discovers model, tools, etc.)
   - Send templated prompt: "you are the agent node on [Qn-slug]..."
   - Agent thinks, streams output, response auto-appends to JSONL
   - Move to next question
5. **Done:** All 20 responses live in the branched session file

**How to run:**

```bash
# From pi-mono directory (where node_modules lives)
~/other/pi-mono/node_modules/.bin/tsx ~/mg/tool/spinner.ts

# Or, copy spinner.ts into pi-mono and run:
cd ~/other/pi-mono
./node_modules/.bin/tsx spinner.ts
```

**The code:**

```typescript
/**
 * Spinner: Fork a session and spin 20 agents sequentially
 * Each agent answers one question from loom/yarn-agent.md
 */

import * as fs from "fs";
import * as path from "path";
import { createAgentSession, SessionManager } from "@mariozechner/pi-coding-agent";

const HOME = process.env.HOME || "/Users/tonyday567";
const MG_DIR = path.join(HOME, "mg");
const SESSION_FILE = path.join(
  HOME,
  ".pi/agent/sessions/--Users-tonyday567-mg--/2026-03-04T05-30-10-079Z_7ab3e9be-c8e6-4b64-9389-c924797c1d99.jsonl"
);
const LEAF_ID = "86126968";

/**
 * Parse loom/yarn-agent.md and extract [Qn-slug] patterns
 */
function parseQuestions(filePath: string): Array<{ num: number; slug: string }> {
  const content = fs.readFileSync(filePath, "utf-8");
  const pattern = /\[Q(\d+)-(\w+(?:-\w+)*)\]/g;
  const questions: Array<{ num: number; slug: string }> = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    questions.push({
      num: parseInt(match[1]),
      slug: match[2],
    });
  }
  // Sort by number and deduplicate
  return Array.from(new Map(questions.map((q) => [q.num, q])).values()).sort(
    (a, b) => a.num - b.num
  );
}

async function main() {
  console.log("🧵 Spinner: Forking session and spinning agents...\n");

  // 1. Parse questions
  const cardPath = path.join(MG_DIR, "loom/yarn-agent.md");
  const questions = parseQuestions(cardPath);
  console.log(`Found ${questions.length} questions\n`);

  if (questions.length === 0) {
    console.error("No questions found");
    process.exit(1);
  }

  // 2. Open source session and create branched session
  console.log(`Opening session: ${SESSION_FILE}`);
  const sourceManager = SessionManager.open(SESSION_FILE);
  const branchFile = sourceManager.createBranchedSession(LEAF_ID);

  if (!branchFile) {
    console.error(`Failed to branch from leaf ${LEAF_ID}`);
    process.exit(1);
  }

  console.log(`✓ Branched to: ${branchFile}\n`);

  // 3. Open branched session and create agent session
  const branchedManager = SessionManager.open(branchFile);
  const { session } = await createAgentSession({
    sessionManager: branchedManager,
  });

  // Subscribe to stream text output
  session.subscribe((event) => {
    if (
      event.type === "message_update" &&
      event.assistantMessageEvent.type === "text_delta"
    ) {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  });

  // 4. Spin agents for each question
  console.log("Spinning agents:\n");

  for (const q of questions) {
    const prompt = `Reread ~/mg/loom/yarn-agent.md (it might have changed since last read).
you are the agent node on [Q${q.num}-${q.slug}] and your mission is:

⟜ Give 1, 2 or 3 candidate answers, where the candidates range over what it might possibly be.
⟜ What information should we collect to help narrow the answers down?
⟜ Which answers to other questions would you be most interested in.
⟜ write a haiku describing your node.`;

    console.log(`\n[Q${q.num}] ${q.slug}`);
    console.log("---");

    await session.prompt(prompt);

    console.log(`\n✓ Complete`);
  }

  // 5. Report
  console.log(`\n\n🎉 Spun ${questions.length} agents`);
  console.log(`Session: ${branchFile}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
```

**What to customize:**

- `SESSION_FILE` ⟜ path to the source session you want to branch from
- `LEAF_ID` ⟜ the node ID you want to branch at (known good state)
- `MG_DIR` ⟜ path to ~/mg
- The prompt template ⟜ change "you are the agent node on..." to fit your questions

**What happens:**

- New branched session file created with timestamp in the filename
- 20 agents spin sequentially (not parallel; keeps things simple)
- Each response appends as a message entry in the JSONL
- Output streams to console (you see it happening)
- Session file path printed at the end

**Result:**

A session file containing the original conversation + 20 new agent responses. Ready for aggregation, analysis, or further spinning.

---

## Next steps

Once spinning is done, read the session file and aggregate results. See: [aggregator](#aggregator) (TBD).
