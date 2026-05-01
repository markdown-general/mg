---
name: dashboard-diagnostics
version: 1.0.0
description: "Dashboard-driven multi-agent orchestration for parallel Haskell build diagnostics"
author: hermes + grok
---

# Dashboard-Driven Diagnostics

Orchestrate parallel autonomous agents to diagnose failing Haskell repos, with real-time visibility in emacs dashboard.

## Problem

You have 36 Haskell libraries, 16 with build failures (🟠 warnings, 🔴 errors). Want to:
- Diagnose each in parallel (not serially)
- Keep you in the foreground (async, non-blocking)
- See progress live in emacs (dashboard updates as agents complete)
- Avoid context bloat (agents get only their prompt, not your full 65k context)

## Solution

Use Hermes `/background` command (proper async spawning with credential inheritance) paired with a live dashboard that agents update as they complete.

## Quick Start

```bash
cd ~/mg

# Step 1: Generate /background commands
bash loom/repair-scan.sh
# Output: dispatch-diagnostics.txt (16 /background prompts)

# Step 2: Start optional dashboard monitor
bash loom/update-dashboard.sh &

# Step 3: Copy and paste into this Hermes REPL
cat ~/mg/loom/dispatch-diagnostics.txt | tail -n +3
# Copy all /background commands → paste here

# Step 4: Watch from emacs
# Open ~/mg/loom/haskell-compile.md
# M-x auto-revert-mode
# See repos transition 🔵 → 🟠/🔴 + inline fix summaries as agents complete
```

## Key Files

- `haskell-compile.md` — main dashboard (repo status + fix summaries)
- `repair-scan.sh` — generates `/background` commands from failing repos
- `dispatch-diagnostics.txt` — 16 commands ready to paste (generated)
- `update-dashboard.sh` — optional monitor that merges fix cards → dashboard
- `loom/haskell-<REPO>-fix.md` — detailed diagnosis per repo (created by agents)
- `DIAGNOSTICS.md` — full workflow documentation

## How It Works

1. **repair-scan.sh** reads haskell-compile.md, finds 🟠🔴 repos
2. Generates 16 `/background` prompts, one per failing repo
3. You paste them into Hermes REPL (this session)
4. Each `/background`:
   - Spawns a clean async agent (prompt only, no context)
   - Inherits credentials from credential pool (hermes auth add)
   - Marks repo 🔵 while running
   - Runs `cabal build`, parses errors/warnings
   - Writes `loom/haskell-<REPO>-fix.md` with analysis
   - Updates dashboard inline: `🔵 repo → 🟠/🔴 repo - [error-type]: [fix]`
   - Releases lock
5. All 16 run in parallel (you stay in foreground)
6. Fix cards appear in loom/ as agents complete
7. Dashboard live-updates (via update-dashboard.sh monitor or manual refresh)

## Credentialing

/background agents inherit credentials from the credential pool. If they fail:

```bash
hermes auth add anthropic --api-key YOUR_KEY
hermes auth list  # verify
hermes config set model.provider anthropic  # optional, set as default
```

Pools are the Hermes-official way to share credentials with subagents. No need for --continue (which loads full context), no need for hermes chat -q hacks.

## Fix Card Format

Agents write to `loom/haskell-<REPO>-fix.md`:

```markdown
## <REPO>

**Build Error:** [GHC error code or type]
**File/Location:** [path:line:col]
**Message:** [full error message]
**Root Cause:** [2-3 sentences why]
**Suggested Fix:** [one specific action]
```

Dashboard extracts the error type + fix suggestion → appends inline.

## Monitoring

### From emacs
- Open `haskell-compile.md`
- `M-x auto-revert-mode` (auto-refresh every 2-3 sec)
- Watch repos transition from 🔵 → 🟠/🔴 + summaries
- Click fix card links `[Full diagnosis →](loom/haskell-<REPO>-fix.md)`

### From terminal
```bash
# Watch fix cards appear
watch -n 1 'ls -la ~/mg/loom/haskell-*-fix.md | wc -l'

# Or with update-dashboard.sh running:
bash ~/mg/loom/update-dashboard.sh
```

## Scaling to All 36

Current setup targets 16 problem repos. To audit all 36:

```bash
# Edit repair-scan.sh line ~15
# Change: grep "^🟠\|^🔴"
# To: grep "" (or remove the grep entirely)

bash loom/repair-scan.sh
# Now generates 36 /background commands
```

## Pitfalls

- **Dashboard race conditions**: All agents reading/writing simultaneously. Solution: update-dashboard.sh merges serially. OR: agents update only their own fix cards, you manually refresh dashboard in emacs.
- **Lock file stale**: If agent crashes, lock remains. Clean: `rm -f ~/mg/loom/.locks/*.lock`
- **Agent fails silently**: Check `/tmp/diag_<REPO>.log` (if dispatched with logging)
- **Context saturation**: This approach avoids it — /background agents get only their prompt, not your 65k context

## Next Steps

- **Rollup report**: Parse all 16 fix cards → single FIXES.md with priority ranking
- **Automated fixes**: For low-risk fixes (e.g., add missing module), apply to repos + test
- **Cascade diagnostics**: Diagnose downstream repos after fixes are applied

---

## References

- [DIAGNOSTICS.md](../DIAGNOSTICS.md) — full workflow + architecture
- [haskell-compile.md](../haskell-compile.md) — live dashboard
- [dispatch-diagnostics.txt](../dispatch-diagnostics.txt) — generated commands (after running repair-scan.sh)
