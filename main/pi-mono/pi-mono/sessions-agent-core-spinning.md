# yin/sessions-agent-core-spinning ⟜ solid deck on sessions, agent-core, and spinning agents

## part 1: sessions and branching

**what is a session?** A JSONL file at `~/.pi/agent/sessions/--<cwd-hashed>--/<timestamp>_<uuid>.jsonl` containing the conversation tree.

**tree structure** Each entry has `id` (8-char hex) and `parentId` (points to previous entry). First entry has `parentId: null`. This creates a DAG: branching is free, no new files needed.

```
user message [a1b2c3d4]
    ↓
assistant [b2c3d4e5]
    ├→ user [c3d4e5f6] ← current leaf
    │
    └→ branch_summary [d4e5f6g7] ← divergence point
        ↓
        user [e5f6g7h8]
        ↓
        assistant [f6g7h8i9]
```

**entry types** (from session.md):

| Entry | Purpose |
|-------|---------|
| `SessionHeader` | Metadata (version, cwd, parent session id) |
| `message` | Conversation turn (user, assistant, toolResult) |
| `compaction` | Lossy summary of earlier context |
| `branch_summary` | When diverging, capture the left branch's story |
| `custom` | Extension state (not in LLM context) |
| `custom_message` | Extension-injected message (in context) |
| `label` | User bookmark on an entry |
| `model_change`, `thinking_level_change` | Metadata tracking |

**context building** `SessionManager.buildSessionContext()` walks from current leaf to root:
- Collects messages on the path
- If a `compaction` entry is on path: emits summary first, then kept messages, then post-compaction
- Converts `branch_summary` and `custom_message` to appropriate message formats
- Returns `{ messages, thinkingLevel, model }`

**commands:**
- `/tree` ⟜ navigate and jump between branches in-place
- `/fork` ⟜ extract a branch to a new session file
- `/compact` ⟜ summarize old messages, keep recent (automatic on context overflow)
- `/name <name>` ⟜ set session display name (appears in /resume)

**SessionManager API** (key methods):
- `SessionManager.continueRecent(cwd)` ⟜ resume most recent or create new
- `newSession({ parentSession })` ⟜ start new, optionally forking from another session
- `appendMessage(message)` ⟜ add turn
- `branch(entryId)` ⟜ move leaf to earlier point (rewind in-place)
- `branchWithSummary(entryId, summary)` ⟜ diverge and capture context from left branch
- `appendCompaction(summary, firstKeptId, tokensBefore, details, fromHook)` ⟜ compress context
- `appendCustomEntry(type, data)` ⟜ extension state persistence (survives reload)

**why this matters:** Sessions are immutable audit trails. Full history in one file. No loss of divergence. Extensions can emit custom entries for their own state.

---

## part 2: pi-agent-core ⟜ the orchestrator

**what it does** Stateful agent that loops: ask LLM → execute tools → ask LLM → repeat until stop.

**core flow**

```
prompt("your message")
    ↓
turn_start event
    ↓
convert AgentMessage[] → Message[] (filter custom types)
    ↓
stream() from pi-ai (start getting assistant response)
    ├→ message_start / message_update / message_end events
    │   (you can stream to screen in real time)
    ↓
if tool calls in response:
    ├→ tool_execution_start event
    ├→ execute each tool (can stream progress via onUpdate)
    ├→ tool_execution_end event
    ├→ append tool result to messages
    ├→ loop back: stream() again with tool results
    ↓
turn_end event (all tool calls done, LLM gave final response)
    ↓
agent_end event (all turns done)
```

**message types** (from agent docs):

**AgentMessage** = union of:
- `UserMessage` { role, content, timestamp }
- `AssistantMessage` { role, content[], api, provider, model, usage, stopReason, timestamp }
- `ToolResultMessage` { role, toolCallId, toolName, content[], isError, timestamp }
- `BashExecutionMessage` (extended) { role: "bashExecution", command, output, exitCode, excludeFromContext }
- `CustomMessage` (extended) { role: "custom", customType, content, display, details }
- etc.

**convertToLlm()** function needed to bridge gap. LLM only understands user/assistant/toolResult. CustomMessage, BashExecutionMessage, notifications all get filtered out or transformed.

```typescript
const agent = new Agent({
  convertToLlm: (messages) => messages.flatMap(m => {
    if (m.role === "bashExecution") return [];  // filter out
    if (m.role === "custom" && m.customType === "my-ext") return [];  // filter out
    return [m];  // pass through standard types
  }),
});
```

**event subscription** All events via `agent.subscribe()`:

