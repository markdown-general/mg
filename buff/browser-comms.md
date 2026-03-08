# browser-comms ⟜ Mechanics for multi-agent chat coordination

Patterns and selectors for automating interaction with web-based chat interfaces. Reference manual for yin and field agents to coordinate across Claude.ai, Grok, and compatible systems.

---

## Core Patterns

### Connection & Page Detection

```javascript
import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const pages = await browser.pages();
let targetPage = pages.find(p => p.url().includes('claude.ai'));
```

**Conventions:**
- Chrome runs with `--remote-debugging-port=9222`
- Find page by URL substring match
- Always check page exists before operating

---

## Per-System Mechanics

### Claude.ai

#### Input Detection & Typing

**Selector:** `[contenteditable="true"]` or `textarea`

```javascript
const input = await page.$('[contenteditable="true"]');
await input.click();
await page.keyboard.type("Your message here", { delay: 10 });
```

**Quirks:**
- Bare `Return` (newline) triggers send
- Use `Shift+Return` for line breaks (not automatable via keyboard.type)
- **Workaround:** Paste multi-line content instead of typing it character-by-character

```javascript
await page.evaluate((text) => {
  const input = document.querySelector('[contenteditable="true"]');
  input.innerText = text; // Paste full text, preserves newlines
}, message);
```

#### Send Button

**Detection:** Last button, or search for `aria-label="Send"`

```javascript
const buttons = await page.$$('button');
const sendBtn = buttons[buttons.length - 1];
await sendBtn.click();
```

#### Message Extraction

**Challenge:** `[role="article"]` is unreliable. Use body text parsing instead.

```javascript
const conversation = await page.evaluate(() => {
  const text = document.body.innerText;
  // Parse for your message marker or use heuristics
  return text;
});
```

**Better approach:** Extract after known markers

```javascript
const messages = await page.evaluate(() => {
  // Find all message containers (heuristic)
  const lines = document.body.innerText.split('\n');
  return lines.filter(l => l.trim().length > 0);
});
```

#### File Upload (Context Priming)

**+ Button location:** Below text input area

```javascript
// Find file input (hidden)
const fileInput = await page.$('input[type="file"]');
// Upload file
await fileInput.uploadFile('/path/to/readme.md');
// Input may auto-submit or require interaction
```

**Flow:** Upload → click → file appears in conversation → ready to send follow-up

---

### Grok

#### Input Detection & Typing

**Selector:** `[contenteditable="true"]` with class containing `tiptap ProseMirror`

```javascript
const input = await page.$('[contenteditable="true"]');
await input.click();
await page.keyboard.type("Your message", { delay: 30 }); // Slightly slower typing
```

**Quirks:**
- TipTap rich text editor (Vue/React agnostic)
- Classes are **not obfuscated** (Tailwind CSS)
- Direct typing works reliably
- No newline quirk like Claude.ai

#### Send Button

**Detection:** By aria-label

```javascript
const sendBtn = await page.$('button[aria-label="Submit"]');
await sendBtn.click();
```

**Fallback:** Last button in input container

```javascript
const container = await page.$('[class*="flex"][class*="gap"]'); // Input wrapper
const buttons = await container.$$('button');
const sendBtn = buttons[buttons.length - 1];
await sendBtn.click();
```

#### Message Extraction

**Selector:** `.message-bubble` divs (reliable and consistent)

```javascript
const messages = await page.evaluate(() => {
  const bubbles = document.querySelectorAll('.message-bubble');
  return Array.from(bubbles).map((bubble, i) => ({
    index: i,
    role: i % 2 === 0 ? 'user' : 'grok',
    text: bubble.innerText,
  }));
});
```

**Timing:** Grok streams responses. Wait 3-5 seconds for completion before extracting.

```javascript
await new Promise(r => setTimeout(r, 4000)); // Stream time
const messages = await page.evaluate(() => {
  const bubbles = document.querySelectorAll('.message-bubble');
  return Array.from(bubbles).map(b => b.innerText);
});
```

---

## Common Patterns

### Wait for Response

**Pattern:** Send, then wait, then extract

```javascript
async function sendAndExtract(page, message, extractorFn, waitMs = 3000) {
  // Type and send
  const input = await page.$('[contenteditable="true"]');
  await input.click();
  await page.keyboard.type(message, { delay: 10 });
  const sendBtn = await page.$('button[aria-label="Submit"]');
  await sendBtn.click();

  // Wait for streaming
  await new Promise(r => setTimeout(r, waitMs));

  // Extract
  const result = await page.evaluate(extractorFn);
  return result;
}
```

