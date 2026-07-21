# Submission Worker (jobs, events & resources)

A free Cloudflare Worker that replaces the old Staticman/Heroku backend for the
**Post a Job**, **Submit an Event**, and **Suggest a resource** forms. It verifies
each submission (Cloudflare Turnstile + honeypot), rebuilds content server-side,
and opens a moderated pull request into:

- `content/jobs/` when `kind` is omitted or `"job"`
- `content/events/` when `kind` is `"event"`
- `data/resources.yaml` when `kind` is `"resource"` (entry appended to the chosen
  category; the YAML is edited textually so comments and formatting survive)

The submitter's email is kept private in Cloudflare KV (keyed by PR number) so the
[`job-approved-email`](../../.github/workflows/job-approved-email.yml)
workflow can notify them when the posting is merged and published.
[`job-rejected-email`](../../.github/workflows/job-rejected-email.yml) emails
them when a submission PR is closed without merging (with moderator feedback
when a comment was left).

The same `/submit` route also powers **edits**: when the payload carries
`edit_file` (set by a form's edit mode, reached via the "Edit this posting" /
"Edit this event" links - `/jobs/job-form/?edit=<file>.md` or
`/events/event-form/?edit=<file>.md`), the Worker updates that existing file
on a `job-edit/*` or `event-edit/*` branch instead of adding a new one.
Identity fields (`date_posted`, `date`, `_id`, `slug`, `url`, `permalink`,
`aliases`, `categories`, `author`) are preserved from the current file so URLs
and list ordering don't change, and the submitter can also set the status
(jobs: searching / filled / closed / expired; events: upcoming / cancelled).

Jobs may carry an optional `deadline` (application deadline, `YYYY-MM-DD`).
The Worker validates the format and rejects past dates on new submissions
(edits may keep a historical deadline). Postings past their deadline expire
on the site - see the `job-expire.yml` workflow.

Jobs may also carry a structured rate (`rate_min`, optional `rate_max`,
`rate_currency`, `rate_period`): numbers are validated (`max >= min >= 0`),
the currency must be a 3-letter code, and the period one of
hour/day/month/year/project.

New job submissions run a **duplicate check** against the site's machine-readable
index (`<SITE_BASE_URL>/jobs/index.json`): if an open (`searching`) posting has
the same normalized title - or a near-identical title from the same
organization - the Worker answers `409` with the match, and the form asks the
submitter to confirm (re-submitting with `force_duplicate: true`). The check
fails open, so an unreachable site never blocks a legitimate posting.

Resource suggestions (`kind: "resource"`, from `/resources/suggest/`) open a PR on
a `resource/*` branch. Unknown categories are rejected. The same KV email flow
applies (the approval workflow recognizes `resource/*` branches).

```
Visitor → POST /submit → Worker → (Turnstile + honeypot) → GitHub PR into content/jobs/, content/events/, or data/resources.yaml
                                 → KV: pr:<n> = { email, title, kind }
Maintainer merges PR → GitHub Action → GET /lookup?pr=<n> → email submitter via SMTP
Maintainer closes PR  → GitHub Action → GET /lookup?pr=<n> → rejection email → POST /rejection-sent?pr=<n>
```

The notification is a branded HTML email (plain-text alternative included) and
links directly to the published page: the workflow resolves the job/event
permalink - or the resource's category anchor on `/resources/links/` - from
the merged PR's files via `.github/scripts/published-url.mjs`, falling back to
the section list URL if resolution fails.

Everything fits comfortably in the free tiers (Workers 100k req/day, KV 100k
reads + 1k writes/day, Turnstile unlimited, Actions free on public repos) for the
expected ~10 submissions/month. **Cost: $0.**

## Routes

| Method | Path             | Auth                       | Purpose                                   |
| ------ | ---------------- | -------------------------- | ----------------------------------------- |
| `POST` | `/submit`        | Turnstile token in body    | Verify + open a PR, store email in KV      |
| `GET`  | `/lookup?pr=<n>` | `Authorization: Bearer …`  | Return the stored email (workflow only)    |
| `GET`  | `/rejection-sent?pr=<n>` | `Authorization: Bearer …` | Whether a rejection email was already sent |
| `POST` | `/rejection-sent?pr=<n>` | `Authorization: Bearer …` | Mark rejection email sent (idempotent)     |
| `GET`  | `/forum`         | none                       | Trimmed Discourse latest-topics list (CORS proxy, cached 10 min) |
| `GET`  | `/` or `/health` | none                       | Health check (`{ ok: true }`)              |

### `GET /forum`

The homepage "From the forum" section refreshes itself on page load, but the
Discourse instance (`FORUM_URL`) sends no `Access-Control-Allow-Origin`
header, so browsers can't fetch `latest.json` directly. This route proxies it
with CORS enabled, trims the payload to the six newest non-pinned topics
(`id`, `slug`, `title`, `posts_count`, `last_posted_at`), and caches for 10
minutes both at the Cloudflare edge (`cf.cacheTtl`) and in the browser
(`Cache-Control: public, max-age=600`), so site traffic never hammers the
forum. The build-time list rendered by Hugo remains the no-JS fallback.

## Prerequisites (provided by the maintainer)

