# circuits

**Canonical reference:** ~/haskell/circuits/readme.md

**Renamed from:** yarn (consolidated computational theory layer)

---

## Canonical Sources

### Executable implementation and proofs
- **~/haskell/circuits/readme.md** — Complete reference (668 lines, design team update 2026-04-17)
  - Foundation, axioms, GADT, naive vs. Mendler, Hyp encoding, sliding, fixed-point extraction
  - Axiom categorisation (4 structural roles, axiom 6 is only constructor-adding)
  - "The abstraction came last" (retrospective path: hack→type-check→recognize category)
  - Reflection without Remorse hierarchy (Monoid→Monad→Category→Traced), Costrength backing (Theorem 3.2), Kan Extension (Fix.Ran), Open Questions (4 critical theorems remaining)

### Supporting materials in ~/haskell/circuits/other/
- **axioms-traced.md** — Traced monoidal category axioms with full proofs (Vanishing, Sliding, Tightening, Strength, Yanking, Planar)
- **axioms-hyp.md** — LKS axioms mapped to Kidney-Wu semantics with proofs and GADT derivation
- **GoI.md** — Geometry of Interaction via delimited continuations (executable prototype, GHC 9.6+)
- **channel.md** — Producer/Consumer patterns; Kidney-Wu examples starting point

### Reference extracts in ~/self/external/
Full papers and authoritative sources (404KB, 12 files):
- jsv-1996.md, hasegawa-1997.md, launchbury.md (LKS 2013)
- kidney-wu-2.3-streams.md, hyperfunctions.md, kmett2026.md
- reflect-remorse.md (van der Ploeg & Kiselyov 2014)
- costrong.md (Balan & Pantelimon 2025)
- mooreforless.md, pick2.md, lks-7-8-axioms.md, nlab-traced-monoidal-category.md

---

## Working code and experiments
- **~/mg/logs/GoIRTS-working.hs** — Working delimited continuations model
- **~/mg/logs/TestGoIRTS-working.hs** — Test suite

---

## Next Work (Prioritized)

### 1. Axiom Formalization — Mendler Case as Counit Naturality

**Goal:** Close the major open question: prove Mendler case in `run` is exactly counit naturality of `Ran (Const a) (Const b)`.

**Language choice:** Lean 4 vs Idris2?
- Lean 4: better category theory library support, larger ecosystem, mature tactics
- Idris2: more research-oriented, dependent patterns cleaner for Kan extensions
- **Recommendation:** Lean 4 for practical formalization + adoption

**Scope:**
- Establish isomorphism `Circuit a b ~ Ran (Const a) (Const b)` as theorem
- Prove `run` satisfies counit naturality
- Show Mendler case enforces this (without it, universal property breaks)
- Formalize the triangle: `lower . unfold = run` as unit-counit identity

**Payoff:** Elevates readme open question into proven theorem. Strengthens categorical foundation for library credibility.

---

### 2. Concrete Examples (KW + Effects + Performance)

**Primary examples (map to Circuit/Hyp, show (,) vs Either):**
- Breadth-first search (KW 2026, Hofmann algorithm)
- Coroutine scheduler (concurrent feedback patterns)
- Zip fusion on Church-encoded lists
- Simple state machine with internal feedback

**Secondary examples (effects libraries struggle with simultaneity):**
- Resource acquisition/release with feedback (why Either-based libs need `bracket`)
- Error handling with recovery loops (Either is sequential, (,) is simultaneous)
- Stream merging / concurrent pipelines (expose the approximation cost)

**Performance measurement (in parallel):**
- Instrument each example with timing data
- Measure left-nested Compose vs right-nested vs Hyp encoding
- Profile Loop depth distribution
- Flag if O(n²) behavior surfaces — triggers RwR treatment

⟝ **Start with BFS (small, clean, illuminating)**

---

### 3. API: Dual Word/Symbol Interface

**Current constraint:** JSON encoding bug prevents KW symbols in code. **Preserve symbol definitions; we'll restore at end.**

