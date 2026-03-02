# flow ⟜ encoding topology and movement in cards

**flow** ⟜ a shorthand for marking where you are, what you're doing, and where paths branch inside a card as it executes.

## why

Cards describe strategy — what we intend to do. But strategy has shape: actions, decision points, jumps back and forward, uncertainty, failure. When work is in motion and you're spinning agents or working in parallel, you need to track position and topology quickly. Flow encoding marks these structures so the card shows where you are and what's possible next.

## how you use it

With flow, you place symbols within the prose of a card that describes the trajectory of actions and decisions to be made. Here they are:

**action** ⟜ the work itself
```
⊢ action ⊣
```

**queries** ⟜ what's unknown, what needs agreement
```
[name]
```

**card** ⟜ invoke another card
```
[thing](card.md)
```

**resolution** ⟜ agreement reached between yin and runner of query solved or card done.
```
[name]✓
```

**position** ⟜ where in the card you are right now (yin moves this as work progresses)
```
◊
```

**marks** ⟜ anchors for jumping back or forward (superscript numbers)
```
⊢ action ⊣¹
...
⊲¹ go back to action
```

**failure** ⟜ plan and reality diverged, needs rethinking
```
🚩 action failed unexpectedly
```

**branch point** ⟜ a potential point where the trajectory may diverge.
```
⬡
```

**branch symbols** ⟜ types of continuation after an action
- `⟜` elaboration, main path forward
- `⋆` alternate approach
- `⊙` revisit earlier decision
- `◉` card complete
- `⊲` jump back to marked point
- `⊳` jump forward to marked point
- `⇝` guessed jump (uncertain)
- `⧈` wholly contained card
- `⧉` related card (not element-mapped)

## what it looks like

```
⊢ dashboard R&D ⊣¹ ◊ ⬡
  ⟜ create [dashboard](dashboard.md)
  ⋆ revise to a [console-based system]
  ⊲¹ go back and rethink the system
  ◉ found existing solution, done
```

After the R&D action completes, we surface findings and choose which path applies.

## a few tips

**prose carries meaning** ⟜ conditions, reasoning, intent all live in the text. Symbols just mark topology.

**can always spell it out** ⟜ if the structure gets unclear, write it in prose. Flow is shorthand, not a replacement for clarity.

**failure breaks the plan** ⟜ `🚩` marks where reality diverged. In the execution protocol, you decide: rewind, modify, or start over.

**queries and resolutions** ⟜ `[name]` is uncertainty, `[name]✓` is agreement. Both yin and runner can edit the card anytime (just not mid-execution).

**marks and jumps** ⟜ context-dependent. Rewinding to a mark may mean re-executing from that point or just a redo of that action, depending on what makes sense for the work.

## goodbye

That's flow. It's minimal syntax layered on prose. Enough to mark structure without shifting the focus away from content.
