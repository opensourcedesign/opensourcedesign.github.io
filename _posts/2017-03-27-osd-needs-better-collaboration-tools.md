---
layout: post
title: Open source design needs better collaboration tools
date: 2017-03-27
categories:
  - open-source
  - communities
  - collaboration
  - tools
  - design
authors:
  - studiospring
---

Despite the rising awareness and acceptance of UX design, in particular on the web, it has failed to gain much traction in open source software. If for argument's sake, we take UX design to have started in 1995 when [Don Norman started work for Apple as a "user experience architect"](http://blog.invisionapp.com/a-brief-history-of-user-experience/), even though it has a longer history, then the fact that design has failed to make much impact in the open source world for over 20 years suggests that there are structural and systemic barriers that make design and open source development as compatible to each other as oil and water.

In this post, I will argue the need for better communication and collaboration platforms by looking at some of the fundamental characteristics of open source design and development and propose some starting points.

The goal of OSD is to improve the user experience of open source software. Because open source software development is distributed, certain critical infrastructure is necessary. I am talking about a way for designers to share and build upon ideas, interact, reach consensus and collaborate with other designers and all the other stakeholders involved in the creation of software.

You may think that we already have such tools. Just look at GitHub! But when we consider the target user and use case of such tools, it becomes clear that there are no complementary equivalents for designers. Even worse, there is no tool to bridge the gap between designers and developers. GitHub and the like cater exclusively to developers' unique needs and abilities. In doing so, it excludes other stakeholders and becomes a developer silo. Design is not like this. It cannot exist in isolation. Design is about understanding, facilitation and collaboration between all the relevant stakeholders. This is why I consider collaboration tools to be so important to design. Surprisingly, the closed source world is not a great deal better off. The Atlassian and Google ecosystems are the best that I can think of, and these were not built as a platform for design.

A true collaboration platform for designers must, in some sense, bring in all stakeholders. This is where the very immature and untested idea for a collaborative design and development environment comes in. More details about this vision can be found on this [slide deck](http://slides.com/studiospring/dcd/).

Because of the nature of open source software, collaboration tools are even more critical and have different needs from commercial or closed source development:

- **All the stakeholders are distributed.** Not just users, but designers and developers. No one stakeholder may ever be in the same room as any other stakeholder! Online communication suddenly becomes far more complex and important.
- **Anyone can contribute.** This raises issues of quality and decision-making.

Let's have a look at some other characteristics of open source software:

- Users are often developers or have high tech empathy.
- The maintainer (often a "non-designer", to put it delicately), is the decision-maker, gate keeper and arbiter of good design.

This raises thought-provoking questions often overlooked in discussions about open source design: is design even needed in open source software? If the end user and creator are the same kind of person, then the design is already user-centric. And should design follow the same model as open source development, in which anyone can make a pull request? As we all know, on the internet, nobody knows that you are a dog! This can be a problem because design is harder to judge than code.

<figure>
  <a href="http://www.publicdomainpictures.net/view-image.php?image=174322&picture=dog-using-laptop-computer"><img src="/images/articles/dog.png"></a>
  <figcaption>Photo credits: Derivative of photo by <a href="http://www.zazzle.com/roughcollie*">Karen Arnold.</a> <a href="http://creativecommons.org/publicdomain/zero/1.0/">Creative Commons Public Domain.</a></figcaption>
</figure>

In writing about the right tools for OSD, I am putting the cart before the horse. The systemic problems are too large a topic for this post, but they must be identified and addressed first. However, open source design is at such an embryonic stage that even something as fundamental as a dedicated area for discussion and idea exchange to bootstrap the movement does not exist. This is why I have tried to identify our immediate needs, so that a more suitable tool than GitHub Issues or StackExchange can be found.

The diagram below shows characteristics of different collaboration platforms used to develop open source software, depending on the user (developer or designer) and whether it is project specific or agnostic. There is currently no dedicated platform for designers to discuss open source design in general (box number 3), so I have merely exercised my imagination to describe its characteristics. Reddit has a [forum for open source](https://www.reddit.com/r/opensource/), and StackExchange has a [UX forum](https://ux.stackexchange.com/), but I would argue the tone and nature of discussion is different from what we have and need here. Finally, the last box (5) is a totally different platform, which I described earlier as a collaborative design and development environment. This would be a platform that takes in to account the unique characteristics of open source software and ideally would be built from the ground up as a platform for design, for all stakeholders.

![Open source design and development collaboration platforms](/images/articles/osd_collaboration_tools.png)

The next steps are to:

1. decide what kinds of discussion and collaboration OSD actually wants to support.
2. determine the requirements for those types of collaboration.
3. find the tools that best meet the above requirements.

A platform for people to discuss open source design and development is admittedly a very niche area and the fact that no such platform exists may speak volumes. But it is better to fail in the attempt, than fail for lack of trying, and the fact that we have, in my opinion, outgrown GitHub Issues, is a promising sign. I hope this post makes our situation clearer and will stimulate further discussion and action.
