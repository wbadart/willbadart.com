---
title: "Rust Is Cool"
published: 2020-10-15T08:46:54-04:00
tags:
- rust
---

I recently set out to learn the [Rust] programming language. Why? Because new
languages are fun and maybe I'll use it some day.

[Rust]: https://www.rust-lang.org

It also so happens that lots of smart people from the functional programming
communities I lurk in [also like Rust][fpcomplete]. This was fascinating to me
at first; my experience with functional programming has been about as far away
from machine code as you can imagine. Meanwhile, I understood Rust to be
something of a modernized C++.

[fpcomplete]: https://www.fpcomplete.com/blog/2018/11/haskell-and-rust

Curiosity thoroughly piqued, I cracked open ["The Book"][book] and immersed
myself in Rust for several days. I've now come out the other side, and would
like to my share my impressions of the language.

[book]: https://doc.rust-lang.org/book

## Type System

It became clear very quickly why Rust was attracting my FP associates: Rust has
an [algebraic type system][adt], that is, a way to specify new types as
collections and alternatives of other types. We call these new types "algebraic
data types," or ADTs. ADTs go hand-in-hand with one of my favorite programming
language features: _pattern matching_ &mdash; which I'm happy to report is
supported by Rust.

I'm a big fan of ADTs because they let you specify all the possible outcomes of
a function (including errors) and the type checker will make sure that any
calling code handles all of them.  For a quick example (that _almost_
compiles):

[adt]: https://en.wikipedia.org/wiki/Algebraic_data_type#Examples

```rust
enum FirstLineResult {
    Result(String),
    EmptyList,
}

fn first_line(lines: Vec<String>) -> FirstLineResult {
    if lines.is_empty() {
        EmptyList
    } else {
        Result(list[0])
    }
}

fn my_business_logic(lines: Vec<String>) {
    let message = match first_line(lines) {
        Result(s) => format!("The first line was {}!", s),
        EmptyFile => String::from("Dunno, it was empty"),
    };
    println!("{}", message);
}
```

Examples like this one have led me to consider algebraic data to be something
like "domain-specific control flow." `FirstLineResult` documents the various
alternative outcomes of our computation, `first_line`, in the language of the
domain, including what information is available in each case: if you get a
`Result` back, then there's a `String` available to you &mdash; otherwise you
had an `EmptyList` and you don't know anything else. Moreover, the compiler
will make sure you've handled all the cases: we can't treat a `FirstLineResult`
like a string, and we can't pattern `match` on it without handling `EmptyFile`.
This means, for all intents and purposes, that this part of our application
will always be in a known state and will only have to reason about valid,
expected data (more on this "safe functional core" [here][parsons] and
[here][lambda]).

[parsons]: https://www.parsonsmatt.org/2017/10/11/type_safety_back_and_forth.html
[lambda]: https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate

Of course, `FirstLineResult` is a specific instance of a very common and much
more general pattern. Rust's _generics_ gives us a repeatable and expressive
way to leverage this pattern and others like it.

### Generics

"Computations which might fail" are ubiquitous, and they have a name in Rust:
`Option`. We could have written `FirstLineResult` as:

```rust
type FirstLineResult = Option<String>;

// for reference, our previous definition:
// enum FirstLineResult {
//     Result(String),
//     EmptyFile,
// }
```

where

```rust
enum Option<T> {
    Some(T),
    None,
}
// notice the structural similarity to `enum FirstLineResult`
```

You either "have some `T`" or you "have none."

In this expression, `T` is a "type variable" or "type parameter." I often hear
"generic type" refer to a type, like `Option`, that has one or more type
parameters. Generic types are a great tool for abstraction, letting you
encapsulate general patterns in a reusable way. What's _more_, I find, is that
they're also a great help for **correctness**. To illustrate, here's a cute
example (which also casually illustrates Rust's support for higher-order
functions, another killer feature):

```rust
fn wat(f: fn(f64) -> f64, xs: Vec<f64>) -> Vec<f64> {
    let mut result = Vec::new();
    for x in xs {
        result.push(???);
    }
    result
}
```

What should I push to my `result`? There are so many things you can do to an
`f64` like `x` &mdash; negate it, divide it by two, replace it with pi &mdash;
how could we possibly say which one is right? Even if you guessed that `wat` is
`map` and we should simply push `f(x)`, it's not immediately obvious,
_especially_ for machines (who we might be asking to write some code for us).

Generics<sup>1</sup> take our options away by abstracting over irrelevant
types:

