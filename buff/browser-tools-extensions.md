# browser-tools extensions ⟜ new scripts for chat automation

**Location:** `~/other/pi-skills/browser-tools/` on `browser-chat` branch

**Purpose:** Automate file upload and response detection across Claude, Grok, and Thaura

---

## Scripts Added

### claude-upload-files.mjs

Uploads files to Claude.ai via puppeteer's `uploadFile()` method.

**Files uploaded:**
- ~/mg/loom/yarn-narrative.md
- ~/mg/loom/yarn-axioms.md
- ~/mg/logs/yarn-summary-brief.md
- ~/mg/loom/yarn-prompt.md

**Usage:**
```bash
node ~/other/pi-skills/browser-tools/claude-upload-files.mjs
```

**Selector:** `input[type="file"]`

---

### grok-upload-files.mjs

Uploads files to Grok via multi-step interaction:
1. Click `button[aria-label="Attach"]`
2. Click menu item "Upload a file"
3. Upload via file input

**Usage:**
```bash
node ~/other/pi-skills/browser-tools/grok-upload-files.mjs
```

**Selectors:**
- Attach button: `button[aria-label="Attach"]`
- Menu item: `[role="menuitem"]` containing "Upload a file"
- File input: `input[type="file"]`

---

### thaura-upload-files.mjs

Uploads files to Thaura via direct file input (simplest approach).

**Usage:**
```bash
node ~/other/pi-skills/browser-tools/thaura-upload-files.mjs
```

**Selector:** `input[type="file"]`

---

### wait-for-response.mjs

Polls browser for response completion by detecting system-specific signoffs. Shows progress with dots. Records elapsed time. Writes response to log file.

**Usage:**
```bash
node ~/other/pi-skills/browser-tools/wait-for-response.mjs [system] [logfile]
```

**Examples:**
```bash
node wait-for-response.mjs claude ~/mg/logs/claude-round1.md
node wait-for-response.mjs grok ~/mg/logs/grok-round1.md
node wait-for-response.mjs thaura ~/mg/logs/thaura-round1.md
```

**Signoffs (what the script watches for):**
- **Claude:** "Claude is AI and can make mistakes"
- **Grok:** "Upgrade to SuperGrok"
- **Thaura:** "🌱" (seedling emoji)

**Features:**
- Polls every 500ms
- Shows progress (.) as response grows
- Timeout after 5 minutes
- Auto-extracts to log file when complete

---

## Full Hands-Free Round

**Pattern (for agent execution):**

```bash
#!/bin/bash
SYSTEM=$1
PROMPT=$2
LOGFILE=$3

cd ~/other/pi-skills/browser-tools

# 1. Upload
node ${SYSTEM}-upload-files.mjs

# 2. Inject prompt (system-specific)
case $SYSTEM in
  claude)
    node browser-eval.js "document.querySelector('[data-testid=\"chat-input\"]').innerText = '$PROMPT'"
    ;;
  grok)
    node browser-eval.js "document.querySelector('.tiptap.ProseMirror').innerText = '$PROMPT'"
    ;;
  thaura)
    node browser-eval.js "(function() { const ta = document.querySelector('textarea'); ta.click(); ta.focus(); ta.value = '$PROMPT'; ta.dispatchEvent(new Event('input', { bubbles: true })); })()"
    ;;
esac

# 3. Send (system-specific)
case $SYSTEM in
  claude)
    node browser-eval.js "document.querySelector('button svg[viewBox=\"0 0 256 256\"]').closest('button').click()"
    ;;
  grok)
    node browser-eval.js "document.querySelector('button.group.flex.flex-col.justify-center.rounded-full').click()"
    ;;
  thaura)
    node browser-eval.js "document.querySelector('button[type=\"submit\"][aria-label=\"Send message\"]').click()"
    ;;
esac

# 4. Wait and extract
node wait-for-response.mjs $SYSTEM $LOGFILE
```

---

## Tested (Working)

✓ Claude upload + injection + send + wait + extract (118 lines)
✓ Grok upload + injection + send + wait + extract (88 lines)
✓ Thaura upload + injection + send + wait + extract (129 lines)

✓ wait-for-response.mjs signoff detection (all three systems)

---

## Integration with mg Workflow

These scripts enable:
- Fully automated multi-agent chat rounds
- Consistent logging to ~/mg/logs/
- Timed response detection (no manual "hit Enter when done")
- Chain multiple systems in sequence (Claude → Grok → Thaura)

Used in: [send-files-and-prompt] operations for tangle/yarn exploration tasks.
