---
name: pdf-to-markdown
description: Document conversion and structured text extraction from PDFs
---

# pdf-to-markdown ⟜ PDF → Markdown + images + LaTeX recovery

**Source:** Claude analysis (2026-04-19)  
**Attached:** word/poise.md  
**Query:** Best-practice for PDF → Markdown + images + LaTeX recovery at 2MB/day volume

---

## The Answer

**Tool recommendation:** Marker (PyMuPDF + surya OCR + LaTeX detection)

**Why:** Balanced for research PDFs, good equation handling, light operational load at 2MB/day volume. Docling strong alternative. Mathpix overkill.

---

## Pipeline Architecture

⊢ Triage per-document
- pdfinfo + pdftotext sample
- Is it text-layer or scanned?
- Does it have images?

⊢ Route
- Text-layer → Marker (fast path)
- Scanned → Marker with surya OCR enabled

⊢ Extract images
- PyMuPDF (fitz) for raster images with metadata
- pdftoppm for page-level rasters of figure-heavy sections
- Save as PNG: doc_id/page_N_img_M.png

⊢ Assemble output
- .md file with relative image links ![](images/...)
- images/ directory alongside
- Optional: metadata sidecar JSON (page count, source, extraction mode)

---

## LaTeX Recovery (Nuanced)

**Three levels:**
- Native LaTeX (MathML or LaTeX-source PDF) — recoverable directly
- Marker's equation detection — good for common notation, uses vision model
- Full Mathpix-grade recovery — only needed for execution/rendering downstream

**For knowledge discovery:** Marker's output sufficient. Route hard cases to Nougat (Meta, academic heavy-math) as secondary pass.

---

## Concrete Stack

```python
pip install marker-pdf pymupdf

from marker.convert import convert_single_pdf
from marker.models import load_all_models

models = load_all_models()  # load once

def process_pdf(pdf_path, output_dir):
    full_text, images, metadata = convert_single_pdf(
        pdf_path, models, max_pages=None, langs=["English"]
    )
    # full_text is Markdown with LaTeX inline
    # images is dict of {filename: PIL.Image}
    # write both out
```

At 2MB/day: runs on single CPU core. GPU optional, speeds up OCR/equation steps 5x.

---

## Watch For

⟜ **Font encoding issues** — broken ToUnicode tables. Log when Marker falls back to vision.

⟜ **Vector figures** — pdfimages won't catch matplotlib/R charts. Use PyMuPDF page-level rasterisation for figure-heavy pages.

⟜ **Multi-column layout** — Marker handles two-column academic well; unusual layouts (magazine, landscape) flag for review.

⟜ **LaTeX in tables** — hardest case across all tools. Log for spot-checking if corpus heavy in them.

⟜ **Raw PDF preservation** — keep alongside Markdown. Re-processing with improved models later is cheap at this volume; raw preservation is free insurance.

---

## Status

✓ Retrieved. Working reference for knowledge discovery pipelines.
