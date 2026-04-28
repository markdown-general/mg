◊

# grepl ⟜ active workspace

**Status:** Blocking circuits. Recent engineering session complete, now standardizing per buff/haskell.md.

**Repo:** ~/haskell/grepl/ (compiles cleanly)

**Recent Learnings (from engineering session):**
- Circuit tensor types: (,) for simultaneous feedback, Either for sequential
- PTY spawning: posix-pty integration for interactive `cabal repl` 
- Interactive harness: Grepl.CircuitDev module for GHCi development
- Development guide: cards/dev-guide.md documents patterns and workflow
- Local dependency: circuits hooked as dependency (~/haskell/circuits/)

**The Core Problem:** REPL as first-class agent tool
- Agents treat `cabal build` as unit of feedback (expensive)
- Should be using `cabal repl` with type feedback loop (cheap)
- Bidirectional communication with persistent PTY process
- Grepl is the proof-of-concept for aux primitives (REPL optimized for agents, not humans)

---

## Standardization Checklist ⥁

Per buff/haskell.md + buff/haskell-checklist.md standards:

🟣 **Documentation** ⟜ readme.md with agentic focus

⟜ what problem it solves: agent-friendly REPL I/O protocol
⟜ architecture: ChannelConfig, named pipes, PTY spawning
⟜ usage: basic + PTY interaction examples
⟜ design philosophy: why aux primitives matter

🟣 **Module Headers** ⟜ Grepl, Grepl.Watcher haddock + module overview

🟣 **Metadata** ⟜ cabal file updates

⟜ author: Tony Day (currently Anonymous)
⟜ tested-with: expand to GHC 9.14, 9.12, 9.10
⟜ CHANGELOG.md: populate with release notes

🟣 **Code Quality** ⟜ Run full checklist

⟜ cabal build clean
⟜ cabal-gild format
⟜ ormolu format
⟜ hlint check
⟜ cabal-docspec run

🟣 **CI Workflow** ⟜ Copy from ~/haskell/numhask-space/.github/workflows/haskell-ci.yml if missing

🟣 **cabal.project** ⟜ Verify setup, circuits dependency handling

---

## Session Value Extraction

**What was proven in engineering session:**

1. **CircuitDev module works** — provides interactive harness for circuit development in GHCi
2. **PTY spawning works** — spawnCabalRepl, spawnCmd functions tested
3. **Tensor patterns work** — (,) and Either feedback types demonstrated
4. **Composition works** — circuits compose cleanly via Compose
5. **Integration works** — circuits as local dep integrates into grepl

**What needs to be moved into permanent form:**

- dev-guide.md content into module haddocks + readme examples
- CircuitDev docstrings → more explicit about each helper
- dev-guide patterns → reference in module headers

---

## Blockers & Design Notes

**Why grepl blocks circuits:**

Circuits needs a reference implementation of the bidirectional categorical loop. Grepl's PTY-based REPL interaction is that proof. Once grepl is standardized + documented, it becomes the foundation for circuits examples.

**Design intent to preserve:**

- Named pipes for decoupled I/O (robust for agents)
- Markdown logging for auditability (agents need to see history)
- Concurrent watcher pattern (FSNotify background task)
- PTY model: persistent process, bidirectional, stateful

**Don't lose:** The aux philosophy. Grepl isn't trying to be a Python IDE. It's optimized for agent-to-REPL interaction, which is a different constraint set than human-readable output.
