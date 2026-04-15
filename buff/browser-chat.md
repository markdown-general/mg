# browser-chat ⟜ multi-system chat automation

**Location:** `~/other/pi-skills/browser-tools/` on `browser-chat` branch

Mechanics for coordinating multi-agent workflows across Claude.ai, Grok, Thaura, and compatible chat systems. Named operations that cards reference; selectors and quirks documented per-system.

All operations execute JavaScript in browser context via `browser-eval.js` (no restart, no reconnect).

---

## Tab Targeting ⚠️

**Before any chat operation:** List tabs to find the correct Claude instance.

```bash
browser-list-tabs.js
```

If the user says "I have Claude up right now", find Claude's URL in the tab list and note its index. All subsequent operations target that index. See **buff/browser-tools.md > Tab Targeting** for details.

---

## Core Operations

All operations execute JavaScript in browser context via `browser-eval.js`. No restart, no reconnect.

### Read Input (Before Send)

Check what's currently in the input box:

```bash
# Claude
browser-eval.js "document.querySelector('[data-testid=\"chat-input\"]').innerText"

# Grok
browser-eval.js "document.querySelector('.tiptap.ProseMirror').innerText"

# Thaura
browser-eval.js "document.querySelector('textarea').value"
```

### Write Input

Inject text into input field:

```bash
# Claude
browser-eval.js "document.querySelector('[data-testid=\"chat-input\"]').innerText = 'message'"

# Grok
browser-eval.js "document.querySelector('.tiptap.ProseMirror').innerText = 'message'"

# Thaura
browser-eval.js "document.querySelector('textarea').value = 'message'"
```

**Key:** Paste via `innerText` or `value`, not keyboard.type(). Bare Return otherwise triggers send.

### Send Message

Click the send button:

```bash
# Claude
browser-eval.js "document.querySelector('button svg[viewBox=\"0 0 256 256\"]').closest('button').click()"

# Grok
browser-eval.js "document.querySelector('button.group.flex.flex-col.justify-center.rounded-full').click()"

# Thaura
browser-eval.js "document.querySelector('button[type=\"submit\"][aria-label=\"Send message\"]').click()"
```

### Read Conversation

Extract conversation text:

```bash
# All systems (full page)
browser-eval.js "document.body.innerText" > ~/mg/logs/conversation-$(date +%s).txt

# Claude specific (message bubbles)
browser-eval.js "Array.from(document.querySelectorAll('p.whitespace-pre-wrap')).map(p => p.innerText)"

# Grok specific (message bubbles)
browser-eval.js "Array.from(document.querySelectorAll('.message-bubble')).map(b => b.innerText)"
```

---

## Named Operations

Cards reference these by name. Implementation can be bash, Node, TypeScript, or elsewere—what matters is the operation is named and documented.

### [read-response-TYPE]

Extract conversation from named system. 

```bash
# [read-response-claude]
browser-eval.js "document.body.innerText" > ~/mg/logs/claude-response.txt

# [read-response-grok]
browser-eval.js "document.body.innerText" > ~/mg/logs/grok-response.txt

# [read-response-thaura]
browser-eval.js "document.body.innerText" > ~/mg/logs/thaura-response.txt
```

### [send-to-TYPE]

Inject text and send to named system.

**Usage:** `[send-to-grok]` with input file (stdin or argument)

**Pattern:**
```bash
# Read input
INPUT=$(cat ~/mg/logs/message.txt)

# Inject
browser-eval.js "document.querySelector('.tiptap.ProseMirror').innerText = \`$INPUT\`"

# Wait for page to settle (JS rendering)
sleep 2

# Send
browser-eval.js "document.querySelector('button.group.flex.flex-col.justify-center.rounded-full').click()"
```

### [wait-for-response-TYPE]

Stream typically completes 3-5 seconds. Some responses take longer.

```bash
# Standard wait (Grok, Claude)
sleep 5

# Claude complex queries
sleep 8

# Then extract
[read-response-TYPE]
```

---

## Per-System Reference

### Claude.ai

**URL:** https://claude.ai/

**Input selector:** `[data-testid="chat-input"]` (contenteditable div)

**Send button selector:** `button svg[viewBox="0 0 256 256"]` → `.closest('button')`

**Conversation selector:** `p.whitespace-pre-wrap` (message bubbles) or `document.body.innerText`

**Sidebar:** `span.truncate` (chat titles in `<a>` links)

