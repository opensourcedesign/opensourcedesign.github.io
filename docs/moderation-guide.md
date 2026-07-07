# Job & submission moderation guide

How submissions reach this repository, what automation already checks, and
what a human reviewer still needs to judge before merging. Written for
maintainers and moderators (issue #550).

## How submissions arrive

Almost all submissions come from the website forms and are turned into pull
requests by the Cloudflare Worker (`workers/job-submit/`):

| Branch prefix | Source | What it changes |
|---|---|---|
| `job/` | [Job form](https://opensourcedesign.net/jobs/job-form/) | New file in `content/jobs/` |
| `job-edit/` | Job form in edit mode (link from reminder email) | Updates one existing job file |
| `event/`, `event-edit/` | Event form | File in `content/events/` |
| `resource/` | Resource suggestion form | Entry in `data/resources.yaml` |

PRs are labelled (`job-submission`, `event-submission`, `resource-suggestion`),
but downstream automation keys off the **branch prefix**, not the label.
Manual PRs (people editing markdown directly) are also fine - they just skip
the worker's validation, so review those a bit more carefully.

The submitter's email address is **not** in the PR (kept out of the public
repo). The worker stores it in KV, and the approval/reminder emails look it
up by file path. Don't ask posters to put an email in the front matter.

## What automation already checks

Before the PR reaches you:

- **Spam gates** - Cloudflare Turnstile plus a honeypot field on the form.
  Bots that fill the honeypot get a silent fake success.
- **Field validation** - required fields (title, organization, license URL,
  description, contact method) are enforced by the worker.
- **Duplicate check** - a new job that closely matches an open posting gets a
  409 warning; the poster must explicitly click "Post anyway", so a
  near-duplicate PR you see was submitted deliberately.
- **Content lint** (`content-lint.yml`) - front matter validity plus the
  Markdown pitfalls that break rendering (4-space indents, `###Heading`
  without a space, pseudo-bullets). A red check means the page will render
  broken: fix or ask the poster to resubmit.
- **PR preview** (`preview.yml`) - every PR gets a live preview deployment;
  the link appears as a PR comment. Always look at the rendered page, not
  just the diff. Previews deploy to the `gh-pages` branch under
  `pr-preview/pr-<number>/` and are served at
  `https://opensourcedesign.net/pr-preview/pr-<number>/` (same custom domain
  as production). **Settings → Pages → Build and deployment → Deploy from
  branch → `gh-pages` / `/`** must be set, and the custom domain
  `opensourcedesign.net` must be verified for the organization and active on
  this repo. Production deploys from `hugo-build.yml` also target `gh-pages`
  (site root) and preserve the `pr-preview/` folder.

## What a human must still judge

### Jobs (new postings)

- **Is the project actually open source?** Follow the license URL - it must
  point to an OSI/FSF-approved license *of the project being designed for*
  (not a random repo). This is the #1 reason to push back (issue #157).
- **Is it a design task?** We host design work: UX, UI, logos, branding,
  illustration, usability research. Pure development jobs belong elsewhere.
- **Title quality** - should say what the task is and name the project
  ("Logo design for X", not "Designer needed"). The form nudges posters, but
  it doesn't block; feel free to suggest a better title in review
  (issue #152).
- **Honest compensation** - "Paid" postings should state a rate or range.
  Watch for spec-work patterns (contests, "exposure", payment only on
  acceptance) and push back on them.
- **Working contact method** - the apply link/email should be reachable and
  should not require creating an account on an obscure platform.
- **Tone and conduct** - the posting must be compatible with our
  [Code of Conduct](https://opensourcedesign.net/about-us/code-of-conduct/).
- **Scam signals** - brand-new orgs with no repo history, crypto/gambling
  adjacency, off-platform payment schemes, URLs that don't match the claimed
  organization. When in doubt, ask in the PR and wait.

### Job edits (`job-edit/`)

- The diff should touch **one existing file** - the poster's own. Verify the
  edit doesn't change identity fields in a way that hijacks someone else's
  posting (URL/permalink changes are preserved by the worker on purpose).
- Status changes to `solved`/`closed` are normal and welcome - merge quickly
  so the board stays accurate.

### Events

- Real event, plausible dates and location, working link, and relevant to
  open source design. Events are lower-risk than jobs; the main failure mode
  is spam links.

### Resource suggestions

- Relevant to designers working in open source, reasonably licensed, and not
  a dead or promotional URL. The worker's PR body includes a review reminder
  checklist.

## What happens when you merge

Automatically, in order:

1. **Deploy** - `hugo-build.yml` builds and publishes the site.
2. **Approval email** (`job-approved-email.yml`) - the submitter gets a
   branded email with the exact live URL of their posting (resolved from the
   merged PR's files).
3. **Social announce** (`job-announce.yml`) - new jobs are posted to Mastodon
   and Bluesky (skipped for edits and when the poster opted out via
   `announce_social: false` on the job form).

And later, on schedules:

- **Reminders** (`job-reminder.yml`, Mondays 06:00 UTC) - posters of ageing
  open jobs get an email with one-click close/edit links.
- **Expiry** (`job-expire.yml`, daily 04:15 UTC) - jobs whose deadline passed
  are marked expired; postings untouched for over a year are closed
  automatically. No moderator action needed.

## Rejecting a submission

Close the PR with a short, kind comment explaining why (no license, not a
design task, spam). **Closing does not email the submitter** - only merges
trigger email - so the PR comment is the only feedback they get. If the
submission is salvageable, say what to change and point them back to the
form; edits to their own open PR branch also work.

For guidance posters can be sent, link the
[guidelines for responding to jobs](https://discourse.opensourcedesign.net/t/guidelines-for-responding-to-jobs/1925)
thread or the job form's own hints.

## Changing this process

The review process itself is community-owned. Propose changes on
[issue #550](https://github.com/opensourcedesign/opensourcedesign.github.io/issues/550)
or the forum before editing the automation. The relevant moving parts:

- Worker validation and PR creation: `workers/job-submit/src/index.js`
- Lint rules: `.github/scripts/lint-content.mjs`
- Email/announce/expiry workflows: `.github/workflows/job-*.yml`
