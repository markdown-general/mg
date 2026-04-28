◊

# skills-surfacing ⟜ agent discovery and progressive learning

**Problem:** Skills exist in multiple places (mg/skills/, ~/.agent-loadout/) but agents don't automatically know how to find or use them. How do we surface reusable knowledge to agents in a discoverable, progressive way?

**Scope:** Two skill repositories (mg curated knowledge + agent-loadout tools), single agent system (pi), exploration of best practices.

---

## Tasks

🟣 ⧈ subagent brew install ⟜ test subagents capability

⟜ spin background Explorer agent to `brew install` all ~/.agent-loadout/ tools
⟜ report back with install status, any failures, time taken
⟜ validates subagents package works + gives us a clean ~/ environment

🟣 ⧈ explore agent-loadout capability

⟜ understand how ~/.agent-loadout/skills/ metadata (YAML, SKILL.md) differs from mg/skills/
⟜ test agent discovery of both repos (can agent find and use skill files?)
⟜ assess tool value: which 10-15 are most useful for our workflow?
⟜ check compliance: is agent-loadout agentskills.io standard? does mg/skills/ need adjustment?

🟣 ⊲ r&d best practice discovery ⟜ how agents learn skills

⟜ survey: what patterns exist for skill loading? (env vars, config files, prompt injection, extension?)
⟜ test: can pi load skills/ directly? do we need a skill discovery tool?
⟜ progressive: how do agents gradually discover and adopt skills from a repository?
⟜ standardize: converge on one pattern for both repos

---

## Open Questions

- Should ~/.agent-loadout/ be copied into mg/skills/ or kept separate?
- Do we need a skill-discovery tool for agents, or should skills be injected into system prompts?
- How do agents prioritize skills? (all available, curated subset, learned over time?)
- Is agentskills.io standard complete, or should we extend it?

---

## Session Context

⟜ grepl-convo.md contains 92KB session on circuits/REPL/agent interaction — needs vcc_recall extraction for design insights
⟜ agent-loadout repo: https://github.com/conorluddy/AgentLoadout (57 tools, well-documented)
⟜ reference: https://agentskills.io/home (skills standard)
