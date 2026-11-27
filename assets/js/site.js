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

  // ---------- Code boxes that scroll sideways: let keyboard users scroll them too ----------
  function makeCodeScrollable() {
    document.querySelectorAll('.prose pre').forEach(function (pre) {
      if (pre.closest('.diagram')) return;
      if (pre.scrollWidth > pre.clientWidth + 1) {
        pre.setAttribute('tabindex', '0');
        pre.setAttribute('role', 'region');
        pre.setAttribute('aria-label', 'Code example (scrolls sideways)');
      } else {
        pre.removeAttribute('tabindex'); pre.removeAttribute('role'); pre.removeAttribute('aria-label');
      }
    });
  }
  makeCodeScrollable();
  var codeResizeTimer;
  window.addEventListener('resize', function () { clearTimeout(codeResizeTimer); codeResizeTimer = setTimeout(makeCodeScrollable, 200); });

  // ---------- Module page: clickable self-check (saved in this browser) ----------
  (function () {
    var article = document.querySelector('[data-module-file]');
    if (!article) return;
    var file = article.getAttribute('data-module-file');
    var head = article.querySelector('h2[id^="assessment"]');
    var list = head && head.nextElementSibling;
    while (list && list.tagName !== 'UL' && list.tagName !== 'H2') list = list.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;

    var KEY = 'vt-check:' + file;
    var checked = load(KEY, []);
    var items = Array.prototype.slice.call(list.children);
    list.classList.add('self-check');

    var status = document.createElement('p');
    status.className = 'self-check-status';
    status.setAttribute('aria-live', 'polite');
    list.parentNode.insertBefore(status, list);

    function update() {
      var n = items.filter(function (li) { return li.querySelector('input').checked; }).length;
      status.textContent = n === items.length
        ? 'All ' + n + ' checked — you\'re ready to mark this module complete.'
        : n + ' of ' + items.length + ' checked. Tick each one you can honestly do.';
      status.classList.toggle('is-complete', n === items.length);
      var finish = document.querySelector('.finish-card');
      if (finish) finish.classList.toggle('is-ready', n === items.length);
    }

    items.forEach(function (li, i) {
      var label = document.createElement('label');
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = checked.indexOf(i) !== -1;
      box.addEventListener('change', function () {
        checked = checked.filter(function (x) { return x !== i; });
        if (box.checked) checked.push(i);
        save(KEY, checked);
        update();
      });
      var text = document.createElement('span');
      while (li.firstChild) text.appendChild(li.firstChild);
      label.appendChild(box);
      label.appendChild(text);
      li.appendChild(label);
    });
    update();
  })();

  // ---------- Module page: glossary pop-ups on the first mention of each term ----------
  (function () {
    var body = document.querySelector('[data-module-body]');
    var dataEl = document.getElementById('vt-glossary');
    if (!body || !dataEl) return;
    var terms;
    try { terms = JSON.parse(dataEl.textContent) || []; } catch (e) { return; }
    var base = window.VT_GLOSSARY_URL || '/glossary.html';

    function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function esc(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    var lookup = {}, words = [];
    terms.forEach(function (t) {
      [t.term].concat(t.aliases || []).forEach(function (w) { lookup[w.toLowerCase()] = t; words.push(w); });
    });
    words.sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp('(^|[^A-Za-z0-9_-])(' + words.map(esc).join('|') + ')(?![A-Za-z0-9_])', 'i');

    var SKIP = '.module-meta, code, pre, a, h1, h2, h3, h4, button, .term, .mermaid, svg, .self-check-status, .finish-card, .pager, script, style';
    var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var el = n.parentElement;
        if (!el || el.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    var used = {};
    nodes.forEach(function (node) {
      var guard = 0;
      while (node && guard++ < 20) {
        var m = re.exec(node.nodeValue);
        if (!m) return;
        var t = lookup[m[2].toLowerCase()];
        var start = m.index + m[1].length;
        if (!t || used[t.term]) {
          node = node.splitText(start + m[2].length);
          continue;
        }
        used[t.term] = true;
        var hit = node.splitText(start);
        var rest = hit.splitText(m[2].length);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'term';
        btn.setAttribute('data-term', t.term);
        btn.textContent = hit.nodeValue;
        hit.parentNode.replaceChild(btn, hit);
        node = rest;
      }
    });

    var byTerm = {};
    terms.forEach(function (t) { byTerm[t.term] = t; });
    var tip = document.createElement('div');
    tip.className = 'term-tip';
    tip.id = 'vt-term-tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    document.body.appendChild(tip);
    var current = null, hideTimer = null;

    function show(btn) {
      clearTimeout(hideTimer);
      var t = byTerm[btn.getAttribute('data-term')];
      if (!t) return;
      tip.innerHTML = '';
      var h = document.createElement('strong'); h.textContent = t.term;
      var p = document.createElement('p'); p.textContent = t.def;
      var a = document.createElement('a'); a.href = base + '#' + slug(t.term); a.textContent = 'Open in glossary →';
      tip.appendChild(h); tip.appendChild(p); tip.appendChild(a);
      tip.hidden = false;
      if (current && current !== btn) current.removeAttribute('aria-describedby');
      current = btn;
      btn.setAttribute('aria-describedby', 'vt-term-tip');
      var r = btn.getBoundingClientRect();
      var w = Math.min(320, window.innerWidth - 32);
      tip.style.width = w + 'px';
      var left = Math.max(16, Math.min(window.scrollX + r.left, window.scrollX + window.innerWidth - w - 16));
      tip.style.left = left + 'px';
      var below = r.bottom + 8;
      var th = tip.offsetHeight;
      var top = (below + th > window.innerHeight && r.top - th - 8 > 0) ? r.top - th - 8 : below;
      tip.style.top = (window.scrollY + top) + 'px';
    }
    function hide(now) {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        tip.hidden = true;
        if (current) current.removeAttribute('aria-describedby');
        current = null;
      }, now ? 0 : 180);
    }
    body.addEventListener('mouseover', function (e) { var b = e.target.closest('.term'); if (b) show(b); });
    body.addEventListener('mouseout', function (e) { if (e.target.closest('.term')) hide(); });
    body.addEventListener('focusin', function (e) { var b = e.target.closest('.term'); if (b) show(b); });
    body.addEventListener('focusout', function (e) { if (e.target.closest('.term') && !tip.contains(e.relatedTarget)) hide(); });
    body.addEventListener('click', function (e) {
      var b = e.target.closest('.term');
      if (!b) return;
      if (current === b && !tip.hidden) hide(true); else show(b);
    });
    tip.addEventListener('mouseover', function () { clearTimeout(hideTimer); });
    tip.addEventListener('mouseout', function () { hide(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(true); });
    document.addEventListener('click', function (e) {
      if (!tip.hidden && !e.target.closest('.term') && !tip.contains(e.target)) hide(true);
    });
  })();

  // ---------- Diagrams: render ```mermaid blocks in the site's colors ----------
  (function () {
    var codes = document.querySelectorAll('code.language-mermaid, .language-mermaid code');
    if (!codes.length) return;
    var blocks = [];
    Array.prototype.forEach.call(codes, function (code) {
      var wrap = code.closest('.language-mermaid') || code.closest('pre') || code;
      if (blocks.some(function (b) { return b.wrap === wrap; })) return;
      var fig = document.createElement('figure');
      fig.className = 'diagram';
      fig.setAttribute('data-src', code.textContent);
      var fallback = document.createElement('pre');
      fallback.className = 'diagram-fallback';
      fallback.textContent = code.textContent;
      fig.appendChild(fallback);
      wrap.parentNode.replaceChild(fig, wrap);
      blocks.push({ wrap: wrap, fig: fig });
    });

    function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    var seq = 0;
    function render() {
      var mm = window.mermaid;
      if (!mm) return;
      var dark = currentTheme() === 'dark';
      mm.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        fontFamily: 'Inter, system-ui, sans-serif',
        flowchart: { htmlLabels: true, curve: 'basis' },
        themeVariables: {
          darkMode: dark,
          background: cssVar('--bg2'),
          primaryColor: cssVar('--bg2'),
          primaryTextColor: cssVar('--text1'),
          primaryBorderColor: cssVar('--brand'),
          secondaryColor: cssVar('--brand-soft'),
          tertiaryColor: cssVar('--bg3'),
          lineColor: cssVar('--text3'),
          textColor: cssVar('--text1'),
          noteBkgColor: cssVar('--accent-soft'),
          noteTextColor: cssVar('--text1'),
          noteBorderColor: cssVar('--accent'),
          actorBkg: cssVar('--brand-soft'),
          actorBorder: cssVar('--brand'),
          actorTextColor: cssVar('--text1'),
          signalColor: cssVar('--text2'),
          signalTextColor: cssVar('--text1'),
          labelBoxBkgColor: cssVar('--bg2'),
          clusterBkg: cssVar('--bg3'),
          clusterBorder: cssVar('--border2'),
          edgeLabelBackground: cssVar('--bg2'),
          fontSize: '15px'
        }
      });
      // One at a time: Mermaid can fail when several renders overlap.
      blocks.reduce(function (chain, b) {
        return chain.then(function () {
          var id = 'vt-diagram-' + (++seq);
          return mm.render(id, b.fig.getAttribute('data-src')).then(function (out) {
            b.fig.innerHTML = out.svg;
            b.fig.classList.add('is-rendered');
          }).catch(function () { /* keep the text fallback */ });
        });
      }, Promise.resolve());
    }

    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js';
    s.onload = render;
    document.head.appendChild(s);

    // Re-draw when the theme changes so diagrams match light/dark mode.
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', render);
    }
  })();

  // ---------- Glossary page: filter ----------
  (function () {
    var input = document.querySelector('[data-gloss-filter]');
    if (!input) return;
    var entries = document.querySelectorAll('.gloss-entry');
    var groups = document.querySelectorAll('[data-gloss-group]');
    var empty = document.querySelector('[data-gloss-empty]');
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var any = false;
      entries.forEach(function (e) {
        var hit = !q || e.getAttribute('data-gloss-text').indexOf(q) !== -1;
        e.hidden = !hit; if (hit) any = true;
      });
      groups.forEach(function (g) { g.hidden = !g.querySelector('.gloss-entry:not([hidden])'); });
      if (empty) empty.hidden = any;
    });
  })();
})();
