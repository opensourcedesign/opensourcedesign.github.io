# Migration Plan — opensourcedesign.net Redesign

> **Status: READY TO EXECUTE**
>
> Input documents:
> - Current state: `docs/sitemap-current.md`
> - Desired state: `docs/sitemap-proposed.md`
>
> Each task has: a clear goal, acceptance criteria, and enough context to act without
> needing to re-read the whole plan.

---

## How to use this plan

Work through phases in order. Each task is a discrete unit of work.
Check off tasks as they are completed. Use the Notes field to record decisions and blockers.

---

## Prerequisites

Before starting Phase 1, ensure:
- [x] `docs/sitemap-proposed.md` is complete and reviewed by the team
- [x] All open `[DECISION NEEDED]` items in `sitemap-proposed.md` are resolved
- [ ] The repo builds locally (`bundle exec jekyll serve`)
- [ ] You have write access to the repo
- [ ] `jekyll-redirect-from` gem is present in `Gemfile` and listed under `plugins:` in `_config.yml`

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
| Pages removed (no redirect) | 3 |
| Homepage: structural redesign | yes |
| Footer: simplified | yes |

Labels: `[dev]` = code/config change · `[content]` = writing/editing required · `[design]` = design work required

---

## Phase 0 — Preparation (no site changes)

These tasks clean up known issues and prepare content before touching the site structure.

### ~~Task 0.1 — Classify all blog posts~~ `[content]` — DONE
- **Result:** All posts classified in `docs/post-redirect-map.md`. 9 events, 6 resources, 9 removes (+ 3 undated files resolved).

