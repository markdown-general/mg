# symbol shortcuts ⟜ SPC d prefix

Three categories: circles (colors), marks, symbols.

## Circles: SPC d c

🔴 red, 🟢 green, 🟠 orange, 🟣 purple, 🔵 blue

## Marks: SPC d m

⟜ elab, ⟝ action, ⧈ weave, ⬡ hexagon, ◊ lozenge, ⟞ right gate

## Symbols: SPC d s

From ~/haskell/circuits/other/symbols.md:
- η lift
- ε lower
- ⊙ compose
- ⊲ push
- ⥁ run
- ↬ loop
- ⥀ trace
- ↯ untrace

```elisp
;; mg symbol shortcuts on SPC d
(map! :leader
      :prefix ("d" . "mark/symbol")
      ;; circles
      (:prefix ("c" . "circle/color")
       :desc "Red"    "r" (lambda () (interactive) (insert "🔴"))
       :desc "Green"  "g" (lambda () (interactive) (insert "🟢"))
       :desc "Orange" "o" (lambda () (interactive) (insert "🟠"))
       :desc "Purple" "p" (lambda () (interactive) (insert "🟣"))
       :desc "Blue"   "b" (lambda () (interactive) (insert "🔵")))
      ;; marks
      (:prefix ("m" . "mark")
       :desc "Elab (⟜)"       "e" (lambda () (interactive) (insert "⟜"))
       :desc "Action (⟝)"     "a" (lambda () (interactive) (insert "⟝"))
       :desc "Weave (⧈)"      "w" (lambda () (interactive) (insert "⧈"))
       :desc "Hexagon (⬡)"    "h" (lambda () (interactive) (insert "⬡"))
       :desc "Lozenge (◊)"    "l" (lambda () (interactive) (insert "◊"))
       :desc "Right gate (⟞)" "]" (lambda () (interactive) (insert "⟞")))
      ;; symbols from circuits
      (:prefix ("s" . "symbol")
       :desc "Lift (η)"    "l" (lambda () (interactive) (insert "η"))
       :desc "Lower (ε)"   "w" (lambda () (interactive) (insert "ε"))
       :desc "Compose (⊙)" "." (lambda () (interactive) (insert "⊙"))
       :desc "Push (⊲)"    "p" (lambda () (interactive) (insert "⊲"))
       :desc "Run (⥁)"     "r" (lambda () (interactive) (insert "⥁"))
       :desc "Loop (↬)"    "o" (lambda () (interactive) (insert "↬"))
       :desc "Trace (⥀)"   "t" (lambda () (interactive) (insert "⥀"))
       :desc "Untrace (↯)" "u" (lambda () (interactive) (insert "↯"))))
```

## load

```bash
emacsclient -e "(load-file \"$(pwd)/loom/symbol-shortcuts.el\")"
```
