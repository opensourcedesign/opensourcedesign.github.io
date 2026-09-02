/**
 * Client-side filters for /jobs/ and /jobs/archive/ (compensation, category, search).
 * Loaded only on those pages to keep HTML lean.
 */
(function () {
  var list = document.getElementById('jobs-list');
  if (!list) return;

  var items = Array.prototype.slice.call(list.querySelectorAll('.job-item'));
  var countEl = document.getElementById('jobs-count');
  var input = document.getElementById('jobs-q');
  var clearBtn = document.getElementById('jobs-clear');
  var emptyEl = document.getElementById('jobs-empty');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.osd-filter'));
  var catButtons = Array.prototype.slice.call(document.querySelectorAll('.osd-cat'));
  var hasCats = catButtons.length > 0;

  var activeClasses = ['bg-slate-900', 'text-white', 'border-slate-900', 'dark:bg-slate-100', 'dark:text-slate-900', 'dark:border-slate-100'];
  var inactiveClasses = ['bg-white', 'text-slate-700', 'border-slate-200', 'dark:bg-slate-900', 'dark:text-slate-200', 'dark:border-slate-600'];

  function setPressed(activeComp) {
    buttons.forEach(function (btn) {
      var on = btn.getAttribute('data-comp') === activeComp;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) {
        activeClasses.forEach(function (c) { btn.classList.add(c); });
        inactiveClasses.forEach(function (c) { btn.classList.remove(c); });
      } else {
        activeClasses.forEach(function (c) { btn.classList.remove(c); });
        inactiveClasses.forEach(function (c) { btn.classList.add(c); });
      }
    });
  }

  function setCatPressed(activeCats) {
    catButtons.forEach(function (btn) {
      var on = activeCats.indexOf(btn.getAttribute('data-cat')) !== -1;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) {
        activeClasses.forEach(function (c) { btn.classList.add(c); });
        inactiveClasses.forEach(function (c) { btn.classList.remove(c); });
      } else {
        activeClasses.forEach(function (c) { btn.classList.remove(c); });
        inactiveClasses.forEach(function (c) { btn.classList.add(c); });
      }
    });
  }

  function getState() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('cat') || '';
    return {
      comp: params.get('comp') || 'all',
      q: params.get('q') || '',
      cats: cat ? cat.split(',').filter(Boolean) : [],
    };
  }

  function setState(next) {
    var params = new URLSearchParams(window.location.search);
    if (next.comp && next.comp !== 'all') params.set('comp', next.comp);
    else params.delete('comp');
    if (next.q) params.set('q', next.q);
    else params.delete('q');
    if (hasCats && next.cats && next.cats.length) params.set('cat', next.cats.join(','));
    else params.delete('cat');
    var qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? '?' + qs : ''));
  }

  function apply() {
    var state = getState();
    var q = (state.q || '').trim().toLowerCase();
    setPressed(state.comp);
    if (hasCats) setCatPressed(state.cats);
    if (input && input.value !== state.q) input.value = state.q;

    var shown = 0;
    items.forEach(function (li) {
      var comp = li.getAttribute('data-comp') || '';
      var cats = (li.getAttribute('data-cats') || '').split(' ').filter(Boolean);
      var hay =
        (li.getAttribute('data-title') || '') +
        ' ' +
        (li.getAttribute('data-org') || '') +
        ' ' +
        (li.getAttribute('data-tags') || '');
      var okComp = state.comp === 'all' || comp === state.comp;
      var okCat = !hasCats || !state.cats.length || state.cats.some(function (c) { return cats.indexOf(c) !== -1; });
      var okQ = !q || hay.indexOf(q) !== -1;
      var show = okComp && okCat && okQ;
      li.style.display = show ? '' : 'none';
      if (show) shown++;
    });

    if (countEl) countEl.textContent = String(shown);
    if (emptyEl) emptyEl.classList.toggle('hidden', shown !== 0);
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = getState();
      next.comp = btn.getAttribute('data-comp') || 'all';
      setState(next);
      apply();
    });
  });

  catButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = getState();
      var id = btn.getAttribute('data-cat');
      var i = next.cats.indexOf(id);
      if (i === -1) next.cats.push(id);
      else next.cats.splice(i, 1);
      setState(next);
      apply();
    });
  });

  if (input) {
    input.addEventListener('input', function () {
      var next = getState();
      next.q = input.value || '';
      setState(next);
      apply();
    });
  }
  if (clearBtn && input) {
    clearBtn.addEventListener('click', function () {
      var next = getState();
      next.q = '';
      setState(next);
      input.value = '';
      apply();
      input.focus();
    });
  }

  apply();
})();
