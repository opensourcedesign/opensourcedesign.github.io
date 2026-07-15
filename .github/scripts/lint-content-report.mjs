#!/usr/bin/env node
/** Report content-lint warnings across job/event markdown. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const NOT_POSTINGS = new Set(['_index.md', 'archive.md', 'how-to-post.md', 'job-form.md', 'event-form.md']);

function listMarkdown(dir) {
  return fs
    .readdirSync(path.join(ROOT, dir))
    .filter((f) => f.endsWith('.md') && !NOT_POSTINGS.has(f))
    .map((f) => path.join(dir, f).replace(/\\/g, '/'));
}

const files = [...listMarkdown('content/jobs'), ...listMarkdown('content/events')];
const BATCH = 80;

for (let i = 0; i < files.length; i += BATCH) {
  const batch = files.slice(i, i + BATCH);
  const r = spawnSync('node', ['.github/scripts/lint-content.mjs', ...batch], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const sections = out.split(/\n=== /).slice(1);
  for (const sec of sections) {
    const warns = [...sec.matchAll(/^\s+warn:\s+(.+)$/gm)].map((m) => m[1]);
    if (!warns.length) continue;
    const file = sec.split(' ===')[0];
    console.log(`\n=== ${file} ===`);
    warns.forEach((w) => console.log('  warn:  ' + w));
  }
}
