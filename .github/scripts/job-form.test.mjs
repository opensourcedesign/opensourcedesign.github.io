import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const form = fs.readFileSync(path.join(ROOT, 'layouts/jobs/job-form.html'), 'utf8');

function fieldHelp(name) {
  const match = form.match(new RegExp(`<label[^>]+for="${name}"[\\s\\S]*?<textarea[^>]+name="${name}"`));
  return match ? match[0] : '';
}

test('job description and deliverables state their Markdown support', () => {
  assert.match(fieldHelp('description'), /Markdown is supported\./);
  assert.match(fieldHelp('deliverables'), /Markdown is supported\./);
});
