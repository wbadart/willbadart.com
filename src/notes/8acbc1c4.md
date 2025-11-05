---
date: 2020-04-26T08:34
tags:
- algebra
---

# Relational Algebra

Relational algebra is a notation for composing tables, primarily in ways that
represent interesting queries in a concrete data base system.

## Basic Operations

- **σ**: selection. $σ_P(R)$ gives the rows of relation R satisfying predicate P.
- **π**: projection. $π_{c_1..c_n}(R)$ gives the relation R with only the listed
  columns. π gives a set (note, project in SQL gives a bag/ multiset unless the
  column has `DISTINCT`).
- **ρ**: rename. $\rho_{a/b}(R)$ gives the relation R with column b renamed to a.

For example, to get the names of students in an enrollment relation who are
juniors from Washington, you could say
*π_name(σ_homeState=WA ∧ year=JR(Students))*.

## Joins

- **x**: Cartesian product. R x S gives every pairing of tuples from R and S.
- **⋈**: Natural join. R ⋈ S gives the set of all combinations of tuples in R
  and S that are equal on common attribute names. Interesting note from
  Wikipedia:
  
  > This can also be used to define composition of relations. For example, the composition of Employee and Dept is their join as shown above, projected on all but the common attribute DeptName. In category theory, the join is precisely the fiber product.
  
- **⋈θ**: Theta join. R ⋈θ S gives all combinations of R and S that satisfy θ.

## Resources

- https://en.wikipedia.org/wiki/Relational_algebra
- https://www.youtube.com/watch?v=cVQUvZh64Y8
