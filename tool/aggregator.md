# aggregator ⟜ fresh agent analyzes 20 Q-responses for patterns and candidates

**What it does:**

You have a branched session with 20 agent responses (from spinner). This tool:
1. Creates a fresh session (no history, clean slate, no inherited bias)
2. Extracts all 20 Q-responses from the branched session JSONL
3. Sends them to the fresh agent with: "Analyze these. What patterns? Which candidates survive? What info is most valuable?"
4. Captures the fresh agent's synthesis

**Why:**

Removes bias. The fresh agent hasn't heard our reef theory, our drift concepts, our assumptions. It just sees 20 well-reasoned answers and spots patterns we might miss.

**How to run:**

```bash
# From pi-mono directory
cd ~/other/pi-mono
./node_modules/.bin/tsx ~/mg/tool/aggregator.ts <branched-session-file>

# Example:
./node_modules/.bin/tsx ~/mg/tool/aggregator.ts \
  ~/.pi/agent/sessions/--Users-tonyday567-mg--/2026-03-04T17-54-05-510Z_1b07ffe2-c2a8-4dce-9407-9d918aab81ee.jsonl
```

**The code:**

```typescript
/**
 * Aggregator: Fresh agent analyzes 20 Q-responses for patterns
 */

import * as fs from "fs";
import * as path from "path";
import { createAgentSession, SessionManager } from "@mariozechner/pi-coding-agent";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: tsx aggregator.ts <branched-session-file>"
  );
  process.exit(1);
}

const branchedSessionFile = args[0];

if (!fs.existsSync(branchedSessionFile)) {
  console.error(`Session file not found: ${branchedSessionFile}`);
  process.exit(1);
}

/**
 * Extract Q-responses from branched session JSONL
 * Returns: array of {question: string, response: string}
 */
function extractResponses(
  filePath: string
): Array<{ question: string; response: string }> {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const responses: Array<{ question: string; response: string }> = [];
  let currentQuestion: string | null = null;
  let currentResponse: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    // Look for message entries
    if (entry.type === "message" && entry.message?.role === "assistant") {
      const content = entry.message.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part.type === "text") {
            const text = part.text;
            // Try to extract question number from the response
            // Look for "[Q12]" or "Q1-session-wiring" patterns
            const qMatch = text.match(/\[?Q(\d+)/);
            if (qMatch && !currentQuestion) {
              currentQuestion = `Q${qMatch[1]}`;
            }
            currentResponse.push(text);
          }
        }
      }

      // If we have accumulated response, save it
      if (currentResponse.length > 0) {
        const fullResponse = currentResponse.join("\n");
        if (currentQuestion) {
          responses.push({
            question: currentQuestion,
            response: fullResponse,
          });
        }
        currentQuestion = null;
        currentResponse = [];
      }
    }
  }

  return responses;
}

async function main() {
  console.log(`📊 Aggregator: Analyzing session responses...\n`);
  console.log(`Session: ${branchedSessionFile}\n`);

  // 1. Extract responses
  const responses = extractResponses(branchedSessionFile);
  console.log(`Found ${responses.length} responses\n`);

  if (responses.length === 0) {
    console.error("No responses found in session file");
    process.exit(1);
  }

  // 2. Format responses for agent
  const formattedResponses = responses
    .map(
      (r, i) =>
        `## ${r.question}\n\n${r.response}`
    )
    .join("\n\n---\n\n");

  // 3. Create fresh session (no history)
  const freshManager = SessionManager.inMemory();
  const { session } = await createAgentSession({
    sessionManager: freshManager,
  });

  // Subscribe to stream output
  session.subscribe((event) => {
    if (
      event.type === "message_update" &&
      event.assistantMessageEvent.type === "text_delta"
    ) {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  });

  // 4. Send prompt to fresh agent
  const prompt = `You are a fresh agent with no prior context about this project. Read and analyze these 20 question-responses carefully:

---

${formattedResponses}

---

Now analyze:

1. **Patterns across all 20 responses**
   - What themes recur? 
   - Which candidates appear strongest / most justified?
   - Where do agents disagree most?

2. **Information value**
   - What information appears most often as "needed to narrow down"?
   - Which questions block others (dependencies)?
   - What's still truly uncertain vs. mostly settled?

3. **Architectural insights**
   - Do you notice assumptions the agents are making?
   - Are there contradictions that matter?
   - Any major categories or groupings?

4. **Your recommendation**
   - If you had to guess the actual design intent, what would it be?
   - What surprised you?
   - What questions should be answered FIRST to unblock others?

Be concise. Focus on signal, not on recapping every response.`;

  console.log("---\n");
  await session.prompt(prompt);
  console.log("\n\n---");
  console.log(`\n✓ Aggregation complete\n`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
```

**What happens:**

1. Reads the branched session file (JSONL)
2. Extracts all assistant messages (the 20 Q-responses)
3. Formats them into a readable markdown block
4. Creates a completely fresh SessionManager with `inMemory()`
5. Spins one fresh agent with the formatted responses + analysis prompt
6. Agent streams analysis to stdout

**Result:**

Fresh agent's take on:
- Patterns across the 20 responses
- Information value (what info matters most?)
- Architectural insights (what are the agents assuming?)
- Recommendations (what should be answered first?)

Then you take that analysis and share it with reef Claude for external perspective.

---

## Next steps

Run aggregator, capture output, share with claude.ai.
