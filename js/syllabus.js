/* ============================================================
   syllabus.js — the Cambridge IGCSE Biology 0610 syllabus, as Cambridge publishes it, behind the
   "IGCSE 0610" badge in every lab. Shared: copied into each lab by its build.

   Data: window.SYLLABUS = { versions: [ { id, label, topics: [ { n, title, sections: [ { n, title,
   core: [ { n, text } ], supplement: [ ... ] } ] } ] } ] }, written by each lab's build from
   labs-shared/syllabus.json (parsed from the official PDFs by tools/syllabus/parse.py). The most
   recent version first; the next one goes in the same file when Cambridge publishes it, and the
   old one stays for the students still on it.

   The OLDER syllabuses, 2015 to 2022 (Daniel, 28 Sep 2026: "if the students are curious"), are in
   js/data/syllabus-older.js, parsed by tools/syllabus/parse_older.py and loaded only when a student
   opens one: window.SYLLABUS.older names them for the version bar. Their statements are bullets, not
   numbers ({ text } with no n), and 2015's topics sit in Sections I–IV (`group`). A choice of an older
   one is not remembered: the badge always opens on a syllabus a student is examined on.

   YOUR YEAR (Daniel, 28 Sep 2026: "make very clear ... which syllabus is for what year"). The school year turns over
   on 1 August, so 2026–27 ends with the June 2027 exams: Year 11 sits them this year, Year 10 next, Year 9 in two.
   A student is kept as the year of their exams ('labs.examYear'), which never changes, so next August a Year 9
   becomes a Year 10 by itself. The hub's "Your year" tabs and Bio English (from the class in the teacher's
   spreadsheet) keep the same key. The pop-up opens on the syllabus for that exam year, and says which it is.
   A syllabus with the same content as another (2029 = 2026–2028, labs-shared/syllabus-versions.json) is its own
   version with the other's statements (`same`), and says so.

   The layout follows the official document: each section a two-column table, Core on the left
   and Supplement on the right, the statements numbered as the syllabus numbers them. On a
   phone the two columns stack, Core above Supplement, each still headed.
   The lab's own topics come first and open; the rest of the syllabus is there, closed.
   ============================================================ */
