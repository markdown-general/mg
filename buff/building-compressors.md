## building compression routines ⟜ learn from pi-vcc, customize

🟢 practical ⟜ Build your own compression with the patterns from pi-vcc

---

## architecture: four layers

Think of compression in four independent layers:

### Layer 1: Normalization

**Input:** Pi messages (user, assistant, toolCall, toolResult, thinking)

**Output:** Uniform "blocks" with metadata

```typescript
type NormalizedBlock =
  | { kind: "user"; text: string; sourceIndex: number }
  | { kind: "assistant"; text: string; sourceIndex: number }
  | { kind: "tool_call"; name: string; args: Record<string, any>; sourceIndex: number }
  | { kind: "tool_result"; name: string; text: string; isError: boolean; sourceIndex: number }
  | { kind: "thinking"; text: string; redacted: boolean; sourceIndex: number };
```

**Why separate:** Extraction and formatting works on blocks, not raw messages. Decouples message shape from summary logic.

### Layer 2: Extraction

**Input:** Normalized blocks

**Output:** Structured data (goals, files, commits, etc.)

```typescript
interface SectionData {
  sessionGoal: string[];
  filesAndChanges: string[];
  commits: string[];
  outstandingContext: string[];
  userPreferences: string[];
  briefTranscript: string;  // chronological flow
  transcriptEntries: TranscriptEntry[];  // structured for JSON
}
```

Each extractor is independent:

```typescript
// Run in parallel, no dependencies
const goals = extractGoals(blocks);
const files = extractFiles(blocks);
const commits = extractCommits(blocks);
const blockers = extractOutstandingContext(blocks);
const prefs = extractPreferences(blocks);
const transcript = buildBrief(blocks);
```

### Layer 3: Formatting

**Input:** SectionData

**Output:** Markdown string

```typescript
const formatSummary = (data: SectionData): string => {
  const sections: string[] = [];
  
  if (data.sessionGoal.length > 0) {
    sections.push(`[Session Goal]\n${data.sessionGoal.map(g => `- ${g}`).join("\n")}`);
  }
  
  if (data.filesAndChanges.length > 0) {
    sections.push(`[Files And Changes]\n${data.filesAndChanges.join("\n")}`);
  }
  
  // ... more sections
  
  return sections.join("\n\n---\n\n") + "\n\n---\n\n" + data.briefTranscript;
};
```

### Layer 4: Merging

**Input:** New summary + previous summary

**Output:** Merged summary with intelligent deduplication

```typescript
const merge = (previous: string, fresh: string): string => {
  const prevGoals = extractSection(previous, "Session Goal");
  const freshGoals = extractSection(fresh, "Session Goal");
  
  // Line-level dedup for goals
  const combined = [...new Set([...prevGoals, ...freshGoals])];
  const mergedGoals = combined.slice(0, 8);  // cap at 8
  
  // Similar logic for other sections
  // Context: replace (don't accumulate)
  // Files: merge by category
  // Transcript: append and cap at window
  
  return formatSummary({ mergedGoals, ... });
};
```

---

## building a basic compressor

**Goal:** 500 lines of TypeScript. Compress 90%+. No LLM.

### Step 1: Types

```typescript
// types.ts
export interface NormalizedBlock {
  kind: "user" | "assistant" | "tool_call" | "tool_result" | "thinking";
  text?: string;
  name?: string;
  args?: Record<string, any>;
  isError?: boolean;
  sourceIndex: number;
}

export interface Summary {
  goals: string[];
  files: {
    read: string[];
    modified: string[];
    created: string[];
  };
  blockers: string[];
  prefs: string[];
  transcript: string;
}
```

### Step 2: Normalize

```typescript
// normalize.ts
import type { Message } from "@mariozechner/pi-ai";

export const normalize = (messages: Message[]): NormalizedBlock[] => {
  const blocks: NormalizedBlock[] = [];
  
  messages.forEach((msg, idx) => {
    if (msg.role === "user") {
      const text = extractText(msg.content);
      blocks.push({ kind: "user", text, sourceIndex: idx });
    } else if (msg.role === "assistant" && msg.content) {
      if (typeof msg.content === "string") {
        blocks.push({ kind: "assistant", text: msg.content, sourceIndex: idx });
      } else {
        // Handle content array
        for (const part of msg.content) {
          if (part.type === "text") {
            blocks.push({ kind: "assistant", text: part.text, sourceIndex: idx });
          } else if (part.type === "toolCall") {
            blocks.push({
              kind: "tool_call",
              name: part.name,
              args: part.arguments,
              sourceIndex: idx,
            });
          } else if (part.type === "thinking") {
            blocks.push({
              kind: "thinking",
              text: part.thinking,
              sourceIndex: idx,
            });
          }
        }
      }
    } else if (msg.role === "toolResult") {
      const text = extractText(msg.content);
      blocks.push({
        kind: "tool_result",
        name: msg.toolName,
        text,
        isError: msg.isError ?? false,
        sourceIndex: idx,
      });
    }
  });
  
  return blocks;
};

const extractText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter(c => typeof c === "string" || (c && typeof c === "object" && "text" in c))
      .map(c => typeof c === "string" ? c : (c as any).text ?? "")
      .join("\n");
  }
  return "";
};
```

