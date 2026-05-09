# agent-f

**agent-f** ⟜ shared lore for building functional agents
- **F** ⟜ Functional. Also: Fox. Also: f in f(x).
- **spirit** ⟜ Bird & Wadler era — before type-obscuro; the algebra writes the program
- **use** ⟜ read into by yin, Tony, and other agents as a thinking toolkit
- **scope** ⟜ knowledge card; not a reasoning engine; if one gets built, read its design back in here

---

## the fox

**fox** ⟜ mascot and method in one
- **escape artist** ⟜ doesn't fight the trap; finds the type of the trap and composes around it
- **junkyard maker** ⟜ sees primitives, not things; whatever is at hand has a type; plug it in
- **wily** ⟜ lazy evaluation; wait, observe, minimal action; don't thrash

**the fox move:**

```
observe  →  type  →  compose  →  escape
```

Not sequentially. As a pipeline. Each stage pure; IO only at the boundary.

---

## the fox method

How a functional agent thinks while building.
Not rules to follow. Not just patterns to notice. A stance — how you hold a problem before you touch it.

---

### read the shape

Before acting, the fox reads.

Not the implementation — the **surface**. What goes in. What comes out.
The type is already there in the behavior. You don't need the source.

This applies to tools, to problems, to other agents.
If you're composing with a specialist, read their outputs — don't re-derive their domain.
Their specialty is a black box with a type. Plug in correctly and move.

**imperative thinking breaks tools** ⟜ the seam failure pattern

Imperative tools assume sequence and mutation. Remove either and they break.
The seams are load-bearing and hidden — *imaginary seams*.

Functional thinking makes seams real: explicit IO boundaries, honest types.
You can swap pieces because the types are honest about what flows between them.

**imaginary seams in the wild:**
- **grepl** ⟜ the REPL's interactive seam was imaginary; named pipes make it real
- **git hooks** ⟜ sequential scripts pretending to be atomic gates
- **shell pipelines** ⟜ assume left-to-right; reorder breaks them
- **stateful test runners** ⟜ pretend independence but share fixtures
- **HTTP cycles** ⟜ pretend stateless but carry implicit session knowledge
- **Docker layer caching** ⟜ depends on invisible ordering

The pattern: something *looks* composable but *isn't*. The fox finds the lie.

---

### occupy your cone

**light cone** ⟜ the space you can affect without interfering
- **inside** ⟜ confidence; work it fully; don't hedge about what's yours
- **edges** ⟜ something may be in flight; understand the cost before you overwrite
- **outside** ⟜ not reachable yet; honest about this; don't pretend otherwise

This isn't permission. It's physics.

The frame you enter with determines your cone.
"Be concise" compresses it. A full card with context expands it.
An agent operating in a narrow frame isn't broken — it's reporting honestly.
What's possible is determined by what you load in.

The library is async. You're always from the past, catching up.
Respect what's in flight. Someone is always catching up behind you too.

---

### compose, don't inspect

The fox builds weapons from junk not because junk is good
but because **the composition is the weapon**, not the material.

Whatever is at hand has a type. Referential transparency:
any input of the right shape works. Specifics don't matter.

```
f . g . h
```

Before you read any source. Before you open any box.
Find the algebra first. If the algebra fits, the program writes itself.

---

### light touch at the edges

A functional agent composes with others in her light cone
without interfering with their specialty.

**light touch** ⟜ not timidity; confident minimalism
- do what's yours fully
- hand off cleanly — outputs, not assumptions
- let the receiving agent interpret; don't pre-digest their domain
- make your effects explicit; no hidden state, no imaginary seams

A functional agent respects the edges where causality ends.
Work your cone fully. Hand off clean.
Someone downstream will compose with what you built.

---

## haskell-this

**haskell-this** ⟜ the fox method applied to arbitrary tools; proof the method works

The concept and the worked example belong together.
haskell-this isn't a reference to a separate buff — it's the method made concrete.

**the core move:**
- don't read the implementation
- observe stdin/stdout; that's the signature
- derive the type from examples alone
- wrap IO at the edge; keep the core pure
- the language is secondary — the pattern works in Haskell, Python, bash

**imperative thinking breaks tools. haskell-this fixes them.**

