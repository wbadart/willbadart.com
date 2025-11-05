---
date: 2020-12-22T19:24
---

# Probabilistic Programming

Probabilistic programs deal in [[ecfb7538]]s, rather than specific point
values, to model randomness and/ or uncertainty inherent to the processes they
describe.

> [U]nlike a traditional program, which only runs in the forward directions, a
> probabilistic program is run in both the forward and backward direction. It
> runs forward to compute the consequences of the assumptions it contains about
> the world (i.e., the model space it represents), but it also runs backward
> from the data to constrain the possible explanations. In practice, many
> probabilistic programming systems will cleverly interleave these forward and
> backward operations to efficiently home in on the best explanations.

- [1] Cronin, Beau. "Why Probabilistic Programming Matters." 24 Mar 2013. Google, Online Posting to Google . Web. 24 Mar. 2013. https://plus.google.com/u/0/107971134877020469960/posts/KpeRdJKR6Z1.

Also, from the [Pyro docs]:

> The real utility of probabilistic programming is in the ability to condition
> generative models on observed data and infer the latent factors that might
> have produced that data.

[Pyro docs]: http://pyro.ai/examples/intro_part_ii.html#Conditioning

In practice, probabilistic programs are often written in (embedded)
[[921e7d70]]s (EDSLs) which add the required notions of randomness to the other
features of the underlying host language. Examples include:

- In Python
  - [[9762a43b]]#
  - [[df18affd]]#
- In Haskell
  - [[4a9d7352]]#
- [[8c2755e3]]#

(The line between EDSL and library can sometimes be fuzzy. For example,
[[ae5314ad]]# is used much in the same way as Pyro or PyMC3, but markets itself
as a library.)


## Resources

- <http://pyro.ai>
- <https://docs.pymc.io>
  - <https://arviz-devs.github.io/arviz>
- <https://hackage.haskell.org/package/monad-bayes-0.1.1.0/docs/Control-Monad-Bayes-Class.html>
- <https://www.tensorflow.org/probability>
