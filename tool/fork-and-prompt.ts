#!/usr/bin/env node

import "./packages/ai/src/providers/register-builtins.js";
import { getModel } from "./packages/ai/src/models.js";
import { streamSimple } from "./packages/ai/src/stream.js";
import { SessionManager, findMostRecentSession } from "./packages/coding-agent/src/core/session-manager.js";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

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
			messages: [{ role: "user", content: userPrompt }],
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
		});

		const responseId = childManager.appendMessage({
			role: "assistant",
			content: responseText,
		});

		// STEP 5: Verify reads
		const promptEntry = childManager.getEntry(promptId);
		const responseEntry = childManager.getEntry(responseId);

		console.log("\n" + "=".repeat(70));
		console.log("SESSION ENTRIES:");
		console.log("=".repeat(70));
		console.log(`\nUser prompt (${promptId}):\n${(promptEntry as any).message.content}`);
		console.log(`\n---\n`);
		console.log(`Assistant response (${responseId}):\n${(responseEntry as any).message.content}`);
		console.log("\n" + "=".repeat(70));
		console.log(`Session file: ${childManager.getSessionFile()}`);
	} catch (error) {
		console.error("ERROR:", error);
		process.exit(1);
	}
}

main();