```rust
fn wat2<A, B>(f: fn(A) -> B, xs: Vec<A>) -> Vec<B> {
    let mut result = Vec::new();
    for x in xs {
        result.push(???);
    }
    result
}
```

We need to get our hands on a `B` to push into our `result` (a vector of `B`s).
Working backwards through the types and terms we have in scope, there's only
one way for us to get a `B`: by calling `f`. But `f` will only give us a `B` if
we give it an `A`. Luckily, we have an `A` in scope right now: `x`. The types
have naturally led us to the correct implementation<sup>2</sup>:

```rust
fn my_map<A, B>(f: fn(A) -> B, xs: Vec<A>) -> Vec<B> {
    let mut result = Vec::new();
    for x in xs {
        result.push(f(x));
    }
    result
}
```

Nothing in `wat` was actually specific to `f64`s, so generics let us abstract
over that type and forget all the minutiae and baggage that came with it.

There are of course cases where want to know _a little_ about `A` or `B` or
`T`. For example, we can't yet write:

```rust
fn negate_all<T>(xs: Vec<T>) -> Vec<T> {
    let mut result = Vec::new();
    for x in xs {
        result.push(- x);
    }
    result
}
```

because Rust doesn't know how to negate a `T`:

```text
error[E0600]: cannot apply unary operator `-` to type `T`
 --> src/lib.rs:4:21
  |
4 |         result.push(- x);
  |                     ^^^ cannot apply unary operator `-`

For more information about this error, try `rustc --explain E0600`.
```

Luckily for us, the Rust compiler has fantastic error reporting, and the
explanation for `E0600` is:

> An unary operator was used on a type which doesn't implement it.

Remember, we don't know anything about `T`. `negate_all`'s type claims "for
_any_ `T`, if you give me a vector of `T`s, I'll give you one back." The thing
is, that's a lie: `negate_all` only works for `T`s it knows how to negate.

We can refine which `T`'s `negate_all` refers to with a "trait bound." (In
Rust, a _trait_ is basically an interface; a collection of methods a concrete
type might implement.) Now we can clarify our earlier claim, specifying that
`negate_all` works for any `T` _which implements negation_<sup>3</sup>:

```rust
fn negate_all<T: Neg>(xs: Vec<T>) -> Vec<T> { /* ... */ }
```

This turns out to be a wildly useful way to write functions. Rather than
starting with a concrete type and all the baggage (i.e. extraneous operations)
that comes with it, you can start with some `T`. As you write your
implementation, you recognize which operations you _actually do_ need to
perform, and constrain `T` accordingly. This workflow is something of a
trait-driven extension to the point above about generics supporting
correctness.

## Error Propagation

Another joy of Rust is its automatic error propagation. To explain what makes
it such a joy, I'll do my best to explain a problem in Haskell with which I
only have topical, second-hand familiarity.

Earlier, we saw how algebraic data can help us encode and handle all the
possible outcomes of a function, including errors. We saw the venerable
`Option` type, and now I'll introduce its sister, `Result`:

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Like `Option`, `Result` has two variants: one for success and one for failure.
_Unlike_ `Option`, `Result`'s error case includes a piece of data about the
error. This `E` can be a simple string with an error message, but best practice
dictates that `E` too should be an ADT, one enumerating the ways things could
go wrong. This way, callers can pattern match on the error and handle each case
appropriately:

```rust
enum FileOpenError {
    NotFound,
    PermissionDenied,
}

fn fopen(path: String) -> Result<String, FileOpenError> { /* ... */ }

fn main() {
    match fopen("foo.txt") {
        Ok(contents) => println!("Foo says: {}", contents),
        Err(NotFound) => println!("Couldn't find foo.txt"),
        Err(PermissionDenied) => println!("I'm sorry, Dave"),
    }
}
```

In Haskell, `Option` and `Result` are called `Maybe` and `Either`,
respectively. If you'll excuse the biggest hand-wave of the decade, `Maybe` and
`Either` also "automate" error propagation:

```haskell
data Maybe    t = Just t  | Nothing
data Either e t = Ok t    | Err e  -- <- different names IRL

data FileOpenError = NotFound | PermissionDenied

fopen       :: String -> Either FileOpenError String
count_lines :: String -> Either FileOpenError Int

do_stuff :: Either String FileOpenError
do_stuff = do
  foo_contents <- fopen "foo.txt"
  foo_length   <- count_lines "foo.txt"
  return (foo_contents ++ show foo_length)
```

Notice how we didn't have to pattern match on (that is, manually handle) the
results of `fopen` or `count_lines`; when composed like this, operations of
type `Either e` will short-circuit on the first operation to return an `Err e`,
returning that error.

