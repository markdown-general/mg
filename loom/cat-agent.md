# The Agent Category

◊ **Session:** Working narrative on agents as category-theoretic objects

⊢ **Reference:** ~/other/zanzix.github.io/docs/posts/net.md (Zanzi Mihejevs: Para(Optic) construction, free categories, graded paths)

---

## What is a Category?

### Objects and Morphisms

A category has:
- **Objects** — the things we're working with
- **Morphisms** — arrows between objects, representing transformations
- **Composition** — morphisms compose associatively
- **Identity** — each object has an identity morphism

### From Net.md: Free Categories

Zanzi shows this concretely:

```haskell
-- A graph of objects and morphisms
Graph : Type -> Type 
Graph obj = obj -> obj -> Type 

-- Free paths (composition)
data Path : Graph obj -> Graph obj where 
  Nil : Path g a a              -- identity
  (::) : g a b -> Path g b c -> Path g a c  -- composition
```

Matrices form a category: `Matrix n m` is a morphism from `n` to `m`. Paths of matrices compose like matrix multiplication.

### Para: Graded Categories with Parameters

Para lifts this to include **accumulating parameters** as we compose:

```haskell
-- A parameterised graph where each morphism carries a parameter
ParGraph : Type -> Type -> Type 
ParGraph par obj = par -> obj -> obj -> Type 

-- A free graded path that accumulates parameters
data GPath : ParGraph par obj -> ParGraph (List par) obj where 
  Nil : GPath g [] a a  
  (::) : g p a b -> GPath g ps b c -> GPath g (p :: ps) a c
```

This is critical: **composition threads parameters through**. Each step adds a parameter to the accumulated list.

---

## Agents as Objects

