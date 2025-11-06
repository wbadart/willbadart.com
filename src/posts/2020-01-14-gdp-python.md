---
title:  Ghastly Echoes in Python
published: 2020-01-15
tags:
- data science
- software engineering
- python
categories:
- hdsk
---

The last three posts gradually introduced "Ghosts of Departed Proofs"
(GDP) as a framework for designing safe, ergonomic data science
libraries. GDP and the related approaches leverage Haskell's
expressive type system to enable the compiler to detect user errors
which violate the preconditions of an algorithm.

1. [Arguing for Correctness](/posts/2020-01-10-arguing-for-correctness/)
2. [The Argument from Types](/posts/2020-01-13-argument-from-types/)
3. [GDP For Data Science](/posts/2020-01-14-gdp-for-data-science/) (<-- prereq for this
   post)

Unfortunately, not many data scientists are using Haskell today, so
to use GDP directly, most teams would have to switch languages.

<!-- MORE -->

This post is for teams who can't afford to switch languages right
now, but still want to make stronger arguments for the safety and
correctness of their data science software. Below, we'll be
extracting the abstract approaches from the GDP system and exploring
how to implement them concretely in Python.

## Python Static Analysis

One of the major value propositions of GDP in Haskell is the total
lack of any run-time cost. We get the safety guarantees from the
compiler, and our program runs the same. Such a feature simply isn't
possible in a dynamic type system, wherein any type-checking occurs
at run-time.

With [PEP-484][pep484], however, Python introduced what amounts to an
optional static type system. We can use an external tool
([`mypy`][mypy] seems to be the popular one) to read any recorded
type hints and check them. It's not the same as having a compiler
categorically reject ill-typed programs (Python will happily
interpret and run a program `mypy` finds ill-typed; it simply ignores
type hints), but having the type check as part of an automated
process like a CI pipeline is a small step in the direction of
"guaranteeing" type safety.

[pep484]: https://www.python.org/dev/peps/pep-0484
[mypy]: http://mypy-lang.org

With PEP-484 as a foundation, we can start to implement echoes of the
techniques we've been exploring.

## Smart Constructors

As before, a smart constructor takes some data from an underlying
type to a wrapper type which communicates some property. We'll
translate Haskell's `newtype`-based implementation for that idea into
a class, say, for the `SortedList` example:

```python
class SortedList:
    def __init__(self, data):
        self.data = list(sorted(data))
```

Now we can use a type hint with `SortedList` to encode a "list
argument must be sorted" precondition:

```python
def merge_sorted(x: SortedList, y: SortedList):
    # Operate on x.data and y.data, knowing they've already been sorted
```

Anywhere we want to use a function/ method for regular lists, we can
just reference `.data`. The problem is that `SortedList` has a pretty
limited interface; there's almost nothing we can do with it without
pulling back the curtain and working with `.data`. We can't even
print the elements without reimplementing `__repr__`. To alleviate
this, we can have `SortedList` inherit from `list`.

```python
class SortedList(list):
    def __init__(self, data):
        super().__init__(sorted(data))
```

Now, `merge_sorted` can operate directly on its arguments, rather
than grabbing the underlying lists they wrap.

### Problems

This is great for a nominal check that a particular procedure has
been applied. However, two aspects of Python prevent this check from
being a proper guarantee that the given property holds.

1. There's no real "private" data in Python. In the first
   "composition" approach, any part of our program is free to read
   and write `.data`. We can rename it to `._data` and make `.data` a
   read-only property, but that's just indirection. Even though the
   leading underscore, by convention, politely suggests that `._data`
   is "private," we're free to ignore that wherever we feel
   convenient, and there's nothing Python or `mypy` can do to stop us
   (or, more likely, our library users).
2. Python data is mutable. Yes, the data was definitely sorted by the
   end of `__init__`'s body, but every line of code that follows is
   free to shuffle, slice, drop and chop the underlying data at will.
   That's why the Python class `SortedList` more communicates the
   notion that "this list was sorted at some point," rather than the
   guarantee that the term is and will be sorted for the life of the
   program.


### Smart Constructors for Data Science

Now that we're clear that these types can't guarantee, merely
suggest, a property, let's continue on to our data science library
and translate our preprocessing module:

```python
from enum import Enum
from sklearn.preprocessing import StandardScaler

class Normalized:
    def __init__(self, df):
        self.scaler = StandardScaler()
        self.df = self.scaler.fit_transform(df)


class MissingValueHandler(Enum):
    DROP = pd.DataFrame.dropna
    FILL = pd.DataFrame.fillna

class NoMissingVals:
    def __init__(self, df, handler: MissingValueHandler, **opts):
        self.df = handler(df, **opts)
```

`NoMissingVals` is a little trickier here since there were multiple
ways to handle missing values. The use of the enum type above
constrains users to the missing value handling methods defined by
`MissingValueHandler` (no other argument would type check). A call
would look like

```python
NoMissingVals(df, MissingValueHandler.DROP)
```

Here's how these classes look as preconditions on our machine
learning algorithms:

