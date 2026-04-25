# pty-mcp-server

**What it is:** An MCP server that gives agents interactive terminal access. Instead of shell scripts, agents control real PTY sessions like a human would.

**Install:**
```bash
cabal install pty-mcp-server --allow-newer='*:base'
# Binary at ~/.cabal/bin/pty-mcp-server
```

**Key tools (via MCP):**
- `pty-bash` — Launch interactive bash in a PTY
- `pty-message` — Send commands to a running PTY session
- `pty-ghci` / `pty-cabal` / `pty-stack` — Haskell REPLs
- `pty-ssh` — SSH sessions
- `pty-connect` — Generic command execution in PTY
- `proc-*` — Non-PTY subprocess control (stdin/stdout only)

**Why PTY matters:**
Some tools require a real terminal:
- Password prompts
- Interactive menus
- TUI applications
- Color output, cursor control

Scripts can't handle these. PTY sessions can.

**Real examples from README:**
- Network device login via serial port + password prompt
- Build a Flask app from scratch (Python, shell commands, HTTP testing)
- GHCi debugging with runtime inspection
- SSH automation with interactive auth

**Config:** 
```bash
pty-mcp-server -y config.yaml
```
(YAML config specifies environment, working dir, allowed commands, etc.)

---

## Integration with pi-mcp-adapter

### Setup & Debugging (2026-04-26)

Got pty-mcp-server working with pi-mcp-adapter. Here's what we learned:

#### Problem #1: MCP Protocol Non-Compliance (GitHub Issue #4)

pty-mcp-server v0.1.5.0 and earlier had a critical bug: the `tools/list` MCP response was malformed.

**Expected (MCP spec):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [{ "name": "pty-bash", ... }]
  }
}
```

**Actual (broken):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": {
      "tools": [{ "name": "pty-bash" }]
    }
  }
}
```

Double nesting + missing required fields. This broke compatibility with standard MCP clients (pi-mcp-adapter, Claude Code, etc.). Only VSCode's custom MCP client worked around it.

**Fix:** Upgrade to v0.1.7.0 (released 2026-04-30) which fixes the MCP response format.

#### Problem #2: Wrong State Machine Behavior

Even after fixing the response format, the server wasn't advertising tools. Logs showed:
```
StartState ToolsListEvent (...) not supported. will do nothing.
```

The server was stuck in `StartState` and rejecting `tools/list` requests. The MCP spec requires the client to send:
```json
{"jsonrpc": "2.0", "method": "notifications/initialized"}
```

After receiving the initialize response. Once we manually sent that, the server transitioned to `RunState` and returned tools correctly.

**Note:** pi-mcp-adapter handles this automatically (it's part of the MCP protocol flow), so this wasn't actually a blocker with the adapter, just important to understand for manual testing.

#### Problem #3: tools-list.json in Wrong Location

The server was logging:
```
[Info] file not found./Users/tonyday567/.pi/agent/pty-mcp-server/tools/tools-list.json
```

We had `tools-list.json` at the root, but the server looks for it **inside the `tools/` subdirectory**.

**Fix:** Move `tools-list.json` to `tools/` subdirectory.

#### Problem #4: Missing inputSchema in tools-list.json

Our initial `tools-list.json` was too minimal:
```json
[{"name": "pty-bash"}]
```

pi-mcp-adapter rejected all 29 tools with validation errors:
```
[invalid_type] expected object, received undefined at tools[0].inputSchema
```

The MCP spec requires each tool to include `description` and `inputSchema`.

**Fix:** Add complete tool metadata:
```json
[
  {
    "name": "pty-bash",
    "description": "Launch a bash shell in a PTY",
    "inputSchema": {
      "type": "object",
      "properties": {
        "command": {
          "type": "string",
          "description": "Optional initial command"
        }
      }
    }
  },
  ...
]
```

#### Problem #5: Configuration in Wrong Place

Initially the server config was in `settings.json` under `"mcp"` key. But pi-mcp-adapter reads from:
- `~/.config/mcp/mcp.json` (standard shared config)
- `~/.pi/agent/mcp.json` (pi-specific override)
- `.mcp.json` (project-local)

**Fix:** Create `~/.pi/agent/mcp.json`:
```json
{
  "mcpServers": {
    "pty-mcp-server": {
      "command": "pty-mcp-server",
      "args": ["-y", "/Users/tonyday567/.pi/agent/pty-mcp-server-config.yaml"]
    }
  }
}
```

### Integration Status with pi-mcp-adapter

**✓ Working:**
- ➜ File operations (`pms-list-dir`, `pms-read-file`, `pms-write-file`)
- ➜ Tool discovery (29 tools listed correctly)
- ➜ Wrapper script + keep-alive lifecycle prevents EOF crash

**✗ Not Working:**
- ➜ PTY-based tools (`pty-bash`, `pty-connect`, `pty-ghci`, etc.)
  - Issue: Server spawns PTY but never detects a prompt
  - Times out after 30 seconds waiting for prompt detection
  - Works standalone via stdio, works with Claude Desktop
  - **Root cause:** stdio pipe management incompatibility between pi-mcp-adapter and pty-mcp-server
  - Likely requires deeper integration changes or alternative launch method

### Final Working Setup

**Directory structure:**
```
~/.pi/agent/
├── mcp.json                          # pi-mcp-adapter config
├── pty-mcp-server-config.yaml        # pty-mcp-server config
└── pty-mcp-server/
    ├── tools/
    │   └── tools-list.json           # All 29 tools with schemas
    ├── prompts/
    ├── resources/
    └── logs/
```

**Config files:**

`~/.pi/agent/mcp.json`:
```json
{
  "mcpServers": {
    "pty-mcp-server": {
      "command": "pty-mcp-server",
      "args": ["-y", "/Users/tonyday567/.pi/agent/pty-mcp-server-config.yaml"]
    }
  }
}
```

`~/.pi/agent/pty-mcp-server-config.yaml`:
```yaml
logLevel: Debug
toolsDir: "/Users/tonyday567/.pi/agent/pty-mcp-server/tools"
promptsDir: "/Users/tonyday567/.pi/agent/pty-mcp-server/prompts"
resourcesDir: "/Users/tonyday567/.pi/agent/pty-mcp-server/resources"
logDir: "/Users/tonyday567/.pi/agent/pty-mcp-server/logs"
workDir: null
sandboxDir: null
prompts:
  - "$"
  - "#"
  - ">"
  - "ghci>"
  - "Password:"
  - "login:"
  - "prompt>"
invalidChars: []
invalidCmds: []
timeoutMicrosec: 5000000
```

**Result:** `mcp({ })` now shows `MCP: 1/1 servers, 29 tools` ✓

---

## Can it run pi?

Theoretically yes. `pty-bash` spawns a real PTY, so you could:
```bash
# Inside a pty-bash session:
pi -s ~/.pi/agent/sessions/...
```

But pi's TUI control (keybindings, widget rendering) might not work well through MCP messaging. It's designed for human terminal interaction, not programmatic input/output.

**Better use:** Use pty-mcp-server to automate *around* pi (manage files, run builds, test outputs), not to control pi itself.

**Test it:**
```bash
# From ~/.pi/agent settings, register pty-mcp-server as MCP client
# Then in pi: use Agent() to spawn sub-agents that get TTY tools
# Or call pty-bash directly to run shell commands with full interactivity
```
