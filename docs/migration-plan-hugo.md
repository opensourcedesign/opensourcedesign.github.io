# Migration Plan — Hugo branch adaptation
# opensourcedesign.net IA overhaul

> **Status: READY TO EXECUTE**
>
> This is the Hugo-adapted version of `docs/migration-plan.md`.
> The original plan was written against the Jekyll `master` branch.
> This version accounts for the SSG migration to Hugo already done in
> `feat/hugo-monorepo-ia-overhaul`, and incorporates resolved decisions.
>
> Read this document instead of `migration-plan.md`. The original is
> kept for reference.

---

## What changed from the Jekyll plan

| Aspect | Jekyll plan | Hugo branch |
|--------|-------------|-------------|
| Build command | `bundle exec jekyll serve` | `hugo server` |
| Redirects | `redirect_from:` (jekyll-redirect-from gem) | `aliases:` (Hugo built-in) |
| Content root | repo root (`*.md`) | `content/` directory |
| Pages | `goals.md`, `manifesto.md`, etc. | `content/goals.md`, `content/manifesto.md`, etc. |
| Articles (blog) | `_posts/` | `content/articles/` → being dissolved into `content/events/` and `content/resources/` |
| Events | `_events/` | `content/events/` |
| People | `_people/` | `content/people/` |
| Navigation | `_data/global.yml` → `header_links` | `hugo.toml` → `[menu]` + `[[menu.main]]` |
| Footer social | `_includes/footer.html` | `data/social.yaml` |
| Footer links | `_includes/footer.html` | `data/quicklinks.yaml` |
| Footer template | `_includes/footer.html` | `layouts/partials/footer.html` |
| Per-page aliases | front matter `redirect_from:` | front matter `aliases:` |
| Summit pages | `summit/index.*`, `summit/2017.*` | `content/archive/summit.md` (to be deleted) |
| Milestones page | `_posts/2021-07-11-*` | `content/archive/milestones.md` (to be deleted) |

---

## Decisions — resolved

### Decision A — Archive section → **Remove** ✓

`content/archive/` was created by the Hugo migration but is not part of
the agreed IA. The content has been accounted for elsewhere.

- Delete `content/archive/summit.md`, `content/archive/milestones.md`,
  and `content/archive/_index.md`.
- Add `aliases: ["/summit/", "/summit/2017"]` to `content/events/_index.md`
  so old summit URLs redirect to the events listing.
- `milestones.md` content: discard (duplicated in articles).

### Decision B — Brand page → **Keep at `/brand/`** ✓

`content/brand.md` stays at its current URL, unlisted from the main nav.
Keep in the footer quicklinks as "Brand Assets".

> Future note: the team may want to rename this to "Press Kit" or move
> it under `/about-us/brand/` once the About Us section is built out.

### Decision C — People → **Remove entirely** ✓

The entire people database is removed — not just the join form. This
was unused and will not be continued.

Scope of removal:
- All `content/people/*.md` profile files
- `content/people/_index.md`
- `content/people/join.md` — note: this file is empty; all content was
  in the layout template. No written content to salvage here.
- `layouts/people/` templates (including `people-form.html`)
- All `data/quicklinks.yaml` entries pointing into `/people/`

No redirect needed. `/people/` and `/people/:slug/` will return 404.

> **Note for Task 3.2:** `content/contribute.md` (not the join page)
> contains the substantive "how to contribute" content — pathways for
> website, jobs, events, organization, and Open Collective contributions.
> Use this as source material for `/about-us/how-to-join/`.

### Decision D — New content tracking → **Backlog section added** ✓

A **New content backlog** section at the bottom of this plan tracks
content that should be added to the Hugo branch — either merged to
`master` after the branch diverged, or new content not yet written.
See that section before starting Phase 3.

### Decision E — `content/goals/` directory conflict → **Delete directory** ✓

Both `content/goals.md` and `content/goals/_index.md` exist, creating
a URL conflict.

- Delete `content/goals/` directory (including `_index.md`).
- Keep `content/goals.md` as the canonical source.
- `content/goals.md` will itself be deleted in Task 1.1 (atomically
  with creating `content/about-us/_index.md`).

---

## Prerequisites

