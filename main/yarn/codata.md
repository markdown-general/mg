
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

