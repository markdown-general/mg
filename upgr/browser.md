# browser ⟜ CDP pipeline for extracting and analyzing web content

**What it does**: Extract readable content from live web pages via Chrome DevTools Protocol. Navigate, evaluate JavaScript, screenshot, extract markdown. No browser extension needed—works with Chrome on `--remote-debugging-port=9222`.

**Where it lives**: ~/other/pi-skills/browser-tools (Node.js scripts, puppeteer-core-based)

---

## core tools

**browser-start.js** ⟜ Launch Chrome with remote debugging enabled
```bash
node browser-start.js --profile  # Use your Chrome profile (cookies, logins)
```
Flags: `--disable-session-crashed-bubble`, `--disable-infobars` to suppress UI noise.

**browser-nav.js** ⟜ Navigate to URLs
```bash
node browser-nav.js https://example.com
node browser-nav.js https://example.com --new  # Open in new tab
```

**browser-content.js** ⟜ Extract readable markdown from page
```bash
node browser-content.js https://example.com
# Uses Mozilla Readability + Turndown to extract article text as markdown
```

**browser-eval.js** ⟜ Execute JavaScript in current tab, return result
```bash
node browser-eval.js "document.title"
node browser-eval.js "document.querySelectorAll('a').length"
# Code runs in async context. Can extract DOM state, run interactions.
```

**browser-screenshot.js** ⟜ Screenshot current viewport

**browser-cookies.js** ⟜ Dump cookies for current tab (domain, path, httpOnly, secure)

**browser-pick.js** ⟜ Interactive element picker (user clicks to select, returns CSS selectors)

**browser-list-tabs.js** ⟜ List all open tabs (JSON or markdown format) *[NEW, part of this session]*

---

## integration patterns

**Extract + summarize loop** ⟜ Common pattern: navigate → extract markdown → feed to agent for analysis
```bash
node browser-content.js URL > content.md
cat content.md | pi --mode=interactive  # Agent summarizes
```

**PDF extraction** ⟜ browser-content.js doesn't handle PDFs. Use curl + pdftotext:
```bash
curl -L "https://arxiv.org/pdf/2502.13033" -o paper.pdf
pdftotext paper.pdf paper.txt
cat paper.txt | pi --mode=interactive  # Agent summarizes
```

**DOM inspection** ⟜ For complex pages, browser-eval.js to extract structured data:
```bash
node browser-eval.js "(function() { 
  return document.querySelectorAll('.item').map(e => ({
    title: e.querySelector('h1')?.textContent,
    url: e.href
  })); 
})()"
```

**Waiting for JS-heavy pages** ⟜ Use longer timeouts in browser-content.js (default 30s, adjust in source)

---

## known limitations

**Form submission** ⚠️ Writing to chat inputs + triggering submission doesn't work reliably yet. Side-quest: form recognition library.

**Authentication** ⚠️ Gmail/Grok require live login. Use `--profile` to copy your Chrome profile (preserves cookies). Full email content requires CDP navigation to specific message.

**PDFs** ⚠️ browser-content.js can't extract PDFs. Use pdftotext (poppler) first.

**Chrome stability** ⚠️ After 3-4 rapid extractions, Chrome may timeout. Fix: longer delays (5-10s between requests) or restart Chrome instance.

---

## session integration

Browser state is ephemeral (current tab, DOM state). To persist findings:
- Save extracted markdown to log/ (timestamped)
- Feed to agents via stdin or file read
- Capture agent output in cards/ (tab-summaries-20260301.md is example)
- Log original URL + reasoning in metadata

This pairs well with yin sessions: extract → agent summarize → log result → decide keep/discard.

---

## setup

```bash
cd ~/other/pi-skills/browser-tools
npm install
node browser-start.js --profile &  # Background
# Now tools are ready
```

---

## why it matters

Agents can now read your open tabs, research papers, web content—without you copy-pasting. Live research becomes part of the agent workflow. Cheaper than asking Claude directly (browser skips chat round-trip). Fits pi-mono's extensibility philosophy.
