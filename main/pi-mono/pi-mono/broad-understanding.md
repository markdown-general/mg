# yin/broad-understanding ⟜ read all package READMEs

⊢ package summaries ⊣ ◊ ⬡

## pi-ai ⟜ unified LLM interface

The foundation. Abstracts over 20+ provider APIs (Anthropic, OpenAI, Google, AWS Bedrock, Mistral, Groq, Cerebras, xAI, OpenRouter, Hugging Face, etc.) into a single streaming interface.

**Core abstraction:**
- `stream()` function takes unified options, streams `AssistantMessageEventStream`
- Events: `text`, `tool_call`, `thinking`, `usage`, `stop`
- Message/tool conversion handled per-provider
- Unified type system for models, message roles, tool definitions

**Key patterns:**
- Provider detection from env vars (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
- Model listing and capability detection (tool support, image support, thinking, etc.)
- Token counting (input, output, cache usage)
- Context overflow handling with automatic retry
- Cross-provider tool handoff testing

**Integration points:**
- Custom providers via ~/.pi/agent/models.json (if they speak OpenAI/Anthropic/Google API)
- Custom OAuth and API via extensions
- Adds test coverage: stream, tokens, abort, empty responses, context overflow, image limits, unicode, tool calls, image tool results, total tokens

---

## pi-tui ⟜ terminal UI library

Building blocks for terminal interfaces. Designed for differential rendering (only redraw changed regions).

**Key components:**
- Terminal abstraction (dimension handling, ANSI codes, cursor management)
- Box drawing, text layout, colors
- Event handling (keyboard, mouse if supported)
- Widgets and composition
- Differential rendering for efficiency

**Differential approach:**
- Only compute/send deltas, not full screen rewrites
- Matters for low-bandwidth or high-frequency updates
- Enables smooth animations and complex UIs in terminals

**Used by pi-coding-agent for:**
- Interactive prompt editor
- Message display
- Tool execution UI
- Extension-provided widgets

---

## pi-agent-core ⟜ agent runtime

The choreographer. Manages tool calling loops, state, message threading, event emission.

**Responsibilities:**
- Execute agent step by step
- Call tools and receive results
- Emit events (message, tool_call, tool_result, agent_state_changed, etc.)
- State management (messages, current state, tool history)
- Structured logging

**Flow model:**
1. Agent receives message
2. Tool calls requested → execute and collect results
3. Emit events for state transitions
4. Continue until agent stops (stop reason)

**Integrations:**
- Works with any `stream()` implementation from pi-ai
- Event system for observers (extensions, UI, logging)
- Used by both pi-coding-agent (TUI) and programmatic integrations

---

## pi-coding-agent ⟜ interactive terminal harness

The user-facing application. Terminal UI + agent runtime + rich customization.

**Four modes:**
- **interactive** (default) ⟜ TUI with editor, commands, tool execution
- **print** ⟜ one response and exit
- **json** ⟜ all events as JSON lines (for programmatic use)
- **rpc** ⟜ stdin/stdout protocol for non-Node integrations

**Built-in tools:**
- `read`, `write`, `edit` ⟜ file operations
- `bash` ⟜ shell execution
- `grep`, `find`, `ls` ⟜ filesystem search/list

**Session system:**
- JSONL format with tree structure (id, parentId enables branching)
- Auto-save to ~/.pi/agent/sessions/ per working directory
- `/tree` command to navigate branches in-place
- `/fork` to create new session from point
- Session compaction (automatic or manual via `/compact`)

**Extensibility hooks:**
- Extensions (TypeScript modules with full system access)
- Skills (reusable capability packages following @agentskills.io)
- Prompt templates (reusable prompts)
- Themes (colors, appearance)
- Pi packages (npm/git bundles of above)

**Context loading:**
- AGENTS.md files (global, parent dirs, local)
- System prompt via SYSTEM.md or APPEND_SYSTEM.md
- Extensions/skills/prompts/themes from ~/.pi/agent/ or .pi/ (local)

---

## pi-web-ui ⟜ web components for chat

Web-based interface components. Used for dashboard/embed scenarios.

**Provides:**
- Chat message rendering
- Model selector
- Tool execution visualization
- Settings UI
- Web components (Custom Elements)

**Differs from pi coding-agent:**
- No TUI, pure web UI
- Embedded in larger applications
- Real-world example: openclaw/openclaw SDK integration

---

## pi-mom ⟜ Slack bot

Entry point for non-terminal users. Slack messages routed to pi agent.

**Flow:**
1. Slack message arrives
2. Delegate to pi agent (spawn instance or RPC)
3. Return result to Slack thread

**Integration:**
- Probably uses RPC mode or SDK integration
- Lets teams use pi without terminal expertise

---

## pi-pods ⟜ vLLM deployment CLI

Infrastructure CLI for running vLLM (inference server) on GPU pods.

**Likely handles:**
- Spinning up vLLM instances
- API endpoint management
- Model serving via OpenAI-compatible API
- Used when you want to self-host models

---

## architecture layers

```
pi-coding-agent (TUI + RPC + JSON)
    ↓
pi-agent-core (tool loops, state, events)
    ↓
pi-ai (unified streaming API)
    ↓
provider APIs (OpenAI, Anthropic, etc.)
```

**Orthogonal:**
- pi-tui (UI components)
- pi-web-ui (web components)
- pi-mom (Slack integration)
- pi-pods (infrastructure)

**Extensibility:**
- Extensions hook into pi-coding-agent event system
- Skills are treated as system prompt + knowledge
- Prompt templates are text expansion
- Themes are configuration
- Pi packages bundle any/all of above

---

## design philosophy

**Core is minimal**
- Don't bake in sub-agents, plan mode, MCP, to-dos, permission gates, etc.
- Build them as extensions or install from pi packages
- Keeps core codebase focused

**Aggressive extensibility**
- TypeScript extensions have full system access
- Events for tool calls, state changes, etc.
- Custom commands, tools, UI components
- Hook anywhere in the pipeline

**No breaking changes with major versions**
- Lockstep versioning: patch for fixes/features, minor for breaking changes
- All packages always in sync
- Release script automates: bump, CHANGELOG, commit, tag, publish

---

## next: dive into specific interests

Ready for:
- [spin-agent-mechanics](spin-agent-mechanics.md) ⟜ how do agents actually spawn
- [skill-system](skill-system.md) ⟜ what makes a skill
- [extension-system](extension-system.md) ⟜ building custom extensions
