/* labs-shared/glossary-lang/glossary-lang.js — each glossary word's NAME in Korean, Chinese and Japanese (9 Nov 2026).
   Daniel, 9 Nov 2026: in the glossary pupils "can toggle to chinese, japanese and korean"; the Key words cards only
   guide them there ("do not add directly there"); the Glossary button also shows Korean and Chinese; every lab. And:
   "make sure to find biologically/scientifically accurate translations for all words. definitions should all be in
   english". So only the name of each word is translated, never a definition.
   NEVER edit a lab's copy (js/glossary-lang.js): edit this file, then rebuild the lab. Its tools/build.mjs calls
   copyGlossLang (./copy.mjs), which copies this file and writes js/data/glossary-tr.js from ./names.master.js.
   It changes no lab's own code. It reads what the lab draws, and adds to it:
   - the glossary (#glossDlg; each .gloss__row, whose .gloss__got button carries the term in data-got): a row of buttons
     above the search box, English only · 한국어 · 中文 · 日本語 in their own scripts; with a language on, each word's name
     in it stands beside the English word, and a line says that the definitions stay in English. The search also finds
     a word by its name in any of the three languages (added to the row's data-term, which the lab's own filter reads).
     The choice is kept in this browser (localStorage labs.glossLang), so it holds in every lab.
   - each station's Key words card (.kw-hint): one line under the hint, three buttons that open the Glossary at this
     station's words in that language. Nothing is translated on the cards.
   The Glossary button's own Korean and Chinese (용어집 · 词汇表) are in each lab's index.html, so they show before any
   script runs; copy.mjs refuses a build whose page lacks them or does not load this file. */
