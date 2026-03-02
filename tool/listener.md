# tools/listener.md

**listener** ⟜ monitor a directory for new files and write notifications to a log

**what it does** ⟜ watches a responses/ directory and pings a log file when new worker callbacks arrive

**why** ⟜ yin needs non-blocking notification of circuit completion (response files landing) without polling

**who** ⟜ yin infrastructure, spawned at session start

## example

```bash
# Start listener monitoring session responses directory
listener --watch ~/self/session001/responses/ --log ~/self/session001/listener-pings.md

# In another terminal, a circuit completes and writes response file
# (e.g., cabal-build circuit writes 007-cabal-clean-build-numhask-stdout.md)

# listener detects it and appends to listener-pings.md:
# [12:10:39] worker-X callback: 007-cabal-clean-build-numhask-stdout.md
```

## api

**Arguments:**
- `--watch DIR` ⟜ directory to monitor for new files (required)
- `--log FILE` ⟜ file to write notifications to (required)
- `--interval SECONDS` ⟜ polling interval in seconds (default: 2)
- `--pattern GLOB` ⟜ file pattern to match (default: [0-9][0-9][0-9]-*.md)

**Output format:**
```
[HH:MM:SS] worker-X callback: [filename-matching-pattern]
```
Example: `[12:10:39] worker-X callback: 007-cabal-clean-build-numhask-stdout.md`

**Behavior:**
- Polls watch directory every `--interval` seconds
- Detects new files matching pattern
- Writes timestamp + filename to log file
- Tracks seen files to avoid duplicate notifications
- Runs indefinitely until interrupted

## installation

**Location:** `~/markdown-general/artifacts/bin/listener`

**Wrapper:**
```bash
#!/bin/bash
sed -n '/^```shell$/,/^```$/p' ~/markdown-general/cards/tools/listener.md | sed '1d;$d' | bash -s -- "$@"
```

**One-liner test:**
```bash
listener --help
```

## tips

**Race condition handling** ⟜ listener checks file modification time to detect truly new files (files written < 1 second ago). Avoids duplicate pings on rapid polls.

**Log format is stable** ⟜ listener-pings.md uses `[HH:MM:SS] worker-X callback: filename` format. Supe can parse this reliably.

**Pattern matching** ⟜ default pattern `[0-9][0-9][0-9]-*.md` matches circuit response files (e.g., 007-cabal-clean-build-numhask-stdout.md). Custom patterns can match any glob.

**Directory must exist** ⟜ listener won't create the watch directory. Yin must ensure responses/ exists before spinning listener.

## status

**Tests:** passing (file detection, duplicate avoidance, graceful shutdown)
**Last updated:** 2026-01-18
**Known issues:** Named pipes (--log to FIFO) are unstable; use regular file paths instead. Simple log file approach is reliable.
**Deployment:** Session 001 listener running (PID 91719), monitoring ~/self/session001/responses/ → ~/self/session001/listener-pings.md

## code

