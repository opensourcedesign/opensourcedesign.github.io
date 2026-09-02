/**
 * Small GitHub REST helpers shared by CI scripts.
 */

export function ghHeaders() {
  return {
    Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function gh(path, opts = {}) {
  const res = await fetch('https://api.github.com' + path, {
    ...opts,
    headers: { ...ghHeaders(), ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const detail = (await res.text()).trim().slice(0, 200);
    throw new Error('GitHub ' + path + ': HTTP ' + res.status + (detail ? ' ' + detail : ''));
  }
  return res.json();
}

/** Fetch every page of a paginated list endpoint (per_page=100). */
export async function ghPaginated(path) {
  const results = [];
  let page = 1;
  for (;;) {
    const sep = path.includes('?') ? '&' : '?';
    const batch = await gh(path + sep + 'per_page=100&page=' + page);
    if (!Array.isArray(batch) || !batch.length) break;
    results.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return results;
}