(function () {
  'use strict';
  var LANGS = { ko: { label: '한국어', tag: 'ko' }, zh: { label: '中文', tag: 'zh-Hans' }, ja: { label: '日本語', tag: 'ja' } };
  var ORDER = ['ko', 'zh', 'ja'];
  var KEY = 'labs.glossLang';
  /* the Glossary button's own 용어집 · 词汇表 (written in index.html): beside the word on a wide screen, stacked small under
     A–Z where the header is narrow, so the header keeps one row of buttons on a phone */
  /* colours: the Cells, Immunity and Inheritance labs name their green --accent (light in the dark version, with --on-ink
     dark on it); the Plants, Circulation, Classification and Digestion labs name it --green (the same in both versions, white on it) */
  var CSS = '.gl-btn{font-size:.86em;font-weight:600;margin-left:.25em;white-space:nowrap}' +
    '#btnGloss .hbtn__short{line-height:1}.hbtn__short .gl-btn{display:block;margin:1px 0 0;font-size:10px;line-height:1.05;letter-spacing:0}' +
    '.gl-lang{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:12px 0 0}' +
    '.gl-lang__lbl{font-size:13px;color:var(--grey);margin-right:2px}' +
    '.gl-lang__b,.gl-guide__b{font:inherit;font-size:13px;font-weight:600;line-height:1.3;padding:4px 11px;border-radius:var(--r-pill,999px);border:1px solid var(--edge);background:var(--card);color:var(--ink);cursor:pointer}' +
    '.gl-lang__b[aria-pressed="true"]{background:var(--accent,var(--green));border-color:var(--accent,var(--green));color:var(--on-ink,#fff)}' +
    '.gl-lang__b:hover,.gl-guide__b:hover{border-color:var(--accent,var(--green))}' +
    '.gl-lang__b:focus-visible,.gl-guide__b:focus-visible{outline:2px solid var(--accent,var(--green));outline-offset:1px}' +
    '.gl-lang__note{margin:6px 0 0;font-size:12.5px;line-height:1.4;color:var(--grey)}' +
    '.gl-lang__note[hidden]{display:none}' +
    '.gl-name{margin-left:.45em;font-weight:600;font-size:15px;color:var(--ink)}' +
    '.gl-guide{display:flex;flex-wrap:wrap;align-items:center;gap:5px 6px;margin:-3px 0 10px;font-size:12.5px;line-height:1.4;color:var(--grey)}' +
    '.gl-guide__b{font-size:12px;padding:2px 9px}' +
    '.gloss__grp.gl-flash .gloss__h{background:var(--accent-tint,var(--green-tint));border-radius:var(--r-sm,6px)}';

  function nameOf(term, l) { var e = (window.GLOSSARY_TR || {})[String(term || '').toLowerCase()]; return (e && e[l]) || ''; }
  function readLang() { try { var v = localStorage.getItem(KEY); return LANGS[v] ? v : ''; } catch (e) { return ''; } }
  function keepLang(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} }
  var lang = readLang();
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  function addStyle() {
    if (document.getElementById('glLangCss')) return;
    var st = document.createElement('style'); st.id = 'glLangCss'; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---------- the glossary ---------- */
  function paintRows() {
    var list = document.getElementById('glossList'); if (!list) return;
    each(list.querySelectorAll('.gloss__row'), function (row) {
      var got = row.querySelector('[data-got]'), dt = row.querySelector('dt'); if (!got || !dt) return;
      var term = got.getAttribute('data-got');
      var base = row.getAttribute('data-gl-base');
      if (base == null) { base = row.getAttribute('data-term') || ''; row.setAttribute('data-gl-base', base); }
      var all = ORDER.map(function (l) { return nameOf(term, l); }).filter(Boolean).join(' ').toLowerCase();
      row.setAttribute('data-term', all ? base + ' ' + all : base);
      var old = dt.querySelector('.gl-name'); if (old) old.parentNode.removeChild(old);
      var n = lang ? nameOf(term, lang) : ''; if (!n) return;
      var s = document.createElement('span'); s.className = 'gl-name'; s.lang = LANGS[lang].tag; s.textContent = n;
      /* after the word and its plural, before its Supplement / beyond 0610 tag and its 🔊 buttons */
      var before = null;
      each(dt.children, function (c) { if (!before && (c.classList.contains('tier') || c.classList.contains('say'))) before = c; });
      dt.insertBefore(s, before);
    });
  }
  function paintBar() {
    each(document.querySelectorAll('#glLang [data-gl]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-gl') === lang ? 'true' : 'false'); });
    var note = document.getElementById('glLangNote'); if (note) note.hidden = !lang;
  }
  /* the lab's own filter reads data-term on every input event: run it again once the names are in */
  function refilter() { var f = document.getElementById('glossFind'); if (f && f.value) f.dispatchEvent(new Event('input')); }
  function choose(l) { lang = LANGS[l] ? l : ''; keepLang(lang); paintBar(); paintRows(); }

  function mountGlossary() {
    var list = document.getElementById('glossList'), find = document.getElementById('glossFind');
    if (!list || !find || document.getElementById('glLang')) return;
    var bar = document.createElement('div');
    bar.id = 'glLang'; bar.className = 'gl-lang'; bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Show the name of each word in another language');
    bar.innerHTML = '<span class="gl-lang__lbl">Show each word’s name in:</span>' +
      '<button type="button" class="gl-lang__b" data-gl="">English only</button>' +
      ORDER.map(function (l) { return '<button type="button" class="gl-lang__b" data-gl="' + l + '" lang="' + LANGS[l].tag + '">' + LANGS[l].label + '</button>'; }).join('');
    var note = document.createElement('p');
    note.id = 'glLangNote'; note.className = 'gl-lang__note';
    note.textContent = 'Only the names are translated. Learn each definition in English: the exam is in English.';
    find.parentNode.insertBefore(bar, find);
    find.parentNode.insertBefore(note, find);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-gl]'); if (!b) return;
      choose(b.getAttribute('data-gl')); refilter();
    });
    /* the lab redraws the whole list each time the glossary opens: name the new rows */
    new MutationObserver(function () { paintRows(); refilter(); }).observe(list, { childList: true });
    paintBar(); paintRows();
  }

  /* ---------- the Key words cards: a way to the glossary, nothing translated on the card ---------- */
  function mountGuides(root) {
    each(root.querySelectorAll('.kw-hint:not([data-gl])'), function (h) {
      h.setAttribute('data-gl', '1');
      var p = document.createElement('p'); p.className = 'gl-guide';
      p.innerHTML = '<span>Each word’s name in Korean, Chinese or Japanese is in the Glossary:</span>' +
        ORDER.map(function (l) { return '<button type="button" class="gl-guide__b" data-glopen="' + l + '" lang="' + LANGS[l].tag + '">' + LANGS[l].label + '</button>'; }).join('');
      h.parentNode.insertBefore(p, h.nextSibling);
    });
  }
  function scrollerOf(el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      var o = getComputedStyle(n).overflowY;
      if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) return n;
    }
    return null;
  }
  /* to the group of the station whose card was pressed: the group holding that card's first word */
  function showGroupOf(term) {
    if (!term) return;
    var dlg = document.getElementById('glossDlg'); if (!dlg) return;
    var got = Array.prototype.filter.call(dlg.querySelectorAll('.gloss__got[data-got]'), function (g) { return g.getAttribute('data-got').toLowerCase() === term; })[0];
    var grp = got && got.closest('.gloss__grp'); if (!grp) return;
    var sc = scrollerOf(grp);
    if (sc) sc.scrollTop += grp.getBoundingClientRect().top - sc.getBoundingClientRect().top - 12;
    grp.classList.add('gl-flash');
    setTimeout(function () { grp.classList.remove('gl-flash'); }, 1600);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-glopen]'); if (!b) return;
    choose(b.getAttribute('data-glopen'));
    var card = b.closest('.card'), first = card && card.querySelector('[data-kwcard]');
    var term = first ? first.getAttribute('data-kwcard') : '';
    if (typeof window.LabGlossary === 'function') window.LabGlossary('');
    /* after the lab's own opening steps (on a computer it puts the cursor in the search box and the list at its top) */
    setTimeout(function () { showGroupOf(term); }, 120);
  });

  function start() {
    addStyle();
    mountGlossary();
    var panel = document.getElementById('panel') || document.body, queued = false;
    mountGuides(panel);
    new MutationObserver(function () {
      if (queued) return; queued = true;
      setTimeout(function () { queued = false; mountGuides(panel); }, 0);
    }).observe(panel, { childList: true, subtree: true });
  }
  window.GlossLang = { nameOf: nameOf, choose: choose, lang: function () { return lang; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
