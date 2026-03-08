haskell-library-checklists ⟜ four workflows for Haskell library lifecycle

Of 32 Haskell libraries in ~/repos/, 20 need attention. These four checklists cover the common workflows: checking builds, improving quality, publishing, and managing dependencies.

◊ ⊢ checking a haskell repo build ⊣
  ⟜ [haskell-build.md] choose strategy (cached log → interactive repl → full build)
  ⟜ verify cabal file integrity
  ⟜ check for warnings, type errors, unused imports
  ⟜ run tests (if present)
  ⟜ verify documentation builds (haddock)
  ⟜ report: clean build or issues to fix

⊢ the quest for a perfect library ⊣
  ⟜ [hlint-check.md] analyze code quality with hlint
  ⟜ [ormolu-format.md] reformat source consistently
  ⟜ [haddock-generate.md] verify documentation coverage
  ⟜ review module structure and exports
  ⟜ check for unnecessary dependencies [CARD NEEDED]
  ⟜ run property-based tests or docspec
  ⟜ curate: simplify, clarify, remove clutter
  ⟜ report: what was improved, what remains

⊢ getting a library published ⊣
  ⟜ [CARD NEEDED] verify package metadata review
    - name, version, synopsis, description
    - LICENSE file present and correct
    - .cabal file completeness (author, maintainer, repo, bug-reports)
  ⟜ run cabal sdist and cabal upload --dry-run
  ⟜ [git-tag.md] tag version in git
  ⟜ upload to Hackage
  ⟜ report: success or blockers

⊢ introducing a new dependency ⊣
  ⟜ [CARD NEEDED] dependency analysis workflow
    - identify what the dependency provides
    - check version constraints and compatibility
    - add to build-depends in .cabal file
    - test that the library still builds and runs
    - document why the dependency was needed
    - consider if it's temporary (for a feature) or permanent (core capability)
    - review: does it increase maintenance burden?

⊢ oversight: orchestrate all four workflows ⊣
  ⟜ [CARD NEEDED] create master card linking checklist phases
    - when to run each checklist
    - how to sequence them for maximum value
    - report template for library health assessment

◉ four checklists mapped to example cards; three cards needed to complete the system
