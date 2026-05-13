# tensor ⟜ terminology note

**tensor** is overloaded. In the circuits project it currently means the monoidal product
parameter `t` in `Circuit t a b`. This is the ⊗ of a symmetric monoidal category — the
combining operation, not the combined thing.

In physics and the Bernardy/Jansson paper, a **tensor** is an element of a tensor product
space: a morphism V₁ ⊗ ... ⊗ Vₘ → W₁ ⊗ ... ⊗ Wₙ. The inhabitants, not the operation.

The paper itself calls ⊗ "the tensor product" (as is standard in category theory), so our
usage is defensible. But when we say "the (,) tensor" we mean the monoidal product, not
a rank-2 tensor over pairs. Keep the distinction explicit.

Circuit's `t` = monoidal product. A value of type `Circuit t a b` is a circuit over that
product. Neither is a tensor in the physics sense unless `a` and `b` are themselves tensor
product spaces.
