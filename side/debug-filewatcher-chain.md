debug-filewatcher-chain ⟜ diagnose prettychart-serve --watch empty response issue

Trace execution chain and probe at each phase to identify root cause. Diagnostic method: observe → log → hypothesize → test.

◊ ⊢ trace execution chain ⊣
  ⟜ SVG file created → watchDir detects → svgEvent filters → callback triggered → BL.readFile → TE.decodeUtf8 → send text → chartRef updated → handler renders HTML → browser response

⊢ add logging at each phase ⊣
  ⟜ putStrLn "EVENT: " + show e (callback triggered?)
  ⟜ putStrLn "SVG detected: " + svgPath (file reading?)
  ⟜ putStrLn "Read " + show bytes (decoding?)
  ⟜ putStrLn "send returned: " (response?)
  ⟜ curl -i http://localhost:9161 (HTTP valid?)

⊢ form hypothesis ⊣
  ⟜ suspected root cause: forever $ threadDelay loop blocking watchDir callback execution
  ⟜ each log reveals where execution stalls
  ⟜ pattern: missing async coordination between polling and events

⊢ test hypothesis ⊣
  ⟜ solution: run watchDir + forever in separate async threads
  ⟜ retest curl request
  ⟜ verify response appears at each log point
  ⟜ confirm browser renders updated HTML

◉ diagnostic method proven: trace → log → hypothesis → test
