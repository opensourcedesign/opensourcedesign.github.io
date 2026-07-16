#!/usr/bin/env node
/**
 * Build a pa11y-ci config from the Hugo sitemap in public/.
 *
 *   node .github/scripts/generate-pa11yci-config.mjs
 *
 * Env:
 *   SITEMAP_PATH   - default public/sitemap.xml
 *   SITEMAP_ORIGIN - production origin in <loc> URLs (default https://opensourcedesign.net)
 *   PA11Y_BASE_URL - local server base (default http://127.0.0.1:4321)
 *   PA11Y_CONFIG_OUT - output path (default .pa11yci.generated.json)
 *   PA11Y_CONCURRENCY - parallel Chrome tabs (default 8)
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sitemapPath = path.join(ROOT, process.env.SITEMAP_PATH || 'public/sitemap.xml');
const origin = (process.env.SITEMAP_ORIGIN || 'https://opensourcedesign.net').replace(/\/$/, '');
const baseUrl = (process.env.PA11Y_BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outPath = path.join(ROOT, process.env.PA11Y_CONFIG_OUT || '.pa11yci.generated.json');
const concurrency = Number(process.env.PA11Y_CONCURRENCY || 8);

if (!fs.existsSync(sitemapPath)) {
  console.error(`Sitemap not found: ${sitemapPath} (run hugo first)`);
  process.exit(1);
}

const xml = fs.readFileSync(sitemapPath, 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].trim())
  .filter((u) => u.startsWith(origin))
  .map((u) => baseUrl + u.slice(origin.length))
  .sort();

if (!urls.length) {
  console.error(`No URLs matched origin ${origin} in ${sitemapPath}`);
  process.exit(1);
}

const config = {
  defaults: {
    standard: 'WCAG2AA',
    timeout: 30000,
    concurrency,
    chromeLaunchConfig: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },
  urls,
};

fs.writeFileSync(outPath, JSON.stringify(config, null, 2) + '\n');
console.log(`Wrote ${urls.length} URL(s) to ${path.relative(ROOT, outPath)}`);
