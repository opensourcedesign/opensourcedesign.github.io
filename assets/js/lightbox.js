/** Image lightbox for prose content. */
export function init() {
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
}