**Target interface (word + symbol):**
```haskell
-- Word versions (available now)
lift :: (a -> b) -> Circuit a b
compose :: Circuit b c -> Circuit a b -> Circuit a c  -- or via Category instance
run :: Circuit a a -> a
loop :: Trace arr t => arr (t a b) (t a c) -> Circuit arr t b c

-- Symbol versions (reserved for later)
-- lift f  :: a ↬ b
-- f ⊙ g   :: Circuit composition  
-- run h   :: a ↬ a -> a
-- f ⊲ h   :: Loop / prepend
```

**Why dual interface:** Users choose readability; libraries can use symbols for notation once JSON bug is fixed.

---

### 4. Clarify and Expand Critical Sections

#### 4a. "Recovers fix in cartesian case" — needs deeper exposition

Hasegawa's Theorem 3.1: in a **cartesian** traced category, trace is *equivalent* to a fixed-point operator satisfying Conway axioms. This means:

- `run (lift f) = fix f` is **not arbitrary** — it's a theorem consequence
- In any cartesian traced category, these must agree extensionally
- Operationally different (cyclic sharing vs fixed-point combinator resource duplication) but denotationally same

**Action:** Expand "Hasegawa's cartesian specialisation" section in readme with:
- Precise statement of Theorem 3.1
- Why cartesian (not just monoidal) is necessary
- Connection to why either-based libs *can't* have simultaneity without approximation

#### 4b. "Graded Loop depth" — explain and measure

**Concept:** Annotate each `Loop` constructor with a depth index. Enables:
- Static analysis of nesting structure
- Okasaki-style amortised complexity reasoning
- Early detection of degenerate (left-nested) patterns

**Example:**
```haskell
data Circuit arr t a b where
  Lift :: arr a b -> Circuit arr t a b
  Compose :: Circuit arr t b c -> Circuit arr t a b -> Circuit arr t a c
  Loop :: Nat -> arr (t a b) (t a c) -> Circuit arr t b c  -- depth annotation
```

Then: prove that `left-nested Compose` over `Loop`s increases depth quadratically, enabling warning/optimization.

**Action:** 
- Implement graded variant in haskell/circuits/ (parallel to examples)
- Measure depth distribution in real examples
- Document performance implications in readme

---

## Priority Action Items (Archive)

### 1. Reflection without Remorse (RwR) — Hierarchy Extension

**Status:** Section cut from Downloads readme; need to restore/strengthen

**Narrative strategy:** Start with "Queue is to Codensity as Circuit is to Hyp", assume early RwR as read, focus on what RwR teaches about the traced category hierarchy.

⟝ **Task 1a:** Identify key sections from `~/self/external/reflect-remorse.md` supporting the monad→category→traced-category progression

⟝ **Task 1b:** Compare with haskell/circuits/readme.md's "Reflection without Remorse" section (lines ~630–730) — integrate the full hierarchy table

⟝ **Task 1c:** Extract the Okasaki queue amortisation implications for Circuit (graded structures) — note for later

Reference: van der Ploeg & Kiselyov, Haskell 2014

---

### 2. Costrength — Categorical Backing for Trace

**Status:** Cut from Downloads; critical for library design (library runs on costrength)

**Open question:** Relation to profunctors `Strong`/`Costrong` modules — do profunctors subsume this design?

⟝ **Task 2a:** Compare `Trace arr t` with Balan & Pantelimon costrength definition

⟝ **Task 2b:** Extract Theorem 3.2 (costrong ↔ copointed on cartesian) and Proposition A.4 (free constructions inherit costrength)

⟝ **Task 2c:** Clarify profunctor optics connection and whether the design is subsumed or orthogonal

Source: `~/self/external/costrong.md` (41KB), haskell/circuits/readme.md lines ~600–650

---

### 3. Axiom Mapping — LKS/JSV/Hasegawa Correspondence

