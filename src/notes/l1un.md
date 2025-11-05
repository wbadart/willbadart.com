# Trio

Trio is a concurrency framework for [[e48fd264]]; an alternative to the
standard library's [asyncio](https://docs.python.org/3/library/asyncio.html).
Trio focuses on usability and correctness to make programs written with it less
error-prone and more straightforward to reason about.

```ipython
>>> import trio
>>> async def main():
...     print("Hello...")
...     await trio.sleep(1)
...     print("...world!")
...
>>> trio.run(main)
Hello...
# 1-second delay
...world!
```

## Tasks: units of concurrency

Trio's _task_ abstraction allows multiple workloads to run concurrently (or in parallel if they're I/O-bound).
Unlike asyncio, which allows tasks to be created anywhere in any async function, Trio tasks can only be spawned from within a context that's prepared to handle their results and errors:

```python
async with trio.open_nursery() as nursery:
    nursery.start_soon(trio.sleep, 1)
    nursery.start_soon(trio.sleep, 1)
```

The nursery context manager will catch exceptions thrown from its child tasks and cleanly cancel its other children.
It will also block at the end of the `with` block, acting like a `Thread.join`.

## Cancellation & Timeouts

Cancellation is handled by "cancel scopes," which can be introduced in a few ways.
For example, to cancel any tasks still running after 10 seconds:

```python
with trio.move_on_after(10):
    await trio.sleep(12)
    print("done sleeping")
print("exited `with` block")
```

**Note, possible foot-gun:** `nursery.start_soon` runs pretty much instantly, so introducing a cancel scope around just spawning a task is basically a no-op:

```python
async with trio.open_nursery() as n:
    with trio.move_on_after(5):
        n.start_soon(trio.sleep, 10)
```

This example will not throw a timeout, since the wait happens as the nursery is exiting, joining all its child tasks. It should instead be written:

```python
with trio.move_on_after(5):
    async with trio.open_nursery() as n:
        n.start_soon(trio.sleep, 10)
```

## Task-local storage

Standard library [`contextvars`][contextvars] can be used to scope shared data to a task and its children:

```python
import contextvars
import uuid

import trio

CONN_ID = contextvars.ContextVar("CONN_ID")

async def server(stream):
    CONN_ID.set(uuid.uuid4())
    await handle(stream)

async def handle(stream):
    async for data in stream:
        print(f"conn {CONN_ID.get()} got msg {data}")

trio.run(trio.serve_tcp, server, 8100)
```

[contextvars]: https://docs.python.org/3/library/contextvars.html

## Synchronization & communication

### `trio.Event`

Same idea (and API) as [`threading.Event`][event].

### Channels

[`trio.open_memory_channel`][channel] gives you a `(MemorySendChannel, MemoryReceiveChannel)`, which act like `{asyncio,threading}.Queue.{get,put}`.
Channels send objects (and `Memory*Channel` does so with next to no overhead [including no serialization]).
Channels implement the context manager API, and when exited, they notify their corresponding endpoint that they're closing:

```python
async def main():
    async with trio.open_nursery() as nursery:
        send_channel, receive_channel = trio.open_memory_channel(0)
        nursery.start_soon(producer, send_channel)
        nursery.start_soon(consumer, receive_channel)

async def producer(send_channel):
    async with send_channel:
        for i in range(3):
            await send_channel.send(f"message {i}")

async def consumer(receive_channel):
    async with receive_channel:
        async for value in receive_channel:
            print(f"got value {value!r}")
```

Without the `with` blocks, this `trio.run(main)` would block until interrupted after the producer is done prodcuing.

Use `Channel.clone` to use a single channel in multiple tasks.
Without clones, if one task closes the channel, the other ones will break with `ClosedResourceError`.
Clones are like filesystem links; the underlying channel is only closed once all the clones are closed:

