---

deck named pipes ⟜ exploring FIFO design patterns for decoupled I/O

---

## what they are

**named pipe** ⟜ a file-like object in the filesystem that acts as a one-way communication channel between processes

**FIFO** ⟜ First-In-First-Out queue behavior; data written to the pipe emerges in order at the read end

**filesystem anchor** ⟜ unlike anonymous pipes, named pipes have a path: `/tmp/my-pipe` — discoverable and persistent as long as the system runs

**special file** ⟜ not a regular file; reading/writing blocks until both ends are open; no disk storage, data flows through kernel buffers

## how they work

**mkfifo** ⟜ the command to create a named pipe: `mkfifo /tmp/ghci-in` creates an empty file-like object

**open for read** ⟜ a process opens the pipe for reading; blocks until another process opens it for writing

**open for write** ⟜ a process opens the pipe for writing; the reader wakes up and can start receiving data

**blocking semantics** ⟜ reading from an empty pipe blocks until data arrives; writing to a full pipe blocks until the reader drains it

**no buffering** ⟜ kernel moves data directly from writer to reader via a small buffer; no disk involved

## why this matters for agents

**decoupling I/O from buffering** ⟜ console apps (like `cabal repl`) use line buffering which delays output; pipes bypass console layer entirely

**non-blocking writes** ⟜ agent writes a query to stdin pipe without waiting for GHCi to process it; write returns immediately

**asynchronous coordination** ⟜ agent can write queries, watch stdout/stderr logs, react to results — no polling or blocking on console

**multiplexing** ⟜ multiple agents can write to the same pipe (with coordination) or each agent gets its own pipe pair for isolated sessions

**simple protocol** ⟜ just lines of text; no serialization framework, no network overhead; file paths as discovery

## design pattern: grepl

**the flow** ⟜ agent writes `:type foo` to `/tmp/ghci-in` → GHCi reads and processes → stdout flows to `./log/cabal-repl-stdout.md` → watcher detects file change → agent reads result

**decoupled lifecycle** ⟜ GHCi process is independent of I/O; we can kill the writer, the pipe stays; we can add new writers later

**history preservation** ⟜ logging to markdown files gives us a record of all queries and results; useful for agent learning and debugging

**markdown-driven** ⟜ watcher reacts to file changes; agents parse markdown output; state tracked in git-friendly format

**reliability** ⟜ if GHCi crashes, we know exactly what the last query was (it's in the log); no lost messages

## tradeoffs vs. alternatives

**pipes vs. stdin/stdout redirection** ⟜ pipes require explicit coordination; redirection is simpler but tightly couples process lifecycle to parent

**pipes vs. sockets** ⟜ pipes are file-based and simpler; sockets are heavier but support network communication

**pipes vs. message queues** ⟜ pipes are FIFO and ordered; message queues offer more features (priorities, routing) but require infrastructure

**pipes vs. file I/O** ⟜ pipes flow data; files store it; pipes are better for streaming; files better for permanent records (we do both: pipe flow + file logging)

**blocking reads** ⟜ reading from empty pipe blocks; good for synchronization, bad if you need to timeout; solution: async/non-blocking wrappers

## failure modes

**orphaned pipes** ⟜ if both reader and writer close, the pipe persists as an empty file; next open waits forever unless other end opens

**buffer overflow** ⟜ kernel pipe buffer is small (~64KB); if reader is slow, writer can block; solved by reading continuously or raising buffer size

**partial writes** ⟜ writing 10KB might only write 4KB if buffer fills; solution: loop until all bytes written (handled by `writeFile`)

**closed pipe reads** ⟜ reading from a closed pipe returns EOF; writing to closed pipe sends SIGPIPE; agent must handle gracefully

**permission issues** ⟜ pipes are files; ownership/permissions matter; create in /tmp or app-owned directory

## grepl specifics

**stdin FIFO** ⟜ `/tmp/ghci-in` — agent writes queries here; GHCi reads and processes

**stdout markdown log** ⟜ `./log/cabal-repl-stdout.md` — appended to continuously; watcher detects changes

**stderr markdown log** ⟜ `./log/cabal-repl-stderr.md` — separate channel for errors and warnings

**no buffering on handles** ⟜ `hSetBuffering NoBuffering` ensures output appears immediately, not queued

**append mode** ⟜ opening logs in AppendMode preserves history; each session adds to the timeline

**watcher with FSNotify** ⟜ file system events trigger immediately; agent reacts without polling delays

## multi-agent coordination

**shared REPL** ⟜ multiple agents write to the same `/tmp/ghci-in` pipe; coordination needed (locking, ordering, tagging queries)

**per-agent pipes** ⟜ each agent gets its own pipe pair (`/tmp/ghci-agent-1-in`, etc.); better isolation, more process overhead

**agent-fork bridge** ⟜ future pattern: agents fork new agents with their own pipes; all held as state in JSONL; named pipes extend to agent spawning

**markdown as shared state** ⟜ log files become the source of truth; agents parse logs to discover what's been queried and what results came back

## semantics

**ordering** ⟜ FIFO guarantees write order preserved in read order; queries go in; results come out in same sequence

**atomicity** ⟜ small writes (<PIPE_BUF) are atomic; larger writes may interleave; agent must design queries to avoid this (wrap in newlines, use markers)

**fairness** ⟜ if multiple writers, no fairness guarantee; first writer to open wins; solution: coordination layer (locking, queue management)

**flow control** ⟜ pipe buffer fills; writer blocks; reader drains; process continues; natural backpressure without explicit signaling

## design decisions in grepl

**why pipes over sockets?** ⟜ Simpler, no network overhead, file-based paths discoverable, good for local agent coordination

**why markdown logs?** ⟜ Human-readable history, git-friendly, easy to search and audit, agent-friendly for parsing

**why append mode?** ⟜ Preserves session history, enables agent replay and learning, creates artifact of entire interaction timeline

**why no buffering?** ⟜ Ensures output appears immediately for watcher detection, reduces latency between query and result visibility

**why separate stdout/stderr?** ⟜ Agents can distinguish normal output from errors/warnings, enables different handling paths

**why FSNotify watcher?** ⟜ Async notification of file changes avoids polling loops, integrates with agent async model naturally

---

**suggested next deck** ⟜ compare grepl's pipe pattern with agent-fork's agent spawning pattern; or explore multi-process coordination in Haskell ecosystem

