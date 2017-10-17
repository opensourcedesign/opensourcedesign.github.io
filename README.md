# opensourcedesign.github.io [![Travis Badge](https://travis-ci.org/opensourcedesign/opensourcedesign.github.io.svg)](https://travis-ci.org/opensourcedesign/opensourcedesign.github.io)

Website of the Open Source Design community, hosted on Github pages.

## Edit Website

Editing content on [opensourcedesign.net][osd-net] can be done in two relatively 
simple ways, both of which, require a GitHub account.

1. Using GitHub's nifty file editor

![Github file tools](images/github-file-tools.png)

2. Using the [Prose Editor][osd-prose]
3. Modifying source code (technical)

## Code & Design The Website

You need some basic ability to use a terminal as well as some knowledge of web 
development like HTML, CSS, and JavaScript. The site is built with the following
programming tools:

- [Jekyll][jekyll]
- [Bootstrap][bootstrap]

### Installing

This step requires having a `ruby` development environment and `git` installed 
and configured to connect to Github with SSH. 

- [Installing Ruby][installing-ruby]
- [Using Github with SSH][github-ssh]

1. Install Jekyll using and other ruby gems

```
sudo gem install bundler 
```

2. Fork and clone the main website repository

```
git clone git@github.com:opensourcedesign/opensourcedesign.github.io
cd opensourcedesign.github.io/
bundle install
```

3. Run our installer script

This will pull down all of the repositories (jobs, events, etc...) and put them
in there proper place to build our website locally.

```
./scripts/install.sh 
```

*Note: you need to be a member of our [GitHub organization][osd-org].*

4. Build the static site & watch for files 

```
jekyll serve --watch --config _config.yml,_config-dev.yml
```

### Updating

Updating the various repos can be done with running the this script

```
./scripts/update.sh
```

[osd-net]: http://opensourcedesign.net
[osd-prose]: http://edit.opensourcedesign.net
[osd-org]: https://github.com/opensourcedesign/
[jekyll]: https://jekyllrb.com
[bootstrap]: https://getbootstrap.com
[installing-ruby]: https://www.ruby-lang.org/en/documentation/installation/
[github-ssh]: https://help.github.com/articles/connecting-to-github-with-ssh/