### Clear Input After Send

**For Grok:**
```javascript
await page.evaluate(() => {
  const input = document.querySelector('[contenteditable="true"]');
  input.innerText = '';
});
```

**For Claude.ai:**
```javascript
await page.evaluate(() => {
  const input = document.querySelector('[contenteditable="true"]');
  input.innerText = '';
});
```

### Multi-Turn Conversation

```javascript
const turns = [
  "First question",
  "Follow-up question",
  "Another follow-up"
];

for (const turn of turns) {
  await sendAndExtract(page, turn, extractorFn);
  await new Promise(r => setTimeout(r, 1000)); // Pause between turns
}

// Extract full conversation
const allMessages = await page.evaluate(extractorFn);
```

---

## Failure Modes & Recovery

| Symptom | Cause | Recovery |
|---------|-------|----------|
| Input not found | Page not loaded | Wait 2-3s before querying |
| Send button not clickable | Message still streaming | Increase wait time before click |
| Newline triggers send (Claude.ai) | Bare Return keystroke | Paste text instead of typing |
| Message extraction incomplete | Stream still running | Increase wait time |
| File upload fails | Hidden input missing | Check page structure first |
| CDP connection lost | Browser crashed | Restart with `browser-start.js` |

---

## System Comparison Matrix

| Feature | Claude.ai | Grok |
|---------|-----------|------|
| Input element | contenteditable div | contenteditable div (TipTap) |
| Classes obfuscated? | Yes (Tailwind) | No (Tailwind) |
| Newline handling | Bare Return sends | Direct typing OK |
| Message container | body text parsing | `.message-bubble` |
| Stream completion | 3-5s typical | 3-5s typical |
| File upload | + button, hidden input | Not tested |
| Rate limit | Gentle (conversational) | Gentle (conversational) |

---

## Implementation Notes

### For Yin Usage

When yin calls a browser-comms operation:
1. **Check page exists:** Find by URL, verify loaded
2. **Send message:** Type/paste, click send
3. **Wait sensibly:** 3-5s for streaming, longer for complex queries
4. **Extract cleanly:** Use per-system selector (`.message-bubble` for Grok, body parse for Claude)
5. **Trap failures:** Missing elements, timeouts, disconnects

### For Field Agents

If spinning a sub-agent to coordinate with a remote system:
1. Accept `(page, systemName, message)` parameters
2. Dispatch to system-specific handler
3. Return `{ success, messages, error }`
4. Log interactions (for audit)

### Extensibility

New systems (ChatGPT, local LLM, Perplexity, etc.) require:
- Input selector + send mechanism
- Message extraction selector
- Timing calibration
- Per-system quirks document

Add as new section with same structure.

---

## Session & State

- **No session persistence** in this layer (browsers are ephemeral)
- Each operation is stateless; yin manages conversation context
- File uploads and conversation flow are per-page
- Multiple pages can run in parallel (different systems)

---

## Architecture Decision: Shared Chrome, Not a Daemon

**Evaluated:** agent-browser (Vercel Labs) — ref-based CLI, daemon-per-session model, Playwright-core.

**Decision:** Do not adopt. Playwright-core brings 100MB of browser binaries and an abstraction layer we don't own. Our criterion: we should be able to replicate the technology ourselves.

**Our model is simpler and already working:**
- Chrome runs independently via `browser-start.js --profile`, persists on :9222
- Chrome *is* the daemon — it outlives any agent operation
- Multiple agents connect simultaneously via CDP, work on separate tabs
- puppeteer-core is just protocol bindings (no binaries), connects cheaply

**What's worth stealing from agent-browser:**
- The ARIA ref/snapshot system — see `~/mg/side/browser-aria.md`
- Tab isolation pattern (already our model)

**What we don't need:**
- Daemon lifecycle management (Chrome handles this)
- Session-scoped browser ownership (we share one Chrome)
- Playwright abstraction (raw CDP or puppeteer-core suffices)

---

## References

- **Source:** Tested against Claude.ai (Sonnet 4.6) and Grok as of 2026-03-03
- **Browser:** Chrome 145.0.7632.117 with CDP on :9222
- **Tools:** puppeteer-core, browser-start.js (with --profile for auth)
- **Side quest:** `~/mg/side/browser-aria.md` — ARIA snapshot/ref system design
- **Future work:** ChatGPT, local LLMs, rate limiting, session recovery patterns
