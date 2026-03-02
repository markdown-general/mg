# md-to-pdf

Convert markdown to PDF using pandoc.

Pandoc uses LaTeX underneath for high-quality PDFs with proper typography, citations, and equation support.

## what it does

Takes markdown from `content/`, converts to PDF, handles images from `artifacts/`.

## why pandoc

Other tools are simpler but pandoc gives:
- Professional typography via LaTeX
- Equation support (if needed later)
- Citation handling
- Table of contents generation
- Extensive customization

Trade-off: requires pandoc + LaTeX installation (~2GB).

## code

```python
#!/usr/bin/env python3
"""
Convert markdown to PDF using pandoc.
Handles images from artifacts/ directory.
"""

import argparse
from pathlib import Path
import subprocess
import shutil

def convert_md_to_pdf(
    md_path: Path,
    output_pdf: Path = None,
    artifacts_dir: Path = Path("artifacts"),
    toc: bool = False
):
    """
    Convert markdown to PDF using pandoc.
    
    Args:
        md_path: Path to input markdown file
        output_pdf: Path for output PDF (default: same name as input)
        artifacts_dir: Where images are located (default: artifacts/)
        toc: Include table of contents
    """
    
    if not md_path.exists():
        raise FileNotFoundError(f"Markdown file not found: {md_path}")
    
    # Check pandoc is available
    if not shutil.which("pandoc"):
        raise RuntimeError("pandoc not found. Install with: brew install pandoc")
    
    # Default output path
    if output_pdf is None:
        output_pdf = md_path.with_suffix('.pdf')
    
    print(f"Converting {md_path.name} to PDF...")
    
    # Build pandoc command
    cmd = [
        "pandoc",
        str(md_path),
        "-o", str(output_pdf),
        "--pdf-engine=xelatex",  # Better Unicode support
        "-V", "geometry:margin=1in",  # Reasonable margins
    ]
    
    if toc:
        cmd.append("--toc")
    
    # Run pandoc
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"PDF created: {output_pdf}")
        return output_pdf
        
    except subprocess.CalledProcessError as e:
        print(f"Pandoc error: {e.stderr}")
        raise

def main():
    parser = argparse.ArgumentParser(
        description="Convert markdown to PDF using pandoc"
    )
    parser.add_argument(
        "markdown",
        type=Path,
        help="Path to markdown file"
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        help="Output PDF path (default: same as input with .pdf)"
    )
    parser.add_argument(
        "--artifacts-dir",
        type=Path,
        default=Path("artifacts"),
        help="Directory containing images (default: artifacts/)"
    )
    parser.add_argument(
        "--toc",
        action="store_true",
        help="Include table of contents"
    )
    
    args = parser.parse_args()
    
    convert_md_to_pdf(
        args.markdown,
        args.output,
        args.artifacts_dir,
        args.toc
    )
    
    return 0

if __name__ == "__main__":
    exit(main())
```

## run

### install

```bash
# Install pandoc and LaTeX
brew install pandoc
brew install --cask basictex  # ~100MB, or mactex for full (~4GB)

# After basictex, update LaTeX packages
sudo tlmgr update --self
sudo tlmgr install collection-fontsrecommended

# Activate venv (if not already)
source ~/markdown-general/.venv/bin/activate
```

### use

```bash
# Define helper function
md2pdf() {
  sed -n '/^```python$/,/^```$/p' work/md-to-pdf.md | sed '1d;$d' | python - "$@"
}

# Convert markdown to PDF
md2pdf content/document.md

# Custom output location
md2pdf content/document.md -o output/document.pdf

# Include table of contents
md2pdf content/document.md --toc
```

Available flags:
- `-o PATH` - output PDF path (default: replaces .md with .pdf)
- `--artifacts-dir DIR` - where images live (default: artifacts/)
- `--toc` - include table of contents

## examples

### basic conversion

```bash
md2pdf content/pdf-to-md.md
```

Creates `content/pdf-to-md.pdf` with all images from `artifacts/` included.

### with table of contents

```bash
md2pdf content/long-document.md --toc
```

Generates TOC from markdown headers.

### custom output

```bash
md2pdf content/report.md -o ~/Desktop/final-report.pdf
```

## tests

Expected behavior:
- Headers convert to PDF sections
- Code blocks preserve formatting
- Tables render properly
- Images from `artifacts/` included
- Bold, italic, links preserved
- Lists (ordered/unordered) work

Known issues:
- Image paths must be relative and correct
- Very long code blocks might page-break awkwardly
- LaTeX errors can be cryptic

## round-trip test

Test conversion fidelity:

```bash
# Start with markdown
md2pdf content/pdf-to-md.md -o test.pdf

# Convert back to markdown  
pdf2md test.pdf

# Compare (won't be identical, but structure should survive)
diff content/pdf-to-md.md content/test.md
```

Expected differences:
- Whitespace changes
- Code block language tags might be lost
- Image paths reformatted
- Some formatting details lost

Structure and content should survive.
