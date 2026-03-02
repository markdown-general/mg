✓ read ~/Downloads/Recipe.hs
✓ read ~/repos/tcat/src/Traced.hs - core GADT (renamed traced -> tcat)
✓ read ~/repos/tcat/src/Lexer.hs - state machine lexer example
✓ read ~/repos/tcat/src/Net.hs - neural net example
✓ create functorio library in ~/repos/functorio
✓ Recipe.hs compiles
✓ functorio builds with tcat dependency
✓ Created Factorio.hs (exploration notes on category design)
✓ Created Flow.hs v1 (attempted Flow category)
✓ Updated Flow.hs with DataKinds approach
  - Item promoted to kind via DataKinds
  - Flow 'IronOre 'IronPlate well-typed
  - Type-safe composition: Flow b c -> Flow a b -> Flow a c
  - Identified: multi-input flows need tensor/monoidal structure (deferred)
✓ functorio compiles cleanly
⟝ create a Haskell skills card from the session.

Some context:

Coding is a two stage process - we take results to the design team and they send back fixed and extensions to the work. Results includes bugs, code changes and ideas.

The objective is actually to learn about Factorio and create an example usage of the Traced category we have developed. This is in ~/repos/traced/. 

