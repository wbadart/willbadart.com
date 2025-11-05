# Pants

Pants is a build system that uses a combination of build definition files and static analysis to coordinate and execute builds of (possibly polyglot) projects.
The use of static analysis to infer dependencies allows build files to be pretty thin.
Pants runs as a shell script (checked into VCS) which manages the underlying Python app (with a Rust extension powering the core build engine).

Pants supports a variety of ["backends"][backends] which correspond to tools (linters, compilers, test frameworks, ...) for a variety of languages.

[backends]: https://www.pantsbuild.org/docs/enabling-backends#available-backends

## Links

- [Homepage](https://www.pantsbuild.org/)
- [Docs](https://www.pantsbuild.org/docs/initial-configuration)
