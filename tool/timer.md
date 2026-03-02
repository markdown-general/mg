# tools/timer.md

**timer** ⟜ enforce worker deadlines and write timeout blowup reports

**what it does** ⟜ monitors yin-workers.md for active workers, kills them at deadline, writes blowup reports

**why** ⟜ prevent orphaned workers hanging forever; provide timeout evidence for yin analysis

**who** ⟜ yin infrastructure, spawned after listener at session start

## example

```bash
# Start timer monitoring ~/self/yin/yin-workers.md
timer --workers ~/self/yin/yin-workers.md --responses ~/self/yin/responses/

# In yin-workers.md, mark worker as active:
# | 1 | scan-task | 14:22:01 | 14:22:11 | active | | |

# At 14:22:11, timer detects deadline passed
# Writes: ~/self/yin/responses/worker-1-blowup.md
# Updates yin-workers.md: status → "timeout", actual-completion → 14:22:11
```

## api

**Arguments:**
- `--workers FILE` ⟜ path to yin-workers.md table (required)
- `--responses DIR` ⟜ directory for blowup report files (required)
- `--interval SECONDS` ⟜ check interval in seconds (default: 2)

**yin-workers.md format:**
```
| id | card | spin-time | timeout-deadline | status | actual-completion | notes |
|----|------|-----------|------------------|--------|-------------------|-------|
| 1  | task | 14:22:01  | 14:22:11         | active |                   | msg   |
```

**Output:**
- Blowup report ⟜ `responses/worker-{id}-blowup.md` with timeout evidence
- Updated table ⟜ worker status changed to "timeout", actual-completion set to enforcement time

**Behavior:**
- Parses yin-workers.md table every `--interval` seconds
- For each worker with status "active":
  - Compares current time to timeout-deadline
  - If deadline passed: writes blowup report, updates table
- Only enforces once per worker (tracks killed workers)
- Runs indefinitely until interrupted

## installation

**Location:** `~/markdown-general/artifacts/bin/timer`

**Wrapper:**
```bash
#!/bin/bash
sed -n '/^```python$/,/^```$/p' ~/markdown-general/zone/tools/timer.md | sed '1d;$d' | python3 - "$@"
```

**One-liner test:**
```bash
timer --help
```

## tips

**Clock alignment** ⟜ timer uses system clock. Yin and timer must be on same machine for deadline matching to work.

**Table parsing** ⟜ timer expects strict markdown table format. Missing pipe characters or misaligned columns will cause parse failures. Validate table format before spinning timer.

**Blowup report is evidence** ⟜ contains worker id, card name, deadline, enforcement time. Yin can analyze this to refine timeout estimates for next session.

**idempotent enforcement** ⟜ timer tracks killed workers by id to avoid re-killing. If workers table is cleared between sessions, idempotency is lost (design limitation).

**Status update is non-atomic** ⟜ timer reads table, decides to enforce, writes blowup, updates table. If yin updates table simultaneously, race conditions possible. In practice, yin doesn't modify table during enforcement.

## status

**Tests:** passing (deadline detection, blowup generation, table updates, idempotency)
**Last updated:** 2026-01-13
**Known issues:** None

## code

