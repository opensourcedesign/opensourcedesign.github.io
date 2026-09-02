#!/usr/bin/env node
/**
 * Find ageing job postings and email reminders without exposing addresses in logs.
 *
 * Env: GITHUB_TOKEN, REPO, LOOKUP_URL, LOOKUP_SECRET
 *      SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
import fs from 'node:fs';
import { gh, ghPaginated } from './github-api.mjs';
import { readYamlScalar } from './yaml-front-matter.mjs';
import { sendMail } from './send-mail.mjs';

const SITE = 'https://opensourcedesign.net';
const REPO = process.env.REPO || 'opensourcedesign/opensourcedesign.net';
const MAX_AGE = 49;
const MIN_AGE = 42;

function slugify(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeHtml(title) {
  return title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function prNumberForFile(file) {
  const commits = await ghPaginated(`/repos/${REPO}/commits?path=${encodeURIComponent(file)}`);
  if (!commits.length) return null;
  const first = commits[commits.length - 1];
  const pulls = await gh(`/repos/${REPO}/commits/${first.sha}/pulls`);
  return pulls.length ? pulls[0].number : null;
}

async function lookupEmail(pr) {
  const url = (process.env.LOOKUP_URL || '').replace(/\/+$/, '');
  const secret = process.env.LOOKUP_SECRET || '';
  if (!url || !secret) return { skip: 'LOOKUP_URL / LOOKUP_SECRET not configured' };
  const res = await fetch(url + '?pr=' + pr, { headers: { Authorization: 'Bearer ' + secret } });
  if (!res.ok) return { skip: 'lookup HTTP ' + res.status };
  const out = await res.json();
  return out.found ? { email: out.email } : { skip: 'no email on file (KV entry expired or manual PR)' };
}

function reminderBodies({ title, titleHtml, jobUrl, editUrl }) {
  const text = `Hi,

Your job posting "${title}" has been live on Open Source Design
for about six weeks:

${jobUrl}

If the position has been filled or is no longer available, please close it
so applicants don't keep reaching out - open the edit form and set the
status to "filled" or "closed":

${editUrl}

If you're still searching, no action is needed. The posting stays open
until its application deadline passes or it reaches one year, at which
point it's archived automatically.

Thanks for posting with Open Source Design!

- The Open Source Design community`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    @font-face {
      font-family: "InterVariable";
      font-style: normal;
      font-weight: 100 900;
      src: url("https://opensourcedesign.net/fonts/InterVariable.woff2") format("woff2");
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your job posting has been live for six weeks - still searching, or can we close it?</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
        <tr>
          <td style="background-color:#0f172a;border-radius:12px 12px 0 0;padding:20px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td><img src="https://opensourcedesign.net/images/email/osd-logo-white.png" width="32" height="32" alt="Open Source Design logo" style="display:block;border:0;" /></td>
              <td style="padding-left:12px;font-family:'InterVariable',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;">Open Source Design</td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;padding:36px 32px;font-family:'InterVariable',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#0f172a;">Is your job posting still open?</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">Hi,</p>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">Your job posting <a href="${jobUrl}" style="color:#0f172a;font-weight:600;">&ldquo;${titleHtml}&rdquo;</a> has been live on Open Source Design for about six weeks.</p>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">If the position has been filled or is no longer available, please close it so applicants don&rsquo;t keep reaching out - open the edit form and set the status to &ldquo;filled&rdquo; or &ldquo;closed&rdquo;.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr>
              <td style="border-radius:8px;background-color:#0f172a;">
                <a href="${editUrl}" style="display:inline-block;padding:13px 28px;font-family:'InterVariable',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Update your posting &rarr;</a>
              </td>
            </tr></table>
            <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#64748b;">Or copy this link:<br /><a href="${editUrl}" style="color:#0f766e;word-break:break-all;">${editUrl}</a></p>
            <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#64748b;">If you&rsquo;re still searching, no action is needed. The posting stays open until its application deadline passes or it reaches one year, at which point it&rsquo;s archived automatically.</p>
            <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#334155;">Thanks for posting with Open Source Design!</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8fafc;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0;padding:20px 32px;font-family:'InterVariable',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#64748b;">
            <strong style="color:#475569;">Open Source Design</strong> - a community of designers and developers improving the usability of open source software.<br />
            <a href="https://opensourcedesign.net" style="color:#64748b;">opensourcedesign.net</a> &nbsp;&middot;&nbsp; <a href="https://discourse.opensourcedesign.net" style="color:#64748b;">Forum</a> &nbsp;&middot;&nbsp; <a href="https://opensourcedesign.net/jobs/" style="color:#64748b;">Job board</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { text, html };
}

async function main() {
  const today = Date.now();
  let sent = 0;

  for (const name of fs.readdirSync('content/jobs').filter((f) => f.endsWith('.md'))) {
    const file = 'content/jobs/' + name;
    const text = fs.readFileSync(file, 'utf8');
    const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];

    if (readYamlScalar(fm, 'status').toLowerCase() !== 'searching') continue;
    const posted = readYamlScalar(fm, 'date_posted').match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (!posted) continue;
    const age = (today - Date.parse(posted)) / 86400000;
    if (age < MIN_AGE || age >= MAX_AGE) continue;

    const updated = readYamlScalar(fm, 'last_updated').match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (updated && (today - Date.parse(updated)) / 86400000 < 14) {
      console.log(`skip ${name}: edited recently (${updated})`);
      continue;
    }

    console.log(`candidate ${name}: posted ${posted} (${Math.floor(age)} days ago)`);
    try {
      const pr = await prNumberForFile(file);
      if (!pr) {
        console.log('  skip: no associated PR (manually committed)');
        continue;
      }
      const { email, skip } = await lookupEmail(pr);
      if (skip) {
        console.log(`  skip: ${skip}`);
        continue;
      }

      const title = readYamlScalar(fm, 'title');
      const slug = readYamlScalar(fm, 'slug') || slugify(title);
      const jobUrl = `${SITE}/jobs/${slug}/`;
      const editUrl = `${SITE}/jobs/job-form/?edit=${encodeURIComponent(name)}`;
      const { text: body, html } = reminderBodies({
        title,
        titleHtml: escapeHtml(title),
        jobUrl,
        editUrl,
      });

      const recipientFile = `${process.env.RUNNER_TEMP || '/tmp'}/reminder-${pr}.txt`;
      fs.writeFileSync(recipientFile, email, { mode: 0o600 });
      console.log(`::add-mask::${email}`);

      await sendMail({
        toFile: recipientFile,
        subject: `Is your job posting "${title}" still open?`,
        text: body,
        html,
      });
      fs.unlinkSync(recipientFile);
      sent++;
      console.log(`  reminder sent (PR #${pr})`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  console.log(`\n${sent} reminder(s) sent.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
