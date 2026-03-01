URL: https://bartoszmilewski.com/2021/02/16/functorio/
Title: Functorio

204 Votes

You might have heard people say that functional programming is more academic, and real engineering is done in imperative style. I’m going to show you that real engineering is functional, and I’m going to illustrate it using a computer game that is designed by engineers for engineers. It’s a simulation game called Factorio, in which you are given resources that you have to explore, build factories that process them, create more and more complex systems, until you are finally able to launch a spaceship that may take you away from an inhospitable planet. If this is not engineering at its purest then I don’t know what is. And yet almost all you do when playing this game has its functional programming counterparts and it can be used to teach basic concepts of not only programming but also, to some extent, category theory. So, without further ado, let’s jump in.

## Functions

The building blocks of every programming language are functions. A function takes input and produces output. In Factorio they are called assembling machines, or assemblers. Here’s an assembler that produces copper wire.

If you bring up the info about the assembler you’ll see the recipe that it’s using. This one takes one copper plate and produces a pair of coils of copper wire.

This recipe is really a function signature in a strongly typed system. We see two types: copper plate and copper wire, and an arrow between them. Also, for every copper plate the assembler produces a pair of copper wires. In Haskell we would declare this function as

makeCopperWire :: CopperPlate -> (CopperWire, CopperWire)

Not only do we have types for different components, but we can combine types into tuples–here it’s a homogenous pair `(CopperWire, CopperWire)`. If you’re not familiar with Haskell notation, here’s what it might look like in C++:

std::pair<CopperWire, CopperWire> makeCopperWire(CopperPlate);

Here’s another function signature in the form of an assembler recipe:

It takes a pair of iron plates and produces an iron gear wheel. We could write it as

makeGear :: (IronPlate, IronPlate) -> Gear

or, in C++,

Gear makeGear(IronPlate, IronPlate);

Many recipes require a combination of differently typed ingredients, like the one for producing red science packs

 
We would declare this function as:

makeRedScience :: (CopperPlate, Gear) -> RedScience

Pairs are examples of product types. Factorio recipes use the plus sign to denote tuples; I guess this is because we often read a sum as “this and this”, and “and” introduces a product type. The assembler requires _both_ inputs to produce the output, so it accepts a product type. If it required either one, we’d call it a _sum type_.

We can also tuple more than two ingredients, as in this recipe for producing electronic circuits (or green circuits, as they are commonly called)

makeGreenCircuit :: 
 (CopperWire, CopperWire, CopperWire, IronPlate) -> GreenCircuit

Now suppose that you have at your disposal the raw ingeredients: iron plates and copper plates. How would you go about producing red science or green circuits? This is where function composition kicks in. You can pass the output of the copper wire assembler as the input to the green circuit assembler. (You will still have to tuple it with an iron plate.)

