# tools/python.md

**python cards** ⟜ deploying Python tools in sisyphus

**what it does** ⟜ guide for writing, installing, and maintaining Python-based cards

**why** ⟜ Python offers simplicity for text/file manipulation tools; this guide ensures consistency across Python cards

## environment

Python is installed via Homebrew at `/opt/homebrew/bin/python3` (Python 3.14.0).

Python cards use only stdlib - no external dependencies (pip/pipx/uv not required for sisyphus tools).

## deployment pattern

All Python cards follow the same extraction and deployment pattern:

### extraction method

```bash
# Universal pattern for all Python cards
cache_tool() {
  sed -n '/^```python$/,/^```$/p' ~/markdown-general/tools/CARD.md | sed '1d;$d' | python3 - "$@"
}
```

Replace `CARD.md` with the specific card name. The sed pattern:
- Finds the first ` ```python` fence
- Extracts lines until the closing ` ```
- Removes the fence markers themselves (sed `1d;$d`)
- Pipes to python3 with arguments passed through (`"$@"`)

### deployment to artifacts/bin/

Create a wrapper script in `artifacts/bin/toolname`:

```bash
#!/bin/bash
sed -n '/^```python$/,/^```$/p' ~/markdown-general/tools/toolname.md | sed '1d;$d' | python3 - "$@"
```

Make it executable:
```bash
chmod +x ~/markdown-general/artifacts/bin/toolname
```

Add to PATH (if not already done):
```bash
export PATH="$HOME/markdown-general/artifacts/bin:$PATH"
```

## card structure

Python cards follow standard card format:

```markdown
# tools/toolname.md

**toolname** ⟜ short description

**what it does** ⟜ longer explanation

## code

\`\`\`python
#!/usr/bin/env python3
"""
Docstring explaining the tool.
"""

import argparse
from pathlib import Path
# ... rest of implementation

def main():
    # entry point
    pass

if __name__ == "__main__":
    exit(main())
\`\`\`

## run

### extract and use

\`\`\`bash
toolname() {
  sed -n '/^\`\`\`python$/,/^\`\`\`$/p' ~/markdown-general/tools/toolname.md | sed '1d;$d' | python3 - "$@"
}

toolname [args]
\`\`\`

## api

[Document inputs, outputs, arguments]

## examples

[Show common usage patterns]

## status

**Tests:** [test results]
**Last updated:** [date]
```

## stdlib guidelines

Python cards should use only stdlib:

**Always available:**
- argparse (CLI)
- pathlib (paths)
- subprocess (exec)
- json (parsing)
- re (regex)
- datetime (time)
- glob, fnmatch (patterns)
- shutil (file ops)

**Use when appropriate:**
- typing (type hints)
- dataclasses (simple data structures)
- collections (deque, defaultdict, etc)
- functools (caching, reduce, etc)
- itertools (advanced iteration)

**Avoid:**
- External packages (numpy, requests, etc)
- Complex dependencies
- Version-specific features

## testing

Python cards can include inline tests using doctest or standalone test sections:

```python
# Doctest in docstring
def process(x):
    """
    Process input x.

    >>> process(5)
    10
    """
    return x * 2
```

Or shell tests in `## run` section:

```bash
# Test basic functionality
python3 - <<'EOF'
# inline test code
print("test passed")
EOF
```

## examples

See **tools/cache.md** for a complete Python card example with:
- Full argparse CLI
- Multiple subcommands
- File I/O
- Pattern matching
- Deployment on PATH

## relations

**card.md** ⟜ general card structure (applies to all languages)
**haskell-api.md** ⟜ Haskell-specific deployment (compilation, testing, cabal)
**cache.md** ⟜ working example of Python card
