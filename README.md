# [opensourcedesign.net](https://opensourcedesign.net)

Website of the Open Source Design community, hosted on GitHub Pages.

[![Backers on Open Collective](https://opencollective.com/opensourcedesign/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/opensourcedesign/sponsors/badge.svg)](#sponsors)
[![Mastodon Follow](https://img.shields.io/badge/mastodon-@opensourcedesign-blue?logo=mastodon)](https://mastodon.social/@opensourcedesign)
[![Bluesky Follow](https://img.shields.io/badge/bluesky-OpenSourceDesign-blue?logo=bluesky)](https://bsky.app/profile/opensourcedesign.net)

## Edit Website

Editing content on [opensourcedesign.net][osd-net] can be done in 2 ways, all of which require a GitHub account.

1. Using GitHub's nifty file editor, which is quick but limited:

    ![](images/github-file-tools.png)

1. [Setting the website up locally](#code--design-the-website), which is more technical

## Code & Design The Website

To contribute to the [website](opensourcedesign.net), you'll need some basic terminal skills and knowledge of web development technologies like HTML, CSS, and JavaScript. The site is built with the following tools:

- [Jekyll][jekyll]
- [Bootstrap][bootstrap]

### Running the website locally

#### Prerequisites

Before you begin, ensure you have [Docker](https://docker.com) and [Git](https://git-scm.com) installed, and Git is configured to connect to GitHub with SSH.

- **Docker**: A container platform to run Jekyll without installing Ruby and its dependencies on your machine
- **Git**: Version control system to manage code changes and collaborate with others

You can install these dependencies using the following guides:

- [Installing Docker](https://docs.docker.com/get-docker/)
- [Using GitHub with SSH][github-ssh]

#### Installation Steps

1. Clone the main website repository

    ```sh
    git clone https://github.com/opensourcedesign/opensourcedesign.github.io
    cd opensourcedesign.github.io
    ```

1. Clone the jobs repository

    Currently the job board is still a separate repository, but [we plan to move it in here](https://github.com/opensourcedesign/opensourcedesign.github.io/issues/236).

    ```sh
    git clone https://github.com/opensourcedesign/jobs
    ```

1. Build the static site & watch for files

    ```sh
    docker compose up
    ```

    This will build the website and make it available at <http://localhost:4000>. The site will automatically rebuild and reload whenever you make any changes to the source files.

## 👩‍🚀 Contributors, backers & sponsors

### Contributors

This project exists thanks to all the **people who contribute**.
[![Project Contributors](https://opencollective.com/opensourcedesign/contributors.svg?width=890&button=false)](graphs/contributors)

### Backers

Thank you to **all our backers**! 🙏 ([Become a backer](https://opencollective.com/opensourcedesign#backer))

[![Backers](https://opencollective.com/opensourcedesign/backers.svg?width=890)](https://opencollective.com/opensourcedesign#backers)

### Sponsors

[![Sponsors](https://opencollective.com/opensourcedesign/sponsor/0/avatar.svg)](https://opencollective.com/opensourcedesign/sponsor/0/website)

**Support this project by [becoming a sponsor](https://opencollective.com/opensourcedesign#sponsor).**

## ♥ Code of Conduct

Please note that Open Source Design has a [Contributor Code of Conduct](https://opensourcedesign.net/code-of-conduct/). By participating in this project online or at events you agree to abide by its terms.

## 📜 License

**🔀 You can use & modify everything as long as you credit [Open Source Design](https://opensourcedesign.net) and use the same license for your resulting work.** [Code license is AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html) and content is [Creative Commons Attribution-ShareAlike](https://creativecommons.org/licenses/by-sa/4.0/).

[osd-net]: https://opensourcedesign.net
[jekyll]: https://jekyllrb.com
[bootstrap]: https://getbootstrap.com
[github-ssh]: https://help.github.com/articles/connecting-to-github-with-ssh/
