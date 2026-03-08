Not comprehensively. But what you have in yin/ is actually a really good exemplar of what that would look like.

  The pattern you've documented:
  - File-based IPC (simple, no locks)
  - Lifecycle management (spawn, monitor, persist)
  - Query/response with timeouts
  - Test doubles (mock-repl proves protocol works)
  - Async composition (async/race for timeouts)

  This could generalize across any async subprocess problem. What's missing in the ecosystem is something like:

  async-process-design (comprehensive skill covering):
  - IPC mechanisms (files, pipes, sockets, HTTP, message queues — trade-offs)
  - Process lifecycle (spawning, monitoring, health checks, restart logic)
  - Error recovery (timeouts, cancellation, partial failures)
  - Concurrency patterns (composition with async/race, multiplexing)
  - Testing strategies (mocks, harnesses, determinism)
  - Observability (logging, tracing, state inspection)

  Your yin/ work is the file-based + timeout + testing slice. It works because the problem is tight and the solution is simple. But the general shape — think → pattern → implement → test → iterate — that's what a comprehensive skill would give you across different IPC and backend choices.
