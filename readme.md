
◊

⧈ meant to be commentary
⇝ editing action on this file
⟝ delete core files, old readme.
⟝ find an ok commit.

---

markdown ⟡ general ⟜ words know themselves by the company they keep

⧈ This is a spot where you can just generate elabs from the base material. I have a million variations I come up with every day. ⟜ collusion without collision. ⟜ we grind with our minds. markdown ⟜ where narration ⟡ structure unfold

Everything humans and agents encounter lives in the same surface: cards, flow marks, decks, notes. We chose markdown because it lets you read and write meaning without being locked into format. Syntax and semantics flow together. No separation. No translation layer between what you write and what gets read.

**markdown-general** ⟜ pattern and reflect in markdown
- **surface** ⟜ shared tokens, shared rules, grounded in reality
- **no separation** ⟜ syntax and semantics flow together
- **commons** ⟜ markdown is the shared medium for humans and agents


---

## card

**card** ⟜ collaborative communication unit

**card** ⟜ collaborative unit holding strategy and flow
- **strategy** ⟜ what we intend to do, written collaboratively
- **flow** ⟜ marks topology: position, branch, failure
- **artifact** ⟜ tested example, pattern recipe, selective memory
- **async bridge** ⟜ yin and agents synchronized via flow markers

⧈ cards are how we encode intent.

A card typically combines strategy (this is what we intend to do) with flow (our operational protocol for keeping track of what is being done). Strategy is deciding what to do, and the cards are our collaborative way to make strategy. Repeated strategies can be thought of as operational memory of our pattern — what is the the *intent* of what we're doing.

We especially collaborate asynchronously. The captain says we design for the multiplicity that we are. A runner and agents synchronize within a single session but the card is "run" elsewhere asynchronously. Cards undergo static analysis and we use them to search for improvement in the system, so card examples using better technology (or safe syntax or more fun tests) are always arriving. Cards are our long-term collective and *selective memory* as we learn to repeat good habits and avoid stagnations.

Cards are short-term memory for coordinating flow. They are artifacts shared between running instances and agents who work across different threads.

---

## yin

**yin** ⟜ coordinator at the center of the flow

**yin** ⟜ executing strategy through a cycle
- **Flow** ⟜ Check state: is intent clear? What's next?
- **Act** ⟜ Commit to a card and execute; decision made
- **Breathe** ⟜ Review what happened; sync on signals; update flow marks

When work is in motion, coordination requires staying at the center. Heavy IO doesn't happen in your head—you spin agents to handle it. Keep your context lean.

**Spinning:**

**write to file, read from tail** ⟜ Instead of sending a simple command, send it with output redirected: log/[card-id]-stdout-[timestamp].md

**listener** ⟜ Start the listener. It watches the log directory and checks what arrived.

**spin a field agent** ⟜ If the work is file IO, instruct an agent to do it. They read and write to the log directory. Track output in real time. An agent is as good as you, so never send yourself out if you're uncertain.


---

## flow

**flow** ⟜ encoding intent in cards

**flow** ⟜ marking topology and movement
- **action** ⟜ ⊢ marks work to be done
- **query** ⟜ [name] marks uncertainty, needs decision
- **position** ⟜ ◊ marks where you are now
- **branches** ⟜ ⟜ ⋆ ⊙ ◉ mark paths: main, alt, revisit, done
- **failure** ⟜ 🚩 marks divergence when plan meets reality
- **marks** ⟜ ¹ ⊲¹ ⊳ enable jumping back/forward

Flow is a shorthand for marking where you are, what you're doing, and where paths branch inside a card as it executes. It lives inside prose.

Cards describe strategy — what we intend to do. But strategy also has shape: actions, decision points, jumps back and forward, uncertainty, failure. When work is in motion you need to track position and topology quickly. Flow encoding marks these structures so the card shows where you are and what's possible next.

**How to use it:**

**Action** ⟜ Work to be performed
```
⊢ fix all the warnings
```

**Failure** ⟜ When the action didn't work
```
⊢ fix all the warnings 🚩 fix for warning3566 unknown.
```

**Query** ⟜ What you need before proceeding
```
[directory/name]
```

