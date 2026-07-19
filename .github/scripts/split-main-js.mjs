#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const srcPath = path.join(ROOT, 'assets/js/main.js');
const src = fs.readFileSync(srcPath, 'utf8');

const markers = [
  ['search-modal', '// Global search modal', '// 404 page'],
  ['lightbox', '// Image lightbox', '// ── Stale job markers'],
];

function extract(start, end) {
  const i = src.indexOf(start);
  const j = src.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error(`marker not found: ${start}`);
  let block = src.slice(i, j);
  block = block.replace(/^\s*\(function \(\) \{\s*/, '').replace(/\s*\}\)\(\);\s*$/, '');
  return block;
}

for (const [name, start, end] of markers) {
  const body = extract(start, end);
  if (name === 'search-modal') {
    const fixed = body.replace(
      "+ '<span class=\"osd-search__result-excerpt\">' + (d.excerpt || '') + '</span>'",
      "+ '<span class=\"osd-search__result-excerpt\">' + excerptHTML(d.excerpt) + '</span>'",
    );
    const withHelper = fixed.replace(
      'function escapeHTML(s) {',
      'function excerptHTML(raw) { return String(raw || "").replace(/<(?!\/?mark\\b)[^>]+>/gi, ""); }\n\n    function escapeHTML(s) {',
    );
    fs.writeFileSync(path.join(ROOT, `assets/js/${name}.js`), `/** Site search modal (Pagefind). */\nexport function init() {\n${withHelper}\n}\n`);
  } else {
    fs.writeFileSync(path.join(ROOT, `assets/js/${name}.js`), `/** Image lightbox for prose content. */\nexport function init() {\n${body}\n}\n`);
  }
}

const removeRanges = [
  ['// Global search modal', '// Image lightbox'],
  ['// Image lightbox', '// ── Stale job markers'],
  ['// 404 page', '// Image lightbox'],
  ['// ── Stale job markers', '})();'],
];

let core = src;
for (const [start, end] of removeRanges) {
  const i = core.indexOf(start);
  const j = core.indexOf(end, i);
  if (i >= 0 && j >= 0) core = core.slice(0, i) + core.slice(j);
}

const loader = `
  (function () {
    var mods = window.__OSD_MODULES || {};
    function load(url) {
      if (!url) return;
      import(url).then(function (m) { if (m && m.init) m.init(); }).catch(function () {});
    }
    if (document.getElementById('osd-search-dialog') && document.querySelector('[data-search-open]')) load(mods.search);
    if (document.getElementById('osd-notfound-search')) load(mods.notfound);
    if (document.querySelector('main .prose img, main .osd-prose img')) load(mods.lightbox);
    if (document.querySelector('[data-stale-check],[data-deadline-check]')) load(mods.jobMarkers);
  })();
})();
`;

core = core.replace(/\}\)\(\);\s*$/, loader);
fs.writeFileSync(srcPath, core);
console.log('split main.js ok');
