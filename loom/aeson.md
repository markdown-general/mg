# Card: aeson + Haskell JSONL Parsing

**Dependency**: `aeson` - JSON library for Haskell  
**Status**: Exploratory scripths experiments  
**Target**: Parse real Pi session files (`~/.pi/agent/sessions/*/session.jsonl`)

---

## Goal

Understand how aeson handles:
- Polymorphic entry types (session, message, compaction, label, custom)
- Lazy vs. strict parsing
- Error recovery (malformed lines)
- Streaming vs. static loading
- Type safety and FromJSON instances

Use a real session file to ground experiments in actual data shape.

---

## Questions to Answer

### 1. Entry Type Polymorphism
- How do we decode an entry when the type field determines the structure?
- Do we use a wrapper type with `FromJSON` discrimination?
- Can we use sum types effectively?

### 2. Performance
- Load entire session vs. streaming?
- Lazy ByteString vs. Strict?
- Parse once and cache vs. parse on-demand?

### 3. Error Handling
- What happens with malformed JSON lines?
- Skip? Fail? Log and continue?
- Version compatibility (session format changes)?

### 4. Type Definitions
- What should the Haskell types look like?
- How much structure vs. flexibility?
- Opaque Value for unknown fields?

---

## Experiments

### Experiment 1: Baseline Load

**Objective**: Load a real session file, print entry count and types

```haskell
-- cabal: build-depends: aeson, bytestring, text
import qualified Data.Aeson as A
import qualified Data.ByteString.Lazy as BL
import qualified Data.Aeson.Types as AT

data Entry = Entry { entryType :: String }
  deriving (Show, Generic)
  deriving anyclass (FromJSON)

main :: IO ()
main = do
  let sessionFile = "/Users/tonyday567/.pi/agent/sessions/--Users-tonyday567-repos-pi-mono--/2026-02-03T18-04-45-234Z_467948cf-b477-4628-95be-c1d52178f004.jsonl"
  content <- BL.readFile sessionFile
  let lines = BL.lines content
  let entries = mapMaybe (A.decode @Entry) lines
  putStrLn $ "Total entries: " ++ show (length entries)
  -- Print type distribution
```

**Expected output**: Entry count, type summary

---

### Experiment 2: Polymorphic Decoding

**Objective**: Decode entries with different structures

```haskell
-- cabal: build-depends: aeson, bytestring, text, vector
import Data.Aeson (FromJSON(..), Object, Value(..), object, (.:), (.:?))
import qualified Data.Aeson.Types as AT

data EntryType = SessionEntry | MessageEntry | CompactionEntry | OtherEntry String
  deriving (Show, Eq)

data Entry = Entry
  { eType :: EntryType
  , eId :: String
  , eParentId :: Maybe String
  , eTimestamp :: String
  , ePayload :: Value  -- Store rest as opaque JSON
  }

instance FromJSON Entry where
  parseJSON = withObject "Entry" $ \o -> do
    typeStr <- o .: "type"
    let eType = case typeStr of
          "session" -> SessionEntry
          "message" -> MessageEntry
          "compaction" -> CompactionEntry
          _ -> OtherEntry typeStr
    Entry
      <$> pure eType
      <*> o .: "id"
      <*> o .:? "parentId"
      <*> o .: "timestamp"
      <*> pure (Object o)

main :: IO ()
main = do
  let sessionFile = "..." 
  content <- BL.readFile sessionFile
  let entries = catMaybes $ map (A.decode @Entry) (BL.lines content)
  print $ take 5 entries
```

**Expected output**: First 5 entries with types decoded

---

### Experiment 3: Bidirectional Dictionary

**Objective**: Build a Map for fast lookup (Token clustering)

