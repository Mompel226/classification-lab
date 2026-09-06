/* ============================================================
   engine-ext.js — what this lab adds to the shared activity engine.

   Two activity types Topic 1 needed and the other labs did not:
     grid     a table of ticks — things down the side, characteristics along the top —
              marked row by row, so a wrong row is named but never corrected
     hotspot  click the features on a photograph; the answer is the set of regions
   And three things a question can SHOW beside its prompt, none of them the answer:
     seq      a DNA alignment (the MEGA-style viewer from learn.js)
     key      a dichotomous key, printed
     svg      a drawing, by name
   ============================================================ */
(function (global) {
  'use strict';
  var E = global.Engine, U = E.util, h = U.h;

  /* ============================= GRID ============================= */
  function grid(a, idx, id) {
    var card = U.shell(a, idx);
    var wrap = h('div', 'gridq');
    var tbl = document.createElement('table');
    var thead = document.createElement('thead'), hr = document.createElement('tr');
    hr.appendChild(h('th', null, ''));
    (a.cols || []).forEach(function (c) {
      var th = document.createElement('th');
      th.innerHTML = '<span>' + esc(c.label || c) + '</span>' + (c.short ? '<small>' + esc(c.short) + '</small>' : '');
      hr.appendChild(th);
    });
    thead.appendChild(hr); tbl.appendChild(thead);
    var tb = document.createElement('tbody');
    var boxes = [];
    (a.rows || []).forEach(function (r, ri) {
      var tr = document.createElement('tr');
      var th = document.createElement('th'); th.setAttribute('scope', 'row');
      th.innerHTML = esc(r.label) + (r.note ? '<small>' + esc(r.note) + '</small>' : '');
      tr.appendChild(th);
      boxes[ri] = [];
      (a.cols || []).forEach(function (c, ci) {
        var td = document.createElement('td');
        var cb = document.createElement('input'); cb.type = 'checkbox';
        cb.setAttribute('aria-label', (r.label) + ' — ' + (c.label || c));
        td.appendChild(cb); tr.appendChild(td); boxes[ri][ci] = cb;
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); wrap.appendChild(tbl); card.appendChild(wrap);
    card.appendChild(h('p', 'act__hint', 'Tick every box that is true. A row is marked as a whole: it is right only when every tick in it is right.'));

    U.foot(card, function () {
      var resp = {};
      boxes.forEach(function (row, ri) { resp[ri] = row.map(function (cb, ci) { return cb.checked ? ci : -1; }).filter(function (x) { return x >= 0; }); });
      return global.Marking.check(a, id, resp).then(function (res) {
        Array.prototype.forEach.call(tb.children, function (tr, ri) {
          tr.classList.toggle('ok', !!res.gaps[ri]);
          tr.classList.toggle('no', !res.gaps[ri]);
        });
        return res;
      });
    }, function () {
      Array.prototype.forEach.call(tb.children, function (tr) { tr.classList.remove('ok', 'no'); });
    });
    return card;
  }

  /* ============================= HOTSPOT ============================= */
  function hotspot(a, idx, id) {
    var card = U.shell(a, idx);
    var stage = h('div', 'hs__stage');
    if (a.svg) {
      stage.innerHTML = global.Learn ? global.Learn.svgFor(a.svg) : '';
    } else if (a.img) {
      var im = new Image(); im.src = 'assets/photos/' + a.img; im.alt = a.imgCap || ''; im.loading = 'lazy';
      stage.appendChild(im);
    }
    var picked = {};
    var count = h('p', 'hs__count');
    function paintCount() {
      var n = Object.keys(picked).length;
      count.innerHTML = '<b>' + n + '</b> of ' + a.need + ' chosen — click a feature to choose it, click again to let it go.';
    }
    (a.regions || []).forEach(function (r) {
      var b = h('button', 'hs__pt'); b.type = 'button';
      b.style.left = r.x + '%'; b.style.top = r.y + '%';
      var d = (r.r || 7) * 2;
      b.style.width = d + '%';            /* a circle: the stylesheet keeps it square with aspect-ratio */
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Feature ' + r.id);
      b.addEventListener('click', function () {
        if (b.dataset.locked === '1') return;
        if (picked[r.id]) { delete picked[r.id]; b.setAttribute('aria-pressed', 'false'); }
        else { picked[r.id] = 1; b.setAttribute('aria-pressed', 'true'); }
        paintCount();
      });
      stage.appendChild(b);
    });
    card.appendChild(stage);
    if (a.credit) { var cr = h('p', 'act__credit'); cr.innerHTML = a.credit; card.appendChild(cr); }
    card.appendChild(count); paintCount();

    U.foot(card, function () {
      var sel = Object.keys(picked);
      if (!sel.length) return null;
      return global.Marking.check(a, id, sel);
    }, function () {
      picked = {};
      Array.prototype.forEach.call(stage.querySelectorAll('.hs__pt'), function (b) { b.setAttribute('aria-pressed', 'false'); b.dataset.locked = ''; });
      paintCount();
    });
    return card;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }

  E.register('grid', grid, 'Tick the grid');
  E.register('hotspot', hotspot, 'Find it on the picture');

  /* ---------- what a question shows beside its prompt ---------- */
  var render = E.render;
  E.render = function (a, idx, id) {
    var card = render(a, idx, id);
    var L = global.Learn;
    var after = card.querySelector('.act__prompt') || card.querySelector('.act__top');
    var shows = [];
    if (a.seq && L) shows.push(L.seqView(a.seq, { tools: true }));
    if (a.key && L) shows.push(L.keyPrint(a.key));
    if (a.svg && a.type !== 'hotspot' && L) { var sb = h('div', 'svgbox'); sb.innerHTML = L.svgFor(a.svg); shows.push(sb); }
    shows.reverse().forEach(function (el) {
      var box = h('div', 'qshow'); box.appendChild(el);
      after.parentNode.insertBefore(box, after.nextSibling);
    });
    return card;
  };
})(window);
