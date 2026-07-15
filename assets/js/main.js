(function () {
  // Apply Pagefind search-term highlighting when arriving from a search result
  // (URL carries one or more ?pagefind-highlight=<term> params).
  (function () {
    if (!/[?&]pagefind-highlight=/.test(window.location.search)) return;
    var base = '/pagefind/';
    var d = document.getElementById('osd-search-dialog');
    if (d && d.getAttribute('data-pagefind-base')) base = d.getAttribute('data-pagefind-base');
    import(base + 'pagefind-highlight.js').then(function (mod) {
      var PH = mod && (mod.default || mod.PagefindHighlight) ? (mod.default || mod.PagefindHighlight) : window.PagefindHighlight;
      if (!PH) return;
      new PH({
        highlightParam: 'pagefind-highlight',
        addStyles: false,
        markOptions: {
          className: 'pagefind-highlight',
          exclude: ['[data-pagefind-ignore]', '[data-pagefind-ignore] *']
        }
      });
    }).catch(function () {});
  })();

  // Scroll to top button
  var btn = document.getElementById('scroll-to-top');
  if (btn) {
    var threshold = 400;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    function updateBtn() {
      btn.classList.toggle('visible', window.scrollY > threshold);
    }
    window.addEventListener('scroll', updateBtn, { passive: true });
    btn.addEventListener('click', function () {
      // CSS `scroll-behavior` doesn't govern programmatic scrolls, so honor
      // prefers-reduced-motion here explicitly.
      window.scrollTo({ top: 0, behavior: reducedMotion && reducedMotion.matches ? 'auto' : 'smooth' });
    });
    updateBtn();
  }

  // Close the mobile menu on navigation. Scoped to the header so <details>
  // used for content disclosure (FAQs etc.) don't collapse on link clicks.
  document.querySelectorAll('header details').forEach(function (d) {
    d.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        d.removeAttribute('open');
      });
    });
  });

  // Theme toggle (header): cycles light -> system -> dark. The stored choice
  // ("osd-theme") is applied before first paint by the head script in
  // baseof.html; buttons ship hidden and are revealed here (no dead control
  // without JS).
  (function () {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    if (!buttons.length) return;
    var ORDER = ['light', 'system', 'dark'];
    var LABELS = { light: 'Light', system: 'System', dark: 'Dark' };
    function current() {
      try {
        var v = localStorage.getItem('osd-theme');
        return v === 'light' || v === 'dark' ? v : 'system';
      } catch (e) { return 'system'; }
    }
    function render() {
      var state = current();
      var next = ORDER[(ORDER.indexOf(state) + 1) % ORDER.length];
      buttons.forEach(function (b) {
        b.hidden = false;
        b.setAttribute('data-theme-state', state);
        b.setAttribute('aria-label', 'Colour theme: ' + LABELS[state] + '. Switch to ' + LABELS[next].toLowerCase() + '.');
        b.title = 'Theme: ' + LABELS[state];
        var label = b.querySelector('[data-theme-label]');
        if (label) label.textContent = 'Theme: ' + LABELS[state];
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var next = ORDER[(ORDER.indexOf(current()) + 1) % ORDER.length];
        try {
          if (next === 'system') localStorage.removeItem('osd-theme');
          else localStorage.setItem('osd-theme', next);
        } catch (e) { /* private mode: theme just won't persist */ }
        if (window.osdSyncTheme) window.osdSyncTheme();
        render();
      });
    });
    render();
  })();

  // Copy-link buttons (share partial) - delegated so there is no inline JS (CSP-friendly).
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy-link]');
    if (!btn || btn.dataset.copied === '1') return;
    var url = btn.getAttribute('data-copy-link') || window.location.href;
    var original = btn.innerHTML;
    var confirm = function () {
      btn.dataset.copied = '1';
      btn.innerHTML = '<svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>';
      btn.setAttribute('aria-label', 'Link copied');
      setTimeout(function () {
        btn.innerHTML = original;
        btn.setAttribute('aria-label', 'Copy link');
        delete btn.dataset.copied;
      }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(confirm).catch(function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); confirm(); } catch (err) { /* ignore */ }
      document.body.removeChild(ta);
    }
  });

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
        + '<span class="osd-search__result-excerpt">' + (d.excerpt || '') + '</span>'
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
      if (el) {
        var url = el.getAttribute('data-url');
        if (url) window.location.assign(url);
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
      else setStatus('Type to search events, resources, jobs, and pages.');
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
      if (e.target.closest('a')) return;
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

  // 404 page: inline Pagefind search seeded from the broken URL, so a dead
  // link (often a pre-2026 permalink) turns into likely matches immediately.
  (function () {
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

    function sectionLabel(url) {
      var path = String(url || '').split('#')[0].split('?')[0].replace(/^https?:\/\/[^/]+/, '');
      var seg = path.split('/').filter(Boolean);
      return SECTIONS[seg[0]] || 'Page';
    }

    // Turn the requested path into a search query: last meaningful segment,
    // minus extensions and date prefixes, hyphens to spaces. Old permalinks
    // like /2015/05/23/text-based-tools-for-designers/ become
    // "text based tools for designers".
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
        return '<li class="border-b border-slate-200">'
          + '<a class="group block py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20" href="' + escapeHTML(url) + '">'
          + '<span class="flex items-baseline justify-between gap-4">'
          + '<span class="font-semibold text-slate-900 decoration-slate-300 underline-offset-4 group-hover:underline">' + escapeHTML((d.meta && d.meta.title) || url) + '</span>'
          + '<span class="shrink-0 text-xs font-semibold uppercase tracking-widest text-slate-400">' + sectionLabel(url) + '</span>'
          + '</span>'
          + '<span class="osd-search__result-excerpt">' + (d.excerpt || '') + '</span>'
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
        if (!search) return;                     // superseded by a newer keystroke
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
  })();

  // Image lightbox for rich content, built on the native <dialog> element:
  // showModal() provides the top layer, an inert page behind the dialog, a real
  // focus trap, and Escape-to-close - none of which the old div overlay had.
  (function () {
    // Skip images inside links (they navigate) and require <dialog> support;
    // without it images simply stay plain images (progressive enhancement).
    var imgs = Array.prototype.slice.call(document.querySelectorAll('main .prose img, main .osd-prose img'))
      .filter(function (el) { return !el.closest('a'); });
    if (!imgs.length || typeof document.createElement('dialog').showModal !== 'function') return;

    var dialog = document.createElement('dialog');
    dialog.className = 'osd-lightbox';
    dialog.setAttribute('aria-label', 'Image viewer');
    dialog.innerHTML = [
      '<div class="osd-lightbox__bar">',
      '  <p class="osd-lightbox__counter" data-lb-counter aria-hidden="true"></p>',
      '  <div class="osd-lightbox__controls">',
      '    <button type="button" class="osd-lightbox__btn" data-lb-prev aria-label="Previous image">',
      '      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>',
      '    </button>',
      '    <button type="button" class="osd-lightbox__btn" data-lb-next aria-label="Next image">',
      '      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>',
      '    </button>',
      '    <button type="button" class="osd-lightbox__btn" data-lb-close aria-label="Close image viewer" autofocus>',
      '      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
      '    </button>',
      '  </div>',
      '</div>',
      '<figure class="osd-lightbox__figure" data-lb-figure>',
      '  <img class="osd-lightbox__img" data-lb-image alt="" decoding="async" />',
      '  <figcaption class="osd-lightbox__caption" data-lb-caption hidden></figcaption>',
      '</figure>',
      '<p class="osd-lightbox__status" role="status" aria-live="polite" data-lb-status></p>'
    ].join('\n');
    document.body.appendChild(dialog);

    var img = dialog.querySelector('[data-lb-image]');
    var captionEl = dialog.querySelector('[data-lb-caption]');
    var counterEl = dialog.querySelector('[data-lb-counter]');
    var statusEl = dialog.querySelector('[data-lb-status]');
    var figureEl = dialog.querySelector('[data-lb-figure]');
    var prevBtn = dialog.querySelector('[data-lb-prev]');
    var nextBtn = dialog.querySelector('[data-lb-next]');
    var closeBtn = dialog.querySelector('[data-lb-close]');
    var lastFocus = null;
    var index = 0;

    var single = imgs.length <= 1;
    prevBtn.hidden = single;
    nextBtn.hidden = single;

    function captionFor(el) {
      var fig = el.closest('figure');
      var fc = fig && fig.querySelector('figcaption');
      return (fc && fc.textContent.trim()) || el.getAttribute('title') || el.alt || '';
    }

    // Update the viewer in place: unlike the old implementation this never
    // re-opens the dialog or moves focus, so prev/next keep focus where it is.
    function show(i) {
      index = ((i % imgs.length) + imgs.length) % imgs.length;
      var el = imgs[index];
      img.src = el.currentSrc || el.src;
      img.alt = el.alt || '';
      var caption = captionFor(el);
      captionEl.textContent = caption;
      captionEl.hidden = !caption;
      counterEl.textContent = single ? '' : (index + 1) + ' / ' + imgs.length;
      statusEl.textContent = 'Image ' + (index + 1) + ' of ' + imgs.length + (caption ? ': ' + caption : '');
    }

    function openAt(i) {
      lastFocus = document.activeElement;
      show(i);
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    }

    // Each image is wrapped in a real <button>: correct role and name for
    // assistive tech, Enter/Space and focusability for free, and the image
    // keeps its own semantics (the old code overwrote them with role="button").
    imgs.forEach(function (el, i) {
      var target = el.closest('picture') || el;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'osd-lightbox-trigger';
      btn.setAttribute('aria-label', el.alt ? 'View larger image: ' + el.alt : 'View larger image');
      btn.setAttribute('aria-haspopup', 'dialog');
      target.parentNode.insertBefore(btn, target);
      btn.appendChild(target);
      btn.addEventListener('click', function () { openAt(i); });
    });

    prevBtn.addEventListener('click', function () { show(index - 1); });
    nextBtn.addEventListener('click', function () { show(index + 1); });
    closeBtn.addEventListener('click', function () { dialog.close(); });

    // Escape is handled natively; arrows navigate while the dialog is open.
    dialog.addEventListener('keydown', function (e) {
      if (single) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      else if (e.key === 'Home') { e.preventDefault(); show(0); }
      else if (e.key === 'End') { e.preventDefault(); show(imgs.length - 1); }
    });

    // Click on the dark area (dialog itself or empty figure space) closes.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target === figureEl) dialog.close();
    });

    // Single close path for every way the dialog can close (button, Escape,
    // backdrop): release the scroll lock and hand focus back to the trigger.
    dialog.addEventListener('close', function () {
      document.documentElement.style.overflow = '';
      img.removeAttribute('src');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });

    // Swipe navigation on touch screens.
    var touchStartX = 0, touchStartY = 0;
    figureEl.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    figureEl.addEventListener('touchend', function (e) {
      if (single) return;
      var diffX = e.changedTouches[0].screenX - touchStartX;
      var diffY = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) show(index - 1); else show(index + 1);
      }
    }, { passive: true });
  })();

  // ── Stale job markers ─────────────────────────────────────────────────────
  // Freshness is decided client-side so it never depends on how recently the
  // site was built (builds can be weeks apart). Hugo renders every marker and
  // pre-shows only the ones already stale at build time (the no-JS baseline);
  // here we un-hide the rest once the posting crosses the threshold.
  (function () {
    var markers = document.querySelectorAll('[data-stale-check][data-posted]');
    if (!markers.length) return;
    var now = Date.now();
    markers.forEach(function (el) {
      var posted = Date.parse(el.getAttribute('data-posted'));
      if (isNaN(posted)) return;
      var days = parseInt(el.getAttribute('data-stale-days') || '90', 10) || 90;
      if (now - posted > days * 86400000) el.hidden = false;
    });
  })();

  // ── Expired job notices (issue #84) ───────────────────────────────────────
  // Same idea as stale markers: Hugo pre-shows notices whose application
  // deadline had already passed at build time; here we reveal the ones whose
  // deadline crossed since the last build. The deadline day itself still
  // counts as open (expiry starts the following day).
  (function () {
    var markers = document.querySelectorAll('[data-deadline-check][data-deadline]');
    if (!markers.length) return;
    var now = Date.now();
    markers.forEach(function (el) {
      var deadline = Date.parse(el.getAttribute('data-deadline'));
      if (isNaN(deadline)) return;
      if (now - deadline > 86400000) el.hidden = false;
    });
  })();
})();
