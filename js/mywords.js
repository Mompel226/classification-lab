/* labs-shared/mywords/mywords.js — My words in every lab's glossary (9 Nov 2026; My words part 2).
   Daniel, 9 Nov 2026: beside "I know this one — stop marking it" (which turns green when pointed at), "another option for
   I am unsure or I forget at times. And then the one is I don't know this term. And the idea is that then these, by
   selecting these, then they get the flashcards"; a short message at the top of the glossary, "not too big, not
   overwhelming", with the link to the pupil's own flashcards, there at once ("it's not loading"): their words are asked
   for in the background as soon as the page knows who is signed in.
   NEVER edit a lab's copy (js/mywords.js): edit this file, then rebuild the lab. Its tools/build.mjs calls copyMyWords
   (./copy.mjs), which copies this file and writes js/data/mywords-ids.js (window.MW_IDS) from ./ids.json.
   It changes no lab's own code. It reads what the lab draws, and adds to it:
   - the glossary (#glossDlg): one short line under its description, with "My words ↗" (Bio English Lab, #/my);
     the lab's own button is moved into one row with the two new ones (.mw-g); its code and its look stay the lab's;
   - each word (.gloss__row; its .gloss__got button, the lab's own "I know this one — stop marking it", carries the term in
     data-got): two more buttons after it, "~ I partly know this one" and "✕ I do not know this one". The three answer one
     question: a press on one sets it, and a press on the one already set takes the word out of My words.
       ✓ the lab's own button: the lab stops marking the word (as before) AND it goes to "I know these" (y);
       ~ partly: "I partly know these" (r); ✕: "I do not know these yet" (n). Either one, on a word the lab had stopped
         marking, presses the lab's own button first, so the lab marks the word again (the lab's own code does it).
   The word's card is window.MW_IDS[term] (a Bio English keyword, or "g.<word>", a card of its own: ./ids.mjs).
   The pupil's words: localStorage "biology.mywords" (one origin, so every lab shares it) { who, words: {id: [n|r|y|x,
   seconds, from]}, dirty: {id: 1} }, from = "l:<lab>". Signed in, each move goes to the labs script (words.save, a few
   seconds later, and as the page is left); words.mine brings the moves made elsewhere. Signed out, the moves wait here and
   go to the first account that signs in; another account signing in removes the last pupil's words from this computer
   (as the labs' own work: claimFor). The rule everywhere: the newest move of each word wins (couplings C120). Since part 3 (9 Nov
   2026) words.mine also brings the moves made on My assessments (`moves`), joined the same way and sent on to the records.
   Quick, and few reads (the audit of 9 Nov 2026; Daniel: "readily and quickly saved … resyncing with the spreadsheet, but
   that doesn't happen all the time"): a move is sent 3 s later at most (later moves join it, never pushing it back), and
   as the page is hidden or left; a failure tries again 30 s later and the line says so. words.mine is asked when this
   browser has not asked for 10 minutes (S.at), when another account signs in, when the browser was emptied (cookies
   cleared: everything comes back from the records), or when Bio English Lab saved a move since ("biology.mywords.saved",
   { who, t, by }: each side writes it after a save, the other reads it). Times use the server's clock (S.skew).
   The glossary's look (21 Nov 2026; Daniel: "very hard to differentiate between the different sections", and a word marked
   "should also be color coded"): this file styles every lab's glossary, so one change reaches all of them. A dark band heads
   each section, a list of the sections stays beside the words (a strip above them on a phone) with each section's marks
   counted, and the search stays in view. One colour, one meaning: in the list green is only ✓ know, amber only ~ partly,
   red only ✕ do not know, so the bands and the word names are neutral. The lab's own button keeps its words and its code. */
