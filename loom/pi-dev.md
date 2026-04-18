When we look for general, high-quality, instructional content:

⟝ where should we look.

  https://pi.dev/packages
  
  Is this too small a universe versus claude skills?

⟝ upgrade skills in multi-agent orchestration 

⟝ provide agents with an ability to use interactive tools (pi is the prime example but cabal repl also as an alternative - anything that need stdin/stdout/stderr)

⟝ functional programming skills

⟝ improve our capabailities as much as we can as fast as we can

⟝ Find out what others do.

⟝ categories of tools:

### Functional Clustering
Most packages solve one of these problems:
1. **Browser/web interaction** (pi-studio, pi-web-access, browser tools)
2. **Agent orchestration** (pi-subagents, taskplane, pi-teams)
3. **Code analysis** (pi-lens, language-specific tools)
4. **Search/research** (pi-web-access, greedysearch, web search)
5. **Memory/context** (pi-memory, context-pruning)
6. **UI/workspace** (pi-studio, glimpseui)

### What's Suspiciously Missing
- **Chat interface automation** (greedysearch-pi hints at it, but not explicit)
- **Local LLM orchestration** (some web search, but nothing local-native)

Your tool (browser-chat) solves: "operator + agent coordinating through a shared chat interface, passing files, reading history."

On pi.dev/packages:
- pi-web-access, greedysearch-pi, pi-studio (partial overlaps, web-focused)
- pi-subagents + your browser-chat could form a tight pair

⟝ https://www.npmjs.com/package/pi-oracle

How did agents miss this in search?



