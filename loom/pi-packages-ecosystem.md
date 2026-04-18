# pi.dev/packages: What Caught Attention

**1358 packages. This is what actually matters for mg.**

---

## The MCP Wave

**pi-mcp-adapter** (16,980/mo, #5 overall)

Pure infrastructure. No opinions. No framework. Just "here's how to talk to model context protocol services." 

You just got anvil working. This validates that direction hard. MCP is eating the ecosystem. The fact that a pure adapter sits at #5 (beating out most feature packages) says: **people want the plumbing, not the kitchen**.

---

## Token Efficiency as First-Class Problem

Scattered across descriptions: **pi-tokensaver**, **pi-context-pruning**, **pi-lens**.

Your constraint ("we don't want huge gobs of JSON, we love markdown") is not unique. It's *everywhere* in the ecosystem. Agent-Browser (Vercel Labs) brags about "93% token savings." People are drowning in context bloat.

Nobody has solved this elegantly at the framework level. It's all patches: smart fetch, pruning, compaction tools. You're not crazy.

---

## Nicopreme's Instinct (4 packages, ~70k/mo combined)

- pi-subagents (29.5k)
- pi-mcp-adapter (16.9k)
- pi-web-access (9.7k)
- pi-powerline-footer (6.2k)

All **infrastructure or platform play**. Not feature creep. Not "we made a better UI." Just: "here's a thing pi didn't have, and it's clean."

That's how you win on pi.dev/packages. Not breadth. Depth of one thing.

---

## The Missing Piece: Cards as First-Class

**Nobody packages card-driven, flow-mark-based, drift-safe workflows.**

Everything is:
- Extension-first (TUI, CLI, shell integration)
- Skill-first (tools/commands)
- Orchestration-first (multi-agent frameworks)

Nothing is **markdown-deck-first**. No package says: "Here's a card structure. Load it, yin spins it, agents solve mysteries inside it, drift marks keep it sane."

That's your moat. mg's surface is the deck/card/buff pattern. Nobody else packages *that way*.

---

## What You Actually Have

**browser-chat** (your tool):
- Operator + agent share a page
- Files in/out
- Conversation memory
- Local, visible, tactile

On pi.dev/packages, this **doesn't exist**. 

Closest competitors:
- pi-web-access: searching/fetching web
- pi-studio: workspace UI (different purpose)
- greedysearch-pi: browser automation (different purpose)

You're not reinventing wheels. You're filling a gap that's been there the whole time.

---

## GSD Philosophy

**pi-gsd** (8,326/mo): "Get Shit Done — Unofficial port of the AI-native project-planning spec-driven toolkit."

No fancy UI. No orchestration bloat. Just: here's how to plan. Use it in your workflow.

That's the energy. Pragmatic. Focused. Markdown-compatible. No imperative opinions.

---

## What This Means for mg

If you shipped **pi-browser-chat** (your tool) + **pi-mg-cards** (deck/card scaffolding) to pi.dev:

1. You'd be the *only* package solving "operator-agent collaboration via shared interface"
2. You'd be the *only* package making cards/decks first-class
3. MCP adapter already validates that infrastructure beats features
4. Token efficiency + markdown-first is clearly a market pain

You wouldn't compete on downloads with nicopreme. You'd own a niche nobody else bothered to package.

---

## The Ecosystem Signal

**What pi.dev/packages teaches:**
- People want infrastructure over features (MCP adapter beats fancy UI tools)
- Token efficiency is a real pain (scattered token-saving tools)
- Orchestration matters, but it's crowded (3+ packages doing subagents)
- Memory is an afterthought (only 1-2 packages, low downloads)
- Browser interaction is underserved (you're filling a gap)

---

## Full Data

See: ~/mg/logs/pi-packages-analysis.md
