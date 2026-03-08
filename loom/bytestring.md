# Card: bytestring - Memory-Efficient I/O

**Dependency**: `bytestring` - Efficient byte sequences  
**Status**: Exploratory scripths experiments  
**Target**: Understand lazy vs. strict for session file I/O

---

## Goal

Understand:
- Lazy vs. Strict ByteString trade-offs
- Performance on large session files
- Memory consumption
- Integration with aeson
- Best practices for JSONL reading

---

## Questions to Answer

### 1. Lazy vs. Strict ByteString
- When should we use each?
- What's the memory overhead?
- How does aeson interact with each?

### 2. File I/O Patterns
- `readFile` (lazy) vs. `readFile'` (strict)?
- What about chunked reading?
- How large can a session file get?

### 3. Performance
- Time to load 1MB, 10MB, 100MB files?
- Peak memory usage?
- Streaming line-by-line vs. bulk load?

### 4. Interactions with aeson
- Does lazy vs. strict matter for JSON decoding?
- Any performance implications?
- What about aeson's internal buffering?

---

## Experiments

### Experiment 1: Load Performance Comparison

**Objective**: Compare lazy vs. strict on real session file

```haskell
-- cabal: build-depends: bytestring, deepseq, filepath, time
import qualified Data.ByteString as BS
import qualified Data.ByteString.Lazy as BL
import System.Mem (performGC)
import Data.Time (getCurrentTime, diffUTCTime)
import Control.DeepSeq (force)

main :: IO ()
main = do
  let sessionFile = "/Users/tonyday567/.pi/agent/sessions/--Users-tonyday567-repos-pi-mono--/2026-02-03T18-04-45-234Z_467948cf-b477-4628-95be-c1d52178f004.jsonl"
  
  -- Measure lazy read
  performGC
  t1 <- getCurrentTime
  lazyContent <- BL.readFile sessionFile
  let lazyLen = BL.length lazyContent
  t2 <- getCurrentTime
  
  -- Measure strict read
  performGC
  t3 <- getCurrentTime
  strictContent <- BS.readFile sessionFile
  let strictLen = BS.length strictContent
  t4 <- getCurrentTime
  
  putStrLn $ "Lazy read: " ++ show (diffUTCTime t2 t1)
  putStrLn $ "Lazy length: " ++ show lazyLen
  putStrLn $ "Strict read: " ++ show (diffUTCTime t4 t3)
  putStrLn $ "Strict length: " ++ show strictLen
```

**Expected output**: Timing and size comparisons

---

### Experiment 2: Line Splitting Performance

**Objective**: Compare different line-splitting strategies

```haskell
-- cabal: build-depends: bytestring, deepseq, time
import qualified Data.ByteString as BS
import qualified Data.ByteString.Lazy as BL
import Data.Time (getCurrentTime, diffUTCTime)

-- Method 1: Lazy ByteString lines
lazyLines :: FilePath -> IO Int
lazyLines path = do
  content <- BL.readFile path
  let lineCount = length (BL.lines content)
  pure lineCount

-- Method 2: Strict ByteString lines
strictLines :: FilePath -> IO Int
strictLines path = do
  content <- BS.readFile path
  let lineCount = length (BS.lines content)
  pure lineCount

-- Method 3: Chunked reading (8KB chunks)
chunkedLines :: FilePath -> IO Int
chunkedLines path = do
  withFile path ReadMode $ \h -> do
    hSetBuffering h (BlockBuffering (Just 8192))
    go h 0 ""
  where
    go h count buffer = do
      eof <- hIsEOF h
      if eof then pure count else do
        chunk <- BS.hGetSome h 8192
        let (completeLines, incomplete) = splitLines (buffer <> chunk)
        go h (count + length completeLines) incomplete

splitLines :: BS.ByteString -> ([BS.ByteString], BS.ByteString)
splitLines bs = 
  let (lines, lastLine) = case BS.split 10 bs of  -- 10 = '\n'
        [] -> ([], "")
        (h:t) -> (h:init t, last (h:t))
  in (lines, lastLine)

main :: IO ()
main = do
  let sessionFile = "..."
  
  t1 <- getCurrentTime
  lazyCount <- lazyLines sessionFile
  t2 <- getCurrentTime
  
  t3 <- getCurrentTime
  strictCount <- strictLines sessionFile
  t4 <- getCurrentTime
  
  t5 <- getCurrentTime
  chunkedCount <- chunkedLines sessionFile
  t6 <- getCurrentTime
  
  putStrLn $ "Lazy lines (" ++ show lazyCount ++ "): " ++ show (diffUTCTime t2 t1)
  putStrLn $ "Strict lines (" ++ show strictCount ++ "): " ++ show (diffUTCTime t4 t3)
  putStrLn $ "Chunked lines (" ++ show chunkedCount ++ "): " ++ show (diffUTCTime t6 t5)
```

