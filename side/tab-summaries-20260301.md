# tab-summaries ⟜ open tabs analyzed via agent decks

Session: 20260301. Method: Extract content via browser + PDF tools, spin Haiku 4.5 agents, produce loose decks.

---

## bartosz functorio ⟜ category theory through game engineering

**Functorio** ⟜ Factorio game as functional programming language; assemblers are functions, recipes are type signatures

**Composition & Categories** ⟜ Inserters act as identity functions; assemblers compose associatively, forming a cartesian closed category

**Higher-order functions** ⟜ Assemblers are first-class objects—recipes produce assemblers, recipes consume assemblers, enabling functional abstraction

**Functors & containers** ⟜ Conveyor belts map functions over contents (mapBelt); monoidal structure preserves products through belt merging

**Linear types** ⟜ Recipes consume resources completely with no leaks or duplication—a constraint similar to Rust ownership or Haskell linear types

**Applicative & monadic patterns** ⟜ Multi-argument assemblers support currying and partial application; nested belts could flatten (join) like monadic collapse

Worth keeping because: Brilliantly connects game engineering to functional programming abstractions, making category theory concepts visceral and playable rather than abstract.

---

## numhask roadmap ⟜ composable numerics for haskell

**NumHask: Composable Numerics** ⟜ Replaces Haskell's monolithic Num class with granular operations (Additive, Multiplicative, Divisive) so types claim only the arithmetic they genuinely support.

**Property Classes Over Type Aliases** ⟜ Upgrades type synonyms to proper classes (Semiring, AdditiveGroup, CommutativeRing) that certify algebraic laws actually hold, not just syntactic combinations.

**Honest Partial Operations** ⟜ Explicitly handles subtraction and division failures with WhenSubtractive/WhenDivisive classes returning Maybe, rather than hiding bottom values.

**Commutativity Without Assumption** ⟜ Drops silent assumptions of commutative multiplication; introduces left/right division distinction for non-commutative rings like quaternions.

**Exponentiation by Method, Not Function** ⟜ Makes (^) and (^^) methods of Multiplicative/Divisive classes so efficient implementations (modular arithmetic, idempotent rings) can be specified per-type.

Worth keeping because: Provides mathematically rigorous yet practical guidance for making Haskell's numeric system simultaneously more honest about algebraic properties and more flexible for diverse number types.

---

## arxiv 2502.13033 ⟜ duploids and evaluation strategies

**Duploids: non-associative categories for mixing evaluation strategies** ⟜ When CBV and CBN evaluation coexist, composition becomes non-associative; the paper rehabilitates this as a principled structure for reasoning about effectful programs, with positive and negative shifts encoding the two paradigms.

**Dialogue duploids as models of classical logic** ⟜ Building on adjunctions of self-dual negation functors, dialogue duploids provide symmetric semantic accounts of classical logic via two-sided sequent calculus, bridging continuation models and proof-theoretic perspectives without privileging one evaluation direction.

**The linear classical L-calculus: syntax matching semantics** ⟜ An involutive negation connective and focused reduction rules enable the direct L-calculus to interpret faithfully into dialogue duploids, with equational theory recovering both CBV and CBN as positive/negative subcategories.

**Thunkability = centrality in dialogue duploids (Hasegawa-Thielecke theorem)** ⟜ Two computational notions of "purity"—thunkable maps (substitutable like values) and central maps (commute over parallel compositions)—provably coincide via internal duality, implying continuation monads are commutative iff idempotent.

**Overcoming Joyal's obstruction** ⟜ Rather than abandon cartesian categories or dualizing objects entirely, the work relaxes associativity of composition to preserve symmetry of classical logic while maintaining a computationally meaningful semantics.

Worth keeping because: Provides mathematically elegant framework for understanding coexistent evaluation strategies without sacrificing logical symmetry or computational meaning—valuable for language design and semantic foundations.

---

## skipped / deferred

- Gmail inbox: Partial extract (interface + preview text). Full email content requires navigation via CDP.
- Grok conversation: Metadata only (navigation history). Content of conversation itself would require deeper DOM parsing.
- GitLab snippet, Julesh optics, Anil notes: Chrome timeouts during extraction. Defer with longer wait times or separate sessions.

---

## notes

**Agent spinning verified** ✓
- Model: Haiku (fast, 10k token budget sufficient)
- Format: Loose decks (3-6 lines, scannable)
- Quality: Excellent—captures core ideas, articulates value

**PDF extraction** ✓
- Tool: pdftotext (from poppler) works well
- Limitation: Loses formatting; works for content extraction

**Browser automation** ⚠️
- Read operations: ✓ Reliable (browser-content.js, browser-eval.js)
- Write operations: ✗ Form submission not yet working (side-quest noted)
- Chat UIs: Complex JS handling—defer for now

**Next** ⟜ Review keeper/discard decisions, move to improved browser upgrade design, consider field agents for remaining files.
