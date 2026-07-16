#!/usr/bin/env node
/**
 * Run pa11y sequentially with a hard per-URL timeout (used in CI; more reliable
 * than pa11y-ci with parallel Chrome tabs on GitHub Actions).
 *
 *   node .github/scripts/run-pa11y-batch.mjs [.pa11yci.generated.json]
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
const configPath = path.join(ROOT, process.argv[2] || '.pa11yci.generated.json');
const outPath = path.join(ROOT, 'pa11y-results.txt');
const summaryPath = path.join(ROOT, 'pa11y-summary.json');
const timeoutMs = Number(process.env.PA11Y_URL_TIMEOUT || 45000);
const startFrom = Number(process.env.PA11Y_START_FROM || 0);

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const urls = config.urls;
const standard = config.defaults?.standard || 'WCAG2AA';
const pa11yDefaultsPath = path.join(os.tmpdir(), 'osd-pa11y-defaults.json');
fs.writeFileSync(
  pa11yDefaultsPath,
  JSON.stringify({
    standard,
    timeout: config.defaults?.timeout || 30000,
    chromeLaunchConfig: config.defaults?.chromeLaunchConfig || {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  }),
);

const summary = {
  total: urls.length,
  passed: 0,
  failed: 0,
  errors: 0,
  skipped: 0,
  failures: [],
  pagesWithErrors: [],
};

function runPa11y(url) {
  return new Promise((resolve) => {
    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['pa11y', url, '--config', pa11yDefaultsPath],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' },
    );

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ status: 'timeout', stdout, stderr });
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ status: 'ok', stdout, stderr });
      else if (code === 2) resolve({ status: 'issues', stdout, stderr });
      else resolve({ status: 'error', code, stdout, stderr });
    });
  });
}

function countIssues(stdout) {
  const m = stdout.match(/(\d+) errors?/i);
  return m ? Number(m[1]) : 0;
}

fs.writeFileSync(outPath, `Running Pa11y on ${urls.length} URLs (sequential, ${timeoutMs}ms timeout)\n`);

for (let i = startFrom; i < urls.length; i++) {
  const url = urls[i];
  const linePrefix = `[${i + 1}/${urls.length}]`;
  process.stdout.write(`${linePrefix} ${url} ... `);

  const result = await runPa11y(url);
  let line;

  if (result.status === 'ok') {
    summary.passed++;
    line = ` > ${url} - 0 errors`;
    console.log('0 errors');
  } else if (result.status === 'issues') {
    const n = countIssues(result.stdout + result.stderr);
    summary.errors += n;
    summary.pagesWithErrors.push({ url, errors: n });
    line = ` > ${url} - ${n} errors`;
    console.log(`${n} errors`);
    const detail = (result.stdout + result.stderr).trim();
    if (detail) console.log(detail);
  } else if (result.status === 'timeout') {
    summary.failed++;
    summary.failures.push({ url, reason: 'timeout' });
    line = ` > ${url} - Failed to run (timeout)`;
    console.log('timeout');
  } else {
    summary.failed++;
    summary.failures.push({ url, reason: `exit ${result.code}`, detail: (result.stderr || result.stdout).slice(0, 500) });
    line = ` > ${url} - Failed to run`;
    console.log('failed');
  }

  fs.appendFileSync(outPath, line + '\n');
  if ((i + 1) % 25 === 0) {
    fs.writeFileSync(summaryPath, JSON.stringify({ ...summary, completed: i + 1 }, null, 2));
  }
}

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
const footer = `\nDone: ${summary.passed} passed, ${summary.pagesWithErrors.length} with a11y issues, ${summary.failed} failed to run\n`;
fs.appendFileSync(outPath, footer);
console.log(footer.trim());

if (summary.failed > 0) process.exit(1);
if (summary.pagesWithErrors.length > 0) process.exit(2);
