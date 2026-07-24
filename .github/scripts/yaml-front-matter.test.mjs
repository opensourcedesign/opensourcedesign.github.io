import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { hasYamlKey, parseFrontMatter, readYamlScalar } from './yaml-front-matter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function normalizeModule(content) {
  return content.replace(/\r\n/g, '\n').replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '');
}

function sha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

test('worker yaml-front-matter.js stays in sync with assets/js copy', () => {
  const assets = fs.readFileSync(path.join(ROOT, 'assets/js/yaml-front-matter.js'), 'utf8');
  const worker = fs.readFileSync(path.join(ROOT, 'workers/job-submit/src/yaml-front-matter.js'), 'utf8');
  assert.equal(sha256(normalizeModule(assets)), sha256(normalizeModule(worker)));
});

test('readYamlScalar parses folded block scalars (title: >-)', () => {
  const fm = [
    'status: searching',
    'title: >-',
    '  UX support/input working with disabled people to help design the next version',
    '  of the fastest text entry system',
    'organization: Dasher',
  ].join('\n');
  const title = readYamlScalar(fm, 'title');
  assert.equal(title, 'UX support/input working with disabled people to help design the next version of the fastest text entry system');
  assert.notEqual(title, '>-');
});

test('parseFrontMatter reads real job file with folded title', () => {
  const file = path.join(
    ROOT,
    'content/jobs/2026-06-17-ux-support-input-working-with-disabled-people-to-help-design-the-next-version-of-the-fastest-text-entry-system.md',
  );
  const parsed = parseFrontMatter(fs.readFileSync(file, 'utf8'));
  assert.ok(parsed);
  assert.match(parsed.scalar('title'), /fastest text entry system/);
  assert.equal(parsed.scalar('organization'), 'Dasher');
  assert.ok(parsed.list('how_to_apply').length >= 1);
});

test('hasYamlKey distinguishes missing keys from empty values', () => {
  const fm = 'title: ""\nstatus: searching';
  assert.equal(hasYamlKey(fm, 'title'), true);
  assert.equal(hasYamlKey(fm, 'date_posted'), false);
});

test('readYamlBlock keeps literal blocks after blank lines', () => {
  const file = path.join(
    ROOT,
    'content/jobs/2026-06-05-ui-ux-redesign-for-therapy-worker-cooperative-webpage.md',
  );
  const parsed = parseFrontMatter(fs.readFileSync(file, 'utf8'));
  assert.ok(parsed);
  const deliverables = parsed.block('deliverables');
  assert.match(deliverables, /add profile cards/);
  assert.match(deliverables, /fix the faulty logo/);
});

test('worker yaml-front-matter.js parses deliverables blocks', async () => {
  const file = path.join(
    ROOT,
    'content/jobs/2026-06-05-ui-ux-redesign-for-therapy-worker-cooperative-webpage.md',
  );
  const { parseFrontMatter: workerParse } = await import(
    '../../workers/job-submit/src/yaml-front-matter.js'
  );
  const deliverables = workerParse(fs.readFileSync(file, 'utf8')).block('deliverables');
  assert.match(deliverables, /fix the faulty logo/);
});