```python
def kmeans(df: Normalized, k: int):
    # ...

def id3_decision_tree(df: NoMissingVals):
    # ...
```

With these type hints, if we forget the requisite procedure, as
below, `mypy` (wherever in our development pipeline it's run) will
helpfully remind us:

```python
import pandas as pd
df = pd.read_csv('my_data.csv')
kmeans(df, k=4)
```

leads to

    error: Argument 1 to "kmeans" has incompatible type "DataFrame"; expected "Normalized"

## Parsing

If we think of our parsing functions as smart constructors which may
fail, then we can add that notion of failure directly to our Python
translation of the smart constructor pattern. To revisit square
matrices:

```python
import numpy as np

class SquareMatrix:
    def __init__(self, a: np.ndarray):
        if not self.is_square(a):
            raise ValueError(f"Can't make a square matrix from dimensions {a.shape}")
        self.data = a

    @staticmethod
    def is_square(a: np.ndarray):
        try:
            n, m = a.shape
        except ValueError:  # a isn't 2D
            return false
        return n == m
```

If we're careful not to mutate (e.g. reshape) our `SquareMatrix`,
this type is a pretty good indication that the underlying matrix in
`.data` is actually square. Using this parser, we can check for
squareness and _fail early_, perhaps as soon as we have our target
matrix in hand. Without it, we have to wait for whatever
implementation detail of the algorithm relies on the squareness
property to blow up with an opaque, technical error.

Again, due to the optionality of type checking, the mutability of
data, and the lack of private data, this doesn't amount to a
_guarantee_ that a term of type `SquareMatrix` is actually square.
But it is a good smoke test for when we accidentally omit the check.

## GDP

GDP associates a term with a proof by sticking the proof in a phantom
type parameter of a `newtype` constructor. What does that mean in
Python?

Interestingly, since Python 3.5.2, the `typing` standard library
module ships with a [`NewType`][py-newtype] construct not entirely
dissimilar to Haskell's. A Python `NewType` wraps some underlying
type in a new type, to be treated as something separate by the type
checker. However, `NewType` doesn't admit the parameterization we
need. In Python, the notion of a type with parameters corresponds to
[generics][generics]. For example, [`List`][list] is a generic type,
meaning it is parameterized by another, type, e.g. `List[int]`.

[py-newtype]: https://docs.python.org/3/library/typing.html#newtype
[generics]: https://docs.python.org/3/library/typing.html#generics
[list]: https://docs.python.org/3/library/typing.html#typing.List

In GDP, the "such that" `newtype` was our core mechanism for
associating proofs with terms. Let's define a generic type
`SuchThat`, parameterized by a data type and a proof type:

```python
from typing import Generic, TypeVar

A = TypeVar('A')  # data type
P = TypeVar('P')  # proof type

class SuchThat(Generic[A, P]):
    def __init__(self, a: A):
        self.a = a
```

User-defined generics are implemented as above by inheriting from
`Generic`. The parameters given to this parent (in this case, the
type variables `A` and `P`) correspond to the parameters of our type.
For example, for the type `SuchThat[int, Positive]`, `int` is the
data type and `Positive` is the proof type. In other words, a term of
type `SuchThat[int, Positive]` is an `int` such that it is positive.
Note that we preserve our notion of "phantom-ness" as the
implementation (term-level code) of `SuchThat` makes no mention of
`P`.

Here's the `SortedList` example, using our new `SuchThat` construct:

```python
# As in the last post, we'll never need a value of type Sorted, so we
# don't implement a way to create Sorted values. We only need to
# reason about the type (as a proof type for SuchThat).
class Sorted:
    def __init__(self):
        raise NotImplementedError('This class should have no instances')

def ensure_sorted(x: List[Any]) -> SuchThat[List[Any], Sorted]:
    return SuchThat(sorted(x))

def merge_sorted(
        x: SuchThat[List[Any], Sorted],
        y: SuchThat[List[Any], Sorted]
        ) -> SuchThat[List[Any], Sorted]:
    # ...
```

It's wordier than it was in Haskell, but it's a pretty direct
translation (much more direct than I thought it would be when I first
started). Everything in Python is necessarily going to be more
flexible, and when it comes to type-level programming, a little more
ad-hoc. There's also 1) run-time overhead to use these more
expressive types (for instance, having to access `.a` to operate on
the underlying data of a `SuchThat` term) and 2) extra verbosity in
source code for extracting values.

---

It's up to library authors to apply these patterns in a way that hits
the desired level of safety without becoming so cumbersome that users
end up circumventing them. There's still a lot of work to be done, 1)
on the Python side to make the type-level constructs more workable,
2) on the Haskell side to make the data science ecosystem more
complete and mainstream, and 3) on the theory side to make the more
rigorous family of formal methods more accessible to workaday
programmers.

Until then, I believe these approaches comprise a compelling step in
the right direction for both data science and software engineering as
a whole. They work with no need to adopt radically new technology,
and fit into paradigms and languages we're already using. With the
right support, this technology could become the way we do data
science, and in doing so, dramatically improve the safety of the
innumerable real-world systems which rely on it.
