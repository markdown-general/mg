# Huihua UTF-8 glyphP Debug Card

## Context
After UTF-8 fixes to glyphP in Parse.hs, doctests still fail with "leftovers" error. Need to trace through the parsing pipeline to identify where glyphP matching breaks down.

## Setup (run once)
```
:set -XOverloadedStrings
import Huihua.Array as A
import Harpie.Array as D
import Prettyprinter
import Huihua.Parse
import Data.ByteString.Char8 qualified as C
import Data.List qualified as List
import Huihua.Parse.FlatParse
import Data.Function ((&))
:set -Wno-type-defaults
```

## Debug Steps

### Step 1: Isolate test input
```
let bs = "◌1 2"
```

### Step 2: Check what the ByteString actually contains
```
bs
C.lines bs
```

### Step 3: Test tokens parser layer
```
C.lines bs & fmap (runParser tokens)
```

### Step 4: Test glyphP directly with various inputs

```
runParser glyphP "◌1 2"
runParser glyphP "◌"
runParser glyphP "\342\227\214"
runParser glyphP "\342\227\214\&1 2"
```

### Step 5: Test what glyphP DOES match (sanity check)
```
runParser glyphP "."
runParser glyphP ","
runParser glyphP "+"
runParser glyphP "-"
```

### Step 6: Full run attempt
```
run "◌1 2"
```

### Step 7: Test if tokenization is the issue - try simpler valid expressions
```
run "."
run "+"
run "1"
```

## Expected vs Actual

**Expected:**
- glyphP should match "◌" and return `OK Pop "1 2"` (with leftovers)
- Or tokens should handle multiple tokens per line

**Actual:**
- glyphP returns `Fail` on "◌"
- tokens on C.lines bs returns `[OK [] "\204\&1 2"]` (consumed nothing)

## Hypothesis to test
- C.lines is splitting UTF-8 characters incorrectly (truncating to first byte)
- glyphP's UTF-8 octal sequences don't match how FlatParse's switch handles them
- The expression syntax requires whitespace or separator between "◌" and "1"

## Card execution
Print full output of each section and save transcript.
