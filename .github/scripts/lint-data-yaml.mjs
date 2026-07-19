#!/usr/bin/env node
/**
 * Validate data/resources.yaml and data/bibliography.yaml structure.
 *
 *   npm install --no-save yaml
 *   node .github/scripts/lint-data-yaml.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const ROOT = process.cwd();

function isHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function lintResources(file) {
  const errors = [];
  let data;
  try {
    data = parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [`${file}: YAML parse error: ${e.message}`];
  }
  if (!Array.isArray(data)) return [`${file}: root must be an array of categories`];
  const ids = new Set();
  for (const [i, cat] of data.entries()) {
    const p = `category[${i}]`;
    if (!cat?.id) errors.push(`${p}: id is required`);
    else if (ids.has(cat.id)) errors.push(`${p}: duplicate id "${cat.id}"`);
    else ids.add(cat.id);
    if (!cat?.title) errors.push(`${p}: title is required`);
    if (!Array.isArray(cat?.items)) errors.push(`${p}: items must be an array`);
    else {
      for (const [j, item] of cat.items.entries()) {
        const ip = `${p}.items[${j}]`;
        if (!item?.name) errors.push(`${ip}: name is required`);
        if (!item?.url) errors.push(`${ip}: url is required`);
        else if (!isHttpUrl(item.url)) errors.push(`${ip}: url must be http(s)`);
        if (item?.links) {
          if (!Array.isArray(item.links)) errors.push(`${ip}: links must be an array`);
          else {
            for (const [k, link] of item.links.entries()) {
              if (!link?.text) errors.push(`${ip}.links[${k}]: text is required`);
              if (!link?.url) errors.push(`${ip}.links[${k}]: url is required`);
              else if (!isHttpUrl(link.url)) errors.push(`${ip}.links[${k}]: url must be http(s)`);
            }
          }
        }
      }
    }
  }
  return errors;
}

function lintBibliography(file) {
  const errors = [];
  let data;
  try {
    data = parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [`${file}: YAML parse error: ${e.message}`];
  }
  if (!Array.isArray(data)) return [`${file}: root must be an array`];
  const types = new Set(['article', 'book', 'paper', 'talk', 'video']);
  for (const [i, row] of data.entries()) {
    const p = `entry[${i}]`;
    if (!row?.title) errors.push(`${p}: title is required`);
    if (!row?.author) errors.push(`${p}: author is required`);
    if (row?.year != null && !/^\d{4}$/.test(String(row.year))) errors.push(`${p}: year must be YYYY`);
    if (!row?.url) errors.push(`${p}: url is required`);
    else if (!isHttpUrl(row.url)) errors.push(`${p}: url must be http(s)`);
    if (row?.type && !types.has(row.type)) errors.push(`${p}: type must be one of ${[...types].join(', ')}`);
  }
  return errors;
}

const checks = [
  { file: 'data/resources.yaml', lint: lintResources },
  { file: 'data/bibliography.yaml', lint: lintBibliography },
];

let total = 0;
for (const { file, lint } of checks) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    console.error(`missing ${file}`);
    process.exitCode = 1;
    continue;
  }
  const errs = lint(full);
  if (errs.length) {
    console.log(`\n=== ${file} ===`);
    errs.forEach((e) => console.log('  error: ' + e));
    total += errs.length;
  }
}

if (total) {
  console.error(`\n${total} error(s)`);
  process.exitCode = 1;
} else {
  console.log('data YAML ok');
}
