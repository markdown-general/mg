# side-quests

## TODO: investigate thinking-blocks visibility in pi

Claude has thinking-blocks (internal reasoning visible in output). User notes this in conversation when we first started cleanup session. Need to find if pi has a setting to hide them, or if it's a Claude configuration issue. Previous attempts to fix have failed; user found it hard to explain the issue. Annotation: "you can see it in the output" in conversation context.

## TODO: static analysis on traced conversation transcripts

Five large conversation transcripts (210K, 122K, 98K, 68K, 25K) moved to ~/other/conversations/. These contain breakthrough insights from long conversations with claude.ai. Mine them for insight flashes worthy of further study.

## TODO: survey self/stuff/ contents for new and interesting projects

dataframe.md moved here. Explore ~/self/stuff/ for patterns, incomplete projects, ideas worth revisiting.

## TODO: skills management with haskell-skill as starting point

haskell-skill.md moved to yard/. Build a framework for tracking and evolving skills across the project.

## TODO: three-agent neural net study (requires field agent spinning)

Experiment: Can a journal.md improve code analysis? Spin three parallel agents:
1. Agent reads ~/repos/traced/ only → summarize neural net coding methods
2. Agent reads ~/repos/traced/ + yin/journal.md → summarize same question  
3. Agent reads yin/journal.md only → extract methods described

Compare outputs. Does journal add clarity/insight? Task card template in log/agent-spin-neural-net-study-20260301.md. Requires agent spinning capability.

## TODO: research agent spinning in pi

Study pi documentation and extensions for agent spinning capabilities. Reference files in yard/log/ for context on prior agent spin attempts:
- checkpoint-yin-start-phase-1.md
- yin-start-iteration-record.md
- sub-agent-spin-20260204-110108.jsonl
- yin-start-baseline-spin-20260204-110101.md
- iteration-refinement-report.md
- runner-protocol-research.md

## TODO: consolidate and document traced/ project state

traced.md moved to yard/traced/. Main working area for neural net development. Context: earlier documents in ~/repos/apps/other/ may be useful. Trail of repos to sift: ~/repos/{apps, hyp, hyp1, mpar, mtok}. Consolidate scattered notes, establish current state, identify blockers, document next steps for traced/ development.

## TODO: identify upgrade cards across all directories

emacs.md and haskell-skill.md moved to upgrades/. Upgrade cards are scattered everywhere: work/, cards/, design/, yard/, external sources. Hunt for cards that function as upgrades (capability amplifiers, thinking amplifiers, ways of approaching problems that give agents superpowers). Move candidates to upgrades/ and annotate their purpose.

## TODO: reinvent tools concept

Tools are scattered across work/tools.md, yard/tools/, tools/. Unclear what distinguishes a tool from a card, how they execute, how they integrate. Reinvent the concept. Review all three locations and establish clear semantics and structure.

## TODO: investigate log directory contents

Unclear what's in log/. Audit and triage contents. Determine what should be kept, archived, or reorganized.

## TODO: pi-mono may contain agent spinning answers

pi-mono repository may hold clues for implementing agent spinning in pi. Research and cross-reference with yard/log/ agent spin research files.

## TODO: browser skill form input/submission

**Current tech limit identified**: CDP tools (browser-tools) can **read** page content reliably (browser-content.js, browser-eval.js for DOM extraction). Can **navigate** (browser-nav.js). Cannot reliably **write to forms** or trigger form submission (contenteditable inputs, complex event handling for chat UIs).

Attempted: Grok/Claude.ai chat message submission via CDP KeyboardEvent + form input. Failed on both—events don't fire correctly.

**Next**: Research form recognition + submission patterns. Look for existing form-filler libraries (Puppeteer plugins, CDP form automation, or pi-mono examples). Goal: enable live chat automation for research queries (Grok, Claude.ai).

---

