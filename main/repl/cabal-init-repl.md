# cabal-init-repl ⟜ Initialize new repl library project

Create ~/repos/repl/ as a fresh Haskell library with cabal. Develop against ~/repos/hyp/hyp.cabal. Single module, minimal dependencies, clean build ready.

◊ ⊢ initialize repl library project ⊣
  ⟜ create ~/repos/repl/ directory structure
  ⟜ create cabal.project (points to .)
  ⟜ create repl.cabal with base + process dependencies
  ⟜ create LICENSE file (BSD-3-Clause)
  ⟜ create stub src/Repl.hs (empty module)
  ⟜ build and verify clean build

✓ ready to implement startRepl and queryRepl functions

## files to create

```
~/repos/repl/
├── cabal.project
├── repl.cabal
├── LICENSE
└── src/
    └── Repl.hs
```

## cabal.project

```
packages: .
```

Start with just repl. Will add hyp1 dependency when we're ready to import from it.

## repl.cabal

```cabal
cabal-version: 3.0
name: repl
version: 0.1.0.0
license: BSD-3-Clause
license-file: LICENSE
copyright: (c) 2026
category: language
author: Anonymous
maintainer: tonyday567@gmail.com
synopsis: Query tool for GHCi sessions
description:
  File-based message passing protocol for querying GHCi instances.
  Used for agentic type wrangling and interactive code exploration.

build-type: Simple

tested-with:
  ghc ==9.14.1

common ghc-options-stanza
  ghc-options:
    -Wall
    -Wcompat
    -Widentities
    -Wincomplete-record-updates
    -Wincomplete-uni-patterns
    -Wpartial-fields
    -Wredundant-constraints

common ghc2024-stanza
  default-language: GHC2024

library
  import: ghc-options-stanza
  import: ghc2024-stanza
  hs-source-dirs: src
  build-depends:
    base >=4.14 && <5,
    process >=1.6 && <1.7
  exposed-modules:
    Repl
```

## LICENSE

BSD-3-Clause boilerplate:

```
Copyright (c) 2026

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

1. Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived
   from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS
OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
```

## src/Repl.hs

```haskell
module Repl where
```

Stub for now. Will add functions after wiring cabal repl.

## execution

```bash
mkdir -p ~/repos/repl/src
cd ~/repos/repl

# Create the four files above

# Build to verify
cabal build

# Start repl for type wrangling
cd ~/repos/repl
cabal repl
```

## expectations

Clean build. No dependencies beyond base + process. One module. Ready to add functions.

Once this builds, ready to implement startRepl and queryRepl functions for wrapping the file-based protocol.
