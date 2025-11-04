---
title:  Domain-Level Errors
published: 2020-01-15
tags:
- data science
- software engineering
categories:
- hdsk
---

Over the last year and a half, I've had the opportunity to work with
a lot of different data scientists, all from varying backgrounds and
with different levels of experience. During this time, I've observed
a pain point that seems to afflict these practitioners without regard
to expertise or experience: **bad error messages**.

<!-- MORE -->

By "bad," I don't mean "useless" or "entirely unhelpful." Usually a
Python stack trace has enough information to at least point you in
the right direction for debugging. However:

1. The signal-to-noise ratio of error reporting tends to be quite
   low (how many bytes of a long stack trace and error message are
   actually helpful? How long does it take to decode the mistake
   which has been made?).
2. Dynamism in a language allows great distance to build up between
   the site of a mistake and the resulting error condition
   ("everything is OK until it's not"). This limits the amount of
   context around the mistake that the error can report.

As a quick example, let's say you have some decision tree parameters
saved in a JSON file and you make a mistake in the type of a
parameter, e.g.:

```json
{ ..., "max_depth": "12", ...}
```

Your script reads in this file and initializes the model, no problem,
you spend several lines reading in and preprocessing data, no issues
yet. Finally, you try to fit the model to the data and suddenly:

```
---------------------------------------------------------------------------
TypeError                                 Traceback (most recent call last)
<ipython-input-7-6d10fe8973eb> in <module>
----> 1 model.fit(X, y)

~/.pyenv/versions/3.8.0/lib/python3.8/site-packages/sklearn/tree/_classes.py in fit(self, X, y, sample_weight, check_input, X_idx_sorted)
    870         """
    871
--> 872         super().fit(
    873             X, y,
    874             sample_weight=sample_weight,

~/.pyenv/versions/3.8.0/lib/python3.8/site-packages/sklearn/tree/_classes.py in fit(self, X, y, sample_weight, check_input, X_idx_sorted)
    266         if not 0 <= self.min_weight_fraction_leaf <= 0.5:
    267             raise ValueError("min_weight_fraction_leaf must in [0, 0.5]")
--> 268         if max_depth <= 0:
    269             raise ValueError("max_depth must be greater than zero. ")
    270         if not (0 < max_features <= self.n_features_):

TypeError: '<=' not supported between instances of 'str' and 'int'
```

It's obvious to us, the authors of this contrived example, what's up.
The error message reports the exact type error we expected. However,
imagine this or an analogous example in the wild. The parameter
loading code was probably one of the first things we wrote, and this
training code could have come hours or days later, depending on how
much time we spent writing preprocessing code. We might not have even
looked at the contents of that JSON file.

Moreover, we made our mistake at the top of our script (or even,
arguably, outside of it, in the JSON file itself), while the error
condition is at the bottom.  Proximity is one of the most influential
factors in the way our brains judge relatedness, so debugging almost
always begins at the site of the _error condition_, far away in this
case and many others from the actual bug to be fixed. Finally, this
error is reported in specific technical terms.  It makes sense from a
software engineering perspective to report the details of the
run-time failure, but to a data scientist, what does

> `TypeError`: `<=` not supported between instances of `str` and `int`

have to do with our decision tree?

All this amounts to what I see as a major wasted opportunity. Why
does debugging have to be frustrating when it could be _educational_?
We should learn from our mistakes, and our tools could help us do
that if that was a design priority. If we improve our tools, we can
make data science more hospitable to newcomers and more enjoyable for
all of us.

---

More recently, I've been researching library and API design,
searching for ways to make stronger arguments for the correctness of
data science software. In doing so, I found how to use Haskell's type
system to ensure not only that an algorithm receives the data types
it expects, but that those arguments also meet the algorithm's
preconditions.

It's easy enough to get the data types for an algorithm right (most
of Scikit-Learn can eat a Pandas DataFrame of numbers, no problem,
easy money), and getting that wrong usually blows up your script with
a `TypeError` or `ValueError`, so regardless of how helpful the
message is, you at least know something's wrong. Violating a
precondition is a much subtler error, to which novices are especially
prone since they may not even know about the precondition. It's
especially insidious when the algorithm fails to fail in spite of the
violation. For instance, clustering only really makes sense for
normalized data, but `sklearn.cluster.KMeans` will happily churn
through unnormalized data. In these cases, instead of an exception,
you just get garbage output, which you might not even notice.

In addition to catching these violations, Haskell's type system lets
us report errors _in the language of the domain_, and at the site of
the violation. Let's write a signature for a KMeans algorithm which
captures the normalization precondition.

To start things off, let's say `kmeans` is a function from an `Int`
(the number of clusters _K_) and a dataframe to a list of cluster
IDs. This is written:

```haskell
kmeans :: Int -> df -> [cluster]
```

Now let's suppose the existence of a construct, call it
`PreprocessedBy`, which associates a dataframe with the list of
preprocessing steps (called `algs`) which have been applied to it so
far:

```haskell
kmeans :: Int -> PreprocessedBy algs df -> [cluster]
```

This says that `algs` can be any list of preprocessing steps. Indeed,
we don't really care which steps have been applied to `df`, as long
as normalization is one of them. We express this with a "constraint"
on the list `algs`:

```haskell
kmeans :: Member Normalize algs => Int -> PreprocessedBy algs df -> [cluster]
```

Note the `=>`: everything before it is a constraint, everything after
is a type. So `kmeans` is still a function from an `Int` and a `df`
to a list of cluster IDs. This constraint says "any list `algs` is OK
as long as `Normalize` is a member of that list."

`Member` makes an assertion about `algs`. Let's re-imagine it
slightly to accept a custom type error to report when that assertion
fails:

```haskell
kmeans
  -- Assert 'Normalize' is member of the list 'algs'
  :: Member Normalize algs

       -- Error to report if that assertion fails
          ( Text "Clustering only gives meaningful results for normalized data. "
       :$$: Text "    See https://bit.ly/2FUHTai for further explanation."
       :$$: Text "Please apply a normalizer to your data before clustering. "
       :$$: Text "    See https://TODO for a list of normalizers." )

  => Int -> PreprocessedBy algs df -> [cluster]
```

If this is the type of the `KMeans` implementation in our machine
learning library, then as a user of the library, here's what we see
when we forget (or don't know) to normalize before clustering:

```haskell
main = do
  df <- readCSV "my_data.csv"
  let clusters = kmeans 10 df
  print clusters
```

leads to the compile-time error:

    • Clustering only gives meaningful results for normalized data.
          See https://bit.ly/2FUHTai for further explanation.
      Please apply a normalizer to your data before clustering.
          See https://link.to.docs for a list of normalizers.
    • In the expression: kmeans 10 df
      In an equation for ‘clusters’:
          clusters = kmeans 10 df

Critically, this error message is aware of the _conceptual_ mistake
we've made. This awareness allows it to teach us why this is a
mistake and point us in the right direction for further learning.
Also in contrast to above, rather than pointing at a technical
failure, and in addition to pointing us at the site of the mistake
("`In the expression...`") **the error message points us _directly_
to the solution.**

Honestly it kind of blows my mind that we, as a community of data
scientists, are choosing not to design our libraries like this.
Having a type system like Haskell's lets us do a lot of this
statically, but nothing's stopping anyone from applying these design
principles in Python. If we put some effort into moving our libraries
in this direction, we could make the learning process easier and
friendlier to novices, make journeymen faster and more productive,
and make it easier for experts to disseminate their knowledge as they
contribute to the ecosystem. Everyone wins.