### Step 3: Extract Goals

```typescript
// extract-goals.ts
const TASK_RE = /\b(fix|add|implement|refactor|debug|update)\b/i;
const SCOPE_CHANGE_RE = /\b(instead|switch to|now|pivot)\b/i;

export const extractGoals = (blocks: NormalizedBlock[]): string[] => {
  const goals: string[] = [];
  
  for (const block of blocks) {
    if (block.kind !== "user") continue;
    
    const lines = (block.text ?? "").split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 10 && l.length < 200);
    
    // Collect substantive lines
    for (const line of lines) {
      if (TASK_RE.test(line) || line.startsWith("-")) {
        goals.push(line.replace(/^[-*+]\s+/, ""));
      }
    }
    
    // Check for scope changes
    if (SCOPE_CHANGE_RE.test(block.text ?? "")) {
      goals.push("[Scope change]");
    }
  }
  
  // Dedup and cap
  return [...new Set(goals)].slice(0, 8);
};
```

### Step 4: Extract Files

```typescript
// extract-files.ts
export const extractFiles = (blocks: NormalizedBlock[]) => {
  const files = { read: new Set<string>(), modified: new Set<string>(), created: new Set<string>() };
  
  for (const block of blocks) {
    if (block.kind !== "tool_call") continue;
    
    const path = block.args?.path || block.args?.file_path || extractPathFromArgs(block.args);
    if (!path) continue;
    
    const name = block.name?.toLowerCase() ?? "";
    if (["read", "view"].includes(name)) files.read.add(path);
    if (["edit", "write"].includes(name)) files.modified.add(path);
    if (["write", "create"].includes(name)) files.created.add(path);
  }
  
  // Dedup: if in modified, remove from created
  for (const p of files.modified) files.created.delete(p);
  
  return {
    read: Array.from(files.read).slice(0, 10),
    modified: Array.from(files.modified).slice(0, 10),
    created: Array.from(files.created).slice(0, 10),
  };
};

const extractPathFromArgs = (args: any): string | undefined => {
  for (const key of ["path", "file_path", "filepath", "file"]) {
    if (typeof args?.[key] === "string") return args[key];
  }
  return undefined;
};
```

### Step 5: Build Transcript

```typescript
// build-transcript.ts
const TRUNCATE_USER = 200;
const TRUNCATE_ASSISTANT = 150;

export const buildTranscript = (blocks: NormalizedBlock[]): string => {
  const lines: string[] = [];
  let lastKind = "";
  
  for (const block of blocks) {
    let header = "";
    let content = "";
    
    switch (block.kind) {
      case "user":
        header = "[user]";
        content = truncate(block.text ?? "", TRUNCATE_USER);
        break;
      case "assistant":
        header = "[assistant]";
        content = truncate(block.text ?? "", TRUNCATE_ASSISTANT);
        break;
      case "tool_call":
        header = `[tool] ${block.name}`;
        content = JSON.stringify(block.args).slice(0, 100);
        break;
      case "tool_result":
        header = block.isError ? `[error] ${block.name}` : `[result] ${block.name}`;
        content = truncate(block.text ?? "", 100);
        break;
      case "thinking":
        // Skip thinking blocks to save space
        continue;
    }
    
    if (header !== lastKind) {
      lines.push(header);
      lastKind = header;
    }
    if (content) lines.push(`  ${content}`);
  }
  
  return lines.slice(-100).join("\n");  // Keep last 100 lines
};

const truncate = (text: string, limit: number): string => {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + "...(truncated)";
};
```

### Step 6: Format

