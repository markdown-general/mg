# pi-mono ⟜ TypeScript monorepo for AI agent architecture

**What it does**: Unified stack for building conversational AI agents with extensibility baked in. Multi-provider LLM abstraction (Anthropic, OpenAI, Google, etc.), agent runtime with tool loops, terminal UI, session management with branching, extensibility via plugins.

**Philosophy**: Minimal core, maximum extensibility. Features come via extensions, skills, prompt templates, themes, pi packages—not baked into the runtime.

**Where it lives**: ~/other/pi-mono (or npm @mariozechner/pi-*)

---

## architecture layers

```
pi-coding-agent (TUI, RPC, JSON modes)
    ↓
pi-agent-core (tool loops, state, events)
    ↓
pi-ai (unified streaming LLM API)
    ↓
provider APIs (Anthropic, OpenAI, Google, etc.)
```

---

## core packages

**@mariozechner/pi-ai** ⟜ Unified LLM interface
- `stream()` function abstracts 20+ providers
- Events: text, tool_call, thinking, usage, stop
- Model detection, token counting, context overflow handling
- Configuration via env vars (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)

**@mariozechner/pi-agent-core** ⟜ Agent runtime & state machine
- Execute agent step-by-step (prompt → tool calls → results → repeat)
- Event system (agent_start, message_update, tool_execution, agent_end)
- State management (messages, tools, streaming state)
- Extensible via event subscribers

**@mariozechner/pi-coding-agent** ⟜ Interactive terminal harness
- TUI with editor, commands, tool execution UI
- Session system (JSONL with tree structure, branching via `/tree`, `/fork`, `/compact`)
- Four modes: interactive (TUI), print (one response), json (all events as JSONL), rpc (stdin/stdout protocol)
- Built-in tools: read, write, edit, bash, grep, find, ls
- Extensibility: extensions (TypeScript), skills (reusable packages), prompt templates, themes, pi packages

**@mariozechner/pi-tui** ⟜ Terminal UI library
- Differential rendering (only redraw changed regions)
- Widgets, box drawing, colors, event handling
- Used by pi-coding-agent for editor and message display

**@mariozechner/pi-mom** ⟜ Slack bot delegation (pipes to pi agent)

**@mariozechner/pi-pods** ⟜ vLLM deployment CLI (self-hosted inference)

---

## key patterns for makers

**Sessions as living records** ⟜ JSONL tree structure (id, parentId). Each entry is immutable. `/tree` navigates branches, `/fork` extracts to new session, `/compact` summarizes old context. Sessions are perfect for audit trails and reproducibility.

**Agent spinning** ⟜ Extensions spawn sub-agents as tools. Main agent → calls custom tool → tool spawns Agent instance → collects result → returns to main. Patterns exist in yard/pi-mono/sessions-agent-core-spinning.md.

**Event-driven extensibility** ⟜ Extensions hook into agent events (tool_call, message_start, agent_end, etc.). No monkey-patching—clean separation.

**Tools as first-class** ⟜ AgentTool interface: name, description, parameters (Type.Object for schema), execute() function. Tools can stream progress via onUpdate callback.

**Steering + follow-up** ⟜ Interrupt agent mid-task (steer) or queue work after (followUp). Modes: one-at-a-time, accumulate, etc.

---

## markdown-general integration

pi-mono's philosophy mirrors markdown-general's:
- Minimal core, feature sprawl via extensions
- Sessions as cards (both are living artifacts)
- Branching as first-class (yin flow markers ◊ ⊢ ⊣ 🚩 map to session tree)
- Extensibility for diverse use cases

**Opportunities:**
- yin-solo: field agents as pi extensions spawning sub-agents
- Skills as upgrades (markdown-general upgrades/ directory aligns with pi skills model)
- Session logs as journal entries (both capture flow state)
- pi packages bundling cards + extensions (e.g., browser-tools as a pi package)

---

## getting started

**Installation**: All packages at @mariozechner scope on npm. Lockstep versioning (all same version).

**Local development**: Fork pi-mono, yarn install, build pipeline (TypeScript + esbuild).

**Key docs**:
- packages/ai/README.md ⟜ Provider table, API surface
- packages/coding-agent/docs/extensions.md ⟜ Full extension system (59KB, comprehensive)
- packages/coding-agent/docs/session.md ⟜ Session format & API (JSONL, branching, compaction)
- packages/coding-agent/docs/sdk.md ⟜ Programmatic SDK use (not just TUI)
- AGENTS.md ⟜ Development rules, tool contract, releasing

**Examples**: packages/coding-agent/examples/extensions/ (summarize.ts, snake.ts, etc.)

---

## agent spinning (for markdown-general)

When you want a sub-agent to research or analyze:

```typescript
import { Agent } from "@mariozechner/pi-agent-core";
import { getModel } from "@mariozechner/pi-ai";

const researcher = new Agent({
  initialState: {
    systemPrompt: "You are a research assistant...",
    model: getModel("anthropic", "claude-haiku-4-5-20250514"),
    tools: [/* search, read, etc */],
  },
});

researcher.subscribe((event) => {
  if (event.type === "message_update") {
    console.log(event.assistantMessageEvent.delta);  // Stream output
  }
});

await researcher.prompt("Research topic X");
```

Session persistence: SessionManager can save sub-agent work to separate session file for audit trail.

---

## why it matters

pi-mono is the reference implementation of the agent architecture patterns described in markdown-general. It's battle-tested (used in production), extensible, and philosophically aligned. Understanding pi-mono means understanding how to build scalable agent systems that don't fall into baked-in feature hell.

For markdown-general: pi-mono is an upgrade that unlocks sub-agent orchestration, session branching, and extensible tool pipelines—all the infrastructure yin-solo needs.
