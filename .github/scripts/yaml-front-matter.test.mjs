import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { hasYamlKey, parseFrontMatter, readYamlScalar } from './yaml-front-matter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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
