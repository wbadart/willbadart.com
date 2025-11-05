---
title:  HDSK Development Blog Intro
published: 2018-09-04
tags:
  - haskell
  - data science
  - functional programming
categories:
  - hdsk
---

During my last semester at school, I started to dabble in the world of
functional programming. I picked up a little Haskell, watched a number of talks
by some really smart people (TODO: find and link to said talks) about some
really clever ideas.

<!-- MORE -->

At first it was mostly an academic exercise, but I slowly began to realize that
functional programming concepts *belong* in general programming practice
([here<i class="fa fa-external-link"></i>][haskell vs] is a
research paper from 1994 comparing prototyping productivity in a handful of
programming languages. Some key results are shown below).

![Haskell vs. ...][haskell vs fig3]

What's more is the growing reliance on parallelism for performance; when your
processor can only go so fast, you need to start doing more than one thing at
once to finish the greater task faster. Functional programming lends itself
well to this paradigm, since there's no shared state between pure functions.

I say all of this (and believe me, there's still more to say) to motivate the
use of functional programming in **data science**. For instance, the models
which underpin real-time data systems are some of the most
performance-sensitive applications in data science, and must often fold
together many parallel streams of input. Why would you **not** choose the
paradigm that makes it easiest to manage the innate complexity of a system like
this?

There are lots of folks out there who have said it better than this, and I'll
be linking them in future posts. For now, here's the talk by [Rich Hickey<i
class="fa fa-external-link"></i>][rich] which got me started
down this whole rabbit hole:

<iframe width="560" height="315" src="https://www.youtube.com/embed/rI8tNMsozo0?si=V7ZCCLqiMndeEswJ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Unfortunately, the data science ecosystem around Haskell (many believe) is
[pretty sparse<i class="fa fa-external-link"></i>][linkedin
article], so adoption is lagging.

To remedy this (and to deepen my understanding of Haskell and functional
programming in general) I've begun work on the *Haskell Data Science Kit*, or
*HDSK*. Through HDSK, I hope to provide all the basic tooling that libraries
like scikit-learn provide and make it easy for data scientists to take full
advantage of the benefits of functional programming.

I've stated some goals for the project in the [repo homepage<i class="fa
fa-external-link"></i>][hdsk readme], and have sketched out
some planned modules and higher-level steps I want to take in the [wiki<i
class="fa fa-external-link"></i>][wiki].

Through this blog -- in addition to the wiki and other documentation -- I'll be
journalling design decisions about the library, brainstorms, and other
miscellaneous thoughts that I feel ought to be documented. Stay tuned for
further posts with the *hdsk* tag.

[haskell vs]: https://web.archive.org/web/20190513061518/http://haskell.cs.yale.edu/wp-content/uploads/2011/03/HaskellVsAda-NSWC.pdf
[haskell vs fig3]: ./assets/HaskellVs.png
[rich]: https://github.com/richhickey
[linkedin article]: https://www.linkedin.com/pulse/haskell-data-science-good-bad-ugly-tom-hutchins/
[hdsk readme]: https://github.com/wbadart/hdsk
[wiki]:        https://github.com/wbadart/hdsk/wiki
