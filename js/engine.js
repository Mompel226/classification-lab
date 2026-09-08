/* ============================================================
   engine.js — the activity engine. SHARED: the copy in labs-shared/engine/ is the
   source; each lab's build copies it in. Edit it there, then rebuild every lab.

   Types: blank · drag · mcq · order · match · sort · ph

   Check as often as you like. Right or wrong only — you have to think,
   not read the answer off the screen.

   Marking goes through Marking.check(), which compares hashes. The correct
   answer is never in the page: there is no way to be shown it, only to be
   told which parts are wrong.
   ============================================================ */
(function (global) {
  'use strict';

  var KIND_NAME = { blank:'Fill the gaps', drag:'Drag & drop', mcq:'Multiple choice',
                    order:'Put in order', match:'Match up', sort:'Sort into groups', ph:'Set the pH' };


  /* ---------- utilities ---------- */
  function h(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function shuffle(a) {
    var r = a.slice(), i, j, t;
    for (i = r.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }

  /* ---------- pointer drag, shared by drag / sort / order ---------- */
  /* Rewritten because it dropped gestures in real use. Three faults:

     1. The browser's own drag-and-drop could take over the gesture. Once it
        did, no pointerup ever arrived, so the floating copy of the word was
        never removed — the word sat stuck on the screen with no way to
        dismiss it.
     2. pointermove/pointerup were bound to the token itself. If the token was
        re-rendered, or pointer capture was lost, the drag could never finish.
        They are on the window now, and any lost drag is swept up on blur,
        on Escape, and at the start of the next one.
     3. The drop had to land exactly inside a box. Release a few pixels short
        and the word flew back to the pool for no visible reason. A release
        that misses now snaps to the nearest box within 56px.

     There is also no longer any need to drag at all: a token is focusable and
     Enter or Space moves it on to the next box, which is both an answer for
     anyone who cannot drag and a way out if a drag misbehaves. */
  var live = null;                       /* the one drag in progress, if any */

  function sweepDragArtefacts() {
    var i, g = document.querySelectorAll('.is-ghost');
    for (i = 0; i < g.length; i++) g[i].remove();
    var d = document.querySelectorAll('.is-drag');
    for (i = 0; i < d.length; i++) d[i].classList.remove('is-drag');
    var o = document.querySelectorAll('.over');
    for (i = 0; i < o.length; i++) o[i].classList.remove('over');
  }

  function finishDrag(e, cancelled) {
    var L = live;
    if (!L) { sweepDragArtefacts(); return; }
    live = null;
    window.removeEventListener('pointermove', L.move, true);
    window.removeEventListener('pointerup', L.up, true);
    window.removeEventListener('pointercancel', L.up, true);
    try { L.node.releasePointerCapture(L.pid); } catch (_) {}
    sweepDragArtefacts();
    if (cancelled) return;
    if (L.dragging) { if (L.opts.onDrop && e) L.opts.onDrop(L.node, e.clientX, e.clientY); }
    else if (L.opts.onTap) L.opts.onTap(L.node);
  }

  window.addEventListener('blur', function () { finishDrag(null, true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finishDrag(null, true); });
  /* the browser's own drag would swallow the gesture and strand the ghost */
  document.addEventListener('dragstart', function (e) {
    if (e.target && e.target.closest && e.target.closest('.tok,.oitem')) e.preventDefault();
  });

  function makeDraggable(node, opts) {
    node.draggable = false;
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');

    node.addEventListener('keydown', function (e) {
      if (node.dataset.locked === '1') return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (opts.onTap) { opts.onTap(node); node.focus(); }
      }
    });

    node.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      if (node.dataset.locked === '1') return;
      finishDrag(null, true);                       /* never two at once */
      e.preventDefault();
      var L = { node:node, opts:opts, pid:e.pointerId,
                sx:e.clientX, sy:e.clientY, dragging:false, ghost:null };
      L.move = function (ev) {
        if (live !== L || (ev.pointerId != null && ev.pointerId !== L.pid)) return;
        if (!L.dragging) {
          if (Math.abs(ev.clientX - L.sx) < 5 && Math.abs(ev.clientY - L.sy) < 5) return;
          L.dragging = true;
          L.ghost = node.cloneNode(true);
          L.ghost.classList.add('is-ghost');
          L.ghost.removeAttribute('tabindex');
          L.ghost.style.width = node.offsetWidth + 'px';
          document.body.appendChild(L.ghost);
          node.classList.add('is-drag');
        }
        if (ev.cancelable) ev.preventDefault();
        L.ghost.style.left = ev.clientX + 'px';
        L.ghost.style.top = ev.clientY + 'px';
        if (opts.onOver) opts.onOver(ev.clientX, ev.clientY);
      };
      L.up = function (ev) {
        if (live !== L || (ev.pointerId != null && ev.pointerId !== L.pid)) return;
        finishDrag(ev, false);
      };
      live = L;
      try { node.setPointerCapture(L.pid); } catch (_) {}
      /* on the window, so losing capture cannot strand the drag */
      window.addEventListener('pointermove', L.move, true);
      window.addEventListener('pointerup', L.up, true);
      window.addEventListener('pointercancel', L.up, true);
    });
  }

  /* Exact hit first; nothing found means the reader released in the gap
     between the boxes, so snap to the nearest one rather than throwing the
     word back to the pool. */
  var SNAP = 56;
  function underPoint(zones, x, y) {
    for (var i = 0; i < zones.length; i++) {
      var r = zones[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return zones[i];
    }
    return null;
  }
  function nearest(zones, x, y, tol) {
    var best = null, bestD = Infinity, i, r, dx, dy, d;
    for (i = 0; i < zones.length; i++) {
      r = zones[i].getBoundingClientRect();
      if (!r.width && !r.height) continue;
      dx = Math.max(r.left - x, 0, x - r.right);
      dy = Math.max(r.top - y, 0, y - r.bottom);
      d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = zones[i]; }
    }
    return bestD <= tol ? best : null;
  }
  /* zones includes the pool; targets are the real drop boxes only.
     Order matters, and getting it wrong was the actual bug: the pool sits
     directly above the boxes and is a big target, so a reader dragging
     downwards who let go a little early landed back in the pool and the word
     sprang home for no visible reason. A box therefore wins over the pool
     anywhere within 56px of it — someone dragging towards a box means the
     box, not the empty space they happen to be over. */
  function dropTarget(zones, targets, x, y) {
    return underPoint(targets, x, y) ||
           nearest(targets, x, y, SNAP) ||
           underPoint(zones, x, y);
  }

  /* Dragging is not the only way in — say so, because a reader who cannot
     make the drag work will otherwise think the question is broken. */
  function dragHint(card) {
    var hint = h('div', 'act__hint', 'Drag a word into a box \u2014 or just click it to move it along.');
    card.appendChild(hint);
  }

  /* ---------- card shell ---------- */
  function shell(a, idx) {
    var card = h('div', 'act');
    card.dataset.idx = idx;
    var top = h('div', 'act__top');
    var kind = h('span', 'act__kind', KIND_NAME[a.type] || a.type);
    kind.dataset.k = a.type;
    top.appendChild(kind);
    top.appendChild(h('span', 'act__n', 'Question ' + (idx + 1)));
    card.appendChild(top);
    if (a.prompt) card.appendChild(h('p', 'act__prompt', a.prompt));
    /* A hotspot draws the SAME photograph itself, with its clickable regions on top. Drawn
       here as well, the picture appeared twice in one question — the plain copy at its
       natural width, overflowing the card, above the interactive one. */
    if (a.img && a.type !== 'hotspot') card.appendChild(imgEl(a.img, a.imgCap));
    if (a.table) card.appendChild(tableEl(a.table));
    return card;
  }

  /* A graph or photograph the question is about — reading it is the skill being tested. */
  function imgEl(src, cap) {
    var fig = document.createElement('figure'); fig.className = 'qimg';
    var im = document.createElement('img'); im.src = 'assets/photos/' + src; im.alt = cap || ''; im.loading = 'lazy';
    fig.appendChild(im);
    if (cap) { var fc = document.createElement('figcaption'); fc.textContent = cap; fig.appendChild(fc); }
    return fig;
  }

  /* A data table is part of the question, not decoration: Paper 6 gives the
     numbers ruled, and reading them is the skill being tested. */
  function tableEl(t) {
    var wrap = h('div', 'qtable'), tbl = document.createElement('table');
    var thead = document.createElement('thead'), tr = document.createElement('tr');
    (t.head || []).forEach(function (c) { var th = document.createElement('th'); th.textContent = c; tr.appendChild(th); });
    thead.appendChild(tr); tbl.appendChild(thead);
    var tb = document.createElement('tbody');
    (t.rows || []).forEach(function (row) {
      var r = document.createElement('tr');
      row.forEach(function (c, i) { var td = document.createElement(i === 0 ? 'th' : 'td'); if (i === 0) td.setAttribute('scope', 'row'); td.textContent = c; r.appendChild(td); });
      tb.appendChild(r);
    });
    tbl.appendChild(tb); wrap.appendChild(tbl);
    return wrap;
  }

  /* onCheck() must return a Promise of {correct,...} or null to abort */
  function foot(card, onCheck, onReset) {
    var f = h('div', 'act__foot');
    var check = h('button', 'btn', 'Check answer');
    var again = h('button', 'btn btn--quiet', 'Try again');
    var verdict = h('span', 'verdict');
    again.style.display = 'none';
    f.appendChild(check); f.appendChild(again); f.appendChild(verdict);
    card.appendChild(f);
    var fb = h('div', 'feedback'); fb.style.display = 'none'; card.appendChild(fb);

    check.addEventListener('click', function () {
      check.disabled = true;
      var run;
      try { run = Promise.resolve(onCheck()); } catch (err) { run = Promise.reject(err); }
      run.catch(function (err) {
        /* Marking can only fail if the browser has no crypto.subtle — a page served over plain
           http, or opened from a downloaded copy. Say so: a button that goes grey and never
           comes back reads to a student as "I broke it". */
        check.disabled = false;
        verdict.className = 'verdict no';
        verdict.textContent = '\u2717 Could not check';
        fb.className = 'feedback no'; fb.style.display = '';
        fb.innerHTML = 'This page could not mark your answer. Open it from the https:// address, not a downloaded copy, and try again.';
        console.error('marking failed', err);
        return null;
      }).then(function (res) {
        check.disabled = false;
        if (res == null) return;
        card.classList.toggle('is-right', res.correct);
        card.classList.toggle('is-wrong', !res.correct);
        verdict.className = 'verdict ' + (res.correct ? 'ok' : 'no');
        verdict.textContent = res.correct ? '✓ Correct'
          : (res.total > 1 ? '✗ ' + res.score + ' of ' + res.total + ' right' : '✗ Not yet');
        check.style.display = 'none';
        again.style.display = res.correct ? 'none' : '';
        if (!res.correct) {
          fb.className = 'feedback no'; fb.style.display = '';
          fb.innerHTML = 'Not right yet — look again at the ones marked in red, and try once more.';
        }
        card.dispatchEvent(new CustomEvent('result', { bubbles:true, detail:res }));
      });
    });
    again.addEventListener('click', function () {
      if (onReset) onReset();
      card.classList.remove('is-right', 'is-wrong');
      verdict.textContent = ''; verdict.className = 'verdict';
      check.style.display = ''; again.style.display = 'none';
      fb.style.display = '';
      fb.style.display = 'none';
    });
    return { check:check, again:again, verdict:verdict, fb:fb };
  }

  /* ============================= BLANK ============================= */
  function blank(a, idx, id) {
    var card = shell(a, idx);
    var wrap = h('div', 'cloze');
    var inputs = {};
    String(a.text).split(/(\{\d+\})/).forEach(function (p) {
      var m = p.match(/^\{(\d+)\}$/);
      if (!m) { wrap.appendChild(document.createTextNode(p)); return; }
      var key = m[1];
      var inp = h('input', 'gap');
      inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false;
      inp.setAttribute('aria-label', 'Gap ' + key);
      inp.size = 12;
      inputs[key] = inp;
      wrap.appendChild(inp);
      var hint = (a.hints || {})[key];
      if (hint) {
        var hb = h('button', 'hintbtn', '?');
        hb.type = 'button';
        hb.title = 'Show a hint for this gap';
        hb.setAttribute('aria-label', 'Hint for gap ' + key);
        hb.addEventListener('click', function () {
          if (hb.dataset.shown === '1') return;
          hb.dataset.shown = '1';
          card.insertBefore(h('span', 'hinttext', 'Hint (gap ' + key + '): ' + hint), card.querySelector('.act__foot'));
        });
        wrap.appendChild(hb);
      }
    });
    card.appendChild(wrap);

    foot(card, function () {
      var vals = {};
      Object.keys(inputs).forEach(function (k) { vals[k] = inputs[k].value; });
      return window.Marking.check(a, id, vals).then(function (res) {
        Object.keys(inputs).forEach(function (k) {
          inputs[k].classList.toggle('ok', !!res.gaps[k]);
          inputs[k].classList.toggle('no', !res.gaps[k]);
          });
        return res;
      });
    }, function () {
      Object.keys(inputs).forEach(function (k) { inputs[k].classList.remove('ok', 'no'); });
    });
    return card;
  }

  /* ============================= MCQ ============================= */
  function mcq(a, idx, id) {
    var card = shell(a, idx);
    var box = h('div', 'opts');
    var picked = {};
    var btns = (a.options || []).map(function (txt, i) {
      var b = h('button', 'opt');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(h('span', 'opt__k', String.fromCharCode(65 + i)));
      var body = h('span'); body.appendChild(document.createTextNode(txt));
      b.appendChild(body);
      b.addEventListener('click', function () {
        if (b.dataset.locked === '1') return;
        if (!a.multi) { btns.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); }); picked = {}; }
        var on = b.getAttribute('aria-pressed') === 'true';
        b.setAttribute('aria-pressed', on ? 'false' : 'true');
        if (on) delete picked[i]; else picked[i] = 1;
      });
      box.appendChild(b);
      return b;
    });
    card.appendChild(box);

    foot(card, function () {
      var sel = Object.keys(picked).map(Number).sort(function (x, y) { return x - y; });
      if (!sel.length) return null;
      return window.Marking.check(a, id, sel).then(function (res) {
        /* only what THEY chose is marked — the right answer stays hidden */
        btns.forEach(function (b, i) {
          if (sel.indexOf(i) >= 0) b.classList.add(res.correct ? 'ok' : 'no');
        });
        return res;
      });
    }, function () {
      picked = {};
      btns.forEach(function (b) {
        b.dataset.locked = ''; b.classList.remove('ok', 'no'); b.setAttribute('aria-pressed', 'false');
        var w = b.querySelector('.opt__why'); if (w) w.remove();
      });
    }, function () { return null; });
    return card;
  }

  /* ============================= ORDER ============================= */
  function order(a, idx, id) {
    var card = shell(a, idx);
    var list = h('div', 'order');
    function build(items) {
      list.innerHTML = '';
      items.forEach(function (txt) {
        var row = h('div', 'oitem');
        row.dataset.txt = txt;
        row.appendChild(h('span', 'oitem__n', ''));
        row.appendChild(h('span', 'oitem__grip', '⋮⋮'));
        row.appendChild(h('span', null, txt));
        makeDraggable(row, {
          onOver:function (x, y) {
            var target = null;
            Array.prototype.forEach.call(list.children, function (r) {
              if (r === row) return;
              var b = r.getBoundingClientRect();
              if (y > b.top && y < b.bottom) target = { r:r, before:y < b.top + b.height / 2 };
            });
            if (target) list.insertBefore(row, target.before ? target.r : target.r.nextSibling);
          },
          onDrop:renumber
        });
        list.appendChild(row);
      });
      renumber();
    }
    function renumber() {
      Array.prototype.forEach.call(list.children, function (r, i) { r.querySelector('.oitem__n').textContent = i + 1; });
    }
    build(shuffle(a.items || []));
    card.appendChild(list);

    foot(card, function () {
      var got = Array.prototype.map.call(list.children, function (r) { return r.dataset.txt; });
      return window.Marking.check(a, id, got).then(function (res) {
        Array.prototype.forEach.call(list.children, function (r) {
          r.classList.toggle('ok', res.correct);
          r.classList.toggle('no', !res.correct);
        });
        return res;
      });
    }, function () {
      build(shuffle(a.items || []));
    });
    return card;
  }

  /* ============================= MATCH ============================= */
  function match(a, idx, id) {
    var card = shell(a, idx);
    var grid = h('div', 'match');
    var L = h('div', 'mcol'), R = h('div', 'mcol');
    L.appendChild(h('div', 'mcol__h', a.leftHead || 'Match these…'));
    R.appendChild(h('div', 'mcol__h', a.rightHead || '…to these'));
    var sel = { side:null, i:null }, links = {};
    var rIndex = shuffle((a.right || []).map(function (_, i) { return i; }));

    function repaint() {
      lbtn.forEach(function (b, i) {
        b.querySelector('.mitem__b').textContent = links[i] != null ? String.fromCharCode(65 + i) : '';
        b.classList.toggle('paired', links[i] != null);
        b.setAttribute('aria-pressed', sel.side === 'L' && sel.i === i ? 'true' : 'false');
      });
      rbtn.forEach(function (b, k) {
        var ri = rIndex[k], owner = null;
        Object.keys(links).forEach(function (li) { if (links[li] === ri) owner = Number(li); });
        b.querySelector('.mitem__b').textContent = owner != null ? String.fromCharCode(65 + owner) : '';
        b.classList.toggle('paired', owner != null);
        b.setAttribute('aria-pressed', sel.side === 'R' && sel.i === ri ? 'true' : 'false');
      });
    }
    var lbtn = (a.left || []).map(function (txt, i) {
      var b = h('button', 'mitem'); b.type = 'button';
      if (a.leftNotes) b.classList.add('mitem--person');
      b.appendChild(h('span', 'mitem__b', ''));
      var body = h('span');
      body.appendChild(h('b', 'mitem__who', txt));
      if (a.leftNotes && a.leftNotes[i]) body.appendChild(h('span', 'mitem__note', a.leftNotes[i]));
      b.appendChild(body);
      b.addEventListener('click', function () {
        if (b.dataset.locked === '1') return;
        if (sel.side === 'R') { links[i] = sel.i; sel = { side:null, i:null }; }
        else if (sel.side === 'L' && sel.i === i) sel = { side:null, i:null };
        else sel = { side:'L', i:i };
        repaint();
      });
      L.appendChild(b); return b;
    });
    var rbtn = rIndex.map(function (ri) {
      var b = h('button', 'mitem'); b.type = 'button';
      if (a.rightCharts && a.rightCharts[ri] && window.Figures) b.classList.add('mitem--chart');
      b.appendChild(h('span', 'mitem__b', ''));
      if (a.rightCharts && a.rightCharts[ri] && window.Figures) {
        var ch = document.createElement('span');
        ch.className = 'mitem__chart';
        ch.innerHTML = window.Figures.pie(a.rightCharts[ri], 104) +
                       window.Figures.pieKey(a.rightCharts[ri]);
        b.appendChild(ch);
      }
      b.appendChild(h('span', null, a.right[ri]));
      b.addEventListener('click', function () {
        if (b.dataset.locked === '1') return;
        if (sel.side === 'L') { links[sel.i] = ri; sel = { side:null, i:null }; }
        else if (sel.side === 'R' && sel.i === ri) sel = { side:null, i:null };
        else sel = { side:'R', i:ri };
        repaint();
      });
      R.appendChild(b); return b;
    });
    grid.appendChild(L); grid.appendChild(R);
    card.appendChild(h('p', 'hinttext', 'Click one on the left, then its partner on the right.'));
    card.appendChild(grid);
    repaint();

    foot(card, function () {
      var pairs = Object.keys(links).map(function (k) { return [Number(k), links[k]]; });
      if (pairs.length < (a.left || []).length) return null;
      return window.Marking.check(a, id, pairs).then(function (res) {
        lbtn.forEach(function (b) { b.classList.add(res.correct ? 'ok' : 'no'); });
        return res;
      });
    }, function () {
      links = {}; sel = { side:null, i:null };
      lbtn.concat(rbtn).forEach(function (b) { b.dataset.locked = ''; b.classList.remove('ok', 'no', 'paired'); });
      repaint();
    });
    return card;
  }

  /* ============================= SORT ============================= */
  function sort(a, idx, id) {
    var card = shell(a, idx);
    var pool = h('div', 'tokens');
    var binsWrap = h('div', 'bins');
    var bins = (a.bins || []).map(function (name, i) {
      var b = h('div', 'bin');
      b.appendChild(h('div', 'bin__h', name));
      b.dataset.bin = i;
      binsWrap.appendChild(b);
      return b;
    });
    var zones = bins.concat([pool]);
    function mkTok(text) {
      var t = h('span', 'tok', text);
      makeDraggable(t, {
        onOver:function (x, y) {
          zones.forEach(function (z) { z.classList.remove('over'); });
          var z = dropTarget(zones, bins, x, y);
          if (z && z !== pool) z.classList.add('over');
        },
        onDrop:function (node, x, y) {
          zones.forEach(function (z) { z.classList.remove('over'); });
          (dropTarget(zones, bins, x, y) || pool).appendChild(node);
        },
        onTap:function (node) {
          var here = bins.indexOf(node.parentElement);
          var next = here < 0 ? 0 : (here + 1 < bins.length ? here + 1 : -1);
          (next < 0 ? pool : bins[next]).appendChild(node);
        }
      });
      return t;
    }
    shuffle(a.items || []).forEach(function (t) { pool.appendChild(mkTok(t)); });
    dragHint(card);
    card.appendChild(pool);
    card.appendChild(binsWrap);

    foot(card, function () {
      var placed = [];
      bins.forEach(function (b, bi) {
        Array.prototype.forEach.call(b.querySelectorAll('.tok'), function (t) { placed.push([t.textContent, bi]); });
      });
      var left = pool.querySelectorAll('.tok').length;
      if (left) return null;
      return window.Marking.check(a, id, placed).then(function (res) {
        Array.prototype.forEach.call(card.querySelectorAll('.tok'), function (t) {
          t.classList.add(res.correct ? 'ok' : 'no');
        });
        return res;
      });
    }, function () {
      bins.forEach(function (b) {
        Array.prototype.forEach.call(b.querySelectorAll('.tok'), function (t) { pool.appendChild(t); });
      });
      Array.prototype.forEach.call(pool.querySelectorAll('.tok'), function (t) { t.classList.remove('ok', 'no'); });
    });
    return card;
  }

  /* ============================= DRAG ============================= */
  function drag(a, idx, id) {
    var card = shell(a, idx);
    var pool = h('div', 'tokens');
    var slotsWrap = h('div', 'slots');
    var wells = (a.slots || []).map(function (s) {
      var row = h('div', 'slot');
      row.appendChild(h('span', 'slot__lab', s.label));
      var well = h('div', 'slot__well', 'drop here');
      row.appendChild(well);
      slotsWrap.appendChild(row);
      return well;
    });
    var zones = wells.concat([pool]);
    function tidy() {
      wells.forEach(function (w) { if (!w.querySelector('.tok') && !w.textContent) w.textContent = 'drop here'; });
    }
    function mkTok(text) {
      var t = h('span', 'tok', text);
      makeDraggable(t, {
        onOver:function (x, y) {
          zones.forEach(function (z) { z.classList.remove('over'); });
          var z = dropTarget(zones, wells, x, y);
          if (z && z !== pool) z.classList.add('over');
        },
        onDrop:function (node, x, y) {
          zones.forEach(function (z) { z.classList.remove('over'); });
          var z = dropTarget(zones, wells, x, y) || pool;
          if (z !== pool) {
            var sitting = z.querySelector('.tok');
            if (sitting && sitting !== node) pool.appendChild(sitting);
            z.textContent = '';
          }
          z.appendChild(node);
          tidy();
        },
        onTap:function (node) {
          if (node.parentElement !== pool) { pool.appendChild(node); tidy(); return; }
          for (var i = 0; i < wells.length; i++)
            if (!wells[i].querySelector('.tok')) { wells[i].textContent = ''; wells[i].appendChild(node); tidy(); return; }
        }
      });
      return t;
    }
    shuffle((a.tokens || []).concat(a.distractors || [])).forEach(function (t) { pool.appendChild(mkTok(t)); });
    dragHint(card);
    card.appendChild(pool);
    card.appendChild(slotsWrap);
    tidy();

    foot(card, function () {
      var got = wells.map(function (w) { var t = w.querySelector('.tok'); return t ? t.textContent : ''; });
      if (got.some(function (x) { return !x; })) return null;
      return window.Marking.check(a, id, got).then(function (res) {
        wells.forEach(function (w) {
          w.parentElement.classList.toggle('ok', res.correct);
          w.parentElement.classList.toggle('no', !res.correct);
        });
        return res;
      });
    }, function () {
      wells.forEach(function (w) {
        w.parentElement.classList.remove('ok', 'no');
        var t = w.querySelector('.tok'); if (t) pool.appendChild(t);
      });
      tidy();
    });
    return card;
  }

  /* ============================= pH ============================= */
  function ph(a, idx, id) {
    var card = shell(a, idx);
    var box = h('div', 'ph');
    var scale = h('div', 'ph__scale');
    var marks = h('div', 'ph__marks');
    for (var i = 0; i <= 14; i += 2) marks.appendChild(h('span', null, String(i)));
    var slider = h('input');
    slider.type = 'range'; slider.min = '0'; slider.max = '14'; slider.step = '0.5'; slider.value = '7';
    slider.setAttribute('aria-label', 'pH');
    var read = h('div', 'ph__read');
    var val = h('span', 'ph__val', '7.0');
    var stateChip = h('span', 'ph__state off', 'Move the slider, then check');
    read.appendChild(val); read.appendChild(stateChip);
    var wrap = h('div');
    wrap.innerHTML =
      '<svg class="ph__enz" viewBox="0 0 300 88" role="img" aria-label="Enzyme active site">' +
      '<path class="enzBody" d="M20,66 L20,34 C20,26 26,20 34,20 L82,20 C90,20 96,26 96,34 L96,40 ' +
      'L112,40 L112,26 L140,26 L140,40 L156,40 L156,34 C156,26 162,20 170,20 L218,20 C226,20 232,26 232,34 L232,66 Z" ' +
      'fill="#DDEDE2" stroke="#14572B" stroke-width="2" stroke-linejoin="round"/>' +
      '<rect class="sub" x="112" y="4" width="28" height="22" rx="4" fill="#A16207"/>' +
      '<text class="phMsg" x="252" y="46" font-size="12" fill="#6B6B6B" font-family="Calibri,sans-serif"></text></svg>';
    box.appendChild(scale); box.appendChild(marks); box.appendChild(slider); box.appendChild(read); box.appendChild(wrap);
    card.appendChild(box);

    var body = wrap.querySelector('.enzBody'), sub = wrap.querySelector('.sub'), msg = wrap.querySelector('.phMsg');
    var FIT = 'M20,66 L20,34 C20,26 26,20 34,20 L82,20 C90,20 96,26 96,34 L96,40 L112,40 L112,26 L140,26 L140,40 L156,40 L156,34 C156,26 162,20 170,20 L218,20 C226,20 232,26 232,34 L232,66 Z';

    slider.addEventListener('input', function () {
      val.textContent = parseFloat(slider.value).toFixed(1);
    });

    foot(card, function () {
      return window.Marking.check(a, id, parseFloat(slider.value)).then(function (res) {
        stateChip.className = 'ph__state ' + (res.correct ? 'on' : 'off');
        stateChip.textContent = res.correct ? (a.enzyme || 'Enzyme') + ' is working'
                                            : (a.enzyme || 'Enzyme') + ' is not at its best here';
        if (res.correct) { body.setAttribute('d', FIT); body.setAttribute('fill', '#DDEDE2');
                           body.setAttribute('stroke', '#14572B'); sub.setAttribute('y', 8);
                           msg.textContent = 'substrate fits'; msg.setAttribute('fill', '#1E7A3E'); }
        return res;
      });
    }, function () {
      slider.value = '7'; val.textContent = '7.0';
      stateChip.className = 'ph__state off'; stateChip.textContent = 'Move the slider, then check';
      body.setAttribute('d', FIT); body.setAttribute('fill', '#DDEDE2'); body.setAttribute('stroke', '#14572B');
      msg.textContent = '';
    });
    return card;
  }

  var MAKERS = { blank:blank, drag:drag, mcq:mcq, order:order, match:match, sort:sort, ph:ph };

  global.Engine = {
    render: function (a, idx, id) {
      var maker = MAKERS[a.type];
      if (!maker) { var e = h('div', 'act'); e.textContent = 'Unknown activity type: ' + a.type; return e; }
      return maker(a, idx, id);
    },
    /* A lab can add an activity type of its own: register(type, maker, "Name shown on the card").
       The maker gets (a, idx, id) and returns the card; the helpers below build the shell and
       the Check / Try again foot exactly as the built-in types do. */
    register: function (type, maker, name) { MAKERS[type] = maker; if (name) KIND_NAME[type] = name; },
    util: { h:h, shell:shell, foot:foot, shuffle:shuffle, imgEl:imgEl, makeDraggable:makeDraggable, dropTarget:dropTarget, dragHint:dragHint },
    KIND_NAME: KIND_NAME
  };
})(window);
