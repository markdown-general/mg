# fork-and-prompt ⟜ Session forking + LLM prompting

Session fork + LLM prompt + append + read. All five atoms in one example.

## Usage

Set your session and run:

```bash
export PI_SESSION=$(find ~/.pi/agent/sessions -name "*.jsonl" | xargs ls -t | head -1)
npx tsx /Users/tonyday567/other/pi-mono/packages/coding-agent/examples/fork-and-prompt.ts "Your prompt here"
```

Or if pi-coding-agent sets PI_SESSION automatically, just:

```bash
npx tsx /Users/tonyday567/other/pi-mono/packages/coding-agent/examples/fork-and-prompt.ts "Your prompt here"
```

## What it does

1. **Locate** — Finds your current session (uses `PI_SESSION` env var or most recent)
2. **Fork** — Creates child session with parent linkage
3. **Prompt** — Sends prompt to Claude Haiku via `streamSimple`
4. **Append** — Writes user message + LLM response as session entries
5. **Read** — Retrieves entries and verifies they're in the session

## Output

```
Forked: 7ea9347a → 77ecf6ba
Prompting: "What is yarn-agent?"
Got response: 314 chars

======================================================================
SESSION ENTRIES:
======================================================================

User prompt (e0ffb20d):
What is yarn-agent?

---

Assistant response (1cf802e2):
Yarn-agent is a component in Apache Hadoop's YARN...

======================================================================
Session file: /Users/tonyday567/.pi/agent/sessions/.../2026-03-07T01-13-36-712Z_77ecf6ba-232e-4907-a270-696f72156cdb.jsonl
```

## Key insights

- `registerBuiltInApiProviders()` auto-runs on module load (side effect)
- `getModel()` returns full Model object with `api` field
- `streamSimple()` is AsyncIterable; collect `text_delta` events
- Session tree via `parentId` works perfectly
- JSONL written to disk automatically (append-only)
- Forking is copy-on-write (cheap, concurrent-safe)

## For Haskell team

This is the canonical reference for translating yarn-agent atoms to Haskell. All five operations demonstrated with real LLM responses and real session files.

---

```typescript
#!/usr/bin/env node

import "/Users/tonyday567/other/pi-mono/packages/ai/src/providers/register-builtins.js";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { getModel } from "/Users/tonyday567/other/pi-mono/packages/ai/src/models.js";
import { streamSimple } from "/Users/tonyday567/other/pi-mono/packages/ai/src/stream.js";
import { findMostRecentSession, SessionManager } from "/Users/tonyday567/other/pi-mono/packages/coding-agent/src/core/session-manager.js";

function locateSession(): string {
	if (process.env.PI_SESSION && existsSync(process.env.PI_SESSION)) {
		return process.env.PI_SESSION;
	}

	const sessionDir = join(homedir(), ".pi", "agent", "sessions");
	if (existsSync(sessionDir)) {
		const recent = findMostRecentSession(sessionDir);
		if (recent) return recent;
	}

	throw new Error("No session found");
}

async function main() {
	const userPrompt = process.argv[2] || "Test prompt";

	try {
		// STEP 1: Locate parent session
		const parentPath = locateSession();
		const sessionDir = parentPath.substring(0, parentPath.lastIndexOf("/"));

		// STEP 2: Fork to child
		const parentManager = SessionManager.open(parentPath);
		const parentId = parentManager.getSessionId();

		const childManager = SessionManager.forkFrom(parentPath, process.cwd(), sessionDir);
		const childId = childManager.getSessionId();

		console.log(`Forked: ${parentId.slice(0, 8)} → ${childId.slice(0, 8)}`);

		// STEP 3: Prompt LLM using native pi-ai
		console.log(`Prompting: "${userPrompt}"`);
		const model = getModel("anthropic", "claude-haiku-4-5");
		const response: string[] = [];

		const stream = streamSimple(model, {
			systemPrompt: "You are analyzing system design.",
			messages: [{ role: "user", content: userPrompt }] as any,
		});

		// AsyncIterable: iterate through events
		for await (const event of stream) {
			if (event.type === "text_delta" && (event as any).delta) {
				response.push((event as any).delta);
			}
		}

		const responseText = response.join("");
		console.log(`Got response: ${responseText.length} chars`);

		// STEP 4: Append to session
		const promptId = childManager.appendMessage({
			role: "user",
			content: userPrompt,
		} as any);

		const responseId = childManager.appendMessage({
			role: "assistant",
			content: responseText,
		} as any);

		// STEP 5: Verify reads
		const promptEntry = childManager.getEntry(promptId);
		const responseEntry = childManager.getEntry(responseId);

		console.log(`\n${"=".repeat(70)}`);
		console.log("SESSION ENTRIES:");
		console.log("=".repeat(70));
		console.log(`\nUser prompt (${promptId}):\n${(promptEntry as any).message.content}`);
		console.log(`\n---\n`);
		console.log(`Assistant response (${responseId}):\n${(responseEntry as any).message.content}`);
		console.log(`\n${"=".repeat(70)}`);
		console.log(`Session file: ${childManager.getSessionFile()}`);
	} catch (error) {
		console.error("ERROR:", error);
		process.exit(1);
	}
}

main();
```