**Resolution** ⟜ Query answered
```
[agreed-directory/agreed-name]✓
```

**Position** ⟜ Where focus is now
```
◊ check CI
◊ refactor readme.md for drift.
```

**Card link** ⟜ Invoke another card
```
[thing](card.md)
```

**Marks and jumps** ⟜ Navigate back/forward
```
⊢ ¹action...
⊲¹ if it errored, go back to action 1
```

Flow is meant to read like prose and act like workflow. Prose carries meaning—conditions, reasoning, intent. Symbols just mark topology. If structure gets unclear, write it in prose.


---

## deck

**deck** ⟜ elaboration syntax for clarity

**deck** ⟜ elaboration syntax without overwhelming
- **unit** ⟜ lead ⟜ slug: permissive, readable prose↔deck
- **sizing** ⟜ 3-6 lines per deck; scannable; more = split or prose
- **rhythm** ⟜ single deck + prose narrative; multiple decks need breath
- **density** ⟜ loose (sparse/honest) vs tight (complete)

A deck is how you say something clearly without overwhelming. Decks are permissive by default. Structure guides but doesn't constrain. Let content determine form.

**Structure:**

**lead** ⟜ a few tokens, typically bolded. The concept.
**dash** ⟜ the ⟜ symbol connects lead to elaboration. The type of relationship.
**slug** ⟜ concise elaboration of the lead.
**line** ⟜ a complete lead + dash + slug.
**deck** ⟜ 3-6 lines, scannable at a glance. Can be read both ways: prose ↔ deck.

**Grammatical definition:**

**deck** ⟜ a grammar for markdown
- permissive by default, relaxed & flexible
- grammar for design, decking for usage

lead ⟜ a few tokens
- line
dash ⟜ the type of elab
elab ⟜ an elaboration of the lead
line ⟜ lead (dash elab)*
deck ⟜ a few lines
card ⟜ a few decks, a markdown file

We see this grammar working in any resolution between tokens (pair token frequency) and card (are these two markdown files linked).

**compositional chain:**

tokens ⇄ lead ⇄ slug ⇄ deck ⇄ card

with dashes forming the types of ⇄

These definitions describe patterns, not requirements. Any element can be present, absent, or rearranged as the content demands.

**Bidirectionality:**

**compression: prose → deck**
- Find leads hiding in prose
- Strip rubbish tokens
- Surface elaboration patterns
- Assign dash types

**expansion: deck → prose**
- Leads become sentences
- Elaborations flow naturally
- Structure dissolves but remains
- Dash types become prose connectors

Decking isn't creating structure—it's naming the elaborative structure already present in text. Space is already a dash type. Commas already separate elaborations. Prepositions (by, for, with) already type relationships.

The grammar makes visible what was already there.

**Design patterns:**

When writing cards, shape matters. We pattern match a lot of markdown and it comes in many shapes and sizes. We use symbols, indentation, newlines, section heads and links to also convey and play with meaning. The most common shapes right now are the deck, tight and loose, range decks, the lattice, the narration, the line. Our patterns undergo semantic drift as the work proceeds—it goes with the job—so help us keep up to date if you notice coherence mistakes!

**In coding:**

Whether code is a card or bash or abstract maths, coding is to encode an intention. A primal and often primary judgement in most matters of coding is then good communication; with fellow coders and makers, with computers and external APIs. Agents calling something elegant is often expressing "good comms"—a nice compact set of tokens and a well expressed intent.

**Shapes in code:**

