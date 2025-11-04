---
title:  C Linked List Follow-up
published: 2018-10-08
tags:
  - programming
  - c
  - tutorial
---

About a week ago I walked through my solution to [comparing two linked
lists][last post] in C. At the end, I hinted I might write some benchmarks to
compare the two approaches discussed. Well, here they are.

[last post]: /posts/2018-10-01-compare-linked-lists/

<!-- MORE -->

## Recap

The basic solution in the simplest terms looks at each pair of elements, and
asks (1) if they're the same, and (2) if the rest of the list is the same. It's
so short, I'll just copy it here:

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

The other solution "improved" on this by enabling tail call optimization with
the addition of an accumulator parameter (please read the post linked above if
this sentence didn't track).

## Testing

*Note: if you'd like to follow along with the code, please see [this<i
class="fa fa-external-link"></i>][gist] gist.*

When I first ran the benchmarks on 10,000 items, the run times of each program
were pretty close, but the "optimized" version was actually running a couple
nanoseconds slower, consistently. (Both had been compiled with `-O3`)

Puzzled, I decided to see if I could make sense of what the compiler had done
by checking out the assembly. To do this, you can either disassemble the object
file with `objdump -d ...` ([here's<i class="fa
fa-external-link"></i>][objdump] the man page) or re-assemble
from source using `gcc -S ...`. I chose the latter since it includes labels.

[gist]: https://gist.github.com/wbadart/08813823beed6fb45664de8783706745
[objdump]: https://linux.die.net/man/1/objdump

The first thing that struck me was how many fewer instructions the first
version generated: 40 lines compared to 117 lines. This is probably the
explanation for the constant-order time difference from my initial testing.
Next, and more importantly, I failed to find a call to the `call` instruction,
which, as I've been led to believe by [this<i class="fa
fa-external-link"></i>][SO] Stack Overflow post, means that
GCC (I'm on version 8.2.1) was actually able to tail-call optimize the first
version too. Surely enough, when I recompiled with `-O0`, the `call` was
present. The unoptimized version couldn't even handle a million elements
without blowing the stack/ running out of memory.

[SO]: https://stackoverflow.com/questions/490324/how-do-i-check-if-gcc-is-performing-tail-recursion-optimization#490389

So, I suppose the moral of the story is that GCC is really smart, and so are
the people who contribute to it. Mad respect.