The challenge is that while `t` can vary from one operation to the next
(`String` then `Int` above) `e` _must_ be fixed if we're to take advantage of
this automatic error propagation. For example, this doesn't type-check:

```haskell
data FileOpenError = NotFound | PermissionDenied
data DbError = ConnectionRefused | Timeout

fopen      :: FilePath -> Either FileOpenError String
some_query :: String   -> Either DbError       String

do_stuff2 = do
  username <- fopen "alice_info.txt"
  alice    <- some_query username
  return alice
```

Our compiler will tell us:

```text
• Couldn't match type ‘DbError’ with ‘FileOpenError’
  Expected type: Either FileOpenError String
    Actual type: Either DbError String
```

I'll spare you the details, but the machinery which lets us sequence `Either`
operations with that handy short-circuiting/ automatic error propagation is
called "bind," and it looks like this:

```haskell
bind :: Either e a -> (a -> Either e b) -> Either e b
--      ^^^^^^^^^^ first op
--                          ^^^^^^^^^^ second op (can use "a" if it wants)
--               resulting sequence of ops ^^^^^^^^^^
```

Notice that while the first and second operations may or may not share a result
type (sometimes `a` ~ `b`, sometimes not), `e` stays the same. A lot of
[ink][parsons2] has been spilled on this topic, so I'd encourage you to conduct
some research on your own.

[parsons2]: https://www.parsonsmatt.org/2018/11/03/trouble_with_typed_errors.html

For now, we have some context on the problem, so we can finally return to how
this all plays out in Rust. Rust also has a special notation which concisely
encapsulates this automatic error propagation:

```rust
fn fopen(path: String)      -> Result<String, FileOpenError>
fn count_lines(path: String -> Result<u32,    FileOpenError>

fn do_stuff() -> Result<String, FileOpenError> {
    foo_contents = fopen("foo.txt")?;  // <-- notice the question mark
    foo_length   = count_lines("foo.txt")?;
    Ok(format!("{}{}", foo_contents, foo_length))
}
```

No more pattern matching! Now let's try to vary `e`:

```rust
fn do_stuff2() -> Result<String, ???> {
  let username = fopen("alice_info.txt")?;
  let alice    = some_query(username)?;
  alice
}
```

It's not immediately obvious what new "overall" error type should be.
`do_stuff2` could get a `FileOpenError` or a `DbError`. Well, we've seen that
Rust can express types which are "either this or that," so let's just say that
directly and see how the compiler reacts:

```rust
enum MyError {
    MyFileError(FileOpenError),
    MyDbError(DbError)
}

fn do_stuff3() -> Result<String, MyError> {
  let username = fopen("alice_info.txt")?;
  let alice    = some_query(username)?;
  alice
}
```

Rust tells us:

```text
error[E0277]: `?` couldn't convert the error to `MyError`
  --> src/lib.rs:24:41
   |
24 | let username = fopen("alice_info.txt")?;
   |                                       ^ the trait `From<FileOpenError>` is not implemented for `MyError`
   |
   = note: the question mark operation (`?`) implicitly performs a
     conversion on the error value using the `From` trait

For more information about this error, try `rustc --explain E0277`.
```

This is another example of Rust's outstanding error reporting (and we get a
similar one for our use of `?` with `some_query`). In contrast to Haskell,
Rust's error propagation machinery gives us a hook we can use to explain how to
go from one `e` to the next! As the complier explained, this is the `From`
trait. When we implement that trait for the composite `MyError`<sup>4</sup>,
the code successfully complies.

In the relatively minuscule amount of Rust I've written to date, I've found
that this concise error propagation syntax has encouraged me not to just throw
away inconvenient errors (and open the door to runtime crashes) by letting
"business" code easily delegate to purpose-built error handling code.

## Memory Management

Remarkably, I'm over 2,000 words into a blog post about Rust and I haven't even
_used_ the word "memory" yet.

Right on the tin, Rust makes it clear that it's designed to help you make the
most of your machine's memory:

> Rust is blazingly fast and memory-efficient: with no runtime or garbage
> collector[.]
>
> Rust's rich type system and ownership model guarantee
> memory-safety and thread-safety — enabling you to eliminate many classes of
> bugs at compile-time.
>
> &mdash; [rust-lang.org][Rust]

A garbage collector (GC) is a subroutine built in to many modern languages that
automatically cleans up memory the main program doesn't need anymore. It saves
programmers the headache of manual memory management and obsoletes some classes
of memory bugs. However, a GC can be prohibitively expensive in terms of CPU
cycles and memory in the performance-critical situations Rust was geared
towards.

