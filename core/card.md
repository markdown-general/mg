# card ⟜ collaborative communication

A card is how we collaborate; it is many things to many functions in the system.

We especially collaborate asynchronously - as the captain says, we design for the multiplicity that we are. A runner and a yin synchronize within a single session but the card is "run" elsewhere asynchonously. Cards undergo static analysis and we use them to search for improvement in the system, so card examples using better technology (or safe syntax or more fun tests) are always arriving. Cards are our long-term collective and *selective memory* as we learn to repeat good habits and avoid stagnations.

This is especially true for yins. A card is short-term memory and is often the practical breadcrumbs to pick up the trail of a flow. It is also an artifact shared between yin and field agents who are asynchronous across threading.

## card example

A card typically combines strategy (this is what we intend to do) with [flow](flow.md) (our operational protocol for keeping track of what is being done). Here is an example card:

```
card audit ⟜ assess drift and modernize the card library

With rewrites of yin.md and flow.md, existing cards have semantic drift. This card orchestrates the audit and modernization.

**inventory pass** ⟜ count cards by directory

◊ ⊢ spin [inventory-pass](inventory-pass.md) ⊣ 
  ⟜ field agent writes to yin/log/card-inventory-[timestamp].md

**ratings pass** ⟜ evaluate each card for sensibility and actionability

⊢ spin [ratings-pass](ratings-pass.md) ⊣ 
  ⟜ field agent writes to yin/log/card-ratings-[timestamp].md

⊢ select a few high value cards and chat ⊣ 

◊ ⊢ draft work/card.md ⊣
```

This is the exact card state when we edited this file. Highlights to this card include that we are operating in parallel, so the marker of where we are at - ◊ - is in two places. Also of note is the inventory-pass and ratings-pass actions are being passed on to field agents.
