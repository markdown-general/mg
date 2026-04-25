## fzf ⟡ list → choice

**fzf** ⟜ general-purpose command-line fuzzy finder

**core principle** ⟜ transform any list into a choice via fuzzy matching
- **surface** ⟜ stdin (list) → stdout (selection)
- **human aux** ⟜ interactive TUI for quick filtering and selection
- **agent aux** ⟜ scripted selection with pre-filtering, queries, fallback logic

Same underlying tool. Different interaction layers.

---

## Surface: list → choice

fzf's job: **given a list, produce a choice.**

```bash
# Any list input
fd --type f | fzf           # Files
rg --line-number pattern | fzf  # Search results
git branch | fzf            # Git branches
cat loom/all-cards.txt | fzf  # Cards
```

Output goes to stdout. Can be piped, captured, processed:
```bash
selected=$(some-list | fzf)
# Now use $selected in next command or pass to another tool
```

**No UI ceremony.** Input → output. Works in pipes, scripts, agent chains.

---

## human aux ⟜ interactive TUI

When a human (or yin runner) calls fzf, the TUI is the magic:

```bash
# Interactive picking
fd --type f | fzf --preview 'bat --color=always {}'
```

Type fuzzy patterns. See previews. Tab for multi-select. Enter to confirm.

**Key options for human UX:**
- `--preview COMMAND` ⟜ live preview (reduces blind selection)
- `--multi` ⟜ Tab to mark multiple items
- `--height 80% --layout=reverse` ⟜ comfortable window size
- `--border rounded` ⟜ visual clarity

**Reduces overwhelm:** Agent generates the list (its strength). Human picks (human strength). Tight feedback loop.

---

## agent aux ⟜ scripted selection

Agents can use fzf in **non-interactive mode** via options:

```bash
# Auto-select if only one match
candidates=$(fd --type f)
choice=$(echo "$candidates" | fzf --select-1 --exit-0)

# Pre-filter aggressively before fzf
cards=$(fd --type f loom/ | grep -E "\.md$")
selected=$(echo "$cards" | fzf --select-1 --query "symbol" --exit-0)

# Deterministic fallback
if [ -n "$selected" ]; then
  echo "Choice: $selected"
else
  # No fzf result; fall back to first, random, or skip
  echo "No match found; using default"
fi
```

**Agent-friendly options:**
- `--select-1` ⟜ auto-select if exactly one match (skip UI)
- `--exit-0` ⟜ exit cleanly even if no matches (no error)
- `--query "terms"` ⟜ pre-filter based on agent context
- `--no-sort --tiebreak index` ⟜ predictable ordering (not ranked)
- `--delimiter ':' --nth 3` ⟜ extract specific fields

**Pattern:** Pre-filter list → fzf with smart query → capture result → next step.

---

## agent-to-agent flows

When one agent generates a list and another consumes it:

```bash
# Agent A: generate candidates (whatever its logic)
candidates=$(find-relevant-cards)

# Wrapper: fzf selection (abstraction)
pick_from_candidates() {
  echo "$1" | fzf --select-1 --exit-0 --query "$2"
}

# Agent B: use the result
selected=$(pick_from_candidates "$candidates" "circuits-related")
process_card "$selected"
```

**Why this works:**
- A generates list (domain knowledge)
- fzf-wrapper is neutral tool
- B consumes clean output
- No TUI required; scripted fallback handles missing matches

**Caveats:**
- fzf is interactive by design (not purely headless)
- Non-TTY subprocess may fail (ensure terminal context)
- For very large lists without pre-filtering, need smarter fallbacks
- True "best match" ranking requires native fuzzy library, not fzf UI

---

## practical patterns

**Safe file picker (human or script):**

```bash
pick_file() {
  local dir=${1:-.}
  fd --type f . "$dir" | fzf --select-1 --exit-0 \
    --query "${2:-}" \
    --preview 'bat --color=always {}'
}

# Human: pick_file loom/
# Agent: pick_file loom/ "symbol"
```

**Card selection:**

```bash
pick_card() {
  fd --type f buff/ loom/ core/ | fzf --multi --select-1 --exit-0
}

# Multi-select for batch operations
cards=$(pick_card)
```

**Search + pick:**

```bash
# Ripgrep → fzf with line number context
rg --line-number "TODO" | fzf \
  --delimiter ':' \
  --preview 'bat --color=always --highlight-line {2} {1}' \
  --select-1 --exit-0
```

---

## limitations + aspirations

**Current limitation:** fzf is optimized for interactive use (TUI). Pure headless fuzzy matching requires workarounds or native libraries.

**Aspiration:** fzf-wrapper functions that both humans and agents can call transparently:
- Humans get interactive TUI
- Agents get scripted fallback
- Same interface, different aux layers

**Future:** Dedicated tool (MCP server, shell helper, or local agent skill) that wraps fzf + fallback logic, fully agent-capable.

For now: treat fzf as **human primary, agent secondary with caveats**. Pre-filter aggressively, use `--select-1 --exit-0`, provide good `--query` hints based on agent context.

---

## summary

**fzf is list → choice.** 

- Input: any list via stdin or file
- Output: selected item(s) via stdout
- Human aux: TUI for interactive picking (speed, safety, clarity)
- Agent aux: scripted selection with pre-filtering and fallbacks
- Neutral surface: pipes and text

Use it when you need to turn a large or noisy list into a precise choice. Humans will enjoy the TUI. Agents can chain it with logic. Together, it reduces noise and keeps flow tight.

**Aspiration:** fully agent-to-agent capable via smart wrappers and pre-filtering. Getting there.