```typescript
agent.subscribe((event) => {
  switch (event.type) {
    case "agent_start":
      console.log("Agent starting");
      break;
    case "message_update":
      // Streaming delta from assistant
      if (event.assistantMessageEvent.type === "text_delta") {
        console.log(event.assistantMessageEvent.delta);
      }
      break;
    case "tool_execution_end":
      console.log(`Tool ${event.toolName} result:`, event.result);
      break;
    case "agent_end":
      console.log("Agent done, all messages:", event.messages);
      break;
  }
});
```

**state** Accessed via `agent.state`:

```typescript
interface AgentState {
  systemPrompt: string;
  model: Model<any>;
  thinkingLevel: "off" | "minimal" | ... | "xhigh";
  tools: AgentTool[];
  messages: AgentMessage[];
  isStreaming: boolean;
  streamMessage: AgentMessage | null;  // Partial during streaming
  pendingToolCalls: Set<string>;
  error?: string;
}
```

**tools** Custom tools via `AgentTool`:

```typescript
const myTool: AgentTool = {
  name: "search",
  label: "Search",
  description: "Search for something",
  parameters: Type.Object({
    query: Type.String(),
  }),
  execute: async (toolCallId, params, signal, onUpdate) => {
    // Can stream progress
    onUpdate?.({ content: [{ type: "text", text: "Searching..." }], details: {} });

    const results = await search(params.query);
    return {
      content: [{ type: "text", text: JSON.stringify(results) }],
      details: { count: results.length },
    };
  },
};

agent.setTools([myTool]);
```

**steering and follow-up** Interrupt during tool execution or queue work after:

```typescript
// While agent is running tools
agent.steer({ role: "user", content: "Actually, do this instead", timestamp: Date.now() });

// Queued until agent finishes current work
agent.followUp({ role: "user", content: "Then also do that", timestamp: Date.now() });

// Control delivery
agent.setSteeringMode("one-at-a-time");  // One steer, then respond
agent.setFollowUpMode("one-at-a-time");  // One follow-up, then respond
```

**why this matters** Agent is the state machine. Extensions hook into events. Sessions store the results. Together they enable replayability, forking, and external control.

---

## part 3: agent spinning as extensibility

**the idea** Spawn sub-agents from an extension. Main agent calls a custom tool → tool spawns new agent → collects result → returns to main.

**pattern 1: simple research agent spawned as tool**

```typescript
import { Agent } from "@mariozechner/pi-agent-core";
import { getModel } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "research",
    description: "Research a topic with a sub-agent",
    parameters: Type.Object({
      topic: Type.String({ description: "What to research" }),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      // Spawn a sub-agent
      const researcher = new Agent({
        initialState: {
          systemPrompt: "You are a research assistant. Be thorough and cite sources.",
          model: getModel("anthropic", "claude-sonnet-4-20250514"),
          tools: [/* search tool, etc */],
        },
      });

      let result = "";

      researcher.subscribe((event) => {
        if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
          result += event.assistantMessageEvent.delta;
          // Stream progress to main agent
          onUpdate?.({ content: [{ type: "text", text: result }], details: {} });
        }
      });

      await researcher.prompt(`Research: ${params.topic}`);

      return {
        content: [{ type: "text", text: result }],
        details: { topic: params.topic, subAgentFinal: researcher.state.messages },
      };
    },
  });
}
```

**pattern 2: spawned agent with session persistence**

If you want sub-agent work to be traceable, checkpoint it to a session:

```typescript
import { SessionManager } from "@mariozechner/pi-coding-agent";

async execute(toolCallId, params, signal, onUpdate, ctx) {
  // Create a session for the sub-agent's work
  const subAgentSession = SessionManager.create(`${cwd}/sub-agents/${params.topic}`);

  const researcher = new Agent({
    initialState: {
      systemPrompt: "You are a research assistant.",
      model: getModel("anthropic", "claude-sonnet-4-20250514"),
      messages: subAgentSession.buildSessionContext().messages,
    },
  });

  researcher.subscribe((event) => {
    if (event.type === "message_end") {
      // Persist to session
      subAgentSession.appendMessage(event.message);
    }
  });

  await researcher.prompt(`Research: ${params.topic}`);

  // Result includes session path for audit trail
  return {
    content: [{ type: "text", text: "Research complete" }],
    details: { sessionPath: subAgentSession.getSessionFile() },
  };
}
```

**pattern 3: orchestration agent with spawned workers**

Main agent delegates, collects results, synthesizes:

