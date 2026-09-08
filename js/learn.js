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
          /* the warning that used to be repeated in a sentence below the widget: it belongs
             with the definition it is about, not a second time further down the page */
          (it.remember ? '<p class="lt__remember"><b>Remember</b> ' + esc(it.remember) + '</p>' : '') +
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

  /* How wide a picture is really drawn, measured across every widget at 390, 820, 1100 and
     1440 px: the widest is about 420. The old declaration said 520, which on a 1.5x screen
     asked for 780 and still fetched the 900w file, and on a 3x phone fetched the 1400w one.
     Saying the true width lets the browser pick the smaller file whenever it can. */
  var SIZES_ATTR = '(max-width: 620px) 92vw, 440px';

  /* Safari 14 and 15 decode WebP but cannot encode one, so this test says no for them and
     they keep their JPEGs. <picture> above handles them properly on its own; this flag is
     only for the two places that build a URL by hand. */
  var WEBP = (function () {
    try { var c = document.createElement('canvas'); c.width = c.height = 1;
          return !!c.toDataURL && c.toDataURL('image/webp').indexOf('data:image/webp') === 0; }
    catch (e) { return false; }
  })();
  function bigVariant(base) { return base + '-1400' + (WEBP ? '.webp' : '.jpg'); }

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
    /* Every photograph has had a WebP twin in the repo since the day it was added and nothing
       has ever asked for one — about a third of the bytes, for free. <picture> does the asking
       safely: a browser that cannot decode WebP simply never chooses that <source>.
       The build refuses to ship a base whose four variants are not all present, because a
       chosen <source> that 404s is a broken image, NOT a fall back to the <img>. */
    var pic = document.createElement('picture');
    var wp = document.createElement('source');
    wp.type = 'image/webp';
    wp.srcset = base + '-900.webp 900w, ' + base + '-1400.webp 1400w';
    wp.sizes = SIZES_ATTR;
    pic.appendChild(wp);
    im.src = base + '-900.jpg';
    im.srcset = base + '-900.jpg 900w, ' + base + '-1400.jpg 1400w';
    im.sizes = SIZES_ATTR;
    im.alt = alt; im.loading = 'lazy'; im.decoding = 'async';
    pic.appendChild(im);
    return { img: im, pic: pic, base: base, credit: (alt && !spec.img ? esc(alt) + ' · ' : '') + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(credit) + '</a>' : esc(credit)) };
  }

  /* every pinned picture on screen, so one listener can lay them all out again */
  var LIVE = [];
  window.addEventListener('resize', function () {
    for (var i = LIVE.length - 1; i >= 0; i--) {
      if (!LIVE[i].box.isConnected) { LIVE.splice(i, 1); continue; }
      LIVE[i].layout();
    }
  });

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
      /* Every label wants to sit exactly level with its pin, so its leader line comes out
         horizontal. Only labels that would overlap are moved, and then equally — one up, one
         down — so the pair stays centred on where they wanted to be and both lines stay close
         to level. Stacking them downwards, as this did at first, tilted every line below the
         first one. */
      function place() {
        var top = order.map(function (i) { return py[i] - H[i] / 2; });
        for (var pass = 0; pass < 80; pass++) {
          var moved = false;
          for (var k = 0; k + 1 < order.length; k++) {
            var over = (top[k] + H[order[k]] + gap) - top[k + 1];
            if (over > 0.5) { top[k] -= over / 2; top[k + 1] += over / 2; moved = true; }
          }
          if (top[0] < 0) { var d = -top[0]; for (var m = 0; m < top.length; m++) top[m] += d; moved = true; }
          /* The column may run past the foot of the picture. Squeezing it back inside would
             drag every label away from its pin and tilt the lines, which is the one thing
             this layout exists to avoid, so the widget simply grows instead. */
          if (!moved) break;
        }
        var out = [];
        order.forEach(function (i, k) { out[i] = top[k]; });
        return out;
      }
      Y = place();
      for (var pass2 = 0; pass2 < 20; pass2++) {
        var swapped = false;
        for (var k2 = 0; k2 + 1 < order.length && !swapped; k2++) {
          var i2 = order[k2], j2 = order[k2 + 1];
          if (crosses({ x: px[i2], y: py[i2] }, { x: 0, y: Y[i2] + H[i2] / 2 }, { x: px[j2], y: py[j2] }, { x: 0, y: Y[j2] + H[j2] / 2 })) {
            order[k2] = j2; order[k2 + 1] = i2; swapped = true;
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
        /* The last stretch into the name is horizontal, the way a ruled label line is drawn,
           and the rest is one straight run from the pin's rim to where that stretch starts. */
        var elbow = Math.min(38, Math.max(14, (x2 - x1) * 0.34));
        var xe = x2 - elbow;
        var dx = xe - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, r = a.width / 2 + 1;
        x1 += dx / len * r; y1 += dy / len * r;                 /* start at the pin's rim, so the number stays readable */
        var pts = x1 + ',' + y1 + ' ' + (xe > x1 ? xe : x1) + ',' + y2 + ' ' + x2 + ',' + y2;
        out += '<polyline class="pins__halo" points="' + pts + '"/><polyline class="pins__line" points="' + pts + '"/>';
      });
      lines.innerHTML = out;
    }
    /* The picture beside a found name is a close view of that feature — a window about a
       sixth of the picture wide, centred on the pin. Tighter than this (it was a twentieth)
       and every crop was an unreadable patch of pixels: a leg became blank paper, a thorax
       a black smudge. It is cropped from the 1400 px file, so it stays sharp. */
    var ZOOM_W = 64, ZOOM_FRAC = 0.13;
    function zoomInto(i) {
      var z = zooms[i], sb = stage.getBoundingClientRect(); if (!z || !opts.zoom || !sb.width) return;
      /* How much of the picture the close-up beside a name shows, as a fraction of its width.
         A quarter was far too wide for anything small: on the virus micrograph the particle,
         the host cell and the budding particles all came back as the same blue-and-yellow
         patch, which teaches nothing. The default is now tight, and a spot naming something
         LARGE — a whole cell, a body part that fills the frame — widens it with its own `z`,
         so the thing is still whole and still centred. */
      var frac = spots[i].z || ZOOM_FRAC;
      var bgW = ZOOM_W / frac, bgH = bgW * (sb.height / sb.width);
      /* A picture much wider than it is tall — the centipede, lying along its length — scales
         to a strip SHORTER than the crop window, and the window then fills with black above
         and below the animal. Grow the whole picture until the window fits inside it. */
      if (bgH < ZOOM_W) { bgW *= ZOOM_W / bgH; bgH = ZOOM_W; }
      z.style.backgroundImage = 'url("' + opts.zoom + '")';
      z.style.backgroundSize = bgW + 'px ' + bgH + 'px';
      /* The close-up is centred on the MIDDLE OF THE STRUCTURE, which is not always where the
         pin is. A pin has two other jobs — to point at the feature unambiguously and to keep
         clear of the other pins — so several of them sit deliberately off-centre, and a crop
         taken from the pin then shows the structure pushed to one side. cx/cy say where the
         middle actually is; without them the pin is used, which is right for most spots. */
      var cx = spots[i].cx != null ? spots[i].cx : spots[i].x;
      var cy = spots[i].cy != null ? spots[i].cy : spots[i].y;
      var x = cx / 100 * bgW - ZOOM_W / 2, y = cy / 100 * bgH - ZOOM_W / 2;
      x = Math.max(0, Math.min(x, bgW - ZOOM_W)); y = Math.max(0, Math.min(y, bgH - ZOOM_W));
      z.style.backgroundPosition = (-x) + 'px ' + (-y) + 'px';
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
      var pin = h('button', 'pin' + (opts.pinClass ? ' ' + opts.pinClass : '') + (sp.extra ? ' pin--extra' : ''), String(i + 1)); pin.type = 'button';
      pin.style.left = sp.x + '%'; pin.style.top = sp.y + '%';
      pin.setAttribute('aria-label', (opts.pinWord || 'Spot') + ' ' + (i + 1) + ': ' + sp.label); pin.setAttribute('aria-pressed', 'false');
      pin.addEventListener('click', function () { toggle(i); });
      stage.appendChild(pin); pins.push(pin);
      var li = h('li', 'pins__item' + (sp.extra ? ' pins__item--extra' : ''), '<span class="n">' + (i + 1) + '</span><span class="pins__txt"><b>' + esc(sp.label) + '</b>' +
        (sp.extra ? '<span class="pins__tag">not in 0610</span>' : '') +
        (sp.note ? '<small>' + esc(sp.note) + '</small>' : '') + '</span>' + (opts.zoom ? '<span class="pins__zoom" aria-hidden="true">' +
          /* Some structures are real but faint — a fish\u2019s lateral line is a row of pores you
             have to be told to look for. A spot can carry `mark`, drawn over its close-up in the
             close-up\u2019s own percentage coordinates, so the picture is never retouched: the line
             sits ON the photograph as an overlay, the way a pointer would. */
          (sp.mark ? '<svg class="pins__mark" viewBox="0 0 100 100" preserveAspectRatio="none">' +
            (sp.mark.line || []).map(function (l) {
              return '<line class="pins__markl" x1="' + l[0] + '" y1="' + l[1] + '" x2="' + l[2] + '" y2="' + l[3] + '"/>';
            }).join('') + '</svg>' : '') + '</span>' : ''));
      li.setAttribute('role', 'button'); li.tabIndex = 0;
      li.addEventListener('click', function () { toggle(i); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } });
      list.appendChild(li); items.push(li); zooms.push(li.querySelector('.pins__zoom'));
    });
    var im = stage.querySelector('img');
    if (im) { im.addEventListener('load', layout); if (im.complete) setTimeout(layout, 0); }
    /* One resize listener for the page, not one per widget. Each widget used to add its own
       and never take it away, so every station a student opened left more behind. LIVE holds
       the ones still on screen; anything detached is dropped the next time the window moves. */
    LIVE.push({ box: box, layout: layout });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    setTimeout(layout, 50);
    return { toggle: toggle, layout: layout, count: function () { return Object.keys(found).length; },
             all: function (on) { spots.forEach(function (sp, i) { toggle(i, on); }); } };
  }

  /* ---------- the body plan, two ways ----------
     One switch, two views of the same animal, and BOTH are labelled:

       · the diagram — drawn for this lab, every part in the open, nothing hidden by an angle
       · the scientific drawing — what the skill Paper 6 examines actually looks like on paper:
         one specimen, in outline, no shading for effect, ruled labels

     They teach different things. The diagram teaches where the parts are; the drawing shows
     what a good drawing of the same animal looks like, which is the thing being marked. The
     drawing is labelled with the same pins-and-ruled-lines the photograph uses, so a student
     reads all three the same way.

     Either view may be absent: a group with only a diagram simply shows it, with no switch. */
  function bodyPlan(spec) {
    var dg = spec.diagram && DIAGRAMS[spec.diagram];
    var dr = spec.drawing;
    if (!dg && !dr) return null;

    var wrap = h('details', 'diag__wrap'); wrap.open = true;
    wrap.innerHTML = '<summary>' + esc(spec.planSummary ||
      (dg && dr ? 'The same body plan — as a scientific drawing, and as a diagram'
                : dg ? (dg.summary || 'The same body plan as a labelled diagram')
                     : 'The same body plan as a scientific drawing')) + '</summary>';

    /* The DRAWING comes first. It is the thing being examined, and a student should meet the
       real skill before they meet a diagram made to explain the anatomy. */
    var views = [];
    if (dr) views.push(drawingView(dr));
    if (dg) {
      var fig = h('figure', 'diag', dg.svg +
        (/grey label/.test(dg.caption) ? '<p class="diag__key"><b>Green</b> — a word you need for 0610. <i>Grey</i> — not needed; it is there only so the picture makes sense.</p>' : '') +
        '<figcaption>' + esc(dg.caption) + '</figcaption>');
      views.push({ key: 'diagram', tab: 'Diagram',
                   hint: 'Drawn for this lab, so nothing is hidden by the angle.', el: fig });
    }

    var panels = h('div', 'plan__panels');
    views.forEach(function (v) { v.panel = h('div', 'plan__panel'); v.panel.appendChild(v.el); panels.appendChild(v.panel); });

    if (views.length > 1) {
      var tabs = h('div', 'plan__tabs'); tabs.setAttribute('role', 'tablist');
      views.forEach(function (v, i) {
        var b = h('button', 'plan__tab', esc(v.tab)); b.type = 'button';
        b.setAttribute('role', 'tab');
        b.addEventListener('click', function () { show(i); });
        v.btn = b; tabs.appendChild(b);
      });
      wrap.appendChild(tabs);
      var hint = h('p', 'plan__hint'); wrap.appendChild(hint);
      var show = function (i) {
        views.forEach(function (v, j) {
          var on = i === j;
          v.btn.classList.toggle('is-on', on);
          v.btn.setAttribute('aria-selected', on ? 'true' : 'false');
          v.panel.hidden = !on;
        });
        hint.textContent = views[i].hint || '';
        /* a picture in a hidden panel has no size, so its pins and ruled lines can only be
           placed once it is on screen */
        if (views[i].onShow) views[i].onShow();
      };
      wrap.appendChild(panels);
      show(0);
    } else {
      wrap.appendChild(panels);
      views[0].panel.hidden = false;
      if (views[0].onShow) views[0].onShow();
    }
    return wrap;
  }

  /* ---------- SOLD: how a biological drawing is marked ----------
     Size · Outline · Labels · Detail — four things, FIVE marks, because Detail carries two:
     one mark for the detail that is there, the second for going further. So a drawing that
     does everything else right and is plainly drawn scores 4, and the same drawing with the
     finer structures put in scores 5.

     It is shown small under each drawing, and the score is a judgement, not a decoration: a
     drawing that only earns one detail mark says so, and says what the second mark would have
     taken. That is the useful part — a student can see the gap. */
  var SOLD = [
    ['S', 'Size',    1, 'Large — it fills the space it is given. A small drawing cannot be labelled.'],
    ['O', 'Outline', 1, 'One continuous line. No sketching, no hairy lines, no shading for effect.'],
    ['L', 'Labels',  1, 'Ruled label lines, horizontal, touching the structure, never crossing, the names in a column.'],
    ['D', 'Detail',  2, 'Two marks. One for the main structures, all present and in proportion; the second for the finer structures that say which specimen this is.']
  ];
  function soldBadge(sp) {
    var d = Math.max(0, Math.min(2, sp.d == null ? 2 : sp.d));
    var have = [sp.s ? 1 : 0, sp.o ? 1 : 0, sp.l ? 1 : 0, d];
    var score = have.reduce(function (a, b) { return a + b; }, 0);
    var why = [sp.s, sp.o, sp.l, sp.dWhy];
    var box = h('div', 'sold');
    box.innerHTML =
      '<div class="sold__row"><b class="sold__score">SOLD ' + score + '/5</b>' +
      SOLD.map(function (c, i) {
        var full = have[i] === c[2];
        return '<span class="sold__c' + (have[i] ? (full ? ' is-on' : ' is-part') : '') + '">' +
               '<i>' + c[0] + '</i>' + esc(c[1]) +
               (c[2] === 2 ? ' ' + have[i] + '/2' : (have[i] ? ' \u2713' : ' \u2717')) + '</span>';
      }).join('') + '</div>' +
      '<details class="sold__more"><summary>how this drawing scores, and what the letters mean</summary><ul>' +
      SOLD.map(function (c, i) {
        var mark = c[2] === 2 ? (' <b class="sold__m">' + have[i] + ' of 2</b>')
                              : (' <b class="sold__m">' + have[i] + ' of 1</b>');
        return '<li><b>' + c[0] + ' — ' + esc(c[1]) + '</b>' + mark +
               '<br><span class="sold__rule">' + esc(c[3]) + '</span><br>' +
               (why[i] ? esc(why[i]) : '<i>not shown on this drawing</i>') +
               (c[2] === 2 && have[i] < 2 && sp.dNext
                  ? '<br><span class="sold__next">The second mark would need: ' + esc(sp.dNext) + '</span>' : '') +
               '</li>';
      }).join('') + '</ul></details>';
    return box;
  }

  /* a real scientific drawing, labelled the same way the photograph is */
  function drawingView(dr) {
    var fig = h('figure', 'plan__draw');
    var wrap = h('div', 'finder pins');
    var stage = h('div', 'finder__stage');
    var pic = picture(dr); if (pic) stage.appendChild(pic.pic);
    var list = h('ul', 'finder__list');
    var left = h('div', 'finder__left'); left.appendChild(stage);
    var ctl = pinned(wrap, stage, dr.spots || [], list, {
      zoom: pic ? bigVariant(pic.base) : null,
      pinWord: 'Label',
      onChange: function (n, total) { all.textContent = n === total ? 'Hide every label' : 'Show every label'; }
    });
    var tools = h('div', 'finder__tools');
    var all = h('button', 'wbtn wbtn--quiet', 'Show every label'); all.type = 'button';
    all.addEventListener('click', function () { ctl.all(ctl.count() < (dr.spots || []).length); });
    tools.appendChild(all);
    if (pic && pic.credit) tools.appendChild(h('p', 'finder__credit', pic.credit));
    wrap.appendChild(left); wrap.appendChild(list);
    fig.appendChild(wrap);
    /* BELOW the two columns, not inside the left one: a drawing that is much wider than it is
       tall leaves the name column taller than the picture, and the ruled lines were then drawn
       straight across the button and the credit. */
    fig.appendChild(tools);
    if (dr.sold) fig.appendChild(soldBadge(dr.sold));
    if (dr.caption) fig.appendChild(h('figcaption', null, esc(dr.caption)));
    return { key: 'drawing', tab: 'Scientific drawing', el: fig,
             hint: dr.hint || 'A real drawing of one specimen: outline only, no shading for effect, every label ruled and horizontal.',
             onShow: function () { ctl.layout(); setTimeout(ctl.layout, 60); } };
  }

  /* ---------- finder: find the features on a photograph ---------- */
  function finder(spec) {
    var box = h('div', 'widget'); if (spec.group) box.setAttribute('data-group', spec.group);
    var g = GROUP[spec.group] || {};
    box.appendChild(head(spec.title || ('Find the features: ' + (g.label || '')), spec.ask || 'Click a numbered pin on the photograph, or its name beside it, and a line is ruled between them — the way a labelled figure is drawn. Click again to take the line away. The small picture beside a name is a close-up of that feature.', 'Click the pins'));
    /* where the group sits in the ranks: the kingdom is examined, the rest is context */
    if (spec.taxon) box.appendChild(h('p', 'taxon', '<b>Where it sits</b>' + spec.taxon.map(function (t, i) {
      return '<span class="taxon__step' + (t.exam ? ' taxon__step--exam' : '') + '"><small>' + esc(t.rank) + '</small>' + esc(t.name) + '</span>';
    }).join('<i class="taxon__arrow">→</i>') + '<span class="taxon__note">0610 asks for the kingdom and the group; the ranks between them are here so you can see how they nest.</span>'));
    var wrap = h('div', 'finder pins');
    var stage = h('div', 'finder__stage');
    var pic = picture(spec); if (pic) stage.appendChild(pic.pic);
    var list = h('ul', 'finder__list');
    var left = h('div', 'finder__left'); left.appendChild(stage);
    var done = null;
    var ctl = pinned(wrap, stage, spec.spots, list, {
      zoom: pic ? bigVariant(pic.base) : null,
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
    /* the same body plan under the photograph — as a diagram, as a real drawing, or both */
    var plan = bodyPlan(spec);
    if (plan) box.appendChild(plan);
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
    var pic = picture(spec.bad); if (pic) stage.appendChild(pic.pic);
    var list = h('ul', 'finder__list');
    var left = h('div', 'finder__left'); left.appendChild(stage);
    var done = null;
    var ctl = pinned(wrap, stage, spec.faults, list, { pinClass: 'pin--fault', pinWord: 'Fault', zoom: pic ? bigVariant(pic.base) : null,
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
    if (gpic) { gstage.appendChild(gpic.pic); gpic.img.style.cursor = 'zoom-in'; gpic.img.addEventListener('click', function () { if (global.LabLightbox) global.LabLightbox(gpic.img.currentSrc || gpic.img.src, spec.good.title || 'The drawing that scores', 'Drawing', gpic.credit); }); }
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

    /* The evidence FIRST, then the question, then the numbers to check against. Asked before
       the sequences are on the screen, a student is guessing from what they already know about
       chimpanzees; asked after, they have had to look at the DNA — which is the entire point of
       the activity. */
    var v = seqView({ rows: spec.rows, title: spec.ruler || 'site' }, { tools: true });
    box.appendChild(v);

    if (spec.question) {
      var q = h('div', 'dnaq');
      q.appendChild(h('p', 'dnaq__ask', mk(spec.question.ask)));
      var opts = h('div', 'dnaq__opts');
      var out = h('p', 'dnaq__out');
      var answered = false;
      (spec.question.options || []).forEach(function (o) {
        var b = h('button', 'wbtn', esc(o)); b.type = 'button';
        b.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          var right = o === spec.question.answer;
          Array.prototype.forEach.call(opts.children, function (x) {
            x.disabled = true;
            if (x.textContent === spec.question.answer) x.classList.add('is-right');
            else if (x === b) x.classList.add('is-wrong');
          });
          out.className = 'dnaq__out ' + (right ? 'is-ok' : 'is-no');
          /* No list of the counts afterwards: "Count the differences" above will do it for
             them, so printing the same four numbers again is the answer twice. */
          out.innerHTML = (right ? '<b>Yes.</b> ' : '<b>Have another look at the rows.</b> ') + mk(spec.question.why);
        });
        opts.appendChild(b);
      });
      q.appendChild(opts); q.appendChild(out);
      box.appendChild(q);
    }
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- the same tree twice: cladogram beside phylogenetic tree ----------
     Four apes, one branching order, two drawings. In the first the rungs are evenly spaced
     and mean nothing; in the second each rung sits at the time the split happened. Putting
     them side by side is the whole explanation — the shapes differ, the ORDER does not. */
  function cladoCompare(c) {
    var tips = c.tips || [], splits = c.splits || [];       /* splits: [{at: mya, joins: i}] oldest last */
    var W = 300, H = 214, PAD = 46, TOP = 42, FOOT = 30;
    var xOf = function (i) { return PAD + i * ((W - 2 * PAD) / Math.max(1, tips.length - 1)); };
    var maxMya = c.maxMya || 18;

    function draw(rowY, kind, top) {
      var T = top == null ? TOP : top;
      /* rowY(k) gives the y of split k; everything else is shared, which is the point */
      var out = '';
      var xm = [];                                          /* x of each split, right to left */
      for (var k = splits.length - 1; k >= 0; k--) xm[k] = 0;
      /* the ladder: split 0 joins the last two tips, each later one adds the tip to its left */
      var acc = (xOf(tips.length - 2) + xOf(tips.length - 1)) / 2;
      xm[0] = acc;
      for (var k = 1; k < splits.length; k++) { acc = (xOf(tips.length - 2 - k) + acc) / 2; xm[k] = acc; }
      /* tips */
      tips.forEach(function (t, i) {
        var joins = i >= tips.length - 2 ? 0 : (tips.length - 2 - i);
        out += '<line class="cc__tw" x1="' + xOf(i) + '" y1="' + T + '" x2="' + xOf(i) + '" y2="' + rowY(joins) + '"/>';
        out += '<text class="cc__tip" x="' + xOf(i) + '" y="' + (TOP - 9) + '">' + esc(t) + '</text>';
      });
      /* rungs */
      for (var k = 0; k < splits.length; k++) {
        var y = rowY(k);
        var left = k === 0 ? xOf(tips.length - 2) : xm[k - 1];
        var right = k === 0 ? xOf(tips.length - 1) : xOf(tips.length - 2 - k);
        out += '<line class="cc__bar" x1="' + Math.min(left, right) + '" y1="' + y + '" x2="' + Math.max(left, right) + '" y2="' + y + '"/>';
        if (k > 0) out += '<line class="cc__bar" x1="' + xm[k - 1] + '" y1="' + rowY(k - 1) + '" x2="' + xm[k - 1] + '" y2="' + y + '"/>';
        out += '<circle class="cc__dot' + (kind === 'time' ? ' cc__dot--time' : '') + '" cx="' + xm[k] + '" cy="' + y + '" r="4.5"/>';
        if (kind === 'time')
          out += '<text class="cc__mya" x="' + (xm[k] - 9) + '" y="' + (y + 4) + '">' + splits[k].at + '</text>';
      }
      out += '<line class="cc__bar" x1="' + xm[splits.length - 1] + '" y1="' + rowY(splits.length - 1) +
             '" x2="' + xm[splits.length - 1] + '" y2="' + (rowY(splits.length - 1) + 14) + '"/>';
      return out;
    }

    var even = function (k) { return TOP + 34 + k * 34; };
    var timeY = function (k) { return TOP + 18 + (splits[k].at / maxMya) * (H - TOP - FOOT - 26); };

    var wrap = h('div', 'cc');
    wrap.innerHTML =
      '<div class="cc__one">' +
        '<div class="cc__h">Cladogram</div>' +
        '<svg class="cc__svg" viewBox="0 0 ' + W + ' ' + H + '" aria-label="The same four apes drawn as a cladogram, rungs evenly spaced">' +
          draw(even, 'even') +
          '<text class="cc__foot" x="' + (W / 2) + '" y="' + (H - 8) + '">rungs evenly spaced — the heights mean nothing</text>' +
        '</svg>' +
      '</div>' +
      '<div class="cc__one">' +
        '<div class="cc__h cc__h--time">Phylogenetic tree</div>' +
        '<svg class="cc__svg" viewBox="0 0 ' + W + ' ' + H + '" aria-label="The same four apes drawn as a phylogenetic tree, each split at the time it happened">' +
          '<line class="cc__axis" x1="30" y1="' + (TOP + 18) + '" x2="30" y2="' + (H - FOOT + 2) + '"/>' +
          /* a scale with real ticks, or the numbers on the rungs are just decoration */
          [0, 5, 10, 15].map(function (t) {
            var y = TOP + 18 + (t / maxMya) * (H - TOP - FOOT - 26);
            return '<line class="cc__tick" x1="30" y1="' + y + '" x2="' + (W - 8) + '" y2="' + y + '"/>' +
                   '<text class="cc__ticks" x="26" y="' + (y + 3.5) + '">' + t + '</text>';
          }).join('') +
          '<text class="cc__axist" x="9" y="' + ((TOP + H) / 2) + '" transform="rotate(-90 9 ' + ((TOP + H) / 2) + ')">million years ago</text>' +
          '<text class="cc__now" x="' + (W - 8) + '" y="' + (TOP + 13) + '">today</text>' +
          draw(timeY, 'time', TOP + 18) +
          '<text class="cc__foot" x="' + (W / 2) + '" y="' + (H - 8) + '">each rung sits at the time that split happened</text>' +
        '</svg>' +
      '</div>';
    var note = h('p', 'cc__say', mk(c.say || ''));
    var box2 = h('div', 'ccwrap');
    box2.appendChild(h('div', 'cc__title', esc(c.title || 'The same four apes, drawn twice')));
    box2.appendChild(wrap); box2.appendChild(note);
    return box2;
  }

  function clado(spec) {
    var box = h('div', 'widget'); if (spec.group) box.setAttribute('data-group', spec.group);
    box.appendChild(head(spec.title || 'Reading a phylogenetic tree',
      spec.ask || 'Every place two lines meet is a common ancestor. Down the page is back in time. Click a junction to light the groups that share it.', 'Click a junction'));

    var tips = spec.tips || [];                 /* left to right along the top */
    var nodes = spec.nodes || [];               /* {at: depth 1..n, from: tip index, to: tip index, of: 'name'} */
    var W = 640, PAD = 46, TOP = 56, ROW = 30;
    var depth = nodes.reduce(function (a, n) { return Math.max(a, n.at); }, 1);
    var H = TOP + (depth + 1) * ROW + 26;
    var xOf = function (i) { return PAD + i * ((W - 2 * PAD) / Math.max(1, tips.length - 1)); };
    var yOf = function (d) { return TOP + d * ROW; };

    var svg = '<svg class="clado__svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      esc(spec.alt || 'A phylogenetic tree of the primates') + '">';
    /* time arrow down the left */
    svg += '<line class="clado__axis" x1="16" y1="' + (TOP - 12) + '" x2="16" y2="' + (H - 18) + '"/>' +
           '<polygon class="clado__arrow" points="16,' + (H - 12) + ' 12,' + (H - 22) + ' 20,' + (H - 22) + '"/>' +
           '<text class="clado__axist" x="10" y="' + ((TOP + H) / 2) + '" transform="rotate(-90 10 ' + ((TOP + H) / 2) + ')">longer ago</text>';
    /* A junction joins exactly TWO things, and the drawing has to show that. Drawn from the
       leftmost to the rightmost tip of the whole clade, every bar reached out to the last tip
       and no fork ever closed — which is what made the right-hand side look as if something
       else were going on over there. Each junction is now a bar between its two children, and
       its own position is where those two meet. */
    function kidsOf(n) {
      var inner = null;
      for (var i = 0; i < nodes.length; i++)
        if (nodes[i].from === n.from + 1 && nodes[i].to === n.to) inner = nodes[i];
      return inner ? [{ tip: n.from }, { node: inner }] : [{ tip: n.from }, { tip: n.to }];
    }
    var xMemo = {};
    function xOfNode(n) {
      var key = n.from + ':' + n.to;
      if (xMemo[key] != null) return xMemo[key];
      var k = kidsOf(n);
      xMemo[key] = (xAt(k[0]) + xAt(k[1])) / 2;
      return xMemo[key];
    }
    function xAt(c) { return c.tip != null ? xOf(c.tip) : xOfNode(c.node); }
    function yAt(c) { return c.tip != null ? (TOP - 16) : yOf(c.node.at); }

    /* the tips: a name, and a line down to the junction where its branch joins the rest */
    tips.forEach(function (t, i) {
      var joinsAt = 99;
      nodes.forEach(function (n) {
        var k = kidsOf(n);
        if ((k[0].tip === i || k[1].tip === i) && n.at < joinsAt) joinsAt = n.at;
      });
      svg += '<line class="clado__tw" data-tip="' + i + '" x1="' + xOf(i) + '" y1="' + (TOP - 16) +
             '" x2="' + xOf(i) + '" y2="' + yOf(joinsAt) + '"/>';
      /* "New World monkey" beside "Old World monkey" collides at this width, so a long name
         is set over two lines rather than shrunk until nobody can read it */
      var words = String(t).split(' ');
      if (words.length > 1 && t.length > 9) {
        var half = words.length > 2 ? words.slice(0, words.length - 1).join(' ') : words[0];
        var rest = words.length > 2 ? words[words.length - 1] : words.slice(1).join(' ');
        svg += '<text class="clado__tip" x="' + xOf(i) + '" y="' + (TOP - 36) + '">' + esc(half) + '</text>' +
               '<text class="clado__tip" x="' + xOf(i) + '" y="' + (TOP - 24) + '">' + esc(rest) + '</text>';
      } else {
        svg += '<text class="clado__tip" x="' + xOf(i) + '" y="' + (TOP - 24) + '">' + esc(t) + '</text>';
      }
    });

    /* each junction: the bar between its two children, each child's line down into it, and the
       dot where they meet */
    nodes.forEach(function (n, k) {
      var y = yOf(n.at), kids = kidsOf(n);
      var xa = xAt(kids[0]), xb = xAt(kids[1]), mid = xOfNode(n);
      svg += '<g class="clado__node" data-node="' + k + '" tabindex="0" role="button" aria-label="' + esc(n.of || 'common ancestor') + '">';
      svg += '<line class="clado__bar" x1="' + xa + '" y1="' + y + '" x2="' + xb + '" y2="' + y + '"/>';
      /* the child that is itself a junction drops into this bar from its own line */
      kids.forEach(function (c) {
        if (c.node) svg += '<line class="clado__stem" x1="' + xAt(c) + '" y1="' + yAt(c) + '" x2="' + xAt(c) + '" y2="' + y + '"/>';
      });
      svg += '<circle class="clado__dot" cx="' + mid + '" cy="' + y + '" r="6"/>';
      svg += '</g>';
    });
    /* the root: a short line below the oldest junction, so the tree has somewhere to come from */
    if (nodes.length) {
      var root = nodes.reduce(function (a, b) { return b.at > a.at ? b : a; });
      svg += '<line class="clado__stem" x1="' + xOfNode(root) + '" y1="' + yOf(root.at) +
             '" x2="' + xOfNode(root) + '" y2="' + (yOf(root.at) + 18) + '"/>';
    }
    svg += '</svg>';

    var plate = h('div', 'clado');
    plate.innerHTML = svg;
    var say = h('p', 'clado__say', 'Every dot is a <b>common ancestor</b> — the point at which one group split into two. Click one.');
    plate.appendChild(say);
    box.appendChild(plate);
    /* Everything about the two NAMES lives in one fold, and the fold comes after the questions.
       Standing open between the tree and the task, it stopped a reader dead: they had come to
       answer two questions and were handed a second diagram to study first. Folded, it is one
       line until somebody wants it. */
    var aside = null;
    if (spec.compare || spec.explain) {
      aside = h('details', 'clado__what');
      var inner = '<summary>' + esc(spec.explainTitle || 'Cladogram or phylogenetic tree?') + '</summary>';
      aside.innerHTML = inner;
      if (spec.compare) aside.appendChild(cladoCompare(spec.compare));
      (spec.explain || []).forEach(function (t) { aside.appendChild(h('p', null, mk(t))); });
    }

    plate.querySelectorAll('.clado__node').forEach(function (g) {
      function light() {
        plate.querySelectorAll('.clado__node').forEach(function (x) { x.classList.remove('is-on'); });
        plate.querySelectorAll('.clado__tw').forEach(function (x) { x.classList.remove('is-on'); });
        g.classList.add('is-on');
        var n = nodes[+g.getAttribute('data-node')];
        for (var i = n.from; i <= n.to; i++) {
          var tw = plate.querySelector('.clado__tw[data-tip="' + i + '"]');
          if (tw) tw.classList.add('is-on');
        }
        say.innerHTML = '<b>' + esc(tips[n.from]) + '</b> to <b>' + esc(tips[n.to]) + '</b> all descend from this one ancestor' +
          (n.of ? ' — ' + esc(n.of) : '') + '. Anything joining lower down shares an older ancestor still.';
      }
      g.addEventListener('click', light);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); light(); } });
    });

    /* the two questions */
    (spec.questions || []).forEach(function (q) {
      var wrap = h('div', 'cladoq');
      wrap.appendChild(h('p', 'cladoq__ask', mk(q.ask)));
      var opts = h('div', 'cladoq__opts');
      var out = h('p', 'cladoq__out');
      var done = false;
      q.options.forEach(function (o) {
        var b = h('button', 'wbtn', esc(o)); b.type = 'button';
        b.addEventListener('click', function () {
          if (done) return;
          done = true;
          Array.prototype.forEach.call(opts.children, function (x) {
            x.disabled = true;
            if (x.textContent === q.answer) x.classList.add('is-right');
            else if (x === b) x.classList.add('is-wrong');
          });
          var right = o === q.answer;
          out.className = 'cladoq__out ' + (right ? 'is-ok' : 'is-no');
          out.innerHTML = (right ? '<b>Yes.</b> ' : '<b>Not that one.</b> ') + mk(q.why);
        });
        opts.appendChild(b);
      });
      wrap.appendChild(opts); wrap.appendChild(out);
      box.appendChild(wrap);
    });

    if (aside) box.appendChild(aside);
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
  /* ---------- the key, drawn ----------
     A written key and a drawn key are the same thing twice, and a student who has only ever
     read one down a page does not see that. This draws the real thing: a step at the top, two
     branches out of it carrying the two statements, and under each branch either the next step
     or the name the key arrives at. It is the shape drawn on a whiteboard and printed in the
     textbooks, not the written key with indents.

     Nothing is revealed early: a branch grows a subtree only once it has been chosen, so the
     diagram is a record of the route and never a spoiler. Where the student is standing, both
     branches are drawn with an empty box at the end of each — that fork is the choice in front
     of them. The branch NOT taken stays on the page, greyed, because seeing what you ruled out
     is half of what a key is for. */
  function keyTree(key, path, current) {
    var taken = {};                      /* step number -> the side taken there */
    (path || []).forEach(function (p) { taken[p.step] = p.side; });

    function box(cls, inner) { return '<div class="kt2__box ' + cls + '">' + inner + '</div>'; }

    /* what a branch leads to: a name, the next step, or — at the fork you are standing on —
       an empty box, so the tree shows the choice rather than pretending it is already made */
    function target(go, chosen, atFork) {
      if (atFork && !chosen) return box('kt2__box--todo', '?');
      if (typeof go === 'string') return box('kt2__box--name', esc(go));
      return step(go);
    }

    function step(n) {
      var st = key.steps[n - 1];
      if (!st) return '';
      var atFork = taken[n] == null;                    /* the student is standing here */
      var here = n === current;
      var kids = ['a', 'b'].map(function (side) {
        var chosen = taken[n] === side;
        var ruled = taken[n] != null && !chosen;
        return '<div class="kt2__kid' + (chosen ? ' is-taken' : '') + (ruled ? ' is-out' : '') + '">' +
                 '<div class="kt2__edge">' +
                   '<span class="kt2__lab">' + n + side + '</span>' +
                   '<span class="kt2__txt">' + esc(st[side].t) + '</span>' +
                 '</div>' +
                 target(st[side].go, chosen, atFork) +
               '</div>';
      }).join('');
      return '<div class="kt2__node">' +
               box('kt2__box--step' + (here ? ' is-here' : ''), esc(String(n))) +
               '<div class="kt2__kids">' + kids + '</div>' +
             '</div>';
    }

    var wrap = h('div', 'kt2');
    wrap.innerHTML = '<div class="kt2__start">Start</div>' +
                     '<div class="kt2__canvas"><svg class="kt2__lines" aria-hidden="true"></svg>' + step(1) + '</div>';
    return wrap;
  }

  /* The branches are drawn from the boxes' real positions, not with CSS borders. A key leans:
     one side of a step ends in a name and the other carries the whole rest of the tree, so a
     kid's own middle is nowhere near the box it holds, and border-drawn elbows point at empty
     space. Measuring is the only way the line meets the box it belongs to. */
  function drawKeyLines(wrap) {
    var canvas = wrap.querySelector('.kt2__canvas'), svg = wrap.querySelector('.kt2__lines');
    if (!canvas || !svg) return;
    /* two statements in a pair rarely wrap to the same number of lines, which leaves the
       boxes under them at different heights and the fork looking crooked. Give both the
       height of the taller one before anything is measured. */
    Array.prototype.forEach.call(canvas.querySelectorAll('.kt2__kids'), function (kids) {
      var edges = kids.querySelectorAll(':scope > .kt2__kid > .kt2__edge'), tall = 0;
      Array.prototype.forEach.call(edges, function (e) { e.style.minHeight = ''; tall = Math.max(tall, e.offsetHeight); });
      Array.prototype.forEach.call(edges, function (e) { e.style.minHeight = tall + 'px'; });
    });
    var cr = canvas.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + Math.round(cr.width) + ' ' + Math.round(cr.height));
    svg.setAttribute('width', Math.round(cr.width)); svg.setAttribute('height', Math.round(cr.height));
    var d = '';
    Array.prototype.forEach.call(canvas.querySelectorAll('.kt2__node'), function (node) {
      var from = node.children[0], kidsBox = node.children[1];
      if (!from || !kidsBox) return;
      var fr = from.getBoundingClientRect();
      var x0 = fr.left + fr.width / 2 - cr.left, y0 = fr.bottom - cr.top;
      Array.prototype.forEach.call(kidsBox.children, function (kid) {
        var kr = kid.getBoundingClientRect();
        var x1 = kr.left + kr.width / 2 - cr.left, y1 = kr.top - cr.top;
        var mid = y0 + Math.max(6, (y1 - y0) / 2);
        var path = 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) +
                   'V' + mid.toFixed(1) + 'H' + x1.toFixed(1) + 'V' + y1.toFixed(1);
        /* and on past the statement, into the box it leads to, so the branch reads as one line */
        var lab = kid.querySelector('.kt2__edge');
        var to = kid.querySelector(':scope > .kt2__box') || kid.querySelector(':scope > .kt2__node > .kt2__box');
        if (lab && to) {
          var lr = lab.getBoundingClientRect(), tr2 = to.getBoundingClientRect();
          var xb = tr2.left + tr2.width / 2 - cr.left;
          path += 'M' + x1.toFixed(1) + ' ' + (lr.bottom - cr.top).toFixed(1) +
                  'V' + ((lr.bottom + tr2.top) / 2 - cr.top).toFixed(1) +
                  'H' + xb.toFixed(1) + 'V' + (tr2.top - cr.top).toFixed(1);
        }
        var cls = kid.classList.contains('is-taken') ? 'is-taken' : kid.classList.contains('is-out') ? 'is-out' : '';
        d += '<path class="kt2__line ' + cls + '" d="' + path + '"/>';
      });
    });
    svg.innerHTML = d;
  }

  /* The plate on the left of the keys station. The tree of life is hidden there — a key has
     nothing to do with the tree, and showing both at once invites the idea that a key says
     something about how closely things are related, which is exactly what it does NOT say.

     A station can carry more than one key, and they are different trees. The plate belongs to
     whichever key the reader is actually at: the one they last answered, or — if they are just
     reading — the one nearest the top of the screen. Each key keeps its own route, so scrolling
     back to an earlier one shows it exactly as it was left, not from the beginning. */
  var KeyPlate = {
    keys: [],                 /* {id, el, draw}  in the order they appear on the station */
    activeId: null,
    reset: function () { this.keys = []; this.activeId = null; },
    register: function (id, el, draw) {
      this.keys.push({ id: id, el: el, draw: draw });
      if (this.activeId == null) this.setActive(id);
      this.watch();
    },
    setActive: function (id) {
      var k = null;
      for (var i = 0; i < this.keys.length; i++) if (this.keys[i].id === id) k = this.keys[i];
      if (!k) return;
      this.activeId = id;
      k.draw();                                    /* the widget knows its own route */
      for (i = 0; i < this.keys.length; i++) this.keys[i].el.classList.toggle('is-plated', this.keys[i].id === id);
    },
    show: function (key, path, current, title) {
      var body = document.getElementById('keyPlateBody');
      if (!body) return;
      body.innerHTML = '';
      var tree = keyTree(key, path, current);
      body.appendChild(tree);
      drawKeyLines(tree);
      requestAnimationFrame(function () { drawKeyLines(tree); });   /* after the text has wrapped */
      if (window.ResizeObserver) {
        if (this._ro) this._ro.disconnect();
        this._ro = new ResizeObserver(function () { drawKeyLines(tree); });
        this._ro.observe(body);
      }
      var t = document.getElementById('keyPlateTitle');
      if (t && title) t.textContent = title;
      var n = document.getElementById('keyPlateNote');
      if (n) n.textContent = (path && path.length)
        ? 'Grey is the branch you ruled out. A key names one thing by ruling out everything else.'
        : 'Choose a statement on the right, and the key draws itself here.';
    },
    /* follow the reading position: the key nearest the top of the screen owns the plate */
    watch: function () {
      if (this.bound) return;
      this.bound = true;
      var self = this;
      var pick = function () {
        if (!self.keys.length) return;
        var best = null, bestD = Infinity;
        for (var i = 0; i < self.keys.length; i++) {
          var k = self.keys[i];
          if (!k.el.isConnected) continue;
          var r = k.el.getBoundingClientRect();
          if (r.bottom < 40 || r.top > window.innerHeight - 40) continue;   /* off screen */
          var d = Math.abs(r.top - 90);
          if (d < bestD) { bestD = d; best = k; }
        }
        if (best && best.id !== self.activeId) self.setActive(best.id);
      };
      var t = null;
      var onScroll = function () { if (t) return; t = setTimeout(function () { t = null; pick(); }, 120); };
      [document.getElementById('panel'), document.querySelector('.stage'), window].forEach(function (n) {
        if (n) n.addEventListener('scroll', onScroll, { passive: true });
      });
    }
  };
  global.KeyPlate = KeyPlate;

  /* every key on the station gets its own place to keep the route it is on, so coming back to
     one shows it as it was left. Kept out of the station's own progress record on purpose: a
     half-finished key is not an answer, and it must not change what a station is worth. */
  var KEYPATH_KEY = 'labs.keyPaths.v1';
  function keyPaths() {
    try { return JSON.parse(localStorage.getItem(KEYPATH_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveKeyPath(id, path) {
    try { var all = keyPaths(); all[id] = path; localStorage.setItem(KEYPATH_KEY, JSON.stringify(all)); } catch (e) {}
  }

  function keyrun(spec, ctx) {
    var box = h('div', 'widget'); if (spec.group) box.setAttribute('data-group', spec.group);
    box.appendChild(head(spec.title || 'Use the key', spec.ask || 'Look at the specimen, then choose the statement that is true for it at each step. The key is printed on the right so you can see the same choices the way an exam prints them.', 'Choose a statement'));
    var wrap = h('div', 'keyrun');
    var left = h('div'), right = h('div');
    var sp = h('div', 'keyrun__spec');
    if (spec.specimen) { var pic = picture(spec.specimen); if (pic) sp.appendChild(pic.pic); }
    sp.appendChild(h('div', null, '<b>The specimen</b>: ' + esc(spec.specimen ? spec.specimen.desc : '')));
    left.appendChild(sp);
    var run = h('div'); left.appendChild(run);
    var printed = h('div'); right.appendChild(printed);

    /* a name that is the same every time this key is built, so its route can be found again */
    var id = 'key:' + ((ctx && ctx.station) || '?') + ':' + (spec.after == null ? 'x' : spec.after) + ':' + (spec.title || 'key');
    var path = [], at = 1;
    /* pick up where this key was left, replaying the route it had */
    (function restore() {
      var saved = keyPaths()[id];
      if (!saved || !saved.length || typeof saved.length !== 'number') return;
      var n = 1;
      for (var i = 0; i < saved.length; i++) {
        var st = spec.key.steps[n - 1]; if (!st) return;
        var side = saved[i].side, o = st[side]; if (!o) return;
        path.push({ step: n, side: side, t: o.t });
        if (typeof o.go === 'string') { at = o.go; return; }
        n = o.go;
      }
      at = n;
    })();

    function plate() {
      if (global.KeyPlate) global.KeyPlate.show(spec.key, path, typeof at === 'number' ? at : null, spec.title);
    }
    /* clicking a statement means this is the key the reader is working on */
    function claim() { if (global.KeyPlate) global.KeyPlate.setActive(id); }

    function paint(step, byUser) {
      at = step;
      printed.innerHTML = ''; printed.appendChild(keyPrint(spec.key, step));
      if (byUser) claim(); else if (global.KeyPlate && global.KeyPlate.activeId === id) plate();
      run.innerHTML = '';
      var crumbs = h('div', 'keyrun__crumbs', path.map(function (p) { return '<span>' + esc(p.step + p.side + ' ' + p.t) + '</span>'; }).join(''));
      run.appendChild(crumbs);
      if (typeof step === 'string') {
        run.appendChild(h('div', 'keyrun__done', 'The key names it:<b><i>' + esc(step) + '</i></b>' +
          (spec.specimen && spec.specimen.name && spec.specimen.name !== step ? '<span style="color:var(--bad)">That is not this specimen. Start again and look more carefully at each step.</span>' : (spec.done ? esc(spec.done) : 'Every choice was a feature you could see. That is what a good key does.'))));
        var again = h('button', 'wbtn wbtn--quiet', 'Start again'); again.type = 'button'; again.style.marginTop = '8px';
        again.addEventListener('click', function () { path = []; saveKeyPath(id, path); paint(1, true); });
        run.appendChild(again);
        return;
      }
      var s = spec.key.steps[step - 1]; if (!s) return;
      run.appendChild(h('div', 'keyrun__step', 'Step ' + step + ' of ' + spec.key.steps.length));
      ['a', 'b'].forEach(function (side) {
        var b = h('button', 'keyrun__opt', '<b>' + step + side + '</b>' + esc(s[side].t)); b.type = 'button';
        b.addEventListener('click', function () {
          path.push({ step: step, side: side, t: s[side].t });
          saveKeyPath(id, path.map(function (p) { return { side: p.side }; }));
          paint(s[side].go, true);
        });
        run.appendChild(b);
      });
    }
    paint(at);
    wrap.appendChild(left); wrap.appendChild(right); box.appendChild(wrap);
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    /* reading this key, or touching it, hands it the plate */
    box.addEventListener('mouseenter', claim);
    box.addEventListener('focusin', claim);
    if (global.KeyPlate) global.KeyPlate.register(id, box, plate);
    return box;
  }

  /* ---------- keyrules: how to build one that gets the marks ----------
     Their first assessment is to construct a key, and the thing that loses marks is not
     biology — it is not knowing what a step is allowed to look like. So: one rule in large
     type, the statement-or-question question answered flatly, and a short checklist with a
     right and a wrong example on each line. Nothing here is prose to wade through. */
  function keyrules(spec) {
    var box = h('div', 'widget'); if (spec.group) box.setAttribute('data-group', spec.group);
    box.appendChild(head(spec.title || 'Building a key that gets full marks', spec.ask || '', null));
    var wrap = h('div', 'krules');

    wrap.appendChild(h('div', 'krules__one',
      '<span class="krules__oneh">The one rule</span>' +
      '<span class="krules__onet">' + esc(spec.one) + '</span>'));

    /* the two layouts, side by side, so the yes/no question answers itself */
    var forms = h('div', 'krules__forms');
    forms.innerHTML =
      '<div class="krf">' +
        '<div class="krf__h">Printed as numbered pairs</div>' +
        '<div class="krf__couplet"><span class="krf__n">1 (a)</span><span>has wings</span><span class="krf__go">go to 2</span></div>' +
        '<div class="krf__couplet"><span class="krf__n">1 (b)</span><span>has no wings</span><span class="krf__go">go to 3</span></div>' +
      '</div>' +
      '<div class="krf">' +
        '<div class="krf__h">Printed as a tree</div>' +
        '<div class="krf__tree">' +
          '<div class="krf__box">has wings</div>' +
          '<div class="krf__arms"><span>yes</span><span>no</span></div>' +
          '<div class="krf__ends"><span>go to 2</span><span>go to 3</span></div>' +
        '</div>' +
      '</div>';
    wrap.appendChild(forms);
    wrap.appendChild(h('p', 'krules__both', spec.both));

    var list = h('ol', 'krules__list');
    (spec.rules || []).forEach(function (r) {
      var li = h('li', 'krule');
      li.innerHTML = '<span class="krule__t">' + esc(r.t) + '</span>' +
        (r.yes ? '<span class="krule__eg krule__eg--yes"><i>✓</i>' + esc(r.yes) + '</span>' : '') +
        (r.no ? '<span class="krule__eg krule__eg--no"><i>✗</i>' + esc(r.no) + '</span>' : '');
      list.appendChild(li);
    });
    wrap.appendChild(list);
    if (spec.last) wrap.appendChild(h('div', 'krules__last', esc(spec.last)));
    box.appendChild(wrap);
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- keybad: a key that does not work, and why ----------
     The faults are the ones examiners actually report: statements that overlap so an organism
     fits both, statements about two different features so an organism fits neither, words that
     are opinions rather than observations, features you cannot see on the specimen, and steps
     that nothing leads to. Each fault highlights the lines it is about. */
  function keybad(spec) {
    var box = h('div', 'widget');
    box.appendChild(head(spec.title || 'A key that does not work',
      spec.ask || 'This key was written by a student and it fails. Click a fault to see which lines it is about — then read the rule it breaks.',
      'Find the faults'));
    var wrap = h('div', 'keybad');
    var left = h('div', 'keybad__key');
    var ol = keyPrint(spec.key);
    /* tag every line so a fault can point at it */
    var lines = Array.prototype.slice.call(ol.children);
    (spec.key.steps || []).forEach(function (st, i) {
      ['a', 'b'].forEach(function (side, j) {
        var li = lines[i * 2 + j];
        if (li) li.setAttribute('data-line', (i + 1) + side);
      });
    });
    left.appendChild(ol);
    var list = h('ul', 'keybad__faults');
    var open = null;
    (spec.faults || []).forEach(function (f, i) {
      var li = h('li', 'keybad__fault', '<span class="n">' + (i + 1) + '</span><span class="keybad__txt"><b>' +
        esc(f.lines.join(' and ')) + '</b><small>' + esc(f.what) + '</small></span>');
      li.setAttribute('role', 'button'); li.tabIndex = 0;
      function show() {
        var on = open !== i;
        Array.prototype.forEach.call(list.children, function (x) { x.classList.remove('is-on'); });
        Array.prototype.forEach.call(ol.children, function (x) { x.classList.remove('is-bad'); });
        open = on ? i : null;
        if (!on) return;
        li.classList.add('is-on');
        f.lines.forEach(function (ref) {
          var t = ol.querySelector('[data-line="' + ref + '"]');
          if (t) t.classList.add('is-bad');
        });
      }
      li.addEventListener('click', show);
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
      list.appendChild(li);
    });
    wrap.appendChild(left); wrap.appendChild(list);
    box.appendChild(wrap);
    if (spec.rules && spec.rules.length) {
      var r = h('div', 'keybad__rules');
      r.innerHTML = '<div class="keybad__rh">' + esc(spec.rulesTitle || 'What a pair of statements has to be') + '</div><ul>' +
        spec.rules.map(function (x) { return '<li>' + mk(x) + '</li>'; }).join('') + '</ul>';
      box.appendChild(r);
    }
    if (spec.note) box.appendChild(h('p', 'widget__note', spec.note));
    return box;
  }

  /* ---------- binomial: build a name, watch the rules ---------- */
  function binomial(spec) {
    var box = h('div', 'widget');
    box.appendChild(head(spec.title || 'Build a scientific name — and the rules', spec.ask || 'The five rules are here, and they check themselves as you type. Try an example, then break a rule on purpose and watch which one turns red.', 'Type a name'));
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
    var rules = h('ul', 'binom__rules',
      '<li data-r="two"><b>Two words</b>, in this order: the <span class="binom__g">genus</span>, then the <span class="binom__s">species</span></li>' +
      '<li data-r="cap">The <span class="binom__g">genus</span> starts with a <b>capital letter</b> — <i>Panthera</i></li>' +
      '<li data-r="low">The <span class="binom__s">species</span> is <b>all lower case</b> — <i>leo</i>, never <i>Leo</i></li>' +
      '<li data-r="ital">Printed in <b><i>italics</i></b>; handwritten, <b>underline both words</b></li>' +
      '<li data-r="abbr">After the first time, shorten the genus to its <b>initial and a full stop</b> — <i>P. leo</i></li>');
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
      rules.querySelector('[data-r="abbr"]').className = g && s ? 'ok' : '';
      var G = g ? g[0].toUpperCase() + g.slice(1).toLowerCase() : '', S = s.toLowerCase();
      pr.querySelector('.binom__print').innerHTML = '<span class="binom__g">' + esc(G || 'Genus') + '</span> <span class="binom__s">' + esc(S || 'species') + '</span>';
      hd.querySelector('.binom__hand').innerHTML = '<u class="binom__g">' + esc(G || 'Genus') + '</u> <u class="binom__s">' + esc(S || 'species') + '</u>';
      ab.querySelector('.binom__abbr').innerHTML = '<span class="binom__g">' + esc(G ? G[0] + '.' : 'G.') + '</span> <span class="binom__s">' + esc(S || 'species') + '</span>';
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
  /* A comparison table is where a student meets most of these words for the first time —
     "parallel veins", "two cotyledons", "flower parts in threes" — and until now not one of
     them was clickable, because the cells were escaped and never passed to the term marker.
     They are marked now, so every registered word in a table opens its picture or its
     definition exactly as it does in a sentence. */
  function mk(t) { return (global.Terms && global.Terms.mark) ? global.Terms.mark(t) : esc(t); }
  function table(spec) {
    var box = h('div', 'ctable'); if (spec.group) box.setAttribute('data-group', spec.group);
    box.innerHTML = '<table>' + (spec.caption ? '<caption>' + esc(spec.caption) + '</caption>' : '') +
      '<thead><tr>' + spec.head.map(function (c) { return '<th>' + mk(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      spec.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<th scope="row">' + mk(c) + '</th>' : '<td>' + mk(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    return box;
  }
  function photo(spec) {
    var f = h('figure', 'photo'); if (spec.group) f.setAttribute('data-group', spec.group);
    var pic = picture(spec);
    if (pic) { f.appendChild(pic.pic); pic.img.addEventListener('click', function () { if (global.LabLightbox) global.LabLightbox(pic.img.currentSrc || pic.img.src, spec.cap || '', 'Photograph', pic.credit); }); }
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
  /* A label line on a drawing starts a little way off the structure it names. Touching it
     would leave the reader unable to tell where the drawing ends and the line begins, which
     is the same rule the drawing station teaches. On a photograph the pin marks the spot, so
     this gap belongs to the diagrams only. */
  var LEAD_GAP = 6;
  function lab(x1, y1, x2, y2, text, anchor, extra) {
    if (anchor === 'extra') { extra = true; anchor = null; }
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var sx = x1 + dx / len * LEAD_GAP, sy = y1 + dy / len * LEAD_GAP;
    return '<line class="diag__lead' + (extra ? ' diag__lead--extra' : '') + '" x1="' + f1(sx) + '" y1="' + f1(sy) + '" x2="' + x2 + '" y2="' + y2 + '"/><text class="diag__lab' + (extra ? ' diag__lab--extra' : '') + '" x="' + (x2 + (anchor === 'end' ? -4 : 4)) + '" y="' + (y2 + 3.5) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + text + '</text>';
  }
  function f1(v) { return Math.round(v * 10) / 10; }
  function segs21() { var s = ''; for (var i = 0; i < 21; i++) s += '<rect class="' + (i % 2 ? 'diag__thorax' : 'diag__abd') + '" x="' + (66 + 13 * i) + '" y="92" width="13" height="26" rx="2"/>'; return s; }
  function legs20() { var s = ''; for (var i = 0; i < 20; i++) { var x = 72.5 + 13 * i; s += '<path d="M' + x + ' 92 L' + (x - 3.5) + ' 76 L' + (x + 4.5) + ' 62"/><path d="M' + x + ' 118 L' + (x - 3.5) + ' 134 L' + (x + 4.5) + ' 148"/>'; } return s; }
  var DIAGRAMS = {
    prokaryote: { caption: 'A generalised bacterium. No nucleus: the DNA is one circular loop lying free in the cytoplasm, and the small extra rings beside it are plasmids. Grey labels are not needed for 0610; they are here only so the cell makes sense.',
      svg: '<svg viewBox="0 0 500 250" class="diag__svg" role="img" aria-label="A labelled diagram of a bacterium, showing the cell wall, cytoplasm, one circular loop of DNA and two plasmids">' +
        /* the cell: wall outside, membrane just inside it */
        '<rect class="diag__thorax" x="120" y="70" width="260" height="110" rx="55"/>' +
        '<rect class="diag__seg" x="128" y="78" width="244" height="94" rx="47"/>' +
        /* the chromosome: one closed loop, free in the cytoplasm */
        '<path class="diag__legs" d="M196 108 C168 116 172 148 202 150 C232 152 246 136 232 122 C220 110 214 104 196 108 Z" fill="none"/>' +
        /* two plasmids */
        '<ellipse class="diag__legs" cx="292" cy="106" rx="15" ry="10" fill="none"/>' +
        '<ellipse class="diag__legs" cx="308" cy="142" rx="11" ry="8" fill="none"/>' +
        /* ribosomes, and a flagellum: both good to know, neither asked for */
        '<g class="diag__eye">' + [[250,92],[264,120],[248,160],[272,166],[220,168],[330,120],[344,96],[336,158],[190,88],[176,132]]
            .map(function (r) { return '<circle cx="' + r[0] + '" cy="' + r[1] + '" r="2.6"/>'; }).join('') + '</g>' +
        '<path class="diag__ant" d="M380 125 C400 112 414 140 434 126 C452 113 464 138 480 128" fill="none"/>' +
        lab(150, 74, 96, 44, 'Cell wall', 'end') +
        lab(150, 82, 96, 62, 'Cell membrane', 'end', 'extra') +
        lab(206, 130, 96, 196, 'Circular DNA') +
        lab(292, 106, 420, 60, 'Plasmids') +
        lab(264, 120, 420, 196, 'Cytoplasm') +
        lab(330, 120, 420, 168, 'Ribosomes', null, 'extra') +
        lab(434, 126, 420, 228, 'Flagellum', null, 'extra') +
        '</svg>' },
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
    virus: { summary: 'What no photograph can show, drawn', caption: 'A virus, drawn: genetic material — DNA or RNA — inside a coat made of protein units, and nothing else. No cytoplasm, no membrane, no cell. Neither feature can be seen in a photograph, which is why this is drawn. The grey label is not asked for by 0610.',
      svg: '<svg viewBox="0 0 520 250" class="diag__svg" role="img" aria-label="A labelled diagram of a virus: genetic material inside a protein coat">' +
        (function () { var s2 = '', i, a, x, y;
          for (i = 0; i < 18; i++) { a = i * 20 * Math.PI / 180; x = 150 + 78 * Math.sin(a); y = 118 - 78 * Math.cos(a);
            s2 += '<circle class="diag__unit" cx="' + f1(x) + '" cy="' + f1(y) + '" r="13"/>'; }
          return s2; })() +
        '<circle class="diag__inside" cx="150" cy="118" r="66"/>' +
        '<path class="diag__gene" d="M112 96 C132 78 158 118 178 100 C198 82 206 122 186 138 C166 154 140 126 120 142 C104 155 96 122 112 96 Z"/>' +
        (function () { var s3 = '', i, a, x1, y1, x2, y2;
          for (i = 0; i < 18; i++) { a = (i * 20 + 10) * Math.PI / 180; x1 = 150 + 88 * Math.sin(a); y1 = 118 - 88 * Math.cos(a); x2 = 150 + 102 * Math.sin(a); y2 = 118 - 102 * Math.cos(a);
            s3 += '<path class="diag__spike" d="M' + f1(x1) + ' ' + f1(y1) + ' L' + f1(x2) + ' ' + f1(y2) + '"/><circle class="diag__spike-t" cx="' + f1(x2) + '" cy="' + f1(y2) + '" r="4"/>'; }
          return s3; })() +
        lab(150, 52, 300, 44, 'protein coat — many protein units') +
        lab(168, 118, 300, 106, 'genetic material — DNA or RNA') +
        lab(214, 178, 300, 168, 'surface proteins', null, true) +
        '<path class="diag__scale" d="M60 214 H240 M60 208 V220 M240 208 V220"/>' +
        '<text class="diag__scalelab" x="150" y="234" text-anchor="middle">about 100 nm across</text>' +
        '<text class="diag__title" x="8" y="242">A virus, drawn</text></svg>' },
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

  var MAKERS = { clado: clado, keyrules: keyrules, letters: letters, finder: finder, drawphotos: drawphotos, dna: dna, keyrun: keyrun, keybad: keybad, binomial: binomial, kingdoms: kingdoms, table: table, photo: photo };
  global.Learn = {
    /* Drop the entries whose picture has left the page. Called from paintPanel AFTER the old
       station is cleared and BEFORE the new one is built — the only moment when isConnected
       means what it looks like it means. Pruning at push time would be wrong: a widget is
       always still detached when it registers. */
    reap: function () { for (var i = LIVE.length - 1; i >= 0; i--) if (!LIVE[i].box.isConnected) LIVE.splice(i, 1); },
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
