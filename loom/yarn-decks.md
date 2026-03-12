# Yarn Decks

## 1. No recursive interpreters: Hyp avoids the Rec {} heap pattern

**Problem** ⟜ Traced Mealy with recursive interpreter generates Rec {} heap allocations in GHC Core
**Solution** ⟜ Hyp Mealy with zipper: each composition unfolds one layer corecursively
**Code path** ⟜ fromMealy maps Compose → zipper, which is productive (no recursive interpreter)
**Result** ⟜ GHC sees plain Mealy compositions in the final code

*Verified in: Traced.Mealy.hs module docstring*


## 2. Composable state machines: Mealy machines compose without recompilation

**Composition** ⟜ zipper unfolds corecursively, each step unfolds one ι layer
**State flow** ⟜ m's state threads through the tower (liftH in Traced.Mealy)
**Runtime** ⟜ No new interpreter needed; Mealy is just plain composition at runtime

*Partially inferred:* The "without recompilation" part is my reading—the code says GHC sees plain Mealy compositions, which implies no recompilation overhead, but it doesn't use that exact phrase.


## 3. Zero-copy parsing: Lexers work directly on ByteString

**Principle** ⟜ Machines never allocate ByteStrings; drive via unsafeIndex
**Token output** ⟜ unsafeSlice for emission — genuinely zero copy
**Allocation** ⟜ O(tokens), not O(bytes)—each step is unboxed

*Verified in: Lexer.hs module docstring*


## 4. Second-order structures: Can nest hyperfunctions within Traced

**What it is** ⟜ Traced (Hyp (->)) a b — Traced where arrows are hyperfunctions themselves
**Interpreter** ⟜ runHypWu :: Traced (Hyp (->)) a b -> Hyp (->) a b
**Feedback** ⟜ Loop over hyperfunctions, tied via traceHypWu lazy fixed point
**Architecture** ⟜ Hyperfunctions nesting hyperfunctions; second-order feedback towers

*Verified in: Hyp.hs (runHypWu, traceHypWu, module docstring)*


## 5. Pi integration: Log module mirrors agent session format for collaborative AI workflows

**Format** ⟜ JSONL, append-only, tree structure via parentId (semantic isomorphism with pi)
**Entries** ⟜ Session, Message, ModelChange, Tool nodes all JSON-serializable
**Goal** ⟜ Ground truth for pi-mono agent session format; branching/forking support
**Why it matters** ⟜ Enables session log capture for collaborative human-AI workflows

*Verified in: Log.hs module docstring. But "collaborative AI workflows"—that's my framing. The code says "semantic isomorphism with pi session logs" but doesn't explicitly call itself a collaboration enabler. Fair inference though, given pi-mono is a human-AI collaborative harness.*

⟝ get send and a Co example working.

```haskell
import Control.Monad.Cont

send ::
  (MonadCont m) =>
  Co r i o m r ->
  i ->
  m (Either r (o, Co r i o m r))
send c v = callCC $ \k ->
  Left
    <$> invoke
      (route c (\x -> Hyp (\_ _ -> return x)))
      (Hyp (\r o -> k (Right (o, Co (const r)))))
      v

send' :: (MonadCont m) => Co x i o m x -> i -> m (o, Co x i o m x)
send' c v = either undefined id <$> send c v
```
