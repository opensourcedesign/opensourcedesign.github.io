/**
 * Hugo job permalink slug helpers.
 *
 * For `jobs = "/jobs/:slug/"` Hugo derives :slug from front matter `slug` or,
 * when absent, urlizes the title. Slashes in the title become path segments
 * (e.g. "Senior UX/UI Designer" → senior-ux/ui-designer).
 */

export function slugifySegment(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Hugo :slug fallback when `slug` is not set in front matter. */
export function hugoSlugFromTitle(title) {
  return String(title || '')
    .split('/')
    .map(slugifySegment)
    .filter(Boolean)
    .join('/');
}

/**
 * Live /jobs/… URL for a posting (explicit url/permalink > slug > title slug).
 * @param {{ title: string, slug?: string, url?: string, permalink?: string }} fields
 * @param {string} [site]
 */
export function jobPermalinkFromFields(fields, site = 'https://opensourcedesign.net') {
  const base = site.replace(/\/+$/, '');
  const explicit = fields.url || fields.permalink;
  if (explicit) {
    return `${base}/${explicit.replace(/^\/+/, '').replace(/\/*$/, '/')}`;
  }
  const slug = fields.slug || hugoSlugFromTitle(fields.title);
  if (!slug) return `${base}/jobs/`;
  return `${base}/jobs/${slug}/`;
}
