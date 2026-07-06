#!/usr/bin/env node
/**
 * Find job postings due a "still searching?" reminder and resolve the
 * submitter's email (run weekly by job-reminder.yml).
 *
 * A posting qualifies when its status is `searching` and date_posted falls
 * 42-48 days ago - a 7-day window, so the weekly run catches each job exactly
 * once, around the 45-day mark. Jobs edited in the last two weeks are
 * skipped (the poster is clearly still around).
 *
 * The submitter's email was stored in Cloudflare KV by the submission Worker,
 * keyed by PR number, so the file is mapped back to the PR that introduced it
 * via the GitHub API. Manually committed postings have no PR/email and are
 * skipped with a log line.
 *
 * Environment:
 *   GITHUB_TOKEN    for the commits/pulls API lookups.
 *   REPO            owner/name (e.g. opensourcedesign/opensourcedesign.github.io).
 *   LOOKUP_URL      Worker /lookup endpoint.
 *   LOOKUP_SECRET   Bearer secret for the lookup endpoint.
 *
 * Writes `found` and a strategy `matrix` (include list of {email, title,
 * file, edit_url, job_url}) to GITHUB_OUTPUT.
 */

import fs from 'node:fs';

const SITE = 'https://opensourcedesign.net';
const REPO = process.env.REPO || 'opensourcedesign/opensourcedesign.github.io';
const MIN_AGE = 42;
const MAX_AGE = 49; // exclusive

function scalar(fm, key) {
  const m = fm.match(new RegExp('^' + key + ':\\s*(.*)$', 'm'));
  if (!m) return '';
  let v = m[1].trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1).replace(/''/g, "'");
  }
  return v.trim();
}

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

async function gh(path) {
  const res = await fetch('https://api.github.com' + path, {
    headers: {
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error('GitHub ' + path + ': HTTP ' + res.status);
  return res.json();
}

async function prNumberForFile(file) {
  // Oldest commit touching the path is the one that introduced it.
  const commits = await gh(`/repos/${REPO}/commits?path=${encodeURIComponent(file)}&per_page=100`);
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

const today = Date.now();
const include = [];

for (const name of fs.readdirSync('content/jobs').filter((f) => f.endsWith('.md'))) {
  const file = 'content/jobs/' + name;
  const text = fs.readFileSync(file, 'utf8');
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) continue;
  const fm = fmMatch[1];

  if (scalar(fm, 'status').toLowerCase() !== 'searching') continue;
  const posted = scalar(fm, 'date_posted').match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!posted) continue;
  const age = (today - Date.parse(posted)) / 86400000;
  if (age < MIN_AGE || age >= MAX_AGE) continue;

  const updated = scalar(fm, 'last_updated').match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (updated && (today - Date.parse(updated)) / 86400000 < 14) {
    console.log(`skip ${name}: edited recently (${updated})`);
    continue;
  }

  console.log(`candidate ${name}: posted ${posted} (${Math.floor(age)} days ago)`);
  try {
    const pr = await prNumberForFile(file);
    if (!pr) {
      console.log(`  skip: no associated PR (manually committed)`);
      continue;
    }
    const { email, skip } = await lookupEmail(pr);
    if (skip) {
      console.log(`  skip: ${skip}`);
      continue;
    }
    const title = scalar(fm, 'title');
    const slug = scalar(fm, 'slug') || slugify(title);
    include.push({
      email,
      title,
      // Escaped copy for the html_body: the title is submitter-provided and
      // must not inject markup into the email.
      title_html: title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;'),
      file: name,
      job_url: `${SITE}/jobs/${slug}/`,
      edit_url: `${SITE}/jobs/job-form/?edit=${encodeURIComponent(name)}`,
    });
    console.log(`  reminder queued (PR #${pr})`);
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
  }
}

const out = [
  'found=' + (include.length ? 'true' : 'false'),
  'matrix<<MATRIX_EOF',
  JSON.stringify({ include }),
  'MATRIX_EOF',
].join('\n') + '\n';

if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, out);
console.log(`\n${include.length} reminder(s) queued.`);
