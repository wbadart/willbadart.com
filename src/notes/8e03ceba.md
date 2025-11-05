---
date: 2020-11-12T08:45
tags:
- algebra
---

# Paramorphism

A [recursion scheme](ded70ad5.md) that tears down a recursive structure using
an algebra that can view some of the original structure. From the Greek
"[παρά]" for "beside" (as in "parallel"). Like a [[234411dc]], a paramorphism
can see the current result of bottom-up recursion, but can also see the
"argument" or "view of the original structure" that got the computation to that
point.

[παρά]: https://en.wiktionary.org/wiki/%CF%80%CE%B1%CF%81%CE%AC
[fg]: https://ekmett.github.io/reader/2009/recursion-schemes/index.html
[jtobin]: https://jtobin.io/practical-recursion-schemes

```haskell
para :: Functor f => RAlgebra f a -> Term f -> a
para f = out >>> fmap (id &&& para f) >>> f
```

where

```haskell
type RAlgebra f a = f (Fix f, a) -> a
newtype Fix f = In { out :: f (Fix f) }
```

Alternatively, the curried formulation:

```haskell
type RAlgebra' f a = Fix f -> f a -> a

para' :: Functor f => RAlgebra' f a -> Fix f -> a
para' alg t = out t & fmap (para' alg) & alg t
```

Ed Kmett's [recursion schemes field guide][fg] characterizes paramorphism as
primitive recursion. As an example, we can see how expressing factorial as a
paramorphism aligns with the typical inductive definition. Given:

```haskell
data NatF f = ZeroF | SuccF f deriving Functor
type Nat = Fix NatF

int :: Nat -> Int
int = cata \case
  ZeroF   -> 0
  SuccF n -> n + 1
```

we can see how

```haskell
factorial :: Nat -> Int
factorial = para \case
  ZeroF          -> 1
  SuccF (n, fac) -> (int n + 1) * fac
```

lines up with

$$
\begin{split}
0! &= 1 \\
(n + 1)! &= (n + 1) * n!
\end{split}
$$

In the inductive case of the [[0f4cc4fe]] definition, `fac` is the recursive
result "so far" and `n` is the argument that was used to compute it (i.e.
`factorial n == fac`).

_Note:_ the code above uses [[2ea77077]] and [[e3da8e1f]].

In the above example, I fold inductively-defined `Nat`s into `Int`s. The
[`recursion-schemes`][kmett] package uses the [`Base`][base] type family to
make this more natural.

[kmett]: https://hackage.haskell.org/package/recursion-schemes
[base]: https://hackage.haskell.org/package/recursion-schemes-5.2.1/docs/Data-Functor-Foldable.html#t:Base
