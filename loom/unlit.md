Setup plan:

 https://github.com/sol/markdown-unlit/readme.md might do the trick. The trick
 being to have a completely markdown card with haskell fence blocks that can be
 included in compilation, haddocks and doctesting.
 
 1. Add markdown-unlit to circuits.cabal
   ```
     build-tool-depends: markdown-unlit:markdown-unlit
     ghc-options: -F -pgmF markdown-unlit
   ```

 2. Create cards in ~/haskell/circuits/other/ (flat):
     - lazy-knot-tying.md
 
 3. Update ~/buff/haskell.md with:
     - Markdown-unlit workflow (markdown is source)
     - How to write a card (prose + fence blocks + diagrams)
     - Example extraction/doctest flow

 4. Explore modern tooling in markdown:
     - Mermaid graphs: \``mermaid ... ````
     - String diagrams: inline SVG (chart-svg) or mermaid notation
     - Commute diagrams: LaTeX or tikz-style notation (render via mermaid plugin)
     - Haskell fence blocks: automatically extracted via markdown-unlit

 Workflow for a card:

 ```markdown
   # lazy-knot-tying

   The feedback channel is a lazy knot...

   ## How it works

   \`\`\`mermaid
   graph LR
     A["(a, c)"] -->|unfirst| B["(b, c)"]
     B -->|feedback| A
   \`\`\`

   ## Example

   \`\`\`haskell
   {-# LANGUAGE RecursiveDo #-}

   unfirst :: ((a, c) -> (b, c)) -> (a -> b)
   unfirst f a = b where (b, c) = f (a, c)
   \`\`\`

   Tests run via doctest + markdown-unlit.
 ```

