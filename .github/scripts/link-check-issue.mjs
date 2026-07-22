#!/usr/bin/env node
/**
 * Open or update the standing broken-links issue from a Lychee JSON report.
 * Renders links as GitHub task-list checkboxes. Maintainers can check items off
 * manually; the next run auto-checks links that no longer fail.
 *
 * Env: GITHUB_TOKEN, GITHUB_REPOSITORY, LYCHEE_JSON (default lychee-results.json)
 */
import fs from 'node:fs';
import { gh, ghPaginated } from './github-api.mjs';

const TRACKER = '<!-- link-check-tracker -->';
const DATA_PREFIX = '<!-- link-check-data:';
const DATA_SUFFIX = ' -->';
const ISSUE_TITLE = 'Broken links monitor';
const ISSUE_LABELS = ['link-check', 'maintenance'];
const CHECKBOX_RE =
  /^- \[([ xX])\] `([^`]+)`(?: \(([^)]*)\))? — ([^\n·]+?)(?: · ([^\n]+))?$/;

const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
const jsonPath = process.env.LYCHEE_JSON || 'lychee-results.json';

function linkKey(source, url) {
  return source + '\t' + url;
}

function parseFailMap(report) {
  const items = [];
  const failMap = report?.fail_map || {};
  for (const [source, entries] of Object.entries(failMap)) {
    for (const entry of entries || []) {
      const url = entry?.url;
      if (!url) continue;
      const status =
        typeof entry.status === 'string'
          ? entry.status
          : entry.status?.text || entry.status?.details || 'Failed';
      items.push({ source: source.trim(), url, status, key: linkKey(source, url) });
    }
  }
  items.sort((a, b) => a.key.localeCompare(b.key));
  return items;
}

function encodeState(items) {
  const payload = items.map(({ source, url, status }) => ({ source, url, status }));
  return DATA_PREFIX + Buffer.from(JSON.stringify(payload), 'utf8').toString('base64') + DATA_SUFFIX;
}

function decodeState(body) {
  const start = body.indexOf(DATA_PREFIX);
  if (start === -1) return [];
  const end = body.indexOf(DATA_SUFFIX, start);
  if (end === -1) return [];
  const encoded = body.slice(start + DATA_PREFIX.length, end);
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseTaskList(body) {
  const items = new Map();
  for (const line of (body || '').split('\n')) {
    const match = line.trim().match(CHECKBOX_RE);
    if (!match) continue;
    const source = match[4].trim();
    const url = match[2].trim();
    items.set(linkKey(source, url), {
      checked: match[1].toLowerCase() === 'x',
      url,
      source,
      status: match[3]?.trim() || '',
      note: match[5]?.trim() || '',
    });
  }
  return items;
}

function renderCheckbox(item) {
  const mark = item.checked ? 'x' : ' ';
  const statusPart = item.status && !item.checked ? ` (${item.status})` : '';
  const notePart = item.note ? ` · ${item.note}` : '';
  return `- [${mark}] \`${item.url}\`${statusPart} — ${item.source}${notePart}`;
}

function renderCheckboxList(items) {
  if (!items.length) return '_None._\n';
  return items.map(renderCheckbox).join('\n') + '\n';
}

function buildChecklist(existingBody, previousState, current, checkedAt) {
  const fromBody = parseTaskList(existingBody);
  const currentByKey = new Map(current.map((item) => [item.key, item]));
  const previousByKey = new Map(
    previousState.map((item) => [linkKey(item.source, item.url), item]),
  );
  const allKeys = new Set([
    ...currentByKey.keys(),
    ...previousByKey.keys(),
    ...fromBody.keys(),
  ]);

  const open = [];
  const resolved = [];

  for (const key of [...allKeys].sort()) {
    const curr = currentByKey.get(key);
    const prev = previousByKey.get(key);
    const bodyItem = fromBody.get(key);
    const url = curr?.url || prev?.url || bodyItem?.url;
    const source = curr?.source || prev?.source || bodyItem?.source;
    if (!url || !source) continue;

    const stillBroken = currentByKey.has(key);
    const wasTracked = previousByKey.has(key) || fromBody.has(key);
    const manuallyChecked = bodyItem?.checked === true;

    if (stillBroken && manuallyChecked) {
      resolved.push({
        key,
        url,
        source,
        status: curr?.status || bodyItem?.status || '',
        checked: true,
        note: 'manually marked resolved',
      });
      continue;
    }

    if (stillBroken) {
      open.push({
        key,
        url,
        source,
        status: curr?.status || '',
        checked: false,
        note: '',
      });
      continue;
    }

    if (wasTracked) {
      resolved.push({
        key,
        url,
        source,
        status: prev?.status || bodyItem?.status || '',
        checked: true,
        note: `auto-resolved ${checkedAt}`,
      });
    }
  }

  return { open, resolved };
}

