---
name: browser-tools
description: DOM navigation, element extraction, and web interaction primitives
---

# browser-tools ⟜ shared Chrome daemon for multi-agent browser automation

**Location:** `~/other/pi-skills/browser-tools/` on `browser-chat` branch

**Launch:**
```bash
chrome-open-macos.sh --profile
```

---

## Architecture: Shared Chrome Daemon on :9222

We chose a **shared Chrome instance on `:9222`** (shared daemon model) over single-use patterns.

One Chrome instance on localhost:9222. Multiple agents connect via CDP. Each agent works on separate tabs. No per-session daemon overhead.

Uses puppeteer-core (just protocol bindings) instead of full browser bundles.

---

## Core Tools

**8 Node.js scripts in `browser-tools/`:**

| Tool                    | Purpose                                              | Pattern                         |
|-------------------------|------------------------------------------------------|---------------------------------|
| `browser-start.js`      | Launch Chrome with `--remote-debugging-port=9222`    | Background daemon               |
| `browser-nav.js`        | Navigate to URLs                                     | New tab or current tab          |
| `browser-content.js`    | Extract readable markdown via Readability + Turndown | Content cleaning                |
| `browser-eval.js`       | Execute arbitrary JavaScript in tab (see **Tab Targeting** below) | Query DOM, click, type, extract |
| `browser-list-tabs.js`  | List all open tabs with URLs (built-in)               | Pre-flight check, tab discovery |
| `browser-screenshot.js` | Screenshot viewport                                  | Vision context                  |
| `browser-cookies.js`    | Dump cookies for current domain                      | Auth debugging                  |
| `browser-pick.js`       | Interactive element picker                           | Selector discovery              |
| `browser-list-tabs.js`  | List all open tabs (JSON or markdown)                | Tab inventory                   |

---

## Tab Targeting ⚠️

**The Problem:**
`browser-eval.js` and other tools operate on the **last tab in the array** (`.at(-1)`), not the tab visually active in your browser UI. If you say "I have Claude up right now" but the last tab is GitHub, tools will target GitHub instead.

**The Solution:**
Always start with `[list-tabs]` to see the current tab layout. Agents see the mapping and can target by index or URL pattern.

**Pattern:**
```
⊢ List tabs
  browser-list-tabs.js
⊢ Verify target page (Claude, Grok, GitHub, etc.)
  [Use index from list]
⊢ Operate on correct tab
  browser-eval.js "your code" --tab=INDEX
```

**Example output:**
```
4 tabs open:

1. https://ncatlab.org/nlab/show/traced+monoidal+category
2. https://claude.ai/chat/cba79cdb-bc24-48ed-8d59-74182f70a753
3. https://www.youtube.com/watch?v=kZ4muU5Wc_4&t=57s
4. https://github.com/badlogic/pi-mono/tree/main
```

If the user says "I have the Claude page up", the agent finds index 2 in the list and targets it. If the user says "I'm on GitHub", the agent targets index 4.

---

## Integration Patterns

### Extract + Log + Summarise Loop

```
⊢ Navigate to page
  [browser-nav] URL
⊢ Extract readable content
  [browser-content] URL > ~/mg/logs/extracted.md
⊢ (optional) Fork an agent (pi -p) to summarise
  [fork-agent-summ] ~/mg/logs/extracted-summ.md
```

**Why this works:** Mozilla Readability strips HTML/CSS noise, Turndown converts to markdown, Agent context is protected from large token counts with a sub-agent summariser. Clean text instead of DOM means 100s of tokens, not 10k tokens.

### PDF Handling

browser-content.js doesn't handle PDFs (Readability limitation). Chain with system tools:

```bash
curl -L "https://arxiv.org/pdf/2502.13033" -o ~/mg/logs/paper.pdf
pandoc ~/mg/logs/paper.pdf ~/mg/logs/paper.md
```

### DOM Inspection for Structured Data

For complex pages where readable content isn't enough:

```javascript
// Store in a file, execute via browser-eval.js
document.querySelectorAll('.item').map(e => ({
  title: e.querySelector('h1')?.textContent,
  url: e.href
}))
```

### JS-Heavy Pages

Default timeout in browser-content.js is 30s. Some pages need longer. Adjust in source or increase wait time before extraction.

---

## Limitations & Workarounds

### Form Submission

**Challenge:** Can't automate keyboard.type() for multi-line input; bare Return triggers send.

**Solution:** Paste via `element.innerText = text` instead of typing character-by-character.

```javascript
// Correctly pastes multi-line text without triggering send
await page.evaluate((text) => {
  const input = document.querySelector('[contenteditable="true"]');
  input.innerText = text;
}, message);
```

Wait 2-3s after page load before interacting.

### Authentication

Gmail, Grok, Claude require live login. Use `--profile` flag to copy your Chrome profile (preserves cookies, logins).

```bash
browser-start.js --profile &
```

Full email content or private chat access requires authentication—this handles it.

### Chrome Stability

After 3-4 rapid extractions, Chrome may timeout or miss selectors. 

**Fix:** 
- Increase delays between requests (5-10s)
- Restart Chrome instance
- Check connection health

---

## Connection Model

### Puppeteer-Core Bindings

```javascript
const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const pages = await browser.pages();
const targetPage = pages.find(p => p.url().includes('claude.ai'));
```

**Conventions:**
- Chrome runs with `--remote-debugging-port=9222`
- Find page by URL substring match
- Always verify page exists before operating
- Disconnect gracefully after operation

### Multiple Agents, Separate Tabs

Each agent can:
1. Find its own tab (by URL)
2. Perform operations independently
3. No conflicts (separate DOM contexts)

Example: One agent on Claude.ai, another on Grok.com, coordinated by yin.

---

## Session Integration

Browser state is ephemeral (current tab, DOM). To persist findings:

- **Save extracted markdown to `~/mg/logs/`** (timestamped)
- **Feed to agents via file read** (agents have access to logs)
- **Capture agent output in cards** (narrative + artifacts)
- **Log original URL + reasoning** (for audit trail)

This pairs well with yin coordination: extract → agent summarize → log result → decide keep/discard → next move.

---

## Verification & Testing

The **yarn consolidation task** serves as the integration test. We use it to verify:
- Multi-turn chat coordination (Claude → Grok → Thaura)
- File passing and state preservation
- Named operations in buff/browser-chat.md
- Error recovery patterns

See [[loom/yarn-consolidation.md]] for the workflow.

---

## Extension Points

**In progress:**
- Per-system send/extract mechanics (buff/browser-chat.md)
- Multi-turn conversation loops with state preservation
- Error recovery and retry logic
- File upload patterns

Keep this file focused on philosophy and core tools. System-specific mechanics belong in buff/browser-chat.md.
