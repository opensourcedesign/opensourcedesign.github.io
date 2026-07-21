/** Site search modal (Pagefind). */
export function init() {
// Global search modal - custom UI on top of the Pagefind JS API.
  (function () {
    var dialog = document.getElementById('osd-search-dialog');
    var openers = document.querySelectorAll('[data-search-open]');
    if (!dialog || !openers.length) return;

    var input = dialog.querySelector('[data-search-input]');
    var form = dialog.querySelector('[data-search-form]');
    var resultsEl = dialog.querySelector('[data-search-results]');
    var statusEl = dialog.querySelector('[data-search-status]');
    if (!input || !resultsEl) return;

    var MAX_RESULTS = 8;
    var MAX_SUBS = 3;
    var MAX_RECENT = 5;
    var RECENT_KEY = 'osd-search-recent';
    var pagefind = null;
    var importPromise = null;
    var activeIndex = -1;
    var resultCount = 0;
    var lastQuery = '';

    var SECTIONS = {
      jobs: 'Jobs', events: 'Events', resources: 'Resources',
      'about-us': 'About', articles: 'Article', tags: 'Topic',
      people: 'People', brand: 'Brand'
    };

    function base() {
      return dialog.getAttribute('data-pagefind-base') || '/pagefind/';
    }

    function sectionLabel(url) {
      var path = String(url || '').split('#')[0].split('?')[0].replace(/^https?:\/\/[^/]+/, '');
      var seg = path.split('/').filter(Boolean);
      return SECTIONS[seg[0]] || 'Page';
    }

    function excerptHTML(raw) {
      return String(raw || "").replace(/<(\/?)([\w-]+)[^>]*>/gi, function (m, slash, tag) {
        return /^mark$/i.test(tag) ? m : "";
      });
    }

    function escapeHTML(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Append ?pagefind-highlight=<term> params (one per word, before any #hash)
    // so the destination page can highlight the matched terms.
    function withHighlight(url, query) {
      var words = (query || '').trim().split(/\s+/).filter(function (w) { return w.length > 1; });
      if (!url || !words.length) return url;
      var hashIdx = url.indexOf('#');
      var hash = hashIdx === -1 ? '' : url.slice(hashIdx);
      var path = hashIdx === -1 ? url : url.slice(0, hashIdx);
      var sep = path.indexOf('?') === -1 ? '?' : '&';
      var qs = words.map(function (w) { return 'pagefind-highlight=' + encodeURIComponent(w); }).join('&');
      return path + sep + qs + hash;
    }

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text || '';
    }

    function setExpanded(on) {
      input.setAttribute('aria-expanded', on ? 'true' : 'false');
    }

    function readRecent() {
      try {
        var list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        return Array.isArray(list) ? list.filter(Boolean).slice(0, MAX_RECENT) : [];
      } catch (e) { return []; }
    }

    function writeRecent(query) {
      var q = String(query || '').trim();
      if (q.length < 2) return;
      var list = readRecent().filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); });
      list.unshift(q);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); } catch (e) { /* quota */ }
    }

    function renderRecent() {
      var recent = readRecent();
      if (!recent.length) {
        clearResults();
        setStatus('Type to search events, resources, jobs, and pages.');
        return;
      }
      resultsEl.innerHTML = recent.map(function (q, i) {
        return '<li role="option" id="osd-sr-' + i + '" class="osd-search__result osd-search__result--recent' + (i === 0 ? ' is-active' : '') + '" aria-selected="' + (i === 0) + '" data-recent="' + escapeHTML(q) + '">'
          + '<button type="button" class="osd-search__result-main w-full text-left" tabindex="-1">'
          + '<span class="osd-search__result-head"><span class="osd-search__result-title">' + escapeHTML(q) + '</span>'
          + '<span class="osd-search__badge">Recent</span></span></button></li>';
      }).join('');
      resultCount = recent.length;
      activeIndex = 0;
      setExpanded(true);
      syncActiveDescendant();
      setStatus('Recent searches — pick one or type a new query.');
    }

    function syncActiveDescendant() {
      if (activeIndex >= 0) input.setAttribute('aria-activedescendant', 'osd-sr-' + activeIndex);
      else input.removeAttribute('aria-activedescendant');
    }

    function clearResults() {
      resultsEl.innerHTML = '';
      resultCount = 0;
      activeIndex = -1;
      setExpanded(false);
      syncActiveDescendant();
    }

    // Lazy-load the Pagefind ES module on first use.
    function loadPagefind() {
      if (importPromise) return importPromise;
      importPromise = import(base() + 'pagefind.js').then(function (mod) {
        pagefind = mod;
        if (pagefind.options) pagefind.options({ excerptLength: 24, bundlePath: base() });
        return pagefind;
      }).catch(function (err) {
        importPromise = null;
        throw err;
      });
      return importPromise;
    }

    function renderResult(d, i, query) {
      var section = sectionLabel(d.url);
      var title = (d.meta && d.meta.title) ? d.meta.title : d.url;
      var mainUrl = withHighlight(d.url, query);
      var subs = (d.sub_results || [])
        .filter(function (s) { return s.title && s.url && s.url.indexOf('#') !== -1; })
        .slice(0, MAX_SUBS)
        .map(function (s) {
          return '<a class="osd-search__sub" href="' + escapeHTML(withHighlight(s.url, query)) + '" tabindex="-1">'
            + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>'
            + '<span>' + escapeHTML(s.title) + '</span></a>';
        }).join('');

      return '<li role="option" id="osd-sr-' + i + '" class="osd-search__result' + (i === 0 ? ' is-active' : '') + '" aria-selected="' + (i === 0) + '" data-url="' + escapeHTML(mainUrl) + '">'
        + '<a class="osd-search__result-main" href="' + escapeHTML(mainUrl) + '" tabindex="-1">'
        + '<span class="osd-search__result-head">'
        + '<span class="osd-search__result-title">' + escapeHTML(title) + '</span>'
        + '<span class="osd-search__badge">' + section + '</span>'
        + '</span>'
        + '<span class="osd-search__result-excerpt">' + excerptHTML(d.excerpt) + '</span>'
        + '</a>'
        + (subs ? '<div class="osd-search__subs">' + subs + '</div>' : '')
        + '</li>';
    }

    function render(data, total, query) {
      resultsEl.innerHTML = data.map(function (d, i) { return renderResult(d, i, query); }).join('');
      resultCount = data.length;
      activeIndex = data.length ? 0 : -1;
      setExpanded(data.length > 0);
      syncActiveDescendant();
      if (total > data.length) {
        setStatus('Showing top ' + data.length + ' of ' + total + ' results for \u201C' + query + '\u201D');
      } else {
        setStatus(total + ' result' + (total === 1 ? '' : 's') + ' for \u201C' + query + '\u201D');
      }
    }

    function runSearch(raw) {
      var query = (raw || '').trim();
      lastQuery = query;
      if (!query) {
        clearResults();
        setStatus('Type to search events, resources, jobs, and pages.');
        return;
      }
      setStatus('Searching\u2026');
      loadPagefind().then(function (pf) {
        return pf.debouncedSearch(query, {}, 180);
      }).then(function (search) {
        if (!search) return;                     // superseded by a newer keystroke
        if (query !== lastQuery) return;         // stale response
        if (!search.results.length) {
          clearResults();
          setStatus('No results for \u201C' + query + '\u201D.');
          return;
        }
        var top = search.results.slice(0, MAX_RESULTS);
        return Promise.all(top.map(function (r) { return r.data(); })).then(function (data) {
          if (query !== lastQuery) return;
          render(data, search.results.length, query);
        });
      }).catch(function () {
        clearResults();
        setStatus('Search isn\u2019t available yet - it is generated when the site is built.');
      });
    }

    function items() {
      return resultsEl.querySelectorAll('.osd-search__result');
    }

    function setActive(i) {
      var list = items();
      if (!list.length) return;
      activeIndex = (i + list.length) % list.length;
      for (var k = 0; k < list.length; k++) {
        var on = k === activeIndex;
        list[k].classList.toggle('is-active', on);
        list[k].setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) list[k].scrollIntoView({ block: 'nearest' });
      }
      syncActiveDescendant();
    }

    function navigateActive() {
      var list = items();
      var el = list[activeIndex] || list[0];
      if (!el) return;
      var recent = el.getAttribute('data-recent');
      if (recent) {
        input.value = recent;
        runSearch(recent);
        return;
      }
      var url = el.getAttribute('data-url');
      if (url) {
        writeRecent(lastQuery);
        window.location.assign(url);
      }
    }

    function open() {
      if (dialog.open) { input.focus(); return; }
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
      // Warm up the index so the first keystroke is snappy.
      loadPagefind().then(function (pf) {
        try { if (pf.preload) pf.preload(''); } catch (e) {}
      }).catch(function () {
        setStatus('Search isn\u2019t available yet - it is generated when the site is built.');
      });
      if (input.value.trim()) runSearch(input.value);
      else renderRecent();
      window.requestAnimationFrame(function () { input.focus(); input.select(); });
    }

    function close() {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      document.documentElement.style.overflow = '';
    }

    openers.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var det = el.closest('details');
        if (det) det.removeAttribute('open');
        open();
      });
    });

    dialog.querySelectorAll('[data-search-close]').forEach(function (b) {
      b.addEventListener('click', close);
    });

    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); navigateActive(); });

    input.addEventListener('input', function () { runSearch(input.value); });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
      else if (e.key === 'Enter') { if (resultCount) { e.preventDefault(); navigateActive(); } }
      else if (e.key === 'Home' && resultCount) { e.preventDefault(); setActive(0); }
      else if (e.key === 'End' && resultCount) { e.preventDefault(); setActive(resultCount - 1); }
    });

    // Pointer hover keeps the active row in sync with the mouse.
    resultsEl.addEventListener('mousemove', function (e) {
      var li = e.target.closest('.osd-search__result');
      if (!li) return;
      var list = Array.prototype.slice.call(items());
      var idx = list.indexOf(li);
      if (idx !== -1 && idx !== activeIndex) setActive(idx);
    });

    // Click on a result row (outside the inner links) still navigates.
    resultsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-recent]');
      if (btn) {
        var q = btn.getAttribute('data-recent');
        if (q) { input.value = q; runSearch(q); }
        return;
      }
      if (e.target.closest('a')) {
        if (lastQuery) writeRecent(lastQuery);
        return;
      }
      var li = e.target.closest('.osd-search__result');
      if (!li) return;
      var url = li.getAttribute('data-url');
      if (url) window.location.assign(url);
    });

    // Click on the backdrop (the dialog element itself) closes.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) close();
    });

    // Native <dialog> closes on Escape; keep the scroll lock in sync.
    dialog.addEventListener('close', function () {
      document.documentElement.style.overflow = '';
    });

    // Shortcuts: Ctrl/⌘ + K anywhere, or "/" outside of form fields.
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        open();
        return;
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !dialog.open) {
        var t = e.target;
        var tag = t && t.tagName ? t.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (t && t.isContentEditable)) return;
        e.preventDefault();
        open();
      }
    });
  })();
}
