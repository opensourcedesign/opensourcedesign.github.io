/**
 * Fetch moderator feedback from a closed submission PR for the rejection email.
 *
 * Env: GITHUB_TOKEN, REPO (owner/name), PR_NUMBER, HEAD_REF, PR_AUTHOR.
 * Writes to $GITHUB_OUTPUT: pr_url, form_url, feedback_plain, feedback_html_block.
 */

import fs from 'node:fs';

const SITE = process.env.SITE || 'https://opensourcedesign.net';
const { GITHUB_TOKEN, REPO, PR_NUMBER, HEAD_REF, PR_AUTHOR } = process.env;

function formUrl(ref) {
  if (ref.startsWith('event')) return `${SITE}/events/event-form/`;
  if (ref.startsWith('resource')) return `${SITE}/resources/suggest/`;
  return `${SITE}/jobs/job-form/`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plainFromMarkdown(body) {
  return String(body || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function writeOutput(entries) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    console.log(entries);
    return;
  }
  let chunk = '';
  for (const [key, value] of Object.entries(entries)) {
    const s = String(value);
    if (/[\r\n%=]/.test(s) || s.length > 200) {
      const delim = `EOF_${key}`;
      chunk += `${key}<<${delim}\n${s}\n${delim}\n`;
    } else {
      chunk += `${key}=${s}\n`;
    }
  }
  fs.appendFileSync(outputPath, chunk);
}

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${GITHUB_TOKEN}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${path} -> ${res.status}`);
  return res.json();
}

async function main() {
  const prUrl = `https://github.com/${REPO}/pull/${PR_NUMBER}`;
  const form = formUrl(HEAD_REF || '');

  let feedback = '';
  try {
    const comments = await api(`/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`);
    const author = (PR_AUTHOR || '').toLowerCase();
    const moderator = [...comments]
      .reverse()
      .find((c) => c.user && c.user.login && c.user.login.toLowerCase() !== author && c.body && c.body.trim());
    if (moderator) feedback = plainFromMarkdown(moderator.body).slice(0, 2000);
  } catch (e) {
    // Non-fatal: email still sends without an excerpt.
  }

  const feedbackPlain = feedback
    ? `Moderator note:\n\n${feedback}\n`
    : 'See the pull request for any comments from the moderation team.\n';

  const feedbackHtmlBlock = feedback
    ? `<blockquote style="margin:20px 0;padding:16px 20px;border-left:4px solid #cbd5e1;background:#f8fafc;font-size:14px;line-height:1.6;color:#475569;">${escapeHtml(feedback).replace(/\n/g, '<br />')}</blockquote>`
    : '<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">See the pull request for any comments from the moderation team.</p>';

  writeOutput({
    pr_url: prUrl,
    form_url: form,
    feedback_plain: feedbackPlain,
    feedback_html_block: feedbackHtmlBlock,
  });
}

main().catch(() => {
  writeOutput({
    pr_url: `https://github.com/${REPO}/pull/${PR_NUMBER}`,
    form_url: formUrl(HEAD_REF || ''),
    feedback_plain: 'See the pull request for any comments from the moderation team.\n',
    feedback_html_block: '<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">See the pull request for any comments from the moderation team.</p>',
  });
});
