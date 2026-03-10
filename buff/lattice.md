# work/lattice.md

**lattice** ⟜ parallel structure across aligned decks

A lattice interleaves multiple decks with matching structure, showing how the same leads play out across different contexts. Each row shows one lead elaborated three ways (or more).

## transformations

### three decks → lattice

**Pattern** ⟜ align decks by matching leads, create rows with shared lead + multiple slugs

**Structure**:
```
Row 1: [blank] ◊ [deck1 concept lead] ⟜ [deck2 concept lead] ↦ [deck3 concept lead]
Row 2: [blank] ◊ [deck1 concept slug] ⟜ [deck2 concept slug] ↦ [deck3 concept slug]
Row 3+: [shared lead] ◊ [deck1 slug] ⟜ [deck2 slug] ↦ [deck3 slug]
```

**Lossless** ⟜ yes - all content from all decks preserved

**Example - Starting Decks**:

Deck 1:
```markdown
**U+25CA (◊)** ⟜ the lozenge

**Unicode** ⟜ Version 1.1 (1993) - over 30 years of support

**Block** ⟜ Geometric Shapes - fundamental and universally needed

**Font Support** ⟜ Excellent - included in almost all Unicode fonts

**Visual Metaphor** ⟜ Diamond shape naturally suggests balance and opposition
```

Deck 2:
```markdown
**U+27DC (⟜)** ⟜ left multimap

**Unicode** ⟜ Version 3.2 (2002) - about 22 years of support

**Block** ⟜ Miscellaneous Mathematical Symbols-A - specialized mathematical use

**Font Support** ⟜ Good - present in mathematical fonts, patchy in general fonts

**Visual Metaphor** ⟜ Leftward multimap suggests transformation, elaboration, unwinding
```

Deck 3:
```markdown
**U+21A6 (↦)** ⟜ rightwards arrow from bar

**Unicode** ⟜ Version 1.1 (1993) - same vintage as ◊

**Block** ⟜ Arrows - fundamental and widely needed

**Font Support** ⟜ Very good - included in most Unicode fonts

**Visual Metaphor** ⟜ "maps to" - perfect for token transforming into elaboration
```

**Result - Lattice**:
```markdown
**Symbol** ◊ U+25CA (◊) ⟜ U+27DC (⟜) ↦ U+21A6 (↦)

**Name** ◊ the lozenge ⟜ left multimap ↦ rightwards arrow from bar

**Unicode** ◊ Version 1.1 (1993) - over 30 years of support ⟜ Version 3.2 (2002) - about 22 years of support ↦ Version 1.1 (1993) - same vintage as ◊

**Block** ◊ Geometric Shapes - fundamental and universally needed ⟜ Miscellaneous Mathematical Symbols-A - specialized mathematical use ↦ Arrows - fundamental and widely needed

**Font Support** ◊ Excellent - included in almost all Unicode fonts ⟜ Good - present in mathematical fonts, patchy in general fonts ↦ Very good - included in most Unicode fonts

**Visual Metaphor** ◊ Diamond shape naturally suggests balance and opposition ⟜ Leftward multimap suggests transformation, elaboration, unwinding ↦ "maps to" - perfect for token transforming into elaboration
```

### lattice → table

**Pattern** ⟜ leads become row headers (first column), symbols become column headers

**Structure**:
```
| [first lead] | [symbol1] | [symbol2] | [symbol3] |
|--------------|-----------|-----------|-----------|
| [row2 lead]  | [slug1]   | [slug2]   | [slug3]   |
...
```

**Lossless** ⟜ yes - all content preserved in table cells

