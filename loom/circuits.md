# circuits ⟜ active workspace

loom for ~/haskell/circuits/ (main branch)

---

## narrative arc

🟢 docs/narrative/ ⟜ 7-section arc committed (6601c65)

⟜ 01-stack-language.md ⟜ five marks, six axioms, Fibonacci
⟜ 02-gadt.md ⟜ axioms force three constructors, Mendler case
⟜ 03-circuit.md ⟜ free traced monoidal category, universal property
⟜ 04-hyper.md ⟜ final encoding, triangle identity, Kan characterization
⟜ 05-tensor.md ⟜ (,) vs Either, holding hands vs taking turns
⟜ 06-rwr.md ⟜ Reflection Without Remorse, Mendler = viewl
⟜ 07-future.md ⟜ production patterns, open questions, extensions

---

## engineering gaps

These are code/engineering tasks, not narrative holes. The narrative reads complete without them.

⟝ **executable stack example** ⟜ small runnable demo for Section 01; doctested
⟝ **doctests** ⟜ core laws in each section; ~20-30 total
⟝ **flagship production example** ⟜ bidirectional pipe or tiny agent in examples/
⟝ **performance benchmarks** ⟜ left-nested composition on Circuit vs Hyper

---

## research list

1. **categories** ⟜ try out category instances from hackage categories package; FixF
2. **compact closed** ⟜ make a compact closed category using Hyper; connect to learners paper
3. **profunctors** ⟜ Strong/Costrong for Trace; Circuit Profunctor instance; clarify Tambara/Pastro relationship
4. **proarrows** ⟜ situate Circuit in proarrow framework
5. **lawvere theory** ⟜ Circuit as a Lawvere theory representation

⟜ buff/circuit-categorical.md ⟜ categorical reading guide (shopping list, navigation, slogan)
⟜ buff/learners-full.md ⟜ compact closed via learners; connection to research item 2
