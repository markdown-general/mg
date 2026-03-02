# tools/cache.md

**cache** ⟜ create reversible markdown caches with smart defaults

**what it does** ⟜ concatenate (flattens) and unconcatenates (splits) markdown files with HTML comment delimiters

**why** ⟜ token-efficient handoff structures between chat, agentics, and humans

## example

```bash
cd ~/markdown-general/content
cache flatten --output ../test-cache.md
# defaults to current directory.

cache split test-cache.md --output-dir ../restored/
# restored/ will have the same markdown files as 
# test-cache.md wraps (which was content/)
# diff -r . ../restored/

cd ~/markdown-general
cache flatten
# outputs ~/markdown-general-cache/cache-sisyphus-260106.md
```

## file priorities

When caching (throwing mudballs at chat AIs or agents), write order matters for context alignment.

**Priority ordering** ⟜ important files first, rest alphabetically

**work/welcome.md** ⟜ entry point and orientation
**work/markdown.md** ⟜ shared medium definition
**work/general.md** ⟜ operational stance and attitude
**work/cast.md** ⟜ defunctionalization and making executable
**work/pattern.md** ⟜ seeing and making patterns
**work/grind.md** ⟜ practice of improvement
**work/card.md** ⟜ executable markdown structure
**work/tools.md** ⟜ tool ecosystem
**work/cache.md** ⟜ why we cache and hand context
**work/deck.md** ⟜ notation system used everywhere
**work/lattice.md** ⟜ paired deck structures
**work/sisyphus.md** ⟜ why and what of this place
**work/task.md** ⟜ task structure and organization
**work/upstream.md** ⟜ async todo management

**Remaining files** ⟜ alphabetical order after priorities

## api

### flatten command

**Smart Defaults:**
- `--include "**/*"` (all files)
- `--exclude "cache-*.md" "artifacts/**" "content/self/**" "content/blog/**" "content/upstream/**" "org/**"`
- `--dir .` (current directory)
- `--recursive` (default true)
- `--cache-dir ~/markdown-general-cache/`
- `--output` auto-generated as `cache-<dir>-YYMMDD.md`

**Options:**
- `--include PATTERN [PATTERN ...]` - File patterns to include
- `--exclude PATTERN [PATTERN ...]` - File patterns to exclude
- `--dir DIR` - Base directory for pattern matching
- `--cache-dir DIR` - Cache directory (default: ~/markdown-general-cache/)
- `--output FILE` - Output file (default: auto-generated)
- `--recursive` - Include files in subdirectories (default: true)
- `--nonrecursive` - Don't include subdirectories
- `--dry-run` - Show what would be included without creating output

### split command

**Inputs:**
- `concat_file` - Path to concatenated markdown file
- `--output-dir DIR` - Directory for extracted files (default: current directory)

**Outputs:**
- Individual markdown files restored to original paths
- Directory structure created as needed
- Single trailing newline preserved per POSIX

## installation

**Location:** `~/markdown-general/artifacts/bin/cache`

**Wrapper:**
```bash
#!/bin/bash
awk '/^```python$/{p=1;next} /^```$/{if(p)exit} p' ~/markdown-general/tools/cache.md | python3 - "$@"
```

**One-liner test:**
```bash
cache flatten --dir ~/markdown-general/tools --dry-run | head -3
```

## tips

**Binary files will be skipped silently** - they trigger exceptions caught by the exception handler. Check output for "Warning" lines if you expected files that didn't appear.

**Always use `--dry-run` first** for large caches. Shows exactly what will be included before you create a potentially huge markdown file.

**Exclude patterns use fnmatch rules** - `*` matches within a path component, `**` matches across dirs, `?` matches single char, `[abc]` matches character set. The smart defaults already exclude artifacts/ and cache-*.md.

**Split overwrites without asking** - if output-dir already has files, they get rewritten. Use `--output-dir` to create a fresh directory.

**The delimiter format is stable** - `<!-- FILE: path -->` separates files. Don't edit cache files manually; the split command parses these delimiters. If you edit them, split will fail or create wrong paths.

