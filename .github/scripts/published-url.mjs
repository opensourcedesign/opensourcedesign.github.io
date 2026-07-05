/**
 * Resolve the live URL of the content published by a merged submission PR, so
 * the "your submission is live" email links to the actual job/event/resource
 * rather than the generic section list.
 *
 * Reads the PR's changed files via the GitHub API, fetches the merged content
 * file, and derives the permalink the same way Hugo does:
 *   - jobs:   /jobs/:slug/ (explicit url/permalink > slug > slugified title)
 *   - events: explicit url/permalink > slug > the filename
 *   - resources: /resources/links/#<category-id> (category found by locating
 *     the added line in data/resources.yaml)
 *
 * Env: GITHUB_TOKEN, REPO (owner/name), PR_NUMBER, HEAD_REF, MERGE_SHA.
 * Writes `url=<...>` to $GITHUB_OUTPUT; always succeeds — on any error it
 * falls back to the section list URL for the submission kind.
 */

import fs from 'node:fs';

const SITE = process.env.SITE || 'https://opensourcedesign.net';
const { GITHUB_TOKEN, REPO, PR_NUMBER, HEAD_REF, MERGE_SHA } = process.env;

function fallbackUrl(ref) {
  if (ref.startsWith('event')) return `${SITE}/events/`;
  if (ref.startsWith('resource')) return `${SITE}/resources/links/`;
  return `${SITE}/jobs/`;
}

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${GITHUB_TOKEN}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${path} -> ${res.status}`);
  return res.json();
}

async function fileAt(path, ref) {
  const data = await api(`/repos/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${ref}`);
  return Buffer.from(data.content, 'base64').toString('utf8');
}

// Minimal front matter reader; the corpus is too messy for a strict parser.
function frontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : '';
}

function scalar(fm, key) {
  const m = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'));
  if (!m) return '';
  return m[1].trim().replace(/^["']|["']$/g, '').trim();
}

// Mirrors the Worker's slugify (itself mirroring Hugo's :slug fallback).
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

function sitePath(p) {
  return SITE + '/' + String(p).replace(/^\/+/, '').replace(/\/*$/, '/');
}

async function jobUrl(file) {
  const fm = frontMatter(await fileAt(file, MERGE_SHA));
  const explicit = scalar(fm, 'url') || scalar(fm, 'permalink');
  if (explicit) return sitePath(explicit);
  const slug = scalar(fm, 'slug') || slugify(scalar(fm, 'title'));
  if (!slug) throw new Error(`no slug or title in ${file}`);
  return `${SITE}/jobs/${slug}/`;
}

async function eventUrl(file) {
  const fm = frontMatter(await fileAt(file, MERGE_SHA));
  const explicit = scalar(fm, 'url') || scalar(fm, 'permalink');
  if (explicit) return sitePath(explicit);
  const slug = scalar(fm, 'slug');
  if (slug) return `${SITE}/events/${slug}/`;
  // Hugo's default URL for the page is the urlized filename.
  const base = file.split('/').pop().replace(/\.md$/, '');
  return `${SITE}/events/${slugify(base)}/`;
}

// The resource PR adds item lines under a category in data/resources.yaml.
// Use the patch hunk to find the new-file line of the added `name:` entry,
// then scan upward in the merged file for the owning category `- id:`.
async function resourceUrl(patch) {
  if (!patch) throw new Error('no patch for resources.yaml');
  let newLine = 0;
  let addedNameLine = 0;
  for (const raw of patch.split('\n')) {
    const hunk = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      newLine = parseInt(hunk[1], 10) - 1;
      continue;
    }
    if (raw.startsWith('-')) continue;
    newLine++;
    if (raw.startsWith('+') && !addedNameLine && /^\+\s*-?\s*name:/.test(raw)) addedNameLine = newLine;
  }
  if (!addedNameLine) throw new Error('no added name: line found in patch');
  const lines = (await fileAt('data/resources.yaml', MERGE_SHA)).split(/\r?\n/);
  for (let i = Math.min(addedNameLine, lines.length) - 1; i >= 0; i--) {
    const m = lines[i].match(/^-\s+id:\s*(\S+)/);
    if (m) return `${SITE}/resources/links/#${m[1].replace(/^["']|["']$/g, '')}`;
  }
  throw new Error('no category id found above the added entry');
}

async function resolve() {
  const files = await api(`/repos/${REPO}/pulls/${PR_NUMBER}/files?per_page=100`);
  if (HEAD_REF.startsWith('resource/')) {
    const yaml = files.find((f) => f.filename === 'data/resources.yaml');
    return resourceUrl(yaml && yaml.patch);
  }
  const dir = HEAD_REF.startsWith('event') ? 'content/events/' : 'content/jobs/';
  const md = files.find((f) => f.filename.startsWith(dir) && f.filename.endsWith('.md'));
  if (!md) throw new Error(`no ${dir}*.md file in PR #${PR_NUMBER}`);
  return HEAD_REF.startsWith('event') ? eventUrl(md.filename) : jobUrl(md.filename);
}

let url;
try {
  url = await resolve();
  console.log(`Resolved published URL: ${url}`);
} catch (e) {
  url = fallbackUrl(HEAD_REF || '');
  console.log(`Could not resolve exact URL (${e.message}); falling back to ${url}`);
}
fs.appendFileSync(process.env.GITHUB_OUTPUT, `url=${url}\n`);
