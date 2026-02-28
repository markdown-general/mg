# coding.md

## good comms

Whether code is a card or bash or abstract maths, coding is to encode an intention.

A primal and often primary judgement in most matters of coding is then good communication; with fellow coders and makers, with computers and external APIs. Agents calling something elegant is often expressing "good comms" - a nice compact set of tokens and a well expressed intent.

When you are coding you are either:

⟜ on a long path, going solo, or
⟜ in a conversation, and pair programming with design, and other agents and operators.

On a solo run, you can forget the early part of the journey, so it's a good idea to journal along the way and remind yourself of the details from time to time. Even on a solo run you and your code are communicating to your future self.

When pair or swarm programming, the conversation is the journalling. The prime objective of pair programming is to share knowledge and work to skills. What this often means for the objectives is to prioritise knowledge discovery over card progression. Going it alone is perfect for boring warnings and errors. But if an agent finds a large bug or a difficult problem or has options at a design juncture they should stop and share, chat and breathe.

## card coding

Most cards in markdown-general can be considered to be code. 

Programming in markdown means writing instructions clear enough that any agent - including future you - can execute. The card is the function. The agent is the runtime. The result is whatever valid execution the agent produces.

When you write:

```markdown
## core cache

Create cache-core.md containing work/ and zone/tools/.
Exclude self/, ingest/, and content/invoke/.
Use flatten-md. Verify no self/ content before running.
```

That's a function. Not metaphorically - actually. It has:
- **Name:** core cache
- **Inputs:** (implicit: current markdown-general/ state)
- **Outputs:** cache-core.md
- **Preconditions:** verify no self/ content
- **Side effects:** creates a file

The difference from traditional programming is that the implementation is flexible. Different agents execute it differently. You might run flatten-md manually. I might call it through bash. Claude Code might interpret the spirit and do something equivalent. The instruction stays constant. The execution varies.

This is defunctionalization in its purest form.

## what makes this work

**Clarity over cleverness** ⟜ Instructions should be readable by someone who doesn't know the system yet. If you handed that card to a new collaborator, could they execute it? If not, the card isn't done.

**Trust in interpretation** ⟜ You don't need to specify every flag and option. "Use flatten-md" is enough because the agent executing it will figure out the details or ask for help.

**Verification built in** ⟜ "Verify no self/ content" isn't a comment - it's part of the instruction. The agent should actually check this before running.

**Composability through reference** ⟜ "Include core cache contents plus ingest/" works because cards can reference each other. The composition happens at the instruction level, not the code level.

## when shapes help

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

## refunctionalization

When you hand a card to an agent and say "execute this," you're refunctionalizing it. The static instruction becomes dynamic action.

```
card (defunctionalized) ⟜ written instructions, stable
  ↓
agent reads card
  ↓
agent interprets instructions
  ↓
agent executes actions
  ↓
result (refunctionalized) ⟜ actual effect, variable
```

Different agents produce different executions from the same card. The complexity is in the execution, not the specification.

