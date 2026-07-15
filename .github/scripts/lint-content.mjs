#!/usr/bin/env node
/**
 * Content lint for job and event submissions (run by content-lint.yml on PRs).
 *
 *   node .github/scripts/lint-content.mjs content/jobs/2026-07-05-title.md ...
 *
 * Validates the front matter (required fields, status enums, ISO dates) and
 * catches the Markdown pitfalls that have repeatedly broken rendered pages:
 *   - text indented 4+ spaces (renders as a code block),
 *   - `###Heading` without a space (renders as literal text),
 *   - `•` pseudo-bullets instead of Markdown list markers.
 *
 * Errors fail the check; warnings are advisory. Writes a summary table to
 * GITHUB_STEP_SUMMARY when available.
 */

import fs from 'node:fs';

const JOB_STATUSES = ['searching', 'solved', 'closed', 'expired', 'resolved', 'completed', 'filled'];
const EVENT_STATUSES = ['upcoming', 'started', 'past', 'cancelled'];

// Section/utility pages that live in the content folders but aren't postings.
const NOT_POSTINGS = ['_index.md', 'archive.md', 'how-to-post.md', 'job-form.md', 'event-form.md'];

function scalar(fm, key) {
  const m = fm.match(new RegExp('^' + key + ':\\s*(.*)$', 'm'));
  if (!m) return null; // key absent
  let v = m[1].trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}/.test(s) && !isNaN(Date.parse(s.slice(0, 10)));

function lintFile(file) {
  const errors = [];
  const warnings = [];
  const text = fs.readFileSync(file, 'utf8');
  const isJob = file.replace(/\\/g, '/').includes('content/jobs/');

  // ── Front matter ──────────────────────────────────────────────────────────
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fmMatch) {
    errors.push('missing or unterminated front matter block (`---` fences)');
    return { errors, warnings };
  }
  const fm = fmMatch[1];
  const body = text.slice(fmMatch[0].length);

  if (!scalar(fm, 'title')) errors.push('front matter: `title` is required');

  const status = (scalar(fm, 'status') || '').toLowerCase();
  const statuses = isJob ? JOB_STATUSES : EVENT_STATUSES;
  if (!status) {
    errors.push('front matter: `status` is required');
  } else if (!statuses.includes(status)) {
    errors.push(`front matter: status "${status}" is not one of: ${statuses.join(', ')}`);
  }

  // Jobs use strict ISO dates; events historically carry human-readable
  // eventDate strings ("Sat, 30 Jan 2016"), so those are not checked.
  for (const key of isJob ? ['date_posted', 'last_updated', 'deadline'] : []) {
    const v = scalar(fm, key);
    if (v !== null && v !== '' && !isIsoDate(v)) {
      errors.push(`front matter: \`${key}: ${v}\` is not a valid YYYY-MM-DD date`);
    }
  }
  if (isJob && scalar(fm, 'date_posted') === null) {
    errors.push('front matter: `date_posted` is required for jobs');
  }
  if (isJob && scalar(fm, 'compensation') === null) {
    warnings.push('front matter: no `compensation` (paid/gratis) - the posting will show "Unspecified"');
  }
  if (isJob && !/^how_to_apply:/m.test(fm)) {
    warnings.push('front matter: no `how_to_apply` - the page will fall back to "see the description"');
  }

  // Duplicate top-level keys silently override each other.
  const keys = [...fm.matchAll(/^([A-Za-z_][A-Za-z0-9_]*):/gm)].map((m) => m[1]);
  for (const dup of new Set(keys.filter((k, i) => keys.indexOf(k) !== i))) {
    errors.push(`front matter: duplicate key \`${dup}\``);
  }

  // ── Body pitfalls ─────────────────────────────────────────────────────────
  const lines = body.split(/\r?\n/);
  let inFence = false;
  let prevNonEmpty = '';
  const isListItem = (l) => /^\s*([-*+]|\d+[.)])\s/.test(l);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const n = i + 1;
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      prevNonEmpty = line;
      continue;
    }
    if (inFence) continue;

    // 4-space-indented prose renders as a code block. Indentation is fine
    // when it continues a list item (previous non-empty line is a list item
    // or itself indented).
    if (/^ {4,}\S/.test(line) && !isListItem(line)) {
      const prevOk = isListItem(prevNonEmpty) || /^ {2,}\S/.test(prevNonEmpty);
      if (!prevOk) {
        errors.push(`line ${n}: text indented ${line.match(/^ +/)[0].length} spaces renders as a code block - remove the indentation or use a \`- \` list`);
      }
    }
    if (/^#{1,6}[^#\s]/.test(line)) {
      errors.push(`line ${n}: \`${line.slice(0, 20)}…\` - headings need a space after the # marks`);
    }
    if (/^\s*[•·▪]\s/.test(line)) {
      errors.push(`line ${n}: \`•\` pseudo-bullet - use a Markdown \`- \` list marker instead`);
    }
    // goldmark runs with `unsafe: true`, so raw HTML in a posting goes live
    // verbatim. Script-capable tags are an error; other raw tags a warning
    // (some legacy postings legitimately use <br> or <a>).
    const rawTags = [...line.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/g)].map((m) => m[1].toLowerCase());
    for (const tag of rawTags) {
      if (['script', 'iframe', 'object', 'embed', 'form', 'style', 'link', 'meta', 'base'].includes(tag)) {
        errors.push(`line ${n}: raw \`<${tag}>\` HTML is not allowed in postings`);
      } else {
        warnings.push(`line ${n}: raw \`<${tag}>\` HTML - prefer plain Markdown`);
      }
    }
    if (/on[a-z]+\s*=|javascript:/i.test(line) && rawTags.length) {
      errors.push(`line ${n}: inline event handler or javascript: URL in raw HTML`);
    }
    if (line.trim()) prevNonEmpty = line;
  }

  return { errors, warnings };
}

// ── Main ──────────────────────────────────────────────────────────────────

const files = process.argv.slice(2).filter((f) => {
  if (!fs.existsSync(f)) return false;
  const base = f.replace(/\\/g, '/').split('/').pop();
  return !NOT_POSTINGS.includes(base);
});
if (!files.length) {
  console.log('No content files to lint.');
  process.exit(0);
}

let failed = false;
const summary = ['| File | Result |', '| ---- | ------ |'];
for (const file of files) {
  const { errors, warnings } = lintFile(file);
  console.log('\n=== ' + file + ' ===');
  errors.forEach((e) => console.log('  ERROR: ' + e));
  warnings.forEach((w) => console.log('  warn:  ' + w));
  if (!errors.length && !warnings.length) console.log('  ok');
  if (errors.length) failed = true;
  summary.push(
    '| `' + file + '` | ' +
    (errors.length ? '❌ ' + errors.length + ' error(s)' : warnings.length ? '⚠️ ' + warnings.length + ' warning(s)' : '✅ ok') +
    ' |',
  );
}

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## Content lint\n\n' + summary.join('\n') + '\n');
}
process.exit(failed ? 1 : 0);
