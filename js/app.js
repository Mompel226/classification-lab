/* ============================================================
   app.js — wiring: tree ⇄ panel ⇄ rail, progress, hand-in.
   The Digestion Lab's app.js with the plate swapped: the anatomical plate and its
   camera are replaced by the tree of life (js/plate.js), and the Learn tab carries
   this lab's widgets (js/learn.js) between its sentences.
   ============================================================ */
(function () {
  'use strict';

  var LAB = 'classification-lab';
  var STORE = LAB + '.v1';
  var ORDER = [];
  var S = {};                       /* stations by id */
  var OWNER = {};                   /* group id -> the station that teaches it */

  var progress = load();
  var current = null;
  var tab = 'learn';

  /* ---------- progress ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; }
  }
  var saveBroken = false;
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(progress)); }
    catch (e) {
      /* Private browsing, or a school profile with site data blocked. Said once per session. */
      if (!saveBroken) { saveBroken = true; toast('This browser is not saving your work — finish and hand in before you reload.'); }
    }
  }
  function p(id) {
    if (!progress[id]) progress[id] = { done:{}, tried:{}, sig:(S[id] ? stationSig(S[id]) : '') };
    return progress[id];
  }
  /* A record is filed by the question's position, and a changed question set would credit
     a reader for a question they never saw: the record carries a fingerprint of the set. */
  /* FNV-1a, base 36. Small, stable, and it only has to notice a change, not resist an attack. */
  function hash36(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(36);
  }
  /* The fingerprint covers the number of questions AND everything a student reads in each one,
     in order — the prompt, the options, the items, the labels. Counting types alone was not
     enough: rewording a question, or reordering its options, left the fingerprint unchanged, so
     a student kept a tick against a question that had changed underneath them.

     Deliberately NOT the answer key `k`. It is salted afresh on every build, so hashing it
     would wipe every record on every deploy whether anything changed or not. Verified: across
     two rebuilds with no content change, every station's fingerprint is identical in both labs. */
  function stationSig(st) {
    var acts = st.activities || [];
    var body = acts.map(function (a) {
      var c = {};
      /* `k` holds the answer hashes and `anyOrder` is marking policy — neither is something a
         student reads, and both change when marking is made more generous. Leaving them out
         keeps a fixed question fingerprinted the same, so widening what an answer may say never
         wipes anybody's ticks, and snapshots already saved in the spreadsheet still restore. */
      Object.keys(a).sort().forEach(function (k) { if (k !== 'k' && k !== 'anyOrder') c[k] = a[k]; });
      return JSON.stringify(c);
    }).join('|');
    return acts.length + ':' + hash36(body);
  }
  function reconcile() {
    var dropped = 0;
    Object.keys(progress).forEach(function (id) {
      var st = S[id];
      if (!st) { delete progress[id]; dropped++; return; }
      var sig = stationSig(st);
      if (progress[id].sig && progress[id].sig !== sig) {
        progress[id] = { done:{}, tried:{}, sig:sig }; dropped++;
      } else progress[id].sig = sig;
    });
    if (dropped) save();
    return dropped;
  }
  function stationScore(id) {
    var st = S[id];
    if (!st) return { done:0, total:0, tried:0 };
    var rec = p(id), total = (st.activities || []).length, n = 0, t = 0;
    Object.keys(rec.done).forEach(function (k) { if (rec.done[k] && +k < total) n++; });
    Object.keys(rec.tried).forEach(function (k) { if (rec.tried[k] && +k < total) t++; });
    return { done:n, total:total, tried:t };
  }
  function totals() {
    var done = 0, total = 0, tried = 0, checks = 0, first1 = 0, from = 0;
    ORDER.forEach(function (id) {
      var s = stationScore(id); done += s.done; total += s.total; tried += s.tried;
      var rec = p(id);
      Object.keys(rec.per || {}).forEach(function (k) { if (+k < s.total) checks += rec.per[k]; });
      Object.keys(rec.one || {}).forEach(function (k) { if (+k < s.total && rec.done[k]) first1++; });
      if (rec.first && (!from || rec.first < from)) from = rec.first;
    });
    return { done:done, total:total, tried:tried, checks:checks, first1:first1, from:from };
  }

  /* ---------- header ---------- */
  function paintHeader() {
    var t = totals(), pct = t.total ? t.done / t.total : 0, C = 2 * Math.PI * 11;
    var sub = document.getElementById('btnSubmit');
    if (sub) {
      var done = t.done === t.total;
      var ready = t.total > 0 && (done || t.tried > 0);
      sub.hidden = false;
      sub.disabled = !ready;
      sub.classList.toggle('hbtn--part', ready && !done);
      sub.textContent = done || !ready ? 'Hand in' : 'Hand in progress';
      sub.title = done ? 'Hand in your finished work'
        : ready ? 'Hand in what you have so far — ' + t.done + ' of ' + t.total + ' right' : 'Answer a question first';
    }
    document.getElementById('ringFg').setAttribute('stroke-dasharray', (C * pct).toFixed(1) + ' ' + C.toFixed(1));
    document.getElementById('qDone').textContent = t.done;
    document.getElementById('qTotal').textContent = t.total;
    document.getElementById('stDone').textContent = ORDER.filter(function (id) { var s = stationScore(id); return s.total && s.done === s.total; }).length;
    document.getElementById('stTotal').textContent = ORDER.length;
  }

  /* ---------- the rail ---------- */
  function paintRail() {
    var track = document.getElementById('railTrack');
    track.innerHTML = '';
    ORDER.forEach(function (id, i) {
      var st = S[id]; if (!st) return;
      var sc = stationScore(id), full = sc.total && sc.done === sc.total;
      var b = document.createElement('button');
      b.className = 'rstep' + (full ? ' done' : '');
      b.setAttribute('aria-current', id === current ? 'true' : 'false');
      b.title = st.name + ' — ' + sc.done + ' of ' + sc.total + ' questions answered';
      var n = document.createElement('span'); n.className = 'rstep__n'; n.textContent = full ? '✓' : (i + 1);
      var lab = document.createElement('span'); lab.textContent = st.name;
      var bar = document.createElement('span'); bar.className = 'rstep__bar';
      var fill = document.createElement('i'); fill.style.width = (sc.total ? (sc.done / sc.total) * 100 : 0) + '%';
      bar.appendChild(fill);
      b.appendChild(n); b.appendChild(lab); b.appendChild(bar);
      b.addEventListener('click', function () { open(id); });
      track.appendChild(b);
    });
    var cur = track.querySelector('[aria-current="true"]');
    if (cur) cur.scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' });
  }

  /* ---------- panel ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function icon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="#14572B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 21V11"/><path d="M12 11C12 7 8 6 5 4"/><path d="M12 11C12 7 16 6 19 4"/><path d="M12 15C9 15 7.5 13 7 10.5"/><path d="M12 8.5C12 6 12.6 4.5 12 3"/><circle cx="12" cy="21" r="1.2" fill="#14572B"/></svg>';
  }

  function paintPanel() {
    var st = S[current]; if (!st) return;
    var host = document.getElementById('panelInner'), sc = stationScore(current);
    host.innerHTML = '';
    if (window.Learn && Learn.reap) Learn.reap();   /* the old station's widgets are detached now */

    var head = document.createElement('div');
    head.className = 'st-head';
    head.innerHTML = '<div class="st-head__ic">' + icon() + '</div>' +
      '<div><h2 class="st-title">' + esc(st.name) + '</h2><div class="st-sub">' + esc(st.subtitle || '') + '</div></div>';
    host.appendChild(head);

    var chips = document.createElement('div');
    chips.className = 'chips';
    (st.tags || []).forEach(function (tg) {
      var c = document.createElement('span');
      c.className = 'chip chip--' + (tg.cls || 'k');
      c.textContent = tg.text;
      chips.appendChild(c);
    });
    host.appendChild(chips);

    var tabs = document.createElement('div');
    tabs.className = 'tabs'; tabs.setAttribute('role', 'tablist');
    [['learn','Learn',''],['do','Practise', sc.done + '/' + sc.total]].forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'tab'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', tab === t[0] ? 'true' : 'false');
      b.appendChild(document.createTextNode(t[1]));
      if (t[2]) { var n = document.createElement('span'); n.className = 'tab__n'; n.textContent = t[2]; b.appendChild(n); }
      b.addEventListener('click', function () { tab = t[0]; paintPanel(); });
      tabs.appendChild(b);
    });
    host.appendChild(tabs);

    var pane = document.createElement('div');
    pane.className = 'tabpane';
    host.appendChild(pane);

    if (tab === 'learn' && window.Terms) {
      var key = document.createElement('div');
      key.className = 'keybar';
      key.innerHTML = window.Terms.legend();
      pane.appendChild(key);
    }
    if (tab === 'learn') paintLearn(pane, st); else paintDo(pane, st);
    var sc = panelScroller();
    if (sc) { var prev = sc.style.scrollBehavior; sc.style.scrollBehavior = 'auto'; sc.scrollTop = 0; sc.style.scrollBehavior = prev || ''; }
  }

  var WIDGET_CTX = {
    focus: function (gid) { if (window.Plate) window.Plate.focus(gid); },
    home: function () { if (window.Plate) window.Plate.home(); }
  };

  function paintLearn(pane, st) {
    if (window.Terms) window.Terms.setStation(st.id);
    WIDGET_CTX.station = st.id;      /* a widget that keeps state needs a name that survives a repaint */
    var M = window.Terms ? window.Terms.mark : esc;
    var widgets = (st.learn && st.learn.interact) || [];

    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<div class="card__h">What you need to know</div>';
    var list = document.createElement('ul');
    list.className = 'exam-list';
    card.appendChild(list);

    (st.learn.exam || []).forEach(function (b, i) {
      var li = document.createElement('li');
      var txt = typeof b === 'string' ? b : b.text;
      var badge = '';
      if (typeof b === 'object' && b.sup) badge = '<span class="sup tip" tabindex="0" data-tip="Supplement — examined on Paper 4 (Extended) only. Core candidates can skip it.">S</span>';
      if (typeof b === 'object' && b.ext) badge = '<span class="sup sup--ext tip" tabindex="0" data-tip="Extension — not in the 2026–28 syllabus. Here to make sense of the rest; you will not be asked to write it.">extension</span>';
      li.innerHTML = badge + M(txt);
      list.appendChild(li);
      /* the thing to press, drag or count sits under the sentence it belongs to */
      widgets.filter(function (w) { return w.after === i; }).forEach(function (w) { li.appendChild(window.Learn.widget(w, WIDGET_CTX)); });
    });
    widgets.filter(function (w) { return w.after == null; }).forEach(function (w) { card.appendChild(window.Learn.widget(w, WIDGET_CTX)); });

    if (st.learn && st.learn.golden) {
      var g = document.createElement('div');
      g.className = 'golden';
      g.innerHTML = '<div class="golden__h">⬤ Check yourself — the mistake students make here</div><p>' + M(st.learn.golden) + '</p>';
      card.appendChild(g);
    }
    if ((st.learn.examFocus || []).length) {
      var ef = document.createElement('div');
      ef.className = 'examfocus';
      ef.innerHTML = '<div class="examfocus__h">In the exam — what to write here</div><ul>' +
        st.learn.examFocus.map(function (b) {
          var tag = typeof b === 'object' && b.tag ? '<b class="examfocus__tag">' + esc(b.tag) + '</b> ' : '';
          return '<li>' + tag + esc(typeof b === 'string' ? b : b.text) + '</li>';
        }).join('') + '</ul>';
      card.appendChild(ef);
    }
    pane.appendChild(card);

    var further = (st.learn && st.learn.further) || [];
    if (further.length) {
      var L = document.createElement('div');
      L.className = 'card later';
      L.innerHTML = '<div class="card__h">Going further — links to other topics, IB, and beyond the syllabus</div>' +
        '<ul class="later__list">' + further.map(function (x) {
          var kind = /^IB/.test(x.ref) ? ' later__ref--ib' : /^(Beyond|Not in)/.test(x.ref) ? ' later__ref--beyond' : '';
          return '<li><span class="later__ref' + kind + '">' + esc(x.ref) + '</span>' + M(x.text) + '</li>';
        }).join('') + '</ul>';
      pane.appendChild(L);
    }

    if ((st.keywords || []).length) {
      if (window.Terms) window.Terms.setQuiet(true);
      var k = document.createElement('div');
      k.className = 'card';
      k.innerHTML = '<div class="card__h">Key words</div>' +
        '<p class="kw-hint">Say the definition to yourself first, then turn the card.</p>' +
        '<dl class="kw-grid">' +
        st.keywords.map(function (w) {
          var g2 = (window.GLOSSARY || []).filter(function (e) { return e.term.toLowerCase() === w.term.toLowerCase(); })[0] || {};
          var tag = g2.ext ? ' <span class="tier tier--ext" title="Worth knowing, but 0610 will not ask you to name it">not asked in 0610</span>'
                  : g2.sup ? ' <span class="tier tier--sup" title="Supplement — Paper 4 (Extended) only">Supplement</span>' : '';
          return '<div class="kw kw--flip" role="button" tabindex="0" aria-expanded="false">' +
                 '<dt>' + M(w.term) + tag + '</dt><p class="kw__ask">Do you know it? Tap to check</p><dd>' + M(w.def) + '</dd></div>';
        }).join('') + '</dl>';
      Array.prototype.forEach.call(k.querySelectorAll('.kw--flip'), function (c) {
        var turn = function () { var o = c.classList.toggle('is-open'); c.setAttribute('aria-expanded', o ? 'true' : 'false'); };
        c.addEventListener('click', function (e) { if (e.target.closest('[data-peek],[data-jump],[data-gloss]')) return; turn(); });
        c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(); } });
      });
      pane.appendChild(k);
      if (window.Terms) window.Terms.setQuiet(false);
    }
  }

  /* click any image to see it full size */
  window.LabLightbox = function (src, cap, kind, credit) { lightbox(src, cap + (credit ? ' <span class="lens__credit">' + credit + '</span>' : ''), kind); };
  function lightbox(src, cap, kind) {
    var lb = document.getElementById('lightbox');
    var st = lb.querySelector('.lb__stage');
    st.innerHTML = '';
    var im = new Image(); im.src = src; im.alt = '';
    st.appendChild(im);
    lb.querySelector('.lb__cap').innerHTML = '<span class="kindtag">' + esc(kind) + '</span> ' + cap;
    lb.hidden = false;
  }

  function paintDo(pane, st) {
    (st.activities || []).forEach(function (a, i) {
      var card = window.Engine.render(a, i, st.id + ':' + i);
      if (p(st.id).done[i]) {
        var tick = document.createElement('span');
        tick.className = 'verdict ok'; tick.textContent = '✓ answered correctly earlier'; tick.style.marginLeft = 'auto';
        var top = card.querySelector('.act__top');
        if (top) top.appendChild(tick);
      }
      card.addEventListener('result', function (e) {
        if (!e.detail) return;
        var rec = p(st.id);
        rec.per = rec.per || {};
        rec.per[i] = (rec.per[i] || 0) + 1;
        if (!rec.first) rec.first = Date.now();
        rec.last = Date.now();
        if (e.detail.correct && !rec.done[i] && rec.per[i] === 1) { rec.one = rec.one || {}; rec.one[i] = true; }
        rec.tried[i] = true;
        if (e.detail.correct) rec.done[i] = true;
        save(); paintHeader(); paintRail(); refreshTabCount();
        var s = stationScore(st.id);
        if (e.detail.correct && s.done === s.total) toast('Station complete: ' + st.name);
      });
      pane.appendChild(card);
    });

    var nav = document.createElement('div');
    nav.className = 'act__foot'; nav.style.justifyContent = 'space-between';
    var i = ORDER.indexOf(st.id);
    if (i > 0) {
      var prev = document.createElement('button');
      prev.className = 'btn btn--ghost'; prev.textContent = '← ' + S[ORDER[i - 1]].name;
      prev.addEventListener('click', function () { open(ORDER[i - 1]); });
      nav.appendChild(prev);
    }
    if (i < ORDER.length - 1) {
      var next = document.createElement('button');
      next.className = 'btn'; next.textContent = 'Next: ' + S[ORDER[i + 1]].name + ' →';
      next.addEventListener('click', function () { open(ORDER[i + 1]); });
      nav.appendChild(next);
    }
    pane.appendChild(nav);
  }
  function refreshTabCount() {
    var sc = stationScore(current);
    var n = document.querySelector('.tabs .tab:last-child .tab__n');
    if (n) n.textContent = sc.done + '/' + sc.total;
  }

  /* ---------- open a station, or a group on the tree ---------- */
  function open(id, focusTerm, cameFrom) {
    if (!S[id]) return;
    current = id;
    tab = 'learn';
    p(id).opened = true;
    save();
    /* The keys station swaps the tree of life for the key, drawn. */
    var pc = document.querySelector('.platecol');
    if (pc) pc.classList.toggle('is-key', id === 'keys');
    /* the widgets are about to be rebuilt, so the plate forgets which ones it knew about;
       each key registers itself again as it is built, and brings its saved route with it */
    if (window.KeyPlate) window.KeyPlate.reset();
    if (id !== 'keys' && window.Plate) window.Plate.showStation(S[id]);
    paintPanel(); paintRail();
    if (focusTerm) focusOnTerm(focusTerm, cameFrom);
    if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  }
  /* ---------- landing in the right place ----------
     Following a word to another station used to CENTRE the paragraph it landed on, so on any
     paragraph taller than half the panel the reader arrived in the middle of it and had to
     scroll back up to find where it began. It now puts the START of the block just below the
     top of the panel.

     Two things have to be measured rather than assumed. The tab bar is position:sticky at
     top:0 inside the panel, so anything scrolled to the panel's top edge lands underneath it;
     and its height is not the same on a laptop, an iPad and a phone. And a picture above the
     target can finish loading just after the scroll and push everything down, so the position
     is re-applied on the next frame and once more a moment later. */
  /* Which box actually scrolls. Below 1000px the panel is overflow:visible and .stage takes
     over the scrolling, so scrolling #panel there moves nothing at all — which is why a jump
     did nothing on an iPad held upright or on a phone. Never assume; walk up and find it. */
  function scrollerFor(el) {
    for (var n = el.parentNode; n && n.nodeType === 1 && n !== document.body; n = n.parentNode) {
      var oy = window.getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 4) return n;
    }
    return document.scrollingElement || document.documentElement;
  }
  /* The tab bar sticks to the top of that same box, so the first line a reader can actually
     read starts below it, not at the box's top edge. */
  function stickyInset(scroller) {
    var tabs = document.querySelector('#panelInner .tabs');
    if (!tabs || window.getComputedStyle(tabs).position !== 'sticky') return 0;
    var tr = tabs.getBoundingClientRect(), sr = topOf(scroller);
    return tr.height && tr.top <= sr + tr.height + 2 ? Math.round(tr.height) : 0;
  }
  function topOf(scroller) {
    return scroller === document.scrollingElement || scroller === document.documentElement
      ? 0 : scroller.getBoundingClientRect().top;
  }
  /* A word can send a reader into a section that is folded shut — the "optimum pH" line lives
     inside a closed <details>, and scrolling to something behind a shut disclosure scrolls to
     nothing the reader can see. Open the way in first. */
  function revealAncestors(target) {
    for (var n = target.parentNode; n && n.nodeType === 1; n = n.parentNode) {
      if (n.tagName === 'DETAILS' && !n.open) n.open = true;
    }
  }
  function placeBlock(target, smooth, gap) {
    revealAncestors(target);
    var sc = scrollerFor(target);
    var inset = stickyInset(sc) + (gap == null ? 14 : gap);
    var prev = sc.style.scrollBehavior;
    sc.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    sc.scrollTop += (target.getBoundingClientRect().top - topOf(sc)) - inset;
    sc.style.scrollBehavior = prev || '';
  }
  /* Re-place on the next frame and again shortly after: a picture above the target often
     finishes loading after the first scroll and pushes the paragraph back down the page. */
  function landOn(target, smooth) {
    placeBlock(target, smooth);
    requestAnimationFrame(function () { placeBlock(target, false); });
    setTimeout(function () { placeBlock(target, false); }, 160);
  }
  function panelScroller() {
    var inner = document.getElementById('panelInner');
    return inner ? scrollerFor(inner) : (document.scrollingElement || document.documentElement);
  }
  function toStationTop() { var sc = panelScroller(); if (sc) sc.scrollTop = 0; }

  /* a group clicked on the tree opens the station that teaches it, on that group */
  function openGroup(gid) {
    var id = OWNER[gid];
    if (!id) { toast('No station teaches that group yet.'); return; }
    if (current !== id || tab !== 'learn') { current = id; tab = 'learn'; p(id).opened = true; save(); paintPanel(); paintRail(); }
    if (window.Plate) window.Plate.focus(gid);
    history.replaceState(null, '', '#' + gid);
    var target = document.querySelector('#panelInner [data-group="' + gid + '"]');
    if (!target) return;
    landOn(target, true);
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 2800);
  }

  /* Plurals English refuses to make regularly, and which this lab uses constantly. */
  var SAME_WORD = { genera: 'genus', phyla: 'phylum', taxa: 'taxon', fungi: 'fungus', fungal: 'fungus',
    bacteria: 'bacterium', nuclei: 'nucleus', algae: 'alga', sporangia: 'sporangium',
    stimuli: 'stimulus', larvae: 'larva', ancestry: 'ancestor', classify: 'classification' };

  /* An element's words, with a space at every child boundary. Read straight off textContent,
     a badge letter in its own <span> glues itself to the first word — "SClassification
     systems" — and a whole-word search then fails on a word that is plainly there. */
  function wordsOf(el) {
    var out = '', w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) out += ' ' + n.nodeValue;
    return out.replace(/\s+/g, ' ').trim();
  }

  function focusOnTerm(term, cameFrom) {
    var low = String(term).toLowerCase().trim();
    var esc = function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
    var whole = function (t) { return new RegExp('(?<![A-Za-z0-9-])' + esc(t) + '(?![A-Za-z0-9-])', 'i'); };
    var starts = function (t) { return new RegExp('(?<![A-Za-z0-9-])' + esc(t), 'i'); };

    /* Tried in order, most exact first. A reader clicking "ancestry" is sent to the station
       that says "ancestor", "genera" to the one that says "genus", "animal kingdom" to the
       line about animals. Without these, nine words arrived with nothing found and nothing
       highlighted, which leaves a reader at the top of a station wondering why. */
    var tries = [whole(low)];
    if (SAME_WORD[low]) tries.push(whole(SAME_WORD[low]));
    var trimmed = low.replace(/(ies|es|ing|ed|al|ic|um|s|y)$/, '');
    if (trimmed.length >= 4 && trimmed !== low) tries.push(starts(trimmed));
    if (low.length >= 7) tries.push(starts(low.slice(0, 6)));
    if (/ /.test(low)) tries.push(whole(low.split(' ')[0]));

    /* Where to look, best first: the keyword card that defines it, then the lines a student
       reads, then anything else on the station that names it. */
    var ORDER = [
      ['#panelInner .kw', function (el) { return el.querySelector('dt') || el; }],
      ['#panelInner .exam-list > li', null],
      ['#panelInner .later__list li', null],
      ['#panelInner li', null],
      ['#panelInner .st-sub, #panelInner .card p, #panelInner .widget__note, #panelInner p', null],
      ['#panelInner td, #panelInner th', null]
    ];
    function firstIn(sel, re, pick) {
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) {
        var probe = pick ? pick(els[i]) : els[i];
        if (probe && re.test(wordsOf(probe))) return els[i];
      }
      return null;
    }
    var target = null, t, k;
    for (t = 0; t < tries.length && !target; t++)
      for (k = 0; k < ORDER.length && !target; k++) target = firstIn(ORDER[k][0], tries[t], ORDER[k][1]);
    /* a table cell is not a paragraph: take the whole table, so the headings come with it */
    if (target && /^(TD|TH)$/.test(target.tagName)) target = target.closest('.ctable') || target.closest('table') || target;

    if (!target) {
      /* nothing on this station names it. Start the reader at the beginning rather than
         leaving them wherever the previous scroll happened to be. */
      toStationTop();
      if (cameFrom && S[cameFrom]) showBackChip(cameFrom, term);
      return;
    }
    /* arriving from another station: there is nothing to animate from, so land instantly */
    landOn(target, cameFrom == null);
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 2800);
    if (cameFrom && S[cameFrom]) showBackChip(cameFrom, term);
  }

  var backChip = null, whereWeWere = null;
  function jumpTo(el, top) { var prev = el.style.scrollBehavior; el.style.scrollBehavior = 'auto'; el.scrollTop = top; el.style.scrollBehavior = prev || ''; }
  function markWhereWeAre() { var sc = panelScroller(); whereWeWere = { id: current, top: sc ? sc.scrollTop : 0, tab: tab }; }
  function goBackToMark(id) {
    var w = whereWeWere && whereWeWere.id === id ? whereWeWere : null;
    open(id);
    if (!w) return;
    requestAnimationFrame(function () { requestAnimationFrame(function () { var sc = panelScroller(); if (sc) jumpTo(sc, w.top); }); });
  }
  function showBackChip(id, term) {
    if (backChip) backChip.remove();
    var b = document.createElement('button');
    b.className = 'backchip'; b.innerHTML = '← back to ' + esc(S[id].name); b.title = 'You followed "' + term + '" from here';
    b.addEventListener('click', function () { b.remove(); backChip = null; goBackToMark(id); });
    document.getElementById('panel').appendChild(b);
    backChip = b;
    setTimeout(function () { if (backChip === b) b.classList.add('is-fading'); }, 9000);
    setTimeout(function () { if (backChip === b) { b.remove(); backChip = null; } }, 11000);
  }

  /* ---------- who is handing in ---------- */
  var SIGNIN_KEY = LAB + '.signin';
  var signIn = null;
  try { var sv = JSON.parse(localStorage.getItem(SIGNIN_KEY) || 'null'); if (sv && sv.exp * 1000 > Date.now() + 60000) signIn = sv; } catch (e) {}
  function readToken(jwt) {
    try {
      var b = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var j = JSON.parse(decodeURIComponent(escape(atob(b))));
      return { token:jwt, name:j.name || j.email || '', email:j.email || '', exp:j.exp || 0 };
    } catch (e) { return null; }
  }
  function onCredential(res) {
    var who = res && res.credential ? readToken(res.credential) : null;
    if (!who) return;
    signIn = who;
    try { localStorage.setItem(SIGNIN_KEY, JSON.stringify(who)); } catch (e) {}
    if (document.getElementById('subWho')) fillSubmit();
    if (afterSignIn) { var go = afterSignIn; afterSignIn = null; go(); }
  }
  function signInReady() { return !!((window.LAB_CONFIG || {}).googleClientId) && window.google && google.accounts && google.accounts.id; }
  function mountSignIn(el) {
    if (!signInReady()) return false;
    try {
      google.accounts.id.initialize({ client_id: (window.LAB_CONFIG || {}).googleClientId, callback: onCredential, auto_select: true });
      google.accounts.id.renderButton(el, { theme:'outline', size:'large', text:'signin_with', width: 260 });
      return true;
    } catch (e) { return false; }
  }
  function signOut() {
    signIn = null;
    try { localStorage.removeItem(SIGNIN_KEY); } catch (e) {}
    try { if (signInReady()) google.accounts.id.disableAutoSelect(); } catch (e) {}
    fillSubmit();
  }

  /* ---------- carrying work between computers ----------
     Progress lives in this browser, so another computer starts from nothing. What was HANDED
     IN is in the teacher's spreadsheet, together with a note of which questions were right, so
     signing in here brings it back. js/sync.js does the folding-in and only ever adds: a
     question right on either machine stays right, so pressing Sync cannot lose anything. */
  var LAB_ID = LAB;
  var afterSignIn = null;

  function snapshotNow() {
    return (window.LabSync && window.LabSync.snapshot)
      ? window.LabSync.snapshot(progress, S, ORDER, stationSig) : '';
  }

  function syncEnabled() { return !!((window.LAB_CONFIG || {}).submitUrl && window.LabSync); }

  function haveToken() { return !!(signIn && signIn.token && signIn.exp * 1000 > Date.now() + 60000); }
  /* A Google sign-in lasts about an hour and a lab takes longer than that, so by the time a
     student presses Hand in the token they hold is often dead. Try once for a fresh one. If
     Google will not give it, the hand-in goes anyway and the server's refusal is shown, which
     beats a dead end. */
  var askedAgain = false;

  /* Ask Google for a sign-in, then come back and finish. One Tap can be refused by the
     browser, so say what to do instead rather than leaving a dead button. */
  function signInThen(fn) {
    afterSignIn = fn;
    if (!signInReady()) { toast('Sign-in is not available here. Open Hand in and sign in there, then press Sync.'); return; }
    try {
      google.accounts.id.initialize({ client_id:(window.LAB_CONFIG || {}).googleClientId,
                                      callback:onCredential, auto_select:true });
      google.accounts.id.prompt(function (n) {
        if (n && (n.isNotDisplayed && n.isNotDisplayed() || n.isSkippedMoment && n.isSkippedMoment())) {
          toast('Google did not offer a sign-in. Open Hand in, sign in there, then press Sync.');
        }
      });
    } catch (e) { toast('Could not open sign-in. Open Hand in and sign in there instead.'); }
  }

  function applySnap(snap, quiet) {
    if (!snap) { if (!quiet) toast('Nothing has been handed in for this lab yet, so there is nothing to bring back.'); return; }
    var res = window.LabSync.merge(progress, snap, S, stationSig);
    if (res.added) { save(); reconcile(); paintHeader(); paintRail(); paintPanel(); refreshTabCount(); }
    if (!quiet || res.added) toast(window.LabSync.say(res));
  }

  /* quiet: after a hand-in, say nothing unless something actually came back. */
  function syncNow(quiet) {
    if (!syncEnabled()) { toast('This lab is not set up to keep marks, so there is nothing to sync with.'); return; }
    if (!haveToken()) { signInThen(function () { syncNow(quiet); }); return; }
    var btn = document.getElementById('btnSync');
    if (btn) { btn.disabled = true; btn.classList.add('is-busy'); }
    fetch((window.LAB_CONFIG || {}).submitUrl, {
      method:'POST', mode:'cors', headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify({ action:'progress', token: signIn.token })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        /* `why:'not signed in'` comes from the token check, NOT the class list — the records
           are not consulted about who is on it here. Saying "you are not on the class list"
           sent students to their teacher over a sign-in that had simply run out. */
        if (!j || !j.ok) { toast(j && j.why === 'not signed in'
          ? 'Your sign-in has run out. Sign in again, then press Sync.'
          : 'Could not reach your teacher\u2019s records just now.'); return; }
        var mine = j.labs && j.labs[LAB_ID];
        applySnap(mine && mine.snap, quiet);
      })
      .catch(function () { if (!quiet) toast('Could not reach your teacher\u2019s records just now.'); })
      .then(function () { if (btn) { btn.disabled = false; btn.classList.remove('is-busy'); } });
  }

  (function () {
    var btn = document.getElementById('btnSync');
    if (!btn) return;
    if (!syncEnabled()) return;                 /* no spreadsheet behind this lab: stay hidden */
    btn.hidden = false;
    btn.addEventListener('click', function () { syncNow(false); });
    /* Already signed in and nothing done here yet? Bring their work back without being asked. */
    if (haveToken()) {
      var empty = true;
      for (var k in progress) { var r = progress[k]; if (r && r.done && Object.keys(r.done).length) { empty = false; break; } }
      if (empty) syncNow(true);
    }
  })();

  /* ---------- handing in ---------- */
  function completionCode(name, form, score) {
    var raw = name.trim().toLowerCase() + '|' + form + '|' + score + '|' + LAB;
    var s1 = 0, s2 = 0;
    for (var i = 0; i < raw.length; i++) { s1 = (s1 * 31 + raw.charCodeAt(i)) >>> 0; s2 = (s2 ^ (s1 + i)) >>> 0; }
    var A = 'ACDEFGHJKLMNPQRTUVWXY3479';
    function chunk(n) { var o = ''; for (var k = 0; k < 4; k++) { o += A[n % A.length]; n = Math.floor(n / A.length); } return o; }
    return 'CL-' + chunk(s1) + '-' + chunk(s2);
  }
  function openSubmit() {
    var dlg = document.getElementById('subDlg');
    fillSubmit();
    dlg.hidden = false;
    document.getElementById('subClose').onclick = function () { dlg.hidden = true; };
    dlg.onclick = function (e) { if (e.target === dlg) dlg.hidden = true; };
    setTimeout(function () { var n = document.getElementById('subName'); if (n) n.focus(); }, 30);
  }
  function fillSubmit() {
    var t = totals();
    var cfg = window.LAB_CONFIG || {};
    var body = document.getElementById('subBody');
    var go = document.getElementById('subGo');
    var complete = t.done === t.total;
    var head = complete
      ? 'You have answered all <b>' + t.total + '</b> questions correctly.'
      : 'Not finished yet: <b>' + t.done + '</b> of <b>' + t.total + '</b> right so far. You can hand this in to show how far you have got, and hand in again when it is all right.';
    var work = '<p class="fineprint">It carries the work behind it too: <b>' + t.checks + '</b> check' + (t.checks === 1 ? '' : 's') + ', <b>' + t.first1 + '</b> right first time.</p>';

    if (!cfg.googleClientId) {
      body.innerHTML = '<p class="st-sub">' + head + '</p>' + work +
        '<label class="fld"><span>Your full name</span><input id="subName" type="text" autocomplete="name"></label>' +
        '<label class="fld"><span>Your class</span><select id="subForm">' + (cfg.classes || ['Other']).map(function (c) { return '<option>' + c + '</option>'; }).join('') +
        '</select></label><div id="subMsg" class="submsg"></div>';
      go.style.display = ''; go.textContent = 'Get my code'; go.onclick = doSubmit;
      return;
    }
    if (signIn) {
      body.innerHTML = '<p class="st-sub">' + head + '</p>' + work +
        '<div class="who">Handing in as <b>' + esc(signIn.name) + '</b><button type="button" class="tourcard__link" id="subOut">not you?</button></div>' +
        '<p class="fineprint">If you are on Dr&nbsp;Mompel\'s class list this goes into his records. If you are not — anyone in the world is welcome here — nothing is saved anywhere, and you still get your code.</p>' +
        '<div id="subMsg" class="submsg"></div>';
      go.style.display = ''; go.textContent = 'Hand in'; go.onclick = doSubmit;
      document.getElementById('subOut').onclick = signOut;
      return;
    }
    body.innerHTML = '<p class="st-sub">' + head + '</p>' + work +
      '<p class="fineprint">Sign in with your school Google account so Dr&nbsp;Mompel knows whose work this is. The lab is open to everyone; signing in is only how a result reaches his records.</p>' +
      '<div id="subWho" class="signinbox"></div><div id="subMsg" class="submsg"></div>';
    go.style.display = 'none';
    if (!mountSignIn(document.getElementById('subWho'))) {
      /* Sign-in did not load — offline, or a school filter has blocked accounts.google.com.
         This used to show "Get my code" with NO name field, so pressing it answered "Please
         type your full name" with nowhere to type it, and no code was ever issued. */
      document.getElementById('subWho').innerHTML =
        '<p class="fineprint">Google sign-in could not load, so this cannot go into Dr&nbsp;Mompel&rsquo;s records ' +
        'automatically. Type your name and you will still get your completion code.</p>' +
        '<label class="fld"><span>Your full name</span><input id="subName" type="text" autocomplete="name"></label>' +
        '<label class="fld"><span>Your class</span><select id="subForm">' +
        (cfg.classes || ['Other']).map(function (c) { return '<option>' + c + '</option>'; }).join('') +
        '</select></label>';
      go.style.display = ''; go.textContent = 'Get my code'; go.onclick = doSubmit;
      var nf = document.getElementById('subName'); if (nf) nf.focus();
    }
  }
  /* What the server says when it will not record a hand-in. Its own words are shown for
     anything not listed, so a new answer is never swallowed. */
  function whyNot(reply) {
    var r = String(reply || '').trim();
    if (/^not recorded: sign-in is not set up/.test(r))
      return 'Your work was sent, but the records are not set up to accept sign-ins yet, so nothing was saved. Show your teacher this message.';
    if (/^not recorded: not signed in/.test(r))
      return 'Your sign-in had run out, so nothing was saved. Sign in again and press Hand in once more.';
    if (/^not recorded: not on this class list/.test(r)) {
      var acc = r.match(/\(([^)]+)\)/);
      return 'The account you signed in with' + (acc ? ' (' + acc[1] + ')' : '') +
             ' is not on the class list, so nothing was saved for it. The list is matched on ' +
             'email address, not on name. Your code is still your receipt.';
    }
    if (/^busy/.test(r))
      return 'The records were busy. Press Hand in once more.';
    if (/^rejected/.test(r))
      return 'The records would not accept this hand-in: ' + r.replace(/^rejected:\s*/, '') + '.';
    if (/^unknown lab/.test(r))
      return 'The records do not know this lab yet. Show your teacher this message.';
    return 'Nothing was saved. The records answered: \u201c' + r + '\u201d.';
  }

  function doSubmit() {
    var name = signIn ? signIn.name : ((document.getElementById('subName') || {}).value || '');
    var form = (document.getElementById('subForm') || {}).value || '';
    var msg = document.getElementById('subMsg');
    var go = document.getElementById('subGo');
    if (name.trim().length < 3) { msg.className = 'submsg no'; msg.textContent = 'Please type your full name.'; return; }
    if (signIn && !haveToken() && !askedAgain) {
      askedAgain = true;
      msg.className = 'submsg'; msg.textContent = 'Your sign-in has run out \u2014 asking Google for a new one\u2026';
      signInThen(doSubmit); return;
    }
    var t = totals();
    var code = completionCode(name, form, t.done + '/' + t.total);
    var perStation = {};
    ORDER.forEach(function (id) {
      var s = stationScore(id), rec = p(id), c = 0;
      Object.keys(rec.per || {}).forEach(function (k) { if (+k < s.total) c += rec.per[k]; });
      perStation[id] = s.done + '/' + s.total + (c ? ' in ' + c : '');
    });
    var payload = { app:LAB, token: signIn ? signIn.token : '', name:name.trim(), form:form,
                    score:t.done, total:t.total, code:code, complete: t.done === t.total,
                    checks:t.checks, firstTime:t.first1, tried:t.tried,
                    from: t.from ? new Date(t.from).toISOString() : '', stations:perStation,
                    snap:snapshotNow(), at:new Date().toISOString() };
    var url = (window.LAB_CONFIG || {}).submitUrl;
    go.disabled = true;
    msg.className = 'submsg'; msg.textContent = url ? 'Sending…' : 'Generating your code…';
    /* `why` is the server saying it would not record this, in words a student can act on;
       `blind` means the reply could not be read at all and nothing should be claimed. */
    function finish(sent, offline, why, blind) {
      go.disabled = false; go.style.display = 'none';
      msg.className = why ? 'submsg no' : 'submsg ok';
      var head = why ? '<b>Not saved.</b> '
               : sent ? '<b>Handed in.</b> '
               : offline ? '<b>You are offline — nothing was sent yet.</b> '
               : '<b>Could not reach the server.</b> ';
      var tail = why ? why
        : sent
        ? (blind ? 'Your work went out, but this device could not read the answer, so keep your code as the receipt.'
                 : (signIn ? 'It is now in Dr Mompel&rsquo;s records. Your code is your receipt — keep it.' : 'Your code is your receipt — keep it.'))
        : offline ? 'Your work is saved on this device. Keep the code, and hand in again once you are back online.'
        : 'Paste this into the Google Classroom assignment to hand in.';
      msg.innerHTML = head + 'Your completion code is<div class="code">' + code + '</div>' + tail;
      try { localStorage.setItem(LAB + '.submitted', JSON.stringify({ name:name.trim(), form:form, code:code, at:payload.at, sent:sent })); } catch (e) {}
    }
    if (!url) { finish(false); return; }
    if (navigator.onLine === false) { finish(false, true); return; }
    /* The reply is read, not assumed. This used to go out with mode:'no-cors', which made the
       answer unreadable, so the page said "Handed in." whether the work had been recorded or
       refused — the one failure a student can do nothing about because they never hear of it.
       Sync already reads this same endpoint, so reading it here costs nothing. If the read
       itself fails, fall back to the old blind send rather than losing the hand-in. */
    fetch(url, { method:'POST', mode:'cors',
                 headers:{ 'Content-Type':'text/plain;charset=utf-8' },
                 body:JSON.stringify(payload) })
      .then(function (r) { return r.text(); })
      .then(function (reply) {
        if (/^recorded/.test(String(reply || '').trim())) { finish(true); return; }
        finish(true, false, whyNot(reply));
      })
      .catch(function () {
        fetch(url, { method:'POST', mode:'no-cors',
                     headers:{ 'Content-Type':'text/plain;charset=utf-8' },
                     body:JSON.stringify(payload) })
          .then(function () { finish(true, false, null, true); })
          .catch(function () { finish(false); });
      });
  }

  /* ---------- clicking a highlighted word ---------- */
  var peekEl = null;
  function closePeek() { if (peekEl) { peekEl.remove(); peekEl = null; } }
  function openPeek(el) {
    closePeek();
    var host = document.getElementById('panelInner');
    var src = el.getAttribute('data-peek'), note = el.getAttribute('data-note'), credit = el.getAttribute('data-credit');
    var pk = document.createElement('div');
    pk.className = 'peek';
    /* the same box reservation the finder pictures get: without it the note under the picture
       jumps down the moment the file lands */
    var pkw = (window.PHOTO_SIZE || {})[src] || (window.PHOTO_SIZE || {})[String(src).replace(/-900\.jpg$/, '')];
    /* "fig:name" draws one of the lab's own diagrams instead of a photograph. Some things
       cannot be photographed at all — a plasmid is inside a cell and far below the resolution
       of any school microscope — and showing a picture of the outside of a bacterium under the
       word "plasmids" teaches nothing. */
    var art = '';
    if (String(src).slice(0, 4) === 'fig:') {
      art = '<div class="peek__fig">' + (window.Learn ? window.Learn.svgFor(String(src).slice(4)) : '') + '</div>';
    } else if (src) {
      art = '<img src="assets/photos/' + src + '" alt="" decoding="async"' +
            (pkw ? ' width="' + pkw[0] + '" height="' + pkw[1] + '"' : '') + '>';
    }
    pk.innerHTML = art +
      '<div class="peek__note">' + note + (credit ? '<span class="peek__credit">' + credit + '</span>' : '') + '</div>' +
      '<button class="peek__x" aria-label="Close">×</button>';
    host.appendChild(pk);
    var sheet = window.innerWidth < 600;
    if (sheet) pk.className += ' peek--sheet';
    function place() {
      var hr = host.getBoundingClientRect(), r = el.getBoundingClientRect();
      var w = pk.offsetWidth, hh = pk.offsetHeight, pad = 8, gap = 8;
      var left = Math.min(Math.max(pad, (r.left - hr.left) + r.width / 2 - w / 2), host.clientWidth - w - pad);
      var below = window.innerHeight - r.bottom - gap - pad, above = r.top - gap - pad, room = Math.max(above, below), top;
      if (hh > room) { pk.style.maxHeight = room + 'px'; pk.style.overflowY = 'auto'; hh = pk.offsetHeight; }
      else { pk.style.maxHeight = ''; pk.style.overflowY = ''; }
      if (below >= hh) top = (r.bottom - hr.top) + gap; else top = (r.top - hr.top) - hh - gap;
      var vTop = hr.top + top;
      if (vTop + hh > window.innerHeight - pad) { top -= (vTop + hh) - (window.innerHeight - pad); vTop = hr.top + top; }
      if (vTop < pad) top += pad - vTop;
      pk.style.left = left + 'px'; pk.style.top = top + 'px';
    }
    if (!sheet) place();
    var im = pk.querySelector('img');
    if (im && !sheet) im.addEventListener('load', place);
    pk.querySelector('.peek__x').addEventListener('click', closePeek);
    peekEl = pk;
  }
  function wireTermClicks(root) {
    function act(t) {
      markWhereWeAre();
      if (t.hasAttribute('data-peek')) openPeek(t);
      else if (t.hasAttribute('data-gloss')) { closePeek(); window.LabGlossary(t.getAttribute('data-gloss')); }
      else { closePeek(); open(t.getAttribute('data-jump'), (t.getAttribute('data-term') || t.textContent).trim(), current); }
    }
    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-peek],[data-jump],[data-gloss]');
      if (!t) { closePeek(); return; }
      e.preventDefault(); act(t);
    });
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target.closest('[data-peek],[data-jump],[data-gloss]');
      if (!t) return;
      e.preventDefault(); act(t);
    });
  }

  /* ---------- toast, tooltips ---------- */
  var toastT = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.style.pointerEvents = ''; t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }
  document.addEventListener('click', function (e) {
    var tip = e.target.closest ? e.target.closest('.tip') : null;
    Array.prototype.forEach.call(document.querySelectorAll('.tip.is-open'), function (el) { if (el !== tip) el.classList.remove('is-open'); });
    if (tip) { e.preventDefault(); tip.classList.toggle('is-open'); }
  });

  /* ---------- credits: every picture, from the tree's own register ---------- */
  function paintCredits() {
    var cr = document.getElementById('creditsList'); var T = window.TREE; if (!cr || !T) return;
    var all = (T.groups || []).concat(T.viruses ? [T.viruses] : []);
    cr.innerHTML = 'Photographs: ' + all.filter(function (g) { return g.img; }).map(function (g) {
      return '<a href="' + esc(g.img.url) + '" target="_blank" rel="noopener">' + esc(g.label.toLowerCase()) + '</a> — ' + esc(g.img.credit);
    }).join(' · ') + '. Silhouettes, PhyloPic: ' + all.filter(function (g) { return g.sil; }).map(function (g) {
      return '<a href="' + esc(g.sil.url) + '" target="_blank" rel="noopener">' + esc(g.label.toLowerCase()) + '</a> by ' + esc(g.sil.by);
    }).join(' · ') + '.';
  }

  /* ---------- boot ---------- */
  function boot() {
    (window.STATIONS || []).forEach(function (s) { S[s.id] = s; ORDER.push(s.id); });
    ORDER.forEach(function (id) { (S[id].groups || []).forEach(function (g) { OWNER[g] = id; }); });
    var stale = reconcile();
    if (stale) console.info('Classification Lab: ' + stale + ' station record(s) reset — the questions there have changed since they were answered.');

    if (window.Plate) window.Plate.init({ onPick: openGroup });
    document.getElementById('btnSubmit').addEventListener('click', openSubmit);
    wireTermClicks(document.getElementById('panel'));
    window.addEventListener('resize', closePeek);
    var lb = document.getElementById('lightbox');
    lb.addEventListener('click', function () { lb.hidden = true; });
    paintCredits();

    /* ---------- the glossary ---------- */
    (function () {
      var dlg = document.getElementById('glossDlg'), list = document.getElementById('glossList');
      var find = document.getElementById('glossFind'), count = document.getElementById('glossCount');
      var built = false, pinTerm = null, atOpen = null;
      function tierTag(w) {
        if (w.ext) return ' <span class="tier tier--ext" title="Worth knowing, but 0610 will not ask you to name it">not asked in 0610</span>';
        if (w.sup) return ' <span class="tier tier--sup" title="Supplement — examined on Paper 4 (Extended) only">Supplement</span>';
        return '';
      }
      function build() {
        if (built) return; built = true;
        var all = (window.GLOSSARY || []).slice(), where = {};
        ORDER.forEach(function (id) { (S[id].keywords || []).forEach(function (w) { where[w.term.toLowerCase()] = id; }); });
        var groups = [], byId = {};
        ORDER.forEach(function (id) { byId[id] = { name: S[id].name, rows: [] }; groups.push(byId[id]); });
        var general = { name: 'Words used across the labs', rows: [] }, pinned = null;
        all.forEach(function (e) {
          if (pinTerm && e.term.toLowerCase() === pinTerm && !pinned) { pinned = e; return; }
          (byId[where[e.term.toLowerCase()]] || general).rows.push(e);
        });
        if (general.rows.length) groups.push(general);
        if (pinned) groups.unshift({ name: 'The word you tapped', rows: [pinned] });
        list.innerHTML = groups.filter(function (g) { return g.rows.length; }).map(function (g) {
          return '<section class="gloss__grp"><h3 class="gloss__h">' + esc(g.name) + '</h3><dl class="gloss__dl">' + g.rows.map(function (w) {
            var known = window.Terms && window.Terms.isKnown(w.term);
            var got = '<button type="button" class="gloss__got' + (known ? ' is-known' : '') + '" data-got="' + esc(w.term) + '">' +
                      (known ? '✓ you know this — show it again' : 'I know this one — stop marking it') + '</button>';
            var also = (w.also || []).length ? '<p class="gloss__also">See also: ' + w.also.map(function (t) { return '<button type="button" class="gloss__see" data-see="' + esc(t) + '">' + esc(t) + '</button>'; }).join(' ') + '</p>' : '';
            return '<div class="gloss__row" data-term="' + esc((w.term + ' ' + w.def).toLowerCase()) + '"><dt>' + esc(w.term) + tierTag(w) + '</dt><dd>' + esc(w.def) + also + got + '</dd></div>';
          }).join('') + '</dl></section>';
        }).join('');
      }
      function filter() {
        var q = (find.value || '').trim().toLowerCase();
        var rows = list.querySelectorAll('.gloss__row'), shown = 0;
        Array.prototype.forEach.call(rows, function (r) { var hit = !q || r.getAttribute('data-term').indexOf(q) >= 0; r.hidden = !hit; if (hit) shown++; });
        Array.prototype.forEach.call(list.querySelectorAll('.gloss__grp'), function (g) { g.hidden = !g.querySelector('.gloss__row:not([hidden])'); });
        count.textContent = q ? (shown ? shown + (shown === 1 ? ' word' : ' words') + ' match “' + find.value.trim() + '”' : 'Nothing matches “' + find.value.trim() + '”')
                              : rows.length + ' key words across ' + list.querySelectorAll('.gloss__grp').length + ' stations';
      }
      function countKnown() {
        var n = window.Terms ? window.Terms.knownCount() : 0;
        var el = document.getElementById('glossKnown'); if (!el) return;
        el.hidden = !n;
        el.innerHTML = n + (n === 1 ? ' word is' : ' words are') + ' marked as known. <button type="button" id="glossForget">Mark them all as new again</button>';
        var f = document.getElementById('glossForget');
        if (f) f.addEventListener('click', function () { window.Terms.forgetAll(); built = false; build(); filter(); countKnown(); paintPanel(); });
      }
      function openG(term) {
        var sc = panelScroller();
        atOpen = sc ? sc.scrollTop : null;
        pinTerm = term ? String(term).trim().toLowerCase() : null;
        built = false; build(); find.value = term || ''; filter(); countKnown(); dlg.hidden = false;
        var box = dlg.querySelector('.modal__box'); if (box) box.scrollTop = 0;
        var touch = false; try { touch = matchMedia('(pointer: coarse)').matches; } catch (e) {}
        if (!term && !touch) setTimeout(function () { try { find.focus({ preventScroll: true }); } catch (e) { find.focus(); } if (box) box.scrollTop = 0; }, 30);
      }
      window.LabGlossary = openG;
      document.getElementById('btnGloss').addEventListener('click', function () { openG(''); });
      function close() { dlg.hidden = true; var sc = panelScroller(); if (sc && atOpen != null) jumpTo(sc, atOpen); }
      document.getElementById('glossClose').addEventListener('click', close);
      dlg.addEventListener('click', function (e) { if (e.target === this) close(); });
      find.addEventListener('input', filter);
      list.addEventListener('click', function (e) {
        var got = e.target.closest('.gloss__got');
        if (got) {
          var term = got.getAttribute('data-got'), now = !(window.Terms && window.Terms.isKnown(term));
          window.Terms.setKnown(term, now);
          got.classList.toggle('is-known', now);
          got.textContent = now ? '✓ you know this — show it again' : 'I know this one — stop marking it';
          countKnown(); paintPanel(); return;
        }
        var b = e.target.closest('.gloss__see'); if (!b) return;
        find.value = b.getAttribute('data-see'); filter();
        var box2 = dlg.querySelector('.modal__box'); if (box2) box2.scrollTop = 0;
      });
    })();

    document.getElementById('btnHelp').addEventListener('click', function () { document.getElementById('modal').hidden = false; });
    document.getElementById('modalClose').addEventListener('click', function () { document.getElementById('modal').hidden = true; });
    document.getElementById('modal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closePeek();
      document.getElementById('modal').hidden = true;
      document.getElementById('glossDlg').hidden = true;
      document.getElementById('subDlg').hidden = true;
      lb.hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('.tip.is-open'), function (el) { el.classList.remove('is-open'); });
    });
    /* the questions count in the header opens this station's questions: students click it expecting them */
    var qStat = document.querySelector('.hdr .stat[title="Questions answered correctly"]');
    if (qStat) {
      qStat.setAttribute('role', 'button'); qStat.tabIndex = 0; qStat.title = 'Open the questions for this station'; qStat.classList.add('stat--go');
      var goQuestions = function () {
        if (current == null) return;
        tab = 'do'; paintPanel();
        var tabs = document.querySelector('#panelInner .tabs'); if (tabs && tabs.scrollIntoView) tabs.scrollIntoView({ block: 'start' });
      };
      qStat.addEventListener('click', goQuestions);
      qStat.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goQuestions(); } });
    }
    document.getElementById('btnReset').addEventListener('click', function () {
      if (!confirm('Clear all your answers and start again? This cannot be undone.')) return;
      progress = {};
      try { localStorage.removeItem(STORE); } catch (e) {}
      paintHeader(); paintRail(); paintPanel();
      toast('Progress cleared.');
    });

    /* a link can name a station or a group on the tree */
    function fromHash() {
      var hsh = (location.hash || '').slice(1);
      if (S[hsh]) { open(hsh); return true; }
      if (OWNER[hsh]) { open(OWNER[hsh]); openGroup(hsh); return true; }
      return false;
    }
    if (!fromHash()) open(ORDER[0]);
    paintHeader();
    window.addEventListener('hashchange', function () {
      var hsh = location.hash.slice(1);
      if (S[hsh] && hsh !== current) open(hsh);
      else if (OWNER[hsh]) openGroup(hsh);
    });
  }

  /* GitHub Pages caches the HTML for ten minutes; the page's own stamp comes from its script
     tags, and the banner only shows once the server's index.html carries a newer one. */
  var pageVersion = (function () {
    var sc = document.querySelector('script[src*="stations.js"]');
    var m = sc && (sc.getAttribute('src') || '').match(/[?&]v=(\d+)/);
    return m ? m[1] : null;
  })();
  var updateShown = false;
  function checkForUpdate() {
    if (!pageVersion || updateShown || document.hidden) return;
    fetch('version.txt', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (v) {
        v = v && v.trim();
        if (!v || v === pageVersion) return;
        return fetch(location.pathname, { cache: 'reload' })
          .then(function (r) { return r.ok ? r.text() : ''; })
          .then(function (html) {
            var m = html.match(/stations\.js\?v=(\d+)/);
            if (!m || m[1] === pageVersion) return;
            updateShown = true;
            var t = document.getElementById('updBar') || document.getElementById('toast');
            t.innerHTML = 'A newer version of this page is available. <button class="btn btn--ghost" style="margin-left:8px;padding:3px 12px;font-size:13px" onclick="location.reload()">Reload</button>';
            t.style.pointerEvents = 'auto'; t.classList.add('show');
          });
      }).catch(function () {});
  }
  setTimeout(checkForUpdate, 4000);
  setInterval(checkForUpdate, 10 * 60 * 1000);
  window.LabUpdateCheck = checkForUpdate;
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(checkForUpdate, 800); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
