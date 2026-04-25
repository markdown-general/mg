## aux ⟡ agent user experience

**aux** ⟜ interfaces and workflows neutral to agent and human

**Multiplicity principle** ⟜ a tool works for:
- agent + human (this session right now)
- agent + agent (parallel workflows)
- pure human (no agents)
- pure agent (autonomous)
- composed in larger structures

Not locked to one configuration.

---

## Neutrality through surface

**Surface first** ⟜ markdown, pipes, structured text (JSON, CSV, plain lines)
- Agents parse surfaces (text, files, stdout)
- Humans read surfaces (readable markdown, clear output)
- Both can pipe, compose, transform

**Example: list-tabs**
```bash
# Agent gets structured output (can parse)
list-tabs > ~/logs/tabs.txt
cat ~/logs/tabs.txt | jq '.[].url'

# Human gets same output (can read)
list-tabs | fzf  # Optional: interactive layer on top

# Composed: agent calls it, another agent consumes it
list-tabs | agent-2 process
```

**Why this matters:**
- Same command works for human eyeball OR agent parsing
- No ceremony to switch contexts
- Interactive layers (fzf, emacs UI) are *optional*, not required

---

## Current practice in emacs

**buff/emacs.md** shows the pattern:

- **org-agenda** ⟜ structured surface (text, links, dates)
  - Humans: read, navigate, interact with keybindings
  - Agents: parse org format, extract TODOs, read structured data

- **Org-mode files** ⟜ markdown surface (headings, code blocks, links)
  - Humans: edit in emacs
  - Agents: read as files, parse structure, write back
  - No special format; just markdown

- **Keybindings for aux** ⟜ shortcuts for common operations
  - Humans: faster interaction (`SPC o z` for agenda)
  - Agents: call via elisp, no UI needed (`org-agenda nil "z"`)

**The interface is the surface, not the UI.**

---

## Interactive layers are optional

Tools like **fzf** are human-biased:
- Humans benefit: interactive filtering, quick selection
- Agents don't: they parse output directly, don't need the TUI

**Pattern:**
```bash
# Agent: gets the data, parses directly
items=$(my-list-items)
selected=$(echo "$items" | jq -r '.[0]')  # No fzf needed

# Human: same data, but interactive layer on top
my-list-items | fzf  # TUI for fast picking
```

Both use the same underlying surface. Interactive layers are sugar, not structure.

---

## Design checklist for aux

When adding tools or workflows:

⟜ **Does the surface work for agents?** (parseable, structured, no ANSI color noise)
⟜ **Does the surface work for humans?** (readable, clear, markdown when possible)
⟜ **Are interactive layers optional?** (fzf, emacs UI, etc. are nice-to-have, not required)
⟜ **Can it compose?** (output is input to next tool, agent or human)
⟜ **Does it work in multiple contexts?** (terminal, emacs, script, agent-to-agent)

If yes to all, it's neutral.

---

## Examples from circuits project

**Symbols management** (from symbol picker task):
- Surface: structured list (symbol, frequency, current-shortcut, first-file)
- Human aux: fzf for browsing and multi-select
- Agent aux: parse list, generate config patches
- Same underlying data, different interaction layers

**Tab recovery** (from browser-tools):
- Surface: clean list of URLs (one per line, or JSON)
- Human aux: fzf to pick which tab to read
- Agent aux: parse list, navigate to URL, extract content
- Optional interactivity; data is primary

