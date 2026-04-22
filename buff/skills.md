# Pi Skills & Agent Orchestration

⟝ Skills search: identify instructional content and orchestration patterns for pi agents

## General content sources

Where to look for high-quality, instructional content:
- https://pi.dev/packages — Current universe (check if comprehensive vs Claude skills)

## Functional Clustering of Pi Packages

Most packages solve one of these problems:

1. **Browser/web interaction** (pi-studio, pi-web-access, browser tools)
2. **Agent orchestration** (pi-subagents, taskplane, pi-teams)
3. **Code analysis** (pi-lens, language-specific tools)
4. **Search/research** (pi-web-access, greedysearch, web search)
5. **Memory/context** (pi-memory, context-pruning)
6. **UI/workspace** (pi-studio, glimpseui)

## Suspiciously Missing Patterns

- **Chat interface automation** (greedysearch-pi hints at it, but not explicit)
- **Local LLM orchestration** (some web search, but nothing local-native)

## Relevant Existing Tools

- **pi-web-access, greedysearch-pi, pi-studio** — Partial overlaps, web-focused
- **pi-subagents + browser-chat** — Could form tight orchestration pair
- **pi-oracle** (https://www.npmjs.com/package/pi-oracle) — Suspiciously missed in searches

## Action Items ⟝

⟝ Upgrade skills in multi-agent orchestration
⟝ Provide agents with ability to use interactive tools (pi, cabal repl, anything needing stdin/stdout/stderr)
⟝ Improve functional programming skills / capabilities
⟝ Find out what others do (pi ecosystem survey)
⟝ Explore obsidian-skills: https://github.com/kepano/obsidian-skills (skill/knowledge pattern matching for structured learning)

## Questions

- How comprehensive is pi.dev/packages versus full Claude skills universe?
- What makes pi-oracle invisible to agent searches? (Investigation needed)
