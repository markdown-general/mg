# zone/jobs/pushdown.md

**pushdown** ⟜ propagating high-level changes down through system layers

## when to pushdown

**nub rewritten** ⟜ source of truth changed at high level (e.g., welcome.md)
**downstream unknown** ⟜ tail material in uncertain state after nub changes
**semantic debt** ⟜ terms changed, structure shifted, orphans created

A pushdown is needed when high-level rewrites leave lower-level elaborations misaligned.

## the contract

**nub unchanged** ⟜ pushdown doesn't touch the top, it's not a pushup or pusharound
**conservative trace** ⟜ read up from tail to nub, don't elaborate nub downward
**preserve quality** ⟜ tail material may be higher quality than any fresh nub elaboration
**respect accumulation** ⟜ hard-won knowledge in tail is expensive to lose

The expensive mistake: elaborate nub quickly → compare tail to elaboration → rewrite tail to match. This loses accumulated knowledge.

The conservative move: read tail → trace to nub → rate fitness → map results.

## primary tool

**curate.md** ⟜ pushdown is curation work

Use curate principles throughout:
- **sculpt** ⟜ find form through structure updates
- **prune** ⟜ remove orphans, keep semantic cores
- **structure** ⟜ respect existing relationships
- **trace** ⟜ upward path from tail to nub
- **breathe** ⟜ leave space, don't force alignment

## the work

### Phase 1: Upward trace

**Read tail material** ⟜ component by component, file by file
**Match to nub** ⟜ which nub concept does this elaborate? (one, many, none)
**Rate fitness** ⟜ STRONG, GOOD, WEAK, ORPHAN

Output: mental map of current state

### Phase 2: Structural fixes

**Quick wins** ⟜ directory name changes, typo fixes, obvious updates
**No curation** ⟜ mechanical replacements only
**Fast** ⟜ these should be trivial

Examples:
- content/ → work/
- base → work
- Spelling corrections
- Remove obvious orphan lines

### Phase 3: Renames and relocations

**File operations** ⟜ mv, cp, updating first lines
**Semantic drift** ⟜ terminology evolved, files need to follow
**Directory alignment** ⟜ technical files to zone/, work files to work/

Examples:
- card.md → tools.md
- haskell.md → zone/tools/

### Phase 4: Splits

**Curation decisions** ⟜ some files need to be split apart
**Mixed fitness** ⟜ part good, part orphan, part belongs elsewhere
**Extraction** ⟜ pull out pieces for separate handling

This is where pushdown transitions from mechanical to judgment-based.

### Phase 5: Major reorganizations

**Structural moves** ⟜ entire files absorbed into others
**Elaboration work** ⟜ filling major holes
**New jobs** ⟜ complex reorganizations become separate jobs

Critical decision: pushdown vs new job
- Simple structural move → finish in pushdown
- Complex reorganization → extract as separate job

## outputs

**Reorganized tail** ⟜ existing material rearranged for coherence with nub
**Quality report** ⟜ fitness scores, holes identified, new jobs described
**Cache ready** ⟜ full context loaded, ready to elaborate if needed

The quality report should include:
- What changed (mechanical fixes)
- What holes remain (major, minor)
- What mismatches are acceptable (semantic drift)
- What new jobs were created (complex work extracted)

## stopping points

**After Phase 2** ⟜ if only structural fixes needed, stop and report
**After Phase 4** ⟜ if major reorganizations surface, extract as jobs and stop
**After Phase 5** ⟜ if simple reorganizations complete, finish and report

A pushdown can be:
- **Small** ⟜ just structural fixes (Phases 1-2)
- **Medium** ⟜ includes splits and relocations (Phases 1-4)
- **Large** ⟜ major reorganization work (Phases 1-5)

If Phase 5 work seems to need 20%+ of elaboration or extensive curation judgment, extract as separate job.

## elaboration control

**After pushdown** ⟜ you have cache ready to elaborate
**Ask first** ⟜ don't assume elaboration is needed
**Controlled fill** ⟜ if asked to elaborate: one level down, 20% fill maximum
**Group thinking** ⟜ prevent solo overwork without others considering

The quality report logs what's ready. Elaboration is a separate decision.

## example workflow

```
User: I rewrote welcome.md, work/ is now misaligned
Agent: [reads curate.md, begins upward trace]
Agent: [Phase 1: traces all files, rates fitness]
Agent: [Phase 2: fixes content/ → work/ across 4 files]
Agent: [Phase 3: renames card.md → tools.md]
Agent: [Phase 4: extracts markdown.md bullet list]
Agent: [Phase 5: identifies cast.md needs major reorg]
Agent: [extracts cast.md as separate job, stops]
Agent: [writes quality report]
```

## relations

**curate.md** ⟜ primary tool for all pushdown work
**welcome.md** ⟜ typical nub (but any high-level doc can be nub)
**work/** ⟜ typical tail (but any elaboration layer can be tail)

## notes

**Pushdown is preparatory** ⟜ not generative
- Doesn't elaborate the nub
- Doesn't rewrite the tail  
- Just traces, rates, rearranges
- Creates clean state for next decision

**Conservative by design** ⟜ preserves accumulated knowledge
- Tail material may be higher quality than anything you'd write fresh
- Upward trace respects this
- Only prune clear orphans
- Extract complex reorganizations rather than forcing them

**Separation of concerns:**
- Pushdown = alignment and measurement
- Elaboration = separate job, separate decision
- Major reorganization = separate job if complex

The job succeeds when you can clearly see what's aligned, what's orphaned, and what needs more work.
