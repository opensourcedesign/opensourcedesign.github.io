#!/usr/bin/env node
/**
 * Normalize job posting files:
 *   - status: solved/resolved/completed → filled
 *   - filenames: spaces/uppercase/empty slugs → date-slug.md
 *
 *   node .github/scripts/normalize-jobs.mjs [--dry-run]
 *   node .github/scripts/normalize-jobs.mjs --check   # CI: exit 1 if changes needed
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  isBadJobFilename,
  scalarFromFm,
  targetBasename,
} from './job-filename-rules.mjs';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'content/jobs');
const dryRun = process.argv.includes('--dry-run');
const checkOnly = process.argv.includes('--check');

const STATUS_MAP = {
  solved: 'filled',
  resolved: 'filled',
  completed: 'filled',
};

const NOT_POSTINGS = new Set(['_index.md', 'archive.md', 'how-to-post.md', 'job-form.md']);

function pathsEqualIgnoreCase(a, b) {
  return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}

function renameJobFile(from, to) {
  if (pathsEqualIgnoreCase(from, to)) {
    const temp = path.join(DIR, `.__normalize_${Date.now()}_${Math.random().toString(36).slice(2)}.md`);
    fs.renameSync(from, temp);
    fs.renameSync(temp, to);
    return;
  }
  fs.renameSync(from, to);
}

const statusUpdates = [];
const renames = [];
const badNames = [];

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.md') && !NOT_POSTINGS.has(f))) {
  const full = path.join(DIR, file);
  let text = fs.readFileSync(full, 'utf8');
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) continue;
  const fm = fmMatch[1];

  const cur = scalarFromFm(fm, 'status').toLowerCase();
  if (STATUS_MAP[cur]) {
    const next = STATUS_MAP[cur];
    const replaced = text.replace(/^(status:\s*)(['"]?)\w+\2\s*$/m, `$1${next}`);
    if (replaced !== text) {
      statusUpdates.push(`${file}: ${cur} → ${next}`);
      text = replaced;
    }
  }

  if (!dryRun && !checkOnly && text !== fs.readFileSync(full, 'utf8')) {
    fs.writeFileSync(full, text);
  }

  if (isBadJobFilename(file)) {
    badNames.push(file);
    const target = targetBasename(file, fm);
    if (target && target !== file) {
      const dest = path.join(DIR, target);
      if (fs.existsSync(dest) && !pathsEqualIgnoreCase(full, dest)) {
        renames.push({ label: `${file} → ${target} (blocked: target exists)` });
      } else {
        renames.push({ from: full, to: dest, label: `${file} → ${target}` });
      }
    }
  }
}

if (!dryRun && !checkOnly) {
  for (const { from, to } of renames) {
    if (from && to) renameJobFile(from, to);
  }
}

if (!checkOnly) {
  console.log(`Status updates: ${statusUpdates.length}`);
  statusUpdates.slice(0, 15).forEach((l) => console.log('  ' + l));
  if (statusUpdates.length > 15) console.log(`  ... and ${statusUpdates.length - 15} more`);
  console.log(`Renames: ${renames.length}`);
  renames.forEach((r) => console.log('  ' + r.label));
  if (dryRun) console.log('(dry run — no files changed)');
}

if (checkOnly) {
  let failed = false;
  if (statusUpdates.length) {
    failed = true;
    console.error(`normalize-jobs: ${statusUpdates.length} legacy status value(s) remain`);
    statusUpdates.slice(0, 10).forEach((l) => console.error('  ' + l));
  }
  if (badNames.length) {
    failed = true;
    console.error(`normalize-jobs: ${badNames.length} non-canonical filename(s)`);
    badNames.slice(0, 10).forEach((f) => console.error('  ' + f));
  }
  if (renames.length) {
    failed = true;
    console.error(`normalize-jobs: ${renames.length} filename(s) need renaming`);
    renames.slice(0, 10).forEach((r) => console.error('  ' + r.label));
  }
  if (!failed) console.log('normalize-jobs: ok');
  process.exit(failed ? 1 : 0);
}