Before starting Phase 1, ensure:
- [x] `docs/sitemap-proposed.md` is complete and reviewed by the team
- [x] All open `[DECISION NEEDED]` items in `sitemap-proposed.md` are resolved
- [x] SSG migration to Hugo is complete (this branch)
- [x] Decisions A–E resolved (see above)
- [ ] The repo builds locally (`hugo server`)
- [ ] You have write access to the repo
- [ ] No prerequisite gems or plugins needed — Hugo `aliases` are built-in

---

## Scope summary

| Type | Count |
|------|-------|
| Pages moved (new URL, content unchanged) | 4 |
| Pages merged into new page | 3 (/goals/, /faq/ → /about-us/) |
| Pages restructured (same URL, new content) | 2 (/events/, /resources/) |
| Pages unchanged | 1 (/jobs/) |
| New pages to create | 5 |
| Pages removed (with redirect) | 8 |
| Pages removed (no redirect) | many (people database + archive) |
| Homepage: structural redesign | yes |
| Footer: simplified | yes |

Labels: `[dev]` = code/config change · `[content]` = writing/editing required · `[design]` = design work required

---

## Phase 0 — Preparation (no site changes)

These tasks clean up known issues and prepare content before touching structure.

### ~~Task 0.1 — Classify all blog posts~~ `[content]` — DONE
Result: All posts classified in `docs/post-redirect-map.md`.
9 events, 6 resources, 9 removes (+ 3 undated files resolved).

### ~~Task 0.2 — Resolve the `content/goals/` conflict~~ `[dev]` — DONE
Deleted `content/goals/_index.md` and `content/goals/` directory. `content/goals.md` kept as canonical. Build clean, no warnings.

### ~~Task 0.3 — Delete `content/archive/`~~ `[dev]` — DONE
Deleted `content/archive/summit.md`, `milestones.md`, `_index.md` and directory. Added `aliases: [/summit/, /summit/2017]` to `content/events/_index.md`. Build clean, 2 aliases registered.

### ~~Task 0.4 — Resolve undated / duplicate article files~~ `[dev]` — DONE
Moved `How-to-add-an-article-to-open-source-design.md` → `docs/how-to-add-an-article.md`. Deleted `successful-open-source-design-jobs-kitspace-*.md` and `2021-07-11-Open-Source-Design-milestones-over-the-years.md`. All remaining `content/articles/` files have `YYYY-MM-DD-` prefixes. Build clean.

### ~~Task 0.5 — Remove Twitter links and fix Mastodon URL~~ `[dev]` — DONE
Removed Twitter entry from `data/social.yaml` and `[[params.social]]` in `hugo.toml`. Removed `twitterHandle` param from `hugo.toml`. Removed `{{ else if eq .icon "twitter" }}` block from `layouts/partials/footer.html`. No Twitter links in `404.html`. Mastodon URL kept at `mastodon.social/@opensourcedesign` (confirmed correct). Build clean.

### ~~Task 0.6 — Check jobs data for front matter errors~~ `[dev]` — DONE
Verified `hugo build --logLevel debug` produces zero front matter or YAML errors in `content/jobs/`. Build clean. (Note: `content/jobs/-.md` has an unusual filename but valid front matter; no action required.)

---

## Phase 1 — Structure: new pages and redirects

Create all new pages and configure `aliases` for moved/removed pages.

> **Hugo note:** Redirects use `aliases:` in front matter (not
> `redirect_from:`). Hugo generates a redirect HTML stub at each alias
> URL automatically. No plugin required.

> **Hugo note — delete source files atomically with alias creation.**
> Unlike Jekyll's `redirect_from`, Hugo aliases create static files at
> the alias URL. If the old source page still exists at the same URL,
> both will try to write to the same output file — Hugo warns and the
> result is unpredictable. **Each task below that moves or merges a page
> must delete the old source file in the same git commit as it creates
> the new file with the alias.** Do not defer deletions to a later step.

> **Hugo note:** Section index pages use `_index.md`.
> `content/about-us/_index.md` → `/about-us/`
> `content/about-us/manifesto.md` → `/about-us/manifesto/`

### ~~Task 1.1 — Create `/about-us/` and retire `/goals/`, `/faq/`~~ `[dev]` — DONE
Created `content/about-us/_index.md` with aliases `/goals/` and `/faq/`. Deleted `content/goals.md` and `content/faq.md`. Build clean, 4 aliases.

### ~~Task 1.2 — Move manifesto to `/about-us/manifesto/`~~ `[dev]` — DONE

