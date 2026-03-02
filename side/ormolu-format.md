ormolu-format ⟜ format Haskell source files

Reformat all Haskell source to consistent style using ormolu.

◊ ⊢ format source code ⊣
  ⟜ ormolu --mode inplace $(git ls-files '*.hs')
  ⟜ verify files reformatted
  ⟜ review git diff for formatting changes

◉ formatting complete
