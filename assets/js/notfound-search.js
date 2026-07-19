/** 404 page search seeded from the broken URL path. */
export function init() {
  var root = document.getElementById('osd-notfound-search');
  if (!root) return;

  var input = root.querySelector('[data-notfound-input]');
  var form = root.querySelector('[data-notfound-form]');
  var resultsEl = root.querySelector('[data-notfound-results]');
  var statusEl = root.querySelector('[data-notfound-status]');
  if (!input || !resultsEl) return;

  var MAX_RESULTS = 6;
  var importPromise = null;
  var SECTIONS = {
    jobs: 'Jobs', events: 'Events', resources: 'Resources',
    'about-us': 'About', articles: 'Article', tags: 'Topic', brand: 'Brand'
  };

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function excerptHTML(raw) {
    return String(raw || '').replace(/<(\/?)([\w-]+)[^>]*>/gi, function (m, slash, tag) {
      return /^mark$/i.test(tag) ? m : '';
    });
  }

  function sectionLabel(url) {
    var path = String(url || '').split('#')[0].split('?')[0].replace(/^https?:\/\/[^/]+/, '');
    var seg = path.split('/').filter(Boolean);
    return SECTIONS[seg[0]] || 'Page';
  }

  function queryFromPath(pathname) {
    var segs = String(pathname || '').split('/').filter(Boolean).map(function (s) {
      try { return decodeURIComponent(s); } catch (e) { return s; }
    }).filter(function (s) {
      return !/^\d+$/.test(s) && !/^index(\.\w+)?$/i.test(s) && !/^page$/i.test(s);
    });
    var slug = segs.length ? segs[segs.length - 1] : '';
    slug = slug.replace(/\.\w{1,5}$/, '').replace(/^\d{4}-\d{2}(-\d{2})?-?/, '');
    var q = slug.replace(/[-_+.]+/g, ' ').replace(/\s+/g, ' ').trim();
    return q.length > 80 ? q.slice(0, 80) : q;
  }

  function loadPagefind() {
    if (importPromise) return importPromise;
    var base = root.getAttribute('data-pagefind-base') || '/pagefind/';
    importPromise = import(base + 'pagefind.js').then(function (mod) {
      if (mod.options) mod.options({ excerptLength: 24, bundlePath: base });
      return mod;
    });
    return importPromise;
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function render(datas, total, query) {
    resultsEl.innerHTML = datas.map(function (d) {
      var url = (d.url || '').replace(/\.html$/, '');
      return '<li class="border-b border-slate-200 dark:border-slate-700">'
        + '<a class="group block py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20" href="' + escapeHTML(url) + '">'
        + '<span class="flex items-baseline justify-between gap-4">'
        + '<span class="font-semibold text-slate-900 decoration-slate-300 underline-offset-4 group-hover:underline dark:text-slate-100">' + escapeHTML((d.meta && d.meta.title) || url) + '</span>'
        + '<span class="shrink-0 text-xs font-semibold uppercase tracking-widest text-slate-400">' + sectionLabel(url) + '</span>'
        + '</span>'
        + '<span class="osd-search__result-excerpt">' + excerptHTML(d.excerpt) + '</span>'
        + '</a></li>';
    }).join('');
    setStatus(total > datas.length
      ? 'Best ' + datas.length + ' of ' + total + ' matches for \u201c' + query + '\u201d.'
      : 'Matches for \u201c' + query + '\u201d.');
  }

  function runSearch(raw) {
    var query = String(raw || '').trim();
    if (!query) {
      resultsEl.innerHTML = '';
      setStatus('Type to search events, resources, jobs, and pages.');
      return;
    }
    loadPagefind().then(function (pf) {
      return pf.debouncedSearch(query, {}, 180);
    }).then(function (search) {
      if (!search) return;
      if (!search.results.length) {
        resultsEl.innerHTML = '';
        setStatus('No matches for \u201c' + query + '\u201d - try different words, or start from a section below.');
        return;
      }
      var top = search.results.slice(0, MAX_RESULTS);
      Promise.all(top.map(function (r) { return r.data(); })).then(function (data) {
        render(data, search.results.length, query);
      });
    }).catch(function () {
      setStatus('Search isn\u2019t available yet - it is generated when the site is built.');
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = resultsEl.querySelector('a');
      if (first) window.location.assign(first.getAttribute('href'));
    });
  }
  input.addEventListener('input', function () { runSearch(input.value); });

  var seed = queryFromPath(window.location.pathname);
  if (seed) {
    input.value = seed;
    runSearch(seed);
  } else {
    setStatus('Type to search events, resources, jobs, and pages.');
  }
}
