#!/usr/bin/env node
/**
 * Apply Hugo aliases for renamed job files (see data/job-redirect-aliases.yaml).
 *
 *   node .github/scripts/job-redirect-aliases.mjs --apply
 *   node .github/scripts/job-redirect-aliases.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'data/job-redirect-aliases.yaml');
const JOBS = path.join(ROOT, 'content/jobs');
const apply = process.argv.includes('--apply');
const checkOnly = process.argv.includes('--check');

function loadEntries(text) {
  const entries = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('  - file: ')) {
      current = { file: line.slice('  - file: '.length).trim(), aliases: [] };
      entries.push(current);
    } else if (line.startsWith('      - ') && current) {
      current.aliases.push(line.slice('      - '.length).trim());
    }
  }
  return entries;
}

if (!fs.existsSync(DATA)) {
  console.error(`missing ${DATA}`);
  process.exit(1);
}

const entries = loadEntries(fs.readFileSync(DATA, 'utf8'));

function parseAliases(fm) {
  const m = fm.match(/^aliases:\s*\n((?:\s+-\s+.+\n?)*)/m);
  if (!m) return [];
  return [...m[1].matchAll(/^\s+-\s+(.+)$/gm)].map((x) => x[1].trim());
}

function mergeAliases(text, needed) {
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return { text, added: [] };
  const fm = fmMatch[1];
  const existing = parseAliases(fm);
  const missing = needed.filter((a) => !existing.includes(a));
  if (!missing.length) return { text, added: [] };

  let newFm;
  if (/^aliases:/m.test(fm)) {
    newFm = fm.replace(/^(aliases:\s*\n(?:\s+-\s+.+\n?)*)/m, (block) => {
      return block.trimEnd() + '\n' + missing.map((a) => `  - ${a}`).join('\n') + '\n';
    });
  } else {
    newFm = fm.trimEnd() + '\naliases:\n' + missing.map((a) => `  - ${a}`).join('\n') + '\n';
  }
  return {
    text: text.replace(fmMatch[1], newFm),
    added: missing,
  };
}

let failed = false;
let applied = 0;

for (const row of entries) {
  if (!row?.file || !Array.isArray(row.aliases)) {
    console.error('invalid row:', row);
    failed = true;
    continue;
  }
  const filePath = path.join(JOBS, row.file);
  if (!fs.existsSync(filePath)) {
    console.error(`missing job file: ${row.file}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const { text: next, added } = mergeAliases(text, row.aliases);
  if (added.length) {
    if (apply) {
      fs.writeFileSync(filePath, next);
      applied += added.length;
      console.log(`${row.file}: +${added.length} alias(es)`);
    } else if (checkOnly) {
      console.error(`${row.file}: missing alias(es): ${added.join(', ')}`);
      failed = true;
    }
  }
}

if (checkOnly) {
  if (failed) process.exit(1);
  console.log('job-redirect-aliases: ok');
} else if (apply) {
  console.log(`Applied ${applied} alias(es).`);
} else {
  console.log('Pass --apply or --check');
  process.exit(1);
}
