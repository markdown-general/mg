haskell-build ⟜ strategy for checking compiler output in development

Cabal build is time-expensive in tight build loops. Use a tiered strategy: cached log first, interactive repl second, full build last.

◊ ⊢ choose build strategy based on urgency ⊣
  ⟜ **build-log-check** — if build-log-request already running (instant, cached)
    - fast path: read existing log without rebuilding
  ⟜ **cabal-repl** — if you want interactive check (fast, safe)
    - type-check and explore interactively without full rebuild
  ⟜ **cabal-build** — if you need authoritative answer (slow, complete)
    - full build with compiler output, dependencies resolved

⊢ execute selected strategy ⊣
  ⟜ run chosen command
  ⟜ observe compiler output for errors or warnings
  ⟜ report status

◉ build strategy optimizes feedback loop: cached → interactive → full