**Hypothesis to verify:** Everything boils down to Axiom 6 of LKS. Loop/Knot is necessary to satisfy it. Sliding axiom gets inserted as the computational rule in Circuit.run.

⟝ **Task 3a:** Map LKS Axioms 1–7 against JSV/Hasegawa against implementation locations in Circuit (Lift/Compose/Loop/run)

⟝ **Task 3b:** Verify numbering stability across papers (raw.md and yarn/other/axioms.md already drafted)

⟝ **Task 3c:** Prove: run (Compose (Loop f) g) = trace (f . untrace (run g)) is exactly axiom 7 made computational

⟝ **Task 3d:** Document why without Loop, Axiom 7 fails (commuting morphism assumption breaks)

References:
- ~/self/captain/yarn/other/axioms.md
- ~/self/captain/yarn/other/axioms-original.md
- Launchbury, Krstic & Sauerwein, JFP 2013

---

### 4. Hasegawa's Cartesian Specialisation — fix Extraction

**Key insight:** run . lift = fix is not arbitrary; it's a theorem consequence of cartesian traced categories.

⟝ **Task 4a:** Extract Hasegawa Theorem 3.1 — trace → fixed-point (Conway axioms) equivalence in cartesian case

⟝ **Task 4b:** Show why this is the lead-in to the Circuit adjunction (run eliminates, lower observes, they agree via universal property)

⟝ **Task 4c:** Connect to Cyclic Sharing vs Fixed-Point Combinators distinction (operational consequences)

References:
- ~/self/external/hyperfunctions.md (extracts from Hasegawa's paper)
- haskell/circuits/readme.md "Hasegawa's cartesian specialisation" section

---

### 5. Kan Extension Characterisation — Circuit = Ran (Const a) (Const b)

**Scope:** Start at Category → Traced Category level

⟝ **Task 5a:** Establish precise isomorphism: Circuit a b ~ Ran (Const a) (Const b)

⟝ **Task 5b:** Show Mendler case in run enforces counit naturality of the adjunction

⟝ **Task 5c:** Prove: lower . unfold = run (unit-counit identity)

⟝ **Task 5d:** Full Kan Extension Hierarchy table (Monoid → Monad → Category → Traced Category) with initial/final encodings

References:
- haskell/circuits/readme.md "Kan Extension Hierarchy" section (lines ~520–570)
- Icelandjack observation (github.com/ekmett/hyperfunctions/issues/3)

---

### 6. Kidney-Wu Examples (KW 2026)

**Status:** Should be action items; currently no concrete instantiations of KW examples

⟝ **Task 6a:** Extract breadth-first search example from Kidney-Wu preprint

⟝ **Task 6b:** Extract concurrency scheduler example

⟝ **Task 6c:** Map both onto Circuit/Hyp; write explicit code

⟝ **Task 6d:** channel.md (~/self/yarn/channel.md) is starting point — develop from there

Reference: Donnacha Oisín Kidney & Nicolas Wu, "Hyperfunctions: Communicating Continuations" (POPL 2026 preprint: https://doisinkidney.com/posts/2025-11-18-hyperfunctions.html)

---



---

## Open Questions & Notes

⟝ Does axiom 6 (LKS) = axiom 7 (sliding) = Mendler case? Verify with papers.

⟝ Profunctors: Strong/Costrong modules vs our design — orthogonal or subsumed? (See profunctors library)

⟝ Graded structures (Knot depth) and Okasaki amortisation — defer for now, flag in final docs

⟝ Geometry of Interaction: Currently conjectural; needs better motivation. GoI.md + ~/mg/logs/ provide foundation, but formal mapping to Circuit/Hyp is open.

---

## Dropped (Old Yarn Context)

These refer to yarn material at an earlier stage. Not surfaced to active card:
- Integration test workflow (~/mg/buff/browser-tools.md)
- Architecture scope questions (~/self/captain/agent.md Q5, Q6, Q10-Q12)
- Release strategy decision (agent.md decision-staged-or-atomic)
