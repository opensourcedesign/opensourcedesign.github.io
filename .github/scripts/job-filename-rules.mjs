/** Shared job filename validation (used by normalize-jobs.mjs and lint-content.mjs). */

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isBadJobFilename(name) {
  if (!name.endsWith('.md')) return false;
  if (name === '-.md') return true;
  if (/-\.md$/.test(name)) return true;
  if (/[A-Z]/.test(name)) return true;
  if (/\s/.test(name)) return true;
  return false;
}

export function scalarFromFm(fm, key) {
  const re = new RegExp('^' + key + ':\\s*(.*)$', 'm');
  const m = fm.match(re);
  if (!m) return '';
  let v = m[1].trim();
  if (v === '>-' || v === '|-' || v === '>' || v === '|') {
    const rest = fm.slice(m.index + m[0].length);
    const lines = [];
    for (const line of rest.split(/\r?\n/)) {
      if (line.length && !/^\s/.test(line)) break;
      lines.push(line.replace(/^\s{2}/, ''));
    }
    v = lines.join('\n').trim();
  } else if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

export function targetBasename(file, fm) {
  const slug = scalarFromFm(fm, 'slug') || slugify(scalarFromFm(fm, 'title'));
  if (!slug) return null;
  const posted = scalarFromFm(fm, 'date_posted') || scalarFromFm(fm, 'date').slice(0, 10);
  const prefixMatch = file.match(/^(\d{4}(?:-\d{2}){0,2})/);
  const datePart = (posted && /^\d{4}-\d{2}-\d{2}/.test(posted) ? posted.slice(0, 10) : prefixMatch?.[1]) || '';
  if (!datePart) return `${slug}.md`;
  return `${datePart}-${slug}.md`;
}
