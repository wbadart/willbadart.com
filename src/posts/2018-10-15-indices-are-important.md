---
title:  Indices are Important
published: 2018-10-15
tags:
  - data science
  - tutorial
  - python
---

I recently joined the biggest data project I've ever been a part of at work.
It's not necessarily huge by modern big data standards, but the main element
I'm working on has over 130 million records, and takes up more than 5 Gigabytes
on HDFS. The main dataset for the project is over 160 GB.

This post is an attempt to document and motivate the practice of
conscientiously indexing your datasets to improve preprocessing performance.

<!-- MORE -->

My main dataset is the netflow data [published<i class="fa
fa-external-link"></i>][data] by the Los Alamos National
Lab, and the task I'm going to focus on is cross-referencing that data with the
red team data in order to tag netflow events.

[data]: https://csr.lanl.gov/data/cyber1

For simplicity's sake, let's assume a netflow event is "bad" if a member of the
red team logged into its source in the preceding hour. With this simple
heuristic, the task of tagging an individual netflow event becomes a matter of
querying the red team data for auth events within a set time window, with a set
destination (the auth destination matches the netflow source).

I've been working with [pandas<i class="fa
fa-external-link"></i>][pandas], so here's the above
expressed with pandas `DataFrame`s:

```python
def netflow_is_bad(event, window='1 hour'):
    window = pd.Timedelta(window)
    redteam_auths = DF_REDTEAM[ (DF_REDTEAM.time <= event.time)
                              & (DF_REDTEAM.time >= (event.time - window)
                              & (DF_REDTEAM.dest == event.src) ]
    return not redteam_auths.empty
```


Here, we query the red team authentication events for records whose timestamp
is greater than the start of the relevant window and less than the time of the
netflow event, and whose destination is the source of the netflow. We
accomplish this with a big giant [mask<i class="fa
fa-external-link"></i>][mask].

This is **expensive**.

The mask for each of those three conditions costs `O(R)` (where *R* is the size
of the red team dataset) to construct, and another `O(R)` to `&` together, and
*another* `O(R)` to apply to the data frame (the step which actually extracts
the relevant elements). This approach takes 3:45" to tag 100,000 netflow
events.

![There must be a better way!](./assets/better_way.png)

Raymond has the right of it, there must be a better way.

[pandas]: http://pandas.pydata.org
[mask]: https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#boolean-indexing
<!-- [mask]: https://pandas.pydata.org/pandas-docs/stable/indexing.html#boolean-indexing -->

## Basic Indexing

Fundamentally, both the netflow data and the red team data are *time series*
datasets; our main query of the red team set is slicing by time. Fortunately
pandas, and many other data object managers (like SQL) have baked in support
for these semantics. In our case, this is pandas' [`DatetimeIndex`<i class="fa
fa-external-link"></i>][dtindex].

[dtindex]: https://pandas.pydata.org/pandas-docs/stable/generated/pandas.DatetimeIndex.html

An index will help our program by making some of those linear-time operations
constant time (basically; indexes are either trees or hashtables, depending on
the implementation, and using them actually costs `log(D)` where depth *D* is a
fixed implementation parameter, but `D << N`, so we'll hand-wave and call it
`O(1)`).

Our red team data is already timestamped, so we can tell pandas to use that
column as the index, rather than the default behavior (which is to create a
`RangeIndex`; number each item sequentially, which adds no particularly useful
information).

```python
DF_REDTEAM = pd.read_csv(PATH_REDTEAM, index_col='time', **OTHER_PARAMS)
```

Now, instead of masking to select the red team auth events in our window, we
can just grab a slice:

```python
def netflow_is_bad(event, window='1 hour'):
    window = pd.Timedelta(window)
    redteam_auths = DF_REDTEAM.loc[(event.time - window):event.time]
    return not redteam_auths[redteam_auths.dest == event.src].empty
```

This is not only a simpler, more readable implementation, but much faster: only
1:19" to tag 100,000 netflow events (~2x improvement). However, there's still
one more linear operation that we have the chance to make constant time: the
source/ destination comparison.

## Multi-index

Enter the [MultiIndex<i class="fa
fa-external-link"></i>][multiindex]. A dataset with a
multi-index can be queried in tiers, so to speak. The documentation I linked to
uses multi-indexing and hierarchical indexing more or less interchangeably.
Under this structure, to select a given data element, you query first by one
key, then the next, and the next, and so on, for however many keys you set in
the index.

[multiindex]: https://pandas.pydata.org/pandas-docs/stable/advanced.html

In our case, we want to add the red team auth event's *destination* to the
index, so we can query by that in constant time. In pandas, it couldn't be
easier:

```python
DF_REDTEAM = pd.read_csv(
    PATH_REDTEAM, index_col=['dest', 'time'], **OTHER_PARAMS)
```

Note how the order of `index_col` above corresponds to the order of our calls
to `.loc` below. Now, we can select by red team destination, and then by time:

```python
def netflow_is_bad(event, window='1 hour'):
    window = pd.Timedelta(window)
    return not DF_REDTEAM.loc[event.src]\
                         .loc[(event.time - window):event.time]\
                         .empty
```

I think this is the most readable implementation yet, and is the fastest,
taking only **21.9 seconds** to tag 100,000 netflow events (a 10x speedup).

The moral of the story is that you should give a moment of thought to the
structure of your data, and how you'll be querying it. Don't just let pandas or
whatever framework decide for you what your indexing structure will be. The
power is in your hands!

## A Note on Vectorization

In the above cases, I've been constructing the tag column with the following:

```python
DF_NETFLOW['red'] = pd.Series(map(netflow_is_bad, DF_NETFLOW.itertuples()))
```

I found that this was faster than `DataFrame.apply`. However, the ideal
implementation is *vectorized* and operates on the whole data frame at once:

```python
DF_NETFLOW['red'] = netflow_is_bad(DF_NETFLOW)
```

I couldn't work this out though, since red team query depends on the source of
an individual netflow event. I haven't yet figured out how to do this on the
broadcast scale. If we didn't care about source, the current time-based query
structure actually works, but alas, that would be a meaningless heuristic.
