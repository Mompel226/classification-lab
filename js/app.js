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
  function stationSig(st) {
    return (st.activities || []).length + ':' + (st.activities || []).map(function (a) { return a.type; }).join(',');
  }
  /* The fingerprint was once the first letter of each type, and 'mcq' and 'match' both begin
     with m — so turning a matching task into a multiple choice left it unchanged and the old
     record survived. A record written in that old form no longer matches anything and is
     dropped, which is the point: it is the only honest thing to do with a record we cannot
     trust. */
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
    var panelEl = document.getElementById('panel');
    panelEl.style.scrollBehavior = 'auto'; panelEl.scrollTop = 0; panelEl.style.scrollBehavior = '';
  }

  var WIDGET_CTX = {
    focus: function (gid) { if (window.Plate) window.Plate.focus(gid); },
    home: function () { if (window.Plate) window.Plate.home(); }
  };

  function paintLearn(pane, st) {
    if (window.Terms) window.Terms.setStation(st.id);
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
    if (window.Plate) window.Plate.showStation(S[id]);
    paintPanel(); paintRail();
    if (focusTerm) focusOnTerm(focusTerm, cameFrom);
    if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  }
  /* a group clicked on the tree opens the station that teaches it, on that group */
  function openGroup(gid) {
    var id = OWNER[gid];
    if (!id) { toast('No station teaches that group yet.'); return; }
    if (current !== id || tab !== 'learn') { current = id; tab = 'learn'; p(id).opened = true; save(); paintPanel(); paintRail(); }
    if (window.Plate) window.Plate.focus(gid);
    history.replaceState(null, '', '#' + gid);
    var target = document.querySelector('#panelInner [data-group="' + gid + '"]');
    if (!target) return;
    var panel = document.getElementById('panel');
    var prev = panel.style.scrollBehavior; panel.style.scrollBehavior = 'smooth';
    var tr = target.getBoundingClientRect();
    panel.scrollTop += (tr.top - panel.getBoundingClientRect().top) - 90;
    setTimeout(function () { panel.style.scrollBehavior = prev || ''; }, 600);
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 2800);
  }

  function focusOnTerm(term, cameFrom) {
    var panel = document.getElementById('panel');
    var re = new RegExp('(?<![A-Za-z0-9-])' + term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9-])', 'i');
    var target = null;
    var kws = document.querySelectorAll('#panelInner .kw');
    for (var i = 0; i < kws.length && !target; i++) { var dt = kws[i].querySelector('dt'); if (dt && re.test(dt.textContent)) target = kws[i]; }
    if (!target) { var lis = document.querySelectorAll('#panelInner .exam-list > li'); for (var j = 0; j < lis.length && !target; j++) if (re.test(lis[j].textContent)) target = lis[j]; }
    if (!target) { var caps = document.querySelectorAll('#panelInner .later__list li'); for (var k = 0; k < caps.length && !target; k++) if (re.test(caps[k].textContent)) target = caps[k]; }
    if (!target) return;
    var prev = panel.style.scrollBehavior; panel.style.scrollBehavior = 'smooth';
    var tr = target.getBoundingClientRect();
    panel.scrollTop += (tr.top - panel.getBoundingClientRect().top) - panel.clientHeight / 2 + tr.height / 2;
    setTimeout(function () { panel.style.scrollBehavior = prev || ''; }, 600);
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 2800);
    if (cameFrom && S[cameFrom]) showBackChip(cameFrom, term);
  }

  var backChip = null, whereWeWere = null;
  function jumpTo(el, top) { var prev = el.style.scrollBehavior; el.style.scrollBehavior = 'auto'; el.scrollTop = top; el.style.scrollBehavior = prev || ''; }
  function markWhereWeAre() { var panel = document.getElementById('panel'); whereWeWere = { id: current, top: panel ? panel.scrollTop : 0, tab: tab }; }
  function goBackToMark(id) {
    var w = whereWeWere && whereWeWere.id === id ? whereWeWere : null;
    open(id);
    if (!w) return;
    var panel = document.getElementById('panel'); if (!panel) return;
    requestAnimationFrame(function () { requestAnimationFrame(function () { jumpTo(panel, w.top); }); });
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
  function doSubmit() {
    var name = signIn ? signIn.name : ((document.getElementById('subName') || {}).value || '');
    var form = (document.getElementById('subForm') || {}).value || '';
    var msg = document.getElementById('subMsg');
    var go = document.getElementById('subGo');
    if (name.trim().length < 3) { msg.className = 'submsg no'; msg.textContent = 'Please type your full name.'; return; }
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
                    from: t.from ? new Date(t.from).toISOString() : '', stations:perStation, at:new Date().toISOString() };
    var url = (window.LAB_CONFIG || {}).submitUrl;
    go.disabled = true;
    msg.className = 'submsg'; msg.textContent = url ? 'Sending…' : 'Generating your code…';
    /* The POST goes out with mode:'no-cors', so the reply is opaque: this page cannot tell a
       real 200 from an error page or a school portal's login screen. It never claims a
       delivery it cannot know. */
    function finish(sent, offline) {
      go.disabled = false; go.style.display = 'none';
      msg.className = 'submsg ok';
      var head = sent ? '<b>Handed in.</b> '
               : offline ? '<b>You are offline — nothing was sent yet.</b> '
               : '<b>Could not reach the server.</b> ';
      var tail = sent
        ? (signIn ? 'If you are on Dr Mompel&rsquo;s class list it should now be in his records. Your code is your receipt — keep it whether or not it arrived.' : 'Your code is your receipt — keep it.')
        : offline ? 'Your work is saved on this device. Keep the code, and hand in again once you are back online.'
        : 'Paste this into the Google Classroom assignment to hand in.';
      msg.innerHTML = head + 'Your completion code is<div class="code">' + code + '</div>' + tail;
      try { localStorage.setItem(LAB + '.submitted', JSON.stringify({ name:name.trim(), form:form, code:code, at:payload.at, sent:sent })); } catch (e) {}
    }
    if (!url) { finish(false); return; }
    if (navigator.onLine === false) { finish(false, true); return; }
    fetch(url, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify(payload) })
      .then(function () { finish(true); }).catch(function () { finish(false); });
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
    pk.innerHTML = (src ? '<img src="assets/photos/' + src + '" alt="" decoding="async"' +
                          (pkw ? ' width="' + pkw[0] + '" height="' + pkw[1] + '"' : '') + '>' : '') +
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
      else { closePeek(); open(t.getAttribute('data-jump'), t.textContent.trim(), current); }
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
        var panel = document.getElementById('panel');
        atOpen = panel ? panel.scrollTop : null;
        pinTerm = term ? String(term).trim().toLowerCase() : null;
        built = false; build(); find.value = term || ''; filter(); countKnown(); dlg.hidden = false;
        var box = dlg.querySelector('.modal__box'); if (box) box.scrollTop = 0;
        var touch = false; try { touch = matchMedia('(pointer: coarse)').matches; } catch (e) {}
        if (!term && !touch) setTimeout(function () { try { find.focus({ preventScroll: true }); } catch (e) { find.focus(); } if (box) box.scrollTop = 0; }, 30);
      }
      window.LabGlossary = openG;
      document.getElementById('btnGloss').addEventListener('click', function () { openG(''); });
      function close() { dlg.hidden = true; var panel = document.getElementById('panel'); if (panel && atOpen != null) jumpTo(panel, atOpen); }
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