**Quirks:**
- Contenteditable div (simpler than Grok's TipTap)
- Multi-line via `.innerText` (preserves newlines)
- Bare Return sends (use paste, not keyboard.type)
- Send button only appears when input has text
- Stream completes: 3-8 seconds typical

**File upload:**
- `+` button below input area
- Hidden `<input type="file">` element
- Supports: .md, .txt, .pdf (via Anthropic processing)

### Grok

**URL:** https://grok.com/

**Input selector:** `.tiptap.ProseMirror` (TipTap/ProseMirror editor)

**Send button selector:** `button.group.flex.flex-col.justify-center.rounded-full` (SVG up arrow)

**Conversation selector:** `.message-bubble` (reliable, structured) or `document.body.innerText`

**Sidebar:** `[data-sidebar="menu"]` (chat history list)

**Quirks:**
- TipTap rich text editor (Vue/React agnostic)
- Tailwind classes not obfuscated (unlike Claude)
- Paste via `.innerText = text`, not keyboard.type
- Multi-line text preserves newlines
- Direct typing works (but paste safer for bulk content)
- Stream completes: 3-5 seconds typical
- Return key sends (same as Claude)

**File upload:**
- Not fully tested; may require different selectors
- Check latest Grok UI for file picker location

### Thaura

**URL:** https://thaura.ai/

**Input selector:** `textarea` (plain HTML textarea, simplest)

**Send button selector:** `button[type="submit"][aria-label="Send message"]`

**Conversation selector:** `document.body.innerText` (full page)

**Sidebar:** Conversation buttons (not links) with titles in `span.truncate.font-medium` nested inside parent button

**Conversation selection (important):**
Thaura's sidebar contains buttons (not plain links) for each conversation. To navigate to a specific conversation:
```javascript
// 1. Toggle sidebar if needed
const toggleBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Toggle Sidebar'));
if (toggleBtn) toggleBtn.click();

// 2. Find and click the conversation button by text
const buttons = Array.from(document.querySelectorAll('button'));
const targetBtn = buttons.find(b => b.innerText.includes('Please read all the attached files') && b.innerText.includes('yarn-prompt.md'));
if (targetBtn) targetBtn.click();
```

**Quirks:**
- Plain textarea (no contenteditable complexity)
- `.value` not `.innerText` (HTML form semantics)
- Sidebar contains buttons, not `<a>` links
- Conversation text wrapped in nested `span.truncate.font-medium`
- SVG icon inside send button
- Dark mode styling supported
- Stream behavior: Not fully tested; observe in browser

---

## Composition Patterns

### Multi-Turn Conversation

```
⊢ Send initial prompt to system
  [send-to-grok] < ~/mg/logs/initial-prompt.txt
⊢ Wait for response
  [wait-for-response-grok]
⊢ Extract to file
  [read-response-grok] > ~/mg/logs/grok-round1.txt
⊢ Read response (agent decides next move)
  [read-file] ~/mg/logs/grok-round1.txt
⊢ Send follow-up
  [send-to-grok] < ~/mg/logs/followup.txt
⊢ Extract final response
  [read-response-grok] > ~/mg/logs/grok-final.txt
```

### Cross-System Conversation

Pass response from one system to another:

```
⊢ Send to Claude
  [send-to-claude]
⊢ Extract response
  [read-response-claude] > ~/mg/logs/claude-out.txt
⊢ Inject into Grok
  [send-to-grok] < ~/mg/logs/claude-out.txt
⊢ Extract Grok feedback
  [read-response-grok] > ~/mg/logs/grok-feedback.txt
```

### Error Recovery

If send fails or input not found:

```
⊢ Verify element exists
  browser-eval.js "document.querySelector('SELECTOR') !== null"
⊢ If false, wait 2-3s and retry
  sleep 3
  [send-to-TYPE]
⊢ If still fails, check page loaded
  [read-response-TYPE] | head
```

---

## Token Efficiency Notes

**Logging to files, not stdout:** Keeps conversation output separate from agent reasoning. Agents read files, not scroll terminal output.

**Read only when needed:** Extract full conversation only after response completes. Don't poll continuously.

**Plain text output:** All reads are `.innerText` or `.value`, no HTML noise. Clean ~1KB per exchange vs. 10KB with DOM.

**Cross-system excerpt:** When passing from Claude to Grok, extract key sections only (first 50 lines, not full conversation). Reduces token load.

---

## Known Failure Modes

| Symptom | Cause | Recovery |
|---------|-------|----------|
| Input not found | Page not fully loaded | Wait 2-3s before querying |
| Send button not clickable | Previous message still streaming | Increase wait time (`[wait-for-response-TYPE]`) |
| Bare Return sends too early | Using keyboard.type instead of paste | Use `.innerText = text` (paste) |
| Message extraction incomplete | Stream still running | Increase wait time before `[read-response-TYPE]` |
| File upload fails | Hidden input missing or wrong selector | Check selector with browser-pick.js |
| CDP connection lost | Chrome crashed or hung | Restart: `browser-start.js --profile &` |
| Special chars break input | Bash quoting in single-line commands | Use temp files or escape properly |

---

## Development Flow

When adding a new system or operation:

1. **Discover elements:** Use `browser-pick.js` to find selectors interactively
2. **Test in browser:** Open DevTools console, run selector logic manually
3. **Verify stability:** Run 3-5 times to ensure selector doesn't drift
4. **Document quirks:** Stream timing, input handling, send button behavior
5. **Add to this file:** Per-system section + any new [named-operation]

---

## Session Logging

Browser interactions should be logged for audit and replay:

```
~/mg/logs/
  claude-prompt-20260406-101520.txt       # Input sent
  claude-response-20260406-101530.txt     # Response extracted
  grok-prompt-20260406-101540.txt
  grok-response-20260406-101550.txt
  ...
```

Timestamps let yin reconstruct conversation flow and agent decisions.

---

## Future Extensions

**Planned:**
- File upload mechanics (Claude, Grok, others)
- Session recovery (resume broken conversation)
- Rate limiting (avoid rate-limit blocks)
- Vision model integration (browser-screenshot.js + vision context)

**Research:**
- ChatGPT, local LLMs, Perplexity selectors
- Form-based systems (not chat-bubble-based)
- Private/authenticated systems (Slack, Teams)
