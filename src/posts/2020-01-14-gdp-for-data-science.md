---
title:  GDP for Data Science
published: 2020-01-14
tags:
- data science
- software engineering
- functional programming
categories:
- hdsk
---

In the [last post], we used types to record interesting properties of
the terms in our program. Equivalently, from a function's
perspective, we used types to encode preconditions on the arguments
to a function, letting the compiler reject misuse of the algorithm it
implements. Such misuse constitutes a mistake at the conceptual or
domain level, and ruling out error classes at this level of
abstraction can be very strong evidence for the correctness of a
program.

[last post]: /posts/2020-01-13-argument-from-types/

<!-- MORE -->

We finally reached an impasse when we needed to start juggling proofs
of multiple properties of a term. Recall the given example:

> If each precondition proof is recorded with a `newtype`
> wrapper, then code which consumes terms carrying these proofs needs
> to know exactly which proofs to expect and the order in which to
> unwrap them.

Here's how that might look in code:

```haskell
module MyDataScienceLib
( Normalized, normalize
, NoMissingVals, dropMissingVals, fillMissingVals
) where

-- A couple properties of dataframes, with the signatures of
-- potential smart constructors

newtype Normalized df = UnsafeNormalized df
normalize :: df -> Normalized df

newtype NoMissingVals df = UnsafeNoMissingVals df
dropMissingVals :: df -> NoMissingVals df
fillMissingVals :: df -> NoMissingVals df
```

A library user can now construct a preprocessing pipeline from these
elements:

```haskell
import MyDataScienceLib

pipeline = do
  df <- readCSV "my_data.csv"
  return (normalize (fillMissingVals df))
```

Unfortunately, this doesn't compile. `normalize` wanted a `df`, but
we gave it a `NoMissingVals df`. We have to _unwrap_ the `df` from
`NoMissingVals`. Let's assume we have a function for doing this
called `coerce`:

```haskell
pipeline = do
  df <- readCSV "my_data.csv"
  let df_nomissing = fillMissingVals
  return (normalize (coerce df_nomissing))
```

(Morally, the type of the dataframe from `pipeline` is `Normalized
(NoMissingVals df)`).

Even with just two steps in our pipeline, we already see how
cumbersome this framework is.

The problems compound when we want to use library functions which
examine these properties. Consider the following machine learning
module from the library we're building:

```haskell
kmeans :: Int -> Normalized df -> [cluster]
kmeans k df = ...

id3DecisionTree :: NoMissingVals df -> DecisionTree label
id3DecisionTree df = ...
```

As a user, it isn't obvious by any means how we should massage the
type of our preprocessed dataframe to "pick out" the particular
precondition each of these algorithms is asking for proof of. This
renders the library practically unusable.

Enter GDP proper.

## Ghosts of Departed Proofs

At this point, I'd encourage anyone with half an hour on their hands
to go read [the paper][gdp] for context. To borrow the summary from
the last post (which borrowed it from the paper):

> [GDP is] based on the following observation: sophisticated
> preconditions can be encoded in Haskell's type system with no
> run-time overhead, by using proofs that inhabit phantom type
> parameters attached to `newtype` wrappers. The user expresses
> correctness arguments by constructing proofs to inhabit these
> phantom types.

[gdp]: https://kataskeue.com/gdp.pdf

When we used `newtype` before, the type itself was proof of the
property. We said "if the term has this type, then the property
holds." The concept is subtly different under GDP. GDP distinguishes
the two components of this composite type: the _data_ type, and the
"_proof_ type," if you will. It does so by putting the "proof type"
in the phantom type parameter of a `newtype` (which we'll define
momentarily). Here's what it looks like in the paper's
[implementation][gdp-hackage]:

[gdp-hackage]: https://hackage.haskell.org/package/gdp-0.0.3.0

```haskell
newtype a ::: p = SuchThat a
```

This `newtype` declaration introduces the type constructor `:::`
(pronounced "such that") with parameters `a` and `p`, and the data
constructor `SuchThat`, which converts values of type `a` to type `a
::: p`.

**`a` is the data type and `p` is the proof type.** `p` is called a
"phantom" parameter since it doesn't appear on the right side (the
data side) of the declaration, meaning it exists only in the type
system, and no trace of it is left in the compiled program.

