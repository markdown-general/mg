# emacs environment and practices

## pi-coding-agent: Native Emacs Frontend for Pi

**pi-coding-agent** is an Emacs frontend for the pi coding agent, providing native integration without wrapper protocols or APIs.

### Why pi-coding-agent?

- **Native Emacs workflow**: Compose prompts in full Emacs buffers with all your keybindings and editing power
- **Markdown chat history**: Conversations saved as native Markdown files—searchable, editable, resumable
- **Direct Pi integration**: No API layers, wrappers, or protocols; runs pi CLI directly
- **Streaming output**: Watch tool operations and command execution in real-time
- **Forking conversations**: Branch at any point in the chat history
- **File references**: Use `@` to search and reference project files directly in prompts
- **Multi-session**: Run multiple conversations per project, named or default

### Setup

**Installation (Doom Emacs):**

In `packages.el`:
```elisp
(package! pi-coding-agent)
```

In `config.el`:
```elisp
(use-package! pi-coding-agent
  :init (defalias 'pi 'pi-coding-agent))
```

Then run `doom sync` and restart Emacs.

**Requirements:**
- Emacs 28.1 or later
- pi coding agent 0.51.3+ installed and in PATH (`which pi`)

### Usage

**Start a session:**
```
M-x pi
```

The interface opens two buffers:
- **Chat buffer** (top): Conversation history as rendered Markdown
- **Input buffer** (bottom): Where you compose prompts

Type your prompt and press `C-c C-c` to send.

### Key Bindings

| Key           | Action                                  |
|---------------+-----------------------------------------|
| `C-c C-c`     | Send prompt                             |
| `C-c C-s`     | Queue steering message (while busy)     |
| `C-c C-k`     | Abort streaming                         |
| `C-c C-p`     | Open menu (model, thinking, sessions)   |
| `C-c C-r`     | Resume session                          |
| `M-p` / `M-n` | Navigate input history                  |
| `C-r`         | Incremental history search              |
| `TAB`         | Complete paths, files, commands         |
| `@`           | File reference search                   |
| `n` / `p`     | Navigate messages in chat               |
| `f`           | Fork conversation at point              |
| `q`           | Quit session                            |
| `S-TAB`       | Cycle fold state for all sections       |

### Tips & Tricks

**Composing Prompts**
- The input buffer is a full Emacs buffer: multi-line editing, paste from other buffers, use registers, apply macros
- Your prompt stays put while the AI responds above
- Slash commands (`/command`) work with completion: type `/` then `TAB`

**File References**
- Type `@` to search project files (respects `.gitignore`)
- Results cached for 30s to keep completion fast
- Referenced files are sent to pi with full context

**Tool Output**
- Collapsed by default to keep chat readable
- Press `TAB` on tool blocks to expand
- File operations (read, write, edit) show syntax highlighting
- Diffs highlight what changed
- Press `RET` on file-content lines to open backing file at line number

**Session Management**
- Each project directory gets one default session automatically
- For multiple sessions in same directory: `C-u M-x pi-coding-agent` to name
- Resume (from menu): restore previous session or fork from earlier message
- Chat history persists as Markdown files

**Folding**
- Press `TAB` on turn headers (You/Assistant) to fold
- Use `S-TAB` to cycle visibility of all turns at once

### Emacs Integration

Because pi-coding-agent runs in Emacs buffers, you have access to:
- Current buffer content (pi can read/analyze what you're editing)
- File references via `@` completion
- Emacs keybindings and editing power
- Full Markdown formatting support for documentation
- Native git integration (pi sees git context)
- LSP diagnostics and editor state

### Troubleshooting

**pi-coding-agent not starting?**
- Verify pi is in PATH: `which pi`
- Check Emacs messages: `M-x toggle-debug-on-error`
- Verify Emacs version: `M-x emacs-version` (needs 28.1+)

**Session lost?**
- Chat files are saved to disk as Markdown
- Look in `~/.pi/` for session history
- Use `C-c C-r` to resume or `C-c C-p` menu to restore

**Slow completion?**
- File reference cache refreshes every 30s
- Can be forced by waiting or switching files

### Links

- [pi-coding-agent on GitHub](https://github.com/dnouri/pi-coding-agent)
- [pi-coding-agent on MELPA](https://melpa.org/#/pi-coding-agent)
- [pi coding agent](https://github.com/badlogic/pi-mono)
- [Doom Emacs](https://github.com/doomemacs/doomemacs)
