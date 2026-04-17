# pi ecosystem ⟜ agents beyond claude

**What:** pi-mono is a TypeScript monorepo for building conversational AI agents with extensibility. Multi-provider LLM support (Anthropic, OpenAI, Google, etc.), agent runtime, TUI, session management, extensibility via extensions/skills/plugins.

**Where:** ~/other/pi-mono (canonical), built & installed globally via npm

**Philosophy:** Minimal core (agent loop), max extensibility via packages. Features don't get baked in—they come via extensions, skills, prompts, themes, pi packages.

---

## core layers

```
pi-coding-agent (TUI + RPC + JSON modes)
    ↓
pi-agent-core (tool loops, state machine)
    ↓
pi-ai (unified LLM API: 20+ providers)
    ↓
provider APIs (Anthropic, OpenAI, Gemini, etc.)
```

---

## key packages

**@mariozechner/pi-ai** ⟜ Unified LLM abstraction
- `stream()` function abstracts providers
- Events: text, tool_call, thinking, usage, stop
- Model detection, token counting, overflow handling

**@mariozechner/pi-agent-core** ⟜ Agent runtime
- Execute agent: prompt → tool calls → results → repeat
- Event system (agent_start, message_update, tool_execution, agent_end)
- Extensible via event subscribers

**@mariozechner/pi-coding-agent** ⟜ Interactive terminal harness
- TUI with editor, commands, tool execution UI
- **Four modes:**
  - interactive (TUI)
  - print (one response)
  - json (all events as JSONL)
  - rpc (stdin/stdout protocol for programmatic use)
- Built-in tools: read, write, edit, bash, grep, find, ls
- Session system: JSONL with tree structure, branching, compaction

**@mariozechner/pi-tui** ⟜ Terminal UI library (used by coding-agent)

**@mariozechner/pi-mom** ⟜ Slack bot delegation

---

## sessions as immutable records

**Structure:** JSONL tree with id/parentId. Each entry immutable.

**Pattern:**
```
Original: header + msg1 + msg2 + msg3 + msg4
                           ↓ fork from msg2
Forked:   header + msg1 + msg2  [+ parentSession field]
```

Agent in forked session sees full context up to fork point. Ready to continue.

**Key pattern:** `/fork` (UI command) → `fork()` (method) → `createBranchedSession()` (impl).
- `/fork` ⟜ user command in interactive mode
- `fork()` ⟜ orchestration (validates, fires events, calls createBranchedSession)
- `createBranchedSession()` ⟜ real work: copies entries to root, writes new JSONL

**Concurrency safe:** Each agent gets its own SessionManager (independent JSONL files), no shared mutable state.

---

## tools are first-class

```typescript
AgentTool {
  name: string
  description: string
  parameters: Type.Object  // JSON schema
  execute(params): Promise<string>
}
```

Tools can stream progress via `onUpdate` callback. Extensions hook into agent events (tool_call, message_start, agent_end) without monkey-patching.

---

## extensibility patterns

**Extensions** ⟜ TypeScript packages that hook into agent events
- spawn sub-agents for parallel work
- intercept/modify messages
- add custom tools
- observe & steer behavior

**Skills** ⟜ Reusable packaged instructions/prompts

**Prompts** ⟜ Template system for prompt variants

**Themes** ⟜ Terminal UI customization

**Pi packages** ⟜ `pi install npm:@author/package-name` (discovery at pi.dev/packages)

---

## pi-mcp-adapter (🔑 KEY PIECE) — Already exists!

**What it does:** Pi extension that wraps MCP servers into pi tools, solving context bloat.

Problem solved:
- Single MCP server = 10k+ tokens of tool definitions
- 3-4 servers = half your context window gone before conversation starts
- Solution: proxy tool (~200 tokens) discovers tools on-demand

**Install:** 
```bash
pi install npm:pi-mcp-adapter
```

**Config:** `~/.pi/agent/mcp.json`
```json
{
  "mcpServers": {
    "anvil": {
      "command": "sh",
      "args": ["-c", "~/.config/emacs/anvil-stdio.sh --server-id=anvil"]
    }
  }
}
```

**Usage (lazy by default):**
```
mcp({ search: "file" })  ← Discover what tools exist
mcp({ tool: "file-read", args: '{"path": "/tmp/test.txt"}' })  ← Call tool
```

