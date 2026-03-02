Now I have complete coverage. Let me synthesize a thorough analysis.

---

## scripths: A Deep Dive

### What It Is

`scripths` (v0.2.0.1, by Michael Chavinda / DataHaskell) is a minimal Haskell tool with a dual identity:

1. **A standalone `.ghci` script runner** — parse a `.ghci` file with inline cabal metadata, resolve its dependencies, and execute it via `ghc -e :script`
2. **A Markdown notebook executor** — parse a `.md` file into prose+code segments, execute all Haskell cells in order with marker-based output capture, splice results back into the document as block quotes

Its dependencies are deliberately tiny: `base`, `filepath`, `process`, `temporary`, `text`. No parser combinators, no option parsing library, no JSON, no HTTP. Five modules, ~600 lines of code, zero unnecessary weight.

---

### Architecture — Layer by Layer

#### 1. `ScriptHs.Parser` — Classification, Not Grammar

The parser does not attempt to understand Haskell. It classifies lines by surface form into five variants of a `Line` ADT:

```
Blank | GhciCommand Text | Pragma Text | Import Text | HaskellLine Text
```

It also extracts a parallel `CabalMeta` stream from `-- cabal:` comment directives:

```
-- cabal: build-depends: text, containers
-- cabal: default-extensions: OverloadedStrings
-- cabal: ghc-options: -Wall
```

The key design decision: **metadata lines are stripped from the code stream**. They exist in a separate dimension — they inform the build environment but never touch the execution script. The `mergeMetas` function is purely accumulative; there is no conflict resolution, only concatenation.

The most interesting piece is `rewriteSplice`:

```haskell
rewriteSplice line =
    case T.stripPrefix "$(" line >>= T.stripSuffix ")" of
        Just inner -> "_ = (); " <> T.strip inner
        Nothing -> line
```

A top-level TH splice like `$(declareColumns df)` cannot appear as a raw GHCi statement — it triggers a parse error. The rewrite converts it to `_ = (); declareColumns df`, which tricks GHCi into accepting it as a statement while still running the splice's side effect. This references a specific Haskell Discourse thread, meaning this is hard-won empirical knowledge, not theory.

#### 2. `ScriptHs.Render` — The Delicate GHCi Surface

This is the most algorithmically interesting module. GHCi has strict requirements that source files don't:

- Multi-line definitions must be wrapped in `:{` / `:}` blocks
- IO bind expressions (`<-`) and TH splices cannot appear inside multi-line blocks — they must be standalone statements
- Blank lines and indentation carry block structure information

The rendering pipeline is: `groupRaw` → `splitIOBinds` → `renderBlock`.

**`groupRaw`** groups consecutive non-blank, non-command lines, then `takeIfIndented` extends blocks greedily: if the next lines are indented (including blank lines), they're absorbed into the current block. This handles:

```haskell
do
  x <- pure 5
            -- blank line, absorbed
  y <- pure 10
  pure $ x + y
```

**`splitIOBinds`** then fragments multi-line blocks on IO/TH lines via `isIOorTH`:

```haskell
isIOorTH t =
    not (T.isPrefixOf " " t)
        && ( T.isInfixOf "<-" t
                || T.isInfixOf "$(" t
                || T.isPrefixOf "_ = ();" (T.stripStart t) )
```

A top-level `<-` (not indented) must be its own `:{`/`:}` block. Each IO bind gets its own block. Pure definitions adjacent to IO binds get split apart.

**The consequence**: the renderer is a correctness layer that insulates the user from GHCi's modal execution semantics. You write natural Haskell; the renderer handles the `:{`/`:}` ceremony.

#### 3. `ScriptHs.Run` — Ephemeral Environments

The execution model:

