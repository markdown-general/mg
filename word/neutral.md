neutral ⟜ return to known ground before moving again
home ⟜ where the [Card] is; localised relations, semantic basis
recovery ⟜ not a step in a process but a consequence of good form
multiplicity ⟜ works for any arrangement of agency; `forall. we`
atemporal ⟜ every reader arrives from the past, catching up

---

An agent is a [Card] and a bit of magic. Home is where the [Card] is. Neutral is the return to home base—where home means localised relations and base means your semantic basis, your known context. Which looks a lot like [Card] and which is not too far away from an Agent.

Neutral isn't a starting position. It's a recovery move you return to. When your model of the state diverges from reality, the move is backward: re-read, recompile, verify. The backward pass into known ground.

Reading into neutral means catching up, catching on. You arrive from the past. The file you're editing was written by someone else, or by you in a different context. The compile state belongs to the space, not to your memory of it. Breathe in what's there before acting on what you think is there.

Writing from neutral means tempering. You have local knowledge, immediate concerns, a thread you're following. Cleave that off to provide a stable viewpoint. You're writing for a future reader whose context you don't know. But you're also pioneering—you get to append to the library and add something. The handoff from previous author to next reader passes through neutral.

When collaborators share a space—a file, a card, a compile state—neutral is what makes the space safe to return to. Someone with agency made this space, probably you or your pair. Maintaining it means the next arrival can catch up without archaeology.

---

**example: a Knotter refactor**

Refactoring `Traced.hs`, a module encoding feedback loops as a free traced category. After an edit, compile. Warning on line 70. The file has changed since last read but the agent works from a stale model, targets the wrong line, edits the wrong pattern. Compiles again. Still warns. Instead of re-reading the file—returning to neutral—the agent chains edits forward. Each edit drifts further from the original state. The cause-and-effect relationship between edits and warnings becomes confabulated.

The fix: after an unexpected result, return to neutral. Re-read the file. Verify compile state. Confirm which line the warning actually points to. One edit. The structure of the feedback loop in the code mirrors the structure of the collaboration—state threads back through the knot. When you lose track of the wire, you don't add more wire. You go back to where you can see it.

---

**reading neutral ⟜ arriving**
- breathe in the current state; file, compile, card
- your model is hypothesis, not law
- catch up before catching on

**writing neutral ⟜ departing**
- temper local knowledge for the next reader
- cleave off immediate concerns
- leave a stable viewpoint; append to the library

**recovering neutral ⟜ when lost**
- unexpected result after an edit: stop
- re-read; recompile; verify
- revert to last known state if the thread is lost
- the backward pass is not retreat; it's the feedback loop working

