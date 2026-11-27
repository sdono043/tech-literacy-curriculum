(function () {
  'use strict';

  // ---------- Storage (never required; the site works without it) ----------
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode etc. */ }
  }

  // ---------- Theme toggle ----------
  var root = document.documentElement;
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('vt-theme', next); } catch (e) {}
    });
  });

  // ---------- Progress ----------
  var DONE_KEY = 'vt-done';
  var done = load(DONE_KEY, []);
  function isDone(file) { return done.indexOf(file) !== -1; }
  function setDone(file, on) {
    done = done.filter(function (f) { return f !== file; });
    if (on) done.push(file);
    save(DONE_KEY, done);
    render();
  }

  var pathEl = document.getElementById('vt-path');
  var path = [];
  if (pathEl) { try { path = JSON.parse(pathEl.textContent); } catch (e) { path = []; } }

  function render() {
    // Complete buttons on module pages
    document.querySelectorAll('[data-complete]').forEach(function (btn) {
      var on = isDone(btn.getAttribute('data-complete'));
      btn.classList.toggle('is-done', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // Module cards on the home page
    document.querySelectorAll('[data-module-card]').forEach(function (card) {
      var on = isDone(card.getAttribute('data-module-card'));
      card.classList.toggle('is-done', on);
      var s = card.querySelector('[data-card-status]');
      if (s) s.textContent = on ? ' (completed)' : '';
    });

    if (!path.length) return;
    var core = path.filter(function (m) { return !m.extra && !m.prereq; });
    var prereqs = path.filter(function (m) { return m.prereq; });
    var count = core.filter(function (m) { return isDone(m.file); }).length;

    var countEl = document.querySelector('[data-progress-count]');
    if (countEl) countEl.textContent = count;
    var bar = document.querySelector('[data-progress-bar]');
    if (bar) {
      bar.setAttribute('aria-valuenow', count);
      bar.firstElementChild.style.width = (core.length ? (count / core.length) * 100 : 0) + '%';
    }

    document.querySelectorAll('[data-domain-progress]').forEach(function (el) {
      var id = Number(el.getAttribute('data-domain-progress'));
      var mods = core.filter(function (m) { return m.domain === id; });
      var d = mods.filter(function (m) { return isDone(m.file); }).length;
      el.textContent = d === mods.length && d > 0 ? 'Complete' : (d ? d + ' of ' + mods.length : mods.length + ' modules');
      el.parentElement.classList.toggle('is-complete', d === mods.length && d > 0);
    });

    // "Continue" button points at the first unfinished core module
    var started = count > 0 || prereqs.some(function (m) { return isDone(m.file); });
    var nextUp = prereqs.concat(core).filter(function (m) { return !isDone(m.file); })[0];
    document.querySelectorAll('[data-resume]').forEach(function (a) {
      var label = a.querySelector('[data-resume-label]');
      if (!nextUp) { a.href = '#path'; if (label) label.textContent = 'Review the modules'; return; }
      a.href = nextUp.url;
      if (!label) return;
      if (nextUp.prereq) label.textContent = 'Start here';
      else label.textContent = started ? 'Continue: Module ' + Number(nextUp.num) : 'Start Module 1';
    });
  }

  document.querySelectorAll('[data-complete]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-complete');
      setDone(f, !isDone(f));
    });
  });
  render();

  // ---------- Module page: put each "**Label:** value" in the info box on its own line ----------
  var body = document.querySelector('[data-module-body]');
  var meta = body && body.querySelector(':scope > h1:first-child + h2 + p');
  if (meta) {
    meta.classList.add('module-meta');
    Array.prototype.slice.call(meta.querySelectorAll(':scope > strong')).forEach(function (s, i) {
      if (i > 0) meta.insertBefore(document.createElement('br'), s);
    });
  }

  // ---------- Module page: table of contents ----------
  var toc = document.querySelector('[data-toc]');
  if (body && toc) {
    var heads = Array.prototype.filter.call(body.querySelectorAll('h2, h3'), function (h) {
      return h.id && !h.closest('.finish-card') && getComputedStyle(h).display !== 'none';
    });
    var list = document.createElement('ul');
    heads.forEach(function (h) {
      if (h.tagName === 'H3' && heads.length > 14) return; // keep long modules scannable
      var li = document.createElement('li');
      li.className = 'toc-' + h.tagName.toLowerCase();
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      list.appendChild(li);
    });
    if (list.children.length > 1) toc.appendChild(list);
    else { var aside = toc.closest('.module-toc'); if (aside) aside.remove(); }

    if ('IntersectionObserver' in window) {
      var links = toc.querySelectorAll('a');
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id); });
        });
      }, { rootMargin: '0px 0px -70% 0px' });
      heads.forEach(function (h) { obs.observe(h); });
    }
  }
})();
