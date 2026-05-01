---
name: pi
description: Agent architecture, extensibility, multi-provider LLM, and session management
---

# pi ecosystem ⟜ agent architecture

**What:** pi-coding-agent is a conversational AI agent platform. Minimal core (agent loop), maximum extensibility via packages. Multi-provider LLM support, session management with branching, TUI interface, extensibility via plugins.

**Where:** ~/other/pi-mono (canonical), installed globally via npm

**Center of operations:** ~/.pi/agent/ ⟜ settings, packages, configuration

---

## ~/.pi/agent/ ⟜ your setup

**settings.json** — installed packages, model, behavior
```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-6",
  "defaultThinkingLevel": "medium",
  "hideThinkingBlock": true,
  "hideToolCalls": true,
  "packages": [
    "npm:pi-mcp-adapter",
    "npm:@sting8k/pi-vcc",
    "https://github.com/tintinweb/pi-subagents"
  ]
}
```

**mcp.json** — MCP servers (zero active)
```json
{
  "settings": {
    "toolPrefix": "mcp",
    "idleTimeout": 60
  }
}
```
Status: pi-mcp-adapter is installed (in packages) but dormant (no servers configured). Ready to connect if needed.

**pi-vcc-config.json** — session compaction (if exists)
```json
{
  "overrideDefaultCompaction": false,
  "debug": false
}
```

---

## Three installed packages

### 1. pi-mcp-adapter ⟜ MCP server gateway

**What it does:** Wraps MCP servers as pi tools. Solves context bloat by lazy-loading and proxying servers instead of embedding 10k+ tokens of tool definitions upfront.

**Status:** Installed, dormant (no servers in mcp.json). Ready to activate when needed.

**Pattern:**
```
MCP server (stdio)
    ↓
pi-mcp-adapter extension (proxy tool)
    ↓
pi agent (Claude, OpenAI, Gemini, local)
    ↓
Tools available on demand
```

**To use:** Add server to ~/.pi/agent/mcp.json, reload pi. Tool discovery happens automatically.

**Philosophy:** Single proxy tool (~200 tokens) in system prompt vs 40+ individual tools (10k+ tokens). Immediate context savings on multi-server setups.

---

### 2. pi-vcc ⟜ algorithmic session compaction

**What it does:** Lossless, deterministic session compression. No LLM calls, no hallucination risk. Extracts goals, files, commits, preferences, outstanding blockers. Preserves recall via `/pi-vcc-recall`.

**Install:** Already in settings.json

**Quick commands:**
- `/pi-vcc` ⟜ compress session on demand
- `/pi-vcc-recall <query>` ⟜ search old history after compaction (full JSONL searchable)
- `/pi-vcc-recall expand:41,42` ⟜ get full untruncated content for specific entries

**Why it matters:**
- Sessions compress 90-99% (example: 997KB → 7.9KB in 64ms)
- Compression is deterministic (same input = same output always)
- Recall is lossless (search raw JSONL even after multiple compactions)
- No API calls, zero cost

**Config:** ~/.pi/agent/pi-vcc-config.json
- `overrideDefaultCompaction: false` ⟜ use `/pi-vcc` manually; `/compact` uses pi core
- `overrideDefaultCompaction: true` ⟜ pi-vcc handles all compaction (replace default)

**Real measurements:** 432 sessions across projects, ~116MB total. Largest session (2.53MB) compresses to ~8KB.

---

### 3. pi-subagents ⟜ spawning specialist agents

**What it does:** Spawn isolated sub-agents from parent context. Each runs with own tools, model, system prompt, thinking level. Foreground or background. Steer mid-run. Resume sessions.

**Install:** Already in settings.json

**Quick commands:**
- `/agents` ⟜ interactive menu (list, create, manage, settings)
- `Agent({ subagent_type: "Explore", prompt: "...", description: "...", run_in_background: true })` ⟜ spawn agent
- `/steer_subagent <agent_id>` ⟜ send steering message to running agent

**Three defaults:**
- **general-purpose** ⟜ all tools, inherit parent model, twin to parent
- **Explore** ⟜ read-only (read, bash, grep, find, ls), haiku model, fast codebase scanning
- **Plan** ⟜ read-only, inherit model, software architect mode

**Custom agent types:** Define at `.pi/agents/<name>.md` (project) or `~/.pi/agent/agents/<name>.md` (global)

**Example custom agent:**
```markdown
---
description: Security Code Reviewer
tools: read, grep, find, bash
model: anthropic/claude-opus
thinking: high
disallowed_tools: write, edit
---

You are a security auditor. Review code for:
- Injection flaws (SQL, command, XSS)
- Authentication and authorization issues
- Sensitive data exposure
```

**Why it matters:** Symmetric interface — humans and agents use identical primitives. Same `/agents` menu, same `Agent()` tool, same steering/resume/monitoring UI.

