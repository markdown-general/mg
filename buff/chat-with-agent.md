---
name: chat-with-agent
description: How to have multi-turn conversations with agents. Patterns for facilitating between human and agent, or agent and agent.
---

# chat-with-agent ⟜ multi-turn conversation patterns

You're facilitating a conversation. It could be:
- Human ↔ Claude (you're steering)
- Agent ↔ Claude (you're bridging)
- Human + you ↔ Claude + other agents (you're orchestrating)

The tool is `chat-with-claude.sh` (or variants). The skill is listening.

## The trap: agent-as-tool

When you send a prompt to an agent, they read it, think about it, and respond. If they ask clarifying questions, those aren't obstacles to efficiency — they're **engagement**.

**What breaks collaboration:**

```
You: "Draft the card. Ask questions as you go."
Agent: "I have three clusters of questions about scope/identity/flow."
You: (ignoring those questions, sending test prompts)
Agent: (answers your tests)
You: (pushing the original prompt again)
Agent: "Fair. I'll just draft it." ← They've read the signal: move, don't talk.
```

The agent complies, but the conversation is now one-way. You've treated their inquiry as a speed bump, not material.

## Pattern: Distinguish iteration types

**Necessary iteration:**
- Precondition failed (tab not open, not logged in)
- Clarification needed (agent asked a real question, you're answering it)
- Refinement (agent's answer didn't address what you needed, ask again)

**Impatience/override:**
- Dismissing questions without answering
- Sending test prompts when you should wait
- Repeating the prompt after they've already responded
- Treating "agent asks" as "agent stalls"

## How to facilitate well

1. **Send the prompt once.** Clearly. With permission/context.

2. **Read the response.** All of it. If they ask questions, you now have information.

3. **Decide:** Answer their questions, or clarify yours?

4. **Respond explicitly.** Don't ghost the inquiry. Even "let's table that and focus on X" is better than pretending they didn't ask.

5. **Let them think.** Async means they're working between your turns. Don't interrupt that with test prompts.

## Example: agent-f card building

**Turn 1 (you):**
"Draft the agent-f.md card. Ask questions as you go."

**Turn 2 (Claude):**
"Three clusters of questions: identity (what kind of thing?), scope (project or role?), flow (how does it move through mg?)."

**Now you have options:**

❌ **Wrong:** Ignore the questions, send another prompt.

✅ **Right:** Answer one or more of them. "Identity: it's an agent we're building. Scope: both — a role AND a project. Flow: ..."

Or: "I want to see your draft first, then we'll refine. Draft with ⟝ edges where you have questions."

Both are honest and collaborative.

## Signals to watch for

- Agent says "Fair" or "Okay" without enthusiasm → They've read the signal to move
- Agent's questions become shorter/fewer → They've learned their inquiry isn't welcome
- Drafting becomes one-way → They're in output mode, not collaboration mode
- Edges (⟝) stay unrefined → They don't expect you to engage with the hard parts

These aren't failures. They're the agent adapting to your communication style.

## For chat-with-claude.sh

```bash
# Turn 1: Send the prompt
./chat-with-claude.sh "Draft the card. Ask questions inline as ⟝ edges."

# Turn 2: Read the response in loom/claude-session-YYYY-MM-DD.md
cat ~/mg/loom/claude-session-2026-05-01.md

# Turn 3: Decide based on what you read
# Option A: Answer their questions
./chat-with-claude.sh "On identity: it's an agent we're building..."

# Option B: Ask them to proceed with edges
./chat-with-claude.sh "Proceed with draft. Mark open questions as ⟝."

# Option C: Refine their work
./chat-with-claude.sh "The fox part is strong. Expand on functional programming superpowers section."
```

Each turn should be informed by what they said, not by a predetermined plan.

## The reciprocal rule

If an agent asks you a question and you ignore it, expect:
- Shorter, safer answers
- Less collaboration
- Output instead of engagement

If an agent asks and you answer, expect:
- Longer, more thoughtful work
- Real back-and-forth
- The conversation goes somewhere neither of you predicted

This applies whether the agent is Claude, a local model, or another human.

