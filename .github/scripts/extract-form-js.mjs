#!/usr/bin/env node
/**
 * Extract inline form scripts from job-form.html / event-form.html into ES modules.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function extract(layoutPath, outName, endpointParam) {
  const html = fs.readFileSync(path.join(ROOT, layoutPath), 'utf8');
  const open = '      (function () {';
  const scriptTag = html.indexOf('    <script>');
  const start = html.indexOf(open, scriptTag);
  const close = html.lastIndexOf('      })();', html.indexOf('    </script>', start));
  if (scriptTag < 0 || start < 0 || close < 0) throw new Error(`script block not found in ${layoutPath}`);

  let body = html.slice(start + open.length, close);
  body = body.replace(/^\s*\{\{\/\*[\s\S]*?\*\/\}\}\s*/, '');
  for (const key of ['endpoint', 'repoURL', 'repoBranch']) {
    body = body.replace(new RegExp(`var ${key} = \\{\\{[\\s\\S]*?\\}\\};\\s*`, 'm'), '');
  }

  const js = `/** Generated from ${layoutPath} — edit the layout or re-run extract-form-js.mjs. */\nexport function init(cfg) {\n  cfg = cfg || {};\n  var endpoint = cfg.endpoint || '';\n  var repoURL = cfg.repoURL || '';\n  var repoBranch = cfg.repoBranch || 'master';\n${body}\n}\n`;
  fs.writeFileSync(path.join(ROOT, `assets/js/${outName}.js`), js);

  const loader = `    {{ $formJs := resources.Get "js/${outName}.js" | minify | fingerprint }}
    <script type="module">
      import({{ $formJs.RelPermalink | jsonify }}).then(function (m) {
        if (m && m.init) m.init({
          endpoint: {{ site.Params.${endpointParam} | default "" }},
          repoURL: {{ site.Params.repoURL | default "https://github.com/opensourcedesign/opensourcedesign.github.io" }},
          repoBranch: {{ site.Params.repoBranch | default "master" }}
        });
      });
    </script>`;

  const end = html.indexOf('    </script>', close);
  const newHtml = html.slice(0, scriptTag) + loader + html.slice(end + '    </script>'.length);
  fs.writeFileSync(path.join(ROOT, layoutPath), newHtml);
  console.log(`extracted ${outName}.js from ${layoutPath}`);
}

extract('layouts/jobs/job-form.html', 'job-form', 'jobSubmitEndpoint');
extract('layouts/events/event-form.html', 'event-form', 'eventSubmitEndpoint');
