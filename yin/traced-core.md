# traced-core analysis ⊙ compiledMarkupLexer

**Status:** Core dump examined. Loop extracted and analyzed.

## The Recursive Loop: `$wgo`

Located at line ~9020 in Lexer.dump-simpl.

**Signature:**
```haskell
$wgo :: ((Maybe (ByteString -> MarkupToken, Int, Int), OAccState),
         ((ByteClass, Int), MarkupCtx))
      -> Int# -> Addr# -> ForeignPtrContents -> Int# -> [MarkupToken]
```

**Arguments per iteration:**
- `s` = Composite heap tuple (nested pair of pairs) - **BOXED**
- `ww3` = Int# (byte position) - unboxed ✓
- `ww4` = Addr# (buffer pointer) - unboxed ✓
- `ww5` = ForeignPtrContents - **BOXED** (issue: must be carried every iteration)
- `ww6` = Int# (remaining bytes) - unboxed ✓

## Findings

### Loop Quality: **Good but sub-optimal**

✓ **Mealy machinery gone** - `withMealy` and `runMealyM` fully specialized away, not visible in loop

✓ **Mostly unboxed args** - ww3, ww4, ww6 are Int# and Addr#

✓ **No excessive allocations** - No wasteful let-bindings constructing tuples per iteration

❌ **State is composite heap tuple** - Not flattened into individual unboxed args. Each iteration:
```
case s of s1 { (ipv4, ipv5) ->
  case ipv5 of ipv9 -> ...
```
This is a heap indirection per byte, pattern-matching nested structure.

❌ **ForeignPtrContents passed boxed** - `ww5` is carried as a boxed value every iteration when it could be unpacked once at entry.

## Comparison

**vs runMarkupMealyBS:** Better - no Mealy overhead, cleaner state
**vs ideal tight loop:** Worse - state should be flattened into individual unboxed Int#/Addr# args, not composite heap tuple

## Recommendations

To reach ideal:
1. Flatten state components into individual loop arguments (one Int#/Addr# per field that's actually used)
2. Unpack ForeignPtrContents once at loop entry, carry only the Addr# of the actual data
3. Consider newtype wrapping to help GHC unpack the state tuple

## Evidence

Full Core dump: `dist-newstyle/build/aarch64-osx/ghc-9.14.1/traced-0.1.0.0/build/src/Lexer.dump-simpl`
Loop entry: line ~9006