As a quick example, let's reprise `SortedList` within this new
framework. `SortedList` wrapped the underlying list type and conveyed
the property of "sortedness" itself. But now proof of the property
will be separate from the underlying data type; the two will be
associated by our new "such that" construct. And, as alluded to
above, the proof type is a "phantom," so no data will every inhabit
it (and we thusly don't need a data constructor).

```haskell
-- No unsafe data constructors to hide!
module MySortingLib
( Sorted
, ensureSorted
) where

-- Imports from the GDP library
import Data.Refined ((:::), (...))
import Logic.Proof (axiom)

data Sorted  -- introduce the type "Sorted" without a data constructor,
             -- which would appear on the right side of an =
ensureSorted :: [a] -> [a] ::: Sorted
ensureSorted xs = (sort xs) ...axiom
```

The expression `x ...p` attaches proof `p` to term `x`. In this case,
by attaching the proof `axiom` to the sorted list, we (the library
authors) are asserting the axiom in our library's logic that it just
_is_ the case that a list which has had `sort` applied has the
property `Sorted`.

## GDP for Data Science

Let's now return to our data science library. We were stuck because
our proof types were tightly coupled to our data types. Let's
re-imagine our library in terms of GDP:

```haskell
module MyDataScienceLib
( Normalized, normalize
, NoMissingVals, dropMissingVals, fillMissingVals
) where

data Normalized
normalize :: df -> df ::: Normalized

data NoMissingVals
dropMissingVals :: df -> df ::: NoMissingVals
fillMissingVals :: df -> df ::: NoMissingVals

-- This is new. If this makes your eyes gloss over, don't worry, just
-- know that this operator sequences functions of type `a -> a ::: p`
-- Its name `.|` is meant to invoke the UNIX pipe operator. This
-- operator wasn't possible before for arbitrary properties p and q.
(.|) :: (a -> a ::: p) -> (a -> a ::: q) -> a -> a ::: p && q
```

Now, our users can easily define their pipeline without having to
manhandle the various properties of the dataframe:

```haskell
pipeline = do
  df <- readCSV "my_data.csv"
  return (normalize .| fillMissingVals $ df)
```

In more idiomatic Haskell, it'd probably be written

```haskell
preprocess = normalize .| fillMissingVals
```

You'd then apply the function `preprocess` to some `df` that you got
from elsewhere (rather than reading it in then and there).

Either way, `pipeline`/ `preprocess` results in a dataframe of type
`df ::: Normalized && NoMissing`, which reads "a dataframe such that
it is normalized _and_ has no missing values."

Using some type-level programming features in Haskell (which I'll
hand-wave for now), we can recursively pick apart propositions of the
form `p && q` to find out if the overall conjunction contains a
particular premise of interest. Practically speaking, this means we
can express the preconditions of our machine learning algorithms as
constraints:

```haskell
kmeans
  :: Has Normalized properties  -- before "=>" is a "constraint", after is a familiar type
  => Int -> df ::: properties -> [cluster]

id3DecisionTree
  :: Has NoMissingVals properties
  => df ::: properties -> DecisionTree label
```

Let the type-level function `Has` assert that the lump of conditions
attached to `df` implies `Normalized`, or `NoMissingVals`, or
whatever property is specified by its first argument. As before,
these types prevent us from _ever_ clustering unnormalized data, or
from building a decision tree from data with missing values.  If we
try, the program won't compile. **With the preconditions expressed as
such, we can apply the algorithms directly to our preprocessed
dataframe, as is:**

```haskell
processed_df = preprocess df
clusters     = kmeans 7 processed_df
tree         = id3DecisionTree processed_df
```

---

GDP is a unified framework for expressing all the correctness
arguments we've explored so far, and more. It's a _general_ framework
which lets us reason about a program's properties at the type level
using rigorous logical constructs. This generality is extremely
powerful in that we can use it to express all sorts of arbitrarily
complex preconditions and constraints. And, as we've seen, arguments
made at the type level can be checked by the compiler. The fact that
the compiler can catch false claims is great for arguing correctness,
but also for refactoring; if we make a change that accidentally
invalidates a claim, the compiler will let us know.

Through this and the last couple posts, I've meant to convey that GDP
is an immensely powerful framework for designing data science
libraries whose safety we can actually start to guarantee. Part of
that guarantee is having a compiler that strictly forbids us from
running programs with invalid constructions. This (among other
reasons) made Haskell a great choice.

Perhaps unfortunately then, Haskell represents a minuscule portion of
current data science practice, meaning most teams would have to
switch languages to use this framework. This is an expensive
proposition, which may simply not be worth what gains are made in
correctness and safety. For this reason, the [next post] will attempt
to translate some of these ideas into Python to see what steps can be
made towards safety in a more popular ecosystem.

[next post]: /posts/2020-01-14-gdp-python/
