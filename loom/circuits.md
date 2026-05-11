# circuits ━ active workspace

🟣 ━ todo item, work unit
🟠 ━ in testing, active
🟢 ━ done, completed
🔴 ━ blocked, removed
◊ ━ cursor, current task
⧈ ━ weave, light check (runner-directed)
⥁ ━ run, verify standard process
⊲ ━ push, propagate into mg structure

---

## circuit narrate

🟣 ━ readme ━ found-object-from-the-future narrative. Introduction → design thesis → examples. Narrative asides (axioms, kan, hasegawa) referenced, not inlined.
🟢 ━ SKILL.md ━ agent field guide: orientation, module map, build/test, symbols, conventions, gotchas, example authoring, downstream.
🟢 ━ 01-stack-language.md ━ five marks, six axioms, Fibonacci
🟢 ━ 02-gadt.md ━ axioms force three constructors, Mendler case
🟢 ━ 03-circuit.md ━ free traced monoidal category, universal property
🟢 ━ 04-hyper.md ━ final encoding, triangle identity, Kan characterization
🟢 ━ 05-tensor.md ━ (,) vs Either, holding hands vs taking turns
🟢 ━ 06-rwr.md ━ Reflection Without Remorse, Mendler = viewl
🟢 ━ 07-future.md ━ production patterns, open questions
🟢 ━ symbols.md ━ symbol table, primitive glyph meanings
🟢 ━ axioms-hyp.md ━ Hyper axioms, Mendler = viewl proof
🟢 ━ axioms-traced.md ━ traced monoidal category axioms
🟣 ━ circuit-categorical.md ━ comprehensive categorical reading guide (partial, deferred)
🟢 ━ hasegawa.md ━ Hasegawa traced cartesian closed categories
🟢 ━ kan-extension.md ━ Kan extensions as Hyper's final encoding

---

## circuit code

🟢 ━ Circuit.Circuit ━ GADT: Lift / Compose / Knot, lower/reify, toHyper + toHyperE
🟢 ━ Circuit.Hyper ━ final encoding: Hyper, invoke, base/push/lift/lower/run. Category/Profunctor/Functor/Applicative/Monad.
🟢 ━ Circuit.Traced ━ Trace class. (,) lazy knot, Either iteration, Kleisli IO via delimited continuations.
🟢 ━ Circuit.Channel ━ compact closed on Hyper: Producer/Consumer/Channel, unit/glue, yield/accept, prod/cons.
🟢 ━ Circuit ━ umbrella re-export
🟢 ━ loopToHyper upstream ━ toHyperE + runEither in Circuit.Circuit
🟢 ━ ↬ symbol ━ Knot constructor now ↮ (U+21AE). ↬ = Hyper type only.
🟢 ━ trace/untrace symbols ━ ↪ (U+21AA) trace, ↩ (U+21A9) untrace
🟢 ━ Knot rename ━ Loop→Knot globally. Three constructors: Lift, Compose, Knot.
🟢 ━ Channel rename ━ doneP→yield, doneC→accept, counit/withQ→glue
🟢 ━ Hyper cleanup ━ removed Kmett copies, hyperfy, ⊙, OVERLAPPING. Simplified Applicative, added Monad.
🟢 ━ Traced cleanup ━ removed whileK, hid prompt/control0 as internals.
🟢 ━ doctests ━ all 5 modules: 37/37 pass.
🟣 ━ cross-repo symbol audit ━ check consumer repos for breakage from renames.

---

## circuit examples

◊ 🟢 ━ channel-basics.md ━ idiomatic Producer/Consumer/Channel: emitSingles→collectSingles, takeChannel interposed, coinductive Consumer, unit/glue.
◊ 🟢 ━ stable-marriage.md ━ pure coroutine state machines; scheduler with jilting; matches paper trace.
◊ 🟢 ━ channel-basics.md ━ idiomatic Producer/Consumer/Channel: emitSingles→collectSingles, takeChannel interposed, coinductive Consumer, unit/glue.
◊ 🟢 ━ repl-pure.md ━ Pure REPL as Circuit (->) Either String String: Lift, Knot, Compose in one card.
◊ 🟢 ━ hyper-loop.md ━ stepwise Hyper loop: stepKnot, countdown, compare with run.
◊ 🟢 ━ hyper-stream.md ━ qList, collect, takeE via Hyper directly — no Circuit GADT.
◊ 🟢 ━ pair-loops.md ━ fused qList+takeE in one Circuit Knot with pair tensor.
◊ 🟢 ━ two-loops.md ━ separate Knots vs fused, plus the toHyper composition trap (absorbed hyper-compose.hs).
◊ 🟢 ━ coroutine-hyper.md ━ Coro→Channel, loopEither/loopThese, KnotToHyper, Fibonacci lazy knot. Needs `cabal repl -b these`.
◊ 🟢 ━ stable-marriage.md ━ pure coroutine state machines; scheduler with jilting; matches paper trace.
◊ 🟢 ━ resource-io.md ━ 3-tier IO: countdown → echo → file. loopIO wrapper.
◊ 🟢 ━ parser.md ━ parser architecture: Lift=satisfy, Knot=many, Compose=sequence, Either=<|>
◊ 🟢 ━ perf.md ━ measurement as Circuit plugin via Compose
◊ 🟢 ━ pipes.md ━ Proxy decomposition into Circuit tensors
◊ 🟢 ━ while.md ━ while loop: Hyper vs Circuit, ↓ ∘ ↮ ∘ ↑
◊ 🟢 ━ hyper-basic.md ━ comparative analysis Circuit.Hyper vs Control.Monad.Hyper
◊ 🟢 ━ yaya.md ━ Hyper ≅ Fix (HyperF a b) ≅ Fix(Ran …), Lambek proof
◊ 🟢 ━ harpie.md ━ HarpieHyper via Array s, tabulate memoization
◊ 🟢 ━ lazy-knot-tying.md ━ (,) trace as lazy knot; Fibonacci; coin-change DP
◊ 🟢 ━ theory-delim.md ━ Trace (Kleisli IO) Either ≅ delimited continuations
◊ 🟣 ━ weighted-search.md ━ complete but deferred
◊ 🟣 ━ memoization.md ━ memoization patterns (partial)
◊ 🟣 ━ elgot-abacus.md ━ Elgot algebra examples (partial)
◊ 🟣 ━ channel-refactor.md ━ prod/cons → Emit/Commit trail, isomorphism confirmed, open questions
◊ 🟢 ━ stream-compare.md ━ streaming patterns compared: prod-chain (works) vs tensor (one-element) vs IORef

