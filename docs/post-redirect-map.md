# Blog Post Classification — redirect map

> **Task 0.1** from `migration-plan.md`
>
> Classify each post as `event` (→ `/events/:slug/`) or `resource` (→ `/resources/:slug/`).
> A third option `remove` is available if a post shouldn't be migrated at all.
> The "New slug" column only needs filling if the proposed slug differs from the filename.

---

## Dated posts (24)

| Date | Title | Classification | New slug (if different) | Notes |
|------|-------|---------------|------------------------|-------|
| 2015-04-25 | Welcome to Open Source Design | remove | | check if the content is relevant for "about us" |
| 2015-05-18 | This Month in Open Source Design | remove | | |
| 2015-05-24 | Why open source designers need tools beyond text and code | resource | | |
| 2015-07-10 | This Month in Open Source Design – June (and some bits of July and May) | remove | | |
| 2015-11-21 | 5 Steps to Design a UX that People Love | resource | | |
| 2016-04-04 | Designers in Open Source: julia | remove | | |
| 2017-03-27 | Open source design needs better collaboration tools | resource | | |
| 2017-10-30 | Open source design first NYC meetup | event | nyc-meetup-oct-2017 | |
| 2017-11-09 | Open Source Design NYC 11-09 meetup Recap | event | nyc-meetup-nov-2017 | |
| 2017-12-14 | Open source design NYC meetup recap | event | nyc-meetup-dec-2017 | |
| 2018-07-12 | Open source design NYC meetup recap | event | nyc-meetup-jul-2018 | |
| 2018-12-25 | Open Source Design Summit 2018 | event | | |
| 2019-05-31 | Open Source Design speak at Libre Graphics Meeting 2019 | event | Libre Graphics Meeting 2019 | |
| 2020-02-01 | Open Source Design speak at FOSDEM 2020 | event | FOSDEM 2020 | |
| 2020-08-13 | Use your artistic skills to help open source | resource | | |
| 2020-08-13 | Beginners Guide to Open Source Design (by Victory Brown) | resource | Beginners Guide | |
| 2020-08-20 | COVID-19 Illustrations 2020 | resource | | |
| 2021-05-05 | FOSDEM 2021: Open Source Design Devroom wrap up | event | FOSDEM 2021 | |
| 2021-07-05 | FOSS Backstage 2021: Open Source Design track support and UX Clinic wrap up | event | FOSS Backstage 2021 | |
| 2021-07-08 | Mozfest 2021: Open Source Design helps out Simply Secure with a UX Clinic | event | Mozfest 2021 | |
| 2021-07-11 | Open Source Design milestones over the years | remove | | check if the content is relevant for "about us" |
| 2024-05-09 | OSS Projects: Here's how to make a successful job post | remove | | check if the content is relevant for "jobs" |
| 2025-02-05 | FOSDEM 2025: Open Source Design Devroom wrap up | event | FOSDEM 2025 | |
| 2025-05-13 | FOSS Backstage 2025: wrap up | event | FOSS Backstage 2025 | |

---

## Undated posts — action required (Task 0.2)

These three files have no date-prefix and won't be published correctly by Jekyll.
Suggested action is noted; override as needed.

| File | Title | Suggested action | Classification | Notes |
|------|-------|-----------------|---------------|-------|
| `How-to-add-an-article-to-open-source-design.md` | *(front matter title is wrong — body content is a contributor how-to guide)* | Move to `docs/` as contributor guide, not a post | — | Not user-facing content |
| `open-source-design-milestones.md` | Open Source Design milestones over the years | Remove — exact duplicate of 2021-07-11 post | — | |
| `successful-open-source-design-jobs-kitspace-and-user-research-in-their-internet-of-production-report.md` | Successful Open Source Design jobs: Kitspace and User research in their Internet of production report | Remove | — | Was never properly published (no date); remove |