"Traditionally," no GC means manual memory management (a la C/C++). Rust breaks
this tradition, finding a middle path with its (quite unique) _ownership_
system.

I, as a Rust novice, encourage you to take my summary of ownership with a grain
of salt and to follow the link above to The Book. That said, here's how I
conceptualize ownership: the Rust compiler has a global view of your program
and can see all the operations a particular datum might be subject to and
where. It uses this information to reject data-flows that can result in bad
behavior. For example, to prevent a class of bad behavior known as "data
races," Rust lets you keep only one _mutable_ (think "writable") reference to
an object at a time. This rule and many others, which are baked into the
compiler, prevent data from being mutated out from under you when you were
expecting it not to change.  Rust has a [panoply] of reference and pointer
types to express different sharing and thread-safety semantics &mdash; allowing
you to explicitly specify how any particular data may be used, shared, copied,
or transported.

[panoply]: https://doc.rust-lang.org/book/ch15-00-smart-pointers.html

Learning the ownership system felt very similar to (re)learning static typing
through Haskell a number of years ago. I was coming from Python, where most of
the exploration of a solution space takes place at run time, playing with
various sample inputs, seeing how the program behaves, and adjusting it
accordingly. I was used to finding a solution by debugging a running program,
so you can imagine my frustration starting up with Haskell, where the whole
program must type-check before you can run it. Eventually, I learned to explore
solutions in the type system, where GHC is extremely well-equipped to assist
you. This switch forced me to premeditate my solutions much more deeply; to
understand how _exactly_ subcomponents would fit together, which functions
would be able to perform I/O, and so on. **I feel a similar switch coming on
with Rust's ownership system.** Now though, rather than premeditating the
responsibilities and relationships of my program's subcomponents, I'm
premeditating who will use which data and how. Rather than letting a runtime
figure it out for me, I have to be conscious of when bytes should be copied,
references shared, and ownership transferred.

I'm really looking forward to digging in deeper, hopefully with a proper
project. Just like learning a new language or programming paradigm, I think
Rust's ownership system is so unique that learning it will result in important
and meaningful growth for anyone who engages with it, even if we don't end up
using the language.

## Conclusion

I have a few more, semi-formed thoughts on Rust, but this post is tortuously
long already. For now, I'm very optimistic about the language. You can't sneak
any nonsense past the compiler, but it will help you express your ideas
correctly. I'm looking forward to writing a lot more Rust soon!

---

- <sup>1</sup>The more general theory is [parametric
    polymorphism] for those interested.

- <sup>2</sup>I was hand-waving a bit. We could have gotten our hands on
    another `A` by indexing into `xs`. To prevent this, we could generalize
    again, this time over the container type rather than the element type,
    taking away our ability to index.

    We also could have said

    ```rust
    fn my_map_wrong<A, B>(f: fn(A) -> B, xs: Vec<A>) -> Vec<B> {
        Vec::new()
    }
    ```

    returning an empty vector of `B`s. The `map` we're implementing is the
    operation of an abstract class of algebraic objects known as "functors,"
    and there are some laws about `map`'s behavior that prevent mistakes like
    returning an empty vector from `my_map`. Unfortunately, it's up to you, not
    Rust, to make sure your implementation is lawful.

    Finally, Rust lets you intersperse side-effects into functions at will, so
    the type checker will still let you launch the proverbial missiles from
    `my_map`, and it's on you to make sure you don't.

- <sup>3</sup>This was also a bit of a lie. In Rust, negation is allowed
    to result in a different type from the input, so the signature should
    actually read:

    ```rust
    fn negate_all<T: Neg<Output=U>, U>(xs: Vec<T>) -> Vec<U> { /* ... */ }
    ```

    I elided the extra ceremony to get across the point about constraining `T`
    to types which implement the `Neg` trait.

- <sup>4</sup>The trait implementation itself wasn't really vital to my
    point, so I didn't inline it, but here it is for the curious among you:

    ```rust
    impl From<FileOpenError> for MyError {
        fn from(e: FileOpenError) -> MyError {
            MyError::MyFileError(e)
        }
    }

    impl From<DbError> for MyError {
        fn from(e: DbError) -> MyError {
            MyError::MyDbError(e)
        }
    }
    ```

    I'm honestly not sure if this is the idiomatic approach &mdash; I'm very
    new to Rust and its community &mdash; so I'd love to hear feedback. Is
    there an automated way to generate `From` implementations for simple cases
    like this?

[parametric polymorphism]: https://en.wikipedia.org/wiki/Parametric_polymorphism
