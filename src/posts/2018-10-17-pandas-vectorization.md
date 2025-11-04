---
title:  Fast DataFrame Processing with Vectorized Functions
published: 2018-10-17
tags:
  - data science
  - pandas
  - python
---

You may have heard about *vectorized* functions in the context of numpy, and
that they're faster than regular Python functions because the iteration happens
in C world.

<!-- MORE -->

I recently had an experience with this at work, and wanted to share the
comparison I made. It's a simple example on the same netflow data discussed in
[this][indices] post.

[indices]: /posts/2018-10-15-indices-are-important/

We want to engineer a feature (create a new column), *Service*, which is an
estimate of which service the netflow event corresponded to (e.g. SMTP or
sshd). It's a simple heuristic: take the minimum of the source and destination
port. The one catch is that some ports start with a letter, which we want to
get rid of. Here's one way to do it:

```python
def compare_ports(row):
    src, dest = row
    if src[0].isalpha():
        src = src[1:]
    if dest[0].isalpha():
        dest = dest[1:]
    return min(src, dest, key=int)

df['Service'] = df[['src_port', 'dest_port']].apply(compare_ports, axis=1)
```

On the full dataset of about 130M records, this took over half an hour. The
better way is the vectorized way, which operates on the whole data frame so
that iteration can take place under the hood:

```python
def strip_prefix(df, col):
    return df[col].replace(r'^\w(\d+)', value=r'\1', regex=True).astype(int)

def compare_ports_vec(df):
    src, dest = strip_prefix(df, 'src_port'), strip_prefix(df, 'dest_port')
    return pd.concat([src, dest], axis=1).min(axis=1)

df['Service'] = compare_ports(df)
```

This implementation takes about 11 minutes for me, a speedup of around 3x.

Just wanted to share this casual benchmark with you to motivate frame-level
thinking over row-level thinking.
