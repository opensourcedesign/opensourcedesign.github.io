#!/usr/bin/env node
/**
 * Extract inline form scripts from job-form.html / event-form.html into ES modules.
 *
 *   node .github/scripts/extract-form-js.mjs          # rewrite modules from layouts
 *   node .github/scripts/extract-form-js.mjs --check  # CI: fail if modules are stale
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const checkOnly = process.argv.includes('--check');
const MANIFEST = path.join(ROOT, '.github/form-modules.sha256');

const FORMS = [
  { layout: 'layouts/jobs/job-form.html', module: 'job-form', formId: 'osd-job-form', endpoint: 'jobSubmitEndpoint' },
  { layout: 'layouts/events/event-form.html', module: 'event-form', formId: 'osd-event-form', endpoint: 'eventSubmitEndpoint' },
];

function sha256(file) {
  // Normalize CRLF → LF so manifest hashes match Linux CI checkouts.
  const content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function buildFromInline(layoutPath) {
  const html = fs.readFileSync(path.join(ROOT, layoutPath), 'utf8');
  const open = '      (function () {';
  const scriptTag = html.indexOf('    <script>');
  const start = html.indexOf(open, scriptTag);
  const close = html.lastIndexOf('      })();', html.indexOf('    </script>', start));
  if (scriptTag < 0 || start < 0 || close < 0) return null;

  let body = html.slice(start + open.length, close);
  body = body.replace(/^\s*\{\{\/\*[\s\S]*?\*\/\}\}\s*/, '');
  for (const key of ['endpoint', 'repoURL', 'repoBranch']) {
    body = body.replace(new RegExp(`var ${key} = \\{\\{[\\s\\S]*?\\}\\};\\s*`, 'm'), '');
  }

  return `/** Generated from ${layoutPath} — edit the layout or re-run extract-form-js.mjs. */\nexport function init(cfg) {\n  cfg = cfg || {};\n  var endpoint = cfg.endpoint || '';\n  var repoURL = cfg.repoURL || '';\n  var repoBranch = cfg.repoBranch || 'main';\n${body}\n}\n`;
}

function writeManifest() {
  const lines = FORMS.map(({ module }) => {
    const p = path.join(ROOT, `assets/js/${module}.js`);
    return `${sha256(p)}  assets/js/${module}.js`;
  });
  fs.writeFileSync(MANIFEST, lines.join('\n') + '\n');
}

function extractOne({ layout, module, endpoint }) {
  const js = buildFromInline(layout);
  if (!js) throw new Error(`inline script block not found in ${layout}`);
  fs.writeFileSync(path.join(ROOT, `assets/js/${module}.js`), js);

  const html = fs.readFileSync(path.join(ROOT, layout), 'utf8');
  const loader = `    {{ $formJs := resources.Get "js/${module}.js" | minify | fingerprint }}
    <script type="module">
      import { init } from {{ $formJs.RelPermalink | jsonify | safeJS }};
      init({
        endpoint: {{ site.Params.${endpoint} | default "" | jsonify | safeJS }},
        repoURL: {{ site.Params.repoURL | default "https://github.com/opensourcedesign/opensourcedesign.net" | jsonify | safeJS }},
        repoBranch: {{ site.Params.repoBranch | default "main" | jsonify | safeJS }}
      });
    </script>`;

  const scriptTag = html.indexOf('    <script>');
  const open = '      (function () {';
  const start = html.indexOf(open, scriptTag);
  const close = html.lastIndexOf('      })();', html.indexOf('    </script>', start));
  const end = html.indexOf('    </script>', close);
  fs.writeFileSync(path.join(ROOT, layout), html.slice(0, scriptTag) + loader + html.slice(end + '    </script>'.length));
  console.log(`extracted ${module}.js from ${layout}`);
}

function checkOne({ layout, module, formId }) {
  const layoutPath = path.join(ROOT, layout);
  const jsPath = path.join(ROOT, `assets/js/${module}.js`);
  const html = fs.readFileSync(layoutPath, 'utf8');

  if (!html.includes(`js/${module}.js`)) {
    console.error(`extract-form-js: ${layout} must load assets/js/${module}.js`);
    return false;
  }
  if (html.includes(`getElementById('${formId}')`)) {
    console.error(`extract-form-js: ${layout} still has inline form logic — run extract-form-js.mjs`);
    return false;
  }
  if (!fs.existsSync(jsPath)) {
    console.error(`extract-form-js: missing ${jsPath}`);
    return false;
  }
  const js = fs.readFileSync(jsPath, 'utf8');
  if (!js.includes('export function init')) {
    console.error(`extract-form-js: ${jsPath} must export init()`);
    return false;
  }
  if (!js.includes(formId)) {
    console.error(`extract-form-js: ${jsPath} must reference #${formId}`);
    return false;
  }
  return true;
}

if (checkOnly) {
  let ok = true;
  for (const form of FORMS) {
    if (!checkOne(form)) ok = false;
  }
  if (ok && fs.existsSync(MANIFEST)) {
    const expected = fs.readFileSync(MANIFEST, 'utf8').trim();
    const actual = FORMS.map(({ module }) => {
      const p = path.join(ROOT, `assets/js/${module}.js`);
      return `${sha256(p)}  assets/js/${module}.js`;
    }).join('\n');
    if (expected !== actual) {
      console.error('extract-form-js: module hash drift — run node .github/scripts/extract-form-js.mjs and commit .github/form-modules.sha256');
      ok = false;
    }
  } else if (ok && !fs.existsSync(MANIFEST)) {
    console.error('extract-form-js: missing .github/form-modules.sha256 — run extract-form-js.mjs once');
    ok = false;
  }
  if (!ok) process.exit(1);
  console.log('extract-form-js: ok');
} else {
  let extracted = false;
  for (const form of FORMS) {
    if (buildFromInline(form.layout)) {
      extractOne(form);
      extracted = true;
    }
  }
  if (extracted) writeManifest();
  else {
    writeManifest();
    console.log('layouts already use modules; refreshed form-modules.sha256');
  }
}
