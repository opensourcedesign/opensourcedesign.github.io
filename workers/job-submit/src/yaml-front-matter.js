/**
 * Minimal front-matter reader for job/event Markdown files.
 * Handles quoted scalars and folded (>) / literal (|) block scalars used in content/.
 *
 * Keep in sync with assets/js/yaml-front-matter.js (CI enforces identical content).
 */

export function unquoteYamlScalar(s) {
  s = String(s).trim();
  if (/^'[\s\S]*'$/.test(s)) return s.slice(1, -1).replace(/''/g, "'");
  if (/^"[\s\S]*"$/.test(s)) {
    try { return JSON.parse(s); } catch (e) { return s.slice(1, -1); }
  }
  return s;
}

export function hasYamlKey(fm, key) {
  return new RegExp('^' + key + ':', 'm').test(String(fm));
}

export function readYamlScalar(fm, key) {
  const lines = String(fm).split(/\r?\n/);
  const keyRe = new RegExp('^' + key + ':(.*)$');
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (keyRe.test(lines[i])) {
      idx = i;
      break;
    }
  }
  if (idx === -1) return '';
  const after = lines[idx].replace(new RegExp('^' + key + ':\\s*'), '');
  const block = after.match(/^(>[+-]?|\|[+-]?)\s*$/);
  if (block) {
    const folded = block[1][0] === '>';
    const chomp = block[1].slice(-1) === '-';
    const parts = [];
    for (let j = idx + 1; j < lines.length; j++) {
      const line = lines[j];
      if (!/^[ \t]/.test(line)) break;
      parts.push(line.replace(/^[ \t]+/, ''));
    }
    let value = folded ? parts.join(' ').replace(/\s+/g, ' ').trim() : parts.join('\n');
    if (chomp) value = value.replace(/\n+$/, '');
    return value;
  }
  return unquoteYamlScalar(after);
}

export function readYamlList(fm, key) {
  const mm = String(fm).match(new RegExp('^' + key + ':[ \\t]*\\r?\\n((?:[ \\t]+-[ \\t]*.*(?:\\r?\\n|$))+)', 'm'));
  if (mm) {
    return mm[1].split(/\r?\n/)
      .map((l) => unquoteYamlScalar(l.replace(/^[ \t]+-[ \t]*/, '')))
      .filter(Boolean);
  }
  const s = readYamlScalar(fm, key);
  if (/^\[[\s\S]*\]$/.test(s)) {
    return s.slice(1, -1).split(',').map((x) => unquoteYamlScalar(x)).filter(Boolean);
  }
  return s ? [s] : [];
}

export function readYamlBlock(fm, key) {
  const mm = String(fm).match(new RegExp('^' + key + ':[ \\t]*\\|-?[ \\t]*\\r?\\n((?:[ \\t]+.*(?:\\r?\\n|$))+)', 'm'));
  if (mm) {
    return mm[1].split(/\r?\n/)
      .map((l) => l.replace(/^[ \t]+/, ''))
      .filter(Boolean)
      .join('\n');
  }
  return readYamlScalar(fm, key).replace(/\\r\\n/g, '\n');
}

export function splitFrontMatter(text) {
  const m = String(text).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  return { fm: m[1], body: m[2].trim() };
}

export function parseFrontMatter(text) {
  const parts = splitFrontMatter(text);
  if (!parts) return null;
  const fm = parts.fm;
  return {
    scalar(key) { return readYamlScalar(fm, key); },
    list(key) { return readYamlList(fm, key); },
    block(key) { return readYamlBlock(fm, key); },
    body: parts.body,
  };
}
