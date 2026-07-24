#!/usr/bin/env node
/**
 * Copy assets/js/yaml-front-matter.js into the submission Worker bundle.
 *
 *   node .github/scripts/sync-worker-yaml-front-matter.mjs          # write
 *   node .github/scripts/sync-worker-yaml-front-matter.mjs --check  # CI
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ASSETS = path.join(ROOT, 'assets/js/yaml-front-matter.js');
const WORKER = path.join(ROOT, 'workers/job-submit/src/yaml-front-matter.js');
const HEADER = `/**
 * Minimal front-matter reader for job/event Markdown files.
 * Handles quoted scalars and folded (>) / literal (|) block scalars used in content/.
 *
 * Keep in sync with assets/js/yaml-front-matter.js (sync-worker-yaml-front-matter.mjs).
 */

`;

function workerBodyFromAssets() {
  const assets = fs.readFileSync(ASSETS, 'utf8').replace(/\r\n/g, '\n');
  const body = assets.replace(/^\/\*\*[\s\S]*?\*\/\s*\n?/, '');
  return HEADER + body;
}

const checkOnly = process.argv.includes('--check');
const expected = workerBodyFromAssets();

if (checkOnly) {
  if (!fs.existsSync(WORKER)) {
    console.error('sync-worker-yaml-front-matter: missing worker copy — run sync script');
    process.exit(1);
  }
  const actual = fs.readFileSync(WORKER, 'utf8').replace(/\r\n/g, '\n');
  if (actual !== expected) {
    console.error('sync-worker-yaml-front-matter: worker copy is stale — run node .github/scripts/sync-worker-yaml-front-matter.mjs');
    process.exit(1);
  }
  console.log('sync-worker-yaml-front-matter: ok');
} else {
  fs.writeFileSync(WORKER, expected);
  console.log('synced workers/job-submit/src/yaml-front-matter.js');
}
