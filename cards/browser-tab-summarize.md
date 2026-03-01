# browser-tab-summarize ⟜ extract and summarize open tabs via agents

Extract markdown from each URL in yin/urls.md. Spin agents to produce loose decks (3-6 lines, ~10k token budget). Collect all summaries + reasoning for keeping each tab.

**Context**: Browser integration via pi-skills/browser-tools (CDP). Eight URLs staged: Gmail, Grok conversation, arXiv, GitLab snippet, Julesh optics, Bartosz category theory, Anil notes (2x).

---

## strategy

⊢ read yin/urls.md ⊣ ◊ ⬡
  ⟜ parse URLs, strip whitespace
  [urls-parsed]

⊢ extract content per URL ⊣
  ⟜ for each URL: browser-content.js <url> → log/browser-content-<idx>-[timestamp].md
  ⟜ **SPECIAL CASE**: Google Docs may require login + JS eval; defer if auth fails
  [content-extracted] or [google-docs-deferred]

⊢ spin summarization agents ⊣
  ⟜ model: Haiku 4.5, thinking: medium, budget: ~10k tokens
  ⟜ agent per content file (parallel spin OK)
  ⟜ priming: "Read this content. Produce a loose deck (3-6 lines). Lead line describes core idea. Each line: bold concept ⟜ short elaboration. Include: why this is worth keeping, what knowledge it adds."
  ⟜ output format: markdown loose deck, write to log/summary-<idx>-[timestamp].md
  [agents-spun]

⊢ collect and review ⊣ ◊
  ⟜ cat all summary-*.md files → master deck output
  ⟜ annotate with URL and agent's keep/discard reasoning
  [summaries-collected]

⊲¹ if google-docs-deferred ⊣
  ⟜ manually navigate in browser, or screenshot/eval DOM
  ⟜ re-spin agent on extracted text
  ⟜ loop back to collect

◉ done ⟜ decks ready for review

---

## URLs (from yin/urls.md)

```
1. https://mail.google.com/mail/u/0/#inbox/FMfcgzQfBGVpMwTkJVMkLNrbHHZDlMpk?projector=1&messagePartId=0.1
2. https://grok.com/c/f90cf6d0-97b7-4ce9-9f0d-e30f26ef09cb?rid=fc9a4f64-be4d-4fa5-9f77-9dbd352d4de5
3. https://arxiv.org/pdf/2502.13033
4. https://gitlab.com/-/snippets/5936040
5. https://julesh.com/posts/2025-10-16-dependent-optics-ii.html
6. https://bartoszmilewski.com/2021/02/16/functorio/
7. https://anil.recoil.org/notes/aoah-2025-25
8. https://anil.recoil.org/notes/aoah-2025-15
```

---

## notes

**Google Docs (URL 1)**: Gmail inbox with email. browser-content.js may fail auth. Try first; if blocked, defer to manual extraction or CDP JavaScript eval to get text content.

**Grok conversation (URL 2)**: Dynamic content. Should extract via browser-content.js (waits for JS load).

**arXiv PDF (URL 3)**: PDF link. browser-content.js may or may not handle; fallback is manual download + extract.

**GitLab snippet (URL 4)**: Code. browser-content.js should extract.

**Web articles (URLs 5-8)**: Standard HTML. Should extract cleanly.

---

## agent priming template

```
You are a summarizer. Read the provided content carefully.

Produce a LOOSE DECK (3-6 lines, scannable structure).

Format:
**[lead concept]** ⟜ [short elaboration]

Rules:
- Keep elaborations concise (1 sentence or phrase)
- Bold lead tokens only
- Capture core ideas, not every detail
- Include: "Worth keeping because..." at the end

Example output:
**Functorio** ⟜ functional programming via Factorio game
**composition** ⟜ assemblers as functions, inserters as identity
**higher-order** ⟜ recipes that produce other recipes
**category theory** ⟜ Factorio exhibits cartesian category structure
Worth keeping because: bridges game design and abstract math, helps teach FP via engineering metaphor
```

---

## execution notes

- Start with URLs 3-8 (known to work with browser-content.js)
- Attempt URL 2 (Grok—dynamic, should work)
- Defer URL 1 (Gmail—auth required, likely to fail)
- Collect all summaries before review
- If any agent fails, mark with 🚩 and flag for manual intervention

---

## next

After summaries collected: review, curate, decide which tabs are "keepers" (with agent reasoning attached).
