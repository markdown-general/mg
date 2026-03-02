# scout ⟜ exploring new technology horizons

**scout** ⟜ pattern-match upstream; find the live edges; build confidence through experiment

**lazy in action** ⟜ don't search, navigate; don't speculate, read code; don't assume, test

---

## the mindset

When you encounter a new technology or want to understand what's coming, resist the urge to search. Instead, **hunt and peck** at the repository itself. The repo is the source of truth: branches, PRs, issues, commits tell you everything about what's alive, what's stuck, and where momentum lives.

You're not looking for documentation. You're looking for **activity**—patterns of work that show you what's important, what's experimental, what's ready.

---

## the hunt: finding signal

**Start with branches**
```bash
git branch -a | grep -i feature-name-or-keyword
```

Branches are where work lives. Look for:
- Feature branches with descriptive names (e.g., `rpc-browsing-surface`)
- PR branches that hint at what's being tested
- Abandoned branches that show false starts
- The branch age: when was it last touched?

**Read recent commits**
```bash
git log --oneline -20
```

Commit messages show velocity and intent. Watch for:
- Feature additions vs. bug fixes vs. refactoring
- When the feature was completed (is it stale?)
- How often changes land (active project?)
- Commit subjects that tell you the author's thinking

**Check PR/Issue activity**
```
site:github.com owner/repo tree-browser
```

Or directly on GitHub: `/pulls`, `/issues`. Look for:
- Open PRs (in-flight work)
- Closed PRs (shipped or abandoned?)
- Discussions that show thinking process
- Links between related issues (dependencies, blockers)

**Read the diff of a promising commit**
```bash
git show <commit-hash> | head -200
```

The diff is a narrative. It shows:
- What changed and why (look at commit message)
- Whether it's test-backed
- Whether it's coherent or exploratory

**Fetch and inspect locally**
```bash
git remote add upstream https://...
git fetch upstream feature-branch
git checkout feature-branch
```

Now you have the code locally. This is where it gets real.

---

## why local clones beat searching

**Cheaper than web search**
- No context switches to browser tabs
- No SEO clutter (no Medium posts about "getting started")
- The repo is the full truth; search gives you fragments

**Easier to read code**
- Clone it, open in your editor with full IDE support
- Jump to definitions, search patterns, understand structure
- You can run it, test it, break it

**Confidence through experiment**
- Reading about a feature ≠ understanding it
- Building it locally = you know how it works
- Testing it = you know what breaks and why

**No cost to exploration**
- Local clone is ~100MB. Cheap.
- You can branch, test, throw away.
- You can integrate with other local clones (like we did: pi-mono + pi-coding-agent)

---

## the expedition: building confidence

**1. Inspect what you have**
```bash
# Get the lay of the land
ls -la
find . -name "*.md" | head -20
cat README.md
```

What's the project structure? What's the philosophy?

**2. Trace the feature**
```bash
# Find files that changed for the feature
git log --name-only --oneline | grep -A 10 "feature-name"

# See the full diff
git show <commit> | less
```

What did it add? What did it touch? Is it invasive or isolated?

**3. Check dependencies**
```bash
cat package.json  # npm
cat Cargo.toml    # Rust
cat mix.exs       # Elixir
# etc.
```

What new dependencies does it need? Are they maintained? Lightweight?

**4. Read the tests**
```bash
# Usually in test/ or __tests__/
cat test/feature-test.js
```

Tests show you:
- How the feature is meant to be used
- Edge cases the author cared about
- Whether it's actually tested or just sketched

**5. Build and run**
```bash
npm install
npm run build
# or equivalent for your tech
```

Does it build cleanly? Are there warnings? This is your first real signal.

**6. Try it**
```bash
npm install -g ./path
# or set up locally for testing
```

Run the thing. Does it work? Does it crash? What's the UX like?

---

## integrating multiple repos

Sometimes a feature spans two repositories (like pi-mono + pi-coding-agent). Local clones shine here:

**Pattern**: Feature split across repos
- Repo A: Backend implementation (RPC, state, protocol)
- Repo B: Frontend consumer (UI, integration)

**Your scout approach**:
1. Clone both repos locally
2. Fetch the matching feature branches
3. Read both halves to understand the contract
4. Build Repo A first (the dependency)
5. Build Repo B pointing to your local Repo A
6. Test the full integration locally

**Example: our pi expedition**
```bash
cd ~/other/pi-mono
git fetch dnouri rpc-browsing-surface
git checkout rpc-browsing-surface
npm install && npm run build
npm install -g ./packages/coding-agent  # Install new backend

cd ~/other/pi-coding-agent
git fetch origin browser
git checkout browser
# Doom config already points to local repo
doom sync
# Test in Emacs
```

No npm package version fiddling. No waiting for releases. Just local, integrated, testable.

---

## reading upstream intent

**Active = healthy**
- Frequent commits and merges
- Closed PRs (work ships)
- Issues with responses and discussion
- Branches that get used and deleted cleanly

**Stale = caution**
- Last commit 6+ months ago
- Open PRs with no activity
- Issues unanswered
- Abandoned branches

**Experimental = interesting**
- Feature branches that exist for weeks
- PRs with lots of iteration and discussion
- Commits that add, revert, add again (thinking out loud)
- Multiple people contributing to one feature

Read the signals. **Momentum matters.** An experimental feature with active discussion is more promising than a shipped feature that's now dormant.

---

## building your own buff

When you scout a new technology:

1. **Document what you found**
   - Link to branches, key commits, PRs
   - Note the activity level and maturity
   - Describe how it fits into your world

2. **Record the setup**
   - Exact commands you used to build
   - Dependencies you needed
   - Where you installed it and why
   - How you integrated it with other tools

3. **Capture the UX**
   - What commands are available?
   - What does it do well?
   - What breaks or surprises?
   - How would you teach someone else?

4. **Plan the unwind**
   - How will you revert when upstream merges?
   - What was temporary (local branches, hacks)?
   - What should be kept as knowledge?

---

## the maker's edge

**You now have what most users don't:**
- Hands-on understanding (not documentation reading)
- Local, runnable code (not theory)
- Integration experience (not isolation)
- Confidence to experiment (not fear)

You can:
- Report better issues (you've seen the code)
- Contribute fixes (you understand the structure)
- Guide others (you've walked the path)
- Adapt features for your needs (you control the whole stack)

**Scouts don't wait for releases. They build confidence through exploration, then guide others.**

This is how makers stay ahead of the curve.
