# Submission Worker (jobs + events)

A free Cloudflare Worker that replaces the old Staticman/Heroku backend for the
**Post a Job** and **Submit an Event** forms. It verifies a submission
(Cloudflare Turnstile + honeypot), rebuilds the Markdown server-side, and opens
a moderated pull request into `content/jobs/` (or `content/events/` when the
payload carries `kind: "event"`). The submitter's email is kept private in
Cloudflare KV (keyed by PR number) so the
[`job-approved-email`](../../.github/workflows/job-approved-email.yml)
workflow can notify them when the posting is merged and published.

```
Visitor → POST /submit → Worker → (Turnstile + honeypot) → GitHub PR into content/jobs/ or content/events/
                                 → KV: pr:<n> = { email, title, kind }
Maintainer merges PR → GitHub Action → GET /lookup?pr=<n> → email submitter via SMTP
```

Everything fits comfortably in the free tiers (Workers 100k req/day, KV 100k
reads + 1k writes/day, Turnstile unlimited, Actions free on public repos) for the
expected ~10 submissions/month. **Cost: $0.**

## Routes

| Method | Path             | Auth                       | Purpose                                   |
| ------ | ---------------- | -------------------------- | ----------------------------------------- |
| `POST` | `/submit`        | Turnstile token in body    | Verify + open a PR, store email in KV      |
| `GET`  | `/lookup?pr=<n>` | `Authorization: Bearer …`  | Return the stored email (workflow only)    |
| `GET`  | `/` or `/health` | none                       | Health check (`{ ok: true }`)              |

## Prerequisites (provided by the maintainer)

1. A **Cloudflare account** (free) with [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) installed/logged in.
2. A **GitHub fine-grained PAT** scoped to `opensourcedesign/opensourcedesign.github.io` with:
   - **Contents: Read and write**
   - **Pull requests: Read and write**
   - *(optional)* **Issues: Read and write** — only needed if you want the Worker to add the `job-submission` label; labeling is best-effort and the email workflow does not depend on it.
3. **Cloudflare Turnstile** site + secret keys ([dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)).
4. **SMTP** credentials (host, port, user, password, from address) for the approval email.

## Deploy

Run these from `workers/job-submit/`:

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

Set the params under `[params]`, then commit. Both forms talk to the same
`/submit` route — the Worker tells them apart by the `kind` field:

```toml
jobSubmitEndpoint   = "https://osd-job-submit.<account>.workers.dev/submit"
eventSubmitEndpoint = "https://osd-job-submit.<account>.workers.dev/submit"
turnstileSiteKey    = "<your-turnstile-site-key>"
```

When an endpoint param is empty the corresponding form still works — it falls
back to showing the generated Markdown for a manual PR.

## GitHub repo secrets (for the approval email)

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

The workflow triggers on any merged PR whose branch starts with `job/` or
`event/` (which the Worker always uses), so the `job-submission` and
`event-submission` labels are informational only.

## Local development

```bash
npx wrangler dev
```

Turnstile verification is skipped when `TURNSTILE_SECRET` is unset, and the email
write is skipped when no `EMAILS` KV is bound — handy for local testing. Use
`--local` for an offline KV, or `npx wrangler kv namespace create EMAILS --preview`
for a preview namespace.

## Security notes

- The submitter email is **never** written to the repo or the PR body — only to KV,
  with a ~90-day TTL (`EMAIL_TTL_DAYS`).
- `/lookup` is bearer-protected with a constant-time comparison and used only
  server-to-server by the merge workflow (no CORS headers).
- `/submit` is CORS-restricted to `ALLOWED_ORIGIN` and the Markdown is rebuilt
  server-side, so a malicious client cannot craft arbitrary file contents/paths.
- All input is validated server-side (required fields, http(s) URLs, email format)
  and length-capped to keep commits small and reject abusive payloads.
- The GitHub PAT lives only as a Worker secret; rotate it if leaked.
