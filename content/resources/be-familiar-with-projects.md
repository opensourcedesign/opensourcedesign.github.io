---
title: "Why one should be familiar with projects and their structure"
description: "Rather than joining some project that has design tasks, join one that you are or want to get familiar with"
---

Why should one be familiar with projects and their structure?

How to start as a designer in an open source software project? It seems
to be both very simple and very difficult: Simple because the formal
barriers to participation are low: You do not need to be hired or show a
certificate to contribute or participate in FOSS. Difficult because most
projects do not have design projects that one can easily start with so
involvement in FOSS as a designer can mean a lot of up-front
clarification and effort to understand the needs of a FOSS project.

A common process is often described as one can just 'pick up' a task in
an open source project, and do a task based on one\'s professional
competency or interest: Some dialog is confusing? Propose a better
wording or layout! The software looks old-fashioned and dated? Create a
new style or design system! A function is confusing to use? Create a
design based on current simple/usable interface techniques, customized
to the needs of the project!

These are all valid design tasks and valid design solutions. They are
not wrong, but also, such solutions almost never get implemented for
many reasons, each unique to the FOSS project.

The infrastructure with its focus on single issues suggests that one can
solve single, self-contained issues and it also matches the culture's
assumption that »everyone can contribute«. A lot of that culture and
infrastructure is geared towards code, not interface design or any kinds
of design practices.


But even for code, such quick, self-contained contributions are rare.
They might apply best to abstract tasks like changing to a more
efficient algorithm that still gets the same data and returns the same
data. But most code changes interact with other parts of the code and
quickly introduce ripple effects. In well-maintained and well-structured
codebases these ripple effects are contained, but even to know that they
are contained and do not cause a mess usually requires knowledge of the
codebase, or the to know the right person to ask. This means, to
contribute you need knowledge of the context even when contributing in
code, the medium that infrastructure and culture are tailored to. And
this applies even more to design contributions that are not received
graciously or as easily with the culture and infrastructure of open
source projects


This means that design contributions usually require knowledge about the
project one contributes to.


- What the technology (programming language or framework) that creates
  the user interface can do and what not.
- What users want to do with the software
- What other contributors think the software should do.

The last two points are not always the same; many users want a
replacement for a commercial product, many contributors want them to see
their software as independent from such assumptions. They say that they
are not Photoshop or MS Office, even though a free version of that is
exactly what many users would like to have, since what they know will be
intuitive for them.

It's important to observe, and to understand how the project and the
communication work. This can often be best explored by making small
suggestions or changes rather than general redesigns that assert how how
design should be done, which easily miss what project might want to do
and what can be done with the available technology.
