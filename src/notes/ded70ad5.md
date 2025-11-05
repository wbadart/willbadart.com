---
date: 2020-10-19T11:27
tags:
- fp
- algebra
---

# Recursion Schemes

Recursion schemes generalize various modes of tearing down or building up
recursive #data-structures, allowing programmers to specify the "meat" of a
recursive function separately from the mechanical specifics of recursing.

| Name | Characterization | Takes
|------|------------------|------
| [[234411dc]]# | `foldr` | F-algebra: `f a -> a`#
| [[4bb5719e]]# | `unfoldr` | F-coalgebra: `a -> f a`#
| [[8e03ceba]]# | primitive recursion | R-algebra: `f (Fix f, a) -> a`#
| [[b48c52f0]]# | primitive corecursion | R-coalgebra: `a -> f (Fix f \| a)`#
| [[3b8573c9]]# | fold with helper algebra | helper algebra and main algebra#
| [[c5c9b27a]]# | produce then consume | an F-coalgebra and an F-algebra#
| [[59fc6bcf]]# | history-preserving fold | CV-algebra: `f (Attr f a) -> a`#
| futumorphism | forward-info-passing unfold | CV-coalgebra: `a -> f (CoAttr f a)`
| (chronomorphism) | produce then consume (w/ extra capability) | a CV-coalgebra and a CV-algebra

where

```haskell
newtype Fix f = In { out :: f (Fix f) }

data Attr f a = Attr
  { attribute :: a
  , hole      :: f (Attr f a)
  }

data Coattr f a
  = Automatic a
  | Manual (f (CoAttr f a))
```

Table distilled from Patrick Thomson's [series] on recursion schemes and [Tim
Williams]' talk.

[series]: https://blog.sumtypeofway.com/posts/recursion-schemes-part-6.html
[Tim Williams]: https://www.youtube.com/watch?v=Zw9KeP3OzpU

## Relevant Papers

- [_Functional Programming with Bananas, Lenses, Envelopes and Barbed
    Wire_][fp]: not the first literature on recursion schemes, but introduced
    the now-common category-theoretic formulation
- [_Primitive (Co)Recursion and Course-of-Value (Co)Iteration,
    Categorically_][corecursion]: introduced histo- and futumorphism
- [_Recursion Schemes from Comonads_][comonad]: introduces a general
    formulation of recursion schemes based on comonads. The original bunch are
    recovered by instantiating the general pattern at a particular comonad
- [_Origami Programming_][origami]: TODO

[fp]: https://ris.utwente.nl/ws/portalfiles/portal/6142047/db-utwente-40501F46.pdf
[corecursion]: https://www.researchgate.net/publication/2237199_Primitive_CoRecursion_and_Course-of-Value_CoIteration_Categorically
[comonad]: https://www.researchgate.net/publication/220673192_Recursion_Schemes_from_Comonads
[origami]: https://www.cs.ox.ac.uk/jeremy.gibbons/publications/origami.pdf

## See Also

- <http://ekmett.github.io/reader/2009/recursion-schemes/index.html>
- <https://jtobin.io/practical-recursion-schemes>
