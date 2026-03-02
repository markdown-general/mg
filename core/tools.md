# tools ⟜ executable patterns in markdown

**tools** ⟜ markdown + code = scripts that document themselves
**interface** ⟜ write, extract, run, test
**literate** ⟜ results, tests, status all on the card; it's the source of truth
**agnostic** ⟜ python, shell, any language works
**casting** ⟜ defunctionalization (conversation → markdown), refunctionalization (markdown → executable)

Tools live in ~/mg/tool/ as markdown files with code blocks. Extract, wrap, run.

## card structure

Write tools following this order for clarity:

**Statement** ⟜ what it does, why, who needs it
**Example** ⟜ 1-2 concrete uses (the common case)
**API** ⟜ arguments, options, behavior
**Tips** ⟜ gotchas, edge cases (if needed)
**Status** ⟜ tested/working, known issues
**Code** ⟜ implementation with inline notes
**Tests** ⟜ how to verify it works

All sections are optional. Small tool = just a few sections.

No file-hopping. Everything needed to understand and fix the tool lives on the card.

## Python tools

Write a code block ```python with your implementation.

Extract with sed:
```bash
sed -n '/^```python$/,/^```$/p' ~/mg/tool/toolname.md | sed '1d;$d' | python3 - "$@"
```

Or create a wrapper script in artifacts/bin/:
```bash
#!/bin/bash
sed -n '/^```python$/,/^```$/p' ~/mg/tool/toolname.md | sed '1d;$d' | python3 - "$@"
```

Make it executable and add to PATH. Done.

Example: cache.md (flatten/split markdown with reversible delimiters).

## Shell tools

Write a code block ```shell with your script.

Extract with sed:
```bash
sed -n '/^```shell$/,/^```$/p' ~/mg/tool/toolname.md | sed '1d;$d' | bash -s -- "$@"
```

Or create a wrapper script in artifacts/bin/:
```bash
#!/bin/bash
sed -n '/^```shell$/,/^```$/p' ~/mg/tool/toolname.md | sed '1d;$d' | bash -s -- "$@"
```

Examples: listener.md (file monitor), timer.md (deadline enforcer).

## running tools

Once wrapped and in PATH:
```bash
toolname arg1 arg2         # just run it
```

No installation framework needed. The wrapper extracts and executes.

## existing tools

**tool/cache.md** ⟜ flatten/split markdown files with smart defaults
**tool/md-to-pdf.md** ⟜ convert markdown to PDF via pandoc
**tool/pdf-to-md.md** ⟜ extract text from PDF
**tool/listener.md** ⟜ monitor directory for new files, ping a log
**tool/timer.md** ⟜ enforce worker deadlines, write timeout reports
**tool/python.md** ⟜ guide for Python card structure

All live in tool/. Read them for patterns.