Two calls instead of 40+ tools cluttering context.

**Lifecycle modes:**
- `lazy` (default) ⟜ Don't connect at startup, connect on first tool call, disconnect after idle
- `eager` ⟜ Connect at startup, no auto-reconnect if drops
- `keep-alive` ⟜ Always connected, auto-reconnect

**Direct tools:** Optionally expose specific tools directly (bypass proxy). ~150-300 tokens per tool.

**Interactive config:** `/mcp` command shows all servers, connection status, tools, can toggle direct/proxy on-the-fly.

**Pattern:**
```
Anvil MCP server (anvil-stdio.sh)
    ↓
pi-mcp-adapter extension (proxy tool + lazy connection)
    ↓
pi agent (Claude, OpenAI, Gemini, local via pi-ai)
    ↓
Tools available without context bloat
```

---

## ecosystem on npm

**Categories visible at pi.dev/packages:**
- extensions (behavior-monitors, subagents, guardrails, memory, imessage bot, iMessage bot, project-workflows)
- skills (oh-pi-skills: web-search, debug-helper, git-workflow)
- themes & configurations
- pi packages (all discoverable, installable)

**Notable:**
- @davidorex/pi-behavior-monitors ⟜ Watch agent activity, steer corrections
- @davidorex/pi-project ⟜ Schema-driven project state management
- @tintinweb/pi-subagents ⟜ Claude Code-style autonomous sub-agents
- @kingcrab/pi-imessage ⟜ iMessage bot with conversation context
- @kaiserlich-dev/pi-session-search ⟜ FTS5 search across sessions
- pi-continuous-learning ⟜ Observes sessions, distills patterns into instincts
- pi-sage ⟜ Advisory Sage extension for code review

---

## what this unlocks

**Right now:**
- Anvil ✓ (Emacs MCP server with 40+ tools)
- Claude Code ✓ (can call anvil tools via MCP)
- pi ✓ (extensible, multi-provider agent)

**Next:**
- pi-mcp-adapter wraps anvil MCP tools as pi AgentTool
- pi extension loads adapter
- **any pi agent** (Claude, OpenAI, Gemini, local) calls anvil tools
- **not Claude-only anymore** — pi agents are LLM-agnostic

**Beyond:**
- Other MCP servers (PDF, Kubernetes, Figma, etc.) wrapped same way
- pi becomes a gateway to any MCP server
- Extensions spawn sub-agents, coordinate via anvil
- Sessions record entire orchestration tree

---

## entry points

**To understand pi:**
- buff/pi-mono.md (local, fuller detail)
- packages/coding-agent/docs/extensions.md (59KB, comprehensive)
- packages/coding-agent/docs/session.md (JSONL format, branching, compaction)
- packages/coding-agent/docs/sdk.md (programmatic SDK use, not just TUI)
- ~/mg/buff/session.md (local session architecture card—more complete than upstream)

**To install & explore:**
- npm search "pi-mcp-adapter" (or check npm registry)
- pi install npm:@mariozechner/pi-coding-agent (upgrade if needed)
- pi install npm:pi-mcp-adapter (when identified)

**To build:**
- Fork pi-mono
- yarn install
- Read AGENTS.md (development rules, tool contract)
- examples/extensions/ (summarize.ts, snake.ts patterns)

---

## next moves

✓ pi-mcp-adapter exists (v2.4.0, nicopreme)
✓ Wrapped MCP ↔ pi tools with smart lazy proxy

⊢ Install pi-mcp-adapter: `pi install npm:pi-mcp-adapter`
⊢ Configure anvil in ~/.pi/agent/mcp.json
⊢ Test with pi CLI (all modes: interactive, print, json, rpc)
⊢ Test with multiple providers (Claude via pi-ai, OpenAI, Gemini, local)
⊢ Add direct tools for frequently-used anvil tools (file, org-*) if needed
⊢ Test `/mcp` interactive panel

**Unlock:** pi becomes LLM-agnostic gateway to Emacs (and any MCP server). Works with Claude, OpenAI, Gemini, local models. Context efficient. No tool bloat.

**Payoff:** 
- Emacs + Anvil becomes available to *any* pi agent
- Not Claude-only anymore
- Can fork pi session, spin sub-agents, all talking to same Emacs
- Sessions immutable & queryable
- MCP servers lazy-loaded (no startup cost for unused servers)