**Expected output**: Line count and timing for each method

---

### Experiment 3: Memory Profiling

**Objective**: Measure peak memory for different approaches

```haskell
-- cabal: build-depends: bytestring, containers
-- cabal: ghc-options: -with-rtsopts=-s
import qualified Data.ByteString.Lazy as BL
import qualified Data.ByteString as BS
import qualified Data.Map as M
import System.Environment (getEnv)

-- Approach 1: Lazy load + parse (streaming semantics)
approach1 :: FilePath -> IO ()
approach1 path = do
  content <- BL.readFile path
  let parsed = map parseEntry (BL.lines content)
  let indexed = M.fromList [(i, e) | (i, e) <- zip [1..] parsed]
  putStrLn $ "Approach 1: " ++ show (M.size indexed) ++ " entries"

-- Approach 2: Strict load + parse (eager)
approach2 :: FilePath -> IO ()
approach2 path = do
  content <- BS.readFile path
  let parsed = map parseEntry (BS.lines content)
  let indexed = M.fromList [(i, e) | (i, e) <- zip [1..] parsed]
  putStrLn $ "Approach 2: " ++ show (M.size indexed) ++ " entries"

parseEntry :: BS.ByteString -> String
parseEntry bs = take 50 (BS.unpack bs)

main :: IO ()
main = do
  let sessionFile = "..."
  putStrLn "Approach 1 (lazy):"
  approach1 sessionFile
  putStrLn "\nApproach 2 (strict):"
  approach2 sessionFile
```

Run with: `+RTS -s` to see memory stats

---

### Experiment 4: Aeson Integration

**Objective**: Understand aeson's buffering with ByteString variants

```haskell
-- cabal: build-depends: bytestring, aeson
import qualified Data.Aeson as A
import qualified Data.ByteString as BS
import qualified Data.ByteString.Lazy as BL

data SimpleEntry = SimpleEntry { id :: String } deriving (Generic, FromJSON, Show)

-- Method 1: Lazy ByteString to aeson
lazyDecode :: BL.ByteString -> Maybe SimpleEntry
lazyDecode = A.decode

-- Method 2: Strict ByteString to aeson (requires conversion)
strictDecode :: BS.ByteString -> Maybe SimpleEntry
strictDecode = A.decode . BL.fromStrict

-- Method 3: Direct line parsing
parseLines :: FilePath -> IO [SimpleEntry]
parseLines path = do
  content <- BS.readFile path
  let decoded = catMaybes $ map (A.decode . BL.fromStrict) (BS.lines content)
  pure decoded

main :: IO ()
main = do
  let sessionFile = "..."
  entries <- parseLines sessionFile
  putStrLn $ "Parsed: " ++ show (length entries) ++ " entries"
```

**Expected output**: Entry count, any decoding issues

---

### Experiment 5: Large File Handling

**Objective**: How does bytestring scale to 100MB+ files?

```haskell
-- cabal: build-depends: bytestring, bytestring-to-vector
import qualified Data.ByteString.Lazy as BL
import qualified Data.Vector.Unboxed as V

lazySize :: FilePath -> IO Int
lazySize path = do
  content <- BL.readFile path
  pure $ BL.length content

lineCount :: FilePath -> IO Int
lineCount path = do
  content <- BL.readFile path
  pure $ length (BL.lines content)

main :: IO ()
main = do
  let sessionFile = "..."
  size <- lazySize sessionFile
  lines <- lineCount sessionFile
  putStrLn $ "File size: " ++ show size ++ " bytes"
  putStrLn $ "Lines: " ++ show lines
  putStrLn $ "Average line: " ++ show (fromIntegral size / fromIntegral lines) ++ " bytes"
```

**Expected output**: File stats

---

## Real Data Points

Session file: `/Users/tonyday567/.pi/agent/sessions/--Users-tonyday567-repos-pi-mono--/2026-02-03T18-04-45-234Z_467948cf-b477-4628-95be-c1d52178f004.jsonl`

Baseline: 
```bash
$ ls -lh <session_file>
# Expected: ?K to ?MB
$ wc -l <session_file>
# Expected: 10-100+ entries
```

---

## Emerging Patterns

- **For JSONL**: Lazy probably fine (streaming semantics match well)
- **Large files**: Chunked I/O to manage memory
- **Aeson integration**: Lazy and strict both work; lazy more natural for aeson
- **agent-fork**: Likely load once, cache, use strict internally

---

## Next Move

Run experiments, capture actual timings, update card with results.

