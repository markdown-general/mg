# browser-aria ⟜ ARIA snapshot and ref system design

Side quest: build our own accessibility tree → semantic ref layer over raw CDP. No Playwright. No agent-browser. Ours end to end.

See also: `~/mg/buff/browser-comms.md` for the browser-comms architecture and our shared Chrome model.

---

## The Problem

CSS selectors are fragile. A button with class `btn-primary-v2-dark` breaks the moment the design system changes. Agents constructing selectors from page observation waste tokens and fail unpredictably.

agent-browser solved this with a ref system: take a snapshot of the accessibility tree, mint stable semantic refs (`@e1`, `@e2`), use those refs for all subsequent interactions. The refs don't encode DOM structure — they encode *meaning* (role + name). Much more robust.

We want the same thing. Without Playwright.

---

## The ARIA Tree via CDP

Chrome exposes the full accessibility tree via the Chrome DevTools Protocol:

```javascript
// Enable accessibility domain
await client.send('Accessibility.enable');

// Get full tree
const { nodes } = await client.send('Accessibility.getFullAXTree');
```

Each node has:
```json
{
  "nodeId": "1",
  "role": { "type": "role", "value": "button" },
  "name": { "type": "computedString", "value": "Submit" },
  "properties": [...],
  "childIds": ["2", "3"],
  "backendDOMNodeId": 42
}
```

**Key fields:**
- `role.value` ⟜ ARIA role (button, textbox, link, heading, etc.)
- `name.value` ⟜ Accessible name (label, aria-label, inner text)
- `backendDOMNodeId` ⟜ Bridge to DOM for clicking, typing, etc.
- `childIds` ⟜ Tree structure

---

## Building snapshot()

Walk the tree, mint refs for interactive nodes:

```javascript
const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'textbox', 'searchbox', 'combobox',
  'checkbox', 'radio', 'menuitem', 'tab', 'option',
  'slider', 'spinbutton', 'switch'
]);

async function snapshot(client) {
  const { nodes } = await client.send('Accessibility.getFullAXTree');
  
  const refMap = new Map();  // ref → { nodeId, backendDOMNodeId, role, name }
  let counter = 1;
  const lines = [];

  for (const node of nodes) {
    const role = node.role?.value;
    const name = node.name?.value;

    if (INTERACTIVE_ROLES.has(role) && name) {
      const ref = `e${counter++}`;
      refMap.set(ref, {
        nodeId: node.nodeId,
        backendDOMNodeId: node.backendDOMNodeId,
        role,
        name,
      });
      lines.push(`  [ref=@${ref}] ${role} "${name}"`);
    }
  }

  return { lines, refMap };
}
```

Output:
```
  [ref=@e1] textbox "Search"
  [ref=@e2] button "Submit"
  [ref=@e3] link "Sign in"
```

---

## Using Refs for Interaction

Once you have a `backendDOMNodeId`, resolve it to a DOM object and interact:

```javascript
async function clickRef(client, refMap, ref) {
  const entry = refMap.get(ref.replace('@', ''));
  if (!entry) throw new Error(`Unknown ref: ${ref}`);

  // Resolve to object
  const { object } = await client.send('DOM.resolveNode', {
    backendNodeId: entry.backendDOMNodeId,
  });

  // Get bounding box
  const { model } = await client.send('DOM.getBoxModel', {
    backendNodeId: entry.backendDOMNodeId,
  });

  // Click at center
  const [x, y] = boxCenter(model.content);
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

async function fillRef(client, refMap, ref, text) {
  await clickRef(client, refMap, ref);
  await client.send('Input.insertText', { text });
}
```

---

## Ref Lifecycle

Refs are **ephemeral per snapshot**. After navigation or significant DOM change:
- Call `snapshot()` again
- Get a new refMap
- Old refs are invalid

This matches agent-browser's model exactly. The ref doesn't encode DOM structure — it's a handle into the current snapshot's refMap. Navigate → re-snapshot → new refs.

---

## puppeteer-core vs Raw CDP

Both work. puppeteer-core wraps CDP with a nicer API:

```javascript
// puppeteer-core approach
const client = await page.createCDPSession();
const { nodes } = await client.send('Accessibility.getFullAXTree');

// Raw CDP approach (via chrome-remote-interface or WebSocket)
const CDP = require('chrome-remote-interface');
const client = await CDP({ port: 9222 });
await client.Accessibility.enable();
const { nodes } = await client.Accessibility.getFullAXTree();
```

**puppeteer-core** is the pragmatic choice for now — already in pi-skills, handles WebSocket lifecycle, has page-level helpers for clicking/typing when we don't want to go full CDP.

**Raw CDP** is the end-state if we want zero abstraction and full control. `chrome-remote-interface` is ~50KB, no browser binaries.

---

## What We're Not Building (Yet)

- **Daemon process:** Chrome is already persistent. We connect per-operation.
- **Session serialization:** No need to save/restore browser state across agents (tabs serve this purpose).
- **Diff system:** agent-browser has Myers diff on ARIA trees. Useful but not urgent.
- **Security layer:** Action policies, domain allowlists. Future concern.

---

## Integration with browser-comms

The snapshot/ref system slots into browser-comms as an optional higher layer:

- **Current:** Agents use CSS selectors + body text parsing (what works today)
- **Next:** `snapshot()` call → refMap → ref-based clicks/fills
- **Transition:** Both can coexist. Refs where stable; selectors where quick

---

## References

- `Accessibility.getFullAXTree` ⟜ CDP docs
- `agent-browser/src/snapshot.ts` ⟜ Reference implementation (TypeScript/Playwright)
- `~/mg/buff/browser-comms.md` ⟜ Architecture decision + current mechanics
- `~/mg/loom/agent-browser-repo.md` ⟜ Field agent report on agent-browser architecture
