---
title: Correction for "GDP for Data Science"
published: 2025-11-06 18:31Z-0600MST
tags:
- haskell
---

If my blog were Stack Overflow, I think this post would earn me an _Excavator_ badge.

![Excavator badge on SO](./assets/excavator.png)

(Or maybe a [_Necromancer_][necromancer] if this post got a little traction.)

[necromancer]: https://stackoverflow.com/help/badges/17/necromancer?userid=4025659

In the course of revitalizing this site and reviewing some historical material (a
process I documented in the [previous post]), I found my coverage of Matt Noonan's
[_Ghosts of Departed Proofs_][gdp].

[previous post]: /posts/2025-11-05-astro/
[gdp]: /posts/2020-01-14-gdp-for-data-science/

At a previous job, I undertook a research project investigating how to apply GDP to data
science (a project, I should add, that I _greatly_ enjoyed). The idea was to encode
domain knowledge about the pre- and post-conditions of data science and machine learning
algorithms into the type system to catch mistakes earlier in the research process and
give better, more domain-relevant error messages in the process.

I contrived an example about a preprocessing pipeline that, as it worked, accumulated
proof that each processing step had been performed. These proofs were later discharged
to satisfy the preconditions of the library's clustering and classification algorithms
(not pictured):

```haskell
data Normalized
normalize :: df -> df ::: Normalized

data NoMissingVals
dropMissingVals :: df -> df ::: NoMissingVals
fillMissingVals :: df -> df ::: NoMissingVals

(.|) :: (a -> a ::: p) -> (a -> a ::: q) -> a -> a ::: p && q

preprocess :: df -> df ::: NoMissingVals && Normalized
preprocess = normalize .| fillMissingVals
```

With the benefit of hindsight, I realized that this formulation has a subtle but
critical mistake.

The proven properties must be linked to the data they describe by a _name_, or else the
proofs could be "conjured" away from the original data and attached to another term
_that did not undergo the preprocessing pipeline_:

```haskell
import Data.Refined ((...), conjure)

dfGood :: df ::: NoMissingVals && Normalized
dfGood = preprocess someData

dfBad :: df ::: NoMissingVals && Normalized
dfBad = otherData ...(conjure dfGood)
```

Our algorithms would accept `dfBad` even though it _doesn't_ actually meet their
preconditions.

## The fix

Bridge the earthly realm of data and phantom realm of proofs using a [name]. Something
like:

[name]: https://hackage.haskell.org/package/gdp-0.0.3.0/docs/Theory-Named.html

```haskell
import Theory.Named (Defn)

newtype Normalized df = Normalized Defn
normalize :: df ~~ name -> df ::: Normalized name

newtype NoMissingVals df = NoMissingVals Defn
dropMissingVals :: df ~~ name -> df ::: NoMissingVals name
fillMissingVals :: df ~~ name -> df ::: NoMissingVals name

preprocess :: df ~~ name -> df ::: NoMissingVals name && Normalized name
```

I still need to work through the details and implementation in a real example, but this
is where I'd start.

The naming process in GDP leverages the ST trick, using a rank-2 signature to protect
names from leaking to the wrong terms. Unlike in the original formulation, here there's
no well-typed way for me to steal the proof of processing from `dfGood` and attach it to
`dfBad`; the processing proof would only apply to `dfGood`'s name, which will never be
the same as `dfBad`'s name thanks to the ST trick.

Having written the original post five years ago, I don't remember if this mistake was an
intentional elision for the sake of brevity in a blog post, or a genuine oversight. In
any case, it was fun to trawl the archives, and satisfying that my recollection of GDP
was still _just_ sharp enough to notice the error!
