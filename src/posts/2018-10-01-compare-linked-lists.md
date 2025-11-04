---
title:  Comparing Linked Lists in C
published: 2018-10-01
tags:
  - programming
  - c
  - tutorial
---

As I may have mentioned briefly in the Coffee Log, part of my morning routine
is to solve a problem or two on [HackerRank<i class="fa
fa-external-link"></i>][hackerrank], just to stay frosty.
I've decided to start writing about my solutions just as an act of reflection
to help me fully comprehend the questions.

<!-- MORE -->

This morning's problem was simply to provide a function for comparing two
linked lists of ints. The problem stated that two linked lists are equal if
they are the same length and each element of one list is equal to that in the
corresponding position of the other.

Like many element-wise operations over linked lists, the recursive solution
came to mind first. So, step one, cover the base case: comparing two empty
lists. From the wording of the problem, I inferred that two empty lists *are*
considered equal.

```c
bool compare_lists(Node* head1, Node* head2) {
    if(!head1 && !head2)
        return true;
    // ...
}
```

Now, if we use the recursive pattern, we only get a narrow view of the list;
essentially just the current element. So how can we know if they have unequal
lengths? Simply, if you reach the end of one before you reach the end of the
other. This can be expressed as:

```c
bool compare_lists(Node* head1, Node* head2) {
    // ...
    if(!head1 && head2 || head1 && !head2)
        return false;
}
```

Fortunately, we have a name for a condition which is true when exactly one of
its two arguments is true: *XOR*. So, replacing our rather verbose length
condition with XOR, we have:

```c
bool compare_lists(Node* head1, Node* head2) {
    if(!head1 && !head2)
        return true;
    else if(head1 ^ head2)
        return false;
    // ...
}
```

I found that depending on your compiler settings, you may need to cast `head1`
and `head2` to booleans in the XOR expression.

Now finally we can handle the recursive case. The problem definition stated
that two lists are equal the lengths are equal and all elements are equal,
pairwise. Well, we already have a pair-wise view of the lists right here in the
current stack frame, so all we need to do is ask if the current pair is equal
and if all the rest are equal:

```c
bool compare_lists(Node* head1, Node* head2) {
    if(!head1 && !head2)
        return true;
    else if(head1 ^ head2)
        return false;
    else
        return head1->data == head2->data
            && compare_lists(head1->next, head2->next);
}
```

And there you have it!

Now, just for fun, let's make a version which is [tail call optimizable<i
class="fa fa-external-link"></i>][SO] (in a slight
oversimplification: a recursive function which the compiler can turn into an
iterative one to avoid the overhead of stack frame allocation).  Because the
current version operates on the return value of the recursive call (ands it
with the logical equality of the current pair), it can't; we need the recursive
call to stand on its own. We can do this by adding an accumulator parameter
(this is my usual go-to for tail call optimization).

```c
bool compare_lists(Node* head1, Node* head2, bool eq) {
    if(!head1 && !head2)
        return true;
    else if(head1 ^ head2)
        return false;
    else
        return compare_lists(
          head1->next, head2->next,
          eq && head1->data == head2->data);
}
```

This also opens the door for one more quick optimization: why bother even
recurring down the rest of the list if you've already encountered an unequal
pair?

```c
bool compare_lists(Node* head1, Node* head2) {
    return compare_listsR(head1, head2, true);
}

bool compare_listsR(Node* head1, Node* head2, bool eq) {
    if(!head1 && !head2)
        return true;
    else if(head1 ^ head2)
        return false;
    else if(!eq)
        return false;
    else
        return compare_lists(
          head1->next, head2->next,
          eq && head1->data == head2->data);
}
```

I'm out of time for writing this morning, but I may revisit this afternoon to
put up some benchmarks for you!

**Edit:** benchmarks are [live][follow-up]!

[SO]: https://stackoverflow.com/a/310980/4025659
[hackerrank]: https://www.hackerrank.com
[follow-up]: /posts/2018-10-08-c-linked-list-follow-up/
