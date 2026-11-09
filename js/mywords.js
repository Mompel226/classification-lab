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
   { who, t, by }: each side writes it after a save, the other reads it). Times use the server's clock (S.skew). */
(function () {
  'use strict';
  var CFG = window.LAB_CONFIG || {}, SI = window.SignIn || null, IDS = window.MW_IDS || {};
  var KEY = 'biology.mywords', LINK = '../bio-english-lab/#/my', SAID = 'biology.mywords.saved', FRESH = 10 * 60 * 1000;
  var LAB = (location.pathname.split('/').filter(function (p) { return /-lab$/.test(p); }).pop()) || 'lab';
  var CSS = '.mw-g__note{margin:8px 0 0;padding:7px 11px;font-size:13px;line-height:1.45;color:var(--ink);background:var(--accent-tint,var(--green-tint,rgba(0,0,0,.04)));border-radius:var(--r-sm,6px)}' +
    '.mw-g__note a{font-weight:600;color:var(--accent,var(--green));white-space:nowrap}' +
    '.mw-g__note small{display:block;margin-top:2px;font-size:12px;color:var(--grey)}' +
    '.gloss__got:hover,.gloss__got:focus-visible{background:var(--accent-tint,var(--green-tint,rgba(0,0,0,.04)))}' +
    '.mw-g{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.mw-g .gloss__got{margin:0}' +
    '.mw-g__b{font:inherit;font-size:12.5px;cursor:pointer;color:var(--grey);background:none;border:1px dashed var(--edge);border-radius:var(--r-pill,999px);padding:2px 10px;line-height:inherit}' +
    '.mw-g__b:hover,.mw-g__b:focus-visible{color:var(--ink);border-color:var(--ink);border-style:solid}' +
    '.mw-g__b[aria-pressed="true"]{color:var(--ink);border-style:solid;border-color:var(--ink);font-weight:600;background:var(--edge)}' +
    '.mw-g__b:focus-visible{outline:2px solid var(--accent,var(--green));outline-offset:1px}';
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
    return 'The words you mark <b>~ partly know</b> or <b>✕ do not know</b> become your own flashcards in ' +
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
    });
  }
  var quiet = false;   /* the lab's own button pressed by this file (to mark the word again): not the pupil's ✓ */
  function hook() {
    var list = document.getElementById('glossList'); if (!list) return;
    new MutationObserver(function () { paint(); }).observe(list, { childList: true });
    list.addEventListener('click', function (e) {
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