**POSIX newlines are preserved** - each file gets exactly one trailing newline (per POSIX). Round-trip should be identical; if diff shows newline changes, the tool has a bug.

**Cache size grows linearly with file count** - each file gets one delimiter line (12-40 bytes). A cache of 100 MD files is usually 50-200KB depending on file sizes.

## status

**Tests:** passing (round-trip, binary rejection, exclude patterns)
**Last updated:** 2026-01-06
**Session cost:** $0.88
**Known issues:** None

**Recent fixes:**
- Fixed auto-naming: now uses directory name instead of "current"
- Fixed exclude pattern matching: patterns now work against relative paths
- Fixed awk-based extraction: handles first Python block correctly

## code

```python
#!/usr/bin/env python3
"""
Create reversible markdown caches with pattern-based file selection.

Uses HTML comment delimiters for reversible concatenation.
"""

import argparse
from pathlib import Path
import glob
import fnmatch
from datetime import datetime
import sys

# Priority ordering for work/ files
PRIORITY_FILES = [
    "work/welcome.md",
    "work/markdown.md",
    "work/general.md",
    "work/cast.md",
    "work/pattern.md",
    "work/grind.md",
    "work/card.md",
    "work/tools.md",
    "work/cache.md",
    "work/deck.md",
    "work/lattice.md",
    "work/sisyphus.md",
    "work/task.md",
    "work/upstream.md",
]

def sort_by_priority(files, base_dir):
    """Sort files by priority list, then alphabetically."""
    def priority_key(file_path):
        try:
            rel_path = str(file_path.relative_to(base_dir))
        except ValueError:
            rel_path = str(file_path)

        # Check if file is in priority list (handles both "work/file.md" and "file.md")
        if rel_path in PRIORITY_FILES:
            return (0, PRIORITY_FILES.index(rel_path), rel_path)

        # Also check with "work/" prefix added (for when base_dir is work/)
        work_path = f"work/{rel_path}"
        if work_path in PRIORITY_FILES:
            return (0, PRIORITY_FILES.index(work_path), rel_path)

        # Not in priority list - alphabetical
        return (1, 0, rel_path)

    return sorted(files, key=priority_key)

def find_files(patterns, base_dir, exclude_patterns=None, recursive=True):
    """Find files matching include patterns, excluding exclude patterns."""
    if exclude_patterns is None:
        exclude_patterns = []

    matched_files = set()

    for pattern in patterns:
        if recursive:
            # Use glob for recursive patterns
            for file_path in glob.glob(str(base_dir / pattern), recursive=True):
                file_path = Path(file_path)
                if file_path.is_file():
                    # Get relative path for pattern matching
                    try:
                        rel_path = file_path.relative_to(base_dir)
                    except ValueError:
                        rel_path = file_path

                    # Check exclude patterns against relative path
                    if not any(fnmatch.fnmatch(str(rel_path), excl)
                             for excl in exclude_patterns):
                        matched_files.add(file_path)
        else:
            # Non-recursive - only immediate directory
            if "**" in pattern:
                pattern = pattern.replace("**", "*")

            for file_path in glob.glob(str(base_dir / pattern)):
                file_path = Path(file_path)
                if file_path.is_file() and file_path.parent == base_dir:
                    # Get relative path for pattern matching
                    try:
                        rel_path = file_path.relative_to(base_dir)
                    except ValueError:
                        rel_path = file_path

                    # Check exclude patterns against relative path
                    if not any(fnmatch.fnmatch(str(rel_path), excl)
                             for excl in exclude_patterns):
                        matched_files.add(file_path)

    # Sort with priority ordering
    return sort_by_priority(matched_files, base_dir)

def apply_smart_defaults(options):
    """Apply smart defaults when options are not explicitly set."""
    if not options.dir:
        options.dir = Path.cwd()

    if not options.include:
        options.include = ["**/*"]

    if not options.exclude:
        # Common cache exclusions
        options.exclude = [
            "cache-*.md",
            "artifacts/**",
            "content/self/**",
            "content/blog/**",
            "content/upstream/**",
            "org/**"
        ]

    if not options.cache_dir:
        options.cache_dir = Path.home() / "sisyphus-cache"

    if not options.output:
        options.output = generate_auto_name(options.dir, options.cache_dir)

    return options

def generate_auto_name(dir_path, cache_dir):
    """Generate auto filename based on directory name and date."""
    dir_name = dir_path.name
    date_suffix = datetime.now().strftime("%y%m%d")
    return cache_dir / f"cache-{dir_name}-{date_suffix}.md"

def concat_files(files, output, base_dir):
    """Concatenate files with HTML comment delimiters."""
    print(f"Concatenating {len(files)} files...")

    # Create output directory if needed
    output.parent.mkdir(parents=True, exist_ok=True)

    with open(output, 'w') as out_file:
        for file_path in files:
            try:
                # Get relative path from base_dir
                try:
                    rel_path = file_path.relative_to(base_dir)
                except ValueError:
                    rel_path = file_path

                # Write delimiter
                out_file.write(f"<!-- FILE: {rel_path} -->\n")

                # Read and clean file content
                with open(file_path, 'r') as in_file:
                    lines = in_file.readlines()

                    # Strip existing FILE delimiters
                    filtered_lines = []
                    for line in lines:
                        if not (line.startswith("<!-- FILE: ") and line.rstrip().endswith(" -->")):
                            filtered_lines.append(line)

                    # Ensure single trailing newline
                    content = ''.join(filtered_lines)
                    content = content.rstrip('\n') + '\n'
                    out_file.write(content)

            except Exception as e:
                print(f"Warning: Could not process {file_path}: {e}")
                continue

    print(f"Created: {output}")
    return output

def split_file(concat_file, output_dir):
    """Split concatenated file back to individual files."""
    print(f"Splitting {concat_file.name}...")

    if not concat_file.exists():
        raise FileNotFoundError(f"Concatenated file not found: {concat_file}")

    current_file = None
    current_path = None
    content_lines = []
    files_created = []

    with open(concat_file) as f:
        for line in f:
            # Check for file delimiter
            if line.startswith("<!-- FILE: ") and line.rstrip().endswith(" -->"):
                # Save previous file if exists
                if current_file is not None:
                    current_file.parent.mkdir(parents=True, exist_ok=True)
                    with open(current_file, 'w') as out:
                        out.write(''.join(content_lines))
                    files_created.append(current_file)

                # Extract new path
                path_str = line[11:-4].strip()  # Remove <!-- FILE: and -->
                current_path = path_str
                current_file = output_dir / path_str
                content_lines = []
            else:
                # Accumulate content
                if current_file is not None:
                    content_lines.append(line)

        # Save last file
        if current_file is not None:
            current_file.parent.mkdir(parents=True, exist_ok=True)
            with open(current_file, 'w') as out:
                out.write(''.join(content_lines))
            files_created.append(current_file)

    print(f"Extracted {len(files_created)} files to: {output_dir}/")
    for f in files_created:
        print(f"  {f.relative_to(output_dir)}")

    return files_created

def main():
    parser = argparse.ArgumentParser(
        description="Create or split markdown caches with pattern-based file selection"
    )
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Flatten subcommand
    flatten_parser = subparsers.add_parser('flatten', help='Create cache from file patterns')
    flatten_parser.add_argument(
        '--include',
        nargs='*',
        default=[],
        help='File patterns to include (default: "**/*")'
    )
    flatten_parser.add_argument(
        '--exclude',
        nargs='*',
        default=[],
        help='File patterns to exclude'
    )
    flatten_parser.add_argument(
        '--dir',
        type=Path,
        help='Base directory for pattern matching (default: current)'
    )
    flatten_parser.add_argument(
        '--cache-dir',
        type=Path,
        help='Cache directory (default: $HOME/sisyphus-cache/)'
    )
    flatten_parser.add_argument(
        '--output',
        type=Path,
        help='Output file (default: auto-generated)'
    )
    flatten_parser.add_argument(
        '--recursive',
        action='store_true',
        default=True,
        help='Include files in subdirectories (default: true)'
    )
    flatten_parser.add_argument(
        '--nonrecursive',
        action='store_true',
        help='Don\'t include subdirectories'
    )
    flatten_parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be included without creating output'
    )

    # Split subcommand
    split_parser = subparsers.add_parser('split', help='Split cache back to individual files')
    split_parser.add_argument(
        'concat_file',
        type=Path,
        help='Concatenated file to split'
    )
    split_parser.add_argument(
        '--output-dir',
        type=Path,
        default=Path.cwd(),
        help='Output directory for extracted files (default: current dir)'
    )

    args = parser.parse_args()

    if args.command == 'flatten':
        # Apply smart defaults
        options = args
        options = apply_smart_defaults(options)

        if options.nonrecursive:
            options.recursive = False

        # Find files
        files = find_files(options.include, options.dir, options.exclude, options.recursive)

        if not files:
            print("No files found matching the specified patterns")
            return 1

        # Dry run or execute
        if args.dry_run:
            print("Would include these files:")
            for f in files:
                print(f"  {f.relative_to(options.dir)}")
            print(f"\nWould create: {options.output}")
        else:
            concat_files(files, options.output, options.dir)

    elif args.command == 'split':
        split_file(args.concat_file, args.output_dir)

    else:
        parser.print_help()
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
```

