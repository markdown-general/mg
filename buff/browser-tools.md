# browser-tools ⟜ extending pi-skills for multi-agent chat coordination

**Location:** `~/other/pi-skills/browser-tools/` on `browser-chat` feature branch

**Origin:** Extension of badlogic/pi-skills (pi-coding-agent author). We work directly in the upstream repo on a feature branch, making it easy to track changes, rebase on upstream updates, and contribute back.

**Setup:**
```bash
cd ~/other/pi-skills
git checkout browser-chat  # Our extensions branch
cd browser-tools
npm install
node browser-start.js --profile &  # Start daemon
```

---

## Design Philosophy

**Criterion:** Technology we can replicate ourselves. No black boxes, no frameworks we don't own.

### Architecture: Shared Chrome Daemon

We chose a **shared Chrome instance on `:9222`** (shared daemon model) over single-use patterns.

**Why:**
- Chrome runs independently via `browser-start.js --profile`, persists on localhost:9222
- Chrome *is* the daemon—it outlives any agent operation
- Multiple agents connect simultaneously via CDP, work on separate tabs
- puppeteer-core is just protocol bindings (no 100MB browser binaries bundled)
- Cheaper connection lifecycle (one persistent browser, many agent connections)

**Alternatives considered:**
- **agent-browser** (Vercel Labs): Adds 100MB of Chromium binaries, daemon-per-session lifecycle, Playwright abstraction we don't own. Good ideas (ARIA snapshot/ref system), but unnecessary weight.
- **single-agent browser library**: Works for one agent at a time; doesn't fit multi-agent coordination.

**What's reusable from agent-browser:**
- ARIA snapshot/ref system (for cleaner selectors)
- Tab isolation pattern (already our model)

**What we don't need:**
- Daemon lifecycle management (Chrome handles this)
- Session-scoped browser ownership (we share one Chrome)
- Playwright abstraction (raw CDP via puppeteer-core suffices)

---

## Core Tools

**8 Node.js scripts in `browser-tools/`:**

| Tool                    | Purpose                                              | Pattern                         |
|-------------------------|------------------------------------------------------|---------------------------------|
| `browser-start.js`      | Launch Chrome with `--remote-debugging-port=9222`    | Background daemon               |
| `browser-nav.js`        | Navigate to URLs                                     | New tab or current tab          |
| `browser-content.js`    | Extract readable markdown via Readability + Turndown | Content cleaning                |
| `browser-eval.js`       | Execute arbitrary JavaScript in current tab          | Query DOM, click, type, extract |

⚠️ **Critical:** `browser-eval.js` operates on the page *currently displayed in the Chrome browser UI*, not on what the agent assumes is active. In multi-agent workflows, the user's visible tab may differ from the agent's last-targeted tab. Always verify current page via `window.location.href` before operating, or use puppeteer directly to target specific tabs by index if certainty is required.
| `browser-screenshot.js` | Screenshot viewport                                  | Vision context                  |
| `browser-cookies.js`    | Dump cookies for current domain                      | Auth debugging                  |
| `browser-pick.js`       | Interactive element picker                           | Selector discovery              |
| `browser-list-tabs.js`  | List all open tabs (JSON or markdown)                | Tab inventory                   |

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
