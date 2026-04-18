# pi-skills/browser-tools Through Clean Code Lens

**Framework:** franalgaba/clean-code-typescript (40+ rules, 10 categories)  
**Subject:** ~/other/pi-skills/browser-tools/

---

## Structure Review

### Variables & Naming ✓

**Rule:** Meaningful names, searchable names, no mental mapping

**pi-skills status:**
- ✓ browser-eval.js, browser-nav.js, browser-list-tabs.js (searchable, intent-clear)
- ✓ SKILL.md uses full words (not "br-tools" or "btls")
- ✓ No magic numbers in main scripts
- ⚠️ config values in scripts (e.g., `:9222`) could be named constants

### Functions ✓

**Rule:** Single responsibility, 2 or fewer args, no flags, no side effects

**pi-skills status:**
- ✓ Each script does one thing (nav, eval, list, screenshot, etc.)
- ✓ browser-eval.js takes 1 arg (expression), browser-nav.js takes 2 (url, flag)
- ✓ No surprising side effects beyond stated purpose
- ⚠️ browser-nav.js --new flag is a "boolean behavior splitter" (should be separate commands?)

### Organization & Structure ✓

**Rule:** Caller/callee proximity, organized imports, consistent structure

**pi-skills status:**
- ✓ All scripts in one directory (clear locality)
- ✓ No nested dependencies (puppeteer-core is single external)
- ✓ README documents every script
- ✓ SKILL.md explains philosophy before showing code

### Error Handling ⚠️

**Rule:** Always use Error, never ignore caught errors

**pi-skills status:**
- ⚠️ Scripts redirect stderr/stdout but don't explicit error handling
- ⚠️ browser-content.js timeout silently fails (doesn't throw)
- ⚠️ browser-start.js checks for running Chrome but doesn't validate connection

### Comments ⚠️

**Rule:** Self-explanatory code, no journal comments, no positional markers

**pi-skills status:**
- ✓ Code is mostly self-evident (browser-eval.js is 40 lines, clear)
- ✗ SKILL.md has some old comments ("This is deprecated", "WIP")
- ⚠️ Some inline comments are reminders, not explanations

---

## What Makes pi-skills Good Code

1. **Minimal surface area** — 8 scripts, 200-400 lines each. Not trying to do too much.
2. **One abstraction per file** — browser-eval = "execute JS". browser-nav = "change URL". No mixing.
3. **Separation of concerns** — SKILL.md is documentation. scripts/ is implementation. References/ is external knowledge.
4. **No framework bloat** — puppeteer-core only. No Playwright, no Selenium, no heavy deps.
5. **Intentional choices** — Why CDP? Why shared daemon? Documented in Design Philosophy section.

---

## What Could Be Cleaner

### 1. Function Args: --new Flag
```javascript
// Current (browser-nav.js)
node browser-nav.js https://example.com --new

// Cleaner
node browser-nav-new-tab.js https://example.com  // explicit command
```

Or split into helper:
```bash
nav() { browser-nav.js "$1"; }
nav-new() { browser-nav.js "$1" --new; }
```

### 2. Error Handling
```javascript
// Current
await page.goto(url);  // silent fail

// Cleaner
try {
  await page.goto(url);
} catch (e) {
  throw new Error(`Navigation failed: ${url} — ${e.message}`);
}
```

### 3. Magic Strings
```javascript
// Current (scattered in browser-chat.md)
document.querySelector('[data-testid="chat-input"]')  // duplicated 3x

// Cleaner: selectors.js
module.exports = {
  claude: { input: '[data-testid="chat-input"]', send: 'button svg[viewBox="0 0 256 256"]' },
  grok: { input: '.tiptap.ProseMirror', send: 'button.group.flex.flex-col' },
};
```

### 4. Response Logging
```javascript
// Current
browser-eval.js "document.body.innerText" > ~/mg/logs/response.txt

// Cleaner: log where? Add helper
browser-eval.js "document.body.innerText" | browser-save response.txt
```

---

## Alignment with Clean Code Principles

| Category | Status | Notes |
|----------|--------|-------|
| Variables | ✓ | Clear naming, searchable |
| Functions | ✓ | Single responsibility, minimal args |
| Objects & Data Structures | ⚠️ | Selectors scattered, could be centralized |
| Classes | N/A | Scripts, not OOP |
| SOLID | ✓ | Single Responsibility principle strong |
| Comments | ⚠️ | Some journal comments, could trim |
| Error Handling | ⚠️ | Silent failures, could throw more |
| Formatting | ✓ | Consistent, readable |

---

## Verdict

**pi-skills/browser-tools is clean code.** It violates maybe 2-3 clean code rules (flag functions, silent error handling, scattered selectors). But structurally it's sound: minimal, focused, understandable.

The real question: Is it **maintainable** when multi-system (Claude/Grok/Thaura) selectors sprawl?

Answer: Yes, if you centralize selectors (separate file) and document each system's quirks once.

---

## Practical Next Step

Create **buff/browser-selectors.md** (or .json):

```
# System Selectors

claude ⟜ input, send, attach
  input: [data-testid="chat-input"]
  send: button svg[viewBox="0 0 256 256"]
  attach: input[type="file"]

grok ⟜ input, send, attach
  input: .tiptap.ProseMirror
  send: button.group.flex.flex-col
  attach: button[aria-label="Attach"]

thaura ⟜ input, send, attach
  input: textarea
  send: button[type="submit"][aria-label="Send message"]
  attach: input[type="file"]
```

Then reference in browser-chat.md instead of repeating.