**Example - Starting Lattice**:
```markdown
**Symbol** ◊ U+25CA (◊) ⟜ U+27DC (⟜) ↦ U+21A6 (↦)

**Name** ◊ the lozenge ⟜ left multimap ↦ rightwards arrow from bar

**Unicode** ◊ Version 1.1 (1993) - over 30 years of support ⟜ Version 3.2 (2002) - about 22 years of support ↦ Version 1.1 (1993) - same vintage as ◊

**Font Support** ◊ Excellent - included in almost all Unicode fonts ⟜ Good - present in mathematical fonts, patchy in general fonts ↦ Very good - included in most Unicode fonts

**Visual Metaphor** ◊ Diamond shape naturally suggests balance and opposition ⟜ Leftward multimap suggests transformation, elaboration, unwinding ↦ "maps to" - perfect for token transforming into elaboration
```

**Result - Table**:
```markdown
| Symbol | U+25CA (◊) | U+27DC (⟜) | U+21A6 (↦) |
|----------|---|---|---|
| Name | the lozenge | left multimap | rightwards arrow from bar |
| Unicode | Version 1.1 (1993) - over 30 years of support | Version 3.2 (2002) - about 22 years of support | Version 1.1 (1993) - same vintage as ◊ |
| Font Support | Excellent - included in almost all Unicode fonts | Good - present in mathematical fonts, patchy in general fonts | Very good - included in most Unicode fonts |
| Visual Metaphor | Diamond shape naturally suggests balance and opposition | Leftward multimap suggests transformation, elaboration, unwinding | "maps to" - perfect for token transforming into elaboration |
```

### table → lattice

**Pattern** ⟜ row headers become leads, column headers become symbols, cells become slugs

**Lossless** ⟜ yes - reversible transformation

**Algorithm**:
```
for each row:
  lead = row_header
  for each column (after first):
    symbol = column_header
    slug = cell_content
    output: **{lead}** {symbol} {slug}
```

### lattice → three decks

**Pattern** ⟜ extract columns, first two rows become deck concept/name

**Structure**:
```
Deck N:
**{row1_slugN}** ⟜ {row2_slugN}
**{row3_lead}** ⟜ {row3_slugN}
**{row4_lead}** ⟜ {row4_slugN}
...
```

**Lossless** ⟜ yes, but row1/row2 leads become structural (headers, context)

**Example - Starting Lattice**:
```markdown
**Symbol** ◊ U+25CA (◊) ⟜ U+27DC (⟜) ↦ U+21A6 (↦)

**Name** ◊ the lozenge ⟜ left multimap ↦ rightwards arrow from bar

**Unicode** ◊ Version 1.1 (1993) ⟜ Version 3.2 (2002) ↦ Version 1.1 (1993)

**Font Support** ◊ Excellent ⟜ Good in math fonts ↦ Very good
```

**Result - Deck 1 (Lozenge)**:
```markdown
**U+25CA (◊)** ⟜ the lozenge

**Unicode** ⟜ Version 1.1 (1993)

**Font Support** ⟜ Excellent
```

**Result - Deck 2 (Multimap)**:
```markdown
**U+27DC (⟜)** ⟜ left multimap

**Unicode** ⟜ Version 3.2 (2002)

**Font Support** ⟜ Good in math fonts
```

**Result - Deck 3 (Arrow)**:
```markdown
**U+21A6 (↦)** ⟜ rightwards arrow from bar

**Unicode** ⟜ Version 1.1 (1993)

**Font Support** ⟜ Very good
```

## curating a lattice

**Pattern** ⟜ merge redundant rows, prune verbose slugs, preserve structure

Curation follows the curate deck principles:

**sculpt** ⟜ identify semantic overlap, merge rows with redundant information

**prune** ⟜ remove verbose phrasing while preserving semantic core

**structure** ⟜ keep all rows, keep all slugs (unless explicitly restructuring)

**trace** ⟜ find weak or redundant connections between rows

**breathe** ⟜ compact but don't crush - leave readability space

### merge operations

**Starting Rows**:
```markdown
**Unicode** ◊ Version 1.1 (1993) - over 30 years of support ⟜ Version 3.2 (2002) - about 22 years of support ↦ Version 1.1 (1993) - same vintage as ◊

**Age** ◊ ~30 years - mature, well-established character ⟜ ~22 years - established but younger than geometric basics ↦ ~30 years - mature, well-established
```

