---
title:  Domain Theory, Take 1
published: 2020-03-19
---

I recently took a crack at Thomas Streicher's [_Domain-Theoretic
Foundations of Functional Programming_<i class="fa
fa-external-link"></i>][book]. I can't remember how
I happened on it, but it seemed to nicely follow my foray into formal
methods from last winter. On this first pass, I got through about
three and a half chapters (if I'm being generous) before everything
started flying over my head, so I've tried to capture what I did get
below. (Any domain theorists out there, please forgive my grossly
oversimplified model of the field.)

[book]: https://doc.lagout.org/programmation/Functional%20Programming/Domain-Theoretic%20Foundations%20of%20Functional%20Programming%20%5bStreicher%202006-12-04%5d.pdf

<!-- MORE -->

Domain theory is a tool for analyzing programs. The chapters of the
book I read studied the relationship between the purported _behavior_
of a program &mdash; its _operational_ semantics &mdash; and the
program's _meaning_ &mdash; its _denotational_ semantics.

An observational semantics (this seemingly strange plural/ singular
situation is how it appears in the literature, don't ask me)
describes the relationship between terms or expressions formed from
the syntax of a language and the values to which they evaluate. There
are two ways to describe that relation: **big step semantics**, and
**small step semantics**. A big step semantics is (or seems to me to
be) a relation in the traditional set-theoretic sense which pairs
expressions with values. A small step semantics defines a relation
between pairs of terms (rather than terms with values) where one
_reduces_ to the other through one application of a reduction (e.g.
beta), as governed by the language's typing rules. You might think of
an interpreter as a machine which successively applies the small step
semantics to evaluate a term to some value.

One of the major advantages of considering all this, which might on
the surface seem to be vapid ceremony on top of an already perfectly
usable programming language, is that it gives a mathematical
foundation for testing. When you have a continuous integration server
run tests on your code, and don't allow merging until the tests pass,
you're really using unit tests as a means to compare programs,
namely, the program as it was before your diff, and the "new" program
with your diff applied. If the new program passes the tests, then
we're satisfied that it's sufficiently equivalent to the old program.
That is, if we _observe_ that the new program evaluates to the same
values as the old, we're satisfied it's equivalent enough on the axes
we haven't meant to change. An operational semantics gives rise to a
formal notion of **observational equality** between two programs. For
programs $P$ and $Q$, if, for all contexts $C$, $P$ and $Q$, evaluated within
$C$, yield the same value, then they are observationally equivalent.
This would give us a rigorous formal foundation for constructing
correctness proofs from things like unit tests, but "context" can be
a fuzzy thing, and quantifying over the universe of possible contexts
is a fool's errand.

This is one motivation for establishing a _denotational semantics_
for your program. A denotational semantics assigns every expression
some element from the **semantic domain** of the expression's type.
We call that particular element the expression's "meaning,"
"semantics," or "denotation." Domain theory studies what structures
are useful to impose on that domain, for the purpose of discovering
and proving properties of the programs that domain describes.

The first chapter introduces methods of equating a denotational
semantics with an operational semantics, in increasing order of
strength. My take away was that the stronger the equivalence between
the two semantics, the more things you can prove about the operations
by working with the denotations (which is desirable because in
denotation land, you can work with well studied algebraic objects,
and don't run into the context quantification problem).

That's about all I got for you on this run. I hope to find some lower
level material (recommendations welcome!) and revisit this text at a
later point. What I did get through made the application of
denotational semantics much more concrete within my personal mental
model, so I'm excited to unlock the insights from the remaining
chapters.