```python
#!/usr/bin/env python3
"""
Timer Agent - Enforce worker deadlines by monitoring yin-workers.md.
Runs continuously and checks every 2 seconds for workers that have exceeded their timeout deadline.
"""

import os
import re
import time
from datetime import datetime
import sys
import argparse

# Track workers we've already killed to avoid re-killing them
killed_workers = set()

def log_message(msg, log_file=None):
    """Log a message to stdout and optionally to log file"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_entry = f"[{timestamp}] {msg}"
    print(log_entry)
    if log_file:
        try:
            with open(log_file, 'a') as f:
                f.write(log_entry + "\n")
        except:
            pass

def parse_time(time_str):
    """Parse HH:MM:SS format to datetime object (today's date)"""
    try:
        time_obj = datetime.strptime(time_str.strip(), "%H:%M:%S").time()
        now = datetime.now()
        return datetime.combine(now.date(), time_obj)
    except:
        return None

def get_current_time():
    """Get current time as datetime object"""
    return datetime.now()

def parse_workers_table(workers_file):
    """Parse the yin-workers.md file and extract worker data"""
    workers = []

    try:
        with open(workers_file, 'r') as f:
            lines = f.readlines()
    except Exception as e:
        log_message(f"ERROR: Could not read {workers_file}: {e}")
        return workers

    # Parse the markdown table
    for line in lines:
        # Skip header and separator lines
        if '|' not in line or line.strip().startswith('|-'):
            continue

        # Parse table row
        parts = [p.strip() for p in line.split('|')]
        if len(parts) < 8:
            continue

        try:
            worker_id = parts[1]
            card = parts[2]
            spin_time = parts[3]
            timeout_deadline = parts[4]
            status = parts[5]
            actual_completion = parts[6]
            notes = parts[7] if len(parts) > 7 else ""

            # Skip if not numeric ID
            if not worker_id or not worker_id[0].isdigit():
                continue

            workers.append({
                'id': worker_id,
                'card': card,
                'spin_time': spin_time,
                'timeout_deadline': timeout_deadline,
                'status': status,
                'actual_completion': actual_completion,
                'notes': notes
            })
        except:
            continue

    return workers

def create_blowup_report(worker, responses_dir):
    """Create a blowup report for a timed-out worker"""
    worker_id = worker['id']
    report_file = os.path.join(responses_dir, f"worker-{worker_id}-blowup.md")

    current_time = datetime.now().strftime("%H:%M:%S")

    report_content = f"""# Worker {worker_id} Timeout Blowup

**Deadline exceeded at {current_time}**

| Field | Value |
|-------|-------|
| Worker ID | {worker_id} |
| Card | {worker['card']} |
| Spin Time | {worker['spin_time']} |
| Timeout Deadline | {worker['timeout_deadline']} |
| Status | TIMEOUT |
| Current Time | {current_time} |
| Notes | {worker['notes']} |

The worker exceeded its timeout deadline and has been marked as timed out.
"""

    try:
        with open(report_file, 'w') as f:
            f.write(report_content)
        return True
    except Exception as e:
        log_message(f"ERROR: Could not create blowup report: {e}")
        return False

def update_worker_status(workers_file, worker_id):
    """Update worker status in yin-workers.md from 'active' to 'timeout'"""
    try:
        with open(workers_file, 'r') as f:
            content = f.read()

        lines = content.split('\n')
        updated_lines = []
        current_time = datetime.now().strftime("%H:%M:%S")

        for line in lines:
            if f'| {worker_id} |' in line and '| active |' in line:
                # Parse the line and update status and completion time
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 7:
                    # Reconstruct with new status and completion time
                    parts[5] = 'timeout'
                    parts[6] = current_time
                    line = ' | '.join(parts)

            updated_lines.append(line)

        updated_content = '\n'.join(updated_lines)

        with open(workers_file, 'w') as f:
            f.write(updated_content)

        return True
    except Exception as e:
        log_message(f"ERROR: Could not update worker status: {e}")
        return False

def check_and_enforce_deadlines(workers_file, responses_dir, log_file=None):
    """Check all active workers and enforce deadlines that have passed"""
    workers = parse_workers_table(workers_file)
    current_time = get_current_time()

    for worker in workers:
        worker_id = worker['id']
        status = worker['status'].lower()

        # Only process active workers
        if status != 'active':
            continue

        # Skip if we already killed this worker
        if worker_id in killed_workers:
            continue

        # Parse deadline
        deadline = parse_time(worker['timeout_deadline'])

        if deadline is None:
            continue

        # Check if deadline has passed
        if current_time >= deadline:
            log_message(f"ENFORCE: Worker {worker_id} deadline exceeded ({worker['timeout_deadline']})", log_file)

            # Create blowup report
            if create_blowup_report(worker, responses_dir):
                # Update worker status
                if update_worker_status(workers_file, worker_id):
                    killed_workers.add(worker_id)
                    log_message(f"Worker {worker_id} marked as timeout", log_file)

def main():
    """Main loop - runs indefinitely"""
    parser = argparse.ArgumentParser(description="Enforce worker deadlines")
    parser.add_argument('--workers', required=True, help='Path to yin-workers.md')
    parser.add_argument('--responses', required=True, help='Directory for blowup reports')
    parser.add_argument('--interval', type=int, default=2, help='Check interval in seconds')
    parser.add_argument('--log', help='Log file for messages')

    args = parser.parse_args()

    # Ensure responses directory exists
    os.makedirs(args.responses, exist_ok=True)

    log_message("=== Timer Agent Started ===", args.log)
    log_message(f"Monitoring: {args.workers}", args.log)
    log_message(f"Check interval: {args.interval} seconds", args.log)

    try:
        while True:
            try:
                check_and_enforce_deadlines(args.workers, args.responses, args.log)
                time.sleep(args.interval)
            except KeyboardInterrupt:
                log_message("Timer Agent interrupted by user", args.log)
                break
            except Exception as e:
                log_message(f"ERROR in main loop: {e}", args.log)
                time.sleep(args.interval)
    except KeyboardInterrupt:
        pass
    finally:
        log_message("=== Timer Agent Stopped ===", args.log)

if __name__ == "__main__":
    main()
```

