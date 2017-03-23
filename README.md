# opensourcedesign.github.io [![Travis Badge](https://travis-ci.org/opensourcedesign/opensourcedesign.github.io.svg)](https://travis-ci.org/opensourcedesign/opensourcedesign.github.io)

Website of the Open Source Design community, hosted on Github pages.

## Contributing

Great. We love people contributing :)

### Content

Editing content on [opensourcedesign.net][osd-net] can be done in two relatively 
simple ways, both of which, require a GitHub account.

1. Using GitHub's nifty file editor

![Github file tools](images/github-file-tools.png)

2. Using the [Prose Editor](http://edit.opensourcedesign.net) 

### Design, Code, Etc...

This step requires you having `ruby`  and `git` installed, some basic ability to
use a terminal, as well as web-development knowledge of templates. In your
terminal 

1. Install Jekyll using and other ruby gems

```
gem install jekyll github-pages html-proofer
```

2. Fork and clone the main website repository

```
git clone git@github.com:opensourcedesign/opensourcedesign.github.io
```

3. Run our installer script

*This will pull down all of the repositories that consitute our website. Note:
you need to be a member of our GitHub organization for this to work.*

```
./scripts/install.sh 
```

4. Build the static site & watch for files 

```
jekyll serve --watch --config _config.yml,_config-dev.yml
```

[osd-net]: http://opensourcedesign.net "Open Source Design"