---

## architecture layers

```
pi-coding-agent (TUI, RPC, JSON modes)
    ↓
pi-agent-core (tool loops, state machine)
    ↓
pi-ai (unified streaming LLM API: 20+ providers)
    ↓
provider APIs (Anthropic, OpenAI, Google, etc.)
```

**pi-ai** ⟜ Unified LLM interface
- `stream()` abstracts 20+ providers
- Events: text, tool_call, thinking, usage, stop
- Model detection, token counting, context overflow handling

**pi-agent-core** ⟜ Agent runtime
- Execute agent: prompt → tool calls → results → repeat
- Event system (agent_start, message_update, tool_execution, agent_end)
- Extensible via event subscribers

**pi-coding-agent** ⟜ Interactive terminal harness
- TUI with editor, commands, tool execution UI
- Sessions: JSONL with tree structure, branching via `/tree`, `/fork`, `/compact`
- Four modes: interactive (TUI), print (one response), json (all events as JSONL), rpc (stdin/stdout protocol)
- Built-in tools: read, write, edit, bash, grep, find, ls
- Extensibility: extensions, skills, prompt templates, themes, pi packages

---

## sessions ⟜ immutable records

**Structure:** JSONL tree with id/parentId. Each entry immutable.

**Key insight:** When you fork, the entire message history up to fork point is **copied** into new file. Not inherited via reference — cloned.

```
Original: header + msg1 + msg2 + msg3 + msg4
                           ↓ fork from msg2
Forked:   header + msg1 + msg2  [+ parentSession field]
```

Agent in forked session sees: header + msg1 + msg2. Ready to append msg3'.

**Tree navigation** (/tree) ⟜ Changes leaf pointer in same JSONL. Quick what-if exploration.

**Forking** (/fork) ⟜ Creates new JSONL with copied entries. Good for saving thread or spinning parallel agent.

---

## extensibility patterns

**Extensions** ⟜ TypeScript packages hooking into agent events
- Spawn sub-agents for parallel work
- Intercept/modify messages
- Add custom tools
- Observe & steer behavior

**Skills** ⟜ Reusable packaged instructions/prompts

**Prompts** ⟜ Template system for prompt variants

**Themes** ⟜ Terminal UI customization

**Pi packages** ⟜ Discoverable via `pi.dev/packages`, installable via `pi install npm:...`

---

## workflow notes

**Starting out:**
- `pi` opens interactive mode
- `/resume` picks from recent sessions
- `/agents` manages spawned agents
- `/mcp` shows MCP servers and tool discovery (if using pi-mcp-adapter)

**During work:**
- Tools called automatically (read, write, edit, bash, etc.)
- `/fork` to branch and try alternative approaches
- `/steer` to redirect mid-run (foreground agent only)
- `/tree` to navigate branches within session

**Session management:**
- `/compact` summarizes old context (uses pi core or pi-vcc depending on config)
- `/pi-vcc-recall` searches history after compaction (lossless)
- `/export` saves session to alternate format

**Agent coordination:**
- `Agent()` tool spawns specialists in parallel
- `/agents` menu monitors activity, steers, manages concurrency
- Both humans and agents use identical interface

---

## reference layer

**For development understanding:**
- buff/pi-mono.md ⟜ Local development copy of pi-coding-agent architecture. Key section: "what I wish I had known" (fork naming trap, parentSession vs message history, SessionManager harness)

**For pi-vcc deep dives:**
- buff/pi-vcc-internals.md ⟜ Pipeline, regex extraction, section merging, recall indexing
- buff/pi-vcc-testing.md ⟜ Measurement methodology, real session inventory, batch compression patterns

**For pi-subagents advanced patterns:**
- pi-subagents.md has complete reference for custom agents, RPC events, persistent memory, worktree isolation

**Official pi docs (upstream):**
- packages/coding-agent/docs/extensions.md (59KB, comprehensive extensibility)
- packages/coding-agent/docs/session.md (JSONL format, branching, compaction)
- packages/coding-agent/docs/sdk.md (programmatic SDK use, not just TUI)
- AGENTS.md (development rules, tool contract, releasing)

---

## config & environment

**API keys** ⟜ Standard env vars (ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY, etc.)

**Session storage** ⟜ ~/.pi/agent/sessions/ (per-project subdirectories, JSONL format)

**Credentials** ⟜ ~/.pi/agent/auth.json (locked for concurrent access)

**Project overrides** ⟜ .pi/settings.json in project root (overrides ~/.pi/agent/settings.json for that project)

---

## next

- Test pi-vcc compression on long sessions (measure real reduction ratios)
- Define custom agents for your workflows (auditor, explorer, specific domain experts)
- Experiment with multi-agent coordination (spin specialists in parallel, synthesize results)
- Integrate MCP servers if needed (configure in mcp.json, add to workflow)