### Task 0.2 — Fix posts without date-prefixed filenames `[dev]`
- **Files:** Any files in `_posts/` not matching `YYYY-MM-DD-title.md` format (issue #9: 3 known cases)
- **Fix per file:**
  - `How-to-add-an-article-to-open-source-design.md` → move under `README.md` in GitHub repo as a contributor guide (not a post)
  - `open-source-design-milestones.md` → remove page and merge content into 'About Us'
  - `successful-open-source-design-jobs-kitspace-*.md` → remove; was never properly published (no date)
- **Acceptance criteria:** All files in `_posts/` follow `YYYY-MM-DD-title.md` naming; build produces no filename warnings.
- **Notes:** Complete before Task 0.1 so the blog post classification covers a clean set.

### Task 0.3 — Fix YAML syntax error in jobs data `[dev]`
- **File:** `_data/jobs.yml` line 63 (issue #1)
- **Fix:** `value": "full-time"` → `value: "full-time"` (misplaced quote before colon)
- **Acceptance criteria:** `bundle exec jekyll build` completes without YAML parse errors.

### Task 0.4 — Remove Twitter links `[dev]`
- **Files:** `404.html`, `_includes/head.html`, `code-of-conduct.md` (issue #3)
- **Fix:** Replace `twitter.com/opensrcdesign` links with Mastodon profile (`fosstodon.org/@opensourcedesign`); update surrounding text. Twitter card `<meta>` tags in `head.html` can remain (degrade gracefully).
- **Acceptance criteria:** No Twitter/X links visible to site visitors.
- **Notes:** `code-of-conduct.md` will be moved in Phase 1 — apply this fix to the new file at `about-us/code-of-conduct.md` instead, not the old location.

---

## Phase 1 — Structure: new pages and redirects

Create all new pages and configure redirects for moved/removed pages. **No old files are deleted in this phase** — old URLs continue to work throughout. New and old URLs coexist until Phase 1 is complete and verified.

> **Prerequisite:** `jekyll-redirect-from` gem available (see Prerequisites above).

### Task 1.1 — Create `/about-us/` `[dev]`
- **File to create:** `about-us/index.md`
- **Front matter:**
  ```yaml
  ---
  layout: default
  title: About Us
  permalink: /about-us/
  redirect_from:
    - /goals/
    - /faq/
  ---
  ```
- **Content:** Placeholder with `<!-- TODO: content — see Task 3.1 -->`
- **Acceptance criteria:** `/about-us/` returns 200; `/goals/` and `/faq/` redirect to `/about-us/`.

### Task 1.2 — Move manifesto to `/about-us/manifesto/` `[dev]`
- **File to create:** `about-us/manifesto.md` (copy content from `manifesto.md`)
- **Add to front matter:** `redirect_from: /manifesto/`
- **Acceptance criteria:** `/about-us/manifesto/` returns 200; `/manifesto/` redirects there.

### Task 1.3 — Move code of conduct to `/about-us/code-of-conduct/` `[dev]`
- **File to create:** `about-us/code-of-conduct.md` (copy content from `code-of-conduct.md`; apply Twitter → Mastodon fix from Task 0.4 here)
- **Add to front matter:** `redirect_from: /code-of-conduct/`
- **Acceptance criteria:** `/about-us/code-of-conduct/` returns 200; `/code-of-conduct/` redirects there; no Twitter links.

### Task 1.4 — Move governance to `/about-us/governance/` `[dev]`
- **File to create:** `about-us/governance.md` (copy content from `governance.md`)
- **Add to front matter:** `redirect_from: /governance/`
- **Acceptance criteria:** `/about-us/governance/` returns 200; `/governance/` redirects there.

### Task 1.5 — Move by-laws to `/about-us/by-laws/` `[dev]`
- **File to create:** `about-us/by-laws.md` (copy content from `by-laws.md`)
- **Add to front matter:** `redirect_from: /by-laws/`
- **Acceptance criteria:** `/about-us/by-laws/` returns 200; `/by-laws/` redirects there.

### Task 1.6 — Create `/about-us/how-to-join/` `[dev]`
- **File to create:** `about-us/how-to-join.md`
- **Front matter:** `permalink: /about-us/how-to-join/`, `redirect_from: [/contribute/, /contributing/]`
- **Content:** Placeholder with `<!-- TODO: content — see Task 3.2 -->`
- **Acceptance criteria:** `/about-us/how-to-join/` returns 200; `/contribute/` and `/contributing/` redirect there.

### Task 1.7 — Create `/forum/` `[dev]`
- **File to create:** `forum.md`
- **Front matter:** `permalink: /forum/`
- **Content:** Placeholder with `<!-- TODO: content — see Task 3.3 -->`
- **Acceptance criteria:** `/forum/` returns 200.

### Task 1.8 — Create `/imprint/` `[dev]`
- **File to create:** `imprint.md`
- **Front matter:** `permalink: /imprint/`
- **Content:** Placeholder with `<!-- TODO: content — see Task 3.4 -->`
- **Acceptance criteria:** `/imprint/` returns 200.

### Task 1.9 — Set up redirects for remaining removed pages `[dev]`
These pages have no new file to attach `redirect_from` to; add the redirect to the destination file's front matter instead.

| Old URL | Add `redirect_from` to |
|---------|------------------------|
| /processes/ | `about-us/governance.md` (alongside /governance/) |
| /articles/ | `resources.md` |
| /summit/ | `events.md` (or events index) |
| /summit/2017 | `events.md` |

- **Acceptance criteria:** All four old URLs redirect to their targets.

### Task 1.10 — Verify structure `[dev]`
- **Commands:**
  ```bash
  bundle exec jekyll build
  # Spot-check key URLs in _site/
  ls _site/about-us/
  ```
- **Acceptance criteria:** Site builds without errors; all URLs in `sitemap-proposed.md` are present in `_site/`; all old URLs from the redirect map below return 301.

### Task 1.11 — Delete old files `[dev]`
Only after Task 1.10 is verified. Delete the source files whose content has been moved.

| File to delete | Reason |
|----------------|--------|
| `goals.md` | Merged into `about-us/index.md` |
| `faq.md` | Merged into `about-us/index.md` |
| `manifesto.md` | Moved to `about-us/manifesto.md` |
| `code-of-conduct.md` | Moved to `about-us/code-of-conduct.md` |
| `governance.md` | Moved to `about-us/governance.md` |
| `by-laws.md` | Moved to `about-us/by-laws.md` |
| `processes.md` | Removed; redirects to /about-us/governance/ |
| `contribute.md` | Removed; redirects to /about-us/how-to-join/ |
| `CONTRIBUTING.md` (web-facing copy only) | Removed; redirects to /about-us/how-to-join/ |
| `people-form.md` | Removed; no redirect |
| `logos.html` | Removed; no redirect |
| `summit/index.*` | Removed; redirects to /events/ |
| `summit/2017.*` | Removed; redirects to /events/ |

> Note: `people.md` and the `_people/` collection are removed in Phase 3 after content audit.

---

## Phase 2 — Navigation

Update header and footer once the new pages from Phase 1 are live and verified.

### Task 2.1 — Update header nav `[dev]`
- **File:** `_data/global.yml` → `header_links`
- **Remove:** Goals (`/goals/`), Articles (`/articles/`)
- **Add:** About Us (`/about-us/`)
- **Change:** Forum entry from direct external URL (`discourse.opensourcedesign.net`) to internal page (`/forum/`)
- **Reorder** to match proposed nav:

| Position | Label | URL |
|----------|-------|-----|
| 1 | About Us | /about-us/ |
| 2 | Events | /events/ |
| 3 | Resources | /resources/ |
| 4 | Jobs | /jobs/ |
| 5 | Forum | /forum/ |

- **Acceptance criteria:** Header renders five items in correct order; all links resolve; active state applies correctly on each page.

### Task 2.2 — Update footer `[dev]`
- **File:** `_includes/footer.html`
- **Remove:** "Edit this page" link, "View source code" link, Twitter link, Code of Conduct link
- **Fix:** Mastodon URL from `mastodon.social/@opensourcedesign` → `fosstodon.org/@opensourcedesign` (issue #11)
- **Add:** Imprint link to `/imprint/`
- **Acceptance criteria:** Footer contains exactly the five links below; no Twitter or CoC link visible.

| Label | URL |
|-------|-----|
| GitHub | https://github.com/opensourcedesign |
| Mastodon | https://fosstodon.org/@opensourcedesign |
| Open Collective | https://opencollective.com/opensourcedesign |
| Forum | https://discourse.opensourcedesign.net |
| Imprint | /imprint/ |

---

## Phase 3 — Content migration

Fill in content for new and restructured pages. Each task here is independently parallelisable.

### Task 3.1 — Write `/about-us/` `[content]`
- **File:** `about-us/index.md`
- **Source material:** Current `goals.md` (7 goals), `faq.md`
- **Requirements:**
  - Merge and rewrite goals and FAQ into a cohesive About Us page
  - Include a TOC at the top linking to sub-pages: Manifesto, How to Join, Code of Conduct, Governance, By-laws
  - Goals content is absorbed into the prose, not listed verbatim
- **Acceptance criteria:** Page reads as a coherent About Us; TOC links all resolve; no placeholder comments remain.

### Task 3.2 — Write `/about-us/how-to-join/` `[content]`
- **File:** `about-us/how-to-join.md`
- **Source material:** New content (see issue #506)
- **Requirements:** Explain how to join and participate in OSD; practical and welcoming in tone.
- **Acceptance criteria:** Page contains substantive content; no placeholder comments.

### Task 3.3 — Write `/forum/` `[content]`
- **File:** `forum.md`
- **Requirements:** Short page describing the Discourse forum; links out to `https://discourse.opensourcedesign.net`. Not a redirect — a proper page with context.
- **Acceptance criteria:** Page contains a description and working link to the forum.

### Task 3.4 — Write `/imprint/` `[content]`
- **File:** `imprint.md`
- **Requirements:** Legal/fiscal information. Reference Open Collective (`opencollective.com/opensourcedesign`) as fiscal sponsor. Include any required legal notices.
- **Acceptance criteria:** Page contains accurate fiscal/legal information; no placeholder comments.

### Task 3.5 — Restructure `/resources/` `[content]` `[dev]`
- **File:** `resources.md`
- **Source material:** Current `resources.md` (long flat list), classified non-event blog posts (from Task 0.1), new externally-created resource list
- **Requirements:**
  - Lead with the article "Being a designer in open source" (issue #505)
  - Below that: curated resource database (merged from above sources)
  - Prune stale entries from the current flat list
- **Acceptance criteria:** Page has clear structure with lead article at top; resource list is current; no placeholder comments.

### Task 3.6 — Migrate blog posts: event write-ups `[dev]` `[content]`
- **Source:** Classification mapping from Task 0.1, event write-up posts
- **For each post classified as an event write-up:**
  1. Create or update the corresponding `/events/:slug/` page
  2. Add `redirect_from: /YYYY/MM/DD/:slug/` to its front matter
- **Acceptance criteria:** All event write-up posts accessible at `/events/:slug/`; old URLs redirect there.

### Task 3.7 — Migrate blog posts: resources `[dev]` `[content]`
- **Source:** Classification mapping from Task 0.1, resource posts
- **For each post classified as a resource:**
  1. Create `/resources/:slug/` page (or adapt the post for the resources section)
  2. Add `redirect_from: /YYYY/MM/DD/:slug/` to its front matter
- **Acceptance criteria:** All resource posts accessible at `/resources/:slug/`; old URLs redirect there.

### Task 3.8 — Remove `/people/` collection `[dev]`
- **Files:** `people.md`, all files in `_people/`
- **Context:** The people listing and individual profiles are being removed entirely with no replacement.
- **Before deleting:** Confirm no other pages link to `/people/` or `/people/:slug/`. Update or remove any such links.
- **Acceptance criteria:** `/people/` and all `/people/:slug/` URLs return 404; no orphaned internal links.

---

## Phase 4 — Design and layout

Template and layout changes. These should happen after content structure is stable.

### Task 4.1 — Redesign events listing `[design]` `[dev]`
- **File:** `events.md` (or events layout template)
- **Requirements:**
  - Ticker/list style — not a blog post feel
  - Items with write-ups are visually distinguished from those without
  - Date is hard-coded in event front matter
  - Homepage pulls the next upcoming event from the `_events` collection to display in its events sidebar
- **Acceptance criteria:** Events listing renders as a dated list; upcoming events appear on homepage; write-up links work where present.

### Task 4.2 — Homepage redesign `[design]` `[dev]` `[content]`
- **File:** `index.html` (or homepage layout)
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
- **Acceptance criteria:** All checklist items complete; no broken links or missing sections.

### Task 4.3 — Footer template update `[dev]`
- **Note:** Footer content changes are handled in Task 2.2. This task covers any associated template/layout cleanup (remove unused CSS classes, unused include blocks, etc.).
- **Acceptance criteria:** Footer template contains no dead code from removed elements.

---

## Phase 5 — Validation and launch

### Task 5.1 — Run link checker `[dev]`
- **Command:**
  ```bash
  bundle exec jekyll build && npx broken-link-checker http://localhost:4000
  ```
- **Acceptance criteria:** Zero broken internal links; all old URLs in the redirect map return 301; no 404s for URLs that should exist.

### Task 5.2 — Review checklist `[dev]` `[content]`
- [ ] All pages in `sitemap-proposed.md` → Proposed URL Structure are live
- [ ] All redirects in the Complete Redirect Map below are working
- [ ] No placeholder `<!-- TODO -->` comments remain on live pages
- [ ] Footer matches proposed design
- [ ] Header matches proposed navigation
- [ ] No Twitter links visible to visitors
- [ ] Mastodon footer link points to `fosstodon.org`

### Task 5.3 — Update documentation `[dev]`
- Archive `docs/sitemap-current.md` as `docs/sitemap-pre-2026-02.md`
- Update `docs/sitemap-current.md` to reflect the new live state
- **Acceptance criteria:** `sitemap-current.md` accurately describes the post-migration site.

### Task 5.4 — Merge to master and deploy `[dev]`
- Final review by at least one maintainer
- Merge to `master` — GitHub Pages will deploy automatically
- **Acceptance criteria:** Live site at `opensourcedesign.net` reflects all changes.

---

## Complete redirect map

All URL changes for redirect configuration and SEO reference.

| Old URL | New URL | Type | Handled in |
|---------|---------|------|------------|
| /goals/ | /about-us/ | merged | Task 1.1 (`redirect_from` on about-us) |
| /faq/ | /about-us/ | merged | Task 1.1 (`redirect_from` on about-us) |
| /manifesto/ | /about-us/manifesto/ | moved | Task 1.2 |
| /code-of-conduct/ | /about-us/code-of-conduct/ | moved | Task 1.3 |
| /governance/ | /about-us/governance/ | moved | Task 1.4 |
| /by-laws/ | /about-us/by-laws/ | moved | Task 1.5 |
| /contribute/ | /about-us/how-to-join/ | removed → replacement | Task 1.6 |
| /contributing/ | /about-us/how-to-join/ | removed → replacement | Task 1.6 |
| /processes/ | /about-us/governance/ | removed → nearest | Task 1.9 |
| /articles/ | /resources/ | removed → nearest | Task 1.9 |
| /summit/ | /events/ | removed → nearest | Task 1.9 |
| /summit/2017 | /events/ | removed → nearest | Task 1.9 |
| /people-form/ | — | removed, no redirect | Task 1.11 |
| /people/ | — | removed, no redirect | Task 3.8 |
| /people/:slug/ | — | removed, no redirect | Task 3.8 |
| /logos/ | — | removed, no redirect | Task 1.11 |
| /YYYY/MM/DD/:slug (event write-up) | /events/:slug/ | per post | Task 3.6 |
| /YYYY/MM/DD/:slug (resource) | /resources/:slug/ | per post | Task 3.7 |

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02 | `/goals/` content merged into `/about-us/` | Reduces top-level nav clutter; goals are part of who we are |
| 2026-02 | `/people/` removed entirely, no replacement | No replacement planned |
| 2026-02 | Individual blog post URLs redirect per-post to new home | Preserves links; avoids losing content that may be indexed |
| 2026-02 | `/logos/` removed with no redirect | Page was unlisted and rate-limited; not worth preserving |
| 2026-02 | Jobs board stays as external sub-repo | Out of scope for this migration |
| 2026-02 | About Us: no dropdown nav, flat link only | Simpler; sub-pages discoverable via TOC on /about-us/ |
| 2026-02 | `/resources/` URL and label kept as-is for now | Can rename to "Getting Started" after the page is live and proven |

---

## Open questions

| # | Question | Blocking |
|---|----------|----------|
| 1 | Do we want to offer an email contact option for the core group? | Not blocking migration |
