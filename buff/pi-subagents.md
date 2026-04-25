## pi-subagents ⟜ spawning specialized agents

🟢 installed ⟜ `https://github.com/tintinweb/pi-subagents`

**Purpose** ⟜ Spawn isolated sub-agents from parent context. Each runs with own tools, model, system prompt, thinking level. Foreground or background. Parallel execution with queueing. Steer mid-run. Resume completed sessions. Define custom agent types.

---

## why this matters for symmetric work

**Humans and agents both use the same interface:**
- `/agents` command ⟜ interactive agent management menu
- `Agent()` tool ⟜ spawn subagent (agent calls it; humans use agent to call it)
- `/steer_subagent` message ⟜ redirect running agent (both can do this)
- `get_subagent_result()` ⟜ check status and retrieve results
- Live widget UI ⟜ shows activity, tokens, turn counts, status for all observers

This is **not biased toward humans or agents**. Both operate through identical abstraction.

---

## three default agent types

| Type | Tools | Model | Use |
|------|-------|-------|-----|
| **general-purpose** | all 7 | inherit parent | Twin to parent — inherits CLAUDE.md, AGENTS.md, same rules |
| **Explore** | read, bash, grep, find, ls | haiku | Fast codebase exploration (read-only) |
| **Plan** | read, bash, grep, find, ls | inherit | Software architect (read-only, planning) |

---

## spawning agents

**Parent calls tool:**
```
Agent({
  subagent_type: "Explore",
  prompt: "Find all files handling auth",
  description: "Find auth files",
  run_in_background: true
})
```

**Parameters:**
- `prompt` ⟜ task (required)
- `description` ⟜ 3-5 word summary (required)
- `subagent_type` ⟜ agent type name (required)
- `model` ⟜ optional override (fuzzy: `"haiku"`, `"sonnet"` or full ID)
- `thinking` ⟜ optional override (off, minimal, low, medium, high, xhigh)
- `max_turns` ⟜ optional turn limit before graceful shutdown
- `run_in_background` ⟜ whether to block (foreground) or notify on completion (background)
- `resume` ⟜ agent ID to continue from previous session
- `inherit_context` ⟜ fork parent conversation into agent so it knows context
- `isolated` ⟜ no extension/MCP tools, only built-in 7
- `isolation` ⟜ `"worktree"` to run in isolated git copy with auto-commit on completion

**Returns:**
- Foreground agent ⟜ blocks until complete, returns full result inline
- Background agent ⟜ returns ID immediately, notifies on completion

---

## custom agent types

Create `.pi/agents/<name>.md` (project-local, takes priority) or `~/.pi/agent/agents/<name>.md` (global).

**Example: `.pi/agents/auditor.md`**

```markdown
---
description: Security Code Reviewer
tools: read, grep, find, bash
model: anthropic/claude-opus-4-6
thinking: high
max_turns: 30
disallowed_tools: write, edit
memory: project
---

You are a security auditor. Review code for vulnerabilities:
- Injection flaws (SQL, command, XSS)
- Authentication and authorization issues
- Sensitive data exposure
- Insecure configurations

Report findings with file paths, line numbers, severity, and fixes.
```

**Frontmatter fields:**
- `description` ⟜ agent title
- `display_name` ⟜ UI name (if different from description)
- `tools` ⟜ comma-separated: read, bash, edit, write, grep, find, ls. or `none`
- `extensions` ⟜ inherit MCP/extension tools (default true)
- `skills` ⟜ preload skill files from `.pi/skills/` (comma-separated names or `true` for all)
- `memory` ⟜ persistent memory scope: `project`, `local`, or `user`
- `disallowed_tools` ⟜ deny specific tools even if extensions provide them
- `isolation` ⟜ `"worktree"` for isolated git repo copy
- `model` ⟜ override (inherit parent by default)
- `thinking` ⟜ override thinking level
- `max_turns` ⟜ turn limit before graceful shutdown
- `prompt_mode` ⟜ `replace` (full custom prompt) or `append` (parent twin inherits CLAUDE.md)
- `inherit_context` ⟜ fork parent conversation into agent by default
- `run_in_background` ⟜ run in background by default
- `isolated` ⟜ no extension tools by default
- `enabled` ⟜ set to `false` to hide agent

**Then use it:**
```
Agent({ subagent_type: "auditor", prompt: "Audit login flow", description: "Security check" })
```

Unknown type names fall back to `general-purpose` with a note.

---

## commands

**`/agents`** ⟜ Interactive menu
  - List running agents (status, tokens, turn count, activity)
  - Browse all agent types (defaults + custom)
  - Create new agent (manual wizard or AI-generated)
  - Settings: max concurrency, max turns, grace turns, join mode
  - Eject defaults to `.md` for customization
  - Enable/disable agents
  - Edit/delete custom agents

**`/steer_subagent <agent_id>`** ⟜ Send steering message
  Interrupts after current tool execution, injects new direction

---

## ui & visibility

**Widget above editor** ⟜ Animated spinners, live activity, token counts, colored status
```
● Agents
├─ ⠹ Explore  Find auth files · ⟳3 · 3 tool uses · 12.4k token · 4.1s
│    ⎿  searching…
├─ ⠹ Refactor  Fix module · ⟳5≤30 · 5 tool uses · 33.8k token · 12.3s
│    ⎿  editing 2 files…
└─ 2 queued
```