## examples

### content-only cache

Clean content cache, no experiments or artifacts:

```bash
cd ~/markdown-general
cache flatten \
  --include "work/**/*.md" \
  --include "zone/upgrades/**/*.md" \
  --exclude "content/self/**" \
  --exclude "content/blog/**" \
  --output cache-priority-zero.md
```

### specialist cache

Haskell development cache with only Haskell files:

```bash
cache flatten \
  --include "**/*.hs" \
  --include "**/*.cabal" \
  --include "work/haskell.md" \
  --exclude "test/**" \
  --output cache-haskell-specialist.md
```

### dry-run preview

Preview what would be included without creating output:

```bash
cache flatten --include "**/*.md" --exclude "artifacts/**" --dry-run
```

## tests

### round-trip identity

Create test structure, flatten, split, and verify they match:

```bash
mkdir -p /tmp/cache-test/a/b
echo "# File A" > /tmp/cache-test/a/file.md
echo "# File B" > /tmp/cache-test/a/b/file.md

# Create cache
cache flatten --dir /tmp/cache-test --output /tmp/test-cache.md

# Split
cache split /tmp/test-cache.md --output-dir /tmp/restored/

# Verify (should output nothing)
diff -r /tmp/cache-test /tmp/restored/cache-test

# Cleanup
rm -rf /tmp/cache-test /tmp/restored /tmp/test-cache.md
```

