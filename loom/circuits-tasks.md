# circuits tasks

Unified task list pulled from readme.md (open questions + flow marks) and gaps in loom/circuits.md.

---

## Open Questions (from readme.md)

1. **Mendler case as counit naturality (Lean formalization)**
   - Prove that the Mendler case in `run` is exactly the counit naturality of `Ran (Const a) (Const b)`, formalised.
   - Lean 4 recommended for category library support

2. **Circuit ≅ Ran isomorphism (theorem, not diagram)**
   - Establish the precise isomorphism `Circuit a b ~ Ran (Const a) (Const b)` as a theorem, not a diagram observation.
   - Currently observation-level; needs formal proof

3. **Loop uniqueness & freeness of Circuit**
   - Establish that `Loop` is the unique reifier of the hidden channel in axiom 6.
   - i.e. `unfold` is the unique traced functor `Circuit -> Hyp`, not merely a traced functor.
   - The freeness of `Circuit` as a traced monoidal category depends on this.

4. **Fix(Circuit) well-typedness & adjunction precision**
   - Clarify whether `Fix (Circuit (->) t)` is well-typed at all.
   - If so, whether `Hyp a b ~ Fix (Circuit (->) t a b)` is an iso or strict inequality.
   - `unfold` exists but `degen` is lossy, so the two encodings are not isomorphic on the nose.
   - Precise adjunction statement needed.

5. **Geometry of Interaction connection (conjectural)**
   - Map Circuit/Hyp to GoI via delimited continuations, Int(C) completion.
   - Connection to `callCC`, shift/reset.
   - Foundation in ~/mg/logs/GoIRTS-working.hs but formal mapping open.

6. **Graded Loop depth & Okasaki amortisation (not formalised)**
   - The graded structure counting `Loop` depth and its implications for Okasaki queue amortisation are noted but not formalised.
   - Example: annotate `Loop` with `Nat` index tracking nesting.
   - Measure depth distribution in real examples.
   - Connect to RwR (Reflection without Remorse) queue insights.

7. **Concrete Kidney–Wu examples**
   - Map concrete Kidney–Wu examples (breadth-first search via Hofmann, concurrency scheduler) onto `Circuit`/`Hyp`.
   - Full working code + timing measurements.

---

## Flow Marks (from readme.md)

Minor uncertainties / incomplete elaboration points:

- **nlab reference here** (line ~26) — Complete the nlab pointer for traced monoidal categories
- **switch to modern unicode** (line ~52) — Update operator syntax to modern notation (⊙, ⊲, etc.) once JSON encoding fixed
- **motivation for completeness and simpleness** (line ~80) — Elaborate on why (<<) compounds into primitives; universal properties motivation
- **complete switch here to hyperfunctions as the object** (line ~225) — Clarify the narrative shift when discussing lift vs. hyperfunctions
- **There is no a or b or any diagonal** (line ~229) — Explain the significance of this constraint in fixed-point structure

---

## API Design Gaps (from loom/circuits.md)

Not well-represented in readme; critical for usability:

1. **Dual Word/Symbol Interface**
   - Current: Word versions available now (lift, run, loop via Category instance)
   - Reserved: Symbol versions (a ↬ b, f ⊙ g, f ⊲ h) blocked on JSON encoding bug
   - Design choice: Why dual interface? Readability + library notation flexibility
   - Preserve symbol definitions now; restore when JSON fixed
   - Document in API section (readme lacks this)

2. **Profunctors relationship**
   - Open question: Is `Trace arr t` subsumed by profunctors library `Strong`/`Costrong` modules?
   - Or orthogonal design?
   - Affects API surface: do we expose profunctor instances or hide them?
   - Resolution needed before stabilizing public interface

---

## Concrete Examples Roadmap (from loom/circuits.md)

Expand beyond "map KW examples":

**Primary (map to Circuit/Hyp, show (,) vs Either distinction):**
- Breadth-first search (KW 2026, Hofmann algorithm) — small, clean, illuminating
- Coroutine scheduler (concurrent feedback patterns)
- Zip fusion on Church-encoded lists
- Simple state machine with internal feedback

**Secondary (expose effects library approximations):**
- Resource acquisition/release with feedback (why Either-based libs need `bracket`)
- Error handling with recovery loops (Either sequential, (,) simultaneous)
- Stream merging / concurrent pipelines (expose approximation cost of doing simultaneity on Either)

**Performance measurement (in parallel with examples):**
- Instrument each example with timing data
- Measure left-nested Compose vs right-nested vs Hyp encoding
- Profile Loop depth distribution
- Heuristics for detecting O(n²) behavior → triggers RwR treatment discussion

**Action:** Start with BFS (small, high signal), then coroutine scheduler (shows tensor choice impact).

---

## Minor Clarifications Needed

- **Hasegawa Theorem 3.1 depth:** Expand on why cartesian (not just monoidal) matters for trace ↔ fix equivalence
- **Cyclic sharing vs fixed-point combinators:** Document operational difference (resource duplication)
- **Why Either-based libs struggle with simultaneity:** Map Producer/Consumer decomposition (KW insight) to concrete library patterns
- **Axiom 6 ↔ Axiom 7 ↔ Mendler case:** Clarify identity (they're the same thing stated at different levels)

---

## Status Summary

✓ Completed (2026-04-17):
- Axiom categorisation (4 structural roles)
- "The abstraction came last" (retrospective design path)
- Unfold deep dive (reduction proof, sliding axiom closure)
- RwR hierarchy (Monoid → Monad → Category → Traced)
- Costrength backing (Theorem 3.2, Proposition A.4)
- Axiom correspondence (all 7 LKS axioms mapped)
- Hasegawa's cartesian specialisation (stated)
- Kan Extension hierarchy (Fix.Ran characterisation)

⊢ Still Open:
- Formal proofs (items 1–4 above, Lean 4)
- Concrete examples (7 specific examples, timing)
- GoI connection (formalization)
- Graded Loop depth (implementation + measurement)
- API design decisions (dual interface, profunctors resolution)
- Flow mark elaborations (5 minor clarifications)