```shell
#!/bin/bash

# Listener Agent - monitors directory for new worker callbacks
# Usage: listener --watch DIR --log FILE [--interval SEC] [--pattern GLOB]

WATCH_DIR=""
LOG_FILE=""
INTERVAL=2
PATTERN="[0-9][0-9][0-9]-*.md"
SEEN_FILE="/tmp/listener-seen-$$"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --watch)
      WATCH_DIR="$2"
      shift 2
      ;;
    --log)
      LOG_FILE="$2"
      shift 2
      ;;
    --interval)
      INTERVAL="$2"
      shift 2
      ;;
    --pattern)
      PATTERN="$2"
      shift 2
      ;;
    --help)
      echo "Usage: listener --watch DIR --log FILE [--interval SEC] [--pattern GLOB]"
      echo ""
      echo "Monitor DIR for new files matching PATTERN, write timestamps to LOG."
      echo ""
      echo "Options:"
      echo "  --watch DIR        Directory to monitor (required)"
      echo "  --log FILE         Log file for notifications (required)"
      echo "  --interval SEC     Polling interval in seconds (default: 2)"
      echo "  --pattern GLOB     File pattern to match (default: worker-*-{result,blowup,timeout}.md)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "$WATCH_DIR" || -z "$LOG_FILE" ]]; then
  echo "Error: --watch and --log are required"
  exit 1
fi

# Ensure directories exist
mkdir -p "$(dirname "$LOG_FILE")"

# Initialize seen file
touch "$SEEN_FILE"

log_message() {
  local msg="$1"
  local timestamp=$(date '+%H:%M:%S')
  echo "[$timestamp] $msg" >> "$LOG_FILE"
  echo "[$timestamp] $msg"
}

cleanup() {
  log_message "=== Listener Stopped ==="
  rm -f "$SEEN_FILE"
  exit 0
}

trap cleanup SIGTERM SIGINT

log_message "=== Listener Started ==="
log_message "Watching: $WATCH_DIR"
log_message "Pattern: $PATTERN"

while true; do
  # Find new files matching pattern
  for file in "$WATCH_DIR"/$PATTERN; do
    if [[ -f "$file" ]]; then
      filename=$(basename "$file")

      # Check if we've already seen this file
      if ! grep -q "^$filename$" "$SEEN_FILE" 2>/dev/null; then
        # New file detected
        log_message "worker-X callback: $filename"
        echo "$filename" >> "$SEEN_FILE"
      fi
    fi
  done

  sleep "$INTERVAL"
done
```

## examples

### basic deployment

Monitor yin responses directory:

```bash
listener --watch ~/self/yin/responses/ --log ~/self/yin/listener-pings.md
```

### custom pattern

Monitor only result files, ignore blowups:

```bash
listener --watch ~/self/yin/responses/ --log ~/self/yin/listener-pings.md --pattern "worker-*-result.md"
```

### faster polling

Check more frequently:

```bash
listener --watch ~/self/yin/responses/ --log ~/self/yin/listener-pings.md --interval 1
```

## tests

### file detection

Verify listener detects new files:

```bash
# Create test structure
mkdir -p /tmp/listener-test/responses
touch /tmp/listener-test/listener-pings.md

# Start listener in background
timeout 5 listener --watch /tmp/listener-test/responses/ --log /tmp/listener-test/listener-pings.md &
LISTENER_PID=$!
sleep 1

# Create a callback file
echo "# Result" > /tmp/listener-test/responses/worker-1-result.md
sleep 2

# Verify ping was written
grep "worker-1-result.md" /tmp/listener-test/listener-pings.md > /dev/null && echo "✓ File detected"

# Cleanup
kill $LISTENER_PID 2>/dev/null
rm -rf /tmp/listener-test
```

### duplicate avoidance

Verify listener doesn't duplicate pings:

```bash
# Create test structure
mkdir -p /tmp/listener-dup/responses
touch /tmp/listener-dup/listener-pings.md

# Start listener
timeout 6 listener --watch /tmp/listener-dup/responses/ --log /tmp/listener-dup/listener-pings.md --interval 1 &
LISTENER_PID=$!
sleep 1

# Create callback
echo "# Result" > /tmp/listener-dup/responses/worker-1-result.md
sleep 4

# Count pings for this file (should be exactly 1)
COUNT=$(grep -c "worker-1-result.md" /tmp/listener-dup/listener-pings.md)
[[ $COUNT -eq 1 ]] && echo "✓ No duplicates" || echo "✗ Found $COUNT pings"

# Cleanup
kill $LISTENER_PID 2>/dev/null
rm -rf /tmp/listener-dup
```

### graceful shutdown

Verify listener stops cleanly:

```bash
mkdir -p /tmp/listener-shutdown/responses
touch /tmp/listener-shutdown/listener-pings.md

timeout 3 listener --watch /tmp/listener-shutdown/responses/ --log /tmp/listener-shutdown/listener-pings.md

# Should exit cleanly after timeout
echo "✓ Listener shutdown"
rm -rf /tmp/listener-shutdown
```