```typescript
// format.ts
export const formatSummary = (summary: Summary): string => {
  const sections: string[] = [];
  
  if (summary.goals.length > 0) {
    sections.push(`[Session Goal]\n${summary.goals.map(g => `- ${g}`).join("\n")}`);
  }
  
  if (Object.values(summary.files).some(f => f.length > 0)) {
    const fileLines: string[] = [];
    if (summary.files.modified.length > 0) fileLines.push(`- Modified: ${summary.files.modified.join(", ")}`);
    if (summary.files.created.length > 0) fileLines.push(`- Created: ${summary.files.created.join(", ")}`);
    if (summary.files.read.length > 0) fileLines.push(`- Read: ${summary.files.read.join(", ")}`);
    sections.push(`[Files And Changes]\n${fileLines.join("\n")}`);
  }
  
  if (summary.blockers.length > 0) {
    sections.push(`[Outstanding Context]\n${summary.blockers.map(b => `- ${b}`).join("\n")}`);
  }
  
  if (summary.prefs.length > 0) {
    sections.push(`[User Preferences]\n${summary.prefs.map(p => `- ${p}`).join("\n")}`);
  }
  
  const header = sections.length > 0
    ? sections.join("\n\n---\n\n") + "\n\n---\n\n"
    : "";
  
  return header + summary.transcript;
};
```

### Step 7: Integrate

```typescript
// compress.ts
export const compress = (messages: Message[]): string => {
  const blocks = normalize(messages);
  
  const summary: Summary = {
    goals: extractGoals(blocks),
    files: extractFiles(blocks),
    blockers: extractBlockers(blocks),
    prefs: extractPreferences(blocks),
    transcript: buildTranscript(blocks),
  };
  
  return formatSummary(summary);
};
```

### Step 8: Hook into pi-vcc or Add as Extension

If you want this to work like pi-vcc, hook it into pi's compaction:

```typescript
// pi extension example
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { compress } from "./compress";

export default (pi: ExtensionAPI) => {
  pi.on("session_before_compact", (event, ctx) => {
    const { preparation } = event;
    const messages = preparation.messages;  // already converted via convertToLlm
    
    const summary = compress(messages);
    
    return {
      compaction: {
        summary,
        firstKeptEntryId: "<last-user-message-id>",
      },
    };
  });
};
```

---

## design decisions: make your own choices

### Goal: How aggressive?

- **Conservative:** Keep goals that explicitly say "fix", "add", "refactor" (high precision, may miss)
- **Aggressive:** Include any user message with 3+ words (more recall, noisier)
- **Balanced (pi-vcc):** Regex for task intent + context heuristics (reject pasted output, code blocks)

### Files: What to track?

- **Minimal:** Only written files (read/edit/write)
- **Full:** Include reads too, so you know what was researched
- **Optimized:** Track by tool call but omit node_modules/, .git/, build artifacts

### Transcript: How much history?

- **Minimal:** Last 30 lines (smallest, lose context)
- **Medium:** Last 100 lines (balance)
- **Generous:** Last 300 lines (more context, less compression)

### Merging: How often?

- **Always fresh:** Every `/compact` discards previous summary (simple, lose history)
- **Sticky accumulation:** Merge goals/files/commits across compactions (preserve big-picture)
- **Hybrid (pi-vcc):** Sticky for goals/files, fresh for blockers (goals persist, problems reset)

---

## testing your compressor

```typescript
// test-compression.ts
import fs from "fs";
import { compress } from "./compress";
import { loadSessionJsonl } from "./session-loader";

const testSession = async (filePath: string) => {
  const messages = await loadSessionJsonl(filePath);
  
  const before = JSON.stringify(messages).length;
  const summary = compress(messages);
  const after = summary.length;
  
  const ratio = 100 - ((after / before) * 100);
  
  console.log(`File: ${filePath}`);
  console.log(`  Before: ${before} bytes`);
  console.log(`  After: ${after} bytes`);
  console.log(`  Reduction: ${ratio.toFixed(1)}%`);
  console.log(`  Summary preview:\n${summary.slice(0, 500)}...\n`);
};

// Run on sample sessions
for (const file of fs.readdirSync(process.argv[2])) {
  await testSession(file);
}
```

---

## next: recall (optional but powerful)

Once you have compression working, add lossless recall:

```typescript
// recall.ts
export const recall = (rawJsonl: string, query: string): number[] => {
  const lines = rawJsonl.split("\n").filter(l => l.trim());
  const entries = lines.map((l, idx) => ({ idx, data: JSON.parse(l) }));
  
  // Search message content
  const hits: number[] = [];
  for (const { idx, data } of entries) {
    if (data.type !== "message") continue;
    const content = extractText(data.message.content);
    if (content.toLowerCase().includes(query.toLowerCase())) {
      hits.push(idx);
    }
  }
  
  return hits;
};
```

---

## refs

⟜ [pi-vcc internals](pi-vcc-internals.md) ⟜ deep dive into every extractor
⟜ [pi-vcc source](https://github.com/sting8k/pi-vcc/tree/main/src) ⟜ reference implementation
⟜ [pi extensions](../../docs/extensions.md) ⟜ hook your compressor into pi
⟜ [pi session format](../../docs/session.md) ⟜ message types and storage
