# Content needed — IA migration
# opensourcedesign.net

> This is the content brief for the IA migration. It covers everything
> that needs to be written, rewritten, or adapted before the site can
> go live. Referenced tasks are in `docs/migration-plan-hugo.md`.
>
> Labels: `[new]` = written from scratch · `[rewrite]` = existing page
> with substantially new content · `[adapt]` = existing content, mostly
> front matter and light editing · `[missing]` = exists on master,
> not yet in this branch

---

## Pages to write from scratch

### 1. About Us — `/about-us/` `[new]`
**File:** `content/about-us/_index.md` (created as placeholder in Task 1.1)
**Migration task:** 3.1

The main landing page for the About Us section. Currently a placeholder.

**What it needs:**
- A brief, clear statement of what Open Source Design is and why it exists
- The 7 organisational goals absorbed into prose (not copied as a bullet list)
- The FAQ content woven in or summarised where relevant
- A table of contents at the top linking to the sub-pages: Manifesto,
  How to Join, Code of Conduct, Governance, By-laws

**Source material to draw from:**
- `content/goals.md` — 7 goals in bullet form; needs to become prose
- `content/faq.md` — covers membership, what involvement means, "open
  source vs free software"; some of this belongs here, some in How to Join
- The existing first paragraph on the homepage (`content/_index.md`) is
  a good orientation sentence: *"We are a community of designers and
  developers aiming to push more open design processes and improve the
  user experience and interface design of open source software."*

---

### 2. How to Join — `/about-us/how-to-join/` `[new]`
**File:** `content/about-us/how-to-join.md` (placeholder in Task 1.6)
**Migration task:** 3.2 · See also: issue #506

Practical guide for new people. Currently a placeholder. This replaces
`/contribute/` and `/contributing/` which are being deleted.

**What it needs:**
- How to get involved (multiple pathways: forum, events, GitHub, jobs,
  financial support)
- Tone: welcoming, low-barrier, "start anywhere"
- No form — written content only (form was broken and removed)

**Source material to draw from:**
- `content/contribute.md` — has a solid structure of pathways (Website,
  Jobs, Events, Organisation, Financial contributions). Adapt and expand;
  don't copy verbatim — the tone needs freshening and some links need
  updating (e.g. the "Add an Event" link points to a wrong path)
- `content/faq.md` — the "What Does Involvement In OSD Mean", "Who Can
  Join", and "What Does Being a Member Mean" sections belong here more
  than in About Us

---

### 3. Forum — `/forum/` `[new]`
**File:** `content/forum.md` (placeholder in Task 1.7)
**Migration task:** 3.3

Short page. Not a redirect — a proper page that explains what the forum
is before sending people there.

**What it needs:**
- 1–3 sentences: what the Discourse forum is, what kind of discussions
  happen there
- A clear call to action linking to `https://discourse.opensourcedesign.net`
- Optionally: link to a few active categories or a getting-started thread

---

### 4. Imprint — `/imprint/` `[new]`
**File:** `content/imprint.md` (placeholder in Task 1.8)
**Migration task:** 3.4

Legal/fiscal page required for compliance (particularly for European visitors).

**What it needs:**
- Open Collective listed as fiscal sponsor, with link to
  `https://opencollective.com/opensourcedesign`
- Any legally required contact or registration information
- Keep it brief and factual

---

## Pages to substantially rewrite

### 5. Resources — `/resources/` `[rewrite]`
**File:** `content/resources.md` → becomes `content/resources/_index.md`
**Migration task:** 3.5

The current page is a long, flat, unstructured link list that hasn't
been maintained. It needs a complete restructure.

**What it needs:**
- **Lead section:** the article "Being a designer in open source" as the
  featured/hero piece (see issue #505 — this article may need to be
  written or sourced first)
- **Resource database:** a curated list replacing the current flat list.
  Sources to merge:
  - Current `content/resources.md` list (prune stale links — many URLs
    are likely dead)
  - The 6 resource posts being moved from `content/articles/` (see
    migration plan Task 3.7)
  - A new externally-created resource list (referenced in
    `sitemap-proposed.md`; needs to be provided by the team)
- Organised by category or audience — not a flat alphabetical dump