```python
async def main():
    async with trio.open_nursery() as nursery:
        send_channel, receive_channel = trio.open_memory_channel(0)
        async with send_channel, receive_channel:
            # Start two producers, giving each its own private clone
            nursery.start_soon(producer, "A", send_channel.clone())
            nursery.start_soon(producer, "B", send_channel.clone())
            # And two consumers, giving each its own private clone
            nursery.start_soon(consumer, "X", receive_channel.clone())
            nursery.start_soon(consumer, "Y", receive_channel.clone())

async def producer(name, send_channel):
    async with send_channel:
        for i in range(3):
            await send_channel.send(f"{i} from producer {name}")
            # Random sleeps help trigger the problem more reliably
            await trio.sleep(random.random())

async def consumer(name, receive_channel):
    async with receive_channel:
        async for value in receive_channel:
            print(f"consumer {name} got value {value!r}")
            # Random sleeps help trigger the problem more reliably
            await trio.sleep(random.random())
```

`trio.open_memory_channel` takes a `max_buffer_size` argument specifying the size of the internal buffer.
Setting the buffer size to `0` disables buffering and recovers CSP event-like behavior.
Setting the buffer size to `math.inf` creates an unbounded buffer (usually a bad idea; space leaks and unbound latency, no backpressure, typically only useful in circular queue situations).

[channel]: https://trio.readthedocs.io/en/stable/reference-core.html#trio.open_memory_channel
[event]: https://docs.python.org/3/library/threading.html#threading.Event

## I/O

### Network

- [`trio.open_tcp_stream()`][open tcp]
- [`trio.serve_tcp()`][serve tcp]

^ also have convenience wrappers for SSL over tcp (via stdlib [`ssl`]), and unix sockets.

[open tcp]: https://trio.readthedocs.io/en/stable/reference-io.html#trio.open_tcp_stream
[serve tcp]: https://trio.readthedocs.io/en/stable/reference-io.html#trio.serve_tcp
[`ssl`]: https://docs.python.org/3/library/ssl.html#ssl.SSLContext

### Files

[`trio.Path`][path] provides a [`pathlib.Path`][pathlib]-like file API that delegates operations to a thread so they can be `await`ed.

File performance is tricky; if it's cached, then using the thread with the async API will slow it down, but if it's cold, then you can do other work while the disk spins.
Defaulting to async file I/O can help make performance more predicatable, even if it slows things down in some cases.

[`trio.wrap_file`][wrap_file] lets your wrap an existing file object in Trio's async file API.

[wrap_file]: https://trio.readthedocs.io/en/stable/reference-io.html#trio.wrap_file

[path]: https://trio.readthedocs.io/en/stable/reference-io.html#trio.Path
[pathlib]: https://docs.python.org/3/library/pathlib.html

### Subprocesses

[`trio.run_process`][run_proc] is like `subprocess.run`.

```python
completed_process_info = await trio.run_process(...)
running_process = await nursery.start(trio.run_process, ...)
```

For the `running_process` case, setting `stdout=subprocess.PIPE` sets `running_process.stdout` to a `trio.abc.ReceiveStream` (ditto for stdout, and stdin [but it becomes a `SendStream`]).

[run_proc]: https://trio.readthedocs.io/en/stable/reference-io.html#trio.run_process

#### Signals

[`trio.open_signal_receiver`][signal] installs signal handlers active for the `with` block it opens:

```python
with trio.open_signal_receiver(signal.SIGHUP) as signal_aiter:
    async for signum in signal_aiter:
        assert signum == signal.SIGHUP
        reload_configuration()
```

[signal]: https://trio.readthedocs.io/en/stable/reference-io.html#trio.open_signal_receiver

## Resources

- [Homepage](https://trio.readthedocs.io/en/stable/index.html)
- [`trio-parallel`](https://trio-parallel.readthedocs.io/en/latest/index.html) library for process-based parallelism
- [Slurry](https://slurry.readthedocs.io/en/latest/index.html) async stream framework based on Trio