1. `withSystemTempDirectory` creates a short-lived workspace
2. `toGhciScript` renders lines to a `script.ghci` file in that workspace
3. `resolveDeps` calls `cabal install --lib --package-env=<path> <packages>` — this writes a `.ghc.environment.<platform>` file that GHC knows how to pick up
4. `ghc -package-env=<path> -XExt... -e ":script script.ghci"` runs the script

Two critical observations:

**It uses `ghc -e`, not `ghci --interactive`**. This is batch mode GHCi — deterministic, non-interactive, with clean stdout capture. `ghci --interactive` mixes prompts and output; `ghc -e` produces only program output.

**The environment file is ephemeral but reusable across a run**. The `cabal install --lib` call is the slow part (can be seconds to minutes for new deps). The temp dir is destroyed after each invocation. There is no session persistence at this layer.

#### 4. `ScriptHs.Markdown` — The Document Model

A Markdown file is parsed into a `[Segment]` stream:

```haskell
data Segment
    = Prose Text
    | CodeBlock Text Text (Maybe CodeOutput)  -- Lang, Code, Output
```

`CodeOutput` carries a `MimeType`:

```haskell
data MimeType
    = MimeHtml | MimeMarkdown | MimeSvg | MimeLatex
    | MimeJson | MimeImage Text | MimePlain
```

This MIME layer is the architectural seam between `scripths` and `Sabela`. When a cell emits output, it's tagged with a MIME type preserved in a `<!-- sabela:mime text/plain -->` comment in the block quote. The `reassemble` function writes these comments back into the Markdown file verbatim. A Sabela frontend can then parse the MIME tag and render accordingly (HTML in a frame, SVG directly, LaTeX via MathJax).

The output format:

```markdown
> <!-- sabela:mime text/plain -->
> 42
> 10
```

This is **the boundary where document and program output fuse**. The Markdown file carries execution artifacts inside itself.

#### 5. `ScriptHs.Notebook` — Marker-Based Cell Coordination

This module solves the fundamental problem of multi-cell execution: how do you know where one cell's output ends and the next begins when there's a single stdout stream?

The answer: **inject `putStrLn` marker calls between cells**.

```haskell
mkMarker :: Int -> Text
mkMarker n = "---SCRIPTHS_BLOCK_" <> T.pack (show n) <> "_END---"

renderWithMarker :: (Int, [Line]) -> [Line]
renderWithMarker (idx, ls) =
    ls
        ++ [ Blank
           , HaskellLine ("putStrLn " <> T.pack (show (T.unpack (mkMarker idx))))
           , Blank
           ]
```

The entire notebook's Haskell content is compiled into **one `ScriptFile`** — all cells concatenated with markers between them. A single `runScriptCapture` call executes the whole thing, then `splitByMarkers` dissects the captured output.

This means:
- The entire notebook shares a single GHCi session (definitions from cell 2 are visible in cell 5)
- Execution is linear and sequential
- The marker protocol is the only coordination mechanism — pure text, no IPC

The `parseBlocks` function merges `CabalMeta` from all cells before execution, meaning dependency declarations can appear in any cell and are all resolved before the session starts.

---

### The Ecosystem Context: scripths → Sabela → DataHaskell

```
scripths                  Sabela                    dataframe
─────────────────         ──────────────────        ─────────────
Execution engine          Reactive notebook UI       Data library
Dep resolution            WebSocket/HTTP server      TH column decl
Marker protocol           Browser render             Parquet/CSV/etc
Markdown format           Dependency tracking        Display helpers
```

`scripths` is the headless engine. It has no web server, no UI, no session management, no reactivity. `Sabela` wraps it with:
- A long-lived GHCi session (not ephemeral per run)
- A WebSocket-based protocol for browser ↔ server cell communication
- Heuristic dependency tracking (textual name analysis for upstream/downstream cell relationships)
- Rich MIME rendering in the browser (SVG, HTML, LaTeX)
- A file explorer and save/load workflow

