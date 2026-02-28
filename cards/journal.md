=== Journal Entry 2026-02-26 (session 5, neural network) ===

RESULT: Working neural network via Traced (Para p) with correct gradient descent.

Loss converges: 1.33 -> 0.024 over 20 steps. Fast.

ARCHITECTURE:
- Traced (Para (NetParams a)) a a — forward pass layers
- Para (NetParams a) a (Store (Array a) (BackPass (Array a) a (NetParams a))) — backward pass layers
- Store (fwd output) (bwd fn) — bundles forward value with backward function
- BackPass (inputGrad, paramUpdate) — separates input gradient from weight gradient
- andThen — sequences Store-returning layers, chains backward fns via (.)
- LensS (NetParams a) (Array a) — record accessors for parameter slices

KEY TYPES:
  data Store b a = Store (b -> a) b
  data BackPass arr scalar p = BackPass
    { inputGrad   :: arr -> arr
    , paramUpdate :: arr -> scalar -> p -> p }
  andThen :: Para p a (Store b a) -> Para p b (Store c b) -> Para p a (Store c a)

GRADIENTS VERIFIED:
- linear: dx = W^T dy, dW = dy ⊗ x (outer product via A.expand (*))
- bias: dx = dy (identity), db = dy
- relu: dx = dy * (x > 0) (mask)
- MSE loss: dL/dy = 2/n * (y - target)
- Weight update: W' = W - lr * dW

TEST:
  p = NetParams (A.ident [3,3]) (A.konst [3] 0) (A.ident [3,3]) (A.konst [3] 0)
  x = A.array [3] [1.0, -2.0, 3.0]
  target = A.array [3] [1.0, 0.0, 1.0]
  runModelB p x = ([1,0,3], [1,0,3])  -- forward + input gradient ✓
  step 0.01 p x target -- loss=1.33, w1 updated correctly ✓
  20 steps: loss 1.33 -> 0.024 ✓

FILES:
- src/Para.hs   — Para p a b = (p,a) -> b, Category/Arrow/ArrowLoop/Profunctor/Strong/Costrong
- src/LensS.hs  — LensS via Store comonad, Category instance, mkLensS/getS/setS
- src/Net.hs    — forward layers, backward layers, andThen, step, mseLoss

OPEN:
- Full backprop through all layers (linear2, bias2) via andThen chain
- Batch training loop
- LensS used explicitly in layers (currently uses record accessors directly)
- BackPass andThen — chain BackPass like Store, full chain rule for param updates
- Loss as a Traced morphism

LESSON:
Store b a = (b -> a, b) is the comonadic lens.
Category LensS composes via (.) on the setter — this IS the chain rule.
andThen for Store-returning Para morphisms IS backpropagation.
The categorical machinery and the numerical computation are the same thing.

SESSION NOTE:
Longest session. Full arc:
  <<loop>> on MarkupCtx
  -> Traced (->), Traced (Kleisli m), Traced Mealy
  -> run = id for Mly♭Set
  -> mealyToHyp direct
  -> Para, LensS
  -> Traced (Para p) neural network
  -> working gradient descent
