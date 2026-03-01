# filesystem reorganization ⟜ 2026-03-01

**Goal**: Align home directory structure with task categories for consistency and clarity.

---

## plan

**New structure**:
- `~/haskell/` ⟜ All Haskell libraries (owned + dependencies)
- `~/repos/` ⟜ mg-associated libraries (non-Haskell projects)
- `~/other/` ⟜ Research, ephemeral work, external repos, non-me Haskell libraries
- `~/mg/` ⟜ Rename markdown-general → mg (org name stays "markdown-general")
- `~/org/` ⟜ Private org stuff (unchanged)
- `~/stuff/` ⟜ Private docs (unchanged)
- `~/.config/doom/` ⟜ Doom config (unchanged)
- `~/other/dotfiles/` ⟜ Symlinked configs (stays)

**Categories**:

| Move to ~/haskell/ | Move to ~/repos/ | Keep in ~/other/ | Side-quest |
|---|---|---|---|
| box, box-socket, cabal-graph, chart-svg*, dataframe*, ghcid, harpie*, hyp*, machines, mealy, mpar, mtok, numhask*, prettychart, rlm-minimal | claude-code-showcase, claude-md-skill, functorio, words | pi-mono, pi-skills, proarrow, polyparse, conversations, alice, building-from-scratch, checklist, claude-code-ide.el, dataframe, haskell-lite, haskell-ng-mode, ob-haskell-ng, zanzix.github.io | Review: dotfiles (in repos/), skills, perf, synthesis, ephemeral, tonyday567 (website?), distributors, eulerproject, formatn, grepl, huihua, hcount, pokerfold, repl-viewport, tcat, web-rep |

---

## execution

⊢ create new directories ⊣ ◊
  - mkdir -p ~/haskell/
  - mkdir -p ~/repos/ (already exists)
  - Verify ~/other/, ~/org/, ~/stuff/

⊢ move Haskell libraries to ~/haskell/ ⊣
  - 19 libraries identified
  - Preserve .git history
  - Verify no symlinks break

⊢ move mg-associated to ~/repos/ ⊣
  - 4 projects (claude-code-showcase, claude-md-skill, functorio, words)
  - Leave remaining in ~/repos/ as-is for now

⊢ audit ~/other/ ⊣
  - Current: 15 items (pi-mono, pi-skills, proarrow, polyparse, etc.)
  - Stays: Research repos, ephemeral work, external libraries
  - Side-quest: Review unclear repos (see category above)

⊢ rename markdown-general → mg ⊣
  - Move ~/markdown-general to ~/mg
  - Update any internal references (symlinks, config)
  - Verify git history preserved

⊢ side-quests created ⊣
  - Categorize unclear repos (dotfiles, skills, synthesis, etc.)
  - Broken hugo site (~/site/) → capture as task

---

## notes

- `*` denotes libraries that might have dependencies on others in the same move
- Symlinks (~/other/dotfiles/) preserved via -r flag
- Private paths (~/org/, ~/stuff/) untouched
- .git/ histories preserved (move, don't copy)

---

## status

Ready to execute.
