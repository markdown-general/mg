# pdf-to-md

PDFs are for printing, not parsing. Converting them to markdown gets messy - tables mangle, equations disappear, layouts scramble.

pymupdf4llm handles this well enough:
- Fast, no ML model loading
- Handles tables, code blocks, headers, lists
- Extracts or embeds images
- Works with Python 3.14

## what it does

Takes a PDF from `ingest/`, converts it to markdown in `content/`, extracts images to `artifacts/`.

The PDF disappears from `ingest/` once consumed.

## why pymupdf4llm

Other tools fail on technical PDFs:
- Simple text extraction scrambles layout
- Cloud APIs cost money and need internet
- marker-pdf needs Python 3.10-3.12 (not 3.14)

pymupdf4llm is local, free, fast, and works with modern Python.

## code

```python
#!/usr/bin/env python3
"""
Convert PDF to markdown using pymupdf4llm.
Extracts images to artifacts/, outputs markdown to content/
"""

import argparse
from pathlib import Path
import pymupdf4llm
import shutil

def convert_pdf(
    pdf_path: Path,
    output_dir: Path = Path("content"),
    artifacts_dir: Path = Path("artifacts"),
    pages: list[int] = None
):
    """
    Convert a PDF to markdown.
    
    Args:
        pdf_path: Path to input PDF
        output_dir: Where to save markdown (default: content/)
        artifacts_dir: Where to save extracted images (default: artifacts/)
        pages: Optional list of 0-based page numbers to process
    """
    
    # Convert PDF to markdown
    print(f"Converting {pdf_path.name}...")
    
    # Set up image extraction to artifacts/
    artifacts_dir.mkdir(exist_ok=True, parents=True)
    
    md_text = pymupdf4llm.to_markdown(
        str(pdf_path),
        pages=pages,
        write_images=True,
        image_path=str(artifacts_dir),
        image_format="png"
    )
    
    # Save markdown to content/
    output_dir.mkdir(exist_ok=True, parents=True)
    output_md = output_dir / f"{pdf_path.stem}.md"
    output_md.write_bytes(md_text.encode())
    
    print(f"Markdown saved to: {output_md}")
    
    # Count extracted images
    images = list(artifacts_dir.glob(f"{pdf_path.stem}-*.png"))
    if images:
        print(f"Extracted {len(images)} images to: {artifacts_dir}/")
    
    print(f"\nDone! Check {output_md}")
    
    return output_md

def main():
    parser = argparse.ArgumentParser(
        description="Convert PDF to markdown using pymupdf4llm"
    )
    parser.add_argument(
        "pdf",
        type=Path,
        help="Path to PDF file"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("content"),
        help="Output directory for markdown (default: content/)"
    )
    parser.add_argument(
        "--artifacts-dir",
        type=Path,
        default=Path("artifacts"),
        help="Output directory for images (default: artifacts/)"
    )
    parser.add_argument(
        "--pages",
        type=str,
        help='Comma-separated page numbers (0-indexed), e.g. "0,5,10"'
    )
    
    args = parser.parse_args()
    
    if not args.pdf.exists():
        print(f"Error: {args.pdf} not found")
        return 1
    
    # Parse pages argument
    pages = None
    if args.pages:
        pages = [int(p.strip()) for p in args.pages.split(',')]
    
    convert_pdf(
        args.pdf,
        args.output_dir,
        args.artifacts_dir,
        pages
    )
    
    return 0

if __name__ == "__main__":
    exit(main())
```

## run

### install

```bash
# One-time setup in your sisyphus directory
cd ~/markdown-general
python3 -m venv .venv
source .venv/bin/activate
pip install pymupdf4llm
```

Works with Python 3.9-3.14.

### use

The code is extracted and run in one pipeline. All arguments after `python -` go to the script.

```bash
# Make sure venv is active
source ~/markdown-general/.venv/bin/activate

# Shorthand for the extraction pipeline
pdf2md() {
  sed -n '/^```python$/,/^```$/p' work/pdf-to-md.md | sed '1d;$d' | python - "$@"
}

# Now use it:
pdf2md ingest/book.pdf

# With page selection
pdf2md ingest/book.pdf --pages "0,5,10"

# With custom directories
pdf2md ingest/book.pdf --output-dir content/books --artifacts-dir artifacts/book-images

# All flags together
pdf2md ingest/book.pdf --pages "0,5,10" --output-dir content/books --artifacts-dir artifacts/images
```

Available flags:
- `--pages "0,5,10"` - comma-separated page numbers (0-indexed)
- `--output-dir DIR` - where to save markdown (default: content/)
- `--artifacts-dir DIR` - where to save images (default: artifacts/)

## api

### inputs
- PDF file path (required)
- Output directory for markdown (optional, default: `content/`)
- Artifacts directory for images (optional, default: `artifacts/`)
- Page list (optional, format: `"0,5,10"` - comma-separated page numbers)

### outputs
- Markdown file in output directory
- Extracted images in artifacts directory named `{filename}-{page}-{index}.png`

### configuration
None currently. pymupdf4llm uses sensible defaults for layout detection and table extraction.

## examples

### technical book

```bash
source ~/markdown-general/.venv/bin/activate

# Define the helper function
pdf2md() {
  sed -n '/^```python$/,/^```$/p' work/pdf-to-md.md | sed '1d;$d' | python - "$@"
}

# Convert the book
pdf2md ingest/Agentic_Design_Patterns.pdf
```

Result:
- `content/Agentic_Design_Patterns.md` with GitHub-compatible markdown
- `artifacts/Agentic_Design_Patterns-{page}-{index}.png` for figures
- Tables converted to markdown tables
- Headers detected by font size, formatted with `#`
- Code blocks and lists preserved

### extract specific pages

```bash
pdf2md ingest/book.pdf --pages "0,20,35"
```

Useful for extracting just chapter pages or specific sections.

### scanned document

pymupdf4llm has optional OCR support if you install `opencv-python` and have Tesseract available:

```bash
source ~/markdown-general/.venv/bin/activate
pip install opencv-python
brew install tesseract  # macOS

pdf2md ingest/scanned-paper.pdf
```

## tests

Expected behavior:
- Fast (no model loading, processes immediately)
- Tables convert to markdown tables (generally accurate)
- Headers detected by font size: larger = more `#`
- Bold, italic, monospace text formatted correctly
- Code blocks detected and preserved
- Ordered and unordered lists converted
- Images extract with names like `filename-page-index.png`
- Multi-column pages handled

Known quirks:
- Font-based header detection can miss semantic headers
- Complex tables might need manual cleanup
- Scanned PDFs need OCR setup (opencv + tesseract)
- No equation-to-LaTeX conversion (unlike marker-pdf)
