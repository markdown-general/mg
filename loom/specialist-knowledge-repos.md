# Specialist Knowledge Repos Pattern

**Model:** qodex-ai/ai-agent-skills (Anthropic's Agent Skills library)  
**Example Focus:** multi-agent-orchestration skill

---

## Structure

### The Repo (Top Level)
- **skills/** — Individual skill folders (each self-contained)
- **spec/** — Agent Skills specification (standard format)
- **template/** — Starter template for new skills

### Each Skill (e.g., multi-agent-orchestration/)

```
multi-agent-orchestration/
├── SKILL.md                           # Main docs (patterns, concepts, philosophy)
├── examples/
│   ├── orchestration_patterns.py      # Sequential, parallel, hierarchical, consensus
│   └── framework_implementations.py   # CrewAI, AutoGen, LangGraph, Swarm templates
└── scripts/
    ├── agent_communication.py         # Message brokers, shared memory, protocols
    ├── workflow_management.py         # Workflow execution, optimization
    └── benchmarking.py                # Performance metrics, agent effectiveness
```

---

## Why This Structure Works for mg

### 1. Not Meant to Be Installed
The skill is a **reference library**, not a framework to import. You read it, cite it, adapt it. This matches your constraint: "don't give me code to run, give me patterns to understand."

### 2. Documentation + Examples Together
- **SKILL.md** explains the concepts (orchestration patterns, communication protocols)
- **examples/*.py** show concrete implementations (how each pattern works in code)
- Together they're self-contained; separately they're both useful

### 3. Patterns Over Frameworks
The skill doesn't say "use CrewAI" or "use LangGraph." It shows:
- 6 orchestration patterns (sequential, parallel, hierarchical, consensus, adaptive, DAG)
- 4 framework implementations (choose one based on your needs)
- Communication patterns (direct, tool-mediated, manager-based, broadcast)

This is **pragmatic guidance**, not gospel.

### 4. Modular Python Code
The scripts/ utilities (MessageBroker, WorkflowExecutor, TeamBenchmark) are:
- **Importable** if you want to use them
- **Readable** if you want to understand and adapt them
- **Independent** — each addresses one concern (communication, workflow, metrics)

This keeps token cost low while maintaining full functionality.

### 5. Ready-to-Cite
When you're designing your yin/card topology and need multi-agent patterns, you can:
- Read SKILL.md to understand options
- Reference specific patterns by name ("use hierarchical orchestration")
- Point to examples as proof of concept
- Adapt code as needed for your system

---

## The Broader Pattern (What You're Hunting)

Find repos structured like this **for other domains you don't have strong opinions on**:

### Candidates
- **TypeScript idioms** — patterns, anti-patterns, type system tricks
- **Haskell composition** — monad patterns, category theory applications, common libraries
- **Prompt engineering** — patterns for different agent tasks (research, code review, planning)
- **Design systems** — color theory, typography scales, component rules
- **Git workflows** — branching strategies, merge patterns, conflict resolution
- **Error handling strategies** — across languages/frameworks
- **Testing patterns** — unit, integration, property-based, fuzzing

### What Makes One "Good"
✓ Self-contained (folder or repo)
✓ SKILL.md / README explaining *why* not just *how*
✓ Concrete examples or templates
✓ Pattern catalog (not one "right way")
✓ Modular code if present (not monolithic framework)
✓ Citable and quotable

---

## How to Use Them in mg

### As a Card
```
design/multi-agent-topology ⟜ orchestration patterns

reference ⟜ qodex-ai/ai-agent-skills/skills/multi-agent-orchestration

candidates ⟜ yin coordinates field agents
  pattern ⟜ hierarchical (one coordinator, specialists report back)
  communication ⟜ shared memory (logs/)
  metrics ⟜ track agent effectiveness

next ⟜ implement WorkflowExecutor + TeamBenchmark
```

### In Decision Making
When designing a new card that involves multiple agents:
- Read the multi-agent-orchestration SKILL.md
- Choose a pattern that fits your topology
- Reference it in the card
- Adapt the examples as needed

### In buff/
```
buff/multi-agent-patterns.md
- Sequential: one task at a time
- Parallel: simultaneous agents
- Hierarchical: manager + specialists (fits yin model)
- Consensus: agents debate
```

---

## The Meta Pattern

You're building a **library of libraries**:
- buff/ = mg-specific patterns (your innovation)
- core/ = mg scaffolding (cards, yin, decks)
- specialist-repos/ = external knowledge (ui-ux, multi-agent, haskell, etc.)

The specialist repos stay external (in your notes, bookmarks, logs/). You don't import them wholesale. You cite them, adapt them, integrate them into your cards.

This is the opposite of "install packages." It's "maintain a reading list."

---

## Next Hunt

Find similar repos for:
1. **TypeScript patterns** (idioms, anti-patterns)
2. **Haskell composition** (monad patterns, category applications)
3. **Prompt engineering** (agent task patterns)
4. **Design systems** (if you're tired of inventing color schemes)

Criteria: self-contained, patterns > frameworks, citable, modular code.
