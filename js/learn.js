/* ============================================================
   learn.js — the Learn tab's widgets: nothing here is only read.

   A station's learn.interact lists them, each with `after` (the exam bullet it follows,
   or none for the end of the list) and a `type`:
     letters   the seven characteristics as tiles that open one at a time
     finder      a photograph with numbered pins: find the features that place the group.
                 A found feature is named in the column beside the picture and joined to
                 its pin by a ruled leader line, the way a labelled figure is drawn, so no
                 label ever sits on the picture or on another label. A labelled diagram of
                 the same body plan can sit under the photograph.
     drawphotos  two real drawings of one specimen, photographed: find the faults on the
                 one that would not score, and read what the other did instead
     dna         a DNA alignment the way MEGA shows one — dots, differences, counts
     keyrun      a dichotomous key run one step at a time, beside the same key printed
     binomial    a scientific name built and checked as it is typed
     kingdoms    five cards; each lights its kingdom on the tree and shows its features
     table       a comparison table
     photo       a photograph with its credit
   Also exported for the questions: seqView, keyPrint, svgFor (the labelled diagrams).
   ============================================================ */
(function (global) {
  'use strict';

  function h(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  var T = global.TREE || { groups: [] };
  var GROUP = {};
  (T.groups || []).concat(T.viruses ? [T.viruses] : []).forEach(function (g) { GROUP[g.id] = g; });

  function head(title, ask, tryWord) {
    var d = h('div', 'widget__h', esc(title) + (tryWord ? '<span class="widget__try">' + esc(tryWord) + '</span>' : ''));
    var frag = document.createDocumentFragment(); frag.appendChild(d);
    if (ask) frag.appendChild(h('p', 'widget__ask', ask));
    return frag;
  }
  /* ---------- the seven small animations ---------- */
  var ICON = {
    move: '<svg viewBox="0 0 64 48"><g class="an-swim" fill="#0E4D5C"><path d="M12 24 C22 8 42 8 52 24 C42 40 22 40 12 24Z"/><path d="M50 24 L62 15 L62 33Z"/><circle cx="22" cy="21" r="2.2" fill="#fff"/></g></svg>',
    resp: '<svg viewBox="0 0 64 48"><circle class="an-cell" cx="32" cy="24" r="15" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><g fill="#F5A623"><circle class="an-spark" cx="32" cy="24" r="4"/><circle class="an-spark" cx="24" cy="18" r="2.5"/><circle class="an-spark" cx="40" cy="30" r="2.5"/></g></svg>',
    sens: '<svg viewBox="0 0 64 48"><path d="M6 24 C18 6 46 6 58 24 C46 42 18 42 6 24Z" fill="#fff" stroke="#0E4D5C" stroke-width="2"/><circle cx="32" cy="24" r="10" fill="#8AD8FF" stroke="#0E4D5C" stroke-width="1.5"/><circle class="an-pupil" cx="32" cy="24" r="5.5" fill="#0B1F2A"/></svg>',
    grow: '<svg viewBox="0 0 64 48"><path d="M4 44 H60" stroke="#8A5A0E" stroke-width="2"/><path class="an-stem" d="M32 44 C32 34 32 26 32 12" stroke="#3D7A1F" stroke-width="2.5" fill="none"/><g class="an-leaf" fill="#8EE6A2" stroke="#3D7A1F" stroke-width="1.2"><path d="M32 30 C22 30 16 22 18 16 C26 16 32 22 32 30Z"/><path d="M32 22 C42 22 48 14 46 8 C38 8 32 14 32 22Z"/></g></svg>',
    repro: '<svg viewBox="0 0 64 48"><circle class="an-split-l" cx="32" cy="24" r="11" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><circle class="an-split-r" cx="32" cy="24" r="11" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><circle class="an-split-l" cx="32" cy="24" r="3.5" fill="#0E4D5C"/><circle class="an-split-r" cx="32" cy="24" r="3.5" fill="#0E4D5C"/></svg>',
    excr: '<svg viewBox="0 0 64 48"><path d="M20 6 H44 C50 6 50 30 32 30 C14 30 14 6 20 6Z" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><g class="an-drop" fill="#8AD8FF" stroke="#0B6E8C" stroke-width="1"><path d="M32 30 C28 36 26 38 26 41 A6 6 0 0 0 38 41 C38 38 36 36 32 30Z"/></g></svg>',
    nutr: '<svg viewBox="0 0 64 48"><circle cx="42" cy="24" r="15" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><g fill="#8A5A0E"><circle class="an-in" cx="8" cy="24" r="3"/><circle class="an-in" cx="8" cy="18" r="2.2"/><circle class="an-in" cx="8" cy="30" r="2.2"/></g></svg>'
  };

  /* ---------- letters: MRS GREN ---------- */
  function letters(spec) {
    var box = h('div', 'widget');
    box.appendChild(head(spec.title || 'The seven characteristics', spec.ask || 'Open each letter. Notice the first word of every definition: it is the one the examiner looks for.', 'Click each letter'));
    var grid = h('div', 'letters'), open = h('div', 'letters__open'); open.hidden = true;
    var seen = {}, tiles = [];
    function keyify(def, keys, first) {
      var s = esc(def);
      (keys || []).slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (k) {
        s = s.replace(new RegExp('(' + esc(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i'), '<u>$1</u>');
      });
      if (first) s = s.replace(new RegExp('(<u>)?(' + esc(first).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(</u>)?', 'i'), '<b class="lt__first">$2</b>');
      return s;
    }
    spec.items.forEach(function (it, i) {
      var t = h('button', 'lt'); t.type = 'button'; t.setAttribute('aria-expanded', 'false');
      t.innerHTML = '<span class="lt__l">' + esc(it.l) + '</span><span class="lt__w">' + esc(it.word) + '</span>';
      t.addEventListener('click', function () {
        var was = t.getAttribute('aria-expanded') === 'true';
        tiles.forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
        if (was) { open.hidden = true; return; }
        t.setAttribute('aria-expanded', 'true'); t.classList.add('is-seen'); seen[i] = 1;
        open.innerHTML = '<span class="lt__ico">' + (ICON[it.icon] || '') + (it.cap ? '<small>' + esc(it.cap) + '</small>' : '') + '</span><div>' +
          '<p class="lt__def"><b>' + esc(it.word) + '</b> is ' + keyify(it.def, it.key, it.first) + '.</p>' +
          (it.first ? '<p class="lt__firstline">The first word to remember: <b>' + esc(it.first) + '</b>' + (it.firstWhy ? ' — ' + esc(it.firstWhy) : '') + '</p>' : '') +
          (it.eg ? '<p class="lt__firstline">' + esc(it.eg) + '</p>' : '') +
          (it.old ? '<p class="lt__old">Older wording you may still see on slides: ' + esc(it.old) + '</p>' : '') + '</div>';
        open.hidden = false;
        bar();
      });
      grid.appendChild(t); tiles.push(t);
    });
    var barEl = h('div', 'letters__bar');
    function bar() {
      var n = Object.keys(seen).length;
      barEl.innerHTML = '<span>' + n + ' of ' + spec.items.length + ' opened</span><i><b style="width:' + (100 * n / spec.items.length) + '%"></b></i>' +
        (n === spec.items.length ? '<span class="widget__done">All seven — that is what "alive" means</span>' : '');
    }
    box.appendChild(grid); box.appendChild(open); box.appendChild(barEl); bar();
    return box;
  }

  /* a picture: the lab's own file (spec.img, with spec.credit and spec.url), or the tree's photograph of the group */
  function picture(spec) {
    var base, alt, credit, url;
    if (spec.img) { base = 'assets/photos/' + spec.img; alt = spec.alt || ''; credit = spec.credit || ''; url = spec.url || ''; }
    else {
      var g = GROUP[spec.group]; if (!g || !g.img) return null;
      base = 'assets/photos/' + spec.group; alt = spec.alt || g.img.alt || g.label; credit = g.img.credit; url = g.img.url;
    }
    var im = new Image();
    var wh = (global.PHOTO_SIZE || {})[base.replace('assets/photos/', '')];
    if (wh) { im.width = wh[0]; im.height = wh[1]; }   /* the box is reserved before the picture arrives */
    im.src = base + '-900.jpg';
    im.srcset = base + '-900.jpg 900w, ' + base + '-1400.jpg 1400w';
    im.sizes = '(max-width: 620px) 92vw, 520px';
    im.alt = alt; im.loading = 'lazy'; im.decoding = 'async';
    return { img: im, base: base, credit: (alt && !spec.img ? esc(alt) + ' · ' : '') + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(credit) + '</a>' : esc(credit)) };
  }

  /* ---------- pins on a picture, named in a column, joined by ruled lines ----------
     Used by the finder and by the drawings. Nothing is written on the picture: a pin carries a
     number, its name sits in a column beside the picture at the same height as the pin — the
     way a labelled figure is drawn — and clicking either rules a line between them. A second
     click takes the line away. Two lines are never allowed to cross: names are placed level
     with their pins, kept apart, and swapped if their lines would meet. Beside each found name
     is a close crop of the feature, for the ones a photograph shows small. */
  function pinned(box, stage, spotsIn, list, opts) {
    opts = opts || {};
    var spots = spotsIn.slice().sort(function (a, b) { return a.y - b.y; });   /* numbered top to bottom */
    var lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lines.setAttribute('class', 'pins__lines'); lines.setAttribute('aria-hidden', 'true');
    box.appendChild(lines);
    var found = {}, pins = [], items = [], zooms = [], Y = [], order = [];
    function stacked() {
      var sb = stage.getBoundingClientRect(), lb = list.getBoundingClientRect();
      return lb.top >= sb.bottom - 4;                 /* the column has dropped under the picture */
    }
    function crosses(a, b, c, d) {
      function ccw(p, q, r) { return (r.y - p.y) * (q.x - p.x) > (q.y - p.y) * (r.x - p.x); }
      return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
    }
    function layout() {
      var sb = stage.getBoundingClientRect(), lb = list.getBoundingClientRect();
      if (!sb.width || !sb.height || stacked()) {
        items.forEach(function (li) { li.style.position = ''; li.style.top = ''; });
        list.style.minHeight = ''; list.classList.remove('is-column'); drawLines(); return;
      }
      list.classList.add('is-column');
      var H = items.map(function (li) { return li.offsetHeight; }), gap = 6;
      var py = spots.map(function (sp) { return sb.top + sp.y / 100 * sb.height - lb.top; });
      var px = spots.map(function (sp) { return sb.left + sp.x / 100 * sb.width - lb.left; });
      order = spots.map(function (sp, i) { return i; }).sort(function (a, b) { return py[a] - py[b]; });
      function place() {
        var cur = 0, out = [];
        order.forEach(function (i) { var want = py[i] - H[i] / 2, y = Math.max(want, cur); out[i] = y; cur = y + H[i] + gap; });
        return out;
      }
      Y = place();
      for (var pass = 0; pass < 20; pass++) {
        var swapped = false;
        for (var k = 0; k < order.length && !swapped; k++) for (var m = k + 1; m < order.length && !swapped; m++) {
          var i = order[k], j = order[m];
          if (crosses({ x: px[i], y: py[i] }, { x: 0, y: Y[i] + H[i] / 2 }, { x: px[j], y: py[j] }, { x: 0, y: Y[j] + H[j] / 2 })) {
            order[k] = j; order[m] = i; swapped = true;
          }
        }
        Y = place();
        if (!swapped) break;
      }
      items.forEach(function (li, i) { li.style.position = 'absolute'; li.style.top = Y[i] + 'px'; });
      var bottom = Math.max.apply(null, items.map(function (li, i) { return Y[i] + H[i]; }));
      list.style.minHeight = Math.max(sb.height, bottom) + 'px';
      drawLines();
    }
    function drawLines() {
      var b = box.getBoundingClientRect(), sb = stage.getBoundingClientRect(), out = '';
      if (!b.width) return;
      lines.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
      lines.style.width = b.width + 'px'; lines.style.height = b.height + 'px';
      if (!stacked()) pins.forEach(function (pin, i) {
        if (!found[i]) return;
        var a = pin.getBoundingClientRect(), c = items[i].getBoundingClientRect();
        var x1 = a.left + a.width / 2 - b.left, y1 = a.top + a.height / 2 - b.top;
        var x2 = c.left - b.left, y2 = c.top + c.height / 2 - b.top;
        var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, r = a.width / 2;
        x1 += dx / len * r; y1 += dy / len * r;                 /* the line starts at the pin's rim, so the number stays readable */
        out += '<line class="pins__halo" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
               '<line class="pins__line" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>';
      });
      lines.innerHTML = out;
    }
    function zoomInto(i) {
      var z = zooms[i], sb = stage.getBoundingClientRect(); if (!z || !opts.zoom || !sb.width) return;
      var mag = 2.6, w = 64;
      z.style.backgroundImage = 'url("' + opts.zoom + '")';
      z.style.backgroundSize = (mag * sb.width) + 'px auto';
      z.style.backgroundPosition = (-(spots[i].x / 100 * mag * sb.width - w / 2)) + 'px ' + (-(spots[i].y / 100 * mag * sb.height - w / 2)) + 'px';
    }
    function toggle(i, on) {
      var now = on == null ? !found[i] : !!on;
      if (now === !!found[i]) return;
      if (now) { found[i] = 1; zoomInto(i); } else delete found[i];
      pins[i].classList.toggle('is-found', now); items[i].classList.toggle('is-found', now);
      pins[i].setAttribute('aria-pressed', now ? 'true' : 'false');
      layout();
      if (opts.onChange) opts.onChange(Object.keys(found).length, spots.length);
    }
    spots.forEach(function (sp, i) {
      var pin = h('button', 'pin' + (opts.pinClass ? ' ' + opts.pinClass : ''), String(i + 1)); pin.type = 'button';
      pin.style.left = sp.x + '%'; pin.style.top = sp.y + '%';
      pin.setAttribute('aria-label', (opts.pinWord || 'Spot') + ' ' + (i + 1) + ': ' + sp.label); pin.setAttribute('aria-pressed', 'false');
      pin.addEventListener('click', function () { toggle(i); });
      stage.appendChild(pin); pins.push(pin);
      var li = h('li', 'pins__item', '<span class="n">' + (i + 1) + '</span><span class="pins__txt"><b>' + esc(sp.label) + '</b>' + (sp.note ? '<small>' + esc(sp.note) + '</small>' : '') + '</span>' + (opts.zoom ? '<span class="pins__zoom" aria-hidden="true"></span>' : ''));
      li.setAttribute('role', 'button'); li.tabIndex = 0;
      li.addEventListener('click', function () { toggle(i); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } });
      list.appendChild(li); items.push(li); zooms.push(li.querySelector('.pins__zoom'));
    });
    var im = stage.querySelector('img');
    if (im) { im.addEventListener('load', layout); if (im.complete) setTimeout(layout, 0); }
    window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    setTimeout(layout, 50);
    return { toggle: toggle, layout: layout, count: function () { return Object.keys(found).length; },
             all: function (on) { spots.forEach(function (sp, i) { toggle(i, on); }); } };
  }

  /* ---------- finder: find the features on a photograph ---------- */
  function finder(spec) {
    var box = h('div', 'widget'); if (spec.group) box.setAttribute('data-group', spec.group);
    var g = GROUP[spec.group] || {};
    box.appendChild(head(spec.title || ('Find the features: ' + (g.label || '')), spec.ask || 'Click a numbered pin on the photograph, or its name beside it, and a line is ruled between them — the way a labelled figure is drawn. Click again to take the line away. The small picture beside a name is a close-up of that feature.', 'Click the pins'));
    var wrap = h('div', 'finder pins');
    var stage = h('div', 'finder__stage');
    var pic = picture(spec); if (pic) stage.appendChild(pic.img);
    var list = h('ul', 'finder__list');
    var left = h('div', 'finder__left'); left.appendChild(stage);
    var done = null;
    var ctl = pinned(wrap, stage, spec.spots, list, {
      zoom: pic ? pic.base + '-1400.jpg' : null,
      onChange: function (n, total) {
        all.textContent = n === total ? 'Hide every label' : 'Show every label';
        if (n === total && !done) { done = h('p', 'widget__done', spec.done || ('All ' + total + ' found. Those are the features that put it in this group.')); box.appendChild(done); }
        if (n < total && done) { done.remove(); done = null; }
      }
    });
    var tools = h('div', 'finder__tools');
    var all = h('button', 'wbtn wbtn--quiet', 'Show every label'); all.type = 'button';
    all.addEventListener('click', function () { ctl.all(ctl.count() < spec.spots.length); });
    tools.appendChild(all);
    if (pic && pic.credit) tools.appendChild(h('p', 'finder__credit', pic.credit));
    left.appendChild(tools);
    wrap.appendChild(left); wrap.appendChild(list);
    box.appendChild(wrap);
    /* the same body plan as a labelled diagram, under the photograph */
    if (spec.diagram && DIAGRAMS[spec.diagram]) {
      var dg = DIAGRAMS[spec.diagram];
      var dwrap = h('details', 'diag__wrap'); dwrap.open = true;
      dwrap.innerHTML = '<summary>The same body plan as a labelled diagram</summary>';
      var fig = h('figure', 'diag', dg.svg +
        (/grey label/.test(dg.caption) ? '<p class="diag__key"><b>Green</b> — a word you need for 0610. <i>Grey</i> — not needed; it is there only so the picture makes sense.</p>' : '') +
        '<figcaption>' + esc(dg.caption) + '</figcaption>');
      dwrap.appendChild(fig); box.appendChild(dwrap);
    }
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- drawphotos: two real drawings of one specimen ---------- */
  function drawphotos(spec) {
    var box = h('div', 'widget');
    box.appendChild(head(spec.title || 'One specimen, drawn twice', spec.ask || 'Both are real drawings of the same slice. Find every fault on the first — click the pins, or the faults beside it — then see what the second did instead.', 'Find the faults'));
    /* the one that loses marks: pins on it, its faults in a column beside it */
    var bad = h('div', 'dp2__block');
    bad.appendChild(h('div', 'dp__lab dp__lab--bad', '✗ ' + esc(spec.bad.title || 'This one loses marks') + ' — ' + spec.faults.length + ' faults to find'));
    var wrap = h('div', 'finder pins');
    var stage = h('div', 'finder__stage');
    var pic = picture(spec.bad); if (pic) stage.appendChild(pic.img);
    var list = h('ul', 'finder__list');
    var left = h('div', 'finder__left'); left.appendChild(stage);
    var done = null;
    var ctl = pinned(wrap, stage, spec.faults, list, { pinClass: 'pin--fault', pinWord: 'Fault', zoom: pic ? pic.base + '-1400.jpg' : null,
      onChange: function (n, total) {
        all.textContent = n === total ? 'Hide the faults' : 'Show every fault';
        if (n === total && !done) { done = h('p', 'widget__done', 'All ' + total + ' faults found. Each one is a mark lost on the criteria: ' + esc(spec.criteria || 'S, O, L, D1, D2') + '.'); bad.appendChild(done); }
        if (n < total && done) { done.remove(); done = null; }
      } });
    var tools = h('div', 'finder__tools');
    var all = h('button', 'wbtn wbtn--quiet', 'Show every fault'); all.type = 'button';
    all.addEventListener('click', function () { ctl.all(ctl.count() < spec.faults.length); });
    tools.appendChild(all);
    if (pic && pic.credit) tools.appendChild(h('p', 'finder__credit', pic.credit));
    left.appendChild(tools);
    wrap.appendChild(left); wrap.appendChild(list); bad.appendChild(wrap);
    /* the one that scores, with what it did instead */
    var good = h('div', 'dp2__block');
    good.appendChild(h('div', 'dp__lab dp__lab--good', '✓ ' + esc(spec.good.title || 'This one scores')));
    var gwrap = h('div', 'finder');
    var gstage = h('div', 'finder__stage');
    var gpic = picture(spec.good);
    if (gpic) { gstage.appendChild(gpic.img); gpic.img.style.cursor = 'zoom-in'; gpic.img.addEventListener('click', function () { if (global.LabLightbox) global.LabLightbox(gpic.img.currentSrc || gpic.img.src, spec.good.title || 'The drawing that scores', 'Drawing', gpic.credit); }); }
    var gleft = h('div', 'finder__left'); gleft.appendChild(gstage);
    if (gpic && gpic.credit) gleft.appendChild(h('p', 'finder__credit', gpic.credit));
    gwrap.appendChild(gleft);
    gwrap.appendChild(h('ul', 'dp2__fixes', (spec.fixes || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('')));
    good.appendChild(gwrap);
    box.appendChild(bad); box.appendChild(good);
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- drawphotos: two real drawings of one specimen ---------- */
  function drawphotos(spec) {
    var box = h('div', 'widget');
    box.appendChild(head(spec.title || 'One specimen, drawn twice', spec.ask || 'Both are real drawings of the same slice. Find every fault on the first — click the pins, or the faults in the list — then see what the second did instead.', 'Find the faults'));
    var wrap = h('div', 'drawphotos');
    var bad = h('div', 'dp2__half pins');
    bad.appendChild(h('div', 'dp__lab dp__lab--bad', '✗ ' + esc(spec.bad.title || 'This one loses marks') + ' — ' + spec.faults.length + ' faults to find'));
    var stage = h('div', 'finder__stage dp2__stage');
    var pic = picture(spec.bad); if (pic) stage.appendChild(pic.img);
    bad.appendChild(stage);
    var list = h('ul', 'finder__list dp2__list');
    bad.appendChild(list);
    if (pic && pic.credit) bad.appendChild(h('p', 'finder__credit', pic.credit));
    pinned(bad, stage, spec.faults, list, { pinClass: 'pin--fault', pinWord: 'Fault',
      onDone: function () { if (!box.querySelector('.widget__done')) box.appendChild(h('p', 'widget__done', 'All ' + spec.faults.length + ' faults found. Each one is a mark lost on the criteria: ' + esc(spec.criteria || 'S, O, L, D1, D2') + '.')); } });
    var good = h('div', 'dp2__half');
    good.appendChild(h('div', 'dp__lab dp__lab--good', '✓ ' + esc(spec.good.title || 'This one scores')));
    var gstage = h('div', 'finder__stage dp2__stage');
    var gpic = picture(spec.good);
    if (gpic) { gstage.appendChild(gpic.img); gpic.img.style.cursor = 'zoom-in'; gpic.img.addEventListener('click', function () { if (global.LabLightbox) global.LabLightbox(gpic.img.currentSrc || gpic.img.src, spec.good.title || 'The drawing that scores', 'Drawing', gpic.credit); }); }
    good.appendChild(gstage);
    good.appendChild(h('ul', 'dp2__fixes', (spec.fixes || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('')));
    if (gpic && gpic.credit) good.appendChild(h('p', 'finder__credit', gpic.credit));
    wrap.appendChild(bad); wrap.appendChild(good); box.appendChild(wrap);
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- dna: an alignment, the way MEGA shows one ---------- */
  function seqView(spec, opts) {
    opts = opts || {};
    var box = h('div', 'dna');
    var rows = spec.rows || [], ref = rows[0] ? rows[0].seq : '';
    var len = rows.reduce(function (m, r) { return Math.max(m, r.seq.length); }, 0);
    if (opts.tools !== false) {
      var tools = h('div', 'dna__tools');
      [['dots', 'Show identical bases as dots'], ['diff', 'Mark the differences'], ['count', 'Count the differences']].forEach(function (t) {
        var b = h('button', 'wbtn', t[1]); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          var on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          box.classList.toggle('is-' + t[0], on);
          if (t[0] === 'count') rank.hidden = !on;
        });
        tools.appendChild(b);
      });
      box.appendChild(tools);
    }
    var tbl = document.createElement('table');
    var ruler = h('tr', 'dna__ruler'); ruler.appendChild(h('th', null, spec.title ? esc(spec.title) : ''));
    for (var i = 0; i < len; i++) ruler.appendChild(h('td', null, (i === 0 || (i + 1) % 10 === 0) ? String(i + 1) : ''));
    ruler.appendChild(h('td'));
    tbl.appendChild(ruler);
    var counts = [];
    rows.forEach(function (r, ri) {
      var tr = document.createElement('tr');
      tr.appendChild(h('th', null, r.i ? '<i>' + esc(r.name) + '</i>' : esc(r.name)));
      var n = 0;
      for (var j = 0; j < len; j++) {
        var b = r.seq[j] || '-', same = ri > 0 && b === ref[j];
        if (ri > 0 && !same) n++;
        tr.appendChild(h('td', 'nt nt-' + b + (ri > 0 ? (same ? ' is-same' : ' is-diff') : ''), '<span>' + b + '</span>'));
      }
      tr.appendChild(h('td', 'dna__n', ri === 0 ? (rows.length > 1 ? 'reference' : '') : n + (n === 1 ? ' difference' : ' differences')));
      counts.push(n);
      tbl.appendChild(tr);
    });
    box.appendChild(tbl);
    var rank = h('ul', 'dna__rank'); rank.hidden = true;
    if (rows.length > 2) {
      var order = rows.map(function (r, i) { return i; }).slice(1).sort(function (a, b) { return counts[a] - counts[b]; });
      var mx = Math.max.apply(null, counts) || 1;
      rank.innerHTML = '<li><span style="font-weight:600">Closest to ' + esc(rows[0].name) + ' first</span><span></span><span></span></li>' + order.map(function (i) {
        return '<li><span>' + (rows[i].i ? '<i>' + esc(rows[i].name) + '</i>' : esc(rows[i].name)) + '</span><i><b style="width:' + (100 * (mx - counts[i]) / mx) + '%"></b></i><span class="r">' + counts[i] + ' diff.</span></li>';
      }).join('');
    }
    box.appendChild(rank);
    if (spec.note && !opts.quiet) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }
  function dna(spec) {
    var box = h('div', 'widget'); if (spec.group) box.setAttribute('data-group', spec.group);
    box.appendChild(head(spec.title || 'DNA base sequences', spec.ask || 'The same stretch of one gene in several organisms. Press the buttons: dots hide what is the same, so the differences stand out; then count them.', 'Press the buttons'));
    var v = seqView({ rows: spec.rows, title: spec.ruler || 'site' }, { tools: true });
    box.appendChild(v);
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- keys: printed, and run ---------- */
  function keyPrint(key, here) {
    var ol = h('ol', 'keyprint');
    (key.steps || []).forEach(function (s, i) {
      ['a', 'b'].forEach(function (side) {
        var o = s[side];
        var li = h('li', null, '<span class="kp__n">' + (i + 1) + side + '</span><span>' + esc(o.t) + '</span>' +
          '<span class="kp__go">' + (typeof o.go === 'number' ? 'go to ' + o.go : '<i>' + esc(o.go) + '</i>') + '</span>');
        li.setAttribute('data-step', String(i + 1));
        if (here === i + 1) li.classList.add('is-here');
        ol.appendChild(li);
      });
    });
    return ol;
  }
  function keyrun(spec) {
    var box = h('div', 'widget'); if (spec.group) box.setAttribute('data-group', spec.group);
    box.appendChild(head(spec.title || 'Use the key', spec.ask || 'Look at the specimen, then choose the statement that is true for it at each step. The key is printed on the right so you can see the same choices the way an exam prints them.', 'Choose a statement'));
    var wrap = h('div', 'keyrun');
    var left = h('div'), right = h('div');
    var sp = h('div', 'keyrun__spec');
    if (spec.specimen) { var pic = picture(spec.specimen); if (pic) sp.appendChild(pic.img); }
    sp.appendChild(h('div', null, '<b>The specimen</b>: ' + esc(spec.specimen ? spec.specimen.desc : '')));
    left.appendChild(sp);
    var run = h('div'); left.appendChild(run);
    var printed = h('div'); right.appendChild(printed);
    var path = [];
    function paint(step) {
      printed.innerHTML = ''; printed.appendChild(keyPrint(spec.key, step));
      run.innerHTML = '';
      var crumbs = h('div', 'keyrun__crumbs', path.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join(''));
      run.appendChild(crumbs);
      if (typeof step === 'string') {
        run.appendChild(h('div', 'keyrun__done', 'The key names it:<b><i>' + esc(step) + '</i></b>' +
          (spec.specimen && spec.specimen.name && spec.specimen.name !== step ? '<span style="color:var(--bad)">That is not this specimen. Start again and look more carefully at each step.</span>' : (spec.done ? esc(spec.done) : 'Every choice was a feature you could see. That is what a good key does.'))));
        var again = h('button', 'wbtn wbtn--quiet', 'Start again'); again.type = 'button'; again.style.marginTop = '8px';
        again.addEventListener('click', function () { path = []; paint(1); });
        run.appendChild(again);
        return;
      }
      var s = spec.key.steps[step - 1]; if (!s) return;
      run.appendChild(h('div', 'keyrun__step', 'Step ' + step + ' of ' + spec.key.steps.length));
      ['a', 'b'].forEach(function (side) {
        var b = h('button', 'keyrun__opt', '<b>' + step + side + '</b>' + esc(s[side].t)); b.type = 'button';
        b.addEventListener('click', function () { path.push(step + side + ' ' + s[side].t); paint(s[side].go); });
        run.appendChild(b);
      });
    }
    paint(1);
    wrap.appendChild(left); wrap.appendChild(right); box.appendChild(wrap);
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- binomial: build a name, watch the rules ---------- */
  function binomial(spec) {
    var box = h('div', 'widget');
    box.appendChild(head(spec.title || 'Build a scientific name', spec.ask || 'Type a genus and a species and watch the rules check themselves. Try one of the examples, then break a rule on purpose.', 'Type a name'));
    var wrap = h('div', 'binom');
    var gl = h('label', null, 'Genus'), sl = h('label', null, 'species');
    var gi = document.createElement('input'), si = document.createElement('input');
    gi.placeholder = 'Panthera'; si.placeholder = 'leo'; gi.autocomplete = si.autocomplete = 'off'; gi.spellcheck = si.spellcheck = false;
    gl.appendChild(gi); sl.appendChild(si);
    var out = h('div', 'binom__out');
    var pr = h('div', 'binom__card', '<small>Printed or typed</small><span class="binom__print"></span>');
    var hd = h('div', 'binom__card', '<small>Handwritten</small><span class="binom__hand"></span>');
    var ab = h('div', 'binom__card', '<small>After the first time</small><span class="binom__abbr"></span>');
    out.appendChild(pr); out.appendChild(hd); out.appendChild(ab);
    var rules = h('ul', 'binom__rules', '<li data-r="two">Two words: the genus, then the species</li><li data-r="cap">The genus starts with a capital letter</li><li data-r="low">The species is all lower case</li><li data-r="ital">Printed in italics, or underlined by hand</li>');
    var eg = h('p', 'binom__eg', 'Try: ' + (spec.examples || [['Panthera', 'leo'], ['Panthera', 'pardus'], ['Homo', 'sapiens'], ['Canis', 'lupus']]).map(function (e) { return '<button type="button" data-g="' + esc(e[0]) + '" data-s="' + esc(e[1]) + '">' + esc(e[0]) + ' ' + esc(e[1]) + '</button>'; }).join(' '));
    eg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; gi.value = b.getAttribute('data-g'); si.value = b.getAttribute('data-s'); paint(); });
    function paint() {
      var g = gi.value.trim(), s = si.value.trim();
      var two = !!(g && s && !/\s/.test(g) && !/\s/.test(s));
      var cap = !!g && g[0] === g[0].toUpperCase() && g[0] !== g[0].toLowerCase() && g.slice(1) === g.slice(1).toLowerCase();
      var low = !!s && s === s.toLowerCase();
      rules.querySelector('[data-r="two"]').className = g || s ? (two ? 'ok' : 'no') : '';
      rules.querySelector('[data-r="cap"]').className = g ? (cap ? 'ok' : 'no') : '';
      rules.querySelector('[data-r="low"]').className = s ? (low ? 'ok' : 'no') : '';
      rules.querySelector('[data-r="ital"]').className = g && s ? 'ok' : '';
      var G = g ? g[0].toUpperCase() + g.slice(1).toLowerCase() : '', S = s.toLowerCase();
      pr.querySelector('.binom__print').textContent = (G || 'Genus') + ' ' + (S || 'species');
      hd.querySelector('.binom__hand').innerHTML = '<u>' + esc(G || 'Genus') + '</u> <u>' + esc(S || 'species') + '</u>';
      ab.querySelector('.binom__abbr').textContent = (G ? G[0] + '.' : 'G.') + ' ' + (S || 'species');
    }
    gi.addEventListener('input', paint); si.addEventListener('input', paint); paint();
    wrap.appendChild(gl); wrap.appendChild(sl); wrap.appendChild(out); wrap.appendChild(rules); wrap.appendChild(eg);
    box.appendChild(wrap);
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- kingdoms: five cards, lit on the tree ---------- */
  function kingdoms(spec, ctx) {
    var box = h('div', 'widget');
    box.appendChild(head(spec.title || 'The five kingdoms', spec.ask || 'Open a kingdom. It lights on the tree, and its features appear here: the four the exam asks about, and what it eats.', 'Click a kingdom'));
    var row = h('div', 'kingdoms'), open = h('div', 'kingdoms__open'); open.hidden = true;
    var cards = [];
    spec.rows.forEach(function (k) {
      var c = h('button', 'kd', '<span class="kd__dot"></span><span class="kd__name">' + esc(k.name) + '</span>'); c.type = 'button';
      c.style.setProperty('--kc', 'var(--k-' + k.id + ')'); c.setAttribute('aria-pressed', 'false');
      c.setAttribute('data-group', k.id);
      c.addEventListener('click', function () {
        var was = c.getAttribute('aria-pressed') === 'true';
        cards.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        if (was) { open.hidden = true; if (ctx && ctx.home) ctx.home(); return; }
        c.setAttribute('aria-pressed', 'true');
        open.style.setProperty('--kc', 'var(--k-' + k.id + ')');
        open.innerHTML = '<h4>' + esc(k.name) + '</h4><dl>' + k.feats.map(function (f) { return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('') + '</dl>' +
          (k.eg ? '<p class="kd__eg"><b>For example</b> ' + esc(k.eg) + '</p>' : '');
        open.hidden = false;
        if (ctx && ctx.focus) ctx.focus(k.id);
      });
      row.appendChild(c); cards.push(c);
    });
    box.appendChild(row); box.appendChild(open);
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- table, photo ---------- */
  function table(spec) {
    var box = h('div', 'ctable'); if (spec.group) box.setAttribute('data-group', spec.group);
    box.innerHTML = '<table>' + (spec.caption ? '<caption>' + esc(spec.caption) + '</caption>' : '') +
      '<thead><tr>' + spec.head.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      spec.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<th scope="row">' + esc(c) + '</th>' : '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    return box;
  }
  function photo(spec) {
    var f = h('figure', 'photo'); if (spec.group) f.setAttribute('data-group', spec.group);
    var pic = picture(spec);
    if (pic) { f.appendChild(pic.img); pic.img.addEventListener('click', function () { if (global.LabLightbox) global.LabLightbox(pic.img.currentSrc || pic.img.src, spec.cap || '', 'Photograph', pic.credit); }); }
    f.appendChild(h('figcaption', null, (spec.cap ? esc(spec.cap) + ' · ' : '') + (pic ? pic.credit : '')));
    return f;
  }

  /* ---------- the labelled diagrams: one body plan per arthropod group ----------
     Drawn to the rules the drawing station teaches: one clean outline, no shading (three
     tints only tell the body parts apart), label lines ruled to a column, none crossing,
     a title. The counts are the syllabus counts. */
  var MX = 150;
  function mir(d, cx) {
    cx = cx || MX;
    return d.replace(/([MLC])((?:\s*-?[\d.]+\s+-?[\d.]+)+)/g, function (m, c, pts) {
      var out = pts.trim().split(/\s+/), r = [];
      for (var i = 0; i < out.length; i += 2) r.push((2 * cx - parseFloat(out[i])) + ' ' + out[i + 1]);
      return c + r.join(' ');
    });
  }
  function both(d, cx) { return '<path d="' + d + '"/><path d="' + mir(d, cx) + '"/>'; }
  function joints(pts, cx) { cx = cx || MX; return pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.7"/><circle cx="' + (2 * cx - p[0]) + '" cy="' + p[1] + '" r="1.7"/>'; }).join(''); }
  /* a label the syllabus does not ask a candidate to produce is drawn in grey, and the
     caption says so: the diagram completes the picture without adding to what must be learnt */
  function lab(x1, y1, x2, y2, text, anchor, extra) {
    if (anchor === 'extra') { extra = true; anchor = null; }
    return '<line class="diag__lead' + (extra ? ' diag__lead--extra' : '') + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/><text class="diag__lab' + (extra ? ' diag__lab--extra' : '') + '" x="' + (x2 + (anchor === 'end' ? -4 : 4)) + '" y="' + (y2 + 3.5) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + text + '</text>';
  }
  function segs21() { var s = ''; for (var i = 0; i < 21; i++) s += '<rect class="' + (i % 2 ? 'diag__thorax' : 'diag__abd') + '" x="' + (66 + 13 * i) + '" y="92" width="13" height="26" rx="2"/>'; return s; }
  function legs20() { var s = ''; for (var i = 0; i < 20; i++) { var x = 72.5 + 13 * i; s += '<path d="M' + x + ' 92 L' + (x - 3.5) + ' 76 L' + (x + 4.5) + ' 62"/><path d="M' + x + ' 118 L' + (x - 3.5) + ' 134 L' + (x + 4.5) + ' 148"/>'; } return s; }
  var DIAGRAMS = {
    insect: { caption: 'A generalised insect, from above: three body parts; three pairs of jointed legs and two pairs of wings, all on the thorax; one pair of antennae; compound eyes.',
      svg: '<svg viewBox="0 0 500 290" class="diag__svg" role="img" aria-label="A labelled diagram of a generalised insect from above">' +
        '<g class="diag__wing">' + both('M172 88 C236 62 284 100 278 148 C272 174 234 164 188 128 Z') + both('M172 112 C220 106 246 140 236 170 C228 184 200 166 180 134 Z') + '</g>' +
        '<g class="diag__legs">' + both('M170 74 L196 58 L214 66 L226 88') + both('M172 96 L202 98 L222 118 L230 140') + both('M170 118 L200 136 L216 166 L222 192') +
        joints([[196, 58], [214, 66], [202, 98], [222, 118], [200, 136], [216, 166]]) + '</g>' +
        '<g class="diag__ant">' + both('M158 33 L166 22 L176 12 L188 6') + joints([[166, 22], [176, 12]]) + '</g>' +
        '<ellipse class="diag__head" cx="150" cy="48" rx="20" ry="17"/>' +
        '<ellipse class="diag__eye" cx="135" cy="46" rx="6" ry="9"/><ellipse class="diag__eye" cx="165" cy="46" rx="6" ry="9"/>' +
        '<circle class="diag__eye" cx="147" cy="35" r="1.6"/><circle class="diag__eye" cx="150" cy="32" r="1.6"/><circle class="diag__eye" cx="153" cy="35" r="1.6"/>' +
        '<path class="diag__thorax" d="M128 66 C126 80 126 112 132 128 L168 128 C174 112 174 80 172 66 C164 60 136 60 128 66 Z"/><path class="diag__seg" d="M128 82 L172 82 M129 106 L171 106"/>' +
        '<path class="diag__abd" d="M150 128 C178 128 186 160 182 196 C178 226 162 242 150 242 C138 242 122 226 118 196 C114 160 122 128 150 128 Z"/>' +
        '<path class="diag__seg" d="M120 152 Q150 160 180 152 M118 172 Q150 180 182 172 M120 192 Q150 200 180 192 M126 212 Q150 220 174 212"/>' +
        lab(186, 8, 300, 12, 'antenna — one pair') + lab(171, 46, 300, 40, 'compound eye') + lab(172, 58, 300, 62, 'head') + lab(172, 68, 300, 90, 'thorax — legs and wings attach here') +
        lab(270, 140, 300, 150, 'forewing') + lab(236, 168, 300, 176, 'hindwing') + lab(216, 166, 300, 210, 'jointed leg — three pairs') + lab(182, 200, 300, 244, 'abdomen') +
        '<text class="diag__title" x="8" y="280">A generalised insect, from above</text></svg>' },
    arachnid: { caption: 'A spider, from above: two body parts — the cephalothorax and the abdomen — four pairs of jointed legs, simple eyes, and no antennae or wings. The grey labels are there to complete the picture; 0610 does not ask for them.',
      svg: '<svg viewBox="0 0 520 290" class="diag__svg" role="img" aria-label="A labelled diagram of a spider from above">' +
        '<g class="diag__legs">' + both('M176 92 L208 64 L240 52 L262 26') + both('M178 104 L214 100 L246 108 L272 96') + both('M178 116 L210 124 L236 144 L250 166') + both('M176 128 L204 152 L222 190 L228 224') +
        joints([[208, 64], [240, 52], [214, 100], [246, 108], [210, 124], [236, 144], [204, 152], [222, 190]]) + '</g>' +
        '<g class="diag__ant">' + both('M162 80 L176 62 L184 46') + joints([[176, 62]]) + '</g>' +
        '<rect class="diag__seg" x="145" y="137" width="10" height="10"/>' +
        '<ellipse class="diag__head" cx="150" cy="108" rx="27" ry="32"/>' +
        '<g class="diag__eye"><circle cx="140" cy="84" r="2"/><circle cx="147" cy="82" r="2"/><circle cx="153" cy="82" r="2"/><circle cx="160" cy="84" r="2"/><circle cx="137" cy="90" r="1.8"/><circle cx="163" cy="90" r="1.8"/><circle cx="144" cy="76" r="1.8"/><circle cx="156" cy="76" r="1.8"/></g>' +
        '<ellipse class="diag__abd" cx="150" cy="200" rx="42" ry="54"/><circle class="diag__seg" cx="146" cy="252" r="2.5"/><circle class="diag__seg" cx="154" cy="252" r="2.5"/>' +
        lab(184, 46, 300, 40, 'pedipalp — a feeler, not a leg', 'extra') + lab(161, 84, 300, 66, 'simple eyes — eight') + lab(170, 134, 300, 130, 'cephalothorax — head and thorax in one') +
        lab(236, 144, 300, 160, 'jointed leg — four pairs') + lab(188, 200, 300, 200, 'abdomen') + lab(154, 254, 300, 250, 'spinnerets', 'extra') +
        '<text class="diag__title" x="8" y="280">A spider, from above</text></svg>' },
    crustacean: { caption: 'A crab, from above: a hard exoskeleton over a two-part body (the abdomen is folded underneath), five pairs of legs of which the first is a claw, and two pairs of antennae. The grey label is there to complete the picture; 0610 does not ask for it.',
      svg: '<svg viewBox="0 0 560 290" class="diag__svg" role="img" aria-label="A labelled diagram of a crab from above">' +
        '<g class="diag__legs">' + both('M236 136 L268 130 L292 146 L306 172', 170) + both('M236 152 L270 154 L294 174 L304 202', 170) + both('M234 168 L266 178 L286 204 L292 232', 170) + both('M228 184 L256 200 L270 228 L272 256', 170) +
        joints([[268, 130], [292, 146], [270, 154], [294, 174], [266, 178], [286, 204], [256, 200], [270, 228]], 170) +
        both('M234 118 L264 106 L286 92', 170) + joints([[264, 106]], 170) + '</g>' +
        '<g class="diag__claw">' + both('M286 92 C296 76 318 74 326 84 C332 92 324 104 312 106 L302 108 C292 108 284 100 286 92 Z', 170) + both('M316 78 L336 70', 170) + '</g>' +
        '<g class="diag__ant">' + both('M164 74 L160 60', 170) + both('M196 80 L210 56', 170) + '</g>' +
        '<path class="diag__head" d="M104 150 C104 104 130 74 170 72 C210 74 236 104 236 150 C236 186 210 208 170 208 C130 208 104 186 104 150 Z"/>' +
        '<g class="diag__legs">' + both('M152 76 L148 62', 170) + '</g><circle class="diag__eye" cx="147" cy="58" r="4"/><circle class="diag__eye" cx="193" cy="58" r="4"/>' +
        lab(210, 56, 340, 30, 'antennae — two pairs, one short') + lab(196, 58, 340, 52, 'eye on a stalk', 'extra') + lab(326, 84, 340, 96, 'claw — the first pair of legs') +
        lab(220, 100, 340, 124, 'exoskeleton over the body') + lab(294, 174, 340, 180, 'walking legs — four more pairs') + lab(170, 206, 340, 232, 'the abdomen is folded under the body') +
        '<text class="diag__title" x="8" y="280">A crab, from above</text></svg>' },
    myriapod: { caption: 'A centipede, from above: a head with one pair of antennae, then many similar segments with one pair of jointed legs on each (a millipede has two pairs). The grey labels are there to complete the picture; 0610 does not ask for them.',
      svg: '<svg viewBox="0 0 450 210" class="diag__svg" role="img" aria-label="A labelled diagram of a centipede from above">' +
        '<g class="diag__legs">' + legs20() + '<path d="M332 105 L364 90 L392 96"/><path d="M332 105 L364 120 L392 114"/></g>' +
        '<g class="diag__ant"><path d="M34 99 L18 84 L8 66"/><path d="M34 111 L18 126 L8 144"/><circle cx="18" cy="84" r="1.7"/><circle cx="18" cy="126" r="1.7"/></g>' +
        '<g class="diag__claw"><path d="M36 96 C28 90 22 96 26 104"/><path d="M36 114 C28 120 22 114 26 106"/></g>' + segs21() +
        '<ellipse class="diag__head" cx="48" cy="105" rx="16" ry="13"/><g class="diag__eye"><circle cx="40" cy="99" r="1.4"/><circle cx="43" cy="96" r="1.4"/><circle cx="46" cy="94" r="1.4"/></g>' +
        lab(8, 66, 8, 44, 'one pair of antennae') + lab(48, 92, 48, 62, 'head') + lab(150, 92, 150, 44, 'a segment') + lab(247, 62, 247, 44, 'a pair of legs on every segment') +
        lab(26, 106, 26, 170, 'poison claws, under the head', 'extra') + lab(392, 114, 392, 170, 'last pair of legs, longer', 'end', true) +
        '<text class="diag__title" x="8" y="202">A centipede, from above</text></svg>' }
  };
  function svgFor(name) { return DIAGRAMS[name] ? DIAGRAMS[name].svg : ''; }

  var MAKERS = { letters: letters, finder: finder, drawphotos: drawphotos, dna: dna, keyrun: keyrun, binomial: binomial, kingdoms: kingdoms, table: table, photo: photo };
  global.Learn = {
    widget: function (spec, ctx) {
      var mk = MAKERS[spec.type];
      if (!mk) return h('p', 'widget__note', 'Unknown widget: ' + esc(spec.type));
      var el = mk(spec, ctx || {});
      if (spec.group && !el.getAttribute('data-group')) el.setAttribute('data-group', spec.group);
      return el;
    },
    seqView: seqView, keyPrint: keyPrint, svgFor: svgFor, DIAGRAMS: DIAGRAMS, ICON: ICON
  };
})(window);
