# grammar.md

## deck ⟜ grammatical definition

**deck** ⟜ a grammar for markdown
⟜ permissive by default, relaxed & flexible
⟜ [grammar](grammar) for design, [decking](decking) for usage

lead ⟜ a few tokens
     ⟜ line
dash ⟜ the type of elab
elab ⟜ an elaboration of the lead
line ⟜ lead (dash elab)*
deck ⟜ a few lines
card ⟜ a few decks
     ⟜ a markdown file

## design

We see this grammar working in any resolution between tokens (pair token frequency say) and card (are these two markdown files linked).

tokens ⇄ lead ⇄ slug ⇄ deck ⇄ card

with dashes forming the types of ⇄ 

These definitions describe patterns, not requirements ⟜ any element can be present, absent, or rearranged as the content demands.

## compositional chain

**tokens** → **lead** → **slug** → **deck** → **card**

Each level builds on the last. From primitives to artifacts.

## key insights

**⟜ means elaboration, not definition**
- BNF's `::=` says "this produces that" (one direction)
- Decking's `⟜` says "this elaborates that" (both directions)
- Enables bidirectional flow: prose ↔ deck

**meaning is inferred, not corralled**
- token, lead, slug remain open for interpretation
- context determines what they mean
- no rigid <non-terminals>

**structure serves content**
- hierarchy indicates relationship, not value
- level 2 isn't necessarily better than level 3
- leads can be removed while keeping elaborations
- orphaned elabs aren't violations

**maybe decking**
- everything is pattern, not requirement
- sparse (loose), complete (tight), open (maybe)
- defaults to loose—shows honest understanding
- tight decks can hide thin thinking

## differences from BNF

**decking vs BNF**
⟜ BNF constructs formal grammars; decking surfaces thought structure
meaning ⟜ inferred from context
stance ⟜ decking is interpretive; BNF is prescriptive
structure ⟜ intermediate leads are expendable in decking

## bidirectionality

**compression**: prose → deck
- Find leads hiding in prose
- Strip rubbish tokens
- Surface elaboration patterns
- Assign dash types

**expansion**: deck → prose
- Leads become sentences
- Elaborations flow naturally
- Structure dissolves but remains
- Dash types become prose connectors

## common patterns

**faceted comparison**
```
topic
primary ⟜ main elaboration
facet1 ⟜ semantic dimension
facet2 ⟜ another dimension
```

**typed elaborations**
```
lead
- support
~ contrast
+ commonality
? question
```

**nested structure**
```
lead ⟜ primary
  - support elaborating the primary
  ~ contrast to the primary
```

## notation conventions

**bold** ⟜ marks leads that anchor sections
`⟜` ⟜ primary elaboration, often on same line as lead
`-` ⟜ supporting elaboration
`~` ⟜ contrasting elaboration
`+` ⟜ commonality or addition
`·` ⟜ facet marker
`?` ⟜ empty placeholder or question

Standard quantifiers borrowed from BNF:
- `*` zero or more
- `+` one or more
- `?` zero or one (optional)

## remember

Decking isn't creating structure—it's naming the elaborative structure already present in text. Space is already a dash type. Commas already separate elaborations. Prepositions (by, for, with) already type relationships.

The grammar makes visible what was always there.

⊢ dashboard R&D ⊣ ◊ ⬡ ⟜ create [dashboard](dashboard.md) ⋆ revise to a console-based system ⊙ go back three steps ◉ done


