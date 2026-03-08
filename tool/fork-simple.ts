#!/usr/bin/env node
/**
 * fork-simple ⟜ Minimal session forking without LLM
 * 
 * Just: locate, fork, write prompt+response to session as entries
 * No authentication or model complexity.
 */

import { SessionManager, findMostRecentSession } from "@mariozechner/pi-coding-agent/core/session-manager.js";
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
	const userPrompt = process.argv[2] || "Test fork";

	try {
		// Step 1: Locate parent session
		const parentPath = locateSession();
		const sessionDir = parentPath.substring(0, parentPath.lastIndexOf("/"));

		// Step 2: Fork
		const parentManager = SessionManager.open(parentPath);
		const parentId = parentManager.getSessionId();

		const childManager = SessionManager.forkFrom(parentPath, process.cwd(), sessionDir);
		const childId = childManager.getSessionId();
		
		console.log(`Forked: ${parentId.slice(0, 8)} → ${childId.slice(0, 8)}`);

		// Step 3: Append user prompt
		const promptEntryId = childManager.appendMessage({
			role: "user",
			content: userPrompt,
		});

		// Step 4: Append mock response
		const responseText = `[Mock response to: "${userPrompt}"]`;
		const responseEntryId = childManager.appendMessage({
			role: "assistant",
			content: responseText,
		});

		// Step 5: Verify reads
		const promptEntry = childManager.getEntry(promptEntryId);
		const responseEntry = childManager.getEntry(responseEntryId);

		console.log("\n" + "=".repeat(70));
		console.log("SESSION ENTRIES:");
		console.log("=".repeat(70));
		console.log(`\nPrompt entry: ${promptEntryId}`);
		console.log(`Content: ${(promptEntry as any).message.content}`);
		console.log(`\nResponse entry: ${responseEntryId}`);
		console.log(`Content: ${(responseEntry as any).message.content}`);
		console.log("\n" + "=".repeat(70));
		console.log(`Session file: ${childManager.getSessionFile()}`);
		console.log(`Entries in memory: ${childManager.getEntries().length}`);
	} catch (error) {
		console.error("ERROR:", error);
		process.exit(1);
	}
}

main();