**Analysis** ⟜ both rows say "how old is this?" - redundant semantic territory

**Merged Row**:
```markdown
**Age** ◊ Unicode v1.1 (1993) - mature ⟜ Unicode v3.2 (2002) - younger ↦ Unicode v1.1 (1993) - mature
```

**Merge principles**:
- Choose simpler lead (**Age** over **Unicode**)
- Preserve key technical details (version numbers, dates)
- Remove redundancy (~30 years already evident from 1993)
- Keep distinguishing terms (mature vs younger)

### pruning operations

**Starting Row**:
```markdown
**Visual Metaphor** ◊ Diamond shape naturally suggests balance and opposition ⟜ Leftward multimap suggests transformation, elaboration, unwinding ↦ "maps to" - perfect for token transforming into elaboration
```

**Pruned Row**:
```markdown
**Visual Metaphor** ◊ balance and opposition ⟜ transformation, elaboration ↦ token transforming into elaboration
```

**Pruning principles**:
- Remove subject references ("Diamond shape", "Leftward multimap")
- Keep semantic core (balance, transformation, token→elaboration)
- Lead already identifies what we're talking about
- Preserve key differentiating phrases

### full curation example

**Starting Lattice** (9 rows):
```markdown
**Symbol** ◊ U+25CA (◊) ⟜ U+27DC (⟜) ↦ U+21A6 (↦)

**Name** ◊ the lozenge ⟜ left multimap ↦ rightwards arrow from bar

**Unicode** ◊ Version 1.1 (1993) - over 30 years of support ⟜ Version 3.2 (2002) - about 22 years of support ↦ Version 1.1 (1993) - same vintage as ◊

**Age** ◊ ~30 years - mature, well-established character ⟜ ~22 years - established but younger than geometric basics ↦ ~30 years - mature, well-established

**Block** ◊ Geometric Shapes - fundamental and universally needed ⟜ Miscellaneous Mathematical Symbols-A - specialized mathematical use ↦ Arrows - fundamental and widely needed

**Font Support** ◊ Excellent - included in almost all Unicode fonts ⟜ Good - present in mathematical fonts, patchy in general fonts ↦ Very good - included in most Unicode fonts

**HTML Entity** ◊ &loz; or &lozenge; - named entity available ⟜ &#x27DC; or &#10204; - numeric entity only ↦ &#x21A6; or &map; - named entity available

**Common Usage** ◊ High - familiar in cards, heraldry, geometry ⟜ Low - mathematical notation, emerging in documentation patterns ↦ Medium - familiar in mathematics, programming

**Rendering** ◊ Reliable across modern systems and applications ⟜ Reliable in modern systems with math font support ↦ Highly reliable across systems

**Fallback** ◊ Minimal risk - geometric shapes are standard font components ⟜ Moderate risk - mathematical symbols less universally included ↦ Low risk - arrows are standard font components

**Visual Metaphor** ◊ Diamond shape naturally suggests balance and opposition ⟜ Leftward multimap suggests transformation, elaboration, unwinding ↦ "maps to" - perfect for token transforming into elaboration
```

**Curated Lattice** (9 rows):
```markdown
**Symbol** ◊ U+25CA (◊) ⟜ U+27DC (⟜) ↦ U+21A6 (↦)

**Name** ◊ lozenge ⟜ left multimap ↦ rightwards arrow from bar

**Age** ◊ v1.1 (1993) - mature ⟜ v3.2 (2002) - younger ↦ v1.1 (1993) - mature

**Block** ◊ Geometric Shapes - fundamental ⟜ Math Symbols-A - specialized ↦ Arrows - fundamental

**Font Support** ◊ Excellent - almost all Unicode fonts ⟜ Good - present in math fonts, patchy in general ↦ Very good - most Unicode fonts

**HTML Entity** ◊ &loz; ⟜ &#x27DC; ↦ &map;

**Common Usage** ◊ High - cards, heraldry, geometry ⟜ Low - mathematical notation, emerging in docs ↦ Medium - mathematics, programming

**Reliability** ◊ minimal risk - geometric shapes standard ⟜ moderate risk - math symbols less universal ↦ low risk - arrows standard

**Visual Metaphor** ◊ balance and opposition ⟜ transformation, elaboration ↦ token transforming into elaboration
```

