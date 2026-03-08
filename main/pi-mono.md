# yin/pi-mono ⟜ understand pi-mono and packages

## broad picture

pi-mono is a TypeScript monorepo containing tools for building AI agents and managing LLM deployments. Seven packages coordinated under lockstep versioning (all share same version number):

- **@mariozechner/pi-ai** ⟜ unified multi-provider LLM API (OpenAI, Anthropic, Google, Amazon Bedrock, Mistral, Groq, etc.)
- **@mariozechner/pi-agent-core** ⟜ agent runtime with tool calling and state management
- **@mariozechner/pi-coding-agent** ⟜ interactive terminal coding harness with extensibility
- **@mariozechner/pi-tui** ⟜ terminal UI library with differential rendering
- **@mariozechner/pi-web-ui** ⟜ web components for AI chat interfaces
- **@mariozechner/pi-mom** ⟜ Slack bot that delegates to pi coding agent
- **@mariozechner/pi-pods** ⟜ CLI for managing vLLM deployments on GPU pods

Core thesis: aggressive extensibility means a minimal core. Features come via extensions, skills, prompt templates, themes, or pi packages (shared via npm/git). This is philosophy, not accident.

---

## investigation priorities

✓ ⊢ [broad-understanding](broad-understanding.md) ✓ ⊣
  ⟜ read and summarize each package README
  ⟜ understand the layered architecture

✓ ⊢ [sessions-agent-core-spinning](sessions-agent-core-spinning.md) ✓ ⊣
  ⟜ sessions as JSONL trees with branching in-place
  ⟜ pi-agent-core: tool loop orchestrator with events
  ⟜ agent spinning as extension pattern (spawning sub-agents)
  ⟜ 5 implementation patterns with code

⊢ [skill-system](skill-system.md) ⊣
  ⟜ what is a skill in pi terms
  ⟜ how skills are loaded and activated
  ⟜ skill semantics: @agentskills.io standard
  ⟜ skill examples to understand patterns

⊢ [extension-system](extension-system.md) ⊣
  ⟜ what can extensions do (tools, commands, UI, handlers, etc.)
  ⟜ extension lifecycle and registration
  ⟜ how to build custom extensions
  ⟜ extension examples in packages/coding-agent/examples/extensions/

⊢ [pi-packages](pi-packages.md) ⊣
  ⟜ pi package format and structure
  ⟜ bundling extensions, skills, prompts, themes
  ⟜ distribution via npm and git
  ⟜ pi install/remove/list/config commands

⊢ [package-breakdown](package-breakdown.md) ⊣
  ⟜ deep read of each package README
  ⟜ understand type signatures and responsibilities
  ⟜ api surface and integration points

⊢ [markdown-general-imports](markdown-general-imports.md) ⊣
  ⟜ what ideas from pi-mono transfer to markdown-general
  ⟜ extensions as cards? skills as cards? theme patterns?
  ⟜ flow encoding in action across multiple agents
  ⟜ session-like constructs for context persistence

⊢ [exploration-directions](exploration-directions.md) ⊣
  ⟜ MCP integration patterns
  ⟜ sub-agent spawning strategies
  ⟜ custom provider patterns
  ⟜ advanced compaction and summarization
  ⟜ permission gates and sandboxing

---

## reading strategy

Start with **broad-understanding**, which reads all package READMEs in parallel and builds a map. Then follow the priority list depth-first through the flow. Each card contains specific reading assignments and synthesis.

The monorepo docs are rich:
- `packages/coding-agent/docs/` ⟜ 59KB extensions.md, 31KB compaction.md, 27KB sdk.md, 16KB custom-provider.md
- `packages/ai/README.md` ⟜ provider table, API coverage, type signatures
- `AGENTS.md` ⟜ development rules, adding providers, releasing, tool rules

---

## context at hand

- `.pi/` directory exists at repo root (pi's own config)
- Multiple example extensions in `packages/coding-agent/examples/extensions/`
- Custom provider examples: with-deps, custom-provider-anthropic, custom-provider-gitlab-duo, custom-provider-qwen-cli
- biome.json for linting, tsconfig.base.json for TypeScript, husky for git hooks
- Version 0.0.3, Node 20+ required, TypeScript + esbuild build pipeline
