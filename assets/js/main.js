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

  // Reader display preferences (footer toggles): persist to localStorage and
  // reflect on <html>. The pre-paint script in baseof applies saved values
  // before first paint; this wires the controls and keeps their state in sync.
  (function () {
    var groups = document.querySelectorAll('[data-display-toggle]');
    if (!groups.length) return;

    var KEY = 'osd-display';
    var root = document.documentElement;
    var MIN = 0.8, MAX = 1.6, STEP = 0.1;

    // Each boolean pill maps to one <html> attribute.
    var TOGGLES = [
      { sel: '[data-toggle-contrast]', attr: 'data-contrast', value: 'more', key: 'contrast' },
      { sel: '[data-toggle-motion]', attr: 'data-motion', value: 'reduce', key: 'motion' },
      { sel: '[data-toggle-spacing]', attr: 'data-spacing', value: 'loose', key: 'spacing' },
      { sel: '[data-toggle-links]', attr: 'data-links', value: 'underline', key: 'links' }
    ];

    function readPrefs() {
      try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
    }
    function writePrefs(p) {
      try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* storage blocked */ }
    }

    function round1(n) { return Math.round(n * 10) / 10; }
    function clampSnap(v) {
      return Math.min(MAX, Math.max(MIN, round1(Math.round(v / STEP) * STEP)));
    }
    function scaleFrom(p) {
      return typeof p.textScale === 'number' ? clampSnap(p.textScale) : 1;
    }
    function applyScale(s) {
      if (Math.abs(s - 1) < 0.001) root.style.removeProperty('--user-text-scale');
      else root.style.setProperty('--user-text-scale', String(s));
    }

    var scale = scaleFrom(readPrefs());
    applyScale(scale);

    function render() {
      Array.prototype.forEach.call(groups, function (group) {
        TOGGLES.forEach(function (cfg) {
          var on = root.getAttribute(cfg.attr) === cfg.value;
          var b = group.querySelector(cfg.sel);
          if (b) b.setAttribute('aria-pressed', String(on));
        });
        var readout = group.querySelector('[data-text-readout]');
        if (readout) readout.textContent = Math.round(scale * 100) + '%';
        // Use aria-disabled (not the disabled property) at the bounds so the
        // control keeps keyboard focus; setScale() clamps, so it's a no-op.
        var dec = group.querySelector('[data-text-dec]');
        var inc = group.querySelector('[data-text-inc]');
        if (dec) dec.setAttribute('aria-disabled', String(scale <= MIN + 0.001));
        if (inc) inc.setAttribute('aria-disabled', String(scale >= MAX - 0.001));
      });
    }

    function setScale(next, anchor) {
      // Resizing the root font reflows the page; with the control in the footer
      // that shifts the viewport. Keep the clicked control fixed by compensating
      // the scroll (instant, so the global smooth-scroll doesn't animate it).
      var before = anchor ? anchor.getBoundingClientRect().top : 0;
      scale = clampSnap(next);
      applyScale(scale);
      var prefs = readPrefs();
      if (Math.abs(scale - 1) < 0.001) delete prefs.textScale;
      else prefs.textScale = scale;
      writePrefs(prefs);
      render();
      if (anchor) {
        var delta = anchor.getBoundingClientRect().top - before;
        if (delta) window.scrollBy({ top: delta, left: 0, behavior: 'instant' });
      }
    }

    function toggleAttr(cfg) {
      var on = root.getAttribute(cfg.attr) === cfg.value;
      var prefs = readPrefs();
      if (on) { root.removeAttribute(cfg.attr); delete prefs[cfg.key]; }
      else { root.setAttribute(cfg.attr, cfg.value); prefs[cfg.key] = cfg.value; }
      writePrefs(prefs);
      render();
    }

    Array.prototype.forEach.call(groups, function (group) {
      TOGGLES.forEach(function (cfg) {
        var b = group.querySelector(cfg.sel);
        if (b) b.addEventListener('click', function () { toggleAttr(cfg); });
      });
      var dec = group.querySelector('[data-text-dec]');
      var inc = group.querySelector('[data-text-inc]');
      var reset = group.querySelector('[data-text-reset]');
      if (dec) dec.addEventListener('click', function (e) { setScale(scale - STEP, e.currentTarget); });
      if (inc) inc.addEventListener('click', function (e) { setScale(scale + STEP, e.currentTarget); });
      if (reset) reset.addEventListener('click', function (e) { setScale(1, e.currentTarget); });
    });

    render();
  })();

  // Scroll to top button
  var btn = document.getElementById('scroll-to-top');
  if (btn) {
    var threshold = 400;
    function updateBtn() {
      btn.classList.toggle('visible', window.scrollY > threshold);
    }
    window.addEventListener('scroll', updateBtn, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    updateBtn();
  }

  // Close mobile menu on navigation
  document.querySelectorAll('details').forEach(function (d) {
    d.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        d.removeAttribute('open');
      });
    });
  });

  // Global search modal — custom UI on top of the Pagefind JS API.
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
        if (pagefind.options) pagefind.options({ excerptLength: 24 });
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
        setStatus('Search isn\u2019t available yet \u2014 it is generated when the site is built.');
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
        setStatus('Search isn\u2019t available yet \u2014 it is generated when the site is built.');
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

  // Lightbox for images inside rich content (articles, etc.)
  var imgs = Array.prototype.slice.call(document.querySelectorAll('main .prose img, main .osd-prose img'));
  if (imgs.length) {
    var overlay = document.createElement('div');
    overlay.className = 'osd-lightbox-backdrop';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image preview');
    overlay.innerHTML = [
      '<div class="osd-lightbox-panel">',
      '  <div class="osd-lightbox-topbar">',
      '    <div class="osd-lightbox-caption" id="osd-lb-cap"></div>',
      '    <div class="osd-lightbox-nav">',
      '      <span class="osd-lightbox-counter" id="osd-lb-counter"></span>',
      '      <button type="button" class="osd-lightbox-btn" id="osd-lb-prev" aria-label="Previous image">',
      '        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>',
      '      </button>',
      '      <button type="button" class="osd-lightbox-btn" id="osd-lb-next" aria-label="Next image">',
      '        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>',
      '      </button>',
      '      <button type="button" class="osd-lightbox-btn" id="osd-lb-close" aria-label="Close image preview">',
      '        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
      '      </button>',
      '    </div>',
      '  </div>',
      '  <div class="osd-lightbox-body" id="osd-lb-body">',
      '    <img id="osd-lb-img" alt="" />',
      '    <div class="osd-lightbox-swipe-hint" id="osd-lb-hint">Swipe to navigate</div>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    var cap = document.getElementById('osd-lb-cap');
    var counter = document.getElementById('osd-lb-counter');
    var img = document.getElementById('osd-lb-img');
    var closeBtn = document.getElementById('osd-lb-close');
    var prevBtn = document.getElementById('osd-lb-prev');
    var nextBtn = document.getElementById('osd-lb-next');
    var lastFocus = null;
    var index = 0;

    function updateCounter() {
      if (counter) counter.textContent = (index + 1) + ' / ' + imgs.length;
      if (prevBtn) prevBtn.style.visibility = imgs.length > 1 ? 'visible' : 'hidden';
      if (nextBtn) nextBtn.style.visibility = imgs.length > 1 ? 'visible' : 'hidden';
    }

    function openAt(i) {
      index = ((i % imgs.length) + imgs.length) % imgs.length;
      var el = imgs[index];
      if (!el) return;
      lastFocus = document.activeElement;
      img.src = el.currentSrc || el.src;
      img.alt = el.alt || '';
      if (cap) cap.textContent = el.alt || '';
      updateCounter();
      overlay.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('open');
      document.documentElement.style.overflow = '';
      img.removeAttribute('src');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function goPrev() { openAt(index - 1); }
    function goNext() { openAt(index + 1); }

    function onKey(e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); return; }
      // Keep keyboard focus trapped inside the dialog while it is open
      if (e.key === 'Tab') {
        var focusable = [closeBtn, prevBtn, nextBtn].filter(function (n) {
          return n && n.offsetParent !== null;
        });
        if (!focusable.length) return;
        var firstEl = focusable[0];
        var lastEl = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    imgs.forEach(function (el, i) {
      el.style.cursor = 'zoom-in';
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', (el.alt ? ('View larger image: ' + el.alt) : 'View larger image'));
      el.addEventListener('click', function (ev) { ev.preventDefault(); openAt(i); });
      el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openAt(i); } });
    });

    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);

    // Touch/swipe support for mobile
    var body = document.getElementById('osd-lb-body');
    var hint = document.getElementById('osd-lb-hint');
    if (body) {
      var touchStartX = 0, touchStartY = 0;
      body.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });
      body.addEventListener('touchend', function (e) {
        var diffX = e.changedTouches[0].screenX - touchStartX;
        var diffY = e.changedTouches[0].screenY - touchStartY;
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
          if (diffX > 0) goPrev(); else goNext();
          if (hint) hint.style.display = 'none';
        }
      }, { passive: true });
    }
  }
})();
