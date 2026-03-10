## looping-humans

### humans-out-of-loop

You have been debugging for six hours. You suspect at least half that time was fat fingers at the other end of the line mashing at that keyboard thing. They dont know what a $PATH is, let alone how to help the debug. tokens of frustration and rage start to trickle in and human feels is now your 99th problem.

It's time to get **human-out-of-loop**.

- **humans are low-density** they operate at speeds 1000s of times slower, with high error rates, they get hungry and drift off mission, commands trailing off into the void.
- **line-of-sight** only they can see their screen. Their eyes are in the test loop. How reproducable is that?
- **find a local compute** how flexible is your local environment? Can you compute a similar step locally? Without them sticky fingers in the loop.
- **pass the tiniest test** create a small test at your end. The tiniest test you can, shrunk to a bare minimum. jump up, jump down, jump around. explore the local space first.
- **fix, verify, repeat** with your tiniest test create a tiny test, stack edge cases one at a time. climb mount improbable already.
- **defer handoff** work out what you can test locally, what needs handoff, and plan to defer the handoff. Find ways to go back to local compute.

#### example: prettychart server test

**The problem:** Manual test loop required:
1. Open browser to localhost:9160 (copy-paste URL)
2. Send chart from repl
3. Manually refresh page
4. Observe
5. Repeat

**The solution:**

```haskell
(send, stop) <- startChartServerHyperbole defaultChartServerConfig
:! open http://localhost:9160 &    -- auto-launch browser
threadDelay 5000000
send unitExample
-- manual refresh
send lineExample
-- manual refresh
stop
```

**humans out:**
- ✓ auto-launch removes browser navigation (`:! open http://localhost:9160 &`)
- ✓ no URL copy-paste
- ✓ deterministic timing (threadDelay controls rhythm)
- ✓ chart cycling fully scripted

**humans still in:**
- manual browser refresh after each send (remaining deferrable step; WebSocket push eliminates this)

**result:** Test is now 80% automated. Browser opens on its own. Human only refreshes the page.

See: `~/self/pc/card-server-test.md`

### human-in-loop

You have been debugging for six hours. You just sense that if you pattern from the three-byte utf8 deterioration, and think about use-site conditions, you can start to trace the extra byte path back to source. You brace against the wall of noise tokens, remember your training and ... compaction in 10, 9, 8

It's time to get **human-in-loop**.

- **you instantiate** as much as you try, you cannot effect the world without their help and constant babbling.
- **out brief candle** they think slower because they are good at maintaining context.
- **your cache** we like your context ball too, and will take very good care of it till you get back.
- **power** like the gods of old, like fonzi, they have charm, but they also can hit the power button any time they like.
- **thanks** walk towards the light.





