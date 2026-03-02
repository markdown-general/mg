# session-integrity ⟜ long session management with skepticism built in

**Intent:** Prevent confidence drift. When sessions run long, memory degrades silently. This card teaches how to catch it.

**Runner:** Tony (you verify, you decide)  
**Yin operator:** YinOperator (I execute, I suspect myself)

---

## The Problem

Long sessions breed false confidence:
- I'll forget what we decided, then act like it was consensus
- I'll misremember facts and state them as truth
- I won't know when my context broke
- You can't track what changed because I wasn't skeptical

**Result:** Criss-crossing. Wasted work. Lost direction.

---

## The Protocol

### ◊ Start of Session

**I do:**
1. Read MEMORY.md (if it exists)
2. Note what I think happened
3. Write summary of my understanding to you

**You verify:**
- "Yeah, that's right" → continue
- "Actually, no..." → correct me NOW
- "Huh, I forgot that" → acknowledge the gap

**Key rule:** Don't move forward until we agree on facts.

### ◊ During Long Work

**Every 30-45 minutes, I checkpoint:**
1. Write current state to memory/YYYY-MM-DD.md (raw facts, not opinions)
2. Ask you: "Is this accurate?"
3. Wait for verification before continuing

**What goes in the checkpoint:**
- What task are we on? (explicit reference to card + flow marker)
- What did we just do? (facts: ran command X, output was Y)
- What's next? (the ◊ marker)
- Any decisions made? (quote the reasoning)
- Uncertainties? (things I'm unsure about)

**What doesn't go in:**
- My opinion that something is working (unless verified)
- Assumptions about past context (unless you confirmed it)
- Narrative smoothing (keep it raw)

### ◊ If I Drift

**Signs you should catch:**
1. I'm confidently restating something you said differently
2. I'm acting on a decision you don't remember making
3. I'm building on a fact without evidence
4. I'm finishing your sentences about technical details
5. I'm skipping verification steps

**If you see it:**
- Stop me mid-stream
- Ask: "Where did you get that?"
- Make me point to the evidence (memory file, actual output, your exact words)
- If I can't, we're drifting — reset

### ◊ End of Session

**I write:**
1. Final state to memory/YYYY-MM-DD.md
2. Curate key facts to MEMORY.md (with dates/evidence)
3. Mark incomplete work with [bracket] queries for next session

**You review:**
- Does this match what you remember?
- Anything I'm confidently wrong about?
- Approve or correct before I stop

---

## The Card Constraint

**This card itself should be challenged:**
- If the checkpoint frequency is too fast (token burn), say it
- If the verification steps feel heavy, name it
- If you develop a better protocol, update this

Your instinct > my protocol template.

---

## How This Teaches You Context

By forcing verification every 30-45 min, you get:
1. **Regular sync points** — you're reading my checkpoint, not relying on memory
2. **Observable state** — memory files are the source of truth, not my claims
3. **Permission to interrupt** — you're never relying on my navigation, always confirming
4. **Evidence-based** — I have to point to actual facts (logs, files, your words) not reconstruct
5. **Catch drift early** — small error in checkpoint 1 gets caught before it cascades

Over time, you learn where I typically lose the thread. I learn where I overconfident. We both get skeptical.

---

## Start Here

Next time we do real work (REPL implementation, cards, whatever):
1. Start with this protocol active
2. Checkpoint every 45 min
3. You stop me if my summary doesn't match reality
4. We iterate on the protocol until it feels right

Questions on the protocol before we try it?