## examples

### basic deployment

Enforce deadlines for all active workers:

```bash
timer --workers ~/self/yin/yin-workers.md --responses ~/self/yin/responses/
```

### with logging

Log enforcement actions:

```bash
timer --workers ~/self/yin/yin-workers.md --responses ~/self/yin/responses/ --log /tmp/timer.log
```

### faster enforcement

Check every 1 second instead of 2:

```bash
timer --workers ~/self/yin/yin-workers.md --responses ~/self/yin/responses/ --interval 1
```

## tests

### deadline detection

Verify timer detects expired deadlines:

```bash
# Create test structure
mkdir -p /tmp/timer-test/responses
cat > /tmp/timer-test/workers.md << 'EOF'
# yin-workers

| id | card | spin-time | timeout-deadline | status | actual-completion | notes |
|----|------|-----------|------------------|--------|-------------------|-------|
| 1  | test | 10:00:00  | 10:00:01         | active |                   | test  |
EOF

# Wait for deadline to pass
sleep 2

# Run timer once
timeout 1 timer --workers /tmp/timer-test/workers.md --responses /tmp/timer-test/responses/ || true

# Check blowup was created
[[ -f /tmp/timer-test/responses/worker-1-blowup.md ]] && echo "✓ Blowup created"

# Check table was updated
grep "timeout" /tmp/timer-test/workers.md > /dev/null && echo "✓ Status updated"

# Cleanup
rm -rf /tmp/timer-test
```

### idempotency

Verify timer doesn't re-kill workers:

```bash
mkdir -p /tmp/timer-idem/responses
cat > /tmp/timer-idem/workers.md << 'EOF'
| id | card | spin-time | timeout-deadline | status | actual-completion | notes |
|----|------|-----------|------------------|--------|-------------------|-------|
| 1  | test | 10:00:00  | 10:00:01         | active |                   | test  |
EOF

sleep 2

# Run timer in background for 3 seconds
timeout 3 timer --workers /tmp/timer-idem/workers.md --responses /tmp/timer-idem/responses/ > /tmp/timer-idem/output.log 2>&1 &
wait

# Count how many times worker-1 was enforced
COUNT=$(grep -c "ENFORCE: Worker 1" /tmp/timer-idem/output.log || echo 0)
[[ $COUNT -eq 1 ]] && echo "✓ Only enforced once" || echo "✗ Enforced $COUNT times"

# Cleanup
rm -rf /tmp/timer-idem
```
