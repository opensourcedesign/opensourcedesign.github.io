/**
 * One-time front matter normalization for legacy job and event files
 * (2015-2023 corpus imported from the old jobs repo). Fixes, per file:
 *
 *   jobs:   status resolved/completed -> solved (canonical enum)
 *           tags scalar               -> one-item flow list
 *           empty keys / `- ''` items -> removed
 *   events: categories space/comma scalar -> YAML list (matching what the
 *           submission worker writes for new events)
 *
 * Content bodies are untouched; only specific front matter lines change.
 * Run with --dry to preview. Safe to re-run (idempotent).
 */

import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const SKIP = new Set(['_index.md', 'job-form.md', 'archive.md', 'how-to-post.md', 'submit.md', 'event-form.md', '-.md']);

// Keys that are pure noise when they have no value (all consumers treat a
// missing key and an empty key identically).
const DROPPABLE_EMPTY = new Set(['description', 'how_to_apply', 'contributing_md', 'contributors_md', 'organization', 'github', 'tags']);

const yq = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

function unquote(v) {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function migrate(file, isEvent) {
  const raw = fs.readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const m = raw.match(/^---\r?\n([\s\S]*?)(\r?\n)---/);
  if (!m) return null;
  const fmStart = m[0].indexOf(m[1]);
  const fmEnd = fmStart + m[1].length;
  const lines = m[1].split(/\r?\n/);
  const out = [];
  const changes = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] || '';

    // Stray empty list items ("- ''" / '- ""').
    if (/^\s*-\s*(''|"")\s*$/.test(line)) {
      changes.push("drop - ''");
      continue;
    }

    const kv = line.match(/^([\w_]+):[ \t]*(.*)$/);
    if (kv) {
      const [, key, val] = kv;

      // Empty scalar keys ("key:", "key: ''", 'key: ""') with no
      // list/block continuation.
      if ((val === '' || val === "''" || val === '""') && DROPPABLE_EMPTY.has(key) && !/^\s+(- |\S)/.test(next)) {
        changes.push(`drop empty ${key}`);
        continue;
      }

      if (!isEvent && key === 'status') {
        const v = unquote(val).toLowerCase();
        if (v === 'resolved' || v === 'completed') {
          out.push('status: solved');
          changes.push(`status ${v} -> solved`);
          continue;
        }
      }

      if (!isEvent && key === 'tags' && val && !val.startsWith('[')) {
        const v = unquote(val);
        if (v && !/[,\s]/.test(v)) {
          out.push(`tags: [${yq(v)}]`);
          changes.push('tags scalar -> list');
          continue;
        }
      }

      // Block list (not flow) to match what the submission worker writes and
      // what its parseFrontMatter().list() can read back on edits.
      if (isEvent && key === 'categories' && val && !val.startsWith('[')) {
        const cats = unquote(val).split(/[,\s]+/).filter(Boolean);
        if (cats.length) {
          out.push('categories:');
          for (const c of cats) out.push('  - ' + yq(c));
          changes.push(`categories scalar -> list (${cats.length})`);
          continue;
        }
      }
    }

    out.push(line);
  }

  if (!changes.length) return null;
  const newFm = out.join(eol);
  const updated = raw.slice(0, fmStart) + newFm + raw.slice(fmEnd);
  if (!DRY) fs.writeFileSync(file, updated);
  return changes;
}

let filesChanged = 0;
const tally = {};
for (const sec of ['jobs', 'events']) {
  const dir = `content/${sec}`;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md') && !SKIP.has(x))) {
    const changes = migrate(path.join(dir, f), sec === 'events');
    if (!changes) continue;
    filesChanged++;
    for (const c of changes) tally[c.replace(/ \(\d+\)$/, '')] = (tally[c.replace(/ \(\d+\)$/, '')] || 0) + 1;
  }
}
console.log(`${DRY ? '[dry run] ' : ''}files changed: ${filesChanged}`);
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(5), k);