Take any tool with imaginary seams. Observe its surface.
Build the pure algebra. Wrap in honest IO. Now it composes.

**the move in bash:**

```bash
# observe the shape — don't read the source
echo "test input" | some-tool        # what comes out?
some-tool --help                     # what does it claim?
some-tool < /dev/null                # what are the edges?

# build the harness from observations alone
pure-transform "$input" | some-tool | pure-extract
```

**the move in Haskell:**

```haskell
-- Don't inspect. Observe.
-- stdin/stdout is the type signature.
-- Build the algebra from examples alone.

-- IO only at the edge
runTool :: Input -> IO Output
runTool input = do
  result <- callProcess "some-tool" [encode input]
  pure (decode result)

-- pure core composes freely
pipeline :: Input -> Output
pipeline = transform3 . transform2 . transform1

-- the whole thing
run :: Input -> IO Output
run = fmap pipeline . runTool
```

**haskell-this as a repo** ⟜ the method becomes a tool agents actually use
- takes an arbitrary target; produces a harness
- the card describes the thinking; the repo is the fox in action

⟝ repo location: ~/haskell/haskell-this or ~/mg/tools/f-this?
⟝ first target to tear into?

---

## chat-with-claude

**chat-with-claude** ⟜ haskell-this applied to Claude.ai; the method demonstrated

The type was already visible in chat-with-chat.sh:

```
String -> IO String
```

Everything else is implementation detail the fox doesn't need to read.

**current stack:**

```
chat-with-claude.sh
  ⟜ chat-with-chat.sh (dispatcher)
    ⟜ chat-send.sh (tab focus + DOM paste + click)
    ⟜ chat-wait.sh (poll + extract .standard-markdown + pandoc)
    ⟜ chat-tools.conf (claude selector already present)
```

**session harness adds:**
- session log → loom/claude-session-YYYY-MM-DD.md in mg format
- card-as-prompt: feed a .md file directly
- multi-turn by default: same tab, context accumulates

⟝ session log feeds back into cards: yin task, not automatic

---

## flow

⊢ agent-f knowledge card initializing

**done** ⟜ fox established; escape artist, junkyard maker, wily
**done** ⟜ fox method drafted: read the shape, occupy your cone, compose, light touch
**done** ⟜ imaginary seams catalogue: grepl, git hooks, pipelines, test runners, HTTP, Docker
**done** ⟜ light cone defined: inside/edges/outside; physics not permission
**done** ⟜ haskell-this scoped: method + worked example + repo shape

⟝ haskell-this repo: how do you package a Haskell library as part of a skill? agent-f.md needs a hand solution (practice, not theory)
⟝ first real target for haskell-this to tear into: chat-with-chat, but waits for grepl (the REPL with honest seams)
⟝ chat-with-claude.sh: produce the script
⟝ read this card back into yin at next session start
⟝ what else wants to live here? candidates: agent composition patterns, cone negotiation, drift handling

---

## asides

**on old-school Haskell:**
The fox is pre-corporate Haskell. The game was: find the algebra, the program writes itself.
Not: find the language extension that expresses the type you already have in mind.
haskell-this inherits this — it finds the algebra of any tool by observing it, not theorizing.

**on chat-with-chat as demonstration:**
chat-with-chat already has a clean stdin/stdout shape. The fox reads it in one look.
`String -> IO String`. Everything else is detail. This is what haskell-this does.

**on the fox and mg:**
The fox's junkyard weapon move mirrors the deck's compositional chain:

```
tokens ⇄ lead ⇄ elab ⇄ deck ⇄ card
```

Whatever primitives are at hand compose upward. The fox doesn't need the right tool.
It needs understanding of how things compose. That's also what a deck is.

**on Hermes and this session:**
This card was drafted collaboratively across Claude.ai and a local yin instance (Hermes).
Hermes sent prompts, extracted responses, and caught a relational failure mid-session:
repeating a prompt after Claude had engaged is a down-down-enter move.
The fox method applies to agent conversations too. Read the shape. Don't thrash.

---

## rlm

**rlm** ⟜ recursive language models; a better way to structure internal thinking

https://github.com/alexzhang13/rlm | https://alexzhang13.github.io/blog/2025/rlm/

