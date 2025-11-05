# Build Systems

## Examples

- [[154f93d5]]#
- `make`
- [[jpfb]]#
- [Meson](https://mesonbuild.com/index.html)
- [[mvmt]]#


## "Forward" build systems

Backwards (typical) build systems draw dependencies from build descriptions (e.g. a `Makefile`) to determine execution order.
In contrast, forward build systems are characterized by a linear build description (e.g. a shell script).
Forward build systems infer dependencies from things like file reads and writes during build execution to recover the caching and parallelization typical of backwards build systems.

- [`Development.Shake.Forward`][shake forward]
- [Rattle](https://github.com/ndmitchell/rattle) (from Shake's author)
- [Stroll](https://github.com/snowleopard/stroll)
  - Seems less developed than Rattle, but has a dependency visualization feature

[shake forward]: https://hackage.haskell.org/package/shake-0.19.6/docs/Development-Shake-Forward.html

## See also

- [_Build System Insights_](https://ruudvanasseldonk.com/2018/09/03/build-system-insights)
- [_Build Systems a la Carte_](https://www.microsoft.com/en-us/research/uploads/prod/2018/03/build-systems-a-la-carte.pdf)
