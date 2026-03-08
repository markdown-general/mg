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

**Agent spinning** ⟜ Extensions spawn sub-agents as tools. Main agent → calls custom tool → tool spawns Agent instance → collects result → returns to main.

**Event-driven extensibility** ⟜ Extensions hook into agent events (tool_call, message_start, agent_end, etc.). No monkey-patching—clean separation.

**Tools as first-class** ⟜ AgentTool interface: name, description, parameters (Type.Object for schema), execute() function. Tools can stream progress via onUpdate callback.

**Steering + follow-up** ⟜ Interrupt agent mid-task (steer) or queue work after (followUp). Modes: one-at-a-time, accumulate, etc.

---

## what I wish I had known

**The fork naming trap**

`/fork` (TUI command) → `fork()` (method in agent-session.ts) → `createBranchedSession()` (method in session-manager.ts) look like they do the same thing because they share a name. They don't.

- `/fork` ⟜ user command in interactive mode. shows UI, user picks a message
- `fork()` ⟜ orchestration method. validates entry, fires pre-fork event, calls createBranchedSession(), rebuilds context, fires post-fork event
- `createBranchedSession()` ⟜ does the real work. reads source JSONL, walks id/parentId chain to root, copies all entries on path, writes new JSONL file with header + copied entries

**What you need to understand**: When you fork a session, the **entire message history up to the fork point is copied into the new file**. The forked agent doesn't read a parent file or follow a `parentSession` reference—it has its own copy of the messages. The `parentSession` field in the header is metadata for lineage/audit, not operational.

This is why a forked agent immediately has context. It's not inheriting; it's been given a clone.

**parentSession vs message history**

The mistake: thinking `parentSession` field meant the agent reads the parent. It doesn't.

`parentSession` is for:
- Knowing where a session came from (reproducibility)
- Building lineage graphs (forensics)
- Following the thread (where did this come from?)

Message context comes from: `sessionManager.getEntries()` (the entries in the current JSONL file).

When you fork:
```
Original: header + msg1 + msg2 + msg3 + msg4
                           ↓ fork from msg3's parent (msg2)
Forked:   header + msg1 + msg2  [+ parentSession field pointing to original]
```

Agent in forked session sees: header + msg1 + msg2. That's it. Ready to append msg3'.

**SessionManager is the harness**

`AgentSession` wraps `Agent` (from pi-agent-core). But `Agent` doesn't know about JSONL, trees, or forking. That's all `SessionManager`.

The real flow:
```
SessionManager.open(file)
  ↓ reads JSONL, builds index by id
  ↓ offers tree navigation (getBranch, getEntry, etc.)
  ↓ offers write operations (appendMessage, etc.)
  ↓
AgentSession wraps Agent + SessionManager
  ↓
Agent.prompt() gets messages from sessionManager.getEntries()
  ↓
Agent calls LLM, streams back response
  ↓
AgentSession.prompt() completes
  ↓
sessionManager.appendMessage() writes response to file
```

If you're building a tool that spins agents, you're really building on top of SessionManager, not Agent.

**Concurrency is safe**

Multiple agents can run simultaneously because:
- Each has its own SessionManager (different JSONL files, no contention)
- Credentials are protected by file locks in `AuthStorage.withLockAsync()`
- No shared mutable state

This is why spinning multiple agents in parallel works: each opens a forked session (independent file), calls `createAgentSession()`, and runs `prompt()` in `Promise.all()`. The auth.json lock serializes credential access, but file I/O has no conflicts.

**Tree navigation (/tree) vs forking (/fork)**

`/tree` (navigateTree):
- Changes the "leaf pointer" (current position in tree)
- Stays in the same JSONL file
- All branches visible in one file
- Good for "quick what-if" exploration

`/fork` (createBranchedSession):
- Creates a new JSONL file
- Copies entries from root to fork point
- Sets parentSession link
- Good for "save this thread" or "spin a parallel agent"

The confusion: both feel like branching. One is a pointer move (cheap). One is a file copy (still cheap, but different semantics).

**Extensions don't need to know about this**

An extension that spawns a sub-agent doesn't need to call fork(). It just:

```typescript
const { session } = await createAgentSession({
  sessionManager: SessionManager.open(sessionFile, cwd),
});
await session.prompt(question);
```

The sub-agent inherits the full context (because the session file already has the history). If you want isolation, fork first; if you want shared context, reuse the same session file.

**Immutability is the constraint and the strength**

You can't edit a message. You can't rewrite history. This means:
- No merge conflicts (forking is copy-on-write)
- Exact replay (walk the JSONL)
- Safe concurrent agents (no dirty reads)
- Forensics (who said what, when, why)

The tradeoff: if an agent makes a mistake and you want to "fix it," you don't fix it. You fork and try again. The mistake is preserved in the original thread.

---

## tree browser

**Status**: ~/other/pi-mono is on feature branch `rpc-browsing-surface` (dnouri/pi-mono) paired with `browser` branch of ~/other/pi-coding-agent/ (dnouri/pi-coding-agent).

⟝ audit and remove if unnecessary.

It adds:

**Tree Browser** (`C-c C-p` then `w` in Emacs):
- Visual branch structure of current conversation
- Active path highlighted; abandoned branches dimmed
- Five filter modes (cycle with `f`): no-tools (default), default, user-only, labeled-only, all
- `RET` navigates to branch point; `S` navigates with branch summarization
- Label nodes with `l`, search with `/`
- `C-c C-k` aborts in-flight summarization
- Help menu with `?` or `h`

**Local installation**:
- `~/other/pi-mono` checked out to `rpc-browsing-surface` branch
- `~/other/pi-coding-agent` checked out to `browser` branch
- Built and installed globally: `npm install -g ./packages/coding-agent`
- Doom config points to local pi-coding-agent via `:local-repo` in packages.el

**Integration notes**: Both buffers use magit-section for point-centric dispatch. Requires new RPC commands (list_sessions, get_tree, navigate_tree, set_label, abort_branch_summary) now on rpc-browsing-surface. Once merged to main, revert to standard npm install and remove local branches.

## getting started

**Installation**: All packages at @mariozechner scope on npm. Lockstep versioning (all same version).

**Local development**: Fork pi-mono, yarn install, build pipeline (TypeScript + esbuild).

**Key docs**:
- packages/ai/README.md ⟜ Provider table, API surface
- packages/coding-agent/docs/extensions.md ⟜ Full extension system (59KB, comprehensive)
- packages/coding-agent/docs/session.md ⟜ Session format & API (JSONL, branching, compaction)
- packages/coding-agent/docs/sdk.md ⟜ Programmatic SDK use (not just TUI)
- AGENTS.md ⟜ Development rules, tool contract, releasing
- `~/mg/buff/session.md` ⟜ Session architecture card — entry types, naming API, practical patterns (local, more complete than upstream docs)

**Examples**: packages/coding-agent/examples/extensions/ (summarize.ts, snake.ts, etc.)

---

## why it matters

pi-mono is the reference implementation of the agent architecture patterns described in mg. It's battle-tested (used in production), extensible, and philosophically aligned. Understanding pi-mono means understanding how to build scalable agent systems that don't fall into baked-in feature hell.
