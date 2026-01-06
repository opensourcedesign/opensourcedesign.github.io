---
layout: post
date: 2015-05-23
title: "Why open source designers need tools beyond text and code"
category:
authors:
  - jdittrich
permalink: /2015/05/23/text-based-tools-for-designers
---

Text is the predominant means of creating and collaborating on software. Design is a visual and spacial activity. For those who design software and websites there is a non-visual world that needs to be navigated and taken into account: text in the form of program code and comments.

This has historical and technical reasons, beyond that computer programs are essentially created in code. But the text based tools and culture of creation and collaboration have severe drawbacks for designers who are part, or are striving to be part, of the creation of software. This is particulary relevant in the open source community, where many collaborators (among them potentially designers) work jointly to create and improve software.

## The case against designing in code

There is no shortage of pleas and instructions for designers to learn to code. I argue that for the sake of better design, it makes little sense to do this work in code (at least for most designers).

To use code as a tool for design, ideation, communication, and adjustments is a process that creates a lot of friction. It demands constant switching between the definition space – the code – and the outcome – the resulting appearance and structure.

Empirical research shows that feedback loops play a crucial role in creative tasks [1]. For designers this involves evaluating how a preliminary design looks, is structured, or behaves and then apply changes and see if the result is satisfying [2]. Look at sketching: You can quickly draw what a product or a website may look like. You evaluate what is good or bad about the drawing, think it through and iteratively make changes The feedback is instant: if you slip and the crooked line messes up the design you see it right away. If the slip actually adds something good, you see it too.

This instant feedback is what's to lose if we always design in code.

But should designer ditch the resolution to learn to code? Not always. There are things that are best expressed in code: maybe a gesture or a new kind of menu. It will enable communicating your ideas to programmers and estimate the technical difficulties involved in implementation. But while design-in-code is touted to be _the_ skill-to-learn for (web) designers it shouldn't come with the loss of core thinking models and processes for many designers.

So rather than learning to code for designing, you may be better off keeping design a visual process and learn to program for communication and realization of the design.

## Collaboration: Text based tools are not silver bullets

There are many well established means to communicate in (Open Source) Software projects: Mailinglists, IRC, Bugtracker and Git, an immensely popular version control system. For all of these tools, but particularly with git, you will find many pleas online that designers use it for version control and collaboration. In addition, they argue, there is little choice anyway if one wants to contribute to an open source project.

But while tools like Git and IRC are well established, they pose some problems for in design. These tools are primarily text based and visual assets need to be somehow linked or embedded. They are not first class citizens.

Communicating about layouts, icons or workflows is possible, but tedious. Images often need to be uploaded and linked. When talking about them, images need to be referenced by some ad-hoc-system, parts of the image need to be described to refer to them. The text-space is a weak substitute for the visual space the design happens in. A long winded, cumbersome communication is the result and ambiguities arise (with often participants in the conversation scrolling up and down long threads to reference designs). This contributes to the lack of participation and acceptance of designers in open source projects and contributes to the view that designing together is hard and possibly done best by a lone genius.

To enable designers to contribute to open projects it is not enough that they learn about code and technology: they need tools that match their workflow and enable them to collaborate with programmers. Just telling them to adapt is not a viable, design-thinking, solution.

_If you like to support the creation of libre tools for (open source) designers, have a look at [some of our ideas](https://github.com/opensourcedesign/resources/issues/16)._

**Sources:**

- **[1]** Designing as reflective conversation with the materials of a design situation, Donald Schön, 1992
- **[2]** »sketching provides a temporary, external store for tentative ideas, and supports the ‘dialogue’ that the designer has between problem and solution.« (Chapter 1, ›Design Ability‹) »…Drawing…gives the flex­i­bil­ity to shift lev­els of de­tail in­stan­ta­neously; al­lows par­tial, dif­fer­ent views at dif­fer­ent lev­els of de­tail to be de­vel­oped side by side« (Chapter 4, ›How Designers Think‹) in Design Thinking – Understanding how designers think and work. Nigel Cross, 2011
