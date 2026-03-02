# ratings pass ⟜ evaluate cards for modernization readiness

Read all cards, rate each for flow content, actionability, and value. Write detailed assessment to yin/log/.

**input**

yin/log/card-inventory-[timestamp].md (from inventory-pass)

**instruction**

⊢ for each card in scope directories ⊣ ◊
  ⟜ read card
  ⟜ rate flow encoding: none | partial | good | uses new protocol
  ⟜ rate sensibility: is intent clear enough for fresh context?
  ⟜ rate actionability: would we use this again, or is it one-off bash?
  ⟜ identify card type heuristically (e.g., build, search, manage, coordinate)
  ⟜ note if card size is monolithic or well-scoped

⊢ write assessment to yin/log/card-ratings-[timestamp].md ⊣ ◊
  ⟜ one rating per card: file path | flow | sensibility | actionability | type | size
  ⟜ add notes column for context or concerns
  ⟜ sort by actionability (high → low)
  ⟜ summary section: count by type, identify candidates for modernization

**rating scales**

- flow: none | partial | good | modern
- sensibility: poor | fair | good | excellent
- actionability: one-off | maybe | yes | core-pattern

**output location**

yin/log/card-ratings-[timestamp].md