### ~~Task 1.3 — Move code of conduct to `/about-us/code-of-conduct/`~~ `[dev]` — DONE
Twitter reference in body replaced with Mastodon.

### ~~Task 1.4 — Move governance to `/about-us/governance/`~~ `[dev]` — DONE
`processes.md` deleted; aliases `/governance/` and `/processes/` added.

### ~~Task 1.5 — Move by-laws to `/about-us/by-laws/`~~ `[dev]` — DONE

### ~~Task 1.6 — Create `/about-us/how-to-join/`~~ `[dev]` — DONE
Created with aliases `/contribute/`, `/contributing/`, `/people/join/`. Deleted `contribute.md` and `people/join.md`.

### ~~Task 1.7 — Create `/forum/`~~ `[dev]` — SKIPPED
Decision: no dedicated `/forum/` page needed. Forum link will go directly to Discourse in the nav.

### ~~Task 1.8 — Create `/imprint/`~~ `[dev]` — SKIPPED
Decision: no imprint page needed at this time.

### ~~Task 1.9 — Add `/articles/` redirect~~ `[dev]` — DONE
Added `aliases: [/articles/]` to `content/resources.md` front matter.

### Task 1.10 — Verify structure `[dev]`
- **Command:** `hugo build` then spot-check key URLs
- **Acceptance criteria:** Site builds without errors; all URLs in
  `sitemap-proposed.md` are present; all aliases redirect correctly.

### Task 1.11 — *(absorbed into Task 3.9)*

All content deletions were done atomically in Tasks 1.1–1.6. The one
remaining cleanup — `layouts/people/` — cannot be deleted while
`content/people/` still exists (Hugo would warn about missing layout).
It is deleted together with the people content in **Task 3.9**.

---

## Phase 2 — Navigation

Update header and footer once new pages from Phase 1 are live and verified.

### ~~Task 2.1 — Update header nav~~ `[dev]` — DONE
Replaced Goals/Articles/Archive with About Us (weight 10). Reordered to: About Us, Events, Resources, Jobs, Forum (weights 10–50). Forum kept as external Discourse URL (Task 1.7 was skipped).

### ~~Task 2.2 — Update footer~~ `[dev]` — DONE
`data/social.yaml`: already done in Task 0.5. `data/quicklinks.yaml`: removed Goals, "Join as Designer", "Write an Article"; updated all About Us sub-page URLs; added "How to Join". `layouts/partials/footer.html`: removed Source Code link. No Imprint link (Task 1.8 skipped).

---

## Phase 3 — Content migration

Fill in content for new and restructured pages.

### Task 3.1 — Write `/about-us/` `[content]`
- **File:** `content/about-us/_index.md`
- **Source material:** `content/goals.md` (7 goals), `content/faq.md`
- **Requirements:**
  - Merge goals and FAQ into a coherent About Us page
  - Include a TOC at the top linking to: Manifesto, How to Join, Code
    of Conduct, Governance, By-laws
  - Goals content absorbed into prose, not listed verbatim
- **Acceptance criteria:** Page is coherent; TOC links resolve; no
  placeholder comments.

### Task 3.2 — Write `/about-us/how-to-join/` `[content]`
- **File:** `content/about-us/how-to-join.md`
- **Source material:**
  - `content/contribute.md` — has usable structured content: pathways
    for contributing via website, jobs, events, organization participation,
    and Open Collective financial contributions. Adapt and expand this.
  - Issue #506 — additional new content
- **Requirements:** Explain how to join and participate in OSD;
  practical and welcoming. No form (per Decision C).
- **Acceptance criteria:** Substantive written content; no placeholder
  comments.

### Task 3.3 — Write `/forum/` `[content]`
- **File:** `content/forum.md`
- **Requirements:** Short page describing the Discourse forum; links
  to `https://discourse.opensourcedesign.net`. Not a redirect — a page
  with context about what the forum is for.
- **Acceptance criteria:** Page has description and working link.

### Task 3.4 — Write `/imprint/` `[content]`
- **File:** `content/imprint.md`
- **Requirements:** Legal/fiscal information; reference Open Collective
  as fiscal sponsor.
- **Acceptance criteria:** Accurate fiscal/legal information; no
  placeholder comments.

### Task 3.5 — Convert `/resources/` to a section and restructure content `[content]` `[dev]`
- **Convert flat page to section first:**
  ```bash
  mkdir -p content/resources
  git mv content/resources.md content/resources/_index.md
  ```
  The `aliases: ["/articles/"]` front matter added in Task 1.9 must be
  preserved on `_index.md` after the rename. Verify it is still there.
