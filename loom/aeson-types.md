# aeson: Session Entry Types

**Status**: Working out polymorphic entry decoding.

---

## Current State

**Real session file**: 141 entries, 303KB

**Entry types discovered** (from jq inspection):
- session (header)
- thinking_level_change
- model_change  
- message (user, assistant, tool responses)

**Key challenge**: Entries are polymorphic. Different `"type"` means different structure.

**Immediate question**: How do we discriminate on type field and decode accordingly?

---

## Haskell Types to Test

Run in `cabal repl` from ~/haskell/agent-fork:

```haskell
import qualified Data.Aeson as A
import qualified Data.Aeson.Types as AT
import qualified Data.ByteString.Lazy as BL
import Data.Aeson (Object, Value(..), withObject, (.:), (.:?))
import Data.Maybe (catMaybes, mapMaybe)
import Data.Text (Text)

-- Discriminated union
data Entry
  = SessionEntry
      { sesId :: String
      , sesVersion :: Int
      , sesTimestamp :: String
      , sesCwd :: String
      }
  | ThinkingLevelEntry
      { thinkId :: String
      , thinkParentId :: Maybe String
      , thinkLevel :: String
      }
  | ModelChangeEntry
      { modelId :: String
      , modelParentId :: Maybe String
      , modelProvider :: String
      , modelModelId :: String
      }
  | MessageEntry
      { msgId :: String
      , msgParentId :: Maybe String
      , msgContent :: Object
      }
  | UnknownEntry Value
  deriving (Show)

-- Decoder: read JSON value, look at "type" field, decode accordingly
decodeEntry :: Value -> Either String Entry
decodeEntry val = case val of
  Object obj -> do
    typeStr <- AT.fromJSON (Object obj) >>= \case
      A.String t -> pure t
      _ -> Left "no type field"
    case typeStr of
      "session" -> -- decode session entry
        SessionEntry
          <$> (obj A..: "id")
          <*> (obj A..: "version")
          <*> (obj A..: "timestamp")
          <*> (obj A..: "cwd")
      "thinking_level_change" -> 
        ThinkingLevelEntry
          <$> (obj A..: "id")
          <*> (obj A..:? "parentId")
          <*> (obj A..: "thinkingLevel")
      "model_change" ->
        ModelChangeEntry
          <$> (obj A..: "id")
          <*> (obj A..:? "parentId")
          <*> (obj A..: "provider")
          <*> (obj A..: "modelId")
      "message" ->
        MessageEntry
          <$> (obj A..: "id")
          <*> (obj A..:? "parentId")
          <*> (obj A..: "message")
      _ -> pure (UnknownEntry val)
  _ -> Left "not an object"
```

---

## Test It

```haskell
-- Load file
let sessionFile = "/Users/tonyday567/.pi/agent/sessions/--Users-tonyday567-repos-pi-mono--/2026-02-03T18-04-45-234Z_467948cf-b477-4628-95be-c1d52178f004.jsonl"
content <- BL.readFile sessionFile

-- Split lines
let lineList = BL.split 10 content

-- Decode each line as JSON
let jsonLines = mapMaybe (A.decode @Value) lineList

-- Try to decode as Entry
let entries = map decodeEntry jsonLines

-- How many succeeded?
let successes = length (filter (\e -> case e of Right _ -> True; _ -> False) entries)
putStrLn $ "Decoded: " ++ show successes ++ " / " ++ show (length entries)

-- Show first few
print (take 5 entries)
```

---

## Issue to Fix

The decoder has type errors. Need to:
1. Actually use `AT.parseJSON` or `AT.withObject` properly
2. Check syntax on `obj A..: "field"` (wrong operator)
3. Handle `Maybe` fields correctly

**What does the working pattern look like?**
