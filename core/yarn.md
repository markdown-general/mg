
## references

https://github.com/ekmett/hyperfunctions/issues/3

https://www.cs.ox.ac.uk/ralf.hinze/publications/CEFP09.pdf

https://cgi.cse.unsw.edu.au/~eptcs/paper.cgi?DSS2013.9.pdf

https://doisinkidney.com/pdfs/hyperfunctions.pdf

https://doisinkidney.com/posts/2021-03-14-hyperfunctions.html

https://www.schoolofhaskell.com/user/edwardk/moore/for-less#representing-transducers

Haskell libraries

https://hackage.haskell.org/package/hyperfunctions

https://hackage.haskell.org/package/Stream-0.4.7.2

~/repos/polyparse

~/repos/box

Previous builds

~/repos/mtok
~/repos/mpar/
~/repos/hyp/
~/repos/hyp1/

Categorical Properties
Hyperfunctions form a flabby sheaf:

Restriction maps (observing on smaller domains)
Gluing data (piecing together local observations)
The sheaf condition is about consistent observations

This sheaf structure is naturally coinductive:

You build hyperfunctions by specifying compatible local observations
Global objects emerge as limits of local data
Reminiscent of final coalgebras: unique extension given local observations


What does the machines library look like if you take out the monad? (MachineT Identity) or (Applicative f) => MachineT f.


## parsing

fast tokenization.

https://github.com/haskell/tokenize

https://github.com/klangner/glider-nlp/blob/master/src/Glider/NLP/Tokenizer.hs

https://guillaume-be.github.io/2021-09-16/byte_pair_encoding

https://hackage.haskell.org/package/flatparse

### hand-written

- a hand-written table/switch driven lexer. 
- a simple Recursive Descent parser
- a ReL(1) streaming lexer using a double layer switch-case


## bpe library

https://github.com/github/rust-gems/blob/main/crates/bpe/README.md

## lexer

https://www.reddit.com/r/Compilers/comments/z6qe98/best_approach_for_writing_a_lexer/

### string interning

The typedef keyword introduces an identifier that grammatically behaves different from all other identifiers in the grammar. That means the parser has to know whether an identifier has been typedef'd or not.

That means either the lexer -- or the (hand-written) parser -- has to check each identifier to see what kind it is. The table used for that has to be maintained during parsing.

https://en.wikipedia.org/wiki/Lexer_hack

EDIT Clang uses a hand-written parser and a non-standard grammar and (indirectly) checks the identifier kind in its actions (outside of the grammar proper). Eli Bendersky has documented it here:

https://eli.thegreenplace.net/2012/07/05/how-clang-handles-the-type-variable-name-ambiguity-of-cc/

There are some further complications when parsing C++...

Sending a string from the lexer to the parser for each identifier is clumsy (because it is variable-length and big-ish).

Putting the symbol table maintenance in the lexer (so the lexer can just send a pointer to a symbol table entry) is also clumsy because the lexer ends up knowing too much about different classes of symbol table and about scoping rules -- and it often needs to be tightly integrated with the parser.

The nicest solution I have found is to intern the identifier string and send the resulting (fixed-size, small-ish) value up to the parser. The lexer can ignore symbol tables entirely (except for the table needed for the lexer hack) and it makes it really easy for the parser to build proper symbol tables.

The intern is typically a pointer or an index into a string buffer. That means it won't be a good hash key by itself but it is easy to pass it through a uint32 -> uint32 (or whatever) hash function to get a good hash key.

https://en.wikipedia.org/wiki/String_interning
