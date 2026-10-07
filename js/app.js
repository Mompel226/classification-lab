/* ============================================================
   app.js — wiring: tree ⇄ panel ⇄ rail, progress, saving.
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
    if (typeof queueSave === 'function') queueSave();   /* the records get it a couple of minutes later */
    try { localStorage.setItem(STORE, JSON.stringify(progress)); }
    catch (e) {
      /* Private browsing, or a school profile with site data blocked. Said once per session. */
      if (!saveBroken) { saveBroken = true; toast('This browser cannot keep your work between visits — sign in, so it goes to Dr Mompel’s records as you work, and do not reload.'); }
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
    var sig = acts.length + ':' + hash36(body);
    /* `keep` (7 Oct 2026): a station reworded WITHOUT changing what it asks keeps the fingerprint its
       records were saved under, so nobody's ticks, scores, homework or practice move (Daniel: the
       multiple-choice options were rewritten so that the right answer is no longer the longest, and
       the work pupils had done was not to be lost). keep = { sig: the old fingerprint, now: the
       fingerprint of the wording it was declared for }. It holds only while the station reads
       exactly as declared: reword it again and `now` no longer matches, so the station resets as
       any changed station does. Written by tools/keep-records.mjs after it has checked that every
       question still asks the same thing; never by hand. Every copy of this function must agree
       (tools/syllabus-tags.mjs, the labs script's _labSig_). */
    var kp = st.keep;
    return kp && kp.now === sig && typeof kp.sig === 'string' ? kp.sig : sig;
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
  /* A station's numbers: this go, and what the record keeps (js/sync.js counts both).
       done, tried        this go: the Practise tab and the ticks on its questions
       best, bestTried    best ever: the header, the rail's ✓, the teacher's Score
       firstRight         right first time on the FIRST go, so a redo cannot make it look better
       checks             every Check pressed, every go: this browser's own, with what the records hold
     Only positions that still exist count, so a stale record can never push a score above the
     number of questions actually asked. */
  function countsOf(rec, n) {
    if (window.LabSync) return window.LabSync.counts(rec, n);
    /* js/sync.js did not arrive: this go is all there is */
    var o = { go:1, done:0, tried:0, bestDone:0, bestTried:0, firstRight:0, firstTried:0, checks:0 };
    for (var i = 0; i < n; i++) {
      if (rec.done && rec.done[i]) { o.done++; if (rec.one && rec.one[i]) o.firstRight++; }
      if (rec.tried && rec.tried[i]) o.tried++;
    }
    Object.keys(rec.per || {}).forEach(function (k) { if (+k < n) o.checks += rec.per[k]; });
    o.bestDone = o.done; o.bestTried = o.tried; o.firstTried = o.tried;
    return o;
  }
  function stationScore(id) {
    var st = S[id];
    if (!st) return { done:0, total:0, tried:0, best:0, bestTried:0, go:1, firstRight:0, firstTried:0, checks:0 };
    var total = (st.activities || []).length, c = countsOf(p(id), total);
    return { done:c.done, total:total, tried:c.tried, best:c.bestDone, bestTried:c.bestTried, go:c.go,
             firstRight:c.firstRight, firstTried:c.firstTried, checks:c.checks };
  }
  /* The whole lab as the record keeps it: best ever, right first time on the first go, every check. */
  function totals() {
    var done = 0, total = 0, tried = 0, checks = 0, first1 = 0, from = 0;
    ORDER.forEach(function (id) {
      var s = stationScore(id), rec = p(id);
      done += s.best; total += s.total; tried += s.bestTried; checks += s.checks; first1 += s.firstRight;
      if (rec.first && (!from || rec.first < from)) from = rec.first;
    });
    return { done:done, total:total, tried:tried, checks:checks, first1:first1, from:from };
  }

  /* ---------- header ---------- */
  function paintHeader() {
    var t = totals(), pct = t.total ? t.done / t.total : 0, C = 2 * Math.PI * 11;
    paintSaveChip();
    document.getElementById('ringFg').setAttribute('stroke-dasharray', (C * pct).toFixed(1) + ' ' + C.toFixed(1));
    document.getElementById('qDone').textContent = t.done;
    document.getElementById('qTotal').textContent = t.total;
    document.getElementById('stDone').textContent = ORDER.filter(function (id) { var s = stationScore(id); return s.total && s.best === s.total; }).length;
    document.getElementById('stTotal').textContent = ORDER.length;
  }

  /* ---------- the rail ---------- */
  function paintRail() {
    var track = document.getElementById('railTrack');
    track.innerHTML = '';
    ORDER.forEach(function (id, i) {
      var st = S[id]; if (!st) return;
      var sc = stationScore(id), full = sc.total && sc.best === sc.total;
      var b = document.createElement('button');
      b.className = 'rstep' + (full ? ' done' : '');
      b.setAttribute('aria-current', id === current ? 'true' : 'false');
      b.title = st.name + ' — ' + (sc.go > 1 ? 'round ' + sc.go + ': ' + sc.done + ' of ' + sc.total + ' answered' + (full ? ' · done before ✓' : '') : sc.done + ' of ' + sc.total + ' questions answered');
      var n = document.createElement('span'); n.className = 'rstep__n'; n.textContent = full ? '✓' : (i + 1);
      var lab = document.createElement('span'); lab.textContent = st.name;
      var bar = document.createElement('span'); bar.className = 'rstep__bar';
      var fill = document.createElement('i'); fill.style.width = (sc.total ? (sc.done / sc.total) * 100 : 0) + '%';
      bar.appendChild(fill);
      b.appendChild(n); b.appendChild(lab); b.appendChild(bar);
      b.addEventListener('click', function () { open(id); });
      /* homework set for this pupil: red not started, orange part done, green done (labs-shared/engine/homework.js) */
      if (window.LabHomework) window.LabHomework.mark(b, id, sc.best, sc.total);
      track.appendChild(b);
    });
    var cur = track.querySelector('[aria-current="true"]');
    if (cur) cur.scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' });
  }

  /* ---------- panel ---------- */
  /* the other number of a term, when the glossary gives one: stoma → stomata, microvilli → microvillus */
  function numberOf(w) { return w && w.plural ? ' <small class="num" title="The plural">plural: ' + esc(w.plural) + '</small>' : w && w.singular ? ' <small class="num" title="The singular">singular: ' + esc(w.singular) + '</small>' : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ---------- the old syllabus ----------
     What this lab teaches that the syllabus for 2026–2029 does not include, although an older 0610 syllabus did
     (the statements tagged in ../classification-lab-source/past-syllabus.json). It stays, because past papers ask it, and its badge names the syllabus it
     belongs to. The words are Cambridge's own, from labs-shared/syllabus-past.json through the build. */
  var PAST = window.PAST_SYLLABUS || { statements: {}, terms: {} };
  function pastTerm(term) { return (PAST.terms || {})[String(term || '').toLowerCase()] || null; }
  function pastBadge(id, cls) {
    var x = (PAST.statements || {})[id && id.id ? id.id : id];
    if (!x) return '';
    /* the note says what the syllabus for 2026–2029 does instead, and whether recent papers still give marks for it */
    var tip = 'In the 0610 syllabus until ' + x.until + (x.tier ? ' (' + x.tier + ')' : '') + ': \u201c' + x.text + '\u201d. ' +
              (x.note || ('It is not in the syllabus for 2026\u20132029, but an exam question can still use it, and past papers up to ' + x.until + ' may ask it directly.'));
    return '<span class="' + (cls || 'sup sup--old') + ' tip" tabindex="0" data-tip="' + esc(tip).replace(/"/g, '&quot;') + '">old syllabus \u00b7 until ' + esc(x.until) + '</span>';
  }
  /* a sentence only part of which is old: the badge goes in front of that part (`from`, in past-syllabus.json) */
  function pastSplit(txt, pe, M) {
    var at = pe && pe.from ? String(txt).indexOf(pe.from) : -1;
    return at >= 0 ? (at ? M(txt.slice(0, at)) : '') + pastBadge(pe.id) + ' ' + M(txt.slice(at)) : null;
  }
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
    /* the exams this list is for: Cambridge's syllabus for 2029 is word for word the one for 2026–2028 (checked 28 Sep
       2026), so one list serves every student sitting the exams from 2026 to 2029 — the IGCSE 0610 badge says whose is whose */
    card.innerHTML = '<div class="card__h">What you need to know <span class="card__hsub">\u00b7 for exams in 2026\u20132029</span></div>';
    var list = document.createElement('ul');
    list.className = 'exam-list';
    card.appendChild(list);

    /* What you need to know holds the syllabus for 2026–2029 only (Daniel, 28 Sep 2026: "do not add these to the what
       you need to know sections but a separate one"). A sentence from an older 0610 syllabus (tagged in
       past-syllabus.json) or beyond the syllabus (`ext`) is drawn the same way, with its pictures and widgets,
       but in the card below: "Not in the syllabus for 2026–2029". Each li keeps its place in the master as data-i. */
    var off = { old: document.createElement('ul'), beyond: document.createElement('ul') }, offAt = { old: [], beyond: [] };
    off.old.className = off.beyond.className = 'exam-list exam-list--off';
    function offOf(b, i) {
      if (st.past && st.past.exam && st.past.exam[i] != null) return 'old';
      return typeof b === 'object' && b.ext ? 'beyond' : null;
    }

    (st.learn.exam || []).forEach(function (b, i) {
      var offK = offOf(b, i);
      var li = document.createElement('li');
      var txt = typeof b === 'string' ? b : b.text;
      var badge = '';
      if (typeof b === 'object' && b.sup) badge = '<span class="sup tip" tabindex="0" data-tip="Supplement — examined on the Extended papers (2 and 4) only. Core candidates can skip it.">S</span>';
      /* in an older 0610 syllabus: its badge names that syllabus; beyond the syllabus: no badge, its heading says so */
      var pe = st.past && st.past.exam ? st.past.exam[i] : null;
      if (pe != null) badge = pastBadge(pe);
      else if (offK === 'beyond') badge = '';
      li.innerHTML = badge + M(txt);
      li.setAttribute('data-i', i);
      if (offK) offAt[offK].push({ k: typeof b === 'object' && b.near != null ? b.near + 0.5 : i, li: li });
      else list.appendChild(li);
      /* the thing to press, drag or count sits under the sentence it belongs to */
      widgets.filter(function (w) { return w.after === i; }).forEach(function (w) { li.appendChild(window.Learn.widget(w, WIDGET_CTX)); });
    });
    widgets.filter(function (w) { return w.after == null; }).forEach(function (w) { card.appendChild(window.Learn.widget(w, WIDGET_CTX)); });
    /* the card below reads in the station's order: a part moved out of sentence 3 comes after sentence 3 (`near`) */
    ['old', 'beyond'].forEach(function (k) {
      offAt[k].sort(function (x, y) { return x.k - y.k; }).forEach(function (x) { off[k].appendChild(x.li); });
    });

    var goldOld = null;
    if (st.learn && st.learn.golden) {
      var g = document.createElement('div');
      g.className = 'golden';
      var gOld = !!(st.past && st.past.golden && !st.past.golden.from);
      g.innerHTML = '<div class="golden__h">⬤ Check yourself — the mistake students make here' + (gOld ? ' ' + pastBadge(st.past.golden) : '') + '</div><p>' + (pastSplit(st.learn.golden, st.past && st.past.golden, M) || M(st.learn.golden)) + '</p>';
      /* a mistake about something from an older syllabus goes with it, into the card below */
      if (gOld) goldOld = g; else card.appendChild(g);
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

    /* the sentences that are not in the syllabus for 2026–2029, right below the ones that are */
    if (off.old.children.length || off.beyond.children.length || goldOld) {
      var oc = document.createElement('div');
      oc.className = 'card offsyl';
      oc.innerHTML = '<div class="card__h">Not in the syllabus for 2026\u20132029</div>' +
        /* Daniel, 28 Sep: not in the syllabus does not mean a question cannot lead there, and knowing it can be
           what earns the last marks — so the card says so, and nothing in it says "you will not be asked" */
        '<p class="offsyl__lead">Do not skip this card. The syllabus for 2026\u20132029 does not list these, but an exam question can still use them \u2014 and knowing them can be what earns you full marks.</p>';
      if (off.old.children.length || goldOld) {
        oc.insertAdjacentHTML('beforeend', '<div class="offsyl__h">In older syllabuses \u2014 you may meet these in past papers</div>');
        oc.appendChild(off.old);
        if (goldOld) oc.appendChild(goldOld);
      }
      if (off.beyond.children.length) {
        oc.insertAdjacentHTML('beforeend', '<div class="offsyl__h">Beyond the syllabus \u2014 here to help the rest make sense</div>');
        oc.appendChild(off.beyond);
      }
      pane.appendChild(oc);
    }

    var further = (st.learn && st.learn.further) || [];
    if (further.length) {
      var L = document.createElement('div');
      L.className = 'card later';
      L.innerHTML = '<div class="card__h">Going further — links to other topics, IB, and beyond the syllabus</div>' +
        '<ul class="later__list">' + further.map(function (x, j) {
          var pid = st.past && st.past.further ? st.past.further[j] : null;   /* in an older 0610 syllabus: say which */
          var kind = /^IB/.test(x.ref) ? ' later__ref--ib' : /^(Beyond|Not in)/.test(x.ref) ? ' later__ref--beyond' : '';
          return '<li>' + (pid != null && /^(Beyond|Not in)/.test(x.ref) ? pastBadge(pid, 'later__ref later__ref--old') : '<span class="later__ref' + kind + '">' + esc(x.ref) + '</span>' + (pid != null ? pastBadge(pid, 'later__ref later__ref--old') : '')) + M(x.text) + '</li>';
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
          var tag = pastTerm(w.term) ? ' ' + pastBadge(pastTerm(w.term), 'tier tier--old') : g2.ext ? ' <span class="tier tier--ext tip" tabindex="0" data-tip="The 0610 syllabus does not name it, but it is worth knowing: an exam question can still use it.">beyond 0610</span>'
                  : g2.sup ? ' <span class="tier tier--sup" title="Supplement — Extended papers (2 and 4) only">Supplement</span>' : '';
          return '<div class="kw kw--flip" role="button" tabindex="0" aria-expanded="false">' +
                 '<dt>' + M(w.term) + numberOf(g2) + tag + '</dt><p class="kw__ask">Do you know it? Tap to check</p><dd>' + M(w.def) + '</dd></div>';
        }).join('') + '</dl>';
      Array.prototype.forEach.call(k.querySelectorAll('.kw--flip'), function (c) {
        var turn = function () { var o = c.classList.toggle('is-open'); c.setAttribute('aria-expanded', o ? 'true' : 'false'); };
        c.addEventListener('click', function (e) { if (e.target.closest('[data-peek],[data-jump],[data-gloss],.tip')) return; turn(); });
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

  /* The line at the top of a station's Practise tab. On a second go it says which go this is and
     how the first go went (the honest measure); Practise again empties the page for another go.
     The record keeps everything: the teacher's Score, homework and the hub read the best ever. */
  function paintGoLine(pane, st) {
    var sc = stationScore(st.id);
    if (!(sc.go > 1 || sc.tried)) return;                 /* nothing answered yet: nothing to say */
    var line = document.createElement('div');
    line.className = 'goline' + (sc.go > 1 ? '' : ' goline--bare');   /* go 1: just the button, no box */
    var txt = document.createElement('span');
    /* "round", said once and the same everywhere a student reads it (a round = one time through the questions);
       the first round is counted over the questions answered in it — never "0 of 12" for work not done */
    if (sc.go > 1) txt.innerHTML = 'Round ' + sc.go + '.' + (sc.firstTried
      ? ' In your first round you answered <b>' + sc.firstTried + '</b>; <b>' + sc.firstRight + '</b> ' + (sc.firstRight === 1 ? 'was' : 'were') + ' right at the first try.'
      : ' Your record keeps everything you did before.');
    line.appendChild(txt);
    if (sc.tried && window.LabSync) {
      var again = document.createElement('button');
      again.type = 'button'; again.className = 'btn btn--quiet'; again.textContent = '\u21ba Start this station again';
      again.addEventListener('click', function () {
        if (!confirm('Start this station again?\n\nYour answers will be cleared from this page, so you can try the questions again. Your record keeps everything you have already done.')) return;
        if (!window.LabSync.newGo(progress, st.id, S)) return;
        save(); queueSave(true);
        paintHeader(); paintRail(); paintPanel();
        var tb = document.querySelector('.tabs .tab[aria-selected="true"]');   /* the button is gone: keep the keyboard in place */
        if (tb) tb.focus();
        toast('Round ' + stationScore(st.id).go + ' of ' + st.name + ' has started. Your record keeps everything you did before.');
      });
      line.appendChild(again);
    }
    pane.appendChild(line);
  }
  function paintDo(pane, st) {
    paintGoLine(pane, st);
    (st.activities || []).forEach(function (a, i) {
      var card = window.Engine.render(a, i, st.id + ':' + i);
      /* a question on something the syllabus for 2026–2029 does not include says which syllabus it comes from */
      var pq = st.past && st.past.q ? st.past.q[i] : null;
      if (pq != null) {
        var qtop = card.querySelector('.act__top'), qn = qtop && qtop.querySelector('.act__n'), qbox = document.createElement('span');
        qbox.innerHTML = pastBadge(pq, 'act__old');
        if (qtop && qbox.firstChild) { if (qn) qn.insertAdjacentElement('afterend', qbox.firstChild); else qtop.appendChild(qbox.firstChild); }
      }
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
        if (e.detail.correct && !rec.done[i] && rec.per[i] === 1 && !rec.tried[i]) { rec.one = rec.one || {}; rec.one[i] = true; }
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
    /* on a phone the plate is pinned above the notes, so the first readable line starts under it */
    var inset = 0, plate = document.querySelector('.platecol');
    if (plate && scroller.contains(plate) && window.getComputedStyle(plate).position === 'sticky') inset += Math.round(plate.getBoundingClientRect().height);
    var tabs = document.querySelector('#panelInner .tabs');
    if (!tabs || window.getComputedStyle(tabs).position !== 'sticky') return inset;
    var tr = tabs.getBoundingClientRect(), sr = topOf(scroller);
    return inset + (tr.height && tr.top <= sr + tr.height + 2 ? Math.round(tr.height) : 0);
  }
  function topOf(scroller) {
    return scroller === document.scrollingElement || scroller === document.documentElement
      ? 0 : scroller.getBoundingClientRect().top;
  }
  /* A word can send a reader into a section that is folded shut — a line can live inside
     a closed <details>, and scrolling to something behind a shut disclosure scrolls to
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

  /* ---------- whose work this is, and saving it ----------
     The lab is public and stays public: anyone may work through it. Signing in with the school
     Google account is what lets the work be recorded, so Dr Mompel's spreadsheet holds his own
     students and nobody else's. There is nothing to hand in: signed in, the work is sent to the
     records on its own — two minutes after the last check, and at once when the lab is finished
     or the page is left. Work done signed out stays in this browser and goes the moment they
     sign in. The records only ever grow: a save can never take a right answer away.

     One sign-in for the whole site, kept by js/signin.js (shared, from labs-shared/): a student
     who signed in on the Biology Hub or in another lab is already known here, and signing in
     here signs them in there. It is remembered after Google's hour is up — `signIn` is who, and
     haveToken() says whether their token is still good — and renewed without a click when
     Google allows, so a student is not asked again every hour. */
  var SI = window.SignIn || null;
  var CID = (window.LAB_CONFIG || {}).googleClientId || '';
  var signIn = SI ? SI.who() : null;
  var LAB_ID = LAB;
  var afterSignIn = null;
  /* ---------- a shared computer ----------
     This browser's work belongs to the account it was last saved for. Another account signing in must not have
     it pushed into THEIR record — it is safe in its owner's already — so it leaves this browser first. Work done
     signed out, before anybody signed in here, has no owner yet and goes to the first account that signs in
     (as ever). "Clear this computer", in the save window, empties the browser by hand. (Review, 27 Sep 2026:
     Reset used to be the only way to clear a shared computer, and Reset now keeps the record.)
     It is safe in its owner's record only if every answer reached it. UNSENT_KEY says whether some has not:
     every change sets it (queueSave), and a save the records took, with nothing left waiting, clears it
     (flushSave), so the message the next account sees is true either way. And signing out sends what is still
     waiting first, while that account's sign-in still works (onSignIn). The same as the Bio English Lab (30 Sep 2026). */
  var OWNER_KEY = LAB_ID + '.owner', UNSENT_KEY = LAB_ID + '.unsent';
  function markUnsent(on) { try { if (on) localStorage.setItem(UNSENT_KEY, '1'); else localStorage.removeItem(UNSENT_KEY); } catch (e) {} }
  function unsentHere() { try { return !!localStorage.getItem(UNSENT_KEY); } catch (e) { return true; } }
  function clearHere() {
    progress = {}; markUnsent(false);
    /* their whole-lab resets go with their work; and "Saved ✓ hh:mm" was theirs, not the next pupil's (7 Oct 2026) */
    if (window.LabSync && window.LabSync.clearResets) window.LabSync.clearResets(LAB_ID);
    else { try { localStorage.removeItem(LAB_ID + '.resets'); } catch (e) {} }
    savedAt = null;
    try { localStorage.removeItem(STORE); } catch (e) {}
    paintHeader(); paintRail(); paintPanel();
  }
  /* the page drawn again for the work it now holds */
  function repaintAfterClaim() { paintHeader(); paintRail(); paintPanel(); }
  /* Whose work THIS page holds in memory: the stored owner it was loaded with, then each pupil it is claimed for; a
     sign-out never clears it. Two tabs of a lab share the stored owner, so another tab that had already claimed this
     browser for the next pupil hid the last pupil's work still in this page's memory, and it went to the next pupil's
     record (the sign-in audit, 7 Oct 2026). */
  var pageOwner = '';
  try { pageOwner = localStorage.getItem(OWNER_KEY) || ''; } catch (e) {}
  function claimFor(email) {
    var was = '';
    try { was = localStorage.getItem(OWNER_KEY) || ''; } catch (e) {}
    if (email && pageOwner && pageOwner !== email && was === email) {
      /* another tab has claimed this browser for them already, and keeps their copy here: this page takes that copy and
         lets the last pupil's go (it is in their record, or waits in their own tab) */
      progress = load(); reconcile(); savedAt = null; savePending = false; markUnsent(false); pageOwner = email;
      repaintAfterClaim();
      return;
    }
    if (email) pageOwner = email;
    if (was && email && was !== email) {
      var unsent = unsentHere() || !!savePending || !!saving;
      clearHere();
      if (unsent) toast('This computer had another student\u2019s work, and some of it may not have been saved to their record. It has been removed from this computer, and none of it was added to yours.', 10000);
      else toast('This computer had another student\u2019s work. It stays in their record; it was not added to yours.');
    }
    try { if (email) localStorage.setItem(OWNER_KEY, email); } catch (e) {}
  }
  function mountSignIn(el) {
    return !!(CID && SI && SI.button(el, CID, { theme:'outline', size:'large', text:'signin_with', width: 260, locale:'en-GB' }));
  }
  /* "not you?" signs out everywhere on the site: the hub, every lab (an expired sign-in is renewed in place: fillSaveDialog) */
  function signOut() {
    if (savePending && !saving && canSend()) flushSave();   /* what waits goes first, while its sign-in or pass still works */
    if (SI) SI.out(); else { signIn = null; paintSaveChip(); fillSaveDialog(); }
  }
  /* The sign-in changed — in this page, or in another tab of the site. A sign-in that was not
     there before brings their records back, then sends what was done here. */
  function onSignIn(v, here) {
    var was = signIn && signIn.email;
    /* signed out (here, or in another tab of the site), or another account signed in: what is still waiting
       goes first, with the sign-in it belongs to, while that still works. Once it is gone it cannot be sent. */
    if (was && (!v || v.email !== was) && savePending && !saving && haveToken()) flushSave();
    /* the same pupil with a new sign-in (Google's button pressed again, a renewal, the hub in another tab): what could not
       be sent while the old one had expired goes now, the records first (6 Oct 2026; before, only another account did) */
    var again = !!v && v.email === was && SI.fresh(v) && (saveWhy === 'stale' || savePending || unsentHere());
    signIn = v;
    if (v && SI.fresh(v) && saveWhy === 'stale') saveWhy = '';
    paintSaveChip();
    var dlg = document.getElementById('subDlg');
    if (dlg && !dlg.hidden) fillSaveDialog();
    if (v && SI.fresh(v) && v.email !== was) { claimFor(v.email); pullThenPush(); }
    else if (again) pullThenPush();
    if (v && here && afterSignIn && SI.fresh(v)) { var next = afterSignIn; afterSignIn = null; next(); }
  }
  if (SI) SI.on(onSignIn);

  function snapshotNow() {
    return (window.LabSync && window.LabSync.snapshot)
      ? window.LabSync.snapshot(progress, S, ORDER, stationSig) : '';
  }
  function syncEnabled() { return !!((window.LAB_CONFIG || {}).submitUrl && window.LabSync); }
  function haveToken() { return !!(SI && SI.fresh(signIn)); }
  /* The labs script's own pass (6 Oct 2026; js/signin.js): after Google's hour it still carries this pupil's saves and their
     own records. Only ever the pass made for the account signed in HERE, so another account's never goes with this work. */
  function passFor(v) { var p = SI && SI.pass ? SI.pass() : null; return (p && v && p.email === v.email) ? p.pass : ''; }
  function canSend() { return haveToken() || !!passFor(signIn); }

  /* Ask Google for a sign-in — for the same account, when one is remembered — then come back
     and finish. One Tap can be refused by the browser; `failed` hears why. */
  function signInThen(fn, failed) {
    afterSignIn = fn;
    if (!CID || !SI) { if (failed) failed('unavailable'); return; }
    SI.renew(CID, function (v, why) {
      if (v) { if (afterSignIn === fn) { signIn = v; afterSignIn = null; fn(); } return; }
      if (why === 'signed out') return;
      if (failed) failed(why);
    });
  }

  /* ---------- bringing work back ----------
     What the records hold for this lab, folded in. js/sync.js only ever adds: a question right
     on either machine stays right. */
  function applySnap(mine, quiet) {
    if (!mine) return;
    var L = window.LabSync;
    /* this go first (it may move a station on to a newer go), then the first go and the best */
    var here = mine.here != null ? mine.here : mine.snap;      /* `here`: this go, from a script that knows goes */
    var res = here ? L.merge(progress, here, S, stationSig) : { added: 0, stations: 0, skipped: [], newer: 0 };
    var more = (mine.first && L.mergeFirst ? L.mergeFirst(progress, mine.first, S, stationSig) : 0) +
               (mine.best && L.mergeBest ? L.mergeBest(progress, mine.best, S, stationSig) : 0) +
               /* every round and its checks (7 Oct 2026): after merge(), which moves a station on to the records' round */
               (mine.rounds && L.mergeRounds ? L.mergeRounds(progress, mine.rounds, S, stationSig) : 0);
    if (mine.resets && L.resets) L.resets(LAB_ID, false, mine.resets);
    if (res.added || res.newer || more) { save(); reconcile(); paintHeader(); paintRail(); paintPanel(); refreshTabCount(); }
    if (!quiet || res.added || res.newer) toast(L.say(res));
  }
  function pull(then) {
    if (!syncEnabled() || !canSend()) { if (then) then(); return; }
    /* an answer for a pupil who is no longer the one signed in here is dropped, and nothing goes on from it: another account
       signing in while it was on its way must never have the first one's records (audit, 6 Oct 2026) */
    var asked = signIn.email, still = function () { return !!signIn && signIn.email === asked; };
    fetch((window.LAB_CONFIG || {}).submitUrl, {
      method:'POST', mode:'cors', headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify({ action:'progress', token: signIn.token, pass: passFor(signIn) })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!still()) return;
        var mine = j && j.ok && j.labs && j.labs[LAB_ID]; applySnap(mine, true);
        /* and their homework here, which the same answer carries (a script from before sends none) */
        if (window.LabHomework) window.LabHomework.take(j && j.ok ? j.homework : null, signIn && signIn.email);
      })
      .catch(function () {})
      .then(function () { if (then && still()) then(); });
  }
  /* Signed in: their records first, so nothing here is older than what is there; then whatever
     this browser has that the records do not. */
  function pullThenPush() { pull(function () { queueSave(true); }); }
  /* Homework set for this pupil in this lab (Daniel, 29 Sep 2026): its stations coloured on the row, and a note once a
     day with what is still to do. Scored by the teacher's rule; the shared code is labs-shared/engine/homework.js. */
  if (window.LabHomework) window.LabHomework.init({ lab: LAB_ID,
    score: function (id) { var s = stationScore(id); return { done: s.best, total: s.total }; },
    name: function (id) { return S[id] ? S[id].name : ''; },
    open: function (id) { open(id); },
    repaint: function () { paintRail(); } });
  if (SI && SI.passFrom && syncEnabled()) SI.passFrom((window.LAB_CONFIG || {}).submitUrl);   /* the script's pass, when it is due */
  if (signIn && syncEnabled()) {
    claimFor(signIn.email);
    if (canSend()) pullThenPush();
    /* opened on an expired sign-in that Google will not renew without a click: the chip says "Sign in again" at once, never
       "Saves as you go", because nothing can be sent until the pupil does (6 Oct 2026) */
    else if (SI && CID) SI.renew(CID, function (v) {
      /* only ever the same pupil's renewal (audit, 6 Oct 2026), and "Sign in again" only when nothing can be sent */
      if (v && (!signIn || v.email === signIn.email)) { signIn = v; pullThenPush(); }
      else if (signIn && !canSend()) { saveWhy = 'stale'; paintSaveChip(); }
    });
  }

  /* ---------- saving on its own ----------
     Two minutes after the last check, one save carries everything since. Forty students on one
     script is comfortable at that pace; a save that finds the records busy simply goes again a
     minute later, and nothing is lost meanwhile because this browser keeps its own copy. */
  var SAVE_AFTER = 120000, RETRY_AFTER = 60000;
  var saveTimer = null, savePending = false, saving = false, savedAt = null, saveWhy = '', lastSent = '', lastScore = -1, askedAgain = false;
  function queueSave(now) {
    markUnsent(true);                        /* until a save the records take: see flushSave */
    if (!syncEnabled()) return;
    savePending = true;
    paintSaveChip();
    if (now) { clearTimeout(saveTimer); saveTimer = null; flushSave(); return; }
    if (!saveTimer) saveTimer = setTimeout(function () { saveTimer = null; flushSave(); }, SAVE_AFTER);
  }
  function retryLater() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveTimer = null; flushSave(); }, RETRY_AFTER);
  }
  function payloadNow() {
    var t = totals(), perStation = {};
    /* each station as the record keeps it: best ever, and every check of every go (this browser's and the records') */
    ORDER.forEach(function (id) {
      var s = stationScore(id);
      perStation[id] = s.best + '/' + s.total + (s.checks ? ' in ' + s.checks : '');
    });
    var name = signIn ? signIn.name : '';
    return { app: LAB_ID, token: signIn ? signIn.token : '', pass: passFor(signIn), name: name, form: '',
             score: t.done, total: t.total, complete: t.done === t.total,
             checks: t.checks, firstTime: t.first1, tried: t.tried,
             from: t.from ? new Date(t.from).toISOString() : '', stations: perStation,
             snap: snapshotNow(),
             first: window.LabSync && window.LabSync.firstSnapshot ? window.LabSync.firstSnapshot(progress, S, ORDER, stationSig) : '',
             best: window.LabSync && window.LabSync.bestSnapshot ? window.LabSync.bestSnapshot(progress, S, ORDER, stationSig) : '',
             /* every round of every station, small, with its checks at each question; and how often the whole lab was reset */
             rounds: window.LabSync && window.LabSync.roundsSnapshot ? window.LabSync.roundsSnapshot(progress, S, ORDER, stationSig) : '',
             resets: window.LabSync && window.LabSync.resets ? window.LabSync.resets(LAB_ID) : 0,
             at: new Date().toISOString() };
  }
  /* What a save says, for telling whether the records have it already: a check changes the rounds even when no letter moves
     (up to 35 checks at one question in a round: one character holds no more, and the count past it travels with the
     station's total) */
  function sentKey(p) { return p.snap + '|' + (p.rounds || '') + '|' + (p.resets || 0); }
  /* What the records said when they would not keep it, as a state the chip can show. */
  function whyNot(reply) {
    var r = String(reply || '').trim();
    if (/^not recorded: sign-in is not set up/.test(r)) return 'setup';
    if (/^not recorded: not signed in/.test(r)) return 'stale';
    if (/^not recorded: not on this class list/.test(r)) return 'list';
    if (/^busy/.test(r)) return 'busy';
    if (/^rejected/.test(r)) return 'rejected';
    return 'other';
  }
  function renewThenSave() {
    if (askedAgain) { paintSaveChip(); return; }
    askedAgain = true; setTimeout(function () { askedAgain = false; }, 60000);
    SI.renew(CID, function (v) { if (v && (!signIn || v.email === signIn.email)) { signIn = v; saveWhy = ''; flushSave(); } else paintSaveChip(); });   /* the same pupil only */
  }
  function flushSave(leaving) {
    if (!savePending || !syncEnabled() || saving) return;
    if (!signIn) { saveWhy = 'signin'; paintSaveChip(); return; }          /* kept here until they sign in */
    if (!canSend()) { saveWhy = 'stale'; if (!leaving) renewThenSave(); else paintSaveChip(); return; }
    var payload = payloadNow();
    if (!payload.snap && !payload.score && !payload.checks) { savePending = false; saveWhy = ''; markUnsent(false); paintSaveChip(); return; }   /* nothing done yet: nothing to send */
    if (sentKey(payload) === lastSent && payload.score <= lastScore) { savePending = false; saveWhy = ''; markUnsent(false); paintSaveChip(); return; }   /* the records have it already */
    saving = true; savePending = false; saveWhy = ''; paintSaveChip();
    var opts = { method:'POST', mode:'cors', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body: JSON.stringify(payload) };
    if (leaving) opts.keepalive = true;
    fetch((window.LAB_CONFIG || {}).submitUrl, opts)
      .then(function (r) { return r.text(); })
      .then(function (reply) {
        saving = false;
        var r = String(reply || '').trim();
        if (/^recorded/.test(r)) {
          savedAt = new Date(); lastSent = sentKey(payload); lastScore = payload.score; saveWhy = '';
          try { localStorage.setItem(LAB_ID + '.submitted', JSON.stringify({ at: payload.at, sent: true, name: payload.name })); } catch (e) {}
          if (savePending) queueSave();          /* something changed while it was on its way */
          else markUnsent(false);                /* everything done here is in the records */
        } else {
          saveWhy = whyNot(r); savePending = true;
          if (saveWhy === 'stale' && payload.pass && SI && SI.dropPass) SI.dropPass(payload.pass);   /* the script refused that pass (🔑): sign in again */
          if (saveWhy === 'busy' || saveWhy === 'other') retryLater();
          else if (saveWhy === 'stale' && signIn) renewThenSave();   /* signed out since it left: nobody to renew */
        }
        paintSaveChip();
      })
      .catch(function () { saving = false; savePending = true; saveWhy = 'offline'; paintSaveChip(); retryLater(); });
  }
  addEventListener('pagehide', function () { if (savePending && !saving) flushSave(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && savePending && !saving) flushSave(true);
  });

  /* ---------- the chip in the header, and what opens from it ---------- */
  function hhmm(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function paintSaveChip() {
    var b = document.getElementById('btnSubmit'); if (!b) return;
    if (!syncEnabled()) { b.hidden = true; return; }
    b.hidden = false;
    var cls = 'hbtn hbtn--save tip tip--right', text, tip;
    if (!signIn) { cls += ' is-off'; text = 'Sign in to save'; tip = 'Your work stays in this browser until you sign in with your school account. Sign in and it goes to Dr Mompel’s records — what you have done already, too.'; }
    else if (saving) { cls += ' is-busy'; text = 'Saving…'; tip = 'Sending your work to Dr Mompel’s records.'; }
    else if (saveWhy === 'list') { cls += ' is-no'; text = 'Not on the class list'; tip = 'The account you signed in with is not on Dr Mompel’s class list, so nothing is recorded for it. Your work stays in this browser.'; }
    else if (saveWhy === 'setup') { cls += ' is-no'; text = 'Not being collected'; tip = 'The records are not set up to accept sign-ins yet. Your work stays in this browser.'; }
    else if (saveWhy === 'stale') { cls += ' is-no'; text = 'Sign in again'; tip = 'Your Google sign-in has expired (it lasts about an hour). Press here to sign in again. Nothing is lost: your work is sent after you sign in.'; }
    else if (saveWhy === 'offline') { cls += ' is-no'; text = 'Offline · will retry'; tip = 'Could not reach the records. Your work is kept here and sent again in a minute.'; }
    else if (saveWhy === 'rejected') { cls += ' is-no'; text = 'Not saved'; tip = 'The records would not accept this. Show your teacher.'; }
    else if (savePending) { cls += ' is-busy'; text = 'Saving…'; tip = 'Sent to Dr Mompel’s records within two minutes, and at once when you finish or leave.'; }
    else if (savedAt) { cls += ' is-ok'; text = 'Saved ✓ ' + hhmm(savedAt); tip = 'In Dr Mompel’s records. Every check is sent on its own — there is nothing to hand in.'; }
    else { cls += ' is-ok'; text = 'Saves as you go'; tip = 'Signed in: every check is sent to Dr Mompel’s records on its own — there is nothing to hand in.'; }
    b.className = cls; b.textContent = text; b.setAttribute('data-tip', tip);
  }
  function openSaveDialog() {
    var dlg = document.getElementById('subDlg'); if (!dlg) return;
    fillSaveDialog();
    dlg.hidden = false;
    if (signIn && !canSend() && SI && CID) SI.renew(CID, function () {});
    document.getElementById('subClose').onclick = function () { dlg.hidden = true; };
    dlg.onclick = function (e) { if (e.target === dlg) dlg.hidden = true; };
  }
  function saveLine() {
    if (saving) return 'Saving…';
    if (saveWhy === 'list') return 'The account you signed in with (' + esc(signIn.email) + ') is not on the class list, so nothing is recorded for it. The list is matched on email address, not on name.';
    if (saveWhy === 'setup') return 'The records are not set up to accept sign-ins yet, so nothing is recorded. Show your teacher this message.';
    if (saveWhy === 'offline') return 'Could not reach the records just now. Your work is kept here and sent again in a minute.';
    if (saveWhy === 'stale') return 'Your sign-in has expired. Sign in again and your work is sent.';
    if (saveWhy === 'rejected') return 'The records would not accept this. Show your teacher.';
    if (savePending) return 'What you have done since the last save goes within two minutes.';
    if (savedAt) return 'Saved at ' + hhmm(savedAt) + '. Everything you have done here is in the records.';
    return 'Saves as you go.';
  }
  function fillSaveDialog() {
    var body = document.getElementById('subBody'), go = document.getElementById('subGo');
    if (!body || !go) return;
    var cfg = window.LAB_CONFIG || {}, t = totals();
    var sofar = '<p class="st-sub"><b>' + t.done + '</b> of <b>' + t.total + '</b> right so far, in <b>' + t.checks + '</b> check' + (t.checks === 1 ? '' : 's') + '.</p>';
    if (!cfg.googleClientId || !syncEnabled()) {
      body.innerHTML = sofar + '<p class="fineprint">This copy of the lab is not connected to a teacher’s records, so your work stays in this browser.</p>';
      go.style.display = 'none'; return;
    }
    if (signIn) {
      var stale = !canSend();
      /* an expired sign-in: Google's own button, here, for one press; the same pupil carries on and onSignIn sends what waits.
         Until 6 Oct 2026 "sign in again" signed the pupil out first, so it took two presses and a second look */
      body.innerHTML = sofar +
        '<div class="who">Saving as <b>' + esc(signIn.name) + '</b><button type="button" class="tourcard__link" id="subOut">not you?</button></div>' +
        (stale ? '<p class="submsg no">Your Google sign-in has expired: it lasts about an hour, and a lab takes longer than that. Sign in again below. Nothing is lost: your work is sent after you sign in.</p><div id="subWho" class="signinbox"></div>'
               : '<p class="submsg' + (saveWhy && saveWhy !== 'signin' ? ' no' : ' ok') + '">' + saveLine() + '</p>') +
        '<p class="fineprint">Every check is sent to Dr&nbsp;Mompel’s records on its own — within two minutes, and at once when you finish or leave. There is nothing to hand in. If you are on his class list it goes into his records; if you are not — anyone in the world is welcome here — nothing is recorded anywhere.</p>';
      go.style.display = (savePending || saveWhy) && !stale ? '' : 'none'; go.textContent = 'Save now';
      go.onclick = function () { queueSave(true); fillSaveDialog(); };
      document.getElementById('subOut').onclick = signOut;
      if (stale && !mountSignIn(document.getElementById('subWho'))) {
        document.getElementById('subWho').innerHTML = '<p class="fineprint">Google sign-in could not load here — offline, or a school filter has blocked accounts.google.com. Your work stays in this browser; sign in later and it is sent then.</p>';
      }
      return;
    }
    body.innerHTML = sofar +
      '<p class="fineprint">Sign in with your school Google account and your work is sent to Dr&nbsp;Mompel’s records as you go — what you have done here already goes too. The lab is open to everyone; signing in is only how a result reaches his records.</p>' +
      '<div id="subWho" class="signinbox"></div>' +
      (t.tried ? '<p class="fineprint">Not your work? <button type="button" class="tourcard__link" id="subClear">Clear this computer</button> \u2014 the answers kept in this browser are removed; nothing in anybody\u2019s record changes.</p>' : '');
    go.style.display = 'none';
    var clr = document.getElementById('subClear');
    if (clr) clr.onclick = function () {
      if (!confirm('Clear this computer?\n\nThe answers kept in this browser are removed. Nothing in anybody\u2019s record changes.')) return;
      clearHere();
      try { localStorage.removeItem(OWNER_KEY); } catch (e) {}
      fillSaveDialog();
      toast('Cleared. This computer keeps no answers now.');
    };
    if (!mountSignIn(document.getElementById('subWho'))) {
      document.getElementById('subWho').innerHTML = '<p class="fineprint">Google sign-in could not load here — offline, or a school filter has blocked accounts.google.com. Your work stays in this browser; sign in later and it is sent then.</p>';
    }
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
  function toast(msg, ms) {
    var t = document.getElementById('toast');
    t.style.pointerEvents = ''; t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 2800);
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
    document.getElementById('btnSubmit').addEventListener('click', openSaveDialog);
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
        var pid = pastTerm(w.term); if (pid) return ' ' + pastBadge(pid, 'tier tier--old');
        if (w.ext) return ' <span class="tier tier--ext tip" tabindex="0" data-tip="The 0610 syllabus does not name it, but it is worth knowing: an exam question can still use it.">beyond 0610</span>';
        if (w.sup) return ' <span class="tier tier--sup" title="Supplement — examined on the Extended papers (2 and 4) only">Supplement</span>';
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
            return '<div class="gloss__row" data-term="' + esc((w.term + ' ' + (w.plural || '') + ' ' + (w.singular || '') + ' ' + w.def).toLowerCase()) + '"><dt>' + esc(w.term) + numberOf(w) + tierTag(w) + '</dt><dd>' + esc(w.def) + also + got + '</dd></div>';
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
        var tabs = document.querySelector('#panelInner .tabs'); if (tabs) landOn(tabs, true);   /* lands below the pinned plate on a phone */
      };
      qStat.addEventListener('click', goQuestions);
      /* on a phone the plate is pinned above the notes; this folds it to a strip for a reader who wants the notes alone */
      var plate = document.querySelector('.platecol'), fold = document.getElementById('plateFold');
      if (plate && fold) {
        var FOLD_KEY = 'labs.plateFolded', foldedNow = false;
        try { foldedNow = localStorage.getItem(FOLD_KEY) === '1'; } catch (e) {}
        var paintFold = function () { plate.classList.toggle('is-folded', foldedNow); fold.setAttribute('aria-expanded', foldedNow ? 'false' : 'true'); fold.textContent = (foldedNow ? '▼ Show ' : '▲ Hide ') + fold.getAttribute('data-what'); };
        paintFold();
        fold.addEventListener('click', function () { foldedNow = !foldedNow; try { localStorage.setItem(FOLD_KEY, foldedNow ? '1' : '0'); } catch (e) {} paintFold(); });
      }
      qStat.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goQuestions(); } });
    }
    /* Reset: every station with answers starts a new go (js/sync.js). The page empties so the
       questions can be practised again; the record (the teacher's Score, homework, the hub) keeps
       everything, and the first go stays as it was. */
    document.getElementById('btnReset').addEventListener('click', function () {
      var ids = ORDER.filter(function (id) { return stationScore(id).tried > 0; });
      if (!ids.length) {
        toast(ORDER.some(function (id) { return stationScore(id).bestTried > 0; })
          ? 'Every station is already empty.' : 'Nothing to start again yet: answer some questions first.');
        return;
      }
      if (!window.LabSync) {                             /* js/sync.js did not arrive: all this page can do is clear itself */
        if (!confirm('Clear all your answers in this browser?\n\nThis cannot be undone here.')) return;
        progress = {}; try { localStorage.removeItem(STORE); } catch (e) {}
      } else {
        if (!confirm('Start every station again?\n\nYour answers will be cleared from this page, so you can practise the questions again. Your record keeps everything you have already done.')) return;
        ids.forEach(function (id) { window.LabSync.newGo(progress, id, S); });
        if (window.LabSync.resets) window.LabSync.resets(LAB_ID, true);   /* the whole lab, started again: counted (7 Oct 2026) */
      }
      save(); if (typeof queueSave === 'function') queueSave(true);
      paintHeader(); paintRail(); paintPanel();
      toast('Started again: ' + ids.length + ' station' + (ids.length === 1 ? '' : 's') + '. Your record keeps everything you did before.');
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
