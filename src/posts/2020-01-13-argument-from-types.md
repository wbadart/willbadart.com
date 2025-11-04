---
title:  The Argument from Types
published: 2020-01-13
tags:
- data science
- software engineering
- haskell
categories:
- hdsk
---

In the last post, we examined how software engineers construct
arguments for correctness. In doing so, we identified
"well-typedness," the property of a program absent type errors, as a
particularly strong argument due to its ability to rule out entire
classes of error wholesale.

But we encountered a hiccup when basic data types alone didn't rule
out all misuses of a function (in the given example, division by
zero). In other words, we couldn't statically enforce the
_precondition_ that the second argument to division must be nonzero.

<!-- MORE -->

In general (to quote Noonan again):

> Library authors are faced with a design choice: should a function
> with preconditions be implemented as a partial function, or by
> returning a failure condition on incorrect use? Neither option is
> ideal. Partial functions lead to frustrating run-time errors.
> Failure conditions must be checked at the use-site, placing an
> unfair tax on the users who have ensured that the function's
> preconditions were correctly met.

Data science library authors feel this pain acutely, as data science
algorithms often entail complex preconditions.

As a quick case study: Scikit-Learn falls strongly into the "return
failure condition" camp. That failure condition is most commonly a
`ValueError` raised to the call-site of an algorithm whose argument
failed a precondition. For instance, the [`check_array`][check_array]
validator, which follows this pattern in checking a configurable
smattering of preconditions on Numpy arrays, has hundreds of
call-sites across all user-facing modules of Scikit-Learn.

[check_array]: https://github.com/scikit-learn/scikit-learn/blob/8e61534f1087703f476414d8dbd3688282f8eebf/sklearn/utils/validation.py#L350

But as alluded to in the previous post, we have another option: to
encode preconditions in types and define total functions. A
sufficiently expressive static type system will even allow us to do
so with no runtime cost (in contrast to `check_array` and the general
`if not condition: raise ValueError()` idiom it follows, which cost
CPU cycles at every call).

[Haskell][haskell.org] has such a type system, and Noonan's [_Ghosts
of Departed Proofs_][gdp] (GDP) describes a library writing approach
based on these ideas which leads to libraries which are _safe_
("prevents the user from causing run-time errors") and _ergonomic_
("doesn't place undue burden on the user"). GDP's core insight is
that a type can carry (or perhaps "imply") a particular property of a
term. Moving proof of a property into the type system is a
compiler-enforced way to document the properties of terms and the
preconditions of algorithms/ functions.

We'll eventually see how to apply GDP to the design of a data science
library, but first I'll outline some slightly more primitive
techniques which share their goals and philosophy with GDP.

[haskell.org]: https://www.haskell.org
[gdp]: https://kataskeue.com/gdp.pdf

---

> [GDP is] based on the following observation: sophisticated
> preconditions can be encoded in Haskell's type system with no
> run-time overhead, by using proofs that inhabit phantom type
> parameters attached to `newtype` wrappers. The user expresses
> correctness arguments by constructing proofs to inhabit these
> phantom types.

To fully unpack this, I'll introduce you to Haskell's `newtype`
construct by examining two type-level techniques for proving
properties of a term, namely _smart constructors_ and _parsing_.

## Smart Constructors

Haskell's [`newtype`][newtype] construct is a way to define a type
which is _representationally equivalent_ to some existing type (i.e.
laid out the same way in memory), but which should be treated as a
different type by the compiler. For example:

[newtype]: https://wiki.haskell.org/Newtype

```haskell
newtype SortedList a = UnsafeSorted [a]
```

defines a new "type constructor" `SortedList` with "type parameter"
`a` and "data constructor" `UnsafeSorted` which converts lists of
`a`s (written `[a]`) to `SortedList a` (pronounced "`SortedList` of
`a`s"). We say `SortedList a` "wraps" the underlying type `[a]`; a
useful metaphor which suggests the fundamental equivalence of these
types.

When a `newtype` records some property of a term (in this case,
"sortedness"), it's idiomatic to name the data constructor `Unsafe*`
since it can convert _any_ term of the underlying type to the new
type, when we should only be able to convert values that actually
have that property. Instead, we define some function which takes a
list, makes sure it's sorted, and only then returns a `SortedList`.
One way to check that a list is sorted is to sort it yourself:

```haskell
-- Module declaration/ export list
module MySortingLib
( SortedList
, ensureSorted
) where

-- Standard library import
import Data.List (sort)

-- Module implementation

newtype SortedList a = UnsafeSorted [a]

ensureSorted :: [a] -> SortedList a       -- "::" means "type annotation"
                                          --   read "ensureSorted is a function from `[a]` to `SortedList a`"
ensureSorted xs = UnsafeSorted (sort xs)  -- implementation
```

On that last line, we can be confident applying `UnsafeSorted` to
convert `xs` to a `SortedList` since we've just sorted it ourselves.
Note the export list at the top of the module: we export the type
constructor `SortedList` and the "smart" data constructor
`ensureSorted`. Critically, the `UnsafeSorted` data constructor is
absent. This means the only way for library users importing this
module to create a `SortedList` is by actually sorting the list (via
`ensureSorted`). In this way, a term in user code carrying the type
`SortedList` carries with it a proof that it is sorted.

Having a way to express this precondition in the type system is a
powerful way to rule out misuse of a function. Take for example an
in-order list merging function. Without a guarantee the two argument
lists are already sorted, we're forced to sort them ourselves. But if
we happen to _know_ that the lists are sorted (and can prove it!)
then we can skip that step and use an optimized O(n) version:

```haskell
-- "mergeSorted is a function from two SortedLists to a SortedList"
-- In a type annotation, the type to the right of the last -> is the
-- return type, everything else is an argument.
mergeSorted :: SortedList a -> SortedList a -> SortedList a
```

With this type, it is **impossible** to call `mergeSorted` on a list
we haven't proved is already sorted (and again, the only way for
library users to prove a list is sorted is to actually sort it with
`ensureSorted`). The program won't compile. We have a guarantee that
the program will never crash due to a violation of this precondition.
(We also have the side benefit of a _postcondition_ on `mergeSorted`:
that its output list will also be sorted.)

