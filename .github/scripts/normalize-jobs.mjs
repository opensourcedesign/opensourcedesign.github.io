#!/usr/bin/env node
/**
 * Normalize job posting files:
 *   - status: solved/resolved/completed → filled
 *   - filenames: spaces/uppercase/empty slugs → date-slug.md
 *
 *   node .github/scripts/normalize-jobs.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'content/jobs');
const dryRun = process.argv.includes('--dry-run');

const STATUS_MAP = {
  solved: 'filled',
  resolved: 'filled',
  completed: 'filled',
};

function scalar(fm, key) {
  const m = fm.match(new RegExp('^' + key + ':\\s*(.*)$', 'm'));
  if (!m) return '';
  let v = m[1].trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function isBadFilename(name) {
  if (name === '-.md') return true;
  if (/-\.md$/.test(name)) return true;
  if (/[A-Z]/.test(name)) return true;
  if (/\s/.test(name)) return true;
  return false;
}

function targetBasename(file, fm) {
  const slug = scalar(fm, 'slug') || slugify(scalar(fm, 'title'));
  if (!slug) return null;
  const posted = scalar(fm, 'date_posted') || scalar(fm, 'date').slice(0, 10);
  const prefixMatch = file.match(/^(\d{4}(?:-\d{2}){0,2})/);
  const datePart = (posted && /^\d{4}-\d{2}-\d{2}/.test(posted) ? posted.slice(0, 10) : prefixMatch?.[1]) || '';
  if (!datePart) return `${slug}.md`;
  return `${datePart}-${slug}.md`;
}

const statusUpdates = [];
const renames = [];

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const full = path.join(DIR, file);
  let text = fs.readFileSync(full, 'utf8');
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) continue;
  const fm = fmMatch[1];

  const cur = scalar(fm, 'status').toLowerCase();
  if (STATUS_MAP[cur]) {
    const next = STATUS_MAP[cur];
    const replaced = text.replace(/^(status:\s*)(['"]?)\w+\2\s*$/m, `$1${next}`);
    if (replaced !== text) {
      statusUpdates.push(`${file}: ${cur} → ${next}`);
      text = replaced;
    }
  }

  if (!dryRun) fs.writeFileSync(full, text);
  else if (STATUS_MAP[cur]) {
    // counted above
  }

  if (isBadFilename(file)) {
    const target = targetBasename(file, fmMatch[1]);
    if (target && target !== file) {
      const dest = path.join(DIR, target);
      if (fs.existsSync(dest) && path.resolve(dest) !== path.resolve(full)) {
        console.warn(`skip rename ${file} → ${target} (exists)`);
      } else {
        renames.push({ from: full, to: dest, label: `${file} → ${target}` });
      }
    }
  }
}

if (!dryRun) {
  for (const { from, to } of renames) {
    fs.renameSync(from, to);
  }
}

console.log(`Status updates: ${statusUpdates.length}`);
statusUpdates.slice(0, 15).forEach((l) => console.log('  ' + l));
if (statusUpdates.length > 15) console.log(`  ... and ${statusUpdates.length - 15} more`);

console.log(`Renames: ${renames.length}`);
renames.forEach((r) => console.log('  ' + r.label));
if (dryRun) console.log('(dry run — no files changed)');