**Operations performed**:
- Merged Unicode + Age → Age
- Merged Rendering + Fallback → Reliability
- Pruned "the" from lozenge
- Pruned "Unicode" prefix, kept v1.1/v3.2
- Pruned "fundamental and universally needed" → "fundamental"
- Kept font support proof ("almost all", "patchy in general", "most")
- Kept actual HTML codes (&#x27DC;)
- Pruned subject references from Visual Metaphor
- Preserved all distinguishing information

## control levers

Transformations operate along several dualities:

**lossless ◊ rewrite**
- Lossless: preserve all content exactly, mechanical transformation
- Rewrite: extract semantic core, rephrase, reorganize freely
- Use lossless to see what's on the cutting room floor
- Use rewrite when semantic essence matters more than exact phrasing

**preserve structure ◊ disrespect structure**
- Preserve: keep all rows, keep all slugs (constraint-based curation)
- Disrespect: delete rows, delete slugs, reorganize freely
- Preserving structure forces tight pruning within fixed skeleton
- Disrespecting structure allows major reorganization

**merge ◊ split**
- Merge: combine redundant rows, condense overlapping information
- Split: separate mixed concepts, elaborate compressed information
- Merge reduces row count, increases slug density
- Split increases row count, decreases slug density

**tight ◊ loose**
- Tight: all components present, minimal gaps, high information density
- Loose: gaps allowed, breathing room, lower information density
- Tight decks scan as complete reference
- Loose decks scan as sketches or outlines

These levers interact: a lossless, structure-preserving curation relies on merge+tight to achieve compression without deletion.

## algorithmic transformations

For programmatic manipulation of large structures:

### three decks → lattice
```
concepts = [deck1.concept, deck2.concept, deck3.concept]
names = [deck1.name, deck2.name, deck3.name]

output row1: "** **" + join(symbols[i] + " " + concepts[i])
output row2: "** **" + join(symbols[i] + " " + names[i])

for each lead in shared_leads:
  slugs = [deck1.get_slug(lead), deck2.get_slug(lead), deck3.get_slug(lead)]
  output: "**" + lead + "**" + join(symbols[i] + " " + slugs[i])
```

### lattice → table
```
headers = [""] + extract_symbols_from_row1()

for each row in lattice:
  cells = [row.lead] + row.slugs
  output: "| " + join(cells, " | ") + " |"
```

### table → lattice
```
symbols = table.headers[1:]  # skip first column

for each row in table.rows:
  lead = row[0]
  slugs = row[1:]
  output: "**" + lead + "**" + join(symbols[i] + " " + slugs[i])
```

### merge rows algorithm
```
def merge_rows(row1, row2, new_lead):
  merged_slugs = []
  for i in range(len(row1.slugs)):
    # extract semantic cores from both slugs
    core1 = extract_core(row1.slugs[i])
    core2 = extract_core(row2.slugs[i])
    # combine non-redundant elements
    merged = combine_cores(core1, core2)
    merged_slugs.append(merged)
  
  return Row(lead=new_lead, slugs=merged_slugs)
```

## usage patterns

**Comparison across variants** ⟜ lattice shows differences side-by-side

**Dense reference** ⟜ table for quick lookup, scanning

**Narrative presentation** ⟜ individual decks for linear reading

**Collaborative curation** ⟜ identify redundancy, calibrate semantic weight, prune together

**Agentic processing** ⟜ algorithmic transformations on large content sets

## a lattice

We can combine two decks with similar shape into a lattice. Here is an example, formed from the curate deck and the (renamed) river metaphor deck.

**Curation as a River** ⟜ shaping content ⟞ content as landscape carved by river flow

**sculpt** ⟜ find form with sparse graph surgery, density analytics, semantic weight calibration ⟞ removing surface layers to reveal bedrock form

**prune** ⟜ identify rich connections, remove fuzzy edges, preserve core meanings ⟞ clears debris and deadwood, keeping the channel clear

**structure** ⟜ respect structure, preserve relationships ⟞ creates banks that guide without constraining the current

**trace** ⟜ trace paths, find loose ends, strengthen living connections ⟞ follows established pathways - navigating with the flow

**breathe** ⟜ place space for future elaborations. use clearly vague gap words as semantic breath ⟞ leaves room for new tributaries to form naturally


## example

This is a perfect transformation. It's much easier to work with than the original response which was great. Note that the information is still all there in the lattice. 

A lattice makes visible the surrounding metaphorical terrain you have just traversed and that helps a lot understanding the content.

### original

```
base ⟜ foundational concepts, system documentation evoke ⟜ collaboration patterns, interaction modes

Alternative Word Pairs
1. Core / Flow
Core ⟜ foundational principles, unchanging truths
Flow ⟜ dynamic interactions, collaborative patterns

2. Root / Current
Root ⟜ system foundations, bedrock concepts
Current ⟜ living interactions, flowing collaboration

3. Axiom / Alloy
Axiom ⟜ self-evident truths, system principles
Alloy ⟜ fusion of perspectives, collaborative creation

4. Law / Loom
Law ⟜ governing principles, system rules
Loom ⟜ weaving together, collaborative creation

5. Foundation / Field
Foundation ⟜ base structure, supporting principles
Field ⟜ space of interaction, fertile ground

6. Truth / Transform
Truth ⟜ foundational concepts, enduring principles
Transform ⟜ change processes, collaborative methods

7. Still / Stream
Still ⟜ unchanging foundations, core principles
Stream ⟜ flowing interaction, collaborative currents
```

**lattice version**

```
### alternative word pairs

commons ⟜ The shared space that contains both foundations and interactions
    ⟟ base ⟜ foundational concepts, system documentation
    ⟞ evoke ⟜ collaboration patterns, interaction modes

essence ⟜ The fundamental nature of being and becoming
    ⟟ core ⟜ unchanging foundations, core principles
    ⟞ flow ⟜ living interactions, flowing collaboration

organism ⟜ Living system with structure and flow
    ⟟ root ⟜ system foundations, bedrock concepts
    ⟞ current ⟜ living interactions, flowing collaboration

synthesis ⟜ The union of universal principles and collaborative fusion
    ⟟ axiom ⟜ self-evident truths, system principles
    ⟞ alloy ⟜ fusion of perspectives, collaborative creation

pattern ⟜ The structure that both governs and enables creation
    ⟟ law ⟜ governing principles, system rules
    ⟞ loom ⟜ weaving together, collaborative creation

ground ⟜ The supportive space that both structures and enables interaction
    ⟟ foundation ⟜ base structure, supporting principles
    ⟞ field ⟜ space of interaction, fertile ground

clarity ⟜ The enduring quality that reveals both principles and processes
    ⟟ truth ⟜ foundational concepts, enduring principles
    ⟞ transform ⟜ change processes, collaborative methods

balance ⟜ The equilibrium between stability and movement
    ⟟ still ⟜ unchanging foundations, core principles
    ⟞ stream ⟜ flowing interaction, collaborative currents

key ⟜ line category
    ⟟ structure ⟜ the contained, foundational aspects
    ⟞ flow ⟜ the dynamic, transformative aspects
```

This is how semantic depth of a response can be examined.

upstream: ability to create or (re)create a lattice from this style of response.




