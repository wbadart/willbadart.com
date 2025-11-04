---
title:  Simple BST Validation
published: 2018-10-02
tags:
  - programming
  - c
  - hiring
  - tutorial
---

Today, my HackerRank problem was a bit of a blast from the past. `isBST` (i.e.,
write a function which determines whether a tree is a binary search tree or
not) has come up on more than one interview in the past.

<!-- MORE -->

I remember my first time seeing this in an interview. There's one little
*gotcha* you might hit if you just talk it out and program according to your
logic. The solution reads something like "a tree is a BST if the root is
between its left and right children, and its subtrees are also BSTs." It might
look something like this:

```c
bool isBST(Node* root) {
    if(!root) return true;
    else return root->data > root->left->data
             && root->data < root->right->data
             && isBST(root->left)
             && isBST(root->right);
}
```

Well... not quite. Aside from the fact that this will `SEGFAULT` at leaf nodes,
it also doesn't quite capture the essence of a BST; **there's no guarantee that
`root->left->right` is less than `root`.** Search your feelings, you will know
it to be true.

So what can we do instead? We need some way of tracking the current max and min
allowed values for the current subtree, depending on its parents. When we
traverse down to the left, we constrict the maximum of the subtree, and
vice-versa for traversing to the right. Mine looks something like this:

```c
#include <limits.h>

bool isBST(Node* root) {
    return _isBST(root, INT_MIN, INT_MAX);
}

bool _isBST(Node* root, int min, int max) {
    if(!root) return true;
    else return root->data > min && root->data < max
             && _isBST(root->left, min, root->data)
             && _isBST(root->right, root->data, max);
}
```

Here, I use `INT_MIN` and `INT_MAX` sort of like plus or minus infinity (many
languages have constructs for this, such as `Infinity` in JavaScript and
`float('inf')` in Python): the root can take any value between plus and minus
infinity, so that's the range we validate it against. As we go down, we
constrict the valid range as described above.

So there's your simple `isBST`, hope it gives a little insight into the thought
process for getting a question like this on an interview.
