---
name: pdf-to-markdown
description: Document conversion and structured text extraction from PDFs
---

# pdf-to-markdown ⟜ PDF → Markdown + images + LaTeX recovery

**Source:** Claude analysis (2026-04-19), updated after field use (2026-05-06)  
**Attached:** word/poise.md  
**Query:** Best-practice for PDF → Markdown + images + LaTeX recovery at 2MB/day volume

---

## The Answer

**Start simple.** Most research PDFs (LaTeX-generated, text-layer) convert cleanly via `pdftohtml` → `pandoc` in seconds with no model downloads.

**Escalate to Marker** only when you need:
- Equation recovery as LaTeX (not just unicode/italics)
- Multi-column layout reconstruction
- OCR for scanned pages
- Table structure preservation

Docling is a strong alternative to Marker. Mathpix is overkill for discovery work.

---

## Fast Path: pdftohtml → pandoc

For text-layer PDFs (LaTeX, Word export, etc.):

```bash
# 1. PDF → HTML (preserves structure, line breaks, font info)
pdftohtml -s -i -noframes input.pdf output.html

# 2. HTML → Markdown
pandoc -f html -t markdown output.html -o output.md
```

**Cleanup** (strip CSS cruft, fix hard line breaks):

```python
import re

def clean_md(text):
    text = re.sub(r'`?<style[^>]*>.*?</style>`?\{=html\}', '', text, flags=re.DOTALL)
    text = re.sub(r'::: \{#[^}]+\}\s*', '', text)
    text = re.sub(r'\[\]\{#[^}]+\}\s*', '', text)
    text = re.sub(r'\\\n', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()
```

**Result:** Readable markdown in ~5 seconds for a 50-page paper. Math becomes unicode/italics (e.g. →, ⊗, *A* → *B*) rather than `$\to$`.

---

## Heavy Path: Marker

Use when the fast path loses too much structure or math.

**Costs to know:**
- First run downloads ~1.35GB of models (layout, OCR, text recognition)
- MPS/Apple Silicon can OOM on larger documents (surya layout model is memory-hungry)
- CPU fallback is ~10× slower: layout alone takes ~3 min for 14 pages, text recognition ~30+ min

```bash
# Force CPU if MPS is unstable
TORCH_DEVICE=cpu marker_single input.pdf --output_format markdown --output_dir ./out --disable_image_extraction
```

**Python batch API:**

```python
pip install marker-pdf pymupdf

from marker.convert import convert_single_pdf
from marker.models import load_all_models

models = load_all_models()  # load once, ~1.35GB

def process_pdf(pdf_path, output_dir):
    full_text, images, metadata = convert_single_pdf(
        pdf_path, models, max_pages=None, langs=["English"]
    )
    # full_text is Markdown with LaTeX inline
    # images is dict of {filename: PIL.Image}
```

---

## Pipeline Architecture

⊢ Triage per-document
- `pdfinfo` + `pdftotext` sample
- Is it text-layer or scanned?
- Does it have images?

⊢ Route
1. **Text-layer, math-light** → `pdftohtml` → `pandoc` (fast path)
2. **Text-layer, math-heavy** → Marker with `--disable_ocr`
3. **Scanned / poor text layer** → Marker with surya OCR enabled

⊢ Extract images
- PyMuPDF (fitz) for raster images with metadata
- `pdftoppm` for page-level rasters of figure-heavy sections
- Save as PNG: `doc_id/page_N_img_M.png`

⊢ Assemble output
- `.md` file with relative image links `![](images/...)`
- `images/` directory alongside
- Optional: metadata sidecar JSON (page count, source, extraction mode)

---

## LaTeX Recovery (Nuanced)

**Three levels:**
- Native LaTeX (MathML or LaTeX-source PDF) — recoverable directly
- Marker's equation detection — good for common notation, uses vision model
- Full Mathpix-grade recovery — only needed for execution/rendering downstream

**For knowledge discovery:** The fast path is usually sufficient. Route hard cases to Nougat (Meta, academic heavy-math) as secondary pass.

---

## Watch For

⟜ **Start with the fast path** — only escalate if the output is unusable. Most of the time it is.

⟜ **Marker memory** — MPS backend easily OOMs. Use `TORCH_DEVICE=cpu` or a machine with >16GB unified memory.

⟜ **Font encoding issues** — broken ToUnicode tables. Log when Marker falls back to vision.

⟜ **Vector figures** — pdfimages won't catch matplotlib/R charts. Use PyMuPDF page-level rasterisation for figure-heavy pages.

⟜ **Multi-column layout** — Marker handles two-column academic well; unusual layouts (magazine, landscape) flag for review.

⟜ **LaTeX in tables** — hardest case across all tools. Log for spot-checking if corpus heavy in them.

⟜ **Raw PDF preservation** — keep alongside Markdown. Re-processing with improved models later is cheap at this volume; raw preservation is free insurance.

---

## Status

✓ Retrieved. Field-tested 2026-05-06: fast path preferred, Marker reserved for math-heavy or scanned documents.
