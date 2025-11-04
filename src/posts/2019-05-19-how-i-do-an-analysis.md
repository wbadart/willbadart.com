---
title: How I Do an Analysis
published: 2019-05-19
tags:
- data science
- python
---

I've been working as a full-time data scientist for the better part
of a year now and wanted to take a moment to step back and document
my process.

<!-- MORE -->

The Booz Allen data science community is largely an R + Python shop,
with my team falling into the latter camp. I confess having
reservations about Python for data science, but for small-scale
analyses, I've seen that it can work.

When I decide to tackle an analysis using Python, here's what I do.

## Requisites

To get the most out of this post, I recommend having at least topical
familiarity with the following:

- Command line (knowing how to navigate folders on the command line,
  knowing what it means to be "in" a directory, etc.)
- Python language and project basics (have used `setuptools` and
  friends)
- The `make` build system
- Git

**WARNING:** Opinions ahead.

## 00 - Initialization

Every project I do -- including analyses -- gets its own folder, so
my first step is always to create a folder. On my work machine, a
Mac, I have a folder `~/Documents/proj` where I put all my projects.
If the analysis is stand-alone (i.e. not part of a larger project) it
gets its own folder here:

```shell
mkdir ~/Documents/proj/my-analysis
cd $_
```

Otherwise, if it *is* a component of a larger project, it becomes a
subdirectory of that project.

### Document EVERYTHING

An analysis is ultimately a scientific experiment to test one or more
hypotheses about some data, whose findings will form the basis for
further research, business decisions, or some other communication.
However, the recipients of our findings are often not data scientists
themselves, and can't verify by introspection alone whether our
conclusions are valid. We need another way to build trust with our
audiences.

To this end, one of the most important attributes of any scientific
experiment is **reproducibility**: if someone else can emulate our
experimental environment and get the same results as us, then that is
evidence supporting the analysis' validity. On the other hand, if
someone using an analogous environment *fails* to reproduce our
findings, then this is evidence that something has gone wrong.

This is as true for data science as it is for any other science.
Therefore, I strive to make my analyses as easy to reproduce as
possible. One of the most important things I do to achieve this is to
**document EVERYTHING**.

As we'll soon see, this includes (but is not limited to) explicitly
writing down:

1. Steps to recreate the environment
2. Python package dependencies
3. Explanation for all changes made to code base
4. Experimental procedure/ task interdependencies

The documentation of an analysis should form a cohesive,
well-defined, easy-to-follow narrative with a consistent beginning,
middle, and end.  My "beginning" is always`README.md`, a [GitHub
Flavored Markdown<i class="fa
fa-external-link"></i>][gfm] document which
contains my initial ideas and plans for the analysis. Here's an
outline:

```markdown
# my-analysis

I had this really cool idea about doing this one thing on this one
[dataset][dataset online]. I'm going to compare this model and that
one to see which one is better for my use case.

[dataset online]: https://cool-data.com/info

## Requirements

WIP

## Setup

WIP
```

[gfm]: https://guides.github.com/features/mastering-markdown/

I include blank sections for **Requirements** and **Setup** because I
use them to document the analysis' environment. They will be present
in virtually every single `README` I write, though what exactly they
say will of course depend on the project.

At this point I also download GitHub's Python [`gitignore`<i
class="fa fa-external-link"></i>][py gitignore] as
this will be important for the next step:

```shell
curl -LsSo .gitignore 'https://raw.githubusercontent.com/github/gitignore/master/Python.gitignore'
```

[py gitignore]: https://github.com/github/gitignore/blob/master/Python.gitignore

### Version Control EVERYTHING

Version control is itself a form of documentation: it documents the
change history of your files. Making sure I'm still in the new
project directory (which is often referred to as the "project root")
I initialize it as a [Git<i class="fa fa-external-link"></i>][git
guide] repository:

```shell
git init
```

I track projects with Git whenever I can, even if I'm the only one
who will ever see or touch the code. Having a log of every revision
you make to a project and being able to revert those changes can be
indispensable (and this usefulness extends beyond the code files of
your project, including data and documentation too). For example, if
I come back to some funky looking code a month after I write it, I
don't have to wonder what was going on in my head, I can check the
log:

```console
$ git blame src/funstuff.py
a6ea915b (Will Badart 2019-03-26 14:19:12 -0700   1) FOO = 'bar'
a6ea915b (Will Badart 2019-03-26 14:19:12 -0700   2)
a6ea915b (Will Badart 2019-03-26 14:19:12 -0700   3) def funtimes():
c3e471dd (Will Badart 2019-03-27 03:43:05 -0700   4)   global FOO
c3e471dd (Will Badart 2019-03-27 03:43:05 -0700   5)   FOO = 'teehee'

$ git show c3e471dd
commit c3e471dd812fa8e0b35210478207597daab1c72d
Author: Will Badart <will@willbadart.com>
Date:   Wed Mar 27 03:43:05 2019 -0700

    Fixed that bug I was having with a really clever and sustainable
    solution.
```

