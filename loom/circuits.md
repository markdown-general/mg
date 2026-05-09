# circuits ⟜ active workspace

🟣 ⟜ todo item, work unit
🟠 ⟜ in testing, active / currently being explored
🟢 ⟜ done, completed successfully
🔴 ⟜ blocked, issue or needs rework
◊ ⟜ cursor, current task location
⧈ ⟜ weave, light check (runner-directed, don't stress)
⥁ ⟜ run, verify the standard process
⊲ ⟜ push, propagate knowledge into mg structure

loom for ~/haskell/circuits/ (main branch)

---

## narrative prose

🟢 ⟜ 01-stack-language.md ⟜ five marks, six axioms, Fibonacci
🟢 ⟜ 02-gadt.md ⟜ axioms force three constructors, Mendler case
🟢 ⟜ 03-circuit.md ⟜ free traced monoidal category, universal property
🟢 ⟜ 04-hyper.md ⟜ final encoding, triangle identity, Kan characterization (Ran fix applied)
🟢 ⟜ 05-tensor.md ⟜ (,) vs Either, holding hands vs taking turns
🟢 ⟜ 06-rwr.md ⟜ Reflection Without Remorse, Mendler = viewl
🟢 ⟜ 07-future.md ⟜ production patterns, open questions, extensions

---

## code — library

🟢 ⟜ Circuit.Hyper — Profunctor/Functor/Applicative instances, unroll/roll/ana/cata
🟢 ⟜ circuits.cabal — profunctors dep
🟢 ⟜ Traced.hs — Trace (->) for (,) and Either; Kleisli IO via delimited continuations; whileK
🟢 ⟜ Circuit/Circuit.hs — Loop, lower, Mendler case, toHyper
🟣 ⟜ operator consistency: `↬` overloaded (type Hyper vs Loop constructor)
🟣 ⟜ haddock coverage ⟜ all exported symbols documented with doctests

---

## code — next (v0.1)

🟢 ⟜ `Circuit.Channel` module ⟜ in circuits core:
             ⟜ `Producer o a = (o → a) ↬ a` — Emitter
             ⟜ `Consumer i a = a ↬ (i → a)` — Committer
             ⟜ `Channel r i o = (o → r) ↬ (i → r)` — bidirectional pipe
             ⟜ `unit` / `counit` — compact closed structure
             ⟜ `prod` / `cons` — message-level adjunction
             ⟜ `withQ` — run Producer and Consumer in lockstep
🟢 ⟜ `circuits-io` package ⟜ created (~/haskell/circuits-io/):
             ⟜ cabal skeleton, src/, examples/ (box prototypes moved in)
             ⟜ Stub modules: File, Socket, Server, Time, Async
             ⟜ Depends on circuits; examples/ holds migrated box artifacts
🔴 ⟜ Box library ⟜ deprecated. Bones moved to Circuit.Channel.
             ⟜ Box examples: ~/haskell/circuits-io/examples/
             ⟜ Box source: ~/haskell/box/ (circuits-rewrite branch, paused)
🟣 ⟜ `loopToHyper` upstream ⟜ move Loop→Hyper section-retraction into circuits

---

## code — dropped

🔴 ⟜ `Circuit.Hyper.Fix` ⟜ dropped. Module freeze. yaya bridge was aspirational.
🔴 ⟜ `Trace These` in core circuits ⟜ moved to circuits-parser territory. Core ships with (,) and Either only. These is parser-specific (progress-aware parsing, Uncons).

---

## examples — active (v0.1 path)

◊ 🟢 ⟜ circuit-basic.md (while.md) ⟜ while loop: Hyper vs Circuit, `↓ ∘ ↬ ∘ ↑`
◊ 🟢 ⟜ delimited continuations ⟜ doctests & examples for `Trace (Kleisli IO) Either`
◊ 🟢 ⟜ resource-io.md ⟜ 3-tier IO card: countdown → echo → file
◊ 🟢 ⟜ parser.md ⟜ parser architecture; Lift=satisfy, Loop=many, Compose=sequence, Either=<|>
◊ 🟢 ⟜ pipes.md ⟜ Proxy decomposition into Circuit tensors; Hyper (i->s) (o->s) as channel
◊ 🟢 ⟜ mtok refactor ⟜ swapped regex-applicative for Circuit.Parser
◊ 🟢 ⟜ perf.md ⟜ measurement as Circuit plugin via Compose
◊ 🟢 ⟜ `Uncons` pattern ⟜ `s -> These s a` as coinductive primitive
◊ 🟢 ⟜ circuits-parser package ⟜ new package: Circuit.Parser + Uncons typeclass
◊ 🟢 ⟜ circuits-perf package ⟜ new package: Circuit.Perf with once/times/warmup
◊ 🟢 ⟜ circuits trimmed ⟜ Circuit.Parser removed from exposed-modules
◊ 🟢 ⟜ markup-parse refactor ⟜ flatparse+mpar → circuits-parser
◊ 🟢 ⟜ huihua refactor ⟜ Huihua.Parse.Parser (383 lines) replaced

### Hyper communication patterns

◊ 🟢 ⟜ channel.md ⟜ Producer/Consumer duality from Kidney & Wu POPL 2026
             ⟜ pipeline: emitSingles → circuitTake → collectSingles via Channel composition
             ⟜ coinductive Consumer: h = cons step h processes any number of messages
             ⟜ turn-based vs concurrent comparison; stable marriage section
◊ 🟢 ⟜ spec-hyper.hs ⟜ Producer/Consumer/Channel implementations; pipeline test suite
◊ 🟢 ⟜ stable-marriage.hs ⟜ pure coroutine state machines; matches paper trace exactly

### Loop→Hyper section-retraction

◊ 🟢 ⟜ coroutine-hyper.hs ⟜ five sections:
             ⟜ §1 Coro→Channel: state-machine coroutine as Hyper Channel
             ⟜ §2 Trace→Hyper: each tensor as Hyper combinator
             ⟜ §3 Delimited continuations: yieldIO via prompt/control0
             ⟜ §4 loopEither/loopThese: Loop body → single Hyper (function-space trick)
             ⟜ §5 LoopToHyper dispatch class
◊ 🟢 ⟜ circuit-categorical.md ⟜ section-retraction diagram; tensor comparison table
◊ 🟢 ⟜ Traced.hs reverted to committed state (clean base for publish)

---

## examples — done

🟢 ⟜ hyper-basic.md ⟜ comparative analysis Circuit.Hyper vs Control.Monad.Hyper
🟢 ⟜ yaya.md ⟜ Hyper ≅ Fix (HyperF a b) ≅ Fix(Ran …), Lambek proof
🟢 ⟜ harpie.md ⟜ HarpieHyper via Array s, tabulate memoization
🟢 ⟜ lazy-knot-tying.md ⟜ (,) trace as lazy knot; Fibonacci; coin-change DP

---

## deferred / aspirational

🟣 ⟜ weighted-search.md ⟜ complete but deferred
🟣 ⟜ box library refactor ⟜ post-v0.1 (box examples moved to ~/haskell/box/examples/; paused on spec: two Loops with different feedback types)
🟣 ⟜ circuit-categorical.md ⟜ full categorical shopping list, navigation, slogan
🟣 ⟜ performance testing ⟜ delimited continuations throughput; Mendler case overhead vs Hyper amortisation; pipes vs Circuit.Channel benchmark

---

## These review (resolved)

These appears in three places:
- **coroutine-hyper.hs** — `loopThese` encoding works (function-space trick, same pattern as Either)
- **circuits-parser** — `Uncons` uses These for progress-aware parsing (That=backtrack, These=consumed+remainder)
- **mpar** — same pattern, pre-consolidation

Decision: These stays in circuits-parser territory. Core circuits ships with (,) and Either only. The `loopThese` encoding shows the pattern works — upstreaming a `Trace (->) These` instance would pull `these` into core circuits' dep chain unnecessarily.

---

## removed / consolidated

🔴 ⟜ while.md ⟜ absorbed into circuit-basic + resource-io
🔴 ⟜ loop-examples.md ⟜ (,) vs Either covered by circuit-basic + lazy-knot-tying
🔴 ⟜ example-loopio.md ⟜ absorbed into resource-io.md
🔴 ⟜ example-delim.md ⟜ absorbed into resource-io.md (countdown tier)
🔴 ⟜ echo-server.md ⟜ absorbed into resource-io.md (echo tier)
🔴 ⟜ resource-file.md ⟜ absorbed into resource-io.md (file tier)
🔴 ⟜ fileio.md ⟜ absorbed into resource-io.md
🔴 ⟜ circuit-parser-2.md ⟜ absorbed into circuit-parser.md
🔴 ⟜ old channel.md ⟜ absorbed into pipes.md
🔴 ⟜ circuit-dual.md ⟜ absorbed into pipes.md
🔴 ⟜ circuit-agent.md → ~/self/loom/ (separate project)
🔴 ⟜ agent-reef-theory.md → ~/self/loom/ (separate project)
🔴 ⟜ agent-f.md → ~/self/loom/ (placeholder)
🔴 ⟜ grepl-primitives.md → ~/self/loom/ (separate project)
🔴 ⟜ recursion.md → ~/self/loom/ (exploration done)
🔴 ⟜ withq-hyper-circuit.md → ~/self/loom/ (grepl design, box prototype)
🔴 ⟜ box-core.hs, box-pure.hs, box-proto.hs, box-connectors-map.md → ~/haskell/box/examples/ (box development)
🔴 ⟜ Circuit.Hyper.Fix ⟜ dropped (module freeze; yaya bridge aspirational)

---

## publish path

1. Loop→Hyper: upstream loopToHyper into circuits (from coroutine-hyper.hs §4–5)
2. Add Circuit.Channel module (type alias + combinators over Hyper)
3. Doctest coverage for all exported symbols
4. Publish order: circuits → circuits-parser → circuits-perf
5. Merge parser-fix branches to main for all consumer libraries
6. Box: resolve Channel fit; benchmark pipes vs Circuit.Channel
7. Delimited continuations: verify throughput; compare to Hyper-based Channel

(Publication steps like cabal metadata, version bounds, and Hackage upload live in ~/mg/buff/haskell-checklist.md — separate track.)
