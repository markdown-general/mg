# Semantic Tail Search

◊ **Algorithm:** Semantic concordance biased toward tail (recent) viewpoints via exponential decay

Integrates mealy methods with semantic summaries.

---

## What is Tail-Biased Semantic Search?

**Tail viewpoint** ⟜ emphasis on recent/final information in a sequence
- In text: chunks at the end carry more weight than chunks at the beginning
- In streams: latest observations dominate understanding
- In sessions: recent agent actions shape interpretation of history

**Why it matters:** Meaning shifts as context unfolds. What appears central at the start may prove peripheral by the end. A tail-biased view asks: *given everything that came after, what should I understand now?*

This is different from full-memory (decay=1.0, all past equally weighted) and different from amnesia (decay=0.0, only the present). It's a moving average that recalibrates as new information arrives.

---

## The Algorithm: Mealy Concordance with Decay

**Input:** A sequence of chunks, each containing semantic leads (key concepts).

**State:** A map of leads → accumulated weight.

**Step:** At each chunk:
1. Apply decay to prior state: `w' = w * decay_rate`
2. Inject new leads from chunk with configured weights
3. Merge: `state = decayed + new`
4. Extract top-N leads by weight

**Output:** At each step, the top-N leads representing the current semantic focus.

**Mealy structure:** A machine with:
- **State:** `Map Lead Weight`
- **Input:** `[Lead]` (the leads in current chunk)
- **Output:** `[(Lead, Weight)]` (top-N sorted by weight)
- **Transition:** decay old, inject new, merge, extract

---

## Decay Rates as Tuning Parameter

**decay=1.0 (Full Memory)**
- All past mentions accumulate forever
- Final state is the semantic backbone of the entire document
- Shows what was foundational from the start

**decay=0.8 (Moving Average)**
- ~5-chunk effective window (exponential halving)
- Tracks semantic drift in real time
- Captures recent emphasis while smoothing noise
- The "sweet spot" for understanding direction

**decay=0.0 (Amnesia)**
- Only the present chunk matters
- Shows what each step emphasizes individually
- Reveals local peaks of attention

---

## Weights as Emphasis

The first position in each chunk (index 0) gets higher weight. This encodes the assumption: *if it appears first in a compression, it's more central to that chunk's meaning.*

**Default:** `weights = [3.0, 2.0, 1.0, 1.0, 1.0]`

This can be tuned per use case:
- Flatten to `[1,1,1,1,1]` if order doesn't signal emphasis
- Increase `[5,1,1,1,1]` if you want the first lead to dominate
- Use different weights for different semantic domains

---

## Key Finding: Saturation Point

When applied to the Traced GADT corpus (26 chunks):

**With decay=1.0:**
- "Traced GADT" reaches 60 accumulated weight by chunk 26
- "Fold/build adjunction" reaches 16 by chunk 26
- Growth rate slows after chunk 13 (plateau zone)

**With decay=0.8:**
- "Traced GADT" oscillates around 8 at end
- Authority oscillates between "Traced GADT" and "Free traced monoidal category"
- Recalibration visible: what's central mid-run ≠ what's central early

**Interpretation:** Full memory locks in early arrivals. Moving average discovers that later sections rebalance priorities. The tail viewpoint shows *where the document is heading*, not where it started.

---

## Implementation

**Location:** ~/haskell/semcons/

**Core machinery:**
- `src/Mealy.hs` — State machine definitions and scanning
- `src/Concordance.hs` — Lead accumulation and decay logic
- `test/concordance-test.hs` — Harness for running experiments

**Cards (~/haskell/semcons/cards/):**
- `chunking.md` ⟜ how to split text into uniform chunks
- `compress-chunk.md` ⟜ how to extract leads from a chunk via agent
- `mealy-concordance.md` ⟜ the Mealy implementation details
- `concordance-26-scan.md` ⟜ full run on Traced corpus
- `concordance-test.md` ⟜ test harness and decay setup
- `semantic-gradient.md` ⟜ visualizing the gradient across decay rates

**Running an experiment:**

```bash
cd ~/haskell/semcons
cabal repl lib:semcons

# Load harness
:load test/concordance-test.hs

-- Run concordance with decay 0.8, weights [3,2,1,1,1]
:! runhaskell test/concordance-test.hs > /tmp/decay-0.8.txt
```

---

## Tail Viewpoint in Agent Contexts

**Session discovery:** When an agent reads a multi-turn session, apply decay to prioritize recent messages. Older context provides foundation, but recent actions shape intent.

**Drift detection:** Compare full-memory state (expected path) with moving-average state (actual direction). Divergence signals that the session is heading somewhere unexpected.

**Meaning reconstruction:** To understand what an agent meant, trace backward from the tail. Final chunks/messages often clarify early ambiguities.

**Elder inference:** When a session branches, ask: which branch continues the tail vector? Which diverges? This guides which branches are "living" vs. archived.

---

## Next Steps

⊢ Parameterize across domains
  ⟜ Different text types may need different decay rates
  ⟜ Different agent types may need different weight profiles
  ⟜ Experiment with code vs. prose vs. technical writing

⊢ Integrate with drift detection
  ⟜ Session divergence as moving-average ≠ full-memory gap
  ⟜ Mark 🚩 when tail vector shifts direction sharply

⊢ Extend to graph search
  ⟜ Use tail bias to prioritize which branches to explore first
  ⟜ Semantic gradient can guide search orientation in session trees

---

**Status:** ◉ Experimental foundation. Core algorithm proven. Ready for integration into session tooling.