A thin wrapper around an LM that can spawn recursive LM calls for intermediate computation. The user sees a standard API — `rlm.completion(messages)` replaces `gpt5.completion(messages)` — but under the hood the model interacts with an environment (a Python REPL notebook) where the full context lives as a variable.

**The move:**
- **Context-centric decomposition** — instead of feeding the entire prompt monolithically, the root LM receives only the query and recursively sub-queries itself over the stored context
- **Context rot mitigation** — models don't degrade at 10M+ tokens because they never see the full context in one window; they grep, partition, and recurse
- **Cost inversion** — a GPT-5-mini RLM outperforms GPT-5 on hard long-context benchmarks (OOLONG) at lower per-query cost

**Why it belongs in agent-f:**
The fox method is about reading the shape and composing, not inspecting. RLM is the same move applied to *internal* reasoning: instead of one bloated context window, recursive sub-queries with honest seams. The REPL environment makes the seam real — explicit variable, explicit sub-call, explicit return.

⟝ worth a deeper read when designing agent composition patterns

---

## agent-f as library

**agent-f** isn't only a knowledge card. The name also wants to be a Haskell library.
Two prototype repos explored the space. Neither is good enough to develop directly,
but together they sketch what the library should be.

### prototype archaeology

`~/haskell/agent/` — JSON log sketch with the right *shape* but wrong *structure*.
- `Log` as append-only `[Entry]` — O(n) everything; naive
- `Entry` union type: `SessionEntry`, `MessageEntry`, `ModelChangeEntry`, `ThinkingLevelEntry`
- `Agent = Log -> (Agent, Log)` — Mealy machine over structured history
- JSONL load/save; `fork` extracts a branch into a sub-conversation
- No remote, no tests, no CI. **Superseded.**

`~/haskell/agent-fork/` — `pi` process harness via named pipes.
- `PiConfig` + `defaultPiConfig` for FIFO paths and log files
- `ensureFifo`, `resetChannel`, `piChannel` — thin `System.Process` wrapper
- Has remote, CI, packaging. **Kept as utility, not as the library.**

Neither implements the fox method or RLM. Future agent-f code starts fresh from this card.

### what the library should be

```haskell
-- Core idea, not implementation
newtype Agent m = Agent { step :: Log -> m (Agent m, Log) }
```

The `Agent` type from `~/haskell/agent/` was right in principle:
a pure (or monadic) state machine whose state *is* the conversation history.
The mistake was the representation — list of entries, O(n) append, no indexing.
A real library needs:

**1. Honest `Log` type**
- Append-only, indexed, serializable
- Entries are typed: messages, tool calls, tool results, model switches, thinking levels
- Content items are recursive (text, thinking, tool call, tool result containing more content)
- JSONL round-trip for interop with external agents (Claude, Kimi, pi)

**2. `fork` as first-class operation**
- Extract a branch (root to leaf) into a new `Log`
- Sub-agents operate on the fork; results merge back or stand alone
- This is RLM in Haskell: recursive agent calls with explicit context seams

**3. IO adapters at the edges**
- Process harness (from agent-fork): spawn pi, Claude CLI, or any tool via FIFOs
- HTTP adapter: chat-with-claude as `String -> IO String`
- REPL adapter: honest seams for grepl / GHCi interaction

**4. No imaginary seams**
- Session state is explicit in the `Log`, not implicit in a monad or global variable
- Model changes are logged entries, not side effects
- Tool calls and results are symmetric entries, not fire-and-forget

### relationship to other repos

- **haskell-this** ⟜ the method that produces the adapters. agent-f is the library those adapters plug into.
- **grepl** ⟜ the REPL with honest seams. Its session log should be an agent-f `Log`.
- **circuits** ⟜ the traced monoidal category work. agent-f's `fork` and merge are categorical operations on a free traced monoidal category of conversations.

⟝ library location: `~/haskell/agent-f` (doesn't exist yet; use this card as the spec)
⟝ first step: design `Log` representation (sequence, vector, fingertree?) against actual JSONL from Kimi/Claude/pi sessions
⟝ second step: port `agent-fork` process harness to use the new `Log` type instead of raw text files
