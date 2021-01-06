# [opensourcedesign.net](https://opensourcedesign.net)

Website of the Open Source Design community, hosted on GitHub Pages.

[![Backers on Open Collective](https://opencollective.com/opensourcedesign/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/opensourcedesign/sponsors/badge.svg)](#sponsors) [![Twitter Follow](https://img.shields.io/twitter/follow/opensrcdesign?style=social)](https://twitter.com/opensrcdesign)

## Edit Website

Editing content on [opensourcedesign.net][osd-net] can be done in two ways, both of which, require a GitHub account.

1. Using GitHub's nifty file editor

![GitHub file tools](images/github-file-tools.png)

2. Modifying source code (technical)

## Code & Design The Website

You need some basic ability to use a terminal as well as some knowledge of web
development like HTML, CSS, and JavaScript. The site is built with the following
programming tools:

- [Jekyll][jekyll]
- [Bootstrap][bootstrap]

### Installing

This step requires having a `ruby` development environment and `git` installed
and configured to connect to GitHub with SSH.

- [Installing Ruby][installing-ruby]
- [Using GitHub with SSH][github-ssh]

1. Install Jekyll using and other Ruby gems

```sh
sudo gem install bundler
```

2. Fork and clone the main website repository

```sh
git clone --single-branch --branch master https://github.com/opensourcedesign/opensourcedesign.github.io.git
cd opensourcedesign.github.io/
bundle install
```

3. Run our installer script

This will pull down all of the repositories (jobs, events, etc...) and put them
in there proper place to build our website locally.

```sh
./scripts/install.sh
```

*Note: you need to be a member of our [GitHub organization][osd-org].*

4. Build the static site & watch for files

```sh
bundler exec jekyll serve --watch --config _config.yml,_config-dev.yml
```

### Updating

Updating the various repositories can be done by running this script

```sh
./scripts/update.sh
```

[osd-net]: http://opensourcedesign.net
[osd-org]: https://github.com/opensourcedesign/
[jekyll]: https://jekyllrb.com
[bootstrap]: https://getbootstrap.com
[installing-ruby]: https://www.ruby-lang.org/en/documentation/installation/
[github-ssh]: https://help.github.com/articles/connecting-to-github-with-ssh/


## 👩‍🚀 Contributors, backers & sponsors

This project exists thanks to all the **people who contribute**.
<a href="graphs/contributors"><img src="https://opencollective.com/opensourcedesign/contributors.svg?width=890&button=false" /></a>

Thank you to **all our backers**! 🙏 ([Become a backer](https://opencollective.com/opensourcedesign#backer))

<a href="https://opencollective.com/opensourcedesign#backers" target="_blank"><img src="https://opencollective.com/opensourcedesign/backers.svg?width=890"></a>

**Support this project by becoming a sponsor.** ([Become a sponsor](https://opencollective.com/opensourcedesign#sponsor))

<a href="https://opencollective.com/opensourcedesign/sponsor/0/website" target="_blank"><img src="https://opencollective.com/opensourcedesign/sponsor/0/avatar.svg"></a>


## ♥ Code of Conduct

Please note that Open Source Design has a [Contributor Code of Conduct](https://opensourcedesign.net/code-of-conduct/). By participating in this project online or at events you agree to abide by its terms.


## 📜 License

**🔀 You can use & modify everything as long as you credit [Open Source Design](https://opensourcedesign.net) and use the same license for your resulting work.** [Code license is AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html) and content is [Creative Commons Attribution-ShareAlike](https://creativecommons.org/licenses/by-sa/4.0/).
