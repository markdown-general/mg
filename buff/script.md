---
name: script
description: Automation, shell scripting, and task runners
---

## script ⟜ written narrative or story involving choreography ⟜ often of a logical or process flow ⟜ often encoded or as code.

Looks like you're writing a script.

```
- make a card and use fence blocks.
- freely use the markdown format to explain the script
- have a bias towards natural language scripting
- any clued-in agent should be able to run it easily (easily means with little required extra token usage, like having to discover where tsx is and read lots of typecript when it's not a coding job).

```

The dividing line between what is a script and what is a prompt should be considered. 

The primary tradeoff in what should be scripted is 
⟜ the costs of coding/decoding cycles between the script language and other languages. 
⟜ benefits of token usage patterns, such as prevention of slop reading (having to consume tokens unrelated to the main task say).

For scripts close to agents, for example, natural language is the right flow if the code is peripheral to the main task - it is a tool not the object or endeavour.

---

## python environments

**Never put `.venv/` inside a collaborative workspace.**

Python virtual environments are build artifacts — compiled extensions, cached packages, platform-specific binaries. They don't belong in a shared surface like `~/mg/` where humans and agents navigate together.

**Two acceptable patterns:**

1. **Project-local outside the workspace** — `~/other/projectname/.venv/`
   - Example: `~/other/nle/.venv/`
   - The project has its own directory in `~/other/`; the venv lives there

2. **Centralized** — `~/.local/share/venvs/projectname/`
   - One location for all environments
   - Keeps every workspace completely clean

**The rule:** If you `ls` a workspace and see `.venv/`, something is in the wrong place. Move it.