1. A **Cloudflare account** (free) with [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) installed/logged in.
2. A **GitHub fine-grained PAT** scoped to `opensourcedesign/opensourcedesign.net` with:
   - **Contents: Read and write**
   - **Pull requests: Read and write**
   - *(optional)* **Issues: Read and write** - only needed if you want the Worker to add the `job-submission`, `event-submission`, or `resource-suggestion` labels; labeling is best-effort and the email workflow does not depend on it.
3. **Cloudflare Turnstile** site + secret keys ([dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)).
4. **SMTP** credentials (host, port, user, password, from address) for the approval and rejection emails.

## Deploy

`wrangler.toml` sets `GITHUB_BRANCH = "main"` (the repo's default branch for
the first Hugo deployment). Change it to `main` later if the default is renamed.

Run these from `workers/job-submit/` (or `npm install` from `workers/` - that
installs this package's dependencies via the parent workspace):

```bash
# 1. Install wrangler locally (or use `npx wrangler ...`)
npm install

# 2. Create the KV namespace, then paste the returned id into wrangler.toml
#    (replace REPLACE_WITH_EMAILS_KV_NAMESPACE_ID).
npx wrangler kv namespace create EMAILS

# 3. Set the secrets (you'll be prompted to paste each value).
npx wrangler secret put GITHUB_TOKEN      # fine-grained PAT
npx wrangler secret put TURNSTILE_SECRET  # Turnstile secret key
npx wrangler secret put LOOKUP_SECRET     # any long random string

# 4. Deploy.
npx wrangler deploy
```

`wrangler deploy` prints the Worker URL, e.g. `https://osd-job-submit.<account>.workers.dev`.

> Generate a strong `LOOKUP_SECRET`, e.g. `openssl rand -hex 32`. You'll reuse the
> exact same value as the `JOB_LOOKUP_SECRET` GitHub repo secret below.

### Optional: per-IP rate limiting

Uncomment the `RATE_LIMIT` namespace block in `wrangler.toml`, create it
(`npx wrangler kv namespace create RATE_LIMIT`), paste the id, and redeploy. The
daily cap is `RATE_LIMIT_MAX` (default 5). Without this binding, rate limiting is
simply skipped.

## Wire it into the site (`hugo.toml`)

Set the params under `[params]`, then commit. All three forms talk to the same
`/submit` route - the Worker tells them apart by the `kind` field. The resource
form reads `jobSubmitEndpoint` (there is no separate param for it):

```toml
jobSubmitEndpoint   = "https://osd-job-submit.<account>.workers.dev/submit"  # jobs + resources
eventSubmitEndpoint = "https://osd-job-submit.<account>.workers.dev/submit"
turnstileSiteKey    = "<your-turnstile-site-key>"
```

When an endpoint param is empty the corresponding form still works - it falls
back to showing the generated Markdown (jobs/events) or a GitHub edit link
(resources) for a manual PR.

## GitHub repo secrets (for submission emails)

In the site repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret              | Value                                                            |
| ------------------- | --------------------------------------------------------------- |
| `JOB_LOOKUP_URL`    | `https://osd-job-submit.<account>.workers.dev/lookup`           |
| `JOB_LOOKUP_SECRET` | the **same** value you set for the Worker's `LOOKUP_SECRET`      |
| `SMTP_HOST`         | SMTP server hostname                                            |
| `SMTP_PORT`         | `587` (STARTTLS) or `465` (implicit TLS)                        |
| `SMTP_USER`         | SMTP username                                                   |
| `SMTP_PASS`         | SMTP password / app password                                   |
| `SMTP_FROM`         | from address, e.g. `hello@opensourcedesign.net`                 |
| `SMTP_SECURE`       | *(optional)* `true` for port 465; omit/`false` for 587          |

The workflows trigger on merged or closed submission PRs whose branch starts
with `job/`, `event/`, or `resource/` (which the Worker always uses), so the
`job-submission`, `event-submission`, and `resource-suggestion` labels are
informational only.

## Local development

```bash
npx wrangler dev
```

Turnstile verification is skipped when `TURNSTILE_SECRET` is unset, and the email
write is skipped when no `EMAILS` KV is bound - handy for local testing. Use
`--local` for an offline KV, or `npx wrangler kv namespace create EMAILS --preview`
for a preview namespace.

## Security notes

- The submitter email is **never** written to the repo or the PR body - only to KV,
  with a ~90-day TTL (`EMAIL_TTL_DAYS`).
- `/lookup` and `/rejection-sent` are bearer-protected with a constant-time
  comparison and used only server-to-server by the merge/rejection workflows
  (no CORS headers). The email KV entry is kept until TTL so a reopened and
  merged PR can still trigger the approval email; `rejected:pr:<n>` only
  prevents duplicate rejection notices.
- `/submit` is CORS-restricted to `ALLOWED_ORIGIN` and the Markdown is rebuilt
  server-side, so a malicious client cannot craft arbitrary file contents/paths.
- All input is validated server-side (required fields, http(s) URLs, email format)
  and length-capped to keep commits small and reject abusive payloads.
- The GitHub PAT lives only as a Worker secret; rotate it if leaked.
