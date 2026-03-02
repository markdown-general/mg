# inventory pass ⟜ count cards by directory

Count markdown files (.md) in each card directory and write summary to yin/log/.

**directories in scope:**
- yard/alice/
- yard/card/
- yin/
- yin/example-cards/
- captain/notes/
- ~/self/archive/ (including subdirectories and compressed archives)

**instruction**

⊢ count .md files in each directory ⊣
  ⟜ for each directory, count files matching *.md
  ⟜ exclude README.md if present
  ⟜ also check subdirectories and include as a separate count
  ⟜ for ~/self/archive/, list compressed archives (.tar.gz) separately and note any extractable card directories

⊢ write summary to yin/log/card-inventory-[timestamp].md ⊣
  ⟜ format: directory ⟜ count
  ⟜ total card count at end
  ⟜ note any directories that are empty or unreachable

**output location**

yin/log/card-inventory-[timestamp].md
