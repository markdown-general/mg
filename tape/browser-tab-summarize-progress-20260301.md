# browser-tab-summarize execution ⟜ progress log 20260301

**Status**: Partial extraction. 1 of 8 URLs extracted cleanly. Others require debugging.

---

## extraction results

| URL | Status | Size | Notes |
|-----|--------|------|-------|
| 1. Gmail inbox | ✗ [Gmail-DEBUG] | 282B | Only loading error, not email content. JS-heavy, auth required. |
| 2. Grok conversation | ✗ [TIMEOUT] | 66B | Chrome timeout during extraction. |
| 3. arXiv PDF | ✗ [PDF-UNSUPPORTED] | 67B | PDF format. Readability can't extract. |
| 4. GitLab snippet | ✗ [TIMEOUT] | 66B | Chrome timeout. |
| 5. Julesh optics | ✗ [TIMEOUT] | 66B | Chrome timeout. |
| 6. Bartosz Functorio | ✓ [SUCCESS] | 24K | Clean markdown extraction. Category theory + FP. |
| 7. Anil notes (aoah-2025-25) | ✗ [TIMEOUT] | 66B | Chrome timeout. |
| 8. Anil notes (aoah-2025-15) | ✗ [TIMEOUT] | 66B | Chrome timeout. |

---

## issues identified

**Chrome stability**: After 2-3 extractions, Chrome times out or disconnects. Likely:
- Browser is being hammered by rapid successive calls
- Need longer delays between requests or separate Chrome instances
- Or browser-content.js has resource leak

**PDF handling**: arXiv PDF can't be extracted via browser-content.js (readability limitation). Need to:
- Skip PDFs or handle separately via `curl | pdf2text` or similar
- Or manually download + extract

**Auth-required content**: Gmail and potentially Grok (dynamic JS) fail.
- Gmail: Need to access email via API or CDP JavaScript eval
- Grok: May need to wait longer for JS to load before extraction

**Solution for next attempt:**
1. Increase wait time between extractions (5-10 seconds)
2. Restart Chrome after every 2-3 URLs
3. Handle PDFs separately (skip or download via curl)
4. Test Gmail via direct CDP eval (not readability)

---

## successful extraction

**log/browser-content-6-retry.md** (Bartosz Functorio): 24KB, clean.

Core content:
- Functional programming via Factorio game mechanics
- Assemblers as functions, tuples as product types
- Function composition, higher-order functions
- Category theory (cartesian categories)
- Types: CopperPlate → CopperWire, composition, identity

Ready for agent summarization.

---

## next steps

⊢ Debug Gmail (direct CDP eval) ⊣ ✓
  ⟜ Navigated to Gmail via CDP ✓
  ⟜ DOM accessible, interface + email previews extracted ✓
  ⟜ For full email text: need to click into message, then extract
  ⟜ Proof of concept: CDP JavaScript eval works for Gmail

⊢ Retry others with longer delays ⊣
  ⟜ Increase delay between extractions to 10s
  ⟜ Restart Chrome every 3 URLs

⊢ Handle arXiv PDF ⊣
  ⟜ Defer to manual/curl download or skip

⊢ Spin agent on Bartosz (proof of concept) ⊣
  ⟜ Test deck priming sequence on 24KB content
  ⟜ Verify loose deck format works

◉ Report findings, iterate
