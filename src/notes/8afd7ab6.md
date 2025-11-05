---
date: 2020-12-22T14:16
---

# Bayesian Inference

Bayesian inference leverages [[2dd4bb00]] to predict a value about some datum
of interest. Bayesian inference is about updating a prior belief to consider
new evidence or observations. Under Bayesian thinking, we interpret probability
as belief, so "updating a belief" amounts to updating an estimated probability.
This means that the output of Bayesian inference is not a single prediction,
but a probability distribution of outcomes (intrinsically capturing remaining
uncertainty).

Bayesian inference (and, more generally, statistical inference) tries to model
real-word events with [[ecfb7538]]s. The challenge is in estimating the true
parameters of the distribution describing the variable. The challenge is
compounded by the fact that only trivial events can be described by single
distributions, so accurate models must be comprised of systems of random
variables. Therefore, Bayesian inference is concerned with _beliefs_ about the
parameters to the relevant distributions.

Tweag's [blog series] on [`monad-bayes`][pkg] (part 2) gives a good motivating
explanation:

> The lawn is wet, did it rain? The ground moves, is there an earthquake?
> Prices rise, are we in an economic crisis? Wiggly lines appear on the screen,
> did a black hole perturb gravity on Earth? Patterns emerge in software
> dependency graphs and source code, is this the outcome of a particular
> development style? Evidence is found in a legal discovery procedure, is
> anyone guilty of wrongdoing?
>
> We continuously make observations similar to “the lawn is wet”. Such data
> touches our senses either directly, or indirectly through a measurement device.
> It is visible, concrete, and therefore unquestioned here—contrary to the
> invisible and abstract processes that might have generated it.
>
> Neither can every process generate this data— earthquakes don't (usually) wet
> the lawn, black holes don't (yet) influence prices, and criminal behaviour
> doesn't (often) bring about specific source code patterns— nor is there a
> unique process that can generate it: earthquakes and black holes can both move
> the ground; sprinklers and rain can wet the lawn equally well. Hence, a process
> implies data, but data doesn't imply a process.
>
> The conclusion is that we can't conclude that a single process is behind the
> data, but processes aren't indistinguishable either. We can compare them by
> assessing how likely it is that they generate the data. Bayesian inference and
> the laws of probability tell us how to make this comparison rationally.
>
> Conceptually it is simple: Define a set of processes that we want to compare
> and prior beliefs in each of them (the prior distribution). For each of these
> processes, describe and compute the probability that it generates the observed
> data (the likelihood). Score each process - that is multiply the prior belief
> in a process with the likelihood. Renormalize and examine the result, the
> posterior beliefs in each model (the posterior distribution).

[blog series]: https://www.tweag.io/blog/2019-09-20-monad-bayes-1/
[pkg]: https://github.com/tweag/monad-bayes