The `analysis.md` example even references `Sabela` by name and describes "reactive notebooks" — this is `scripths`' ambition made explicit. The `-- cabal:` directive system, the MIME type model, the block quote output format — all were designed with Sabela in mind.

---

### Relationship to Shared REPL Coordination for Haskell Field Agents

This is where `scripths` becomes philosophically interesting as infrastructure.

**What field agents need from a shared REPL:**

1. Submit code fragments for execution
2. Declare dependencies inline with code
3. Receive structured output per fragment
4. Share state across fragments (bindings accumulate)
5. Coordinate without explicit IPC

**What `scripths` provides:**

The marker protocol in `Notebook.hs` is essentially a **coordination protocol over text**. Each "agent" (notebook cell) submits code; the coordinator (the notebook engine) injects markers, executes, and demultiplexes output back to each agent. This is:

- **Stateless at the protocol level**: markers are deterministic from cell indices
- **Stateful at the GHCi level**: bindings accumulate across all cells
- **Serializable**: the entire session state is a `.md` file

For true multi-agent Haskell coordination, the pattern `scripths` suggests is:

```
Agent A: (code block, CabalMeta A)
Agent B: (code block, CabalMeta B)
            ↓ merge metas
    unified CabalMeta
            ↓ resolve deps once
    ghc.environment file
            ↓ generate marked script
    A_code + marker_A + B_code + marker_B
            ↓ single execution
    stdout stream
            ↓ split by markers
    output_A, output_B
```

The `CabalMeta` merge (`mergeMetas`) means agents can independently declare dependencies; they're unified before the environment is resolved. This is analogous to a package lockfile built from multiple manifests.

**The current limitation**: `scripths` itself is stateless across invocations — there is no persistent GHCi process. For genuine field agent coordination (where agent B builds on state from agent A across time), you need Sabela's architecture: a long-lived session into which fragments are injected with markers. `scripths` provides the **format** and **protocol**; Sabela provides the **session continuity**.