```haskell
-- cabal: build-depends: aeson, bytestring, text, containers, unordered-containers
import qualified Data.Map as M
import qualified Data.HashMap.Strict as HM
import Data.Text (Text, words, toLower)

-- Token is a common topic/word extracted from message content
type Token = Text
type TokenIndex = M.Map Token [EntryId]
type EntryId = String

-- Extract tokens from an entry
extractTokens :: Entry -> [Token]
extractTokens entry = case ePayload entry of
  Object o -> case HM.lookup "message" o of
    Just (Object msg) -> case HM.lookup "content" msg of
      Just (String text) -> map toLower $ Data.Text.words text
      _ -> []
    _ -> []
  _ -> []

-- Build index from all entries
buildTokenIndex :: [Entry] -> TokenIndex
buildTokenIndex entries = 
  foldr (\entry acc -> 
    let tokens = extractTokens entry
        entryId = eId entry
    in foldr (\token idx -> M.insertWith (++) token [entryId] idx) acc tokens
  ) M.empty entries

main :: IO ()
main = do
  let sessionFile = "..."
  content <- BL.readFile sessionFile
  let entries = catMaybes $ map (A.decode @Entry) (BL.lines content)
  let index = buildTokenIndex entries
  -- Print token distribution
  let topTokens = take 20 $ sortBy (comparing (negate . length . snd)) $ M.toList index
  mapM_ (\(token, ids) -> putStrLn $ show token ++ ": " ++ show (length ids) ++ " occurrences") topTokens
```

**Expected output**: Most common tokens and their entry counts

---

### Experiment 4: Streaming vs. Static

**Objective**: Compare memory usage and speed

```haskell
-- cabal: build-depends: aeson, bytestring, text, time
import Data.Time (getCurrentTime, diffUTCTime)

-- Static: Load entire file into memory
parseStatic :: FilePath -> IO [Entry]
parseStatic path = do
  content <- BL.readFile path
  pure $ catMaybes $ map (A.decode @Entry) (BL.lines content)

-- Streaming: Process line by line
parseStreaming :: FilePath -> IO ()
parseStreaming path = do
  withFile path ReadMode $ \handle -> do
    hSetBuffering handle (BlockBuffering (Just 8192))
    let go = do
          line <- hGetLine handle
          case A.decode @Entry (BL.fromStrict $ BS.pack line) of
            Just entry -> putStrLn ("Entry: " ++ eId entry) >> go
            Nothing -> go
    go `catch` \(_ :: IOError) -> pure ()

main :: IO ()
main = do
  let sessionFile = "..."
  
  -- Time static load
  t1 <- getCurrentTime
  entries <- parseStatic sessionFile
  t2 <- getCurrentTime
  putStrLn $ "Static load: " ++ show (diffUTCTime t2 t1) ++ ", entries: " ++ show (length entries)
  
  -- Time streaming
  t3 <- getCurrentTime
  parseStreaming sessionFile
  t4 <- getCurrentTime
  putStrLn $ "Streaming: " ++ show (diffUTCTime t4 t3)
```

**Expected output**: Timing comparison and observations

---

### Experiment 5: Error Recovery

**Objective**: Handle malformed entries gracefully

```haskell
-- cabal: build-depends: aeson, bytestring, text, vector
data DecodeResult = Success Entry | Failure String deriving (Show)

decodeLineWithRecovery :: String -> DecodeResult
decodeLineWithRecovery line = 
  case A.decode @Entry (BL.fromStrict $ BS.pack line) of
    Just entry -> Success entry
    Nothing -> Failure ("Failed to decode: " ++ take 100 line)

main :: IO ()
main = do
  let sessionFile = "..."
  content <- BL.readFile sessionFile
  let results = map (decodeLineWithRecovery . BS.unpack) (BL.lines content)
  let successes = [e | Success e <- results]
  let failures = [e | Failure e <- results]
  putStrLn $ "Parsed: " ++ show (length successes) ++ " / " ++ show (length results)
  mapM_ putStrLn $ take 5 failures
```

**Expected output**: Parse success rate, first 5 failures

---

## Real Session File

Using: `/Users/tonyday567/.pi/agent/sessions/--Users-tonyday567-repos-pi-mono--/2026-02-03T18-04-45-234Z_467948cf-b477-4628-95be-c1d52178f004.jsonl`

Sample entry from file:
```json
{"type":"message","id":"832a072f","parentId":"7d257d45","timestamp":"2026-02-03T18:06:20.725Z","message":{"role":"user","content":[{"type":"text","text":"hi"}],"timestamp":1770141980714}}
```

---

## Decisions Emerging

- **Static vs. Streaming**: Likely static for simplicity (agent-fork owns the session in memory)
- **Error Handling**: Fail fast? Log? Depends on use case
- **Type Definitions**: Need to preserve opaque JSON for extensibility
- **Token Index**: Useful for semantic search / context compression

---

## Next Move

Run the scripths experiments on the real session file, capture output, and update this card with findings.

