# Yarn Narrative Analysis

◊ **Listener check:** Understanding module purpose, dependency flow, API completeness, and example coverage.

---

## Dependency Mapping

**Library dependencies** ⟜ Which module uses what

⊢ **Dependency cleanup (2025-03-11):**
- numhask & harpie-numhask removed: Net.hs works with base Num/Fractional typeclasses. Build: ✓
- containers removed: wordFreqBS changed from Map to list-based accumulator. Test: ✓ "hello world hello" → [("hello",2),("world",1)]
- transformers removed (transitive via mtl): Kept mtl for Co coroutine verification. Build: ✓

**Final library dependencies (10):**
```
aeson, base, bytestring, deepseq, harpie, mealy, mtl, profunctors, text
```

Removed: numhask, harpie-numhask, containers, transformers

**Library dependencies** ⟜ Which module uses what (current):

### Foundation (Category Theory)
- **profunctors** ⟜ Profunctor, Costrong, Strong typeclasses
  - Used by: Traced, Para, LensS (Profunctor instances, contravariance)
- **mtl** ⟜ Monad transformer library (pulls in transformers transitively)
  - Used by: Hyp (Control.Monad.Cont, callCC in send/send' for coroutine verification)

### Data structures & computation
- **mealy** ⟜ Data.Mealy (state machine type)
  - Used by: Traced.Mealy (lifting and composition)
  - **Critical:** This is what Hyp Mealy wraps to avoid Rec {} heap pattern
- **harpie** ⟜ Array operations (works with base Num/Fractional)
  - Used by: Net (A.Array, A.mult, A.transpose, A.zipWith, etc.)
- **containers** ✗ REMOVED (2025-03-11)
  - Was used by: Lexer (wordFreqBS)
  - Solution: Replaced Map-based wordFreqBS with list-based accumulator
  - Return type changed: `Map ByteString Int` → `[(ByteString, Int)]`
  - Trade-off: O(n²) in distinct word count vs. O(n log n) with Map, but no external dependency
- **deepseq** ⟜ NFData for strict evaluation
  - Used by: Lexer (NFData instances for tokens)

### I/O and serialization
- **aeson** ⟜ JSON encoding/decoding
  - Used by: Log (JSONL session format, ToJSON/FromJSON instances)
- **bytestring** ⟜ Efficient byte sequences
  - Used by: Lexer (zero-copy ByteString operations), Log (JSONL I/O)
- **text** ⟜ Unicode text
  - Used by: Log (EntryId, session fields), Lexer (Word lexer output)

### Exe-only (speed-yarn)
- **flatparse** ⟜ Parser combinator
  - Comparison baseline in speed-yarn
- **html-parse** ⟜ HTML tokenizer
  - Comparison baseline in speed-yarn
- **markup-parse** ⟜ Markup parser
  - Integration in speed-yarn, imported as MarkupParse
- **optparse-applicative** ⟜ CLI parsing
  - speed-yarn command-line interface
- **perf** ⟜ Performance measurement
  - Instrumentation framework (ffap, fap, reportMainWith)
- **bifunctors** ⟜ Bimap, bifunctor typeclasses
  - Used in speed-yarn (unsure of exact location—check usage)

---

## Module Purposes (Narrative)

### **Traced** — Foundational: Free Traced Monoidal Category

**What it is** ⟜ Syntax tree for composable morphisms over any base category
**Category Theory** ⟜ Four constructors: Pure (identity), Lift (embed), Compose (sequential), Loop (feedback)
**Key insight** ⟜ Mendler-style normalizer in runFn handles:
  - Associativity: left-nested Compose reassociates right
  - Sliding law: Loop on left absorbs Compose on right (the left-compose issue!)
**Lawvere architecture** ⟜ Syntax is Traced arr, semantics is arr, run is the evaluation functor

**Uses of Traced:**
- ✓ Traced (->) for function pipelines
- ✓ Traced Mealy for state machine composition
- ✓ Traced (Hyp (->)) for second-order structures (runHypWu)

**Exported items** ⟜ Traced (GADT), lift, build, untrace, run, runFn, close, closeFn, Producer, Consumer, done, emit, finish, receive, mergePipe, runPipe, fib, untilT

**[TODO: doctest coverage check]**


### **Hyp** — Final: Hyperfunctions with Recursion in Type

**What it is** ⟜ Corecursive encoding: newtype Hyp arr a b = Hyp { ι :: arr (Hyp arr b a) b }
**Recursion model** ⟜ Knots tied in types, not lazy fixed points in run
**Operators** ⟜ (↬) for functions, (⊲) for stream cons, (⊙) for composition
**Key operation** ⟜ zipper is productive corecursion (unrolls one layer per call)

**Uses of Hyp:**
- ✓ Hyp (->) for first-order hyperfunctions (Kidney & Wu)
- ✓ Hyp Mealy for zero Rec {} overhead state machines
- ✓ Hyp (->) as morphisms in Traced (↬ in second-order)

**Bridges** ⟜ toHyp (preserves Loop in tower), toHypF (eager fixed point), fromHyp (inverse)
**Examples** ⟜ zip, Producer, Consumer, Channel, Co (coroutine)

**[TODO: doctest coverage check]**


### **Traced.Mealy** — Bridge: Catamorphism to Hyp

**What it is** ⟜ Converts Traced Mealy → Hyp Mealy (avoiding Rec {} heap)
**Why it matters** ⟜ Recursive interpreter in Traced causes allocation; zipper is productive
**Exported** ⟜ fromMealy, liftH, loopH, idH (identity), runHyp

**Uses** ⟜ Called from Hyp to interpret Traced Mealy
**[TODO: doctest for fromMealy conversion]**


### **Lexer** — Proof of Speed: Zero-copy State Machines

**What it is** ⟜ ByteString lexers using Mealy state machines
**Performance principle** ⟜ Machines never allocate ByteStrings; unsafeIndex + unsafeSlice
**Allocation** ⟜ O(tokens), not O(bytes)
**Two pipelines** ⟜ Word lexer (simple), Markup lexer (with context states)

**Uses of Traced/Hyp** ⟜ Conceptually Mealy, but Lexer is hand-written for speed
**[RENAME CANDIDATE]** ⟜ If we add Parser module, Lexer becomes Lexer.Token + Lexer.State

**Exported** ⟜ runWordLexerBS, wordFreqBS, MarkupCtx, MarkupToken, runMarkupLexerBS, runMarkupStateBS, WI, AccState, classifyByte, accumStep, ByteClass, initOAccState

**[TODO: doctest coverage for each exported function]**


### **Net** — Example: Neural Network Layers (Status: Needs Explanation)

**What it is** ⟜ Composable forward/backward pass layers via Traced (Para (NetParams a))
**Architecture** ⟜ Para threads parameters through; LensS provides layer access
**Forward** ⟜ linear1 → bias1 → relu1 → linear2 → bias2 (composition)
**Backward** ⟜ Store (gradient) contravariant composition via andThen

**Uses of Traced** ⟜ Lift morphisms, Compose for layer stacks
**Uses of Hyp** ⟜ (indirectly via Para)

**Exported** ⟜ NetParams, lensW1, lensB1, lensW2, lensB2, linear1, bias1, relu1, linear2, bias2, model, forward, linear1B, bias1B, relu1B, andThen, (+.), (+=), grad, gradAll, gradModel, trainFwd, trainFwd', loss, mse

**[TODO: Needs explanation. What does each function do? Why does it export all these?]**
**[TODO: Testing. No tests visible. Can we add doctests?]**


### **Para** — Helper: Profunctor for Parameter Threading

**What it is** ⟜ newtype Para p a b = Para { unPara :: (p, a) -> b }
**Purpose** ⟜ Thread parameters (p) through composition without explicit passing
**Instance** ⟜ Profunctor, Strong, Costrong, Arrow, ArrowLoop

**Uses** ⟜ Net module uses Para (NetParams a) to thread weights and biases
**[TODO: doctest example showing parameter threading]**


### **LensS** — Helper: Simple Lens Type

**What it is** ⟜ LensS p a = Store a (a -> p) where Store is a comonad
**Purpose** ⟜ Get/set individual fields from parameter record without traversals
**Instance** ⟜ Profunctor, Strong, Costrong

**Uses** ⟜ Net uses lensW1, lensB1, etc. for layer access
**[TODO: doctest example showing get/set]**


### **Log** — Development: Pi Session Mirroring

**What it is** ⟜ JSONL session log format, tree structure via parentId
**Semantic isomorphism** ⟜ Mirrors ~/.pi/agent/sessions/ entry format
**Entry types** ⟜ SessionEntry, MessageEntry, ModelChangeEntry (extensible)
**Goal** ⟜ Ground truth for collaborative human-AI workflows

**Exported** ⟜ EntryId, Log, Entry, Message, ContentItem, Role, Agent, getId, getParentId, newLog, appendEntry, getEntry, getChildren, getBranch, loadJSONL, fork

**[TODO: Testing. What does branching/forking do?]**
**[TODO: Integration. How does this connect to the rest of yarn?]**

---

## Traced vs Hyp: Where Used

### **Traced used directly:**
- Lexer pipeline composition (runMarkupStateBS via run)
- Net layer composition (run model)
- Speed-yarn benchmarks (comparison baseline)

### **Hyp used directly:**
- Hyp (->) examples: zip, Producer, Consumer, Channel, Co
- Hyp Mealy via Traced.Mealy (fromMealy)
- Bridges: toHyp, toHypF, fromHyp, runHypWu

### **Neither (pure utilities):**
- LensS, Para, Log (standalone, used by Net)

---

## API Completeness & Doctest Coverage

### **Traced** — 12 exports, coverage TBD
```
[TODO: Run this]
ghci> :set prompt "λ> "
λ> import Traced
λ> runFn (Lift (+ 1) . Lift (* 2)) 5  -- should be 11
```

### **Hyp** — 18+ exports, coverage TBD
```
[TODO: Example]
λ> runFn (zipper (rep (+ 1)) (rep (* 2))) 5 -- should produce infinite composition
```

### **Lexer** — 11 exports, some have docs but no doctests
```
[TODO: doctest]
λ> runWordLexerBS "hello world"
["hello", "world"]
```

### **Net** — 12+ exports, needs explanation
```
[TODO: What does each do? Is it all needed?]
```

### **Para, LensS** — Low-level, mostly instance implementations
```
[TODO: Doctest one get/set example]
```

### **Log** — 10 exports, API unclear
```
[TODO: What does fork do? How do you use loadJSONL?]
```

---

## Speed-yarn Measurement

**Currently measured:**
- html-parse tokens (baseline)
- hand-written tokenize (Lexer.runMarkupLexerBS)
- Traced (->) tokenize (Lexer.runMarkupStateBS)
- flatparse tokenize
- Various whitespace and parsing micro-benchmarks

**Not measured:**
- [ ] Hyp (->) zip vs list zip
- [ ] Hyp Mealy vs Traced Mealy (same pipeline, different encoding)
- [ ] Net forward pass performance
- [ ] Log I/O performance
- [ ] Para parameter threading overhead

**[TODO: Add benchmark suite for Hyp, Net, Log examples]**

---

## Immediate Questions (Listener Feedback)

1. **Traced left-compose and Mendler algebra** — I see runFn handles reassociation, but I don't see explicit "sliding law" verification. Can you show a doctest that demonstrates why Loop on the left absorbs Compose?

2. **Net module status** — You say "just worked" but it exports 12+ functions. Are all of them needed? What's the teaching example here?

3. **Lexer → Parser** — Do you want a separate Parser module for parsing (vs lexing), or rename Lexer to handle both?

4. **Log integration** — How does Log connect to yarn's core (Traced/Hyp)? Is it a standalone utility or does Log output drive Traced computation?

5. **functorio** — You mentioned it separately. Should yarn's examples reference it, or is it truly independent?

