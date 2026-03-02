# comms-patterns ⟜ listener and timer as integrated infrastructure

## Insight

**listener.md** and **timer.md** from yard/tools/ are not just tools—they're communication patterns for agentic supervision.

Both implement file-based signaling:
- **Listener** ⟜ watches for success (file appears = work done)
- **Timer** ⟜ watches for failure (deadline passed = work hung)

This is the same philosophy as the repl-user protocol: **no locks, no markers, no complex state**. Just files and observation.

## Pattern Recognition

Listener/Timer solve the **worker supervision problem**:
- Background agent spawned (long-running task)
- Parent needs to know when it's done (success or timeout)
- Without blocking or polling

**File-based solution:**
- Agent writes result file when done → Listener detects → Pings log
- Parent watches log for completion → Reads result file → Continues
- Simultaneously, Timer watches deadlines → Enforces timeout → Prevents hangs

**Why this matters:** Decouples worker lifetime from parent's awareness. Parent can do other work while Timer provides safety net.

## Current State

Both tools exist in yard/tools/, are fully implemented and tested:
- listener.md: shell script, ~80 lines, includes test harness
- timer.md: Python script, ~300 lines, includes test harness

Wrapper scripts in artifacts/bin/ but **not currently deployed**.

## Integration Opportunity

For yin's worker supervision:
1. Spawn listener at session start → monitors ~/self/yin/responses/
2. Spawn timer at session start → monitors ~/self/yin/yin-workers.md table
3. Yin reads listener-pings.md for completion notifications
4. Yin reads blowup reports from timer for timeout evidence
5. Both run in background; yin checks when needed

**Result:** Non-blocking worker lifecycle management. Clean separation of concerns.

## Next Steps

- [ ] Wire listener/timer into yin session startup
- [ ] Define response file format (what agent writes when done)
- [ ] Define yin-workers.md table schema (timeout, status fields)
- [ ] Test end-to-end: spawn worker → listener detects → timer enforces
- [ ] Document the supervision loop in yin.md or worker.md

## See Also

- ~/markdown-general/yard/tools/listener.md
- ~/markdown-general/yard/tools/timer.md
- drift-ghci-echo.md (similar file-based protocol pattern)
- repl-user.md (file-based query/response without synchronization)