```typescript
// Main agent has a tool "fork_research"
// Tool spawns N sub-agents in parallel
// Collects results
// Returns summary

async execute(toolCallId, params, signal, onUpdate, ctx) {
  const topics = params.topics; // ["AI", "ML", "Neural Networks"]

  const promises = topics.map(topic => {
    const agent = new Agent({
      initialState: {
        systemPrompt: "Research one topic. Be concise.",
        model: getModel("anthropic", "claude-sonnet-4-20250514"),
      },
    });

    return new Promise<string>((resolve) => {
      let result = "";
      agent.subscribe((event) => {
        if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
          result += event.assistantMessageEvent.delta;
        }
        if (event.type === "agent_end") {
          resolve(result);
        }
      });

      agent.prompt(`Research: ${topic}`);
    });
  });

  const results = await Promise.all(promises);

  return {
    content: [{ type: "text", text: results.join("\n\n---\n\n") }],
    details: { topicsCount: topics.length },
  };
}
```

**pattern 4: spawned agent inherits context from main session**

```typescript
async execute(toolCallId, params, signal, onUpdate, ctx) {
  // ctx has access to current session
  const currentSession = ctx.sessionManager.getLeafId();
  const context = ctx.sessionManager.buildSessionContext();

  // Sub-agent starts with main agent's conversation history
  const helper = new Agent({
    initialState: {
      systemPrompt: "You are a helper. You have context from the main conversation.",
      model: getModel("anthropic", "claude-sonnet-4-20250514"),
      messages: context.messages,  // Inherit conversation
    },
  });

  // ... execute and return
}
```

**pattern 5: agent spawning via extension event hook**

Instead of a tool, spawn agents on certain events:

```typescript
export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("complex")) {
      ctx.ui.notify("Spawning analysis agent...", "info");

      // Spawn concurrent agent to analyze the output
      const analyzer = new Agent({
        initialState: {
          systemPrompt: "Analyze complex outputs.",
          model: getModel("anthropic", "claude-sonnet-4-20250514"),
        },
      });

      analyzer.prompt("Analyze this bash execution and suggest improvements");

      // Don't block main agent, just run in background
    }
  });
}
```

**considerations when spinning agents**

- **Resource limits** ⟜ Spawning many agents costs tokens and time. Model carefully.
- **Session isolation** ⟜ Sub-agent sessions should be separate from main. Use `SessionManager.create(subPath)`.
- **Context inheritance** ⟜ Sub-agents can read main context via `buildSessionContext()` but shouldn't pollute main messages.
- **Streaming** ⟜ Use `onUpdate` callback to stream progress back to main.
- **Error handling** ⟜ Sub-agent errors shouldn't crash main. Wrap in try/catch.
- **Tool access** ⟜ Sub-agents have their own tool set. Can be same or different from main.
- **Steering** ⟜ Steering the main agent doesn't affect sub-agents (different Agent instances).

---

## synthesis: the architecture

```
pi-coding-agent (TUI, session mgmt)
    ↓
pi-agent-core (tool loop, events, state)
    ↓
pi-ai (streaming)

Extensions hook into agent events:
  - Spawn sub-agents (custom tool)
  - Monitor progress (tool_execution events)
  - Persist state (session custom entries)
  - Control flow (steer/followUp)
```

**design pattern:**
1. Main agent processes user request
2. Main agent's tool calls a custom tool registered by extension
3. Extension spawns sub-agent(s)
4. Sub-agents do work (with own tools, sessions, streaming)
5. Extension collects results and returns to main agent
6. Main agent synthesizes and responds

**scalability:**
- One extension per domain (research, code-review, testing, etc.)
- Each extension registers tools and events
- Each tool can spawn 1 or N agents
- All coordinated through main agent's session

**next:** Code examples in examples/extensions/ (e.g., summarize.ts pattern, snake.ts for stateful tools)

---

## read these docs next

- `packages/agent/README.md` ⟜ Agent API reference (already read)
- `packages/coding-agent/docs/extensions.md` ⟜ Full extension system (already read part 1)
- `packages/coding-agent/docs/session.md` ⟜ Session format & API (already read)
- `packages/coding-agent/examples/extensions/` ⟜ Working examples
- `packages/coding-agent/src/core/session-manager.ts` ⟜ SessionManager implementation
- `packages/agent/src/agent.ts` ⟜ Agent class implementation

---

## ready to:

⊢ [extension-deep-dive](extension-deep-dive.md) ⊣
  ⟜ event types and timing
  ⟜ UI integration patterns
  ⟜ state management in extensions

⊢ [spinning-patterns](spinning-patterns.md) ⊣
  ⟜ build working sub-agent examples
  ⟜ orchestration patterns
  ⟜ session checkpointing

⊢ [skill-vs-extension](skill-vs-extension.md) ⊣
  ⟜ when to use each
  ⟜ composition

⊢ [markdown-general-parallels](markdown-general-parallels.md) ⊣
  ⟜ sessions as cards
  ⟜ branching in yin flow
  ⟜ agent spawning in markdown context