(function (global) {
  'use strict';
  var CSS = '.badge{cursor:pointer;font:inherit}' +
    '.badge:hover,.badge:focus-visible{filter:brightness(1.12)}' +
    '.syl__box{max-width:1040px;width:100%;max-height:88vh;display:flex;flex-direction:column;padding:0}' +
    '.syl__head{padding:16px 20px 10px;border-bottom:1px solid var(--edge)}' +
    '.syl__head h2{margin:0 0 2px;font-size:20px}' +
    '.syl__sub{margin:0;font-size:13px;color:var(--grey)}' +
    '.syl__bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-top:10px}' +
    '.syl__vers{display:flex;gap:6px;flex-wrap:wrap}' +
    '.syl__ver{font:inherit;font-size:13px;font-weight:600;border:1.5px solid var(--edge);border-radius:999px;background:#fff;padding:5px 12px;cursor:pointer;color:var(--ink)}' +
    '.syl__ver[aria-pressed="true"]{background:var(--green);border-color:var(--green);color:#fff}' +
    '.syl__find{flex:1 1 220px;min-width:160px;font:inherit;font-size:14px;padding:7px 11px;border:1px solid var(--edge);border-radius:999px;background:var(--card-2)}' +
    '.syl__find:focus{outline:2px solid var(--green);outline-offset:1px;background:#fff}' +
    '.syl__body{overflow:auto;padding:6px 20px 24px;-webkit-overflow-scrolling:touch}' +
    '.syl__group{margin:14px 0 6px;font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--green)}' +
    '.syl__topic{border:1px solid var(--edge);border-radius:var(--r);background:#fff;margin:8px 0}' +
    '.syl__topic > summary{cursor:pointer;padding:10px 14px;font-weight:700;font-size:15px;list-style:none;display:flex;gap:10px;align-items:baseline}' +
    '.syl__topic > summary::-webkit-details-marker{display:none}' +
    '.syl__topic > summary::before{content:"▸";color:var(--green);font-size:13px;transition:transform .15s}' +
    '.syl__topic[open] > summary::before{transform:rotate(90deg)}' +
    '.syl__topic > summary small{font-weight:500;color:var(--grey);font-size:12.5px}' +
    '.syl__sec{padding:2px 14px 14px}' +
    '.syl__sec h4{margin:12px 0 6px;font-size:15px;color:var(--ink)}' +
    '.syl__t{width:100%;border-collapse:collapse;table-layout:fixed;font-size:14px;line-height:1.45}' +
    '.syl__t th{text-align:left;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--grey);padding:6px 10px 4px;border-bottom:2px solid var(--edge)}' +
    '.syl__t th.syl__s{color:#5A3D8A}' +
    '.syl__t td{vertical-align:top;padding:8px 10px 10px;border-bottom:1px solid var(--edge)}' +
    '.syl__t td.syl__s{background:#F4F0FA}' +
    '.syl__t ol{margin:0;padding:0;list-style:none}' +
    '.syl__t li{display:grid;grid-template-columns:2em 1fr;gap:0 4px;margin:0 0 8px}' +
    '.syl__t li > b{font-weight:700;color:var(--green)}' +
    '.syl__t li.syl__hit > span{background:#FFF3B0}' +
    '.syl__t li.syl__no{display:none}' +
    '.syl__t .syl__ab{display:block;padding-left:1.6em;text-indent:-1.6em;margin-top:2px}' +
    '.syl__t td:empty::after{content:"—";color:#B8B8B8}' +
    '.syl__foot{font-size:12px;color:var(--grey);margin:18px 0 0}' +
    '.syl__foot a{color:var(--green)}' +
    '.syl__none{padding:20px 0;color:var(--grey)}' +
    '.syl__oldlab{font-size:12.5px;color:var(--grey);align-self:center;margin:0 0 0 6px}' +
    '.syl__ver.syl__vold{font-weight:500}' +
    '.syl__note{margin:12px 0 4px;padding:10px 12px;border-radius:8px;background:#FBF1E2;border:1px solid #DDBB85;color:#5E4212;font-size:14px;line-height:1.45}' +
    '.syl__sec--head h4{margin-bottom:0}' +
    '.syl__you{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin-top:10px;font-size:13.5px}' +
    '.syl__youlab{font-weight:700;color:var(--ink);margin-right:2px}' +
    '.syl__yr{font:inherit;font-size:13px;font-weight:600;border:1.5px solid var(--edge);border-radius:999px;background:#fff;padding:4px 11px;cursor:pointer;color:var(--ink)}' +
    '.syl__yr[aria-pressed="true"]{background:#1F4E79;border-color:#1F4E79;color:#fff}' +
    '.syl__youline{flex:1 1 260px;color:var(--ink);line-height:1.4}' +
    '.syl__note--same{background:#EEF4FA;border-color:#B7CDE3;color:#1F3B57}' +
    '@media (max-width:700px){' +
    '  .syl__t,.syl__t thead,.syl__t tbody,.syl__t tr,.syl__t td{display:block}' +
    '  .syl__t thead{display:none}' +
    '  .syl__t td{border:0;padding:6px 8px 8px}' +
    '  .syl__t td::before{content:"Core";display:block;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--grey);margin-bottom:4px}' +
    '  .syl__t td.syl__s::before{content:"Supplement";color:#5A3D8A}' +
    '  .syl__t td:empty{display:none}' +
    '  .syl__box{max-height:100dvh;border-radius:0}' +
    '  .modal.syl{padding:0}' +
    '  .syl__head{padding:12px 14px 8px}.syl__body{padding:4px 12px 20px}' +
    '}';

  var LAB_TOPICS = (global.LAB_CONFIG && global.LAB_CONFIG.syllabusTopics) || [];
  var dlg = null, verId = null, find = null, body = null, versBar = null;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function data() {
    var d = global.SYLLABUS || { versions: [] };
    if (!d._lent) {               /* a version with the same content as another carries no statements of its own */
      d.versions.forEach(function (v) {
        if (v.same && !v.topics) { var o = d.versions.filter(function (x) { return x.id === v.same; })[0]; if (o) v.topics = o.topics; }
      });
      d._lent = true;
    }
    return d;
  }
  /* ---------- your year, your exams, your syllabus ---------- */
  var EXAM_KEY = 'labs.examYear', chosenNow = false, you = null;
  function schoolYearEnd() { var d = new Date(); return d.getMonth() >= 7 ? d.getFullYear() + 1 : d.getFullYear(); }
  function examYearOf(g) { return schoolYearEnd() + (11 - g); }
  function groupOf(e) { var g = 11 - (e - schoolYearEnd()); return g >= 9 && g <= 11 ? g : null; }
  function myExamYear() {
    try {
      var e = parseInt(localStorage.getItem(EXAM_KEY), 10); if (e) return e;
      var y = localStorage.getItem('biology-hub.year');          /* the hub's tab, kept before exam years were */
      if (/^y(9|10|11)$/.test(y || '')) return examYearOf(+y.slice(1));
    } catch (x) {}
    return null;
  }
  function setMyYear(g) { try { localStorage.setItem(EXAM_KEY, String(examYearOf(g))); localStorage.setItem('biology-hub.year', 'y' + g); } catch (x) {} }
  function span(id) { var m = /^(\d{4})(?:-(\d{4}))?$/.exec(id || ''); return m ? [+m[1], +(m[2] || m[1])] : null; }
  /* the syllabus for exams in year e; the newest when Cambridge has not published that one yet */
  function versionFor(e) {
    var vs = data().versions;
    for (var i = 0; i < vs.length; i++) { var sp = span(vs[i].id); if (sp && e >= sp[0] && e <= sp[1]) return { v: vs[i], exact: true }; }
    return { v: vs[0], exact: false };
  }
  function labelOf(id) { var v = data().versions.filter(function (x) { return x.id === id; })[0]; return v ? v.label : id; }
  function defaultVersion() {
    var e = myExamYear(); if (e) return versionFor(e).v.id;
    var id = null; try { id = localStorage.getItem('labs.syllabusVersion'); } catch (x) {}
    var vs = data().versions;
    return vs.some(function (v) { return v.id === id; }) ? id : (vs.length ? vs[0].id : null);
  }
  function paintYou() {
    if (!you) return;
    var e = myExamYear(), g = e ? groupOf(e) : null, line;
    you.querySelectorAll('.syl__yr').forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-g') === g ? 'true' : 'false'); });
    if (!g) line = 'Choose your year: it decides which syllabus your exams follow.';
    else {
      var f = versionFor(e), v = f.v;
      line = 'Your IGCSE exams are in ' + e + ': ' + (f.exact
        ? 'the syllabus for ' + v.label + (v.same ? ', which is word for word the same as ' + labelOf(v.same) : '') + '.'
        : 'Cambridge has not published the syllabus for ' + e + ' yet, so the newest, for ' + v.label + ', is shown.');
    }
    you.querySelector('.syl__youline').textContent = line;
  }
  function olderList() { return data().older || []; }
  function isOlder(id) { return olderList().some(function (v) { return v.id === id; }); }
  function version() {
    var vs = data().versions, old = (global.SYLLABUS_OLDER && global.SYLLABUS_OLDER.versions) || [];
    if (isOlder(verId)) return old.filter(function (v) { return v.id === verId; })[0] || null;   /* null: still loading */
    return vs.filter(function (v) { return v.id === verId; })[0] || vs[0];
  }
  /* the older syllabuses come in on first use, with the same ?v= stamp as the rest of the lab */
  var olderState = null;          /* null, 'loading', 'ready' or 'failed' */
  function loadOlder() {
    if (global.SYLLABUS_OLDER) { olderState = 'ready'; return; }
    if (olderState === 'loading') return;
    olderState = 'loading';
    var me = document.querySelector('script[src*="js/data/syllabus.js"]');
    var stamp = me ? (me.getAttribute('src').split('?')[1] || '') : '';
    var sc = document.createElement('script');
    sc.src = 'js/data/syllabus-older.js' + (stamp ? '?' + stamp : '');
    sc.onload = function () { olderState = global.SYLLABUS_OLDER ? 'ready' : 'failed'; if (dlg && !dlg.hidden) paint(); };
    sc.onerror = function () { olderState = 'failed'; if (dlg && !dlg.hidden) paint(); };
    document.head.appendChild(sc);
  }

  /* a chemical formula keeps its subscripts, as the document prints them: 6CO2 + 6H2O → C6H12O6 + 6O2 */
  function chem(escaped) {
    return escaped.replace(/(^|[\s(])(\d*)((?:[A-Z][a-z]?\d*){1,8})(?=$|[\s),.;:])/g, function (m, pre, coef, body) {
      if (!/\d/.test(body)) return m;   /* DNA, ATP: a word, not a formula */
      return pre + coef + body.replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>');
    });
  }
  /* a statement: its number, its text, and any (a) (b) lines on their own */
  function item(it) {
    var parts = String(it.text).split('\n'), first = parts.shift();
    return '<li data-n="' + esc(it.n || '') + '"><b>' + (it.n ? esc(it.n) : '\u2022') + '</b><span>' + chem(esc(first)) + parts.map(function (p) { return '<span class="syl__ab">' + chem(esc(p)) + '</span>'; }).join('') + '</span></li>';
  }
  function section(sec) {
    if (!sec.core.length && !sec.supplement.length)
      return '<div class="syl__sec syl__sec--head" data-sec="' + esc(sec.n) + '"><h4>' + esc(sec.n) + ' ' + esc(sec.title) + '</h4></div>';
    return '<div class="syl__sec" data-sec="' + esc(sec.n) + '"><h4>' + esc(sec.n) + ' ' + esc(sec.title) + '</h4>' +
      '<table class="syl__t"><thead><tr><th>Core</th><th class="syl__s">Supplement</th></tr></thead><tbody><tr>' +
      '<td>' + (sec.core.length ? '<ol>' + sec.core.map(item).join('') + '</ol>' : '') + '</td>' +
      '<td class="syl__s">' + (sec.supplement.length ? '<ol>' + sec.supplement.map(item).join('') + '</ol>' : '') + '</td>' +
      '</tr></tbody></table></div>';
  }
  /* which of a topic's sections this lab teaches: the whole topic ("6"), or named sections ("14.5"). The lab names
     them in the newest syllabus's numbering, and a title is what carries over to the others: in 2016–2022 topic 20
     is Biotechnology, and 2015 numbers everything differently */
  function key(t) { return String(t).toLowerCase().replace(/[^a-z]+/g, ''); }
  var labTitles = null;
  function titlesOfLab() {
    if (labTitles) return labTitles;
    var v0 = data().versions[0], tt = [], ss = [];
    if (v0) LAB_TOPICS.forEach(function (x) {
      x = String(x);
      v0.topics.forEach(function (t) {
        if (t.n === x) tt.push(key(t.title));
        t.sections.forEach(function (s) { if (s.n === x) ss.push(key(s.title)); });
      });
    });
    return (labTitles = { topics: tt, sections: ss });
  }
  function oursOf(t) {
    var L = titlesOfLab(), all = L.topics.indexOf(key(t.title)) >= 0;
    return t.sections.filter(function (s) { return all || L.sections.indexOf(key(s.title)) >= 0; });
  }
  /* a topic, or the part of it that is asked for: closed, so the reader chooses what to open */
  function topic(t, secs, note) {
    return '<details class="syl__topic" data-topic="' + esc(t.n) + '"><summary>' + esc(t.n) + ' ' + esc(t.title) +
      '<small>' + (secs.length === t.sections.length ? secs.length + (secs.length === 1 ? ' section' : ' sections') : secs.map(function (s) { return s.n; }).join(', ') + (note ? ' · ' + note : '')) + '</small></summary>' +
      secs.map(section).join('') + '</details>';
  }
  function paint() {
    var v = version();
    versBar.querySelectorAll('.syl__ver').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === (v ? v.id : verId) ? 'true' : 'false'); });
    if (!v) {
      if (isOlder(verId)) {
        if (olderState !== 'failed') loadOlder();
        body.innerHTML = olderState === 'failed'
          ? '<p class="syl__none">The older syllabuses could not be loaded. Check your connection and press the year again.</p>'
          : '<p class="syl__none">Loading the older syllabus…</p>';
        if (olderState === 'failed') olderState = null;     /* the next press tries again */
      } else body.innerHTML = '<p class="syl__none">The syllabus is not loaded.</p>';
      return;
    }
    var ours = [], rest = [], old = isOlder(v.id);
    /* a syllabus whose last exams came before this school year's (2023–2025) is past, like the older ones */
    var sp0 = span(v.id), until = old ? v.until : (sp0 && sp0[1] < schoolYearEnd() ? sp0[1] : null);
    /* 2015 groups its topics in Sections I–IV: a heading wherever the Section changes */
    function grouped(list) {
      var out = [], g = null;
      list.forEach(function (x) { if (x.t.group && x.t.group !== g) { g = x.t.group; out.push('<div class="syl__group">' + esc(g) + '</div>'); } out.push(x.html); });
      return out.join('');
    }
    v.topics.forEach(function (t) {
      var mine = oursOf(t), others = t.sections.filter(function (s) { return mine.indexOf(s) < 0; });
      if (mine.length) ours.push({ t: t, html: topic(t, mine, mine.length < t.sections.length ? 'the part this lab teaches' : '') });
      if (others.length) rest.push({ t: t, html: topic(t, others, mine.length ? mine.map(function (s) { return s.n; }).join(', ') + ' above' : '') });
    });
    var mineE = myExamYear(), mine = mineE ? versionFor(mineE).v : null;
    var current = data().versions.filter(function (x) { var sp = span(x.id); return sp && sp[1] >= schoolYearEnd(); }).map(function (x) { return x.label; });
    var note = until ? '<p class="syl__note">This syllabus was examined until ' + esc(until) + '. Your exams follow ' +
      (mine ? 'the syllabus for ' + esc(mine.label) : 'the ' + esc(current.join(' or ')) + ' syllabus') +
      ', but past papers up to ' + esc(until) + ' were set on this one, so it shows what those questions expected.</p>'
      : v.same ? '<p class="syl__note syl__note--same">The syllabus for exams in ' + esc(v.label) + ' is word for word the same as the ' + esc(labelOf(v.same)) +
        ' syllabus: every statement, the papers and the practical skills. Everything in this lab serves both.</p>' : '';
    var src = v.source || {}, via = String(src.via || ''), yr = (via.match(/\b(19|20)\d\d\b/) || [])[0];
    var link = src.url ? (/archive\.org/.test(via) && yr ? 'https://web.archive.org/web/' + yr + '/' + src.url : src.url) : '';
    var foot = old
      ? '<p class="syl__foot">The statements are Cambridge\'s own, from the syllabus for examination in ' + esc(v.label) + ', bulleted as it prints them: Core on the left, Supplement on the right. © Cambridge University Press &amp; Assessment.' +
        (link ? ' The document: <a href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(src.title || 'the published syllabus') + '</a>' + (/archive\.org/.test(via) ? ', a copy kept by the Internet Archive' : '') + '.' : '') + '</p>'
      : '<p class="syl__foot">The statements are Cambridge\'s own, from the published syllabus for ' + esc(v.label) + (v.same ? ' (the same as ' + esc(labelOf(v.same)) + ')' : '') + ', numbered as it numbers them: Core is examined on Papers 1, 3 and 5 or 6; Supplement adds Papers 2 and 4. © Cambridge University Press &amp; Assessment. The official document: <a href="https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-biology-0610/" target="_blank" rel="noopener">cambridgeinternational.org</a>.</p>';
    body.innerHTML = note + (ours.length ? '<div class="syl__group">This lab\'s topics</div>' + grouped(ours) + '<div class="syl__group">The rest of the syllabus</div>' : '') + grouped(rest) + foot;
    filter();
  }
  function filter() {
    var q = (find.value || '').trim().toLowerCase();
    body.querySelectorAll('.syl__t li').forEach(function (li) { var hit = !q || li.textContent.toLowerCase().indexOf(q) >= 0; li.classList.toggle('syl__no', !hit); li.classList.toggle('syl__hit', !!q && hit); });
    body.querySelectorAll('.syl__sec').forEach(function (s) { s.hidden = !!q && !s.querySelector('li:not(.syl__no)'); });
    body.querySelectorAll('.syl__topic').forEach(function (t) { var any = !!t.querySelector('.syl__sec:not([hidden])'); t.hidden = !!q && !any; if (q && any) t.open = true; });
  }
  function build() {
    if (dlg) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    dlg = document.createElement('div'); dlg.className = 'modal syl'; dlg.hidden = true; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'The syllabus');
    var vs = data().versions;
    dlg.innerHTML = '<div class="modal__box syl__box"><div class="syl__head"><button class="modal__close" type="button" aria-label="Close">×</button>' +
      '<h2>Cambridge IGCSE Biology 0610 — the syllabus</h2><p class="syl__sub">As Cambridge publishes it, section by section: Core on the left, Supplement on the right.' + (LAB_TOPICS.length ? ' This lab\'s topics come first.' : '') + '</p>' +
      '<div class="syl__you" role="group" aria-label="Your year"><span class="syl__youlab">Your year</span>' +
      [9, 10, 11].map(function (g) { return '<button type="button" class="syl__yr" data-g="' + g + '" aria-pressed="false">Year ' + g + '</button>'; }).join('') +
      '<span class="syl__youline"></span></div>' +
      '<div class="syl__bar"><div class="syl__vers">' + vs.map(function (v) { return '<button type="button" class="syl__ver" data-v="' + esc(v.id) + '">' + esc(v.label) + '</button>'; }).join('') +
      (olderList().length ? '<span class="syl__oldlab">Older:</span>' + olderList().map(function (v) { return '<button type="button" class="syl__ver syl__vold" data-v="' + esc(v.id) + '">' + esc(v.label) + '</button>'; }).join('') : '') + '</div>' +
      '<input class="syl__find" type="search" placeholder="Find a word in the syllabus…" aria-label="Find in the syllabus"></div></div><div class="syl__body"></div></div>';
    document.body.appendChild(dlg);
    find = dlg.querySelector('.syl__find'); body = dlg.querySelector('.syl__body'); versBar = dlg.querySelector('.syl__vers'); you = dlg.querySelector('.syl__you');
    you.addEventListener('click', function (e) {
      var b = e.target.closest('.syl__yr'); if (!b) return;
      setMyYear(+b.getAttribute('data-g'));
      verId = versionFor(myExamYear()).v.id; chosenNow = false;
      paintYou(); paint(); body.scrollTop = 0;
    });
    versBar.addEventListener('click', function (e) {
      var b = e.target.closest('.syl__ver'); if (!b) return;
      verId = b.getAttribute('data-v'); chosenNow = true;
      if (!isOlder(verId)) { try { localStorage.setItem('labs.syllabusVersion', verId); } catch (x) {} }
      paint(); body.scrollTop = 0;
    });
    find.addEventListener('input', filter);
    dlg.querySelector('.modal__close').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) close(); });
    verId = defaultVersion();
  }
  var opener = null;
  function open(sectionN) {
    build();
    /* the badge opens on the student's own syllabus, unless they picked another one on this visit; an older
       syllabus is looked at, not kept */
    if (!chosenNow || isOlder(verId)) verId = defaultVersion();
    paintYou(); paint();
    dlg.hidden = false; document.body.classList.add('syl-open');
    if (sectionN) { var el = body.querySelector('.syl__sec[data-sec="' + sectionN + '"]'); if (el) { var t = el.closest('.syl__topic'); if (t) t.open = true; el.scrollIntoView({ block: 'start' }); } }
    else body.scrollTop = 0;
    setTimeout(function () { try { find.focus({ preventScroll: true }); } catch (x) { find.focus(); } }, 30);
  }
  function close() { if (!dlg) return; dlg.hidden = true; document.body.classList.remove('syl-open'); if (opener) opener.focus(); }
  function wire() {
    var b = document.getElementById('btnSyllabus') || document.querySelector('.badge');
    if (!b) return;
    if (b.tagName !== 'BUTTON') { b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0'); }
    b.title = 'The syllabus, as Cambridge publishes it — click to open';
    b.addEventListener('click', function () { opener = b; open(); });
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opener = b; open(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  global.LabSyllabus = { open: open, close: close };
})(window);
