card audit ⟜ assess drift and modernize the card library

With rewrites of yin.md and flow.md, existing cards have semantic drift. This card orchestrates the audit and modernization.

**inventory pass** ⟜ count cards by directory

✓ ⊢ spin [inventory-pass](inventory-pass.md) ⊣ 
  ⟜ field agent writes to yin/log/card-inventory-[timestamp].md

**ratings pass** ⟜ evaluate each card for sensibility and actionability

✓ ⊢ spin [ratings-pass](ratings-pass.md) ⊣
  ⟜ field agent writes to yin/log/card-ratings-2026-02-01-0653.md

✓ ⊢ convert to lattice format ⊣
  ⟜ tables → deck lines; output: yin/log/card-ratings-converted-2026-02-01-0653.md

✓ ⊢ revise example-card: curate-work-card.md ⊣
  ⟜ rewrite with proper flow symbols; positioned ◊ before first action

✓ ⊢ add RLM Alice cards to example-cards ⊣
  ⟜ rlm-alice-query.md ⟜ simple, clean query version with parallel chunk analysis
  ⟜ rlm-alice-pullup.md ⟜ complex multi-phase: generate → curate → integrate micro-fragments
  ⟜ demonstrates low-cost parallelism and context preservation

✓ ⊢ split repl suite into specs and work cards ⊣
  ⟜ captain/notes/repl/ → specs only (haskell-repl-library-spec, process-design, async-key, process-createProcess, repl.md)
  ⟜ ~/mg/yin/repl/ → work probes (repl-user, repl-startup, repl-mock, cabal-init-repl, drift-ghci-echo)
  ⟜ clear separation: design specs vs. operational probes

✓ ⊢ add example cards from audit ⊣
  ⟜ rlm-alice-query, rlm-alice-pullup (parallelism, context preservation)
  ⟜ curate-work-card (revised with flow)
  ⟜ debug-filewatcher-chain (diagnostic methodology exemplar)
  ⟜ building library of teaching examples

✓ ⊢ build Haskell checklist card ⊣
  ⟜ created haskell-library-checklists.md with four workflows
  ⟜ modernized and moved example cards to yin/example-cards/:
    - haskell-build.md (build strategy: cached → interactive → full)
    - hlint-check.md (style suggestions)
    - ormolu-format.md (source formatting)
    - haddock-generate.md (documentation coverage)
    - git-tag.md (version tagging for release)
  ⟜ incomplete: metadata review, dependency analysis, oversight orchestration card

✓ ⊢ fill example-cards directory with audit recommendations ⊣
  ⟜ move inventory-pass.md to yin/example-cards/
  ⟜ move ratings-pass.md to yin/example-cards/
  ⟜ copy integration-comms-patterns.md to yin/example-cards/
  ⟜ pattern-fix.md handles work/pattern.md repair; remove red flag

✓ ⊢ continue adding excellent cards to example-cards ⊣
  ⟜ repl cards (repl-user, haskell-repl-library-spec, process-design, etc.) now in ~/mg/self/repl/
  ⟜ gates-complete consolidation (verify one master location)
  ⟜ identify remaining core-pattern cards from audit that belong in example-cards

✓ ⊢ investigate lower-rated cards ⊣
  ⟜ why are "maybe" and "one-off" cards lower? genuine constraints or misclassified?
  ⟜ session logs, agent analyses, research notes — what's their role?
  ⟜ distinguish between "incomplete" vs. "reference" vs. "archive"

✓ ⊢ select a few low value cards and chat ⊣
  ⟜ random sampling from yard/card/
  ⟜ identified gold: verify-hyperbole-chart-server, utf8, captains-job-jump, agent-consciousness-test, structure-fix
  ⟜ added to ~/mg/cards/

✓ ⊢ archive old cards and complete audit ⊣
  ⟜ moved yard/card/ → ~/self/archive/cards260201/card/
  ⟜ moved yard/rlm/ → ~/self/archive/cards260201/rlm/

◊ ⊢ finalize audit output ⊣
  ⟜ outputs: pattern-fix.md (work/pattern.md repair), haskell-library-checklists.md (build workflows)
  ⟜ ~/mg/cards/ (18 example cards: coordination, patterns, testing, analysis, methodology)

