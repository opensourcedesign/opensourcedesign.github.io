import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readRecipientFile } from './send-mail.mjs';

test('readRecipientFile reads a valid address from disk', () => {
  const file = path.join(os.tmpdir(), 'osd-mail-to-test.txt');
  fs.writeFileSync(file, 'poster@example.com\n');
  assert.equal(readRecipientFile(file), 'poster@example.com');
  fs.unlinkSync(file);
});

test('readRecipientFile rejects invalid addresses', () => {
  const file = path.join(os.tmpdir(), 'osd-mail-to-invalid.txt');
  fs.writeFileSync(file, 'not-an-email');
  assert.throws(() => readRecipientFile(file), /Invalid recipient/);
  fs.unlinkSync(file);
});
