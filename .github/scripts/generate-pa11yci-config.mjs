#!/usr/bin/env node
/**
 * Build a pa11y-ci config from the Hugo sitemap in public/.
 *
 * By default audits a curated subset (~30 pages): section indexes, forms, and a
 * few sample content pages per high-volume section. Set PA11Y_FULL=1 to audit
 * every sitemap URL (slow; useful for manual full-site sweeps).
 *
 *   node .github/scripts/generate-pa11yci-config.mjs
 *
 * Env:
 *   SITEMAP_PATH      - default public/sitemap.xml
 *   SITEMAP_ORIGIN    - production origin in <loc> URLs (default https://opensourcedesign.net)
 *   PA11Y_BASE_URL    - local server base (default http://127.0.0.1:4321)
 *   PA11Y_CONFIG_OUT  - output path (default .pa11yci.generated.json)
 *   PA11Y_CONCURRENCY - parallel Chrome tabs when using pa11y-ci (default 1)
 *   PA11Y_SAMPLE_SIZE - content pages per section when sampling (default 3)
 *   PA11Y_FULL        - set to 1 for every sitemap URL
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sitemapPath = path.join(ROOT, process.env.SITEMAP_PATH || 'public/sitemap.xml');
const origin = (process.env.SITEMAP_ORIGIN || 'https://opensourcedesign.net').replace(/\/$/, '');
const baseUrl = (process.env.PA11Y_BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outPath = path.join(ROOT, process.env.PA11Y_CONFIG_OUT || '.pa11yci.generated.json');
const concurrency = Number(process.env.PA11Y_CONCURRENCY || 1);
const sampleSize = Number(process.env.PA11Y_SAMPLE_SIZE || 3);
const fullScan = process.env.PA11Y_FULL === '1' || process.env.PA11Y_FULL === 'true';

/** Section indexes, static pages, and forms (not always in the sitemap). */
const CORE_PATHS = [
  '/',
  '/brand/',
  '/imprint/',
  '/jobs/',
  '/jobs/archive/',
  '/jobs/job-form/',
  '/events/',
  '/events/event-form/',
  '/resources/',
  '/resources/articles/',
  '/resources/links/',
  '/resources/suggest/',
  '/tags/',
];

/** Sample content pages under these prefixes (utility paths excluded). */
const SAMPLE_SECTIONS = [
  {
    prefix: '/jobs/',
    exclude: new Set(['/jobs/', '/jobs/archive/', '/jobs/job-form/']),
  },
  {
    prefix: '/events/',
    exclude: new Set(['/events/', '/events/event-form/']),
  },
  {
    prefix: '/resources/',
    exclude: new Set([
      '/resources/',
      '/resources/articles/',
      '/resources/links/',
      '/resources/suggest/',
    ]),
  },
  {
    prefix: '/tags/',
    exclude: new Set(['/tags/']),
  },
];

if (!fs.existsSync(sitemapPath)) {
  console.error(`Sitemap not found: ${sitemapPath} (run hugo first)`);
  process.exit(1);
}

const xml = fs.readFileSync(sitemapPath, 'utf8');
const sitemapPaths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].trim())
  .filter((u) => u.startsWith(origin))
  .map((u) => {
    const rel = u.slice(origin.length);
    return rel || '/';
  })
  .sort();

if (!sitemapPaths.length) {
  console.error(`No URLs matched origin ${origin} in ${sitemapPath}`);
  process.exit(1);
}

function toLocalUrl(relPath) {
  return baseUrl + (relPath.startsWith('/') ? relPath : `/${relPath}`);
}

function sampleSection(paths, { prefix, exclude }) {
  return paths.filter((p) => p.startsWith(prefix) && !exclude.has(p)).slice(0, sampleSize);
}

function buildCuratedPaths(paths) {
  const selected = new Set(CORE_PATHS);

  for (const p of paths) {
    if (p.startsWith('/about-us/')) selected.add(p);
  }

  for (const section of SAMPLE_SECTIONS) {
    for (const p of sampleSection(paths, section)) selected.add(p);
  }

  return [...selected].sort();
}

const relPaths = fullScan ? sitemapPaths : buildCuratedPaths(sitemapPaths);
const urls = relPaths.map(toLocalUrl);

const config = {
  defaults: {
    standard: 'WCAG2AA',
    timeout: 30000,
    concurrency,
    chromeLaunchConfig: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  },
  urls,
};

fs.writeFileSync(outPath, JSON.stringify(config, null, 2) + '\n');
const mode = fullScan ? 'full sitemap' : 'curated sample';
console.log(`Wrote ${urls.length} URL(s) (${mode}) to ${path.relative(ROOT, outPath)}`);
