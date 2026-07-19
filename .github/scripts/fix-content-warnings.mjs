#!/usr/bin/env node
/**
 * Fix common content-lint warnings in job/event markdown.
 * Run: node .github/scripts/fix-content-warnings.mjs [--write]
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const NOT_POSTINGS = new Set(['_index.md', 'archive.md', 'how-to-post.md', 'job-form.md', 'event-form.md']);

function listMarkdown(dir) {
  return fs
    .readdirSync(path.join(ROOT, dir))
    .filter((f) => f.endsWith('.md') && !NOT_POSTINGS.has(f))
    .map((f) => path.join(dir, f).replace(/\\/g, '/'));
}

function stripYaml(v) {
  if (!v) return '';
  v = v.trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

function inferHowToApply(fm, body) {
  if (/^how_to_apply:/m.test(fm)) return null;

  const contact = stripYaml(fm.match(/^contact:\s*(.+)$/m)?.[1]);
  if (contact && contact !== '(optional)') {
    if (contact.includes('@')) return `Contact ${contact}`;
    const github = stripYaml(fm.match(/^github:\s*(.+)$/m)?.[1]);
    if (github) return `Contact via GitHub (${github}) — ${contact}`;
    return `Contact ${contact}`;
  }

  const patterns = [
    [/To apply,?\s+please visit\s+(https?:\/\/\S+)/i, (m) => `Apply at ${m[1].replace(/[.,)]+$/, '')}`],
    [/Please get in touch by emailing\s+(\S+)/i, (m) => `Email ${m[1].replace(/[.,)]+$/, '')}`],
    [/Interested\?\s*Contact me at\s+(\S+@\S+)/i, (m) => `Contact ${m[1]}`],
    [/contact us via email:\s*\[[^\]]+\]\(mailto:([^)]+)\)/i, (m) => `Email ${m[1]}`],
    [/Send your[\s\S]{0,160}?to:\s*[`']?([^`'\n]+?)[`']?(?:\s*$|\s*\n)/im, (m) => `Contact ${m[1].trim()}`],
    [/logging an \[issue on GitHub\]\((https:\/\/github\.com[^)]+)\)/i, (m) => `Open a GitHub issue at ${m[1]}`],
    [/issue on GitHub\]\((https:\/\/github\.com[^)]+)\)/i, (m) => `Open a GitHub issue at ${m[1]}`],
    [/submit a pull request/i, () => 'Submit a pull request on GitHub (see description)'],
  ];
  for (const [re, fn] of patterns) {
    const m = body.match(re);
    if (m) return fn(m);
  }

  const github = stripYaml(fm.match(/^github:\s*(.+)$/m)?.[1]);
  if (github) return `See the GitHub repository (${github}) or description below`;

  const orgUrl = stripYaml(fm.match(/^org_url:\s*(.+)$/m)?.[1]);
  if (orgUrl) return `See ${orgUrl} or the description below`;

  return 'See the description below';
}

function fixBody(body) {
  let out = body;
  let changed = false;

  const apply = (re, repl) => {
    const next = out.replace(re, (...args) => {
      changed = true;
      return typeof repl === 'function' ? repl(...args) : repl;
    });
    out = next;
  };

  apply(/<((?:https?|mailto):\/\/[^>\s]+)>/g, (_, url) => `[${url}](${url})`);
  apply(/<a\s+name="[^"]*"\s*><\/a>\s*\n?/gi, '');
  apply(/<del>([\s\S]*?)<\/del>/gi, (_, text) => `~~${text}~~`);
  apply(/<br\s*\/?>\s*/gi, '\n');
  apply(/<a\s+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, (_, href, text) => `[${text}](${href})`);
  apply(/<this things\.\.\.>/g, 'these ingredients...');
  apply(
    /<p[^>]*>\s*<img\s+src="([^"]+)"\s+alt="([^"]*)"\s*>\s*<\/p>/gis,
    (_, src, alt) => `\n\n![${alt || 'image'}](${src})\n\n`,
  );

  return { body: out, changed };
}

function fixFrontMatter(fm, body, isJob) {
  let out = fm;
  let changed = false;

  if (!isJob) return { fm: out, changed };

  const howTo = inferHowToApply(fm, body);
  if (howTo) {
    out = out.trimEnd() + `\nhow_to_apply: ${howTo}`;
    changed = true;
  }

  return { fm: out, changed };
}

function processFile(file) {
  const abs = path.join(ROOT, file);
  const text = fs.readFileSync(abs, 'utf8');
  const isJob = file.includes('content/jobs/');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { file, changed: false };

  const bodyFix = fixBody(m[2]);
  const fmFix = fixFrontMatter(m[1], bodyFix.body, isJob);

  if (!fmFix.changed && !bodyFix.changed) {
    return { file, changed: false };
  }

  const next = `---\n${fmFix.fm}\n---\n${bodyFix.body}`;
  if (WRITE) fs.writeFileSync(abs, next);
  return { file, changed: true, fm: fmFix.changed, body: bodyFix.changed };
}

const files = [...listMarkdown('content/jobs'), ...listMarkdown('content/events')];
const results = files.map(processFile).filter((r) => r.changed);

console.log(WRITE ? 'Wrote' : 'Would update', results.length, 'file(s)');
for (const r of results) {
  console.log(`  ${r.file}${r.fm ? ' (+how_to_apply)' : ''}${r.body ? ' (+body)' : ''}`);
}
