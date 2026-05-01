---
name: chat-with-chat
description: Multi-system web chat automation for mg workflows. Send prompts to Grok, Claude.ai via config-driven chat dispatcher.
---

# chat-with-chat ⟜ deployed web chat automation

**Status:** Production ready  
**Location:** `~/other/mg-skills/chat-with-chat/`  
**Full docs:** `~/other/mg-skills/chat-with-chat/SKILL.md`

---

## Quick Start (mg context)

```bash
cd ~/other/mg-skills/chat-with-chat

# Verify preconditions
./chat-health-check.sh grok

# Send prompt to Grok
./chat-with-chat.sh grok "Your question here"

# Response appears inline + saved to ~/mg/logs/grok-response-<timestamp>.txt
```

---

## mg Integration

### Preconditions

Before any chat operation, Chrome must be running with:
1. Remote debugging on `:9222` (run `./chat-launch.sh` once)
2. A logged-in tab for Grok or Claude (manual, you must stay logged in)
3. User manually keeps that tab open (not switched away)

**Critical:** Do NOT assume auto-launch or auto-login. Verify with:
```bash
./chat-health-check.sh grok
```

### Logging

All chat operations log to `~/mg/logs/browser-chat-audit.log`:
```
[timestamp] CHAT START → grok
[timestamp] SEND START → grok
[timestamp] SEND COMPLETE
[timestamp] WAIT START → grok
[timestamp] WAIT COMPLETE — last bubble saved
[timestamp] CHAT COMPLETE
```

Responses saved as `~/mg/logs/<system>-response-<timestamp>.txt`.

### Multi-Turn Workflows

```bash
# Round 1: Send initial prompt
./chat-with-chat.sh grok "What is semantic lattice?" > ~/mg/logs/r1.txt

# Agent reads response, decides next move
cat ~/mg/logs/grok-response-*.txt | tail -1

# Round 2: Follow-up
./chat-with-chat.sh grok "Explain that in simpler terms" > ~/mg/logs/r2.txt

# Cross-system: Take Grok response, ask Claude
cat ~/mg/logs/grok-response-*.txt | tail -1 > /tmp/input.txt
./chat-with-chat.sh claude < /tmp/input.txt > ~/mg/logs/claude-response.txt
```

### Configuration

`chat-tools.conf` defines selectors for each system. Grok and Claude are pre-configured. To add a new system:

```ini
[newsystem]
URL_PATTERN=newsystem.ai
INPUT_SELECTOR=textarea
SEND_SELECTOR=button[aria-label="Send"]
BUBBLE_CLASS=.message
TIMEOUT=30
INTERVAL=2
```

Then:
```bash
./chat-with-chat.sh newsystem "test prompt"
```

---

## Architecture

Entry: `chat-with-chat.sh <system> "<prompt>"`

Dispatches to:
- `chat-health-check.sh` (optional warning, non-blocking)
- `chat-send.sh` (inject + click, config-driven)
- `chat-wait.sh` (poll for completion, extract last bubble)

All scripts read `chat-tools.conf` for selectors/timeouts. No code changes to add systems.

---

## Reference

Full documentation, troubleshooting, pitfalls:
```
~/other/mg-skills/chat-with-chat/SKILL.md
```

Scripts:
- `chat-with-chat.sh` — Main dispatcher
- `chat-health-check.sh` — Verify preconditions
- `chat-send.sh` — Generic send (config-driven)
- `chat-wait.sh` — Generic wait + extract (config-driven)
- `chat-ensure-tab.js` — Tab verification
- `chat-launch.sh` — Chrome launcher
- `chat-tools.conf` — Per-system configuration
