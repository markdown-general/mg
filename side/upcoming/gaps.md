# design gaps

## Holes in the Design

- **Concurrency chaos** ⟜ multiple agents editing same tool simultaneously
- **Cost explosion** ⟜ every workflow requires API calls, gets expensive at scale
- **Offline death** ⟜ system is useless without API access

## Unclear Boundaries

- **When to create vs modify** ⟜ should agent fix pdf-to-md or create pdf-to-md-v2?
- **Tool granularity** ⟜ one tool per function or composable micro-tools?
- **Workflow vs tool** ⟜ is "ingest-paper" a tool or a workflow calling tools?
- **Literate vs executable** ⟜ if tool is markdown, where's the actual binary?
- **Human vs agent authority** ⟜ can agent overwrite human-written tools?

## Ambiguities:

Tool discovery ⟜ how does agent find tools? directory scan? index file? manifest?
Metadata schema ⟜ what fields are required vs optional in tool JSON?
Error propagation ⟜ how do failures bubble up through pipeline?
Atomic operations ⟜ can workflows be transactional or always partial success?

---

## Performance Questions

- **Latency per step** ⟜ agent interpretation adds seconds/minutes per workflow
- **Token consumption** ⟜ reading full tool source for every decision
- **Caching strategy** ⟜ does agent re-analyze tools it just examined?
- **Parallel execution** ⟜ how does agent orchestrate concurrent tool runs?
- **Incremental vs full** ⟜ re-run entire workflow or resume from failure point?
- **Batch optimization** ⟜ processing 100 PDFs shouldn't need 100 planning cycles

---

## Security and Safety

- **Code injection** ⟜ malicious workflow description executes arbitrary commands
- **Filesystem access** ⟜ agent can read/write anywhere, deletes wrong directory
- **API key exposure** ⟜ tools might leak credentials in literate documentation
- **Dependency hell** ⟜ agent installs unvetted packages that compromise system
- **Runaway processes** ⟜ agent spawns infinite loop, consumes all resources
- **Data exfiltration** ⟜ agent sends private content to external services

---

## Ambiguities Needing Clarification

- **Tool discovery** ⟜ how does agent find tools? directory scan? index file? manifest?
- **Metadata schema** ⟜ what fields are required vs optional in tool JSON?
- **Error propagation** ⟜ how do failures bubble up through pipeline?
- **Atomic operations** ⟜ can workflows be transactional or always partial success?
- **Tool testing** ⟜ how to verify agent-generated code before running?
- **Human review** ⟜ which operations require approval vs auto-execute?

---

## Missing Specifications

- **Workflow syntax** ⟜ freeform English or structured markdown with keywords?
- **Agent prompts** ⟜ system prompts per operation or single universal prompt?
- **Fallback behavior** ⟜ what happens when agent is unavailable?
- **Execution model** ⟜ synchronous, async, event-driven, or mixed?

---


## Practical Concerns

- **Debug complexity** ⟜ how to trace why agent chose specific tool sequence?
- **Learning curve** ⟜ users must understand agent capabilities and limitations
- **Determinism loss** ⟜ same workflow description might execute differently each time
- **Tool proliferation** ⟜ agent creates too many single-use tools, toolkit bloats
- **Documentation drift** ⟜ literate tools modified without updating narrative sections
- **Migration path** ⟜ how to move from non-agentic tools to agentic ones?

---

## Critical Gaps

**Bootstrap problem** ⟜ how do you create the agent system itself? Does it require traditional programming to set up the infrastructure that enables programming-in-English?

**Failure modes** ⟜ when agent fundamentally misunderstands requirements, how do you recover? Rolling back to previous toolkit state? Manual intervention?

**Cost-benefit threshold** ⟜ at what scale does agent overhead exceed value? Single file conversion probably faster to do manually.

**Trust calibration** ⟜ users need to learn when to trust agent vs verify output. No clear signals for "this probably worked" vs "check this carefully."

---