- **Then edit `content/resources/_index.md`:**
  - Lead with the article "Being a designer in open source" (#505)
  - Curated resource database below (merged from current list, non-event
    articles, and new external list)
  - Prune stale entries from the current flat list
- **Acceptance criteria:** `content/resources/` is a Hugo section
  (directory with `_index.md`); page leads with the featured article;
  resource list is current; `/articles/` alias still redirects to
  `/resources/`; no placeholder comments.

### Task 3.6 — Move event write-ups into `/events/` `[dev]` `[content]`
These posts are currently mislaid in `content/articles/` — they are
event write-ups and belong under `/events/`.

- **Source:** `docs/post-redirect-map.md`, posts classified as `event`
- **For each post:**
  1. Move file from `content/articles/` → `content/events/`, renaming
     the slug where noted below.
  2. Add `aliases` pointing to the old URL so existing links don't break.
     First confirm the exact URL pattern Hugo uses for `content/articles/`
     (see Open question #4 below).

| Current filename in `content/articles/` | New slug in `content/events/` |
|------------------------------------------|-------------------------------|
| `2017-10-30-osd-nyc-first-meetup.md` | `nyc-meetup-oct-2017` |
| `2017-11-09-osd-nyc-meetup-Recap.md` | `nyc-meetup-nov-2017` |
| `2017-12-14-OSD-meetup-recap.md` | `nyc-meetup-dec-2017` |
| `2018-07-12-OSD-meetup-recap.md` | `nyc-meetup-jul-2018` |
| `2018-12-25-osd-summit-2018.md` | keep slug |
| `2019-05-31-libre-graphics-meeting-no-design-without-research.md` | `libre-graphics-meeting-2019` |
| `2020-02-01-fosdem-2020.md` | `fosdem-2020` |
| `2021-05-05-FOSDEM-2021-Open-Source-Design-Devroom-wrap-up.md` | `fosdem-2021` |
| `2021-07-05-FOSS-Backstage-2021-*.md` | `foss-backstage-2021` |
| `2021-07-08-Mozfest-2021-*.md` | `mozfest-2021` |
| `2025-02-05-FOSDEM-2025-*.md` | `fosdem-2025` |
| `2025-05-13-FOSSBACKSTAGE-2025-wrap-up.md` | `foss-backstage-2025` |

- **Acceptance criteria:** All event write-ups accessible under `/events/`;
  old URLs redirect.

### Task 3.7 — Move resources into `/resources/` `[dev]` `[content]`
These posts are currently mislaid in `content/articles/` — they are
resources and belong under `/resources/`.

- **Source:** `docs/post-redirect-map.md`, posts classified as `resource`
- **Prerequisite:** Task 3.5 must be complete — `content/resources/`
  must already be a section with `_index.md`.
- **For each post:**
  1. Move: `git mv content/articles/FILENAME.md content/resources/NEW-SLUG.md`
  2. Add `aliases` pointing to both old URLs (see `docs/test-plan.md`
     → Per-article alias reference).

| Current filename in `content/articles/` |
|------------------------------------------|
| `2015-05-24-TextbasedToolsForDesigners.md` |
| `2015-11-21-5-steps-to-design-a-ux-that-people-love.md` |
| `2017-03-27-osd-needs-better-collaboration-tools.md` |
| `2020-08-13-Use-your-artistic-skills-to-help-open-source.md` |
| `2020-08-13-beginners-guide-to-open-source-design-by-Victory-Brown.md` |
| `2020-08-20-COVID19-Illustrations-2020.md` |

- **Acceptance criteria:** All resource posts accessible under
  `/resources/`; old URLs redirect.

### Task 3.8 — Delete remaining posts in `content/articles/` `[dev]`
After Tasks 3.6 and 3.7, only posts classified as `remove` remain.
From `docs/post-redirect-map.md`:

| File | Action |
|------|--------|
| `2015-04-25-welcome-to-open-source-design.md` | Check for About Us–useful content before deleting |
| `2015-05-18-this-month-in-open-source-design.md` | Delete |
| `2015-07-10-this-month-in-open-source-design.md` | Delete |
| `2016-04-04-interview-with-julia.md` | Delete |
| `2024-05-09-oss-projects-here-is-how-to-make-a-successful-job-post.md` | Consider moving to jobs section (see Open question #3) |

Once all posts are gone, delete:
- `content/articles/_index.md`
- `content/articles/` directory (should now be empty)
- `layouts/articles/list.html`

The `/articles/` listing URL is already covered by the alias on
`content/resources/_index.md` (added in Task 1.9, preserved in Task 3.7).

### Task 3.9 — Remove `/people/` collection and layouts `[dev]`
Per Decision C. Includes the `layouts/people/` deletion deferred from
Task 1.11 — do both in the same commit.
- Delete `content/people/_index.md`
- Delete all `content/people/*.md` profile files
- Delete `layouts/people/` directory and all templates within it
- Verify no remaining internal links point to `/people/` or
  `/people/:slug/` (check `data/quicklinks.yaml` — handled in Task 2.2,
  and `content/_index.md` homepage)
- **Acceptance criteria:** `/people/` returns 404; no orphaned internal
  links; `hugo` builds without missing layout warnings.

---

## Phase 4 — Design and layout

Template and layout changes. These should happen after content structure
is stable.

### Task 4.1 — Redesign events listing `[design]` `[dev]`
- **File:** `layouts/events/list.html`
- **Requirements:**
  - Ticker/list style — not a blog post feel
  - Items with write-ups are visually distinguished from those without
  - Date is hard-coded in event front matter (already the case:
    `eventDate`, `location`, `time`, `status` fields exist in current events)
  - Homepage pulls the next upcoming event to display in a sidebar
- **Note:** The existing `layouts/events/list.html` can be audited and
  adapted rather than rebuilt from scratch.
- **Acceptance criteria:** Events listing renders as a dated list;
  upcoming events appear on homepage; write-up links work.

### Task 4.2 — Homepage redesign `[design]` `[dev]` `[content]`
- **File:** `layouts/index.html`
- **Checklist** (from `sitemap-proposed.md`):
  - [ ] Remove filler header image
  - [ ] Move first paragraph front and centre as hero section
  - [ ] Give 2nd and 3rd paragraphs their own sections with more visual weight
  - [ ] Add sidebar: upcoming Events + Calendar
  - [ ] Add separate Jobs section
  - [ ] Remove Articles section
  - [ ] Supporters + Contributors/Backers → merge into compact CTA section
  - [ ] Conferences → remove section; add affiliate logos to sidebar as mini cards
  - [ ] Remove Contact us / socials section (duplicate of footer)
- **Note:** `data/affiliates.yaml`, `data/conferences.yaml`, and
  `data/supporters.yaml` already exist — use as data sources.
- **Acceptance criteria:** All checklist items complete; no broken links.

### Task 4.3 — Footer template cleanup `[dev]`
- After Tasks 0.5 and 2.2, remove dead code: unused Twitter icon block,
  unused Source Code link block.
- **Acceptance criteria:** `layouts/partials/footer.html` contains no
  dead code from removed elements.

---

## Phase 5 — Validation and launch

### Task 5.1 — Run link checker `[dev]`
```bash
hugo build
npx broken-link-checker http://localhost:1313
```
- **Acceptance criteria:** Zero broken internal links; all aliased old
  URLs return redirects; no 404s for URLs that should exist.

### Task 5.2 — Review checklist `[dev]` `[content]`
- [ ] All pages in `sitemap-proposed.md` → Proposed URL Structure are live
- [ ] All redirects in the Complete Redirect Map below are working
- [ ] No placeholder `<!-- TODO -->` comments remain on live pages
- [ ] Footer matches proposed design (5 social icons, no Twitter, Imprint link)
- [ ] Header matches proposed navigation (5 items: About Us, Events,
      Resources, Jobs, Forum)
- [ ] No Twitter links visible to visitors
- [ ] Mastodon footer link points to `fosstodon.org/@opensourcedesign`
- [ ] `/people/` returns 404
- [ ] `/archive/` returns 404

### Task 5.3 — Update documentation `[dev]`
- Archive `docs/sitemap-current.md` as `docs/sitemap-pre-2026-02.md`
- Update `docs/sitemap-current.md` to reflect the new live state

### Task 5.4 — Merge to master and deploy `[dev]`
- Final review by at least one maintainer
- Merge to `master` — GitHub Actions Hugo build will deploy automatically
- **Acceptance criteria:** Live site at `opensourcedesign.net` reflects
  all changes.

---

## Complete redirect map (Hugo `aliases:`)

| Old URL | New URL | `aliases:` on which file |
|---------|---------|--------------------------|
| /goals/ | /about-us/ | `content/about-us/_index.md` |
| /faq/ | /about-us/ | `content/about-us/_index.md` |
| /manifesto/ | /about-us/manifesto/ | `content/about-us/manifesto.md` |
| /code-of-conduct/ | /about-us/code-of-conduct/ | `content/about-us/code-of-conduct.md` |
| /governance/ | /about-us/governance/ | `content/about-us/governance.md` |
| /processes/ | /about-us/governance/ | `content/about-us/governance.md` |
| /by-laws/ | /about-us/by-laws/ | `content/about-us/by-laws.md` |
| /contribute/ | /about-us/how-to-join/ | `content/about-us/how-to-join.md` |
| /contributing/ | /about-us/how-to-join/ | `content/about-us/how-to-join.md` |
| /people/join/ | /about-us/how-to-join/ | `content/about-us/how-to-join.md` |
| /articles/ | /resources/ | `content/resources/_index.md` (after Task 3.7 rename; `content/resources.md` before) |
| /summit/ | /events/ | `content/events/_index.md` |
| /summit/2017 | /events/ | `content/events/_index.md` |
| /people/ | — | 404, no redirect |
| /people/:slug/ | — | 404, no redirect |
| /logos/ | — | already absent in Hugo branch |
| /archive/ | — | 404 after Task 0.3 |
| /articles/:slug/ → event write-up | /events/:slug/ | `aliases:` on each file, added in Task 3.6 |
| /articles/:slug/ → resource | /resources/:slug/ | `aliases:` on each file, added in Task 3.7 |

---

## New content backlog

Content that needs to be added to this branch (not yet present).
Check this list before starting Phase 3.

| Content | Source | Where it goes | Status |
|---------|--------|---------------|--------|
| FOSDEM 2026 wrap-up | `master` branch: `_posts/2026-03-09-FOSDEM-2026-wrap-up.md` | `content/events/2026-03-09-fosdem-2026-wrap-up.md` | ⬜ Not added |

> When adding the FOSDEM 2026 post: adapt front matter for Hugo event
> format (`eventDate`, `location`, `time`, `status`). Add
> `aliases: ["/articles/2026/03/09/FOSDEM-2026-wrap-up/"]` in case any
> external links use that URL pattern.

_Keep this table updated as more content is merged to `master` or
identified as missing._

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02 | `/goals/` content merged into `/about-us/` | Reduces nav clutter |
| 2026-02 | `/people/` removed entirely, no replacement | Unused; not continuing |
| 2026-02 | Individual article URLs redirect per-post to new home | Preserves links |
| 2026-02 | `/logos/` removed, no redirect | Already gone in Hugo branch |
| 2026-02 | Jobs board stays as external sub-repo | Out of scope |
| 2026-02 | About Us: no dropdown nav, flat link only | Simpler; sub-pages via TOC |
| 2026-02 | `/resources/` URL and label kept as-is for now | Can rename to "Getting Started" after page is live |
| 2026-03 | SSG migrated from Jekyll to Hugo | Replaces Jekyll build system |
| 2026-03 | Decision A: `/archive/` removed | Not part of agreed IA |
| 2026-03 | Decision B: `/brand/` kept at current URL | Work not wasted; rename TBD |
| 2026-03 | Decision C: entire `/people/` database removed | Unused; not continuing |
| 2026-03 | Decision D: new content backlog section added | Track master-diverged content |
| 2026-03 | Decision E: `content/goals/` directory deleted | URL conflict; `goals.md` is canonical |

---

## Open questions

| # | Question | Blocking |
|---|----------|----------|
| 1 | Do we want to offer an email contact option for the core group? | Not blocking migration |
| 2 | Should `/brand/` eventually move to `/about-us/brand/` or be renamed "Press Kit"? | Not blocking (future) |
| 3 | Should `2024-05-09-oss-projects-here-is-how-to-make-a-successful-job-post.md` move to the jobs section instead of being deleted? | Not blocking (Phase 3) |
| 4 | What are the exact article URL patterns Hugo generates for `content/articles/`? Needed to write correct `aliases` values in Tasks 3.6 and 3.7. Confirm by running `hugo server` and checking a few article URLs. | Blocking Tasks 3.6, 3.7 |
