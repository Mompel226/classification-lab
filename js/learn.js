/* ============================================================
   learn.js — the Learn tab's widgets: nothing here is only read.

   A station's learn.interact lists them, each with `after` (the exam bullet it follows,
   or none for the end of the list) and a `type`:
     letters   the seven characteristics as tiles that open one at a time
     finder    a photograph with numbered spots: find the features that place the group
     dna       a DNA alignment the way MEGA shows one — dots, differences, counts
     keyrun    a dichotomous key run one step at a time, beside the same key printed
     binomial  a scientific name built and checked as it is typed
     kingdoms  five cards; each lights its kingdom on the tree and shows its features
     drawpair  two drawings of one specimen: click the faults on the one that would not score
     table     a comparison table
     photo     a photograph with its credit
   Also exported for the questions: seqView, keyPrint, svgFor.
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
  function photoOf(gid, alt) {
    var g = GROUP[gid]; if (!g || !g.img) return null;
    var im = new Image();
    im.src = 'assets/photos/' + gid + '-900.jpg';
    im.srcset = 'assets/photos/' + gid + '-900.jpg 900w, assets/photos/' + gid + '-1400.jpg 1400w';
    im.sizes = '(max-width: 620px) 92vw, 480px';
    im.alt = alt || g.img.alt || g.label; im.loading = 'lazy'; im.decoding = 'async';
    return im;
  }
  function creditOf(gid) {
    var g = GROUP[gid]; if (!g || !g.img) return '';
    return (g.img.alt ? esc(g.img.alt) + ' · ' : '') + '<a href="' + esc(g.img.url) + '" target="_blank" rel="noopener">' + esc(g.img.credit) + '</a>';
  }

  /* ---------- the seven small animations ---------- */
  var ICON = {
    move: '<svg viewBox="0 0 64 48"><g class="an-swim" fill="#0E4D5C"><path d="M12 24 C22 8 42 8 52 24 C42 40 22 40 12 24Z"/><path d="M50 24 L62 15 L62 33Z"/><circle cx="22" cy="21" r="2.2" fill="#fff"/></g></svg>',
    resp: '<svg viewBox="0 0 64 48"><circle class="an-cell" cx="32" cy="24" r="15" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><g fill="#F5A623"><circle class="an-spark" cx="32" cy="24" r="4"/><circle class="an-spark" cx="24" cy="18" r="2.5"/><circle class="an-spark" cx="40" cy="30" r="2.5"/></g><text x="4" y="45" font-size="8" fill="#6B6B6B" font-family="Calibri,sans-serif">glucose + O₂ → energy</text></svg>',
    sens: '<svg viewBox="0 0 64 48"><path d="M6 24 C18 6 46 6 58 24 C46 42 18 42 6 24Z" fill="#fff" stroke="#0E4D5C" stroke-width="2"/><circle cx="32" cy="24" r="10" fill="#8AD8FF" stroke="#0E4D5C" stroke-width="1.5"/><circle class="an-pupil" cx="32" cy="24" r="5.5" fill="#0B1F2A"/></svg>',
    grow: '<svg viewBox="0 0 64 48"><path d="M4 44 H60" stroke="#8A5A0E" stroke-width="2"/><path class="an-stem" d="M32 44 C32 34 32 26 32 12" stroke="#3D7A1F" stroke-width="2.5" fill="none"/><g class="an-leaf" fill="#8EE6A2" stroke="#3D7A1F" stroke-width="1.2"><path d="M32 30 C22 30 16 22 18 16 C26 16 32 22 32 30Z"/><path d="M32 22 C42 22 48 14 46 8 C38 8 32 14 32 22Z"/></g></svg>',
    repro: '<svg viewBox="0 0 64 48"><circle class="an-split-l" cx="32" cy="24" r="11" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><circle class="an-split-r" cx="32" cy="24" r="11" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><circle class="an-split-l" cx="32" cy="24" r="3.5" fill="#0E4D5C"/><circle class="an-split-r" cx="32" cy="24" r="3.5" fill="#0E4D5C"/></svg>',
    excr: '<svg viewBox="0 0 64 48"><path d="M20 6 H44 C50 6 50 30 32 30 C14 30 14 6 20 6Z" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><g class="an-drop" fill="#8AD8FF" stroke="#0B6E8C" stroke-width="1"><path d="M32 30 C28 36 26 38 26 41 A6 6 0 0 0 38 41 C38 38 36 36 32 30Z"/></g><text x="6" y="46" font-size="8" fill="#6B6B6B" font-family="Calibri,sans-serif">waste out</text></svg>',
    nutr: '<svg viewBox="0 0 64 48"><circle cx="42" cy="24" r="15" fill="#E1EFF2" stroke="#0E4D5C" stroke-width="2"/><g fill="#8A5A0E"><circle class="an-in" cx="8" cy="24" r="3"/><circle class="an-in" cx="8" cy="18" r="2.2"/><circle class="an-in" cx="8" cy="30" r="2.2"/></g><text x="2" y="46" font-size="8" fill="#6B6B6B" font-family="Calibri,sans-serif">materials in</text></svg>'
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
        open.innerHTML = '<span class="lt__ico">' + (ICON[it.icon] || '') + '</span><div>' +
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

  /* ---------- finder: find the features on a photograph ---------- */
  function finder(spec) {
    var box = h('div', 'widget'); if (spec.group) box.setAttribute('data-group', spec.group);
    var g = GROUP[spec.group] || {};
    box.appendChild(head(spec.title || ('Find the features: ' + (g.label || '')), spec.ask || 'Click each numbered spot on the photograph, or a feature in the list, and see what it is.', 'Click the spots'));
    var wrap = h('div', 'finder');
    var stage = h('div', 'finder__stage');
    var im = photoOf(spec.group, spec.alt); if (im) stage.appendChild(im);
    var list = h('ul', 'finder__list');
    var found = {}, spots = [], items = [];
    function reveal(i) {
      found[i] = 1;
      spots[i].classList.add('is-found'); items[i].classList.add('is-found');
      if (!spots[i].querySelector('.spot__lab')) spots[i].appendChild(h('span', 'spot__lab', esc(spec.spots[i].label)));
      var n = Object.keys(found).length;
      if (n === spec.spots.length && !box.querySelector('.widget__done')) box.appendChild(h('p', 'widget__done', spec.done || ('All ' + n + ' found. Those are the features that put it in this group.')));
    }
    spec.spots.forEach(function (s, i) {
      var b = h('button', 'spot' + (s.y < 18 ? ' spot--top' : ''), String(i + 1)); b.type = 'button';
      b.style.left = s.x + '%'; b.style.top = s.y + '%';
      b.setAttribute('aria-label', 'Spot ' + (i + 1));
      b.addEventListener('click', function () { reveal(i); });
      stage.appendChild(b); spots.push(b);
      var li = h('li', 'finder__item', '<span class="n"></span><span><b>' + esc(s.label) + '</b>' + (s.note ? '<small>' + esc(s.note) + '</small>' : '') + '</span>');
      li.setAttribute('role', 'button'); li.tabIndex = 0;
      li.addEventListener('click', function () { reveal(i); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(i); } });
      list.appendChild(li); items.push(li);
    });
    function paintList() { items.forEach(function (li, i) { if (!found[i]) li.querySelector('.n').textContent = i + 1; }); }
    paintList();
    var left = h('div'); left.appendChild(stage);
    if (spec.group) left.appendChild(h('p', 'finder__credit', creditOf(spec.group)));
    wrap.appendChild(left); wrap.appendChild(list);
    box.appendChild(wrap);
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
    if (spec.specimen && spec.specimen.group) { var im = photoOf(spec.specimen.group, spec.specimen.alt); if (im) sp.appendChild(im); }
    if (spec.specimen && spec.specimen.svg) sp.innerHTML = svgFor(spec.specimen.svg);
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

  /* ---------- drawpair: the drawing that scores and the one that does not ---------- */
  function drawpair(spec) {
    var box = h('div', 'widget');
    box.appendChild(head(spec.title || 'Two drawings of the same specimen', spec.ask || 'The left one would score. Find every fault on the right one: click the numbered spots, or the faults in the list.', 'Find the faults'));
    var wrap = h('div', 'drawpair');
    var good = h('div', 'dp__half', '<div class="dp__stage">' + svgFor(spec.good) + '</div><div class="dp__lab dp__lab--good">✓ This one scores</div>');
    var bad = h('div', 'dp__half');
    var stage = h('div', 'dp__stage', svgFor(spec.bad));
    var list = h('ul', 'dp__found');
    var found = {}, marks = [], items = [];
    function reveal(i) {
      found[i] = 1; marks[i].classList.add('is-found'); items[i].classList.add('is-found');
      if (Object.keys(found).length === spec.faults.length && !box.querySelector('.widget__done')) box.appendChild(h('p', 'widget__done', 'All ' + spec.faults.length + ' faults found. Each one is a mark lost on the criteria: ' + (spec.criteria || 'S, O, L, D1, D2') + '.'));
    }
    spec.faults.forEach(function (f, i) {
      var m = h('button', 'fault', String(i + 1)); m.type = 'button'; m.style.left = f.x + '%'; m.style.top = f.y + '%';
      m.setAttribute('aria-label', 'Fault ' + (i + 1));
      m.addEventListener('click', function () { reveal(i); }); stage.appendChild(m); marks.push(m);
      var li = h('li', null, '<span class="n">' + (i + 1) + '</span><b>' + esc(f.label) + '</b>' + (f.why ? ' — ' + esc(f.why) : ''));
      li.setAttribute('role', 'button'); li.tabIndex = 0;
      li.addEventListener('click', function () { reveal(i); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(i); } });
      list.appendChild(li); items.push(li);
    });
    bad.appendChild(stage); bad.appendChild(h('div', 'dp__lab dp__lab--bad', '✗ This one loses marks — ' + spec.faults.length + ' faults to find'));
    bad.appendChild(list);
    wrap.appendChild(good); wrap.appendChild(bad); box.appendChild(wrap);
    if (spec.rules) box.appendChild(h('ul', 'dp__rules', spec.rules.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('')));
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
    var im = photoOf(spec.group, spec.alt); if (im) { f.appendChild(im); im.addEventListener('click', function () { if (global.LabLightbox) global.LabLightbox(im.currentSrc || im.src, spec.cap || '', 'Photograph', creditOf(spec.group)); }); }
    f.appendChild(h('figcaption', null, (spec.cap ? esc(spec.cap) + ' · ' : '') + creditOf(spec.group)));
    return f;
  }

  /* ---------- the drawings ---------- */
  var uid = 0;
  var ARROW = function (id) { return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#2B2B2B" stroke="none"/></marker></defs>'; };
  var DRAW = {
    'leaf-good': function () {
      return '<svg viewBox="0 0 348 360" class="draw-good" role="img" aria-label="A drawing of a leaf that would score: clean continuous outline filling the space, ruled label lines, a title and a magnification">' +
        '<rect x="1" y="1" width="346" height="358" stroke="#C4C4C4" stroke-dasharray="4 4"/>' +
        '<path d="M150 302 C70 252 40 172 70 102 C95 47 130 27 150 12 C170 27 205 47 230 102 C260 172 230 252 150 302 Z"/>' +
        '<path d="M150 302 L150 12"/>' +
        '<path d="M150 90 L104 58"/><path d="M150 90 L196 58"/><path d="M150 140 L88 112"/><path d="M150 140 L212 112"/>' +
        '<path d="M150 190 L84 176"/><path d="M150 190 L216 176"/><path d="M150 240 L98 236"/><path d="M150 240 L202 236"/>' +
        '<path d="M150 302 L150 332"/>' +
        '<path d="M150 165 L262 165"/><text x="266" y="169">midrib</text>' +
        '<path d="M196 58 L262 40"/><text x="266" y="44">lateral vein</text>' +
        '<path d="M63 140 L18 140"/><text x="6" y="134">margin</text>' +
        '<path d="M150 320 L262 320"/><text x="266" y="324">petiole</text>' +
        '<text x="10" y="350" font-size="12">Leaf of Ficus benjamina, upper surface   ×1.5</text></svg>';
    },
    'leaf-bad': function () {
      var a = 'arr' + (++uid);
      return '<svg viewBox="0 0 348 360" class="draw-bad" role="img" aria-label="A drawing of the same leaf that would lose marks: small, sketchy outline, shading, arrowed label lines that cross, a label written inside the drawing, and no title">' + ARROW(a) +
        '<rect x="1" y="1" width="346" height="358" stroke="#C4C4C4" stroke-dasharray="4 4"/>' +
        '<g transform="translate(-40 -20) scale(1.5)">' +
        '<g class="sketchy"><path d="M120 200 C90 180 80 140 95 110 C105 85 115 75 120 68 C128 75 140 88 148 110 C160 145 150 180 120 200 Z"/>' +
        '<path d="M121 204 C88 183 78 143 96 108 C106 83 117 72 121 65 C130 75 142 91 151 113 C163 148 152 183 121 204 Z"/>' +
        '<path d="M118 198 C93 179 84 139 94 113 C103 88 114 79 119 71 C126 78 138 87 146 108 C157 142 148 178 118 198 Z"/></g>' +
        '<g class="shade"><path d="M100 128 L112 112"/><path d="M100 140 L118 118"/><path d="M102 152 L124 124"/><path d="M106 164 L130 132"/><path d="M110 176 L136 142"/><path d="M116 186 L140 156"/><path d="M124 194 L142 170"/></g>' +
        '<path d="M120 200 Q116 150 124 72" stroke-width="1.6"/>' +
        '<path d="M120 130 q-9 -7 -17 -5 M121 131 q9 -7 17 -5 M118 160 q-10 -6 -18 -3 M120 160 q10 -6 18 -3" stroke-width="1.3"/>' +
        '<text x="104" y="166" font-size="7">leaf</text>' +
        '</g>' +
        '<path d="M262 250 L140 140" marker-end="url(#' + a + ')"/><text x="266" y="254">vein</text>' +
        '<path d="M262 110 L104 160" marker-end="url(#' + a + ')"/><text x="266" y="114">edge</text>' +
        '<path d="M60 302 L128 250" marker-end="url(#' + a + ')"/><text x="14" y="318">the middle line</text></svg>';
    },
    'beetle-good': function () {
      var leg = function (m) { return '<path d="M' + m + '"/>'; };
      return '<svg viewBox="0 0 348 360" class="draw-good" role="img" aria-label="A drawing of a ground beetle that would score: three body parts, six jointed legs, two antennae, clean lines, ruled labels, a title and a magnification">' +
        '<rect x="1" y="1" width="346" height="358" stroke="#C4C4C4" stroke-dasharray="4 4"/>' +
        '<ellipse cx="160" cy="72" rx="22" ry="17"/><circle cx="146" cy="64" r="3"/><circle cx="174" cy="64" r="3"/>' +
        '<path d="M150 57 L140 40 L128 26 L116 14"/><circle cx="140" cy="40" r="1.6"/><circle cx="128" cy="26" r="1.6"/>' +
        '<path d="M170 57 L180 40 L192 26 L204 14"/><circle cx="180" cy="40" r="1.6"/><circle cx="192" cy="26" r="1.6"/>' +
        '<path d="M126 92 C120 108 122 122 128 128 L192 128 C198 122 200 108 194 92 C184 84 136 84 126 92 Z"/>' +
        '<path d="M160 130 C118 132 104 174 110 232 C116 284 140 306 160 312 Z"/><path d="M160 130 C202 132 216 174 210 232 C204 284 180 306 160 312 Z"/>' +
        '<path d="M138 150 C128 190 130 250 146 300"/><path d="M182 150 C192 190 190 250 174 300"/>' +
        leg('134 104 L98 84 L76 60 L70 40') + leg('186 104 L222 84 L244 60 L250 40') +
        leg('124 156 L84 154 L60 168 L48 194') + leg('196 156 L236 154 L260 168 L272 194') +
        leg('118 214 L88 232 L70 262 L62 292') + leg('202 214 L232 232 L250 262 L258 292') +
        '<circle cx="98" cy="84" r="1.6"/><circle cx="76" cy="60" r="1.6"/><circle cx="84" cy="154" r="1.6"/><circle cx="60" cy="168" r="1.6"/><circle cx="88" cy="232" r="1.6"/><circle cx="70" cy="262" r="1.6"/>' +
        '<path d="M128 26 L262 26"/><text x="266" y="30">antenna</text>' +
        '<path d="M182 72 L262 72"/><text x="266" y="76">head</text>' +
        '<path d="M196 110 L262 110"/><text x="266" y="114">thorax</text>' +
        '<path d="M208 200 L262 200"/><text x="266" y="204">wing case</text>' +
        '<path d="M88 232 L26 232"/><text x="4" y="226">jointed leg</text>' +
        '<text x="10" y="350" font-size="12">Ground beetle, Carabus sp., from above   ×3</text></svg>';
    },
    'beetle-bad': function () {
      var a = 'arr' + (++uid);
      return '<svg viewBox="0 0 348 360" class="draw-bad" role="img" aria-label="A drawing of the same beetle that would lose marks: small, sketchy, shaded wing cases, four straight legs and no antennae, arrowed labels that cross, a wrong label, and no title">' + ARROW(a) +
        '<rect x="1" y="1" width="346" height="358" stroke="#C4C4C4" stroke-dasharray="4 4"/>' +
        '<g transform="translate(30 60) scale(.8)">' +
        '<g class="sketchy"><ellipse cx="160" cy="72" rx="22" ry="17"/><ellipse cx="161" cy="74" rx="23" ry="16"/><ellipse cx="159" cy="71" rx="21" ry="18"/>' +
        '<path d="M126 92 C120 108 122 122 128 128 L192 128 C198 122 200 108 194 92 Z"/><path d="M124 94 C118 110 120 124 130 130 L194 130 C200 124 202 110 196 94 Z"/>' +
        '<path d="M160 130 C112 134 100 180 108 236 C116 288 140 308 160 312 C180 308 204 288 212 236 C220 180 208 134 160 130 Z"/>' +
        '<path d="M158 132 C110 136 98 182 106 238 C114 290 138 310 158 314 C178 310 202 290 210 238 C218 182 206 136 158 132 Z"/></g>' +
        '<g class="shade">' + [140,150,160,170,180,190,200,210,220,230,240,250,260,270,280].map(function (y) { return '<path d="M' + (112 + (y - 140) * .08) + ' ' + y + ' L' + (208 - (y - 140) * .08) + ' ' + (y - 14) + '"/>'; }).join('') + '</g>' +
        '<path d="M134 104 L60 60" stroke-width="1.8"/><path d="M186 104 L260 60" stroke-width="1.8"/><path d="M118 214 L52 268" stroke-width="1.8"/><path d="M202 214 L268 268" stroke-width="1.8"/>' +
        '<text x="150" y="226" font-size="9">body</text>' +
        '</g>' +
        '<path d="M256 72 L158 148" marker-end="url(#' + a + ')"/><text x="260" y="76">wing</text>' +
        '<path d="M252 150 L142 120" marker-end="url(#' + a + ')"/><text x="256" y="154">head</text>' +
        '<path d="M40 322 L86 290" marker-end="url(#' + a + ')"/><text x="14" y="338">leg</text></svg>';
    }
  };
  function svgFor(name) { return DRAW[name] ? DRAW[name]() : '<p>Drawing not found: ' + esc(name) + '</p>'; }

  var MAKERS = { letters: letters, finder: finder, dna: dna, keyrun: keyrun, binomial: binomial, kingdoms: kingdoms, drawpair: drawpair, table: table, photo: photo };
  global.Learn = {
    widget: function (spec, ctx) {
      var mk = MAKERS[spec.type];
      if (!mk) return h('p', 'widget__note', 'Unknown widget: ' + esc(spec.type));
      var el = mk(spec, ctx || {});
      if (spec.group && !el.getAttribute('data-group')) el.setAttribute('data-group', spec.group);
      return el;
    },
    seqView: seqView, keyPrint: keyPrint, svgFor: svgFor, ICON: ICON
  };
})(window);