function renderIssueBody(open, resolved, machineState, checkedAt) {
  return `${TRACKER}
${encodeState(machineState)}

# ${ISSUE_TITLE}

Scheduled link checks keep this checklist up to date.

- Unchecked items are **still broken** in the latest scan.
- Check an item manually if you have fixed it (or want to ignore it) before the next run.
- The next run **auto-checks** links that no longer fail.

**Last check:** ${checkedAt}  
**Open:** ${open.length} · **Resolved:** ${resolved.length}

## Open broken links (${open.length})

${renderCheckboxList(open)}

## Resolved (${resolved.length})

${resolved.length ? `<details>\n<summary>Show resolved links</summary>\n\n${renderCheckboxList(resolved)}\n</details>\n` : '_None yet._\n'}
`;
}

function diffLinks(previous, current) {
  const prevKeys = new Set(previous.map((item) => linkKey(item.source, item.url)));
  const currKeys = new Set(current.map((item) => item.key));
  const newlyBroken = current.filter((item) => !prevKeys.has(item.key));
  const newlyFixed = previous.filter((item) => !currKeys.has(linkKey(item.source, item.url)));
  return { newlyBroken, newlyFixed };
}

async function findTrackerIssue() {
  const issues = await ghPaginated(
    '/repos/' + owner + '/' + repo + '/issues?state=all&labels=' + encodeURIComponent(ISSUE_LABELS[0]),
  );
  const contentIssues = issues.filter((issue) => !issue.pull_request);
  const withMarker = contentIssues.find((issue) => issue.body?.includes(TRACKER));
  if (withMarker) return withMarker;
  return contentIssues.find((issue) => issue.state === 'open') || null;
}

async function createComment(issueNumber, body) {
  await gh('/repos/' + owner + '/' + repo + '/issues/' + issueNumber + '/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
}

async function updateIssue(issueNumber, body, state) {
  await gh('/repos/' + owner + '/' + repo + '/issues/' + issueNumber, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, state }),
  });
}

async function createIssue(body) {
  const issue = await gh('/repos/' + owner + '/' + repo + '/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: ISSUE_TITLE,
      body,
      labels: ISSUE_LABELS,
    }),
  });
  return issue;
}

async function main() {
  if (!owner || !repo) throw new Error('GITHUB_REPOSITORY is required');
  if (!fs.existsSync(jsonPath)) throw new Error('Missing Lychee report: ' + jsonPath);

  const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const current = parseFailMap(report);
  const existing = await findTrackerIssue();
  const checkedAt = new Date().toISOString().slice(0, 10);

  if (!existing) {
    if (!current.length) {
      console.log('No broken links and no tracker issue; nothing to do.');
      return;
    }
    const { open, resolved } = buildChecklist('', [], current, checkedAt);
    const body = renderIssueBody(open, resolved, current, checkedAt);
    const issue = await createIssue(body);
    console.log('Created issue #' + issue.number + ' with ' + open.length + ' broken link(s).');
    return;
  }

  const previous = decodeState(existing.body || '');
  const { newlyBroken, newlyFixed } = diffLinks(previous, current);
  const { open, resolved } = buildChecklist(existing.body || '', previous, current, checkedAt);
  const body = renderIssueBody(open, resolved, current, checkedAt);
  const shouldReopen = existing.state === 'closed' && open.length > 0;
  const shouldClose = existing.state === 'open' && !open.length;

  if (shouldReopen) {
    await updateIssue(existing.number, body, 'open');
    await createComment(
      existing.number,
      `## Reopened (${checkedAt})\n\n${open.length} broken link(s) need attention.\n\n${renderCheckboxList(newlyBroken.length ? newlyBroken : open)}`,
    );
    console.log('Reopened issue #' + existing.number + '.');
    return;
  }

  await updateIssue(existing.number, body, shouldClose ? 'closed' : 'open');

  if (newlyBroken.length) {
    await createComment(
      existing.number,
      `## Newly broken (${checkedAt})\n\n${renderCheckboxList(
        newlyBroken.map((item) => ({ ...item, checked: false, note: '' })),
      )}`,
    );
    console.log('Commented on #' + existing.number + ': ' + newlyBroken.length + ' new broken link(s).');
  }

  if (newlyFixed.length) {
    await createComment(
      existing.number,
      `## Auto-resolved (${checkedAt})\n\n${renderCheckboxList(
        newlyFixed.map((item) => ({
          ...item,
          key: linkKey(item.source, item.url),
          checked: true,
          note: `auto-resolved ${checkedAt}`,
        })),
      )}`,
    );
    console.log('Commented on #' + existing.number + ': ' + newlyFixed.length + ' fixed link(s).');
  }

  if (shouldClose) {
    await createComment(
      existing.number,
      `## All clear (${checkedAt})\n\nNo open broken links remain. Closing this issue.`,
    );
    console.log('Closed issue #' + existing.number + ' (no broken links).');
    return;
  }

  if (!newlyBroken.length && !newlyFixed.length) {
    console.log('No link changes since last check; updated checklist only.');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