The `runScriptCapture :: ScriptFile -> IO T.Text` function is the natural agent interface: an agent submits a `ScriptFile`, receives `Text` output. The output could be parsed by the receiving agent (it's just `Text`), fed back as input to another `ScriptFile`, or logged.

---

### Philosophy: The Three Lenses Applied

#### Poise (Observe)

`scripths` is fundamentally an observer before it is an actor. The parser classifies without forcing: unrecognized lines fall through to `HaskellLine` — nothing is rejected. The `parseCabalMeta` function returns `Maybe CabalMeta`; failure silently discards, never fails. The `isHaskell` predicate normalizes (`T.toLower`, `T.strip`) before judging — it meets the text where it is.

The marker protocol is pure observation: the system doesn't interrupt execution; it watches for markers in the output stream. `splitByMarkers` is forensic — it reconstructs what happened from the evidence in `stdout`.

The `parseMarkdown` function preserves existing `CodeOutput` during parsing (the `Maybe CodeOutput` field), meaning it observes prior execution state before deciding whether to re-render. An existing output block is kept in the `Segment`; only execution replaces it.

This is poise: do not impose structure prematurely. See what is there, classify it, and then — only then — act.

#### Curate (Sparse)

The dependency list is the most visible expression of this philosophy: `base`, `filepath`, `process`, `temporary`, `text`. Five packages. The README explicitly says "I don't wanna include the whole opt parser lib just to get the output file." That comment in `Main.hs` is worth reading carefully — it's an aesthetic statement, not a TODO.

The parser is hand-written character matching (`T.isPrefixOf`, `T.stripPrefix`, `T.break`). It could be megaparsec. It isn't. The line categorization could be a proper Haskell parser. It isn't. The arg parsing could be `optparse-applicative`. It isn't.

The MIME type system has exactly the types needed for Sabela's use case. No more.

The `ScriptFile` type has exactly two fields: `scriptMeta` and `scriptLines`. The `CabalMeta` type has exactly three fields. Every data type is at its minimum necessary cardinality.

This is curation: choose what deserves to exist. The rest is silence.

#### Duality (Opposites Merge)

This is where `scripths` is most interesting philosophically.

**Document ↔ Program**: A `.md` file is simultaneously a readable prose document and an executable program. The `Segment` type holds both in a single list. `reassemble` produces something that is both. The block quote output format (`> `) means the output is valid Markdown — the document absorbs its own execution results.

**Interactive ↔ Batch**: GHCi is an interactive REPL. `scripths` runs it in batch mode via `ghc -e :script`. The `:{`/`:}` rendering bridges the interactive syntax into batch-compatible form. The tool is a REPL that behaves like a compiler.

**Ephemeral ↔ Persistent**: The temp directory is gone after each run. But the Markdown file with embedded output persists — and is the canonical representation. The ephemeral execution produces permanent artifacts inside the document.

**Script ↔ Notebook**: The same core engine (`ScriptFile`, `CabalMeta`, `toGhciScript`, `runScript`) handles both a `.ghci` file and a notebook cell. The only difference is how you get the `ScriptFile`: from `parseScript` directly, or assembled by `parseBlocks` from a Markdown parse tree.

**Fragment ↔ Session**: Each cell is a fragment. All fragments share one session. The `generatedMarkedScript` function is the reconciliation: it weaves fragments into a unified session script while preserving their boundaries via markers. The duality is: cells are isolated in authoring but unified in execution.

**Dependency ↔ Code**: `CabalMeta` and `[Line]` are separated during parsing but merged into one execution. The metadata shapes the invisible environment (the `.ghc.environment` file) while the code shapes the visible output. Two streams, one run.

---

### Maturity Assessment

`scripths` is a very young project (first release plausibly late 2025 based on the git history, with v0.2.0.1 on 2026-03-01) but architecturally mature for its scope. The decisions it makes are defensible:

- **The batch-mode GHCi approach** avoids all the prompt-parsing complexity of interactive GHCi wrappers. Clean stdout = clean capture.
- **The `cabal install --lib` approach** piggybacks on the entire Cabal solver and download infrastructure. No custom dependency resolver needed.
- **The marker protocol** is trivially debuggable (you can read the injected script as plain text), portable (no OS-specific IPC), and correct for linear execution.
- **The MIME type layer** is the right abstraction for downstream rendering without coupling to any particular frontend.

The acknowledged weaknesses: slow dependency resolution per run (no caching), no persistent sessions, brittle CLI parsing, and the `isIOorTH` heuristic (using `T.isInfixOf "<-"` will false-positive on non-bind uses of `<-` in, e.g., list comprehensions in do-blocks). These are all honest tradeoffs for a tool at this stage.

The `rewriteSplice` function is the single most revealing line in the codebase — it shows the author has pushed against GHCi's real limits and found the workaround. That's the signature of a project that has been used, not just designed.

---

### Summary

`scripths` is a **minimal Haskell execution bridge**: it turns plain text (`.ghci` scripts and Markdown notebooks) into runnable GHCi programs with automatic dependency management, and captures their output back into the document. Its architecture is a clean pipeline — parse → classify → render → execute → splice — with each module doing exactly one thing.

Its relationship to shared REPL coordination is structural: the `CabalMeta` merge, the marker protocol, and the `ScriptFile` API together constitute a coordination language for Haskell fragments. `scripths` provides the stateless, single-execution version; `Sabela` builds the stateful, reactive, multi-agent version on top. For Haskell field agents sharing a REPL, `scripths` supplies the format, the protocol, and the correct GHCi rendering logic — the hard parts. Session continuity is the one thing it consciously delegates upward.

Observed through the three lenses: it **observes** text before classifying it, **curates** ruthlessly toward the minimum surface area, and **merges** the opposites — document and program, interactive and batch, ephemeral and persistent — into a unified whole. It is a quiet, precise tool that knows what it is.