This sort of "smart constructor" pattern will get a lot of millage
encoding data science-y preconditions. Just take the "sorted"
property above, and swap in `normalize`, or `dropMissingValues`, or
`oneHotEncode`; use this pattern whenever whenever you want to prove
(or require) that a term has undergone some procedure. Matt Parsons'
[_Type Safety Back and Forth_][parsons] introduces this pattern from
a slightly different angle (and also introduces the next pattern
we're about to discuss).

[parsons]: https://www.parsonsmatt.org/2017/10/11/type_safety_back_and_forth.html

## Parsing

A similar approach can be used when you want to generate a proof of a
property, but it isn't appropriate to subject the term to a procedure
which would ensure that property. You could call it "classification,"
but I'll call it "parsing" (it'll become clear why later). Perhaps we
have some linear algebra algorithms which are only defined for square
matrices (e.g. matrix inversion). Such a precondition could be encoded as
follows:

```haskell
module MyLinearAlgebraLib
( SquareMatrix
, parseSqMatrix
) where

import Data.Matrix

newtype SquareMatrix a = UnsafeSquareMatrix (Matrix a)

parseSqMatrix :: Matrix a -> Maybe (SquareMatrix a)
parseSqMatrix mat =
  if isSquare mat
    then Just (UnsafeSquareMatrix mat)
    else Nothing
```

Via a sorting procedure, it's possible to turn any list into a sorted
list. There is no such procedure for converting an arbitrary matrix
into a square matrix. The best we can do is check squareness and
perform the type conversion when the check passes, failing otherwise.

As briefly mentioned in the last post, Haskell's `Maybe` denotes a
computation which may fail; a function returning `Maybe a` may return
the failure condition `Nothing`. This may seem hypocritical,
contradictory to our preference against returning failure conditions.
But if we think of `parseSqMatrix` as a _parser_, parsing matrices
into square matrices, then this is necessarily the correct type.
Consider this conception of "parser" from Lexi King in [_Parse, Don't
Validate_][pdv]:

> Consider: what is a parser? Really, a parser is just a function
> that consumes less-structured input and produces more-structured
> output. By its very nature, a parser is a partial function - some
> values in the domain do not correspond to any value in the range -
> so all parsers must have some notion of failure. Often, the input
> to a parser is text, but this is by no means a requirement, and
> `parseNonEmpty` is a perfectly cromulent parser: it parses lists
> into non-empty lists, signaling failure by terminating the program
> with an error message.

[pdv]: https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate

I encourage you to read that post for a more comprehensive
explanation of and motivation for this approach, as well as the code
for the referenced `parseNonEmpty` case study.

For now, I'll simply emphasize that with the given export list, the
only way for library users to create a `SquareMatrix` is with
`parseSqMatrix`. They must explicitly handle the error case, but for
the branch of the program which handles the success case, they never
have to check again:

```haskell
case parseSqMatrix mat of
  Just sqMatrix -> doStuff sqMatrix
  Nothing       -> error "ya done goofed"
```

All the code under `doStuff` can rest assured (without checking!)
that the precondition of squareness holds since `sqMatrix` has type
`SquareMatrix` (i.e. it carries a proof that it is square). To
reiterate the value proposition one last time: for any function with
a precondition of squareness on a matrix argument, e.g.:

```haskell
invertMatrix :: SquareMatrix a -> SquareMatrix a
```

it is **impossible** to pass in a matrix without proof that it's
square. The program just won't compile. In other words, we have a
guarantee that the running program will never violate this
precondition.

---

These two approaches alone can get you very far indeed for individual
preconditions on a term. Unfortunately, they don't scale well when
the time comes to encode multiple preconditions. To state the problem
briefly, if each precondition proof is recorded with a `newtype`
wrapper, then code which consumes terms carrying these proofs needs
to know exactly which proofs to expect and the order in which to
unwrap them.

To solve this, we'll conclude our detour into the `newtype` construct
and fully embrace the spirit of GDP.
