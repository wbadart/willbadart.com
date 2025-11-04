---
title:  Decision Tree Decisions
published: 2018-09-09
tags:
  - hdsk
  - haskell
  - functional programming
  - data science
categories:
  - hdsk
---

I recently gutted the decision tree module. The original implementation was
based on my toy project from last semester, [decisiontree.hs<i class="fa
fa-external-link"></i>][decisiontree.hs]. The goal of that
original project was just to see if I could implement models and algorithms
from my machine learning and data science classes in Haskell; it was more an
exercise in the language than it was anything else.

<!-- MORE -->

It was neat (and still is) to see established decision tree algorithms (or at
least, shadows of them) as pure functions over data, i.e.:

```haskell
classify :: splitCriteria -> [tup] -> tup -> label
```

However, skipping the intermediate representation with an actual tree
*structure* flushes the performance down the drain since every classification
essentially has to re-build the tree. Furthermore, this hamstrung my ability to
implement pruning and the `max-depth` parameter, both of which are deeply
intertwined with tree structure.

Therefore, I introduced the new data type, which will model, well, a decision
tree model. This is the complete definition as of commit
[`c268b88`<i class="fa fa-external-link"></i>][commit]:

```haskell
data DecisionTree tup label
  = Branches (tup -> Bool) [DecisionTree tup label]
  | Decision (tup -> Bool) label
```

On a high level, this definition corresponds closely to the canonical (if you
want to call it that) example of an n-ary tree data type:

```haskell
data Tree a
  = Node a [Tree a]
  | Leaf a
```

In fact, if you ignore that predicate tacked on to each node (`tup -> Bool`;
more on that in a moment), it *is* this definition, where `a` is the type
`label`.

[decisiontree.hs]: https://github.com/wbadart/decisiontree.hs
[commit]: https://github.com/wbadart/hdsk/commit/c268b88a970fe1ae21a55f47f6ab9dc22ed60351

## The `tup` Type

_**Warning:** in the following paragraphs, I will use the terms_ data object,
data instance, _and_ data tuple _interchangeably. Please let me know if I do so
wrongly._

So why is the value stored at each node a *function*, and not, say, the name of
the attribute which the node branches on?

Basically, I want the DecisionTree module to be as agnostic to the type of the
data objects as possible. I don't want to choose on behalf of the library's
users how they load their data into memory.

I could have naively assumed that each data object was a list, but lists are
homogeneous, and what if your data's attributes have mixed types? I couldn't
have set the type to an actual `Tuple`, since that would require specifying the
length of the feature vector and the types of each of its constituents; even
more restrictive than lists!

When you read through the eventual implementation of the module, you'll see
that there's a decent amount of code that only exists so that the library
*doesn't* have to inspect data objects. The techniques for doing so are
arguments supplied by end users.

**For example:** the current working draft of the [ID3<i class="fa
fa-external-link"></i>][id3] implementation has a parameter
`getLabel :: tup -> label`. This is the function used to extract the label of a
data object. For instance, if your data is of the form

```haskell
dat = [ ["sunny",  "humid",     "play"]
      , ["sunny",  "not humid", "play"]
      , ["cloudy", "humid",     "not play"] ]
```

where the last element is the label (`"play"`/ `"not play"`), then your
`getLabel` function could be `last`.

By not constraining the data objects' type, I pass on that flexibility to the
library users. In fact, this opens the door to computed labels (though I can't
think off the top of my head any nice applications).

Now finally I can explain why each node is associated with a predicate over the
data object's type.

[id3]: https://en.wikipedia.org/wiki/ID3_algorithm

## Branch Encoding

In a decision tree, what is a branch? I think a nice working definition is that
a branch is a switch the guides the flow of data objects from the root of the
tree down to a decision at a leaf. At each branching, exactly one branch
applies to a given instance, e.g. "here is the branch for instances where the
`outlook` attribute is equal to `"sunny"`, and here is the branch for those
which are `"cloudy"`" (for categorical variables, this exercise extends to all
potential values of the feature). Or, to give an example for continuous
features, "here is the branch for instances where the `age` attribute is less
than or equal to `50`, and here is the branch for those where it is greater."

So in essence, each branch is a yes or no question about a data object: "Yes"
if the data object should flow down that branch towards a decision, and "No" if
it should flow down another.

By this reasoning, the abstraction of *branch* can be represented directly as a
predicate over the data object type. This predicate-based encoding lets us
defer the implementation of how exactly we extract values from data objects. To
continue the example above, the question "is the `outlook` of this data object
equal to `"sunny"`?" can be encoded as the predicate:

```haskell
(== "sunny") . (!!0)
```

or

```haskell
(== "sunny") . head
```

## Architecture

I'd like to tack on this little note about how the new data type affects the
usage of the DecisionTree module. Spoiler alert: it changes everything, but in
a good way.

Look at the old signature of the `classify` function:

```haskell
classify ::
  (Foldable f, Alternative f, MonadPlus f, Eq label, Ord label)
  => (f tup -> [[tup -> Bool]])
  -> (tup -> label)
  -> ((tup -> label) -> f tup -> [tup -> Bool] -> Double)
  -> f tup
  -> tup
  -> label
```

Without the haddock strings, this is an unintelligible mess. Moreover, it
complects the construction of the tree and its usage for classification.

Compare this to the new signature:

```haskell
classify :: DecisionTree tup label -> tup -> label
```

The new `classify` doesn't care where your decision tree came from, let alone
what the parameters of its construction were. In fact, in the unit tests, I run
`classify` on a hard-coded, hand-built tree, no fancy construction algorithm to
speak of.

I'm not sure yet which parameters will face the user of the construction
algorithms. Right now, the top-level definition of `id3` exposes the parameters
need for the recursive call, but this will be demoted to a `where` clause and
the top-level definition will be neat and clean. Regardless, I just mean to
note that to reclaim the old behavior with no intermediate model, you can
simply compose the construction algorithm with the classification function.

Once I have ID3 implemented, I'll put together some benchmarks and see what the
gainz look like.
