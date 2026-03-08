# Index: agent-fork Exploration

**Status**: Phase 1 (Setup & Design) — Complete  
**Date**: March 8, 2026  
**Session Type**: Pair programming on shape, not implementation

---

## Cards at a Glance

| Card | Focus | Status | Type |
|------|-------|--------|------|
| **[agent-fork.md](agent-fork.md)** | Main design & terminology | 📘 Complete | Spec |
| **[aeson.md](aeson.md)** | JSON parsing experiments | 📊 Ready to run | Exploration |
| **[bytestring.md](bytestring.md)** | I/O patterns experiments | 📊 Ready to run | Exploration |
| **[ollama.md](ollama.md)** | Local LLM option | 📊 Future exploration | Research |
| **[fork.md](fork.md)** | Pi's fork mechanism (reference) | 📖 Reference | Context |

---

## Quick Navigation

### For Understanding the Shape
1. Read **agent-fork.md** (main spec)
2. Review **fork.md** (Pi's implementation, JavaScript side)
3. Skim **buff/haskell.md** (strategic context)

### For Running Experiments
```bash
# Run aeson experiments
scripths ~/mg/loom/aeson.md -o ~/haskell/agent-fork/test/experiments/aeson.md

# Run bytestring experiments  
scripths ~/mg/loom/bytestring.md -o ~/haskell/agent-fork/test/experiments/bytestring.md

# Run ollama experiments (when ollama is installed)
scripths ~/mg/loom/ollama.md -o ~/haskell/agent-fork/test/experiments/ollama.md
```

### For Implementation References
- **JSONL entry types**: See agent-fork.md → Type Sketch section
- **Session model**: See agent-fork.md → Core Terms section
- **Fork semantics**: See loom/fork.md → Phase 4-6 (test/prompt/response)
- **Token dictionary**: See aeson.md → Experiment 3

---

## Key Files in Codebase

| Path | Purpose |
|------|---------|
| `~/mg/readme.md` | Complete Pi fork analysis (38 pages) |
| `~/mg/buff/haskell.md` | Haskell ecosystem context |
| `~/haskell/agent-fork/src/Agent/Fork.hs` | Current implementation (process management) |
| `~/.pi/agent/sessions/.../*.jsonl` | Real session files (for experiments) |

---

## Design Principle

**"agent-fork owns all JSONL interaction beyond Pi IO effects"**

- **Pi**: subprocess I/O via named pipes (piChannel)
- **agent-fork**: session state, forking, parentage, branching

---

## Questions Being Explored

### aeson.md
- How do we decode polymorphic entry types?
- Lazy vs. strict parsing trade-offs?
- Token indexing for semantic search?

### bytestring.md  
- When to use lazy vs. strict?
- Streaming vs. static loading?
- Memory characteristics on real files?

### ollama.md
- How does local LLM differ from Pi?
- Token context management?
- When to use local vs. cloud?

---

## Experiments & Real Data

**Real Session File:**
```
~/.pi/agent/sessions/--Users-tonyday567-repos-pi-mono--/2026-02-03T18-04-45-234Z_467948cf-b477-4628-95be-c1d52178f004.jsonl
```

**Experiment Output Location:**
```
~/haskell/agent-fork/test/experiments/
```

Each card has 5 runnable experiments designed to:
1. Ground decisions in real data
2. Discover actual type shapes
3. Measure performance characteristics
4. Build the token index
5. Compare alternatives

---

## Next Phase Checkpoints

- [ ] Run aeson experiments, capture output
- [ ] Run bytestring experiments, capture output
- [ ] Refine Entry types from real data
- [ ] Build token index and test lookup performance
- [ ] Update agent-fork.md Type Sketch with findings
- [ ] Prepare for implementation phase

---

## Notes

- **No speculation**: All design decisions wait for scripths output
- **Real data only**: Using actual Pi session files
- **No todo lists**: This is exploratory, shape-finding
- **Fresh updates**: Each card stays fresh as experiments complete

