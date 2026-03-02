readme.md ⟜ fix structural mistakes & yin semantic drift

**instruction**

→ **Read readme.md and work/**
  - Read ~/mg/readme.md (lines 36–44: structure section)
  - Read ~/markdown-general/work/*.md for yin-related tokens (spin, field agent, runner, listener, foreman)

→ **Summarise discrepancies**
  - Document in `log/structure-fix-findings-[timestamp].md`:
    - Structure references that no longer exist
    - Incorrect or missing file references in "where to go" section
    - Yin tokens used inconsistently or undefined
  - List findings with line numbers and problematic text

⊢ agreed-edit-plan ⊣

→ **Transfer tools from yard/tools/ to ~/mg/tools/**
  - Copy all files from ~/markdown-general/yard/tools/ → ~/mg/tools/
  - (If ~/mg/tools/ doesn't exist, create it)

→ **Write refactors**
  - Update ~/mg/readme.md: Replace zone/ refs with yard/, fix file refs, remove worker.md/field-guide.md, update tools/cache.md
  - Update ~/markdown-general/work/drift.md: Replace foreman refs (old name for yin), clarify yin semantics
  - Log changes to `log/structure-fix-work-[timestamp].md`

**comment** ⟜ Structure evolved but readme.md wasn't updated. Yin terminology scattered across work/ docs — should be consistent and defined centrally. Gate ensures conversation before edits.
