# opensourcedesign.github.io [![Travis Badge](https://travis-ci.org/opensourcedesign/opensourcedesign.github.io.svg)](https://travis-ci.org/opensourcedesign/opensourcedesign.github.io)
Main website of the Open Source Design community, hosted on Github pages

## FAQ

*What's the mission of Open Source Design?*

*What's the difference between [Open Design](http://opendesign.foundation) and Open Source Design?*

From [the conversation here](https://github.com/opensourcedesign/resources/issues/14)

> One group is building a community of designers working on open source, while the other is focusing on building open workflows for designers.

> Open Design* is not building tools for the sake of building tools, but to build a community of designers working towards more open practices. The difference between Open Design* and Open Source Design's community is that we have found open source to be too exclusive.

Open Design targets the wider design community, while Open Source Design targets getting more people (including designers) involved in designing for Open Source Software.

An awesome image by @GarthDB does a good job of explaining it:

![differences](https://cloud.githubusercontent.com/assets/125516/6967497/ec18c04a-d91c-11e4-9632-4c559b178446.png)

*Why are you using chat tool ____*

We've talked a lot of the benefits of each chat tool out there. Ultimately it comes down to a split in "open" versus "practical". We're still trying to figure out what the best tool is for our community, but we're [working on it](https://github.com/opensourcedesign/chat/issues/1).

See this issue [here](https://github.com/DesignOpen/designopen.github.io/issues/195).

## Developing

To our develop / build site on your local machine do the following:

- Install Jekyll using `gem install jekyll github-pages html-proofer`
- Build the static site & watch for files `jekyll serve --watch --config _config.yml,_config-dev.yml`