**Conversation viewer** ⟜ `/agents` → select running agent → View conversation
  Live-scrolling overlay of full agent chat. Auto-follows new messages.

**Completion notifications** ⟜ Claude Code-style boxes
  - Icon (✓, ■, ✗) + status + stats
  - Result preview (truncated)
  - Expandable for full output
  - Group mode batches multiple completions

**Status icons:**
- `✓` green ⟜ completed naturally
- `✓` yellow ⟜ wrapped up gracefully (hit max_turns)
- `✗` red ⟜ error, stopped, or aborted
- `■` dim ⟜ user-initiated abort
- `⠹` spinning ⟜ running

---

## concurrency & graceful shutdown

**Background agents queue** ⟜ Configurable limit (default 4)
  Excess agents wait automatically. Foreground agents bypass queue.

**Graceful max_turns:**
  1. At limit — steering: *"Wrap up immediately — provide final answer now."*
  2. Up to 5 grace turns to finish cleanly
  3. Hard abort only after grace period

This produces **clean partial results** instead of cut-off output.

**Join strategies** for background completion notifications:
- `smart` (default) ⟜ 2+ agents from same turn auto-grouped. Solo agents notify individually.
- `async` ⟜ Each agent sends its own notification (incremental processing)
- `group` ⟜ Force grouping even for solo agents

Configure via `/agents` → Settings → Join mode. Persists to `.pi/subagents.json`.

---

## persistent settings

Two files, merged on load:
- **Global:** `~/.pi/agent/subagents.json` ⟜ machine-wide defaults (hand-edit, never auto-written)
- **Project:** `.pi/subagents.json` ⟜ per-project overrides (written by `/agents` → Settings)

Precedence: project > global > hardcoded defaults.

**Example — high concurrency for a beefy machine:**
```json
{
  "maxConcurrent": 16,
  "graceTurns": 10
}
```

---

## advanced features

**Session resume** ⟜ `Agent({ resume: "agent-id-here", ... })`
  Continue where agent left off, full conversation context intact

**Persistent agent memory** ⟜ Memory scopes (project, local, user)
  - Project (shared): `.pi/agent-memory/<name>/`
  - Local (machine): `.pi/agent-memory-local/<name>/`
  - User (global): `~/.pi/agent-memory/<name>/`
  Read-only agents get read-only memory automatically

**Worktree isolation** ⟜ `isolation: "worktree"` or `isolation: worktree` frontmatter
  Agent gets isolated git repo copy. Changes auto-committed to branch on completion.

**Skill preloading** ⟜ Inject `.pi/skills/<name>.md` into system prompt
  `skills: api-conventions, error-handling` in frontmatter

**Tool denylist** ⟜ `disallowed_tools: write, edit` blocks even inherited tools

**Context inheritance** ⟜ `inherit_context: true`
  Fork parent conversation into agent so it understands what's been discussed

---

## events & cross-extension rpc

**Lifecycle events** emitted via `pi.events`:
- `subagents:created` ⟜ background agent registered
- `subagents:started` ⟜ agent enters running state
- `subagents:completed` ⟜ agent finished
- `subagents:failed` ⟜ agent errored, stopped, or aborted
- `subagents:steered` ⟜ steering message sent
- `subagents:ready` ⟜ extension loaded, RPC handlers active
- `subagents:settings_loaded` ⟜ persisted settings applied
- `subagents:settings_changed` ⟜ `/agents` settings mutation applied

**Cross-extension RPC** via `pi.events`:
  Other extensions can spawn/stop subagents without importing this package.
  - `subagents:rpc:ping` ⟜ check if extension loaded (get protocol version)
  - `subagents:rpc:spawn` ⟜ spawn agent, get ID
  - `subagents:rpc:stop` ⟜ stop running agent

All replies use standardized envelope: `{ success: true, data?: T }` or `{ success: false, error: string }`

---

## experiments

**What's symmetric here?**

Humans and agents operate through identical primitives:
1. Both use `/agents` menu (human interactive; agent calls it via parent)
2. Both call `Agent()` tool with same parameters
3. Both see live widget UI with identical status/activity
4. Both can steer running agents mid-execution
5. Both can resume completed sessions
6. Both receive structured notifications on completion

**What becomes possible:**
- Agent spawns specialist sub-agents (auditor, explorer, planner) to tackle pieces of a problem
- Parent (human OR agent) coordinates results and steers if needed
- No mode-switching. Same patterns whether you're human-driven or agent-driven.

**Example workflows:**
- Human spins up `Explore` agent to map codebase while they read existing tests
- Agent spins up auditor agent in parallel with refactor agent; waits for results; synthesizes
- Both use same UI to monitor activity, both get same completion notifications
- Later, human can take over a partially-completed agent conversation and resume it where agent left off

This is **not separate modes for humans vs agents**. It's one abstraction that both use equally.

---

## refs

⟜ [pi-subagents repo](https://github.com/tintinweb/pi-subagents) ⟜ source + tests
⟜ [pi extensions](../../docs/extensions.md) ⟜ extension API overview
⟜ [pi events](../../docs/extensions.md#events) ⟜ lifecycle event system
⟜ [Claude Code agents](https://claude.ai/new?plan=pro) ⟜ inspiration for UI patterns
