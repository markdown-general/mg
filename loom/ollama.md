# Card: ollama-haskell

**Status**: Exploration, not tested yet  
**Goal**: Understand if we can use ollama-haskell as LLM backend

---

## Entry Point

```haskell
import Ollama

main :: IO ()
main = do
  let ops = defaultChatOps
        { modelName = "mistral"
        , messages = fromList [userMessage "What is 2+2?"]
        }
  result <- chat ops Nothing
  print result
```

**Requirements**: 
- `ollama serve` running locally
- Model pulled: `ollama pull mistral`

---

## What ollama-haskell Exports

From `/tmp/ollama-haskell-0.2.1.0/src/Ollama.hs`:

```haskell
chat :: ChatOps -> Maybe OllamaConfig -> IO (Either OllamaError ChatResponse)
generate :: GenerateOps -> Maybe OllamaConfig -> IO (Either OllamaError GenerateResponse)
embedding :: EmbeddingOps -> Maybe OllamaConfig -> IO (Either OllamaError EmbeddingResp)
```

Response type:
```haskell
data ChatResponse = ChatResponse
  { message :: Maybe Message
  , model :: Text
  , done :: Bool
  , ... other fields
  }
```

---

## Questions to Answer (via experiments)

1. Does `ChatResponse.message` map directly to our JSONL `Message` type?
2. How do we handle tool calls (if models support them)?
3. What's the latency / throughput?

---

## Next Step

Run an experiment. Actually call `chat`. See what comes back.
