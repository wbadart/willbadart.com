---
published: 2025-11-04
---

# Example post

foo bar

```haskell
quicksort :: Ord a => [a] -> [a]
quicksort [] = []
quicksort (x:xs) =
    quicksort (filter (<= x)) xs <> [x] <> quicksort (filter (> x) xs)
```