**Note:** The lead article "Being a designer in open source" (#505) may
itself need to be written or commissioned before this page can be
completed.

---

### 6. Homepage — `/` `[rewrite]`
**File:** `content/_index.md` + `layouts/index.html`
**Migration task:** 4.2 (design + dev + content)

The homepage needs both structural/layout changes (dev/design work) and
content changes. This list covers the content side.

**What needs to change:**
- The first paragraph becomes the hero — it's already good, may just
  need slight polish for weight and clarity
- The 2nd and 3rd paragraphs need to stand on their own as distinct
  sections with more presence
- Remove the Articles section (being dissolved)
- Remove the Contact us / socials section (duplicates the footer)
- Remove Twitter references
- The Supporters and Contributors/Backers sections need new CTA copy
  (current text is passive; needs a clear ask)
- Conference/affiliate logos move to a sidebar — labels and layout are
  a design decision but the list itself comes from `data/conferences.yaml`
  and `data/affiliates.yaml`

---

## Content to add (missing from this branch)

### 7. FOSDEM 2026 wrap-up `[missing]`
**File:** `content/events/2026-03-09-fosdem-2026-wrap-up.md`
**Migration task:** New content backlog (see `migration-plan-hugo.md`)

This post was merged to `master` after the Hugo branch diverged. It
needs to be manually ported from:
`master` branch → `_posts/2026-03-09-FOSDEM-2026-wrap-up.md`

**What to do:**
- Copy the content
- Adapt front matter to Hugo event format:
  ```yaml
  ---
  layout: event
  title: "FOSDEM 2026: Open Source Design Devroom wrap up"
  date: 2026-03-09
  eventDate: 1 February 2026
  location: Université Libre Brussels, Belgium
  status: past
  aliases:
    - /2026/03/09/FOSDEM-2026-wrap-up/
  ---
  ```
- No content edits needed — the post is already written

---

## Content to adapt (structural/front matter changes only)

These posts are moving from `content/articles/` to `content/events/` or
`content/resources/`. The written content stays the same; they need
front matter updates (add `aliases`, adjust `layout` if needed) and
possibly light link fixes (internal links to `/code-of-conduct/`,
`/contribute/`, etc. will need updating to new URLs).

### Event write-ups moving to `/events/`
*(from migration plan Task 3.6)*

| Current file | New location |
|---|---|
| `2017-10-30-osd-nyc-first-meetup.md` | `events/nyc-meetup-oct-2017.md` |
| `2017-11-09-osd-nyc-meetup-Recap.md` | `events/nyc-meetup-nov-2017.md` |
| `2017-12-14-OSD-meetup-recap.md` | `events/nyc-meetup-dec-2017.md` |
| `2018-07-12-OSD-meetup-recap.md` | `events/nyc-meetup-jul-2018.md` |
| `2018-12-25-osd-summit-2018.md` | `events/osd-summit-2018.md` |
| `2019-05-31-libre-graphics-meeting-no-design-without-research.md` | `events/libre-graphics-meeting-2019.md` |
| `2020-02-01-fosdem-2020.md` | `events/fosdem-2020.md` |
| `2021-05-05-FOSDEM-2021-*.md` | `events/fosdem-2021.md` |
| `2021-07-05-FOSS-Backstage-2021-*.md` | `events/foss-backstage-2021.md` |
| `2021-07-08-Mozfest-2021-*.md` | `events/mozfest-2021.md` |
| `2025-02-05-FOSDEM-2025-*.md` | `events/fosdem-2025.md` |
| `2025-05-13-FOSSBACKSTAGE-2025-wrap-up.md` | `events/foss-backstage-2025.md` |

### Resource posts moving to `/resources/`
*(from migration plan Task 3.7)*

| Current file | New location |
|---|---|
| `2015-05-24-TextbasedToolsForDesigners.md` | `resources/text-based-tools-for-designers.md` |
| `2015-11-21-5-steps-to-design-a-ux-that-people-love.md` | `resources/5-steps-to-design-a-ux-that-people-love.md` |
| `2017-03-27-osd-needs-better-collaboration-tools.md` | `resources/osd-needs-better-collaboration-tools.md` |
| `2020-08-13-Use-your-artistic-skills-to-help-open-source.md` | `resources/use-your-artistic-skills-to-help-open-source.md` |
| `2020-08-13-beginners-guide-*.md` | `resources/beginners-guide.md` |
| `2020-08-20-COVID19-Illustrations-2020.md` | `resources/covid19-illustrations-2020.md` |

**Check when adapting:** any internal links in body text pointing to
`/contribute/`, `/code-of-conduct/`, `/articles/`, `/people/` need to
be updated to the new URLs.

---

## Summary

| # | Page | Type | Effort |
|---|------|------|--------|
| 1 | `/about-us/` | New | High — needs original writing |
| 2 | `/about-us/how-to-join/` | New | Medium — source material exists |
| 3 | `/forum/` | New | Low — 2–3 paragraphs |
| 4 | `/imprint/` | New | Low — factual, brief |
| 5 | `/resources/` | Rewrite | High — needs curation + external list |
| 6 | Homepage | Rewrite | High — structural + copy changes |
| 7 | FOSDEM 2026 wrap-up | Missing | Low — port from master, no editing |
| 8–19 | Event write-ups (12 posts) | Adapt | Low per post — front matter + link check |
| 20–25 | Resource posts (6 posts) | Adapt | Low per post — front matter + link check |

**Blockers:**
- Resources page (#5) depends on the external resource list being
  provided, and on the lead article "Being a designer in open source"
  (#505) being written or sourced
- About Us (#1) and How to Join (#2) can be worked on in parallel
- All adapt tasks (#8–25) can be parallelised across contributors
