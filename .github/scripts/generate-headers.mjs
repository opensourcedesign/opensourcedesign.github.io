#!/usr/bin/env node
/**
 * Generate static/_headers from hugo.toml worker endpoints.
 * Keeps CSP connect-src in sync with layouts/partials/csp.html for hosts
 * that honour _headers (Cloudflare Pages). Run before Hugo in CI.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const hugoToml = fs.readFileSync(path.join(ROOT, 'hugo.toml'), 'utf8');

function readParam(name) {
  const m = hugoToml.match(new RegExp('^\\s*' + name + '\\s*=\\s*"([^"]*)"', 'm'));
  return m ? m[1] : '';
}

function origin(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.protocol + '//' + u.host;
  } catch {
    return '';
  }
}

const connect = new Set(["'self'"]);
for (const key of ['jobSubmitEndpoint', 'eventSubmitEndpoint']) {
  const o = origin(readParam(key));
  if (o) connect.add(o);
}
const repoURL = readParam('repoURL') || 'https://github.com/opensourcedesign/opensourcedesign.net';
if (repoURL.startsWith('https://github.com/')) connect.add('https://raw.githubusercontent.com');

const scriptSrc = "'self' 'unsafe-inline' https://challenges.cloudflare.com";
const policy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests',
  'script-src ' + scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  'connect-src ' + [...connect].join(' '),
  'frame-src https://challenges.cloudflare.com',
].join('; ');

const out = `/*
  Content-Security-Policy: ${policy}
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
`;

fs.writeFileSync(path.join(ROOT, 'static/_headers'), out);
console.log('Wrote static/_headers (' + connect.size + ' connect-src origin(s))');
