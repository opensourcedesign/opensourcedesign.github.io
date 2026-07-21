#!/usr/bin/env node
/**
 * Post or update a moderator-facing preview comment on submission PRs.
 *
 * Env: GITHUB_TOKEN, REPO (owner/name), PR_NUMBER, HEAD_REF, PREVIEW_BASE
 */
import fs from 'node:fs';
import { gh } from './github-api.mjs';
import { submissionMeta } from './submission-meta.mjs';

const MARKER = '<!-- submission-preview -->';
const SITE = process.env.SITE || 'https://opensourcedesign.net';
const REPO = process.env.REPO;
const PR_NUMBER = process.env.PR_NUMBER;
const HEAD_REF = process.env.HEAD_REF || '';
const PREVIEW_BASE = (process.env.PREVIEW_BASE || '').replace(/\/+$/, '');

function scalar(fm, key) {
  const m = fm.match(new RegExp('^' + key + ':\\s*(.*)$', 'm'));
  if (!m) return '';
  let v = m[1].trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1);
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

function isSubmissionRef(ref) {
  return /^(job|job-edit|event|event-edit|resource)\//.test(ref);
}

function previewPath(file, fm, ref) {
  if (file === 'data/resources.yaml') return '/resources/links/';
  if (file.startsWith('content/jobs/')) {
    const slug = scalar(fm, 'slug') || slugify(scalar(fm, 'title'));
    return slug ? '/jobs/' + slug + '/' : '/jobs/';
  }
  if (file.startsWith('content/events/')) {
    const slug = scalar(fm, 'slug') || slugify(file.split('/').pop().replace(/\.md$/, ''));
    return slug ? '/events/' + slug + '/' : '/events/';
  }
  return '/';
}

function summarize(file, text, ref) {
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = fmMatch ? fmMatch[1] : '';
  const meta = submissionMeta(ref);
  const title = scalar(fm, 'title') || scalar(fm, 'name') || file.split('/').pop();
  const rows = [['Kind', meta.label]];
  if (scalar(fm, 'organization')) rows.push(['Organization', scalar(fm, 'organization')]);
  if (scalar(fm, 'role')) rows.push(['Role', scalar(fm, 'role')]);
  if (scalar(fm, 'status')) rows.push(['Status', scalar(fm, 'status')]);
  if (scalar(fm, 'start_date')) rows.push(['Start date', scalar(fm, 'start_date')]);
  if (scalar(fm, 'deadline')) rows.push(['Apply by', scalar(fm, 'deadline')]);
  if (scalar(fm, 'category')) rows.push(['Category', scalar(fm, 'category')]);
  if (scalar(fm, 'url')) rows.push(['URL', scalar(fm, 'url')]);

  const path = previewPath(file, fm, ref);
  const previewUrl = PREVIEW_BASE ? PREVIEW_BASE + path : '';
  const liveGuess = SITE.replace(/\/+$/, '') + path;

  return { title, rows, previewUrl, liveGuess, path, file };
}

async function upsertComment(body) {
  const comments = await gh(`/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`);
  const existing = comments.find((c) => c.user?.type === 'Bot' && c.body?.includes(MARKER));
  if (existing) {
    await gh(`/repos/${REPO}/issues/comments/${existing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    console.log('Updated submission preview comment.');
  } else {
    await gh(`/repos/${REPO}/issues/${PR_NUMBER}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    console.log('Posted submission preview comment.');
  }
}

async function main() {
  if (!REPO || !PR_NUMBER) {
    console.log('REPO / PR_NUMBER not set; skipping.');
    return;
  }
  if (!isSubmissionRef(HEAD_REF)) {
    console.log('Not a submission branch; skipping preview comment.');
    return;
  }

  const files = await gh(`/repos/${REPO}/pulls/${PR_NUMBER}/files?per_page=100`);
  const targets = files.filter((f) =>
    (f.filename.startsWith('content/jobs/') && f.filename.endsWith('.md'))
    || (f.filename.startsWith('content/events/') && f.filename.endsWith('.md'))
    || f.filename === 'data/resources.yaml'
  );
  if (!targets.length) {
    console.log('No submission content files in PR; skipping.');
    return;
  }

  const sections = [];
  for (const f of targets) {
    let text = '';
    if (f.filename === 'data/resources.yaml') {
      const data = await gh(`/repos/${REPO}/contents/${encodeURIComponent(f.filename)}?ref=${encodeURIComponent(HEAD_REF)}`);
      text = Buffer.from(data.content, 'base64').toString('utf8');
    } else {
      const data = await gh(`/repos/${REPO}/contents/${encodeURIComponent(f.filename)}?ref=${encodeURIComponent(HEAD_REF)}`);
      text = Buffer.from(data.content, 'base64').toString('utf8');
    }
    const info = summarize(f.filename, text, HEAD_REF);
    const table = info.rows.map(([k, v]) => `| ${k} | ${String(v).replace(/\|/g, '\\|')} |`).join('\n');
  sections.push(
      `### ${info.title}\n\n`
      + `| Field | Value |\n| --- | --- |\n${table}\n\n`
      + (info.previewUrl
        ? `- **Preview this page:** [${info.path}](${info.previewUrl})\n`
        : '')
      + `- **File:** \`${info.file}\`\n`
      + `- **Expected live URL:** ${info.liveGuess}\n`
    );
  }

  const body = `${MARKER}
## Submission preview

${sections.join('\n')}
---
_A PR site preview is also posted separately when site files change. Merge only after checking the rendered page and that content lint passes._`;

  await upsertComment(body);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
