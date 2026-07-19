/** Client-side stale/expired job notices (see layouts/jobs/single.html). */
export function init() {
  var stale = document.querySelectorAll('[data-stale-check][data-posted]');
  if (stale.length) {
    var now = Date.now();
    stale.forEach(function (el) {
      var posted = Date.parse(el.getAttribute('data-posted'));
      if (isNaN(posted)) return;
      var days = parseInt(el.getAttribute('data-stale-days') || '90', 10) || 90;
      if (now - posted > days * 86400000) el.hidden = false;
    });
  }

  var expired = document.querySelectorAll('[data-deadline-check][data-deadline]');
  if (expired.length) {
    var now2 = Date.now();
    expired.forEach(function (el) {
      var deadline = Date.parse(el.getAttribute('data-deadline'));
      if (isNaN(deadline)) return;
      if (now2 - deadline > 86400000) el.hidden = false;
    });
  }
}
