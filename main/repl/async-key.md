# async-repl-design ⟜ concrete rework with async/race

Key types from async library:

```haskell
race :: IO a -> IO b -> IO (Either a b)           -- Run two IO actions, return first to finish
waitCatch :: Async a -> IO (Either SomeException a) -- Wait for async, catch exceptions
poll :: Async a -> IO (Maybe a)                    -- Check if done without blocking
async :: IO a -> IO (Async a)                      -- Spawn concurrent action
wait :: Async a -> IO a                            -- Block until async completes
threadDelay :: Int -> IO ()                        -- Sleep (microseconds)
```

## new architecture

### Single input watcher (replaces inputThread)

```haskell
inputWatcher :: Handle -> IO ()
inputWatcher writeHandle = loop 0
  where
    loop linesSeen = forever $ do
      contents <- readFile "/tmp/ghci-in.txt"
      let currentLines = lines contents
      let newLines = drop linesSeen currentLines

      -- Write new queries to cabal repl stdin
      mapM_ (hPutStrLn writeHandle) newLines

      -- Wait for next batch of queries
      threadDelay 500000  -- 500ms (slower, less contention)
      loop (length currentLines)
```

### startRepl: spawn single watcher, no competing reads

```haskell
startRepl :: FilePath -> IO ProcessHandle
startRepl projectDir = do
  writeFile "/tmp/ghci-in.txt" ""
  writeFile "/tmp/ghci-out.txt" ""
  writeFile "/tmp/ghci-err.txt" ""

  (inReadHandle, inWriteHandle) <- createPipe
  outHandle <- openFile "/tmp/ghci-out.txt" WriteMode
  errHandle <- openFile "/tmp/ghci-err.txt" WriteMode

  hSetBuffering outHandle LineBuffering
  hSetBuffering errHandle LineBuffering
  hSetBuffering inWriteHandle LineBuffering

  -- Spawn single input watcher
  _ <- async (inputWatcher inWriteHandle)

  let procSpec = (shell "cabal repl")
        { cwd = Just projectDir
        , std_in = UseHandle inReadHandle
        , std_out = UseHandle outHandle
        , std_err = UseHandle errHandle
        }

  (_, _, _, ph) <- createProcess procSpec
  return ph
```

### queryRepl: use race for timeout, eliminate polling loop

```haskell
queryRepl :: String -> String -> IO (Maybe String)
queryRepl query expectPattern = do
  -- Get baseline
  outputBefore <- readFile "/tmp/ghci-out.txt"
  let linesBefore = length (lines outputBefore)

  -- Append query once (input watcher will see it)
  appendFile "/tmp/ghci-in.txt" (query ++ "\n")

  -- Race: timeout vs wait for output
  result <- race
    (threadDelay 3000000)  -- 3 second timeout
    (waitForPattern linesBefore expectPattern)

  case result of
    Left () -> return Nothing           -- timeout
    Right resp -> return (Just resp)    -- got response

-- Wait for pattern in output file (poll with timeout via race)
waitForPattern :: Int -> String -> IO String
waitForPattern linesBefore expectPattern = loop 0
  where
    loop attempts
      | attempts > 30 = fail "timeout in waitForPattern"  -- Should not happen (race handles timeout)
      | otherwise = do
          threadDelay 100000  -- 100ms poll
          output <- readFile "/tmp/ghci-out.txt"
          let newLines = drop linesBefore (lines output)
          case filter (expectPattern `isInfixOf`) newLines of
            [] -> loop (attempts + 1)
            matches -> return (unlines matches)
```

## improvements over current

| Metric | Current | New |
|--------|---------|-----|
| Input file readers | 2 (inputThread + appendFile) | 1 (inputWatcher only) |
| Polling frequency | 50ms every 50ms | 500ms, plus race timeout |
| File reads/query | 60+ | ~30 (race terminates early when pattern found) |
| Contention points | 2 (input + output files) | 1 (output file only) |
| Timeout handling | Manual polling loop | `race` primitive |
| Exception handling | None | `waitCatch` can be added |

## benefits

1. **Single reader**: inputWatcher owns all input file reads, no contention
2. **Composable**: race/waitCatch are high-level, no manual thread management
3. **Lazy**: queryRepl doesn't spawn threads; it just uses async helpers
4. **Timeout safety**: race guarantees 3-second max wait, no infinite loops
5. **Scales**: Can add more queries concurrently with minimal overhead

## next

1. Implement this design
2. Build and test with test-repl
3. Measure: count actual file operations, verify polling drops