(function () {
  'use strict';
  var CFG = window.LAB_CONFIG || {}, SI = window.SignIn || null, IDS = window.MW_IDS || {};
  var KEY = 'biology.mywords', LINK = '../bio-english-lab/#/my', SAID = 'biology.mywords.saved', FRESH = 10 * 60 * 1000;
  var LAB = (location.pathname.split('/').filter(function (p) { return /-lab$/.test(p); }).pop()) || 'lab';
  var CSS =
    /* the head: short, with the search beside the language buttons */
    '#glossDlg .modal__box{max-width:1080px;position:relative}' +
    '#glossDlg #glossClose{position:sticky;top:0;z-index:6}' +
    '#glossDlg .st-sub{margin:0;font-size:13.5px;line-height:1.4}' +
    '.mw-g__note{margin:8px 0 0;padding:6px 11px;font-size:13px;line-height:1.4;color:var(--ink);background:var(--card-2);border:1px solid var(--edge);border-radius:var(--r-sm,6px)}' +
    '.mw-g__note a{font-weight:600;color:var(--accent,var(--green));white-space:nowrap}' +
    '.mw-g__note small{margin-left:6px;font-size:12px;color:var(--grey)}' +
    '.mw-k{font-weight:700}.mw-k--r{color:var(--amber)}.mw-k--n{color:var(--bad)}' +
    '.mw-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:10px 0 0}' +
    '.mw-tools .gloss__find{flex:1 1 280px;width:auto;margin:0}.mw-tools .gl-lang{margin:0}.mw-tools .gl-lang__note{flex:1 0 100%;margin:0}' +
    '.mw-meta{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 14px;margin:6px 0 0}.mw-meta p{margin:0}' +
    /* the list of sections: a strip that stays in view on a phone, a column beside the words on a computer */
    '.mw-body{margin-top:6px}' +
    '.mw-nav{position:sticky;top:0;z-index:4;display:flex;gap:6px;overflow-x:auto;padding:8px 40px 8px 0;background:var(--card);border-bottom:1px solid var(--edge);scrollbar-width:thin}' +
    '.mw-nav__b{flex:none;display:flex;align-items:center;gap:6px;font:inherit;font-size:13px;line-height:1.25;text-align:left;color:var(--ink);background:var(--card-2);border:1px solid var(--edge);border-radius:var(--r-sm,6px);padding:5px 9px;cursor:pointer}' +
    '.mw-nav__b[hidden]{display:none}.mw-nav__b:hover{border-color:var(--ink)}' +
    '.mw-nav__b:focus-visible{outline:2px solid var(--accent,var(--green));outline-offset:1px}' +
    '.mw-nav__b[aria-current="true"]{font-weight:600;color:var(--card);background:var(--ink);border-color:var(--ink)}' +
    '.mw-nav__c{display:inline-flex;flex:none;gap:3px;font-size:11px;font-weight:700}' +
    '.mw-nav__c span{padding:0 5px;border-radius:var(--r-pill,999px)}' +
    '.mw-c--y{color:var(--card);background:var(--ok)}.mw-c--r{color:var(--card);background:var(--amber)}.mw-c--n{color:var(--card);background:var(--bad)}' +
    /* each section: a dark band, then its words */
    '#glossList .gloss__grp{margin:14px 0 0;border:1px solid var(--edge);border-radius:10px;background:var(--card-2)}' +
    '#glossList .mw-sec--tap{border:2px solid var(--ink)}' +
    '#glossList .gloss__h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0;padding:8px 13px;font-size:15px;font-weight:700;letter-spacing:0;text-transform:none;color:var(--card);background:var(--ink);border:none;border-radius:8px 8px 0 0}' +
    '#glossList .gloss__grp.gl-flash .gloss__h{background:var(--ink);box-shadow:0 0 0 3px var(--accent,var(--green))}' +
    '.mw-h__n{flex:none;font-size:12.5px;font-weight:600}' +
    '#glossList .gloss__dl{margin:0;padding:8px}' +
    /* each word: its colour says how well the pupil knows it */
    '#glossList .gloss__row{margin:0 0 6px;padding:9px 12px 10px;background:var(--card);border:1px solid var(--edge);border-left:5px solid var(--edge);border-radius:var(--r-sm,6px)}' +
    '#glossList .gloss__row:last-child{margin-bottom:0;border-bottom:1px solid var(--edge)}' +
    '#glossList .gloss__row[data-mw-state="y"]{background:var(--ok-tint);border-color:var(--ok)}' +
    '#glossList .gloss__row[data-mw-state="r"]{background:var(--amber-tint);border-color:var(--amber)}' +
    '#glossList .gloss__row[data-mw-state="n"]{background:var(--bad-tint);border-color:var(--bad)}' +
    '#glossList .gloss__row dt{display:flex;flex-wrap:wrap;align-items:center;gap:3px 8px;font-size:16px;color:var(--ink)}' +
    '#glossList .gloss__row dt .say{margin:0}#glossList .gloss__row dt .say__src{flex-basis:auto;margin:0}' +
    '#glossList .gloss__row dd{margin:4px 0 0;font-size:14.5px;line-height:1.5;color:var(--ink)}' +
    /* the three answers, each always in its own colour; the one chosen is filled */
    '.mw-g{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:9px 0 0}' +
    '#glossList .mw-g .gloss__got,#glossList .mw-g__b{margin:0;font:inherit;font-size:13px;font-weight:600;line-height:1.3;padding:4px 11px;cursor:pointer;background:var(--card);border:1.5px solid currentColor;border-radius:var(--r-pill,999px)}' +
    '#glossList .mw-g .gloss__got:not(.is-known)::before{content:"✓ "}' +
    '#glossList .mw-g .gloss__got{color:var(--ok)}#glossList .mw-g__b[data-mw="r"]{color:var(--amber)}#glossList .mw-g__b[data-mw="n"]{color:var(--bad)}' +
    '#glossList .mw-g .gloss__got:hover{color:var(--ink);background:var(--ok-tint);border-color:var(--ok)}#glossList .mw-g__b[data-mw="r"]:hover{color:var(--ink);background:var(--amber-tint);border-color:var(--amber)}#glossList .mw-g__b[data-mw="n"]:hover{color:var(--ink);background:var(--bad-tint);border-color:var(--bad)}' +
    '#glossList .mw-g .gloss__got:focus-visible,#glossList .mw-g__b:focus-visible{outline:2px solid var(--ink);outline-offset:1px}' +
    '#glossList .gloss__row[data-mw-state="y"] .mw-g .gloss__got,#glossList .gloss__row[data-mw-state="y"] .mw-g .gloss__got:hover{color:var(--card);background:var(--ok);border-color:var(--ok)}' +
    '#glossList .gloss__row .mw-g__b[data-mw="r"][aria-pressed="true"],#glossList .gloss__row .mw-g__b[data-mw="r"][aria-pressed="true"]:hover{color:var(--card);background:var(--amber);border-color:var(--amber)}' +
    '#glossList .gloss__row .mw-g__b[data-mw="n"][aria-pressed="true"],#glossList .gloss__row .mw-g__b[data-mw="n"][aria-pressed="true"]:hover{color:var(--card);background:var(--bad);border-color:var(--bad)}' +
    '#glossDlg.mw-one .mw-nav{display:none}' +
    /* a computer: the words scroll, the head and the list of sections stay */
    '@media (min-width:820px){#glossDlg .modal__box{display:flex;flex-direction:column;height:86vh;max-height:86vh;overflow:hidden}' +
    '#glossDlg #glossClose{position:absolute;top:16px;right:18px}#glossDlg .modal__box h2{padding-right:44px}' +
    '.mw-body{flex:1;min-height:0;display:grid;grid-template-columns:240px minmax(0,1fr);gap:14px;margin-top:10px}' +
    '.mw-nav{position:static;display:block;overflow:hidden auto;padding:0 8px 0 0;border-bottom:none;border-right:1px solid var(--edge)}' +
    '.mw-nav__b{justify-content:space-between;width:100%;margin:0 0 4px}' +
    '#glossList{min-height:0;overflow-y:auto;padding-right:6px}#glossList .gloss__grp:first-child{margin-top:0}' +
    '#glossList .gloss__h{position:sticky;top:0;z-index:3}' +
    '#glossDlg.mw-one .modal__box{height:auto}#glossDlg.mw-one .mw-body{display:block;flex:none}#glossDlg.mw-one #glossList{overflow:visible;padding-right:0}}' +
    /* a phone: three equal buttons with short words; the lab's full words stay for a screen reader */
    '@media (max-width:620px){#glossDlg{padding:10px}#glossDlg .modal__box{max-height:94vh;padding:16px 12px}' +
    '#glossDlg.mw-focus .st-sub,#glossDlg.mw-focus .mw-g__note,#glossDlg.mw-focus .gl-lang,#glossDlg.mw-focus .gl-lang__note,#glossDlg.mw-focus .gloss__known{display:none}' +
    '.mw-g__note small{display:block;margin:2px 0 0}#glossList .gloss__dl{padding:6px}#glossList .gloss__row{padding:8px 9px 9px}' +
    '.mw-g{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:5px}' +
    '#glossList .mw-g .gloss__got,#glossList .mw-g__b{font-size:0;padding:7px 2px;text-align:center}' +
    '#glossList .mw-g .gloss__got::before,#glossList .mw-g .gloss__got:not(.is-known)::before{content:"✓ I know";font-size:12.5px}' +
    '#glossList .mw-g__b[data-mw="r"]::before{content:"~ Partly";font-size:12.5px}#glossList .mw-g__b[data-mw="n"]::before{content:"✕ Do not know";font-size:12.5px}}';
  if (!document.getElementById('mw-g-css')) { var st = document.createElement('style'); st.id = 'mw-g-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }

  /* ---------- the pupil's words, in this browser ---------- */
  function load() {
    var o = null; try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!o || typeof o !== 'object') o = {};
    return { who: String(o.who || ''), words: o.words && typeof o.words === 'object' ? o.words : {}, dirty: o.dirty && typeof o.dirty === 'object' ? o.dirty : {}, off: o.off || '',
      at: +o.at || 0, skew: +o.skew || 0 };
  }
  /* the last save on this computer by either side (labs or Bio English): { who, t (ms), by } */
  function said() { try { var o = JSON.parse(localStorage.getItem(SAID) || 'null'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function tellSaved(email) { try { localStorage.setItem(SAID, JSON.stringify({ who: email, t: Date.now(), by: 'labs' })); } catch (e) {} }
  function save(S) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function me() { var v = SI && SI.who ? SI.who() : null; return v && v.email ? String(v.email).toLowerCase() : ''; }
  /* whose words this browser holds: another account signing in removes the last pupil's; words made signed out (no owner)
     go to the first account that signs in */
  function claim(S, email) {
    if (!email) return S;
    if (S.who && S.who !== email) S = { who: email, words: {}, dirty: {}, off: '', at: 0, skew: 0 };
    S.who = email; return S;
  }
  function idOf(term) {
    var t = String(term || '').toLowerCase();
    return IDS[t] || ('g.' + t.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 56));
  }
  function stateOf(S, id) { var x = S.words[id]; return x && /^[nry]$/.test(x[0]) ? x[0] : ''; }
  var timer = null, failed = false;
  function later(ms) { if (!timer) timer = setTimeout(function () { timer = null; flush(); }, ms); }
  function setWord(id, b) {
    var S = claim(load(), me()), was = S.words[id], now = Math.floor(Date.now() / 1000) + (S.skew || 0);
    S.words[id] = [b, Math.max(now, was ? (+was[1] || 0) + 1 : 0), (was && was[2]) || ('l:' + LAB)];
    S.dirty[id] = 1; save(S);
    later(3000);   /* the first waiting move sets the time; the next ones go with it */
  }
  /* seconds to add to this computer's clock (the server's `now`); under two minutes counts as none */
  function skewOf(j) { var k = j && j.now > 1500000000 ? Math.round(j.now - Date.now() / 1000) : 0; return Math.abs(k) < 120 ? 0 : k; }
  /* the records' list joins this browser's, word by word: the newest move wins */
  function adopt(S, sw) {
    Object.keys(sw || {}).forEach(function (id) {
      var x = sw[id], here = S.words[id];
      if (Array.isArray(x) && /^[nryx]$/.test(String(x[0])) && (!here || (+x[1] || 0) > (+here[1] || 0))) S.words[id] = [String(x[0]), +x[1] || 0, String(x[2] || '')];
    });
    return S;
  }

  /* ---------- the records (the labs script: words.save, words.mine) ---------- */
  function post(body, leaving) {
    var o = { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) };
    if (leaving) o.keepalive = true;
    return fetch(CFG.submitUrl, o).then(function (r) { return r.ok ? r.json() : null; });
  }
  function creds(email) { var c = SI && SI.creds ? SI.creds() : null; return c && c.email && String(c.email).toLowerCase() === email ? c : null; }
  var sending = false;
  function flush(leaving) {
    clearTimeout(timer); timer = null;
    var email = me(); if (!CFG.submitUrl || !SI || !email || sending) return;
    var S = claim(load(), email); save(S);
    if (S.off === email) return;                       /* not on a class list: kept here (asked again on the next visit) */
    var ids = Object.keys(S.dirty).filter(function (id) { return S.words[id]; }).slice(0, 500);
    if (!ids.length) return;
    var c = creds(email);
    if (!c) { if (SI.renew && CFG.googleClientId) SI.renew(CFG.googleClientId, function (v) { if (v && creds(email)) flush(); }); return; }
    var body = {}, sent = {};
    ids.forEach(function (id) { body[id] = S.words[id]; sent[id] = S.words[id][1]; });
    sending = true;
    post({ action: 'words.save', token: c.token, pass: c.pass, words: body }, leaving).then(function (j) {
      sending = false;
      if (me() !== email) return;
      var T = load();
      if (j && !j.ok && /^not on your teacher/.test(String(j.why || ''))) { T.off = email; save(T); paint(); return; }
      if (!j || !j.ok) { if (j && j.why === 'not signed in' && c.pass && SI.dropPass) SI.dropPass(c.pass); failed = true; paint(); later(30000); return; }
      /* a move made while this was out is newer: it stays waiting */
      Object.keys(sent).forEach(function (id) { if (T.words[id] && T.words[id][1] === sent[id]) delete T.dirty[id]; });
      T = adopt(T, j.words); T.skew = skewOf(j) || T.skew; save(T); failed = false; tellSaved(email); paint();
      if (Object.keys(T.dirty).length) later(1000);
    }).catch(function () { sending = false; failed = true; paint(); later(30000); });
  }
  /* as soon as the page knows who is signed in: their words from the records, so the glossary is ready when it opens; not
     again within 10 minutes unless Bio English Lab saved since (the list in this browser is already right) */
  var asking = false;
  function mine() {
    var email = me(); if (!CFG.submitUrl || !SI || !email || asking) return;
    var S0 = load(), k = said();
    if (S0.who === email && S0.at && Date.now() - S0.at < FRESH && !(k.who === email && k.by !== 'labs' && +k.t > S0.at)) return;
    var c = creds(email); if (!c) return;
    asking = true;
    post({ action: 'words.mine', token: c.token, pass: c.pass }).then(function (j) {
      asking = false;
      if (me() !== email || !j || !j.ok) return;
      var S = claim(load(), email);
      S.at = Date.now(); S.skew = skewOf(j);
      if (!j.onList) { S.off = email; save(S); paint(); return; }
      S.off = ''; S = adopt(S, j.words); S = adopt(S, j.moves);   /* part 3: the moves made on My assessments (the tracker) */
      /* a move this browser made that the records do not have yet goes to them */
      Object.keys(S.words).forEach(function (id) { var s = (j.words || {})[id]; if (!s || (+S.words[id][1] || 0) > (+s[1] || 0)) S.dirty[id] = 1; });
      save(S); paint();
      if (Object.keys(S.dirty).length) flush();
    }).catch(function () { asking = false; });
  }

  /* ---------- the glossary ---------- */
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function noteHtml() {
    var email = me(), S = load();
    var tail = !SI || !CFG.submitUrl ? '' : !email ? 'Sign in to keep your words on every computer.' : S.off === email ? 'You are not on a class list yet, so your words stay on this computer.' :
      failed && Object.keys(S.dirty).length ? 'Not saved yet: it will try again.' : 'Your words are saved for you on every computer.';
    return 'The words you mark <b class="mw-k mw-k--r">~ partly know</b> or <b class="mw-k mw-k--n">✕ do not know</b> become your own flashcards in ' +
      '<a href="' + LINK + '" target="_blank" rel="noopener">My words ↗</a>.' +
      (tail ? '<small>' + tail + '</small>' : '');
  }
  function paint() {
    var dlg = document.getElementById('glossDlg'); if (!dlg) return;
    var note = document.getElementById('mwNote');
    if (!note) {
      note = document.createElement('p'); note.className = 'mw-g__note'; note.id = 'mwNote';
      var sub = dlg.querySelector('.st-sub'), find = document.getElementById('glossFind');
      if (sub && sub.parentNode) sub.parentNode.insertBefore(note, sub.nextSibling);
      else if (find && find.parentNode) find.parentNode.insertBefore(note, find);
      else return;
    }
    note.innerHTML = noteHtml();
    var S = load(), list = document.getElementById('glossList'); if (!list) return;
    each(list.querySelectorAll('.gloss__row'), function (row) {
      var got = row.querySelector('.gloss__got'); if (!got) return;
      var term = got.getAttribute('data-got'), id = idOf(term), box = row.querySelector('.mw-g');
      if (!box) {
        box = document.createElement('span'); box.className = 'mw-g'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'How well do you know it?');
        /* the lab's own button and the two new ones in one row (the lab's button keeps its own code and look) */
        got.parentNode.insertBefore(box, got);
        box.appendChild(got);
        box.insertAdjacentHTML('beforeend', '<button type="button" class="mw-g__b" data-mw="r">~ I partly know this one</button><button type="button" class="mw-g__b" data-mw="n">✕ I do not know this one</button>');
      }
      var s = stateOf(S, id);
      each(box.querySelectorAll('.mw-g__b'), function (b) { b.setAttribute('aria-pressed', s === b.getAttribute('data-mw') ? 'true' : 'false'); });
      /* the word's colour: its My words answer, or green when the lab has stopped marking it */
      row.setAttribute('data-mw-state', s || (got.classList.contains('is-known') ? 'y' : ''));
    });
    syncNav();
  }

  /* ---------- the sections: a list to move between them, and what each one holds ---------- */
  var held = -1;   /* the section just chosen stays lit while it is in view, even if it is too short to reach the top */
  function scrollerOf(list) { return getComputedStyle(list).overflowY === 'auto' ? list : list.closest('.modal__box'); }
  function shape(list) {
    if (document.getElementById('mwNav')) return;
    var find = document.getElementById('glossFind'), lang = document.getElementById('glLang'), langNote = document.getElementById('glLangNote');
    var count = document.getElementById('glossCount'), known = document.getElementById('glossKnown');
    if (find && find.parentNode) {
      var tools = document.createElement('div'); tools.className = 'mw-tools';
      find.parentNode.insertBefore(tools, find); tools.appendChild(find);
      if (lang) tools.appendChild(lang);
      if (langNote) tools.appendChild(langNote);
    }
    if (count && known && count.parentNode === known.parentNode) {
      var meta = document.createElement('div'); meta.className = 'mw-meta';
      count.parentNode.insertBefore(meta, count); meta.appendChild(count); meta.appendChild(known);
    }
    var body = document.createElement('div'); body.className = 'mw-body';
    var nav = document.createElement('nav'); nav.id = 'mwNav'; nav.className = 'mw-nav'; nav.setAttribute('aria-label', 'Go to a section of the glossary');
    list.parentNode.insertBefore(body, list); body.appendChild(nav); body.appendChild(list);
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]'); if (!b) return;
      var i = +b.getAttribute('data-go'), g = list.querySelectorAll('.gloss__grp')[i]; if (!g) return;
      var sc = scrollerOf(list);
      sc.scrollTop += g.getBoundingClientRect().top - sc.getBoundingClientRect().top - (sc === list ? 0 : nav.offsetHeight + 4);
      held = i; spy();
    });
    list.addEventListener('scroll', spy, { passive: true });
    var box = list.closest('.modal__box'); if (box) box.addEventListener('scroll', spy, { passive: true });
    /* the lab's filter runs on the same event: read the rows after it */
    if (find) find.addEventListener('input', function () { setTimeout(function () { list.scrollTop = 0; held = -1; syncNav(); spy(); }, 0); });
  }
  function syncNav() {
    var list = document.getElementById('glossList'), nav = document.getElementById('mwNav'); if (!list || !nav) return;
    var groups = list.querySelectorAll('.gloss__grp');
    while (nav.children.length > groups.length) nav.removeChild(nav.lastChild);
    each(groups, function (g, i) {
      var b = nav.children[i];
      if (!b) {
        b = document.createElement('button'); b.type = 'button'; b.className = 'mw-nav__b'; b.setAttribute('data-go', i);
        b.innerHTML = '<span class="mw-nav__t"></span><span class="mw-nav__c"></span>'; nav.appendChild(b);
      }
      var h = g.querySelector('.gloss__h'); if (!h) return;
      var name = h.getAttribute('data-name');
      if (name == null) { name = h.textContent; h.setAttribute('data-name', name); h.insertAdjacentHTML('beforeend', '<span class="mw-h__n"></span>'); }
      g.classList.toggle('mw-sec--tap', name === 'The word you tapped');
      var n = 0, c = { y: 0, r: 0, n: 0 };
      each(g.querySelectorAll('.gloss__row:not([hidden])'), function (r) { n++; var st = r.getAttribute('data-mw-state'); if (c[st] != null) c[st]++; });
      h.querySelector('.mw-h__n').textContent = n + (n === 1 ? ' word' : ' words');
      b.hidden = !!g.hidden;
      b.querySelector('.mw-nav__t').textContent = name;
      b.querySelector('.mw-nav__c').innerHTML = [['y', '✓'], ['r', '~'], ['n', '✕']].map(function (k) { return c[k[0]] ? '<span class="mw-c--' + k[0] + '">' + k[1] + ' ' + c[k[0]] + '</span>' : ''; }).join('');
    });
    /* a search on a phone: the head folds, so the word is on the first screen. A word tapped in the text with no other
       match: the box is that word alone, with no list of sections beside it */
    var dlg = document.getElementById('glossDlg'), find = document.getElementById('glossFind');
    var seen = Array.prototype.filter.call(groups, function (g) { return !g.hidden; });
    dlg.classList.toggle('mw-focus', !!(find && find.value.trim()));
    dlg.classList.toggle('mw-one', seen.length === 1 && seen[0].classList.contains('mw-sec--tap'));
  }
  /* lights the section being read, and keeps its button in view in the list */
  function spy() {
    var list = document.getElementById('glossList'), nav = document.getElementById('mwNav'); if (!list || !nav) return;
    var sc = scrollerOf(list), R = sc.getBoundingClientRect(), top = R.top + (sc === list ? 0 : nav.offsetHeight) + 6, cur = -1, groups = list.querySelectorAll('.gloss__grp');
    each(groups, function (g, i) { if (!g.hidden && (cur < 0 || g.getBoundingClientRect().top <= top)) cur = i; });
    if (held >= 0) {
      var kept = groups[held], r = kept && kept.getBoundingClientRect();
      if (kept && !kept.hidden && r.top < R.bottom && r.bottom > top) cur = held; else held = -1;
    }
    each(nav.children, function (x, i) { if (i === cur) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
    var b = nav.children[cur]; if (!b) return;
    var nr = nav.getBoundingClientRect(), br = b.getBoundingClientRect();
    if (br.left < nr.left || br.right > nr.right) nav.scrollLeft += br.left - nr.left - 8;
    if (br.top < nr.top || br.bottom > nr.bottom) nav.scrollTop += br.top - nr.top - 8;
  }
  var quiet = false;   /* the lab's own button pressed by this file (to mark the word again): not the pupil's ✓ */
  function hook() {
    var list = document.getElementById('glossList'); if (!list) return;
    shape(list);
    /* the lab redraws the whole list each time the glossary opens: it opens at the top */
    new MutationObserver(function () { list.scrollTop = 0; held = -1; paint(); spy(); }).observe(list, { childList: true });
    list.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.gloss__see')) { list.scrollTop = 0; held = -1; syncNav(); spy(); return; }   /* See also: the lab has filtered the list */
      var got = e.target.closest && e.target.closest('.gloss__got');
      if (got) {
        if (quiet) return;
        /* the lab's own handler has run (it was added first): stopped marking = I know it; marking again = out of My words */
        var term = got.getAttribute('data-got'), known = !!(window.Terms && window.Terms.isKnown(term));
        setWord(idOf(term), known ? 'y' : 'x'); paint(); return;
      }
      var b = e.target.closest && e.target.closest('.mw-g__b'); if (!b) return;
      var row = b.closest('.gloss__row'), g = row && row.querySelector('.gloss__got'); if (!g) return;
      var t = g.getAttribute('data-got'), id = idOf(t), want = b.getAttribute('data-mw'), S = load();
      if (stateOf(S, id) === want) setWord(id, 'x');
      else {
        if (window.Terms && window.Terms.isKnown(t)) { quiet = true; try { g.click(); } finally { quiet = false; } }
        setWord(id, want);
      }
      paint();
    });
    paint();
  }
  addEventListener('pagehide', function () { flush(true); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); else mine(); });   /* back after a while: asked again if 10 minutes have passed */
  if (SI && SI.on) SI.on(function () { var email = me(); if (email) save(claim(load(), email)); paint(); mine(); flush(); });
  function start() { hook(); mine(); flush(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
