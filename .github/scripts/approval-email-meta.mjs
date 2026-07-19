/**
 * Submission-specific copy for the approval email workflow.
 *
 * Env: HEAD_REF
 * Writes: submission_label, view_cta, board_name, board_url
 */

import fs from 'node:fs';
import { submissionMeta } from './submission-meta.mjs';

const { HEAD_REF } = process.env;

function writeOutput(entries) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    console.log(entries);
    return;
  }
  let chunk = '';
  for (const [key, value] of Object.entries(entries)) {
    chunk += `${key}=${String(value)}\n`;
  }
  fs.appendFileSync(outputPath, chunk);
}

const meta = submissionMeta(HEAD_REF || '');
writeOutput({
  submission_label: meta.label,
  view_cta: meta.viewCta,
  board_name: meta.boardName,
  board_url: meta.boardUrl,
});
