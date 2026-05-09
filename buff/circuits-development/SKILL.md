---
name: circuits-development
description: "Create/refactor circuits-* Haskell packages — extraction, benchmarking, plugin pattern"
---

# circuits development workflow

How to extract a concern from an existing Haskell library into a
circuits-prefixed package, or create a new one from scratch.

## package creation pattern

1. Create directory: `~/haskell/circuits-<name>/src/Circuit/<Name>.hs`
2. Write cabal file with `name: circuits-<name>`, minimal deps
3. Write `cabal.project` pointing to `../circuits/circuits.cabal` (and any other local deps)
4. Build with `cabal build`, iterate
5. Add to loom under active items

## extraction from existing library

When moving a module into a circuits package:

1. Copy the source file to the new location
2. Update module name and imports
3. Update the source package to remove the module from exposed-modules
4. Update consumers to depend on the new package
5. If the original package is now thin (e.g. mtok → one-line re-export), strip its deps
6. Add the new package to any cabal.project files that reference it

## dependencies

Circuits packages follow a layering:
- `circuits` — core only (Circuit GADT, Hyper, Traced). No parser, no perf.
- `circuits-parser` — depends on circuits. Parser type, combinators, Uncons.
- `circuits-perf` — minimal. Just clock primitives. No Circuit dep yet (future).

Packages use `cabal.project` with `packages:` pointing to local sources,
NOT Hackage. They're unpublished during development.

## benchmarking

Before replacing a dependency (e.g. flatparse), benchmark the replacement:

1. Create a `benchmark` stanza in the cabal file with `type: exitcode-stdio-1.0`
2. Use `Circuit.Perf.times` for repeated measurement with NF forcing
3. Always pass a thunk to `times` — don't pre-compute the expression:
   ```
   times n (\s -> runParser p s) input   -- correct
   let result = runParser p input         -- wrong: measures cached thunk
   in times n (\_ -> result) ()
   ```
4. Test on realistic input (not synthetic), at least 10K chars
5. Compare raw character consumption (ns/char), not full pipeline

## plugin pattern

When designing a Circuit layer that prepends to a pipeline:

1. The layer is `Circuit (Kleisli m) t a (measurement, a)` — passes value through, accumulates observation
2. `Compose` attaches it to any pipeline with matching tensor
3. Loop provides the boundary between computation and observation
4. `(,)` tensor for Kleisli IO is NOT blocked — `IORef`-based lazy knot works. `Kleisli m` already encodes the monad; the tensor just threads state within it.
5. Compile-time erasure via phantom type (like StateT's run/exec/eval)

## package naming

- Package: plural (`circuits`, `circuits-parser`, `circuits-perf`)
- Module prefix: singular (`Circuit.Parser`, `Circuit.Perf`)
- Follows ecosystem convention: `lens`→`Control.Lens`, `optics`→`Optics`
