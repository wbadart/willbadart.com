---
title:  Arguing for Correctness
published: 2020-01-10
tags:
- data science
- software engineering
categories:
- hdsk
---

One of the most important jobs of a software engineer is convincing
people that a program is correct with respect to some specification
or other. Perhaps most often this person is ourself, but it can also
be a teammate, project manager, or client.

It would be lovely if we could formulate "correctness" as a logical
conclusion, which we could deductively argue using properties of our
programs as premises. That is, if we could _actually prove_ that a
program is correct. The field of _formal methods_ studies this
formulation, but the current techniques for "proving" a program tend
to be heavy-weight and inaccessible to the everyday programmer.

<!-- MORE -->

Because of this, it's much more common to use _inductive reasoning_
to argue for correctness; each premise we present is evidence
suggesting correctness. The more evidence we present, the more
strongly we may believe the conclusion that the program is correct.

> A wise man proportions his belief to the evidence.
>
> &mdash; [David Hume<i class="fa fa-external-link"></i>][goodreads]

[goodreads]: https://www.goodreads.com/quotes/131366-in-our-reasonings-concerning-matter-of-fact-there-are-all

Evidence is said to be "stronger" if, given that evidence, the
conclusion is more likely. Perhaps the most common example of such an
argument is unit testing. When we write a test suite, we implicitly
argue: "these test cases form a representative sample of the
program's possible inputs, so correctness on these cases suggests
correctness for all cases."

The strength of the argument from unit testing is predicated on just
how well the test cases capture the entire input space. We often see
a couple tests for "normal" inputs and a couple for checking corner
cases, like invalid inputs (type systems help us in this regard by
rejecting programs which which supply arguments of the wrong type to
a function, ruling out that class of invalid input).

Hold on. There's another argument for correctness hiding in there.
When we record the types of a program, particularly in a
statically-typed language, we implicitly argue: "the type checker
rejects ill-typed programs, therefore, if the program type checks,
then it is correct to the degree that the type captures the spec."
For example, if our program has the function `capitalize`, which
takes a string to a string, and we type check it, then it would be
redundant (or impossible, depending on the language) to write a unit
test to check how `capitalize` handles invalid inputs of any type
other than "string".

This makes type checking a particularly strong argument for
correctness, since it rules out _classes of errors_ rather than
individual error conditions, as is the case with unit testing.

Unfortunately, it's still possible for well-typed programs to be
incorrect. The canonical example is real number division. Let's write
a spec: "real number division is defined as the quotient of any two
real numbers, except when the divisor is zero, in which case it is
undefined." In most languages, the built in division operation has a
type analogous to "takes two numbers as arguments and returns a
number." The type fails to mention that division is undefined for a
divisor of zero, making division by zero perfectly legal according to
the type system. A function which is incorrect in this manner is
called a _partial_ function; it is undefined for some of its domain.

What a partial function does when it encounters a part of its domain
for which it's undefined is a matter of preference. Matt Noonan
outlines three common idioms in [_Ghosts of Departed Proofs_][gdp]:

> - Run-time failure on bad inputs. The simplest approach is to have
>   a function just fail on malformed inputs. The failure mode can be
>   an immediate run-time error, an exception, or undefined behavior
>   (as in C++'s `std::vector<T>::front()`).
> - Returning a dummy value. To avoid run-time errors, some APIs may
>   have a "dummy value" for indicating the result of a failed
>   operation. For example, Common Lisp's `car` and golang's
>   `Front()` both return `nil` when passed an empty list. The caller
>   must explicitly check for this dummy value.
> - Returning a value with an option type. A related strategy for
>   languages with stricter typing discipline is to use an "option
>   type," such as Haskell’s `Maybe` or Scala's `Option`. A value of
>   type `Maybe T` cannot be used where a value of type `T` was
>   expected, so the user must explicitly pattern match on the
>   optional value to extract the result and handle the error case.
>   This approach may lead to frustration when the user believes that
>   the error case is not possible.

[gdp]: https://kataskeue.com/gdp.pdf

All of the above require extra implementation code to handle the
partial cases, which costs CPU cycles at run-time and adds noise to
the source code which distracts from the actual behavior of the
program.

An alternative to these contortions is to simply write _total_
functions; functions which are defined for their entire domain. Real
number division is only defined for a nonzero divisor, so why should
we write a type which claims it's defined for any pair of numbers?
All we need is a type system expressive enough to encode this
refinement (which we can think of as subtracting the value `0` from a
numerical type). The type should now read "takes a number and a
nonzero number and returns a number." By recording the stated
property that division is undefined when the divisor is zero, this
refined type comes closer to the actual spec. (All that remains is
the property that the returned value is actually the quotient of the
inputs, which we can argue with unit tests.) In this way, bringing
the types of a program closer to its spec generates stronger evidence
for the program's correctness.

Another way to look at this refinement is that we've taken a logical
error and made it a type error. We've taken a potential crash and
turned it into a compile-time error, enhancing safety. The more
properties stated by a spec we can put into a type system, the
stronger an argument for correctness a type check can make.

When it comes to assessing correctness, data scientists have a bit of
an edge in that the algorithms they implement have very concrete
functional specs, namely, their mathematical definitions. However,
some of these algorithms have pretty complicated properties and
preconditions, and it isn't obvious how to encode those in types. The
[next post] will discuss how this is possible.

[next post]: /posts/2020-01-13-argument-from-types/