🟢 ━ examples build health ━ all .hs converted to .md. 6 new cards, 0 .hs remain. coroutine-hyper.md needs -b these.

🔴 ━ channel.md ━ absorbed into channel-basics.md
🔴 ━ stable-marriage.hs ━ converted to stable-marriage.md
🔴 ━ spec-hyper.hs ━ absorbed into channel-basics.md (duplicate)
🔴 ━ hyper-compose.hs ━ absorbed into two-loops.md (composition trap)
🔴 ━ hyper-loop.hs ━ converted to hyper-loop.md
🔴 ━ hyper-stream.hs ━ converted to hyper-stream.md
🔴 ━ pair-loops.hs ━ converted to pair-loops.md
🔴 ━ two-loops.hs ━ converted to two-loops.md
🔴 ━ repl-pure.hs ━ converted to repl-pure.md
🔴 ━ coroutine-hyper.hs ━ converted to coroutine-hyper.md (fixed API drift)
🔴 ━ box-proto.hs, box-pure.hs, box-core.hs, box-connectors-map.md ━ moved to ~/haskell/circuits-io/examples/
🔴 ━ circuit-agent.md, agent-reef-theory.md, agent-f.md, grepl-primitives.md, recursion.md, withq-hyper-circuit.md → ~/self/loom/

---

## circuit-io

Package: `~/haskell/circuits-io/`. Depends on circuits. Built on Circuit.Channel.

🟢 ━ package skeleton ━ cabal, src/, builds
🟢 ━ Circuit.IO ━ umbrella re-export
🟢 ━ Circuit.IO.File ━ readLines, writeLines, linesProducer, linesConsumer, collectAll. 6 doctests.
🟢 ━ Circuit.IO.Time ━ sleep, stampNow, stampIO, measureGap, withGaps. 5 doctests.
🟢 ━ Circuit.IO.Queue ━ feedQueue, drainQueue, runConcurrently. 5 doctests.
🟣 ━ doctest + haddock coverage
🟣 ━ CI workflow

---

## circuit-parser

Package: `~/haskell/circuits-parser/`. Depends on circuits, harpie, clock, deepseq.

🟢 ━ package ━ cabal, src/, builds
🟢 ━ Circuit.Parser ━ Parser over Circuit (->) Either, Uncons, combinators
🟢 ━ Circuit.Parser.Token ━ tokenize, Vocabulary
🟢 ━ bench-parse ━ benchmark suite
🟣 ━ harpie dep ━ Circuit.Parser.Token uses Harpie.Array. Investigate.
🟣 ━ doctest + haddock coverage
🟣 ━ consumer repo refactors ━ markup-parse, huihua, mtok, dotparse, web-rep, hcount → circuits-parser

---

## circuit-perf

Package: `~/haskell/circuits-perf/`. Standalone — depends on circuits.

🟢 ━ package ━ cabal, src/, app/, builds
🟢 ━ Circuit.Perf ━ Nanos, nanos, once/once_, times/times_, warmup
🟢 ━ perf-bench ━ benchmark binary: clock overhead, whileM_, trace-delim
🟢 ━ SKILL.md ━ perf-explore pattern, Core inspection, gotchas
🟢 ━ CI ━ ormolu, hlint, build (GHC 9.14/12/10), benchmark run
🟣 ━ doctest + haddock coverage
🟣 ━ circuits dep ━ currently standalone; should depend on circuits for measurement-as-plugin.
🟣 ━ delimited-continuations throughput benchmark
🟣 ━ pipes vs Circuit.Channel benchmark

---

## publish path

🟢 1. loopToHyper upstream → toHyperE
🟢 2. ↬ symbol resolution → ↮ for Knot
🟢 3. doctest + haddock (circuits core)
🟣 4. cross-repo symbol audit
🟣 5. readme + SKILL.md
🟣 6. Publish order: circuits → circuits-parser → circuits-perf
🟣 7. Merge parser-fix branches → main
🟣 8. circuits-io: implement stub modules
🟣 9. Performance testing
