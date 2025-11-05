---
title: Host a Website for Free on GitHub Pages
published: 2019-02-18
tags:
- tutorial
- web
---

Those of you who have poked around the footer of this website may
know that I host this blog on [GitHub Pages<i class="fa
fa-external-link"></i>][gh pages]. What you may
*not* know is that I do so for free. This post will walk you through
the basics of standing up a website using GitHub Pages and how to
give it a custom domain name (e.g.  `blog.willbadart.com`).

[gh pages]: https://pages.github.com

<!-- MORE -->

In the future, I may cover how to use the [Jekyll<i class="fa
fa-external-link"></i>][jekyll] static site
generator to easily publish regular posts on your site (like I do
here).

[jekyll]: https://jekyllrb.com


## Step 1: GitHub Account

The first thing you're going to need is an account on [`github.com`<i
class="fa fa-external-link"></i>][gh]. If you
don't have one, register now, and if you do, login.

[gh]: https://github.com


## Step 2: Setup Site Repository

Frankly, the instructions on [`pages.github.com`<i class="fa
fa-external-link"></i>][gh pages anchor] put it
more succinctly than I ever could, so I'll refer you there for the
initial setup steps.

[gh pages anchor]: https://pages.github.com/#user-site


## Step 3: Adding Content

Welcome back.

To modify and add content to your site, you'll need a text editor you
like. For the uninitiated, MS Word and the other word-processing
programs out there add lots of tags and markup for formatting that
are hidden from you as a user, while a text editor shows you the
exact contents of a file. If you don't have one you like, [Atom<i
class="fa fa-external-link"></i>][atom] is pretty
solid, if a little heavy. If you don't want to install a new program,
Mac has TextEdit, and Windows has Notepad.

[atom]: https://atom.io

To add content to the landing page (what people see when they visit
your site at the "root," `https://myusername.github.io`), modify
`index.html` in your text editor. I won't teach you HTML in this
post, but [Code Academy<i class="fa
fa-external-link"></i>][code] has a fantastic
course that gave me my start in web development many years ago.

[code]: https://www.codecademy.com

To add another page (e.g. `https://myusername.github.io/about.html`),
simply create the file within the repo and put whatever you want in
it. Try creating a link to it from the index page:

    And <a href="/about.html">this</a> is my about page.

For a relatively simple example, checkout the layout of
`willbadart.com`'s [index file<i class="fa
fa-external-link"></i>][willbadart repo]. You can
ignore the bits between the triple-dashes (`---`) for now.

[willbadart repo]: https://github.com/wbadart/wbadart.github.io/blob/master/index.html

## Step 4: Site Theme

To set your site's style, login to GitHub and navigate to the
repository you created in step 2. Under the *Settings* tab
(`https://github.com/myusername/myusername.github.io/settings`),
you'll see a section for GitHub Pages configuration with a tool for
selecting a theme.

If you don't like any of these, but still don't want to create your
own, you can use [any theme<i class="fa
fa-external-link"></i>][jekyll themes] with a
GitHub repo, following [these<i class="fa
fa-external-link"></i>][custom theme]
instructions.  This blog uses a custom theme, which is available
[here<i class="fa fa-external-link"></i>][dark
minimal].

[jekyll themes]: https://github.com/topics/jekyll-theme
[custom theme]: https://help.github.com/articles/adding-a-jekyll-theme-to-your-github-pages-site/#adding-a-jekyll-theme-in-your-sites-_configyml-file
[dark minimal]: https://github.com/wbadart/jekyll-theme-dark-minimal


## Step 5: Domain Name

If you don't want to use the URL `myusername.github.io` when you
share your site, you have the option to apply your own domain name.
You'll first need to purchase one from a registrar like [GoDaddy<i
class="fa fa-external-link"></i>][godaddy] (I use
them, but unfortunately was **not** paid to include them in this list) or
[Namecheap<i class="fa
fa-external-link"></i>][namecheap].

[godaddy]: https://www.godaddy.com
[namecheap]: https://www.namecheap.com

The steps themselves are straight forward, but will seem complicated
on your first pass. As in step 2, GitHub puts it better than I do, so
allow me to refer you to their [instructions<i class="fa
fa-external-link"></i>][gh domain] for setting up
an **apex** domain (sub domains won't be covered in this tutorial,
but I can add instructions if there's demand).

[gh domain]: https://help.github.com/articles/setting-up-an-apex-domain


## Conclusion

Hopefully this is enough to stand up version 1 of your site. Creating
a personal page is a great way to both build brand and learn HTML.
Happy hunting!