![](https://i0.wp.com/bartoszmilewski.com/wp-content/uploads/2020/10/cable.png?resize=121%2C50&ssl=1)

![](https://i0.wp.com/bartoszmilewski.com/wp-content/uploads/2020/10/green_circuit.png?resize=167%2C50&ssl=1)

Similarly, you can compose the gear assembler with the red science assembler.

![](https://i0.wp.com/bartoszmilewski.com/wp-content/uploads/2020/10/gear.png?resize=117%2C50&ssl=1)

![](https://i0.wp.com/bartoszmilewski.com/wp-content/uploads/2020/10/red_science.png?resize=183%2C50&ssl=1)

The result is a new function with the following signature

makeRedScienceFrom :: 
 (CopperPlate, IronPlate, IronPlate) -> RedScience

And this is the implementation:

makeRedScienceFrom (cu, fe1, fe2) = 
 makeRedScience (cu, makeGear (fe1, fe2))

You start with one copper plate and two iron plates. You feed the iron plates to the gear assembler. You pair the resulting gear with the copper plate and pass it to the red science assembler.

Most assemblers in Factorio take more than one argument, so I couldn’t come up with a simpler example of composition, one that wouldn’t require untupling and retupling. In Haskell we usually use functions in their curried form (we’ll come back to this later), so composition is easy there.

Composition is also a feature of a category, so we should ask the question if we can treat assemblers as arrows in a category. Their composition is obviously associative. But do we have an equivalent of an identity arrow? It is something that takes input of some type and returns it back unchanged. And indeed we have things called inserters that do exactly that. Here’s an inserter between two assemblers.

In fact, in Factorio, you have to use an inserter for direct composition of assemblers, but that’s an implementation detail (technically, inserting an identity function doesn’t change anything).

An inserter is actually a polymorphic function, just like the identity function in Haskell

inserter :: a -> a
inserter x = x

It works for any type `a`.

But the Factorio category has more structure. As we have seen, it supports finite products (tuples) of arbitrary types. Such a category is called _cartesian_. (We’ll talk about the unit of this product later.)

Notice that we have identified multiple Factorio subsystem as functions: assemblers, inserters, compositions of assemblers, etc. In a programming language they would all be just functions. If we were to design a language based on Factorio (we could call it _Functorio_), we would enclose the composition of assemblers into an assembler, or even make an assembler that takes two assemblers and produces their composition. That would be a higher-order assembler.

## Higher order functions

The defining feature of functional languages is the ability to make functions first-class objects. That means the ability to pass a function as an argument to another function, and to return a function as a result of another function. For instance, we should have a recipe for producing assemblers. And, indeed, there is such recipe. All it needs is green circuits, some gear wheels, and a few iron plates:

If Factorio were a strongly typed language all the way, there would be separate recipes for producing different assemblers (that is assemblers with different recipes). For instance, we could have:

makeRedScienceAssembler :: 
 (GreenCircuit, Gear, IronPlate) -> RedScienceAssembler

Instead, the recipe produces a generic assembler, and it lets the player manually set the recipe in it. In a way, the player provides one last ingredient, an element of the enumeration of all possible recipes. This enumeration is displayed as a menu of choices:

After all, Factorio is an interactive game.

Since we have identified the inserter as the identity function, we should have a recipe for producing it as well. And indeed there is one:

Do we also have functions that take functions as arguments? In other words, recipes that use assemblers as input? Indeed we do:

Again, this recipe accepts a generic assembler that hasn’t been assigned its own recipe yet.

This shows that Factorio supports higher-order functions and is indeed a functional language. What we have here is a way of treating functions (assemblers) not only as arrows between objects, but also as objects that can be produced and consumed by functions. In category theory, such objectified arrow types are called exponential objects. A category in which arrow types are represented as objects is called _closed_, so we can view Factorio as a cartesian closed category.

In a strongly typed Factorio, we could say that the object `RedScienceAssembler`

is equivalent to its recipe

type RedScienceAssembler = 
 (CopperPlate, Gear) -> RedScience

We could then write a higher-order recipe that produces this particular assembler as:

makeRedScienceAssembler :: 
 (GreenCircuit, Gear, IronPlate) 
 -> ((CopperPlate, Gear) -> RedScience)

Similarly, in a strongly typed Factorio we would replace this higher-order recipe

with the following signature

makeGreenScience :: ((a -> a), Belt) -> GreenScience

assuming that the inserter is a polymorphic function `a -> a`.

## Linear types

There is one important aspect of functional programming that seems to be broken in Factorio. Functions are supposed to be pure: mutation is a no-no. And in Factorio we keep talking about assemblers _consuming_ resources. A pure function doesn’t consume its arguments–you may pass the same item to many functions and it will still be there. Dealing with resources is a real problem in programming in general, including purely functional languages. Fortunately there are clever ways of dealing with it. In C++, for instance, we can use unique pointers and move semantics, in Rust we have ownership types, and Haskell recently introduced linear types. What Factorio does is very similar to Haskell’s linear types. A linear function is a function that is guaranteed to consume its argument. Functorio assemblers are linear functions.

Factorio is all about consuming and transforming resources. The resources originate as various ores and coal in mines. There are also trees that can be chopped to yield wood, and liquids like water or crude oil. These external resources are then consumed, linearly, by your industry. In Haskell, we would implement it by passing a linear function called a continuation to the resource producer. A linear function guarantees to consume the resource completely (no resource leaks) and not to make multiple copies of the same resource. These are the guarantees that the Factorio industrial complex provides automatically.

## Currying

Of course Factorio was not designed to be a programming language, so we can’t expect it to implement every aspect of programming. It is fun though to imagine how we would translate some more advanced programming features into Factorio. For instance, how would currying work? To support currying we would first need partial application. The idea is pretty simple. We have already seen that assemblers can be treated as first class objects. Now imagine that you could produce assemblers with a set recipe (strongly typed assemblers). For instance this one:

It’s a two-input assembler. Now give it a single copper plate, which in programmer speak is called _partial application_. It’s partial because we haven’t supplied it with an iron gear. We can think of the result of partial application as a new single-input assembler that expects an iron gear and is able to produce one beaker of red science. By partially applying the function `makeRedScience`

makeRedScience :: (CopperPlate, Gear) -> RedScience

we have created a new function of the type

Gear -> RedScience

In fact we have just designed a process that gave us a (higher-order) function that takes a copper plate and creates a “primed” assembler that only needs an iron gear to produce red science:

makeGearToRedScience :: CopperPlate -> (Gear -> RedScience)

In Haskell, we would implement this function using a lambda expression

makeGearToRedScience cu = \\gear -> makeRedScience (cu, gear)

Now we would like to automate this process. We want to have something that takes a two-input assembler, for instance `makeRedScience`, and returns a single input assembler that produces another “primed” single-input assembler. The type signature of this beast would be:

curryRedScienceAssembler ::
 ((CopperPlate, Gear) -> RedScience) -- RedScienceAssembler
 -> (CopperPlate -> (Gear -> RedScience))

We would implement it as a double lambda:

curryRedScienceAssembler rsAssembler = 
 \\cu -> (\\gear -> rsAssembler (cu, gear))

Notice that it really doesn’t matter what the concrete types are. What’s important is that we can turn a function that takes a pair of arguments into a function that returns a function. We can make it fully polymorphic:

curry :: ((a, b) -> c) 
 -> (a -> (b -> c))

Here, the type variables `a`, `b` and `c` can be replaced with any types (in particular, `CopperPlate`, `Gear`, and `RedScience`). 
This is a Haskell implementation:

curry f = \\a -> \\b -> f (a, b)

## Functors

So far we haven’t talked about how arguments (items) are delivered to functions (assemblers). We can manually drop items into assemblers, but that very quickly becomes boring. We need to automate the delivery systems. One way of doing it is by using some kind of containers: chests, train wagons, barrels, or conveyor belts. In programming we call these _functors_. Strictly speaking a functor can hold only one type of items at a time, so a chest of iron plates should be a different type than a chest of gears. Factorio doesn’t enforce this but, in practice, we rarely mix different types of items in one container.

The important property of a functor is that you can apply a function to its contents. This is best illustrated with conveyor belts. Here we take the recipe that turns a copper plate into copper wire and apply it to a whole conveyor belt of copper (coming from the right) to produce a conveyor belt of copper wire (going to the left).

The fact that a belt can carry any type of items can be expressed as a type constructor–a data type parameterized by an arbitrary type `a`

data Belt a

You can apply it to any type to get a belt of specific items, as in

Belt CopperPlate

We will model belts as Haskell lists.

data Belt a = MakeBelt \[a\]

The fact that it’s a functor is expressed by implementing a polymorphic function `mapBelt`

mapBelt :: (a -> b) -> (Belt a -> Belt b)

This function takes a function `a->b` and produces a function that transforms a belt of `a`s to a belt of `b`s. So to create a belt of (pairs of) copper wire we’ll map the assembler that implements `makeCoperWire` over a belt of `CopperPlate`

makeBeltOfWire :: (Belt CopperPlate) -> (Belt (CopperWire, CopperWire))
makeBeltOfWire = mapBelt makeCopperWire

You may think of a belt as corresponding to a list of elements, or an infinite stream, depending on the way you use it.

In general, a type constructor `F` is called a functor if it supports the mapping of a function over its contents:

map :: (a -> b) -> (F a -> F b)

## Sum types

Uranium ore processing is interesting. It is done in a centrifuge, which accepts uranium ore and produces two isotopes of Uranium.

The new thing here is that the output is probabilistic. Most of the time (on average, 99.3% of the time) you’ll get Uranium 238, and only occasionally (0.7% of the time) Uranium 235 (the glowy one). Here the plus sign is used to actually encode a sum type. In Haskell we would use the `Either` type constructor, which generates a sum type:

makeUranium :: UraniumOre -> Either U235 U238

In other languages you might see it called a _tagged union_.

The two alternatives in the output type of the centrifuge require different actions: U235 can be turned into fuel cells, whereas U238 requires reprocessing. In Haskell, we would do it by pattern matching. We would apply one function to deal with U235 and another to deal with U238. In Factorio this is accomplished using filter inserters (a.k.a., purple inserters). A filter inserter corresponds to a function that picks one of the alternatives, for instance:

filterInserterU235 :: Either U235 U238 -> Maybe U235

The `Maybe` data type (or `Optional` in some languages) is used to accommodate the possibility of failure: you can’t get `U235` if the union contained `U238`.

Each filter inserter is programmed for a particular type. Below you see two purple inserters used to split the output of the centrifuge into two different chests:

Incidentally, a mixed conveyor belt may be seen as carrying a sum type. The items on the belt may be, for instance, either copper wire or steel plates, which can be written as `Either CopperWire SteelPlate`. You don’t even need to use purple inserters to separate them, as any inserter becomes selective when connected to the input of an assembler. It will only pick up the items that are the inputs of the recipe for the given assembler.

## Monoidal functors

Every conveyor belt has two sides, so it’s natural to use it to transport pairs. In particular, it’s possible to merge a pair of belts into one belt of pairs.

We don’t use an assembler to do it, just some belt mechanics, but we can still think of it as a function. In this case, we would write it as

(Belt CopperPlate, Belt Gear) -> Belt (CopperPlate, Gear)

In the example above, we map the red science function over it

streamRedScience :: Belt (CopperPlate, Gear) -> Belt RedScience
streamRedScience beltOfPairs = mapBelt makeRedScience beltOfPairs

Since `makeRedScience` has the signature

makeRedScience :: (CopperPlate, Gear) -> RedScience

it all type checks.

Since we can apply belt merging to any type, we can write it as a polymorphic function

mergeBelts :: (Belt a, Belt b) -> Belt (a, b)
mergeBelts (MakeBelt as, MakeBelt bs) = MakeBelt (zip as bs)

(In our Haskell model, we have to zip two lists together to get a list of pairs.)

`Belt` is a functor. In general, a functor that has this kind of merging ability is called a _monoidal functor_, because it preserves the monoidal structure of the category. Here, the monoidal structure of the Factorio category is given by the product (pairing). Any monoidal functor `F` must preserve the product:

(F a, F b) -> F (a, b)

There is one more aspect to monoidal structure: the unit. The unit, when paired with anything, does nothing to it. More precisely, a pair `(Unit, a)` is, for all intents and purposes, equivalent to `a`. The best way to understand the unit in Factorio is to ask the question: The belt of what, when merged with the belt of `a`, will produce a belt of `a`? The answer is: the belt of nothing. Merging an empty belt with any other belt, makes no difference.

So emptiness is the monoidal unit, and we have, for instance:

(Belt CopperPlate, Belt Nothing) -> Belt CopperPlate

The ability to merge two belts, together with the ability to create an empty belt, makes `Belt` a monoidal functor. In general, besides preserving the product, the condition for the functor `F` to be monoidal is the ability to produce

F Nothing

Most functors, at least in Factorio, are not monoidal. For instance, chests cannot store pairs.

## Applicative functors

As I mentioned before, most assembler recipes take multiple arguments, which we modeled as tuples (products). We also talked about partial application which, essentially, takes an assembler and one of the ingredients and produces a “primed” assembler whose recipe requires one less ingredient. Now imagine that you have a whole belt of a single ingredient, and you map an assembler over it. In current Factorio, this assembler will accept one item and then get stuck waiting for the rest. But in our extended version of Factorio, which we call Functorio, mapping a multi-input assembler over a belt of single ingredient should produce a belt of “primed” assemblers. For instance, the red science assembler has the signature 

(CopperPlate, Gear) -> RedScience

When mapped over a belt of `CopperPlate` it should produce a belt of partially applied assemblers, each with the recipe:

Gear -> RedScience

Now suppose that you have a belt of gears ready. You should be able to produce a belt of red science. If there only were a way to apply the first belt over the second belt. Something like this:

(Belt (Gear -> RedScience), Belt Gear) -> Belt RedScience

Here we have a belt of primed assemblers and a belt of gears and the output is a belt of red science.

A functor that supports this kind of merging is called an _applicative functor_. `Belt` is an applicative functor. In fact, we can tell that it’s applicative because we’ve established that it’s monoidal. Indeed, monoidality lets us merge the two belts to get a belt of pairs

Belt (Gear -> RedScience, Gear)

We know that there is a way of applying the `Gear->RedScience` assembler to a `Gear` resulting in `RedScience`. That’s just how assemblers work. But for the purpose of this argument, let’s give this application an explicit name: `eval`.

eval :: (Gear -> RedScience, Gear) -> RedScience
eval (gtor, gr) = gtor gr

(`gtor gr` is just Haskell syntax for applying the function `gtor` to the argument `gr`). We are abstracting the basic property of an assembler that it can be applied to an item.

Now, since `Belt` is a functor, we can map `eval` over our belt of pairs and get a belt of `RedScience`.

apBelt :: (Belt (Gear -> RedScience), Belt Gear) -> Belt RedScience
apBelt (gtors, gear) = mapBelt eval (mergeBelts (gtors, gears))

Going back to our original problem: given a belt of copper plate and a belt of gear, this is how we produce a belt of red science:

redScienceFromBelts :: (Belt CopperPlate, Belt Gear) -> Belt RedScience
redScienceFromBelts (beltCu, beltGear) = 
 apBelt (mapBelt (curry makeRedScience) beltCu, beltGear)

We curry the two-argument function `makeRedScience` and map it over the belt of copper plates. We get a beltful of primed assemblers. We then use `apBelt` to apply these assemblers to a belt of gears.

To get a general definition of an applicative functor, it’s enough to replace `Belt` with generic functor `F`, `CopperPlate` with `a`, and `Gear` with `b`. A functor `F` is applicative if there is a polymorphic function:

(F (a -> b), F a) -> F b

or, in curried form,

F (a -> b) -> F a -> F b

To complete the picture, we also need the equivalent of the monoidal unit law. A function called `pure` plays this role:

pure :: a -> F a

This just tell you that there is a way to create a belt with a single item on it.

## Monads

In Factorio, the nesting of functors is drastically limited. It’s possible to produce belts, and you can put them on belts, so you can have a beltful of belts, `Belt Belt`. Similarly you can store chests inside chests. But you can’t have belts of _loaded_ belts. You can’t pick a belt filled with copper plates and put it on another belt. In other words, you cannot transport beltfuls of stuff. Realistically, that wouldn’t make much sense in real world, but in Functorio, this is exactly what we need to implement monads. So imagine that you have a belt carrying a bunch of belts that are carrying copper plates. If belts were monadic, you could turn this whole thing into a single belt of copper plates. This functionality is called `join` (in some languages, “flatten”):

join :: Belt (Belt CopperPlate) -> Belt CopperPlate

This function just gathers all the copper plates from all the belts and puts them on a single belt. You can thing of it as concatenating all the subbelts into one.

Similarly, if chests were monadic (and there’s no reason they shouldn’t be) we would have:

join :: Chest (Chest Gear) -> Chest Gear

A monad must also support the applicative `pure` (in Haskell it’s called `return`) and, in fact, every monad is automatically applicative.

## Conclusion

There are many other aspects of Factorio that lead to interesting topics in programming. For instance, the train system requires dealing with concurrency. If two trains try to enter the same crossing, we’ll have a data race which, in Functorio, is called a train crash. In programming, we avoid data races using locks. In Factorio, they are called train signals. And, of course, locks lead to deadlocks, which are very hard to debug in Factorio.

In functional programming we might use STM (Software Transactional Memory) to deal with concurrency. A train approaching a crossing would start a _crossing transaction_. It would temporarily ignore all other trains and happily make the crossing. Then it would attempt to commit the crossing. The system would then check if, in the meanwhile, another train has successfully commited the same crossing. If so, it would say “oops! try again!”.