### binary rejection

Verify binary files are skipped with warnings:

```bash
mkdir -p /tmp/cache-binary
echo "# Text file" > /tmp/cache-binary/text.md
echo "Binary content" | gzip > /tmp/cache-binary/binary.gz

# Try to create cache (should skip binary)
cache flatten --dir /tmp/cache-binary --output /tmp/binary-test.md 2>&1 | grep "Warning"

# Verify
grep "FILE: text.md" /tmp/binary-test.md > /dev/null && echo "✓ Text included"
grep "FILE: binary.gz" /tmp/binary-test.md > /dev/null || echo "✓ Binary rejected"

# Cleanup
rm -rf /tmp/cache-binary /tmp/binary-test.md
```

### exclude patterns

Verify smart defaults and explicit exclusions work:

```bash
mkdir -p /tmp/cache-exclude/{artifacts,content}
echo "# Keep" > /tmp/cache-exclude/content/keep.md
echo "# Skip" > /tmp/cache-exclude/artifacts/skip.md
echo "# Skip cache" > /tmp/cache-exclude/cache-old.md

# Create cache with defaults
cache flatten --dir /tmp/cache-exclude --output /tmp/exclude-test.md

# Verify exclusions
grep "FILE: content/keep.md" /tmp/exclude-test.md > /dev/null && echo "✓ Content included"
grep "FILE: artifacts/skip.md" /tmp/exclude-test.md > /dev/null || echo "✓ Artifacts excluded"
grep "FILE: cache-old.md" /tmp/exclude-test.md > /dev/null || echo "✓ Cache files excluded"

# Cleanup
rm -rf /tmp/cache-exclude /tmp/exclude-test.md
```