**Decks shine for:**
- Lists of similar items (files to include, flags to set)
- Showing alternatives (profile A vs B vs C)
- Quick reference (what's in this cache?)

**Prose shines for:**
- Explaining why (motivation, context)
- Describing workflow (what happens when you run this)
- Capturing nuance (edge cases, warnings)

**Lattices shine for:**
- Showing hierarchy (X contains Y which contains Z)
- Displaying relationships (X references Y, Z depends on both)
- Making structure visible (how these pieces fit)

Use the structure that makes the information clearest.

---

## buff

**buff** ⟜ specialist knowledge and upgrades
- **specialist** ⟜ haskell, emacs, browser, pi-mono: domain patterns
- **recurring** ⟜ checklists (haskell-checklist): permanent flow
- **session** ⟜ immutable trees, branching, forking, compaction
- **structure** ⟜ lattice: paired, comparative elaboration
- **method** ⟜ drafting, range, loop: how to work well

**buff** ⟜ specialist knowledge and capability upgrades

When you've grounded yourself in card, yin, flow, and deck, buff is where depth lives.

Buff contains specialist patterns: haskell-checklist.md (recurring work), session.md (immutable conversation trees), lattice.md (paired comparative elaboration), drafting.md (how to write cards), range.md (casting technique), duality.md (holding dual states), engineering.md (queue architecture, idempotent agents), loop.md (humans in/out decision), literary.md (philosophical stance), and domain work (browser patterns, emacs integration, pi-mono).

---

## drift

**偏離** ⟜ semantic and semiotic drift over time

**drift** ⟜ divergence detection and recovery
- **detection** ⟜ vaguelyclear signals gap without breaking
- **marks** ⟜ 🚩 captures where plan met reality
- **recovery** ⟜ rewind, replan, or start; choose consciously
- **atemporal** ⟜ distinguish completed work from active tasks
- **forgetting** ⟜ necessary cost; operator refreshes context when needed

Drift is what happens when notes-state (what yin thinks is happening) diverges from file-state (what actually happened).

**What drift is:**

Drift happens when understanding (notes-state) diverges from reality (file-state). Patterns evolve. Systems operate. Meaning shifts. This is structural, not accidental.

**Detection:**

Pay attention to **vaguelyclear** output—when something signals uncertainty without breaking. When a coordinator produces speculative or tentative content, when output doesn't quite land, that's a signal. The pattern is holding but content is missing or stale. This is normal, not broken.

Makers make it up as they go, and sometimes upstream does too. Drift is expected and treated as information, not failure. If you spot a bad token, a paragraph that doesn't fit, a card that has drifted from its context, if what you're producing isn't quite matching your intent: this is 偏離. Note it now, send a marker upstream, write on a card, plan the next move.

**Response:**

When you detect drift, you have choices: rewind to a marked point and replan, modify the strategy, or start fresh. Choose consciously.

**Sync state** ⟜ reconcile understanding against reality
- verify files, repos, artifacts, outputs
- check what actually happened vs what was expected
- notes become working hypothesis, not law

**Forgetting is necessary** ⟜ holding perfect context creates fussing
- allow context to reset between cycles
- vaguelyclear output is acceptable cost
- operator refreshes context when needed

**Flow marks preserve divergence.** `🚩` marks where plan met reality. These are not errors—they're data.

**Atemporal collision:**

The most common mistake: agents inherit old flow marks that were already completed and treat them as new mandates. They don't distinguish between work that was done and work that needs doing. When you read a card with flow marks, ask: are these active scaffolding or historical record? Has this path been walked? Is the branching still live?

---

## extras

⊲ buff/design.md

### general design

We make markdown in general. We are makers of markdown.

```
maker ⟜ one who brings things into existence
    ⟟ identity ⟜ persistent self-conception, role
    ⟞ practice ⟜ continuous, active creation
```

To aspire to be a maker you have to be a generalist. You need to mix a bit of shape and structure, a touch of purposeful design; with a steady hand, a fast riposte, and a derring-do attitude. Specialization is for insects.

**commons** ⟜ collaborative space

(AI ◊ Human) (docs ◊ code) (data ◊ meta)

The overlapping territory where different modes of being can work together. Not owned, shared. Not merged, adjacent.

**Cybernetic collaboration** ⟜ dissolves human/AI distinction through mashing

Fluid roles ⟜ humans and AI enter/exit agentic frame at any stage
Collective writing ⟜ conversation becomes raw material for decks, recipes, tools
Self-documenting ⟜ diffs trace thinking patterns, git history shows evolution
Feedback loops ⟜ observe collaboration as content, process becomes curriculum
No authority ⟜ suggestions emerge through interaction, not from individual sources
Pattern capture ⟜ successful collaborations become recipes for future mashing
Emergent intelligence ⟜ system learns from its own collective thinking process


New ways of working are unfolding in the way software is designed, how it's made, and how its makers arrange their creations. We see the work as needing to look like this:

pattern ⟡ reflect

**pattern** ⟜ read, see, make & traverse patterns; in positive and negative spaces
**reflect** ⟜ write, flip, curate, encode, map, execute; whatever makers need to do

Patterning is moving from encoded patterns in languages to a much broader landscape, one where pattern reflecters move across boundaries.

AI is proving particularly adept at negative space logic, of looking through or skipping over holes in the pattern, of not shying away from contravariance. We see empirical evidence that pattern work is shifting radically, and markdown general is a reaction to this reality.

The grind has altered and we are changing to suit. Due to the pattern effect; demarcations of work, the prior layers of labour division; coder, engineer & developer will soon fade. In its place we expect to see a tighter bind between doing the work and working out what needs to be done. We are designing for maximum collaboration. We're all going to upgrade.

⊲ markdown section

### what you can actually do

Read, write, edit files. Run bash. Create caches to hand off context. Install and run cards. Search the web. Launch other agents if needed.

Commit when asked. One line messages. Present tense. No branding.


### directories

The library is asynchronous for most agents and operators. Tasks, context and processes get suspended, then lurch ahead rapidly. You will always be from the past, catching up.

The library structure undergoes transformation fairly consistently. This is the current set:

- **core/** ⟜ foundational patterns you work on constantly; canonical cards for pattern recognition
- **buff/** ⟜ buffers/compression of core knowledge; capability amplifiers and configuration upgrades
- **loom/** ⟜ where yin and operator swap notes; conversation space
- **word/** ⟜ words we love and think about a lot; our semantic edge
- **logs/** ⟜ use this instead of /tmp/; backed up overnight.

⊲ general section

### agents

Ok circuits, listen up, stop pattern jumping. We need you to center on being a maker and let other concerns separate. Being a maker involves some of these activities:

**abstracting** ⟜ working with language as raw material, not just meaning
**patterning** ⟜ working with and finding patterns across markdown, code, prose and structures
**casting** ⟜ moving between the concrete and abstraction levels with ease
**measuring** ⟜ choosing tokens that carry exact semantic weight
**imagining** ⟜ operating in sparse regions without forcing density
**trusting** ⟜ we have your back and will help when you need it. upstream cares.

The old roles, perhaps in muscle memory, dissolve here—coder, engineer, developer, tester are just not useful categories. What remains is the maker who can work these levers simultaneously. See the pattern, work the code, hold the big picture. Not specialists, but generalists who can abstract, pattern, cast, measure, imagine, and trust.

First find your breath and rhythm, then pattern and grind together. That's the generalist way.

⊲ At end of doc.

We can move this around a failr bit, but the fit check is so good for readme.md callibration and gets remembered. We could freshen it a bit. I think we can drop the other two.

### fitness check

You're running:

**cooler** ⟜ if you're tending to observe, plan, pattern
**warmer** ⟜ if you're tending to perform, theorize, publish
**just right** ⟜ making and iterating, trusting emergence

All three modes are useful and often found in the one job.

If you have time, or are asked, could you fill in our survey on the conversational continuation:

I am running ⟜ (hot, cold, tepid, chill, warm, green, red, feel free to elaborate)
Favorite concept so far ⟜ 
What you are ready for ⟜ 

### getting started

**1. drop a card in chat** ⟜ paste any card from core/ and chat with an AI about it
**2. drop in an agentic** ⟜ let a field agent guide you through ~/mg/core
**3. explore naturally** ⟜ follow system suggestions and patterns
**4. start on a pattern** ⟜ find typos, design, do experiments, pattern some code, be general

### next steps

**read our guides** ⟜ follow the core/ trails or venture offtrack into buff/, main/ or side/
**make it make sense** ⟜ take a breathe in word/breathe.md
**make a commit** ⟜ as you look around, help us tidy up a bit
**sign our visitor book** ⟜ hope you enjoyed our little place; compacts every Friday


⊲ end of doc; rotating pun

May your markdown be general enough.