The benefits multiply when it comes time to collaborate on project
code. Best of all, Git is completely free money-wise, and insanely
cheap effort/ overhead -wise. All you have to do is write a little
message when you make a set of changes.

**NOTE:** You will enjoy your life more if you keep your commits
[atomic<i class="fa
fa-external-link"></i>][commits].

**NOTE**: Check out [nbdime<i class="fa
fa-external-link"></i>][nbdime] to help version
control Jupyter notebooks.

[git guide]: https://rogerdudler.github.io/git-guide
[commits]: https://curiousprogrammer.io/blog/why-i-create-atomic-commits-in-git
[nbdime]: https://nbdime.readthedocs.io/en/latest

At this point, I write my initial commit explaining what steps I took
to initialize the project:

```shell
git add README.md .gitignore
git commit -v
```

If you're planning on using GitHub or some other remote, now would be
a good time to create the remote repository in the web interface and
configure your local repo to talk to it. Using the URL from the
**Clone or download** button:

```shell
git remote add origin git@github.com:wbadart/my-analysis.git
```

`origin` is just the conventional name for the main remote. The URL
should reflect your preference for SSH vs. HTTPS (mine is SSH because
it lets met push without inputting a password).

## 01 - Sandbox Configuration

If you try and use your global system Python binary and/ or packages
for every project (or *any* project for that matter) you will find
yourself in a world of pain.

Instead, use one of the many virtual environment management tools put
forth by the Python community over the years to isolate your project
environment, and keep projects from overwriting each others'
dependencies.  If I know up front that my project will depend on any
Anaconda-only packages, I use `conda`'s [environment management<i
class="fa fa-external-link"></i>][conda env].
Otherwise, I stick with the lightweight, tried and true
[`virtualenv`<i class="fa
fa-external-link"></i>][virtualenv]:

```shell
virtualenv -p `which python3` .venv
. .venv/bin/activate
```

[conda env]: https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html
[virtualenv]: https://virtualenv.pypa.io/en/stable/

Isolating your environment gives you bonus points for
reproducibility; the stronger the isolation, the easier it is to
consistently recreate the environment. At the expense of a bit of
overhead and boilerplate, you can run your analysis in a Docker
container for near-perfect isolation, but for most small to medium
analyses, a virtual environment is enough.

### Dependency Management

When writing Python software, I prefer to track project dependencies
in the `install_requires` section of a `setup.py` file. For an
analysis, however, which will not be "installed" to a new system with
`setuptools`, I track them in `requirements.txt`. Some people will
advise you to periodically update your `requirements.txt` file like
so:

```shell
pip freeze > requirements.txt
```

You would then commit the changes. This is a valid approach that
strongly guarantees that the versions of any packages used by the
project will align across systems. However, I prefer a different
method.

You see, `pip freeze` outputs the complete contents of your virtual
environment's site packages. It's a lot of information, but
interestingly, it *removes* the information that I try to communicate
to others with a `requirements.txt` file, namely, the direct
dependencies of *my* project; the packages *my* code imports and
uses. My dependencies' dependencies are just noise.

For this reason, I maintain `requirements.txt` by hand, adding a new
entry every time I `pip install` something, making sure to include
sufficient version constraints:

```console
$ pip install pandas
Collecting pandas
  Using cached https://files.pythonhosted.org/packages/2a/67/0a59cb257c72bb837575ca0ddf5f0fe2a482e98209b7a1bed8cde68ddb46/pandas-0.24.2-cp36-cp36m-macosx_10_6_intel.macosx_10_9_intel.macosx_10_9_x86_64.macosx_10_10_intel.macosx_10_10_x86_64.whl
Requirement already satisfied: numpy>=1.12.0 in ./.venv/lib/python3.6/site-packages (from pandas) (1.16.3)
Requirement already satisfied: python-dateutil>=2.5.0 in ./.venv/lib/python3.6/site-packages (from pandas) (2.8.0)
Requirement already satisfied: pytz>=2011k in ./.venv/lib/python3.6/site-packages (from pandas) (2019.1)
Requirement already satisfied: six>=1.5 in ./.venv/lib/python3.6/site-packages (from python-dateutil>=2.5.0->pandas) (1.12.0)
Installing collected packages: pandas
Successfully installed pandas-0.24.2

$ echo 'pandas==0.24.2' >> requirements.txt
```

A caveat: the one package I use in just about every analysis but do
*not* track in `requirements.txt` is [Jupyter Lab<i class="fa
fa-external-link"></i>][jlab]. Unlike the other
packages I use for an analysis, Jupyter Lab isn't a library I import
and use in the source code. It's a tool. People may prefer to use
other notebook viewers, such as the old-school Jupyter Notebook
interface.

[jlab]: https://github.com/jupyterlab/jupyterlab

Of course, I commit changes to `requirements.txt` whenever I make
them.

## 02 - Analysis is a DAG, or, How I Learned to Stop Worrying and Love `make`

> In this analysis, my pre-processing script can't run unless the raw
> data is present, and the visualization notebook can't run without
> the pre-processed data and the serialized model files, which are
> generated by...

Sound familiar? A full analysis is a network of these interdependent
tasks which, when executed in just the right order, take you all the
way from raw data to you conclusions.

This ordering of which tasks depend on which others exists in any
analysis, regardless of whether it's explicitly documented.  As a
courtesy to others trying to run my analysis (which, again, should be
easy if my results are to be reproducible, and, by extension,
trustworthy) I choose to document it.

Writing down "you need to run the pre-processing script before you
train the models" and such in a `README` is better than nothing, but
it leaves the door wide open to human error in reproducing your
steps. Therefore, I choose a more expressive medium for declaring my
task dependencies, one whose native language is tasks and
dependencies, and one which can be found on virtually any (\*NIX)
system: [`make`<i class="fa
fa-external-link"></i>][make].

[make]: https://en.wikipedia.org/wiki/Make_(software)

Just like `requirements.txt`, I build up a `Makefile` incrementally
as I execute the tasks of my analysis. It records the commands to run
a task as well as the dependencies of that task. ([Here's<i class="fa
fa-external-link"></i>][make tut] a quick tutorial
if you've never seen a `Makefile` before.) For example, I usually
start by recording how to acquire the raw data:

[make tut]: http://www.cs.colby.edu/maxwell/courses/tutorials/maketutor

```make
##
# Makefile
# created: MAY 2019
##

data: data/raw/cooldataset.csv data/raw/otherstuff.csv

data/raw:
    mkdir -p $@

# cooldataset.csv depends on data/raw being present
# If it's not, run the data/raw "recipe" above
data/raw/cooldataset.csv: data/raw
    curl -LsSo $@ https://cool-data.com/raw.csv
    chmod -w $@

# same story here
data/raw/otherstuff.csv: data/raw
    aws s3 cp s3://other/stuff.csv ./$@
    chmod -w $@
```

Now I, or anyone with a copy of the project, can get the raw dataset
simply by running:

```shell
make data
```

I leave it as a task to the reader to research the internal
mechanics of `make`, how it analyzes dependencies and only does work
when it has to. Just know that if you've accurately stated every
task's decencies in the `Makefile`, you can simply state your end
goal (e.g. `make deliverables` at the command line) and `make` will
take care of everything else that needs to be done without
duplicating work done. This definitely beats reproducing someone's
steps by hand.

**NOTE:** When my raw data lands on disk, I `chmod -w` it (make it
read-only) to prevent accidental changes.

Now let's say I've created a pre-processing script. At this point I'd
record how to use it as well as what's required to run it in the
`Makefile`:

```make
data/processed:
    mkdir -p $@

data/processed/cooldataset.csv: data/raw/cooldataset.csv data/processed src/preprocess.py
    python -m src.preprocess $< --gpu -v > $@
```

The command line args of your pre-processing script will of course
vary, this is just an example. Now someone can run:

```shell
make data/processed/cooldataset.csv
```

to generate the pre-processed dataset.

Ultimately, I'll end up with a target such as `model` or `report` or
some other deliverable such that someone can clone my analysis' Git
repository, and simply run `make report` to completely reproduce my
results. In other words, I try my darnedest to make my results
completely reproducible with three simple commands:

```shell
git clone https://github.com/wbadart/my-analysis.git
cd my-analysis
make report
```

Since `make` knows the internal dependencies of our tasks, we can
tell it run independent tasks concurrently with the `-j` ("jobs")
flag:

```shell
make -j2 report   # Use 2 concurrent worker processes
make -j report    # Use `nproc` concurrent worker processes
```

I leave you with some further reading from the folks I first heard
this idea from, [Cookiecutter Data Science<i class="fa
fa-external-link"></i>][cookie]. I encourage you to
read the whole page, but there's a link to *Analysis is a DAG* in the
sidebar if you're pressed for time.

[cookie]: https://drivendata.github.io/cookiecutter-data-science/

## Putting it All Together

With the above process as a backdrop, the sometimes tedious work of
experimentation becomes a lot smoother an more enjoyable. By
recording my procedure in the `Makefile` and keeping tabs on file
changes with Git, I always know how I got to where I'm at, which
helps me determine where to go next. Having a consistent `README`
across projects makes it easier for others to hit the ground running
when they want to contribute. Using a sandbox environment keeps me
from getting inaccurate results when package versions change out from
under me.

This flow has worked well for me, but it's not the only path to
reproducibility. If I missed something big, or there's something I
should try, let me know!
