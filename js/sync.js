/* ============================================================
   sync.js — carrying a student's work between their devices, and keeping
   the record of it whole when they practise a station again.
   SHARED: labs-shared/engine/sync.js is the source; each lab's build copies it in.

   A lab keeps what a student has answered in their own browser, so a different
   computer starts from nothing. Signed in, the lab sends the work to the
   teacher's spreadsheet as it goes, and that is the only copy anywhere else —
   so every save also carries which questions were right, and signing in on
   another machine brings it back.

   THE SNAPSHOT

     station~sig:cccc|station~sig:cccc@2|…

   one character per question, in the order the questions appear:

     0  not touched        1  right, after more than one try
     t  tried, not right   f  right first time

   About 370 characters for a full Digestion Lab — well inside one cell.

   `sig` is the station's fingerprint, the same one the lab uses to notice a
   station has been rewritten. It is "<count>:<hash>", so it holds a colon of its
   own: a part is always split on its LAST colon. A snapshot is only applied to
   a station whose fingerprint still matches, so a student is never credited for
   a question that has since been replaced by a different one.

   GOES (September 2026, Daniel: "they have to be able to reset … but the teacher
   needs to be able to see the students have done the work")

   Practise again — one station, or Reset for them all — clears the PAGE, never
   the record. Each station keeps three records, all in the same letters:

     this go    what the page shows now. A station on its 2nd go or later carries
                "@<go>" after its letters. Old copies of this file read letters up
                to the number of questions only, so they never see the marker.
     first go   everything answered during go 1: frozen when go 2 starts
                (rec.g1). Right-first-time and the "needed several tries" flag
                come from here, so a redo can never make them look better.
     best ever  the best each question has ever been (rec.best, folded with the
                other two). What the student has achieved: the hub, homework and
                the teacher's Score read this.

   Since 7 Oct 2026 a new go no longer replaces the one before it: every round is kept,
   small (ROUNDS AND CHECKS, below), with the first go and the best as before.

   MERGING NEVER TAKES ANYTHING AWAY. Within one go, a question right on either
   device stays right. Between goes, the newer go is what the page shows, and the
   older one's answers still count for the first go and the best. The spreadsheet
   merges by the same rules (the labs script's `_snapMerge_` family).

   ROUNDS AND CHECKS (7 Oct 2026, Daniel: "round one should show how they did in
   round one, how they did in round two, in a summarised way"; "a total checks per
   question, no matter the number of rounds, and per round"; and keep it small)

   Each station keeps its FINISHED rounds in rec.r, one short token each:

     <letters>.<checks>[*<k>]   letters as above, one per question; checks one
                                character per question, base 36 (0-9 a-z; z = 35
                                or more); *k = k old rounds folded into one

   The round on the page now is rec.done / tried / one / per, as before. Round 1 is
   rec.r[0] once round 2 starts. A token may be '' (a round known to have happened
   whose answers this computer never saw: made on another computer, or before rounds
   were kept), its letters may be '' (".*6": six such rounds, folded), and its checks
   may be '' (not counted per question). At most ROUNDS_KEPT rounds are kept:
   round 1 always, then the newest; the ones squeezed out are folded together. A
   token's round is found by counting: round 1, then each token's k after it — never
   by its place in the list, which folding changes.
   rec.legacy: checks that no question can be given — made in rounds that finished
   before rounds were kept (the old rec.past), or beyond the 35 a character holds.
   rec.lr: the rounds the old rec.past was made in ([first, last]). When the records
   later give one of those rounds its checks question by question (a page of this
   code saved it while it was the round on the page, and old code in another tab
   then moved it on), those checks leave rec.legacy, so they are never counted twice.

   Checks now travel with the record (`rounds`), so a cleared browser or another
   computer picks up the count it had; each question keeps the larger count, so a
   count seen twice is counted once (two computers in the same round at the same
   time count as the larger of the two). A whole-lab Reset is counted on its own
   (resets), in this browser and, when it cannot keep anything, in memory.
   ============================================================ */
(function (global) {
  'use strict';

  var DONE = '1', FIRST = 'f', TRIED = 't', NONE = '0';
  var RANK = { '0': 0, 't': 1, '1': 2, 'f': 3 };

  /* ---------- letters ---------- */
  function goOf(rec) {
    var g = rec && Number(rec.go);
    return g > 1 && isFinite(g) ? Math.floor(g) : 1;
  }
  /* this go, as letters */
  function charsOf(rec, n) {
    var s = '';
    for (var i = 0; i < n; i++) {
      s += rec && rec.done && rec.done[i] ? (rec.one && rec.one[i] ? FIRST : DONE)
         : (rec && rec.tried && rec.tried[i] ? TRIED : NONE);
    }
    return s;
  }
  /* letters cut or padded to exactly n, anything that is not a letter read as untouched */
  function fit(s, n) {
    s = String(s || '');
    var out = '';
    for (var i = 0; i < n; i++) { var c = s.charAt(i); out += RANK[c] != null ? c : NONE; }
    return out;
  }
  /* question by question, whichever is further on */
  function best(a, b, n) {
    a = fit(a, n); b = fit(b, n);
    var out = '';
    for (var i = 0; i < n; i++) out += RANK[b.charAt(i)] > RANK[a.charAt(i)] ? b.charAt(i) : a.charAt(i);
    return out;
  }
  function any(s) { return /[^0]/.test(String(s || '')); }
  function right(c) { return c === DONE || c === FIRST; }

  /* ---------- rounds ---------- */
  var ROUNDS_KEPT = 10;
  var B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  function c36(v) { v = Math.floor(Number(v) || 0); return B36.charAt(v < 0 ? 0 : v > 35 ? 35 : v); }
  function n36(ch) { var i = B36.indexOf(String(ch || '').toLowerCase()); return i < 0 ? 0 : i; }
  /* this round's checks, one character per question */
  function checksOf(rec, n) {
    var per = (rec && rec.per) || {}, s = '';
    for (var i = 0; i < n; i++) s += c36(per[i]);
    return s;
  }
  function sum36(s) { var t = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) t += n36(s.charAt(i)); return t; }
  /* checks strings, question by question: the larger (one machine's count, seen twice) or the sum (two rounds folded) */
  function max36(a, b, n) { var o = ''; for (var i = 0; i < n; i++) o += c36(Math.max(n36(String(a || '').charAt(i)), n36(String(b || '').charAt(i)))); return o; }
  function add36(a, b, n) { var o = ''; for (var i = 0; i < n; i++) o += c36(n36(String(a || '').charAt(i)) + n36(String(b || '').charAt(i))); return o; }
  function readTok(t) {
    var m = String(t == null ? '' : t).match(/^([01tf]*)\.([0-9a-z]*)(?:\*(\d{1,4}))?$/);
    return m ? { l: m[1], c: m[2], k: m[3] ? Math.max(1, +m[3]) : 1, known: true } : { l: '', c: '', k: 1, known: false };
  }
  function tokOf(x) { return x.known ? x.l + '.' + x.c + (x.k > 1 ? '*' + x.k : '') : ''; }
  /* two copies of one round, question by question: the further letter, the larger count */
  function mergeTok(a, b, n) {
    var A = readTok(a), B = readTok(b);
    /* the records' copy, cut to this station's questions (a malformed one never counts past them) */
    if (!A.known) return B.known ? tokOf({ known: true, l: B.l ? fit(B.l, n) : '', c: B.c ? max36('', B.c, n) : '', k: B.k }) : '';
    if (!B.known) return tokOf(A);
    return tokOf({ known: true, l: (A.l || B.l) ? best(A.l, B.l, n) : '', c: (A.c || B.c) ? max36(A.c, B.c, n) : '', k: Math.max(A.k, B.k) });
  }
  /* How many rounds a list of finished rounds holds (a folded token is k of them), and where each token starts. */
  function span(list) { var t = 0; (list || []).forEach(function (x) { t += readTok(x).k; }); return t; }
  function starts(list) { var out = [], at = 1; (list || []).forEach(function (x) { out.push(at); at += readTok(x).k; }); return out; }
  /* Keep round 1 and the newest: the rounds in between are folded into one token, so a row never grows without end.
     A question's count past 35 (what one character holds) goes to rec.legacy, so the station's total loses nothing. */
  function cap(list, n, rec) {
    if (list.length <= ROUNDS_KEPT - 1) return list;
    var keepNew = ROUNDS_KEPT - 3, mid = list.slice(1, list.length - keepNew), f = null, over = 0;
    mid.forEach(function (t) {
      var x = readTok(t);
      if (!f) { f = { known: true, l: x.l ? fit(x.l, n) : '', c: x.c, k: x.k }; return; }
      if (x.c) for (var i = 0; i < n; i++) over += Math.max(0, n36(f.c.charAt(i)) + n36(x.c.charAt(i)) - 35);
      f.l = (f.l || x.l) ? best(f.l, x.l, n) : '';
      f.c = (f.c || x.c) ? add36(f.c, x.c, n) : '';
      f.k += x.k;
    });
    if (over && rec) rec.legacy = (Number(rec.legacy) || 0) + over;
    return [list[0], tokOf(f)].concat(list.slice(list.length - keepNew));
  }
  /* A record from before rounds were kept is brought up to date here, every time it is read: its earlier rounds
     become tokens (round 1 from rec.g1; the others are known to have happened, nothing more), and rec.past, the checks
     of earlier rounds that no question can be given, moves to rec.legacy. Safe to call again and again. */
  function upgrade(rec, n) {
    if (!rec) return rec;
    var g = goOf(rec);
    if (!Array.isArray(rec.r)) rec.r = [];
    var knew = span(rec.r);                              /* the rounds this code had already kept */
    if (g > 1 && !rec.r.length) rec.r.push(any(rec.g1) ? fit(rec.g1, n) + '.' : '');
    for (var i = 0, need = Math.min(g - 1 - span(rec.r), 10000); i < need; i++) rec.r.push('');
    if (Number(rec.past) > 0) {
      rec.legacy = (Number(rec.legacy) || 0) + Number(rec.past); rec.past = 0;
      var lo = knew + 1, hi = g - 1;                     /* the rounds old code moved on, here */
      if (lo <= hi) rec.lr = Array.isArray(rec.lr) ? [Math.min(+rec.lr[0] || lo, lo), Math.max(+rec.lr[1] || hi, hi)] : [lo, hi];
    }
    rec.r = cap(rec.r, n, rec);                          /* folded as advance() folds, so both ends line up */
    return rec;
  }
  /* Every round of one station, oldest first, the round on the page last: [{ l, c, k, known, now }]. */
  function roundsOf(rec, n) {
    upgrade(rec, n);
    var out = (rec.r || []).map(function (t) { var x = readTok(t); x.l = x.l ? fit(x.l, n) : ''; return x; });
    out.push({ l: charsOf(rec, n), c: checksOf(rec, n), k: 1, known: true, now: true });
    return out;
  }
  /* Checks made at each question in every round, added up (a token's checks are already per question). */
  function questionChecks(rec, n) {
    var t = [], i;
    for (i = 0; i < n; i++) t.push(0);
    roundsOf(rec, n).forEach(function (x) { for (i = 0; i < n; i++) t[i] += n36(x.c.charAt(i)); });
    return t;
  }

  /* The three records of one station, as letters of length n. */
  function records(rec, n) {
    var here = charsOf(rec, n), g = goOf(rec);
    var first = g === 1 ? here : fit(rec && rec.g1, n);
    return { go: g, here: here, first: first, best: best(best(here, first, n), rec && rec.best, n) };
  }

  /* The numbers a lab shows and sends, for one station.
       done / tried       this go            (the Practise tab, the ticks on the questions)
       bestDone / bestTried   best ever       (the header, the rail, the hub, the teacher's Score)
       firstRight         right first time on the first go
       firstTried         answered at all on the first go
       checks             every Check pressed on this machine, all goes together */
  /* (checks: every Check pressed, every round: this browser's own, with what the records hold of other computers and
     earlier rounds, each round and question at its larger count) */
  function counts(rec, n) {
    var r = records(rec, n), o = { go: r.go, done: 0, tried: 0, bestDone: 0, bestTried: 0, firstRight: 0, firstTried: 0, checks: 0 };
    for (var i = 0; i < n; i++) {
      var h = r.here.charAt(i), b = r.best.charAt(i), f = r.first.charAt(i);
      if (right(h)) o.done++;
      if (h !== NONE) o.tried++;
      if (right(b)) o.bestDone++;
      if (b !== NONE) o.bestTried++;
      if (f === FIRST) o.firstRight++;
      if (f !== NONE) o.firstTried++;
    }
    var per = (rec && rec.per) || {};
    Object.keys(per).forEach(function (k) { if (+k < n) o.checks += Number(per[k]) || 0; });
    if (rec) {
      upgrade(rec, n);
      rec.r.forEach(function (t) { o.checks += sum36(readTok(t).c); });
      o.checks += (Number(rec.legacy) || 0) + (Number(rec.past) || 0);
    }
    return o;
  }

  /* ---------- write ---------- */
  function each(progress, stations, order, sigOf, fn) {
    var out = [];
    (order || []).forEach(function (id) {
      var st = stations[id]; if (!st) return;
      var rec = progress[id];
      if (!rec) return;                                  /* never opened: say nothing about it */
      var n = (st.activities || []).length;
      var part = fn(rec, n);
      if (part == null) return;
      out.push(id + '~' + (sigOf ? sigOf(st) : '') + ':' + part);
    });
    return out.join('|');
  }
  /* THIS GO. A station on go 2 or later is sent even with nothing answered yet: that is how
     the records — and the student's other computers — learn the station was started again. */
  function snapshot(progress, stations, order, sigOf) {
    return each(progress, stations, order, sigOf, function (rec, n) {
      var s = charsOf(rec, n), g = goOf(rec);
      if (g === 1) return any(s) ? s : null;             /* nothing to say about this station */
      return s + '@' + g;
    });
  }
  /* FIRST GO */
  function firstSnapshot(progress, stations, order, sigOf) {
    return each(progress, stations, order, sigOf, function (rec, n) {
      var f = records(rec, n).first; return any(f) ? f : null;
    });
  }
  /* BEST EVER */
  function bestSnapshot(progress, stations, order, sigOf) {
    return each(progress, stations, order, sigOf, function (rec, n) {
      var b = records(rec, n).best; return any(b) ? b : null;
    });
  }

  /* EVERY ROUND, for the records: "+<legacy>" first when there are such checks, then each finished round, then the
     round on the page. A station with nothing in any round says nothing. */
  function roundsSnapshot(progress, stations, order, sigOf) {
    return each(progress, stations, order, sigOf, function (rec, n) {
      var all = roundsOf(rec, n), leg = Number(rec.legacy) || 0;
      var anything = leg > 0 || all.length > 1 || any(all[0].l) || /[^0]/.test(all[0].c);
      if (!anything) return null;
      return (leg > 0 ? ['+' + Math.min(leg, 9999999)] : []).concat(all.map(function (x) { return x.now ? x.l + '.' + x.c : tokOf(x); })).join(';');
    });
  }
  /* [{ id, sig, legacy, rounds }], in the order given. The records may hold a station twice, once for each fingerprint
     it has had; a page only ever uses the one that is its own. */
  function parseRounds(str) {
    var out = [];
    String(str || '').split('|').forEach(function (part) {
      if (!part || part.charAt(0) === '#') return;       /* "#<resets>": the records' own count, sent apart */
      var colon = part.lastIndexOf(':'); if (colon < 0) return;
      var head = part.slice(0, colon), tail = part.slice(colon + 1);
      var tilde = head.indexOf('~'), id = tilde < 0 ? head : head.slice(0, tilde);
      if (!id || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(id)) return;
      var o = { id: id, sig: tilde < 0 ? '' : head.slice(tilde + 1), legacy: 0, rounds: [] };
      tail.split(';').forEach(function (t) {
        if (/^\+\d+$/.test(t)) { o.legacy = Math.max(o.legacy, Math.min(+t.slice(1), 9999999)); return; }
        if (/^\^\d+$/.test(t)) return;                     /* the records' own floor: not the page's business */
        o.rounds.push(readTok(t).known ? t : '');
      });
      out.push(o);
    });
    return out;
  }
  /* Fold the records' rounds into this browser, after merge() has moved each station to the records' round: the finished
     rounds question by question, the checks of the round on the page by the larger count. Adds only. */
  function mergeRounds(progress, str, stations, sigOf) {
    var changed = 0;
    parseRounds(str).forEach(function (want) {
      var st = stations[want.id]; if (!st) return;
      var sig = sigOf ? sigOf(st) : '';
      if (want.sig && sig && want.sig !== sig) return;   /* rewritten since: those rounds were other questions */
      var n = (st.activities || []).length, rec = progress[want.id];
      if (!rec) return;                                  /* merge() makes the station when the records have letters */
      upgrade(rec, n);
      var before = JSON.stringify([rec.r, rec.per || {}, rec.legacy || 0]);
      var g = goOf(rec), mine = starts(rec.r), at = 1;
      /* each of the records' rounds, found here by its round number */
      var filled = 0, lr = Array.isArray(rec.lr) ? rec.lr : null;
      want.rounds.forEach(function (t) {
        var x = readTok(t), a = at; at += x.k;
        if (a === g && x.k === 1) {                      /* the round on the page: its checks, by the larger count */
          rec.per = rec.per || {};
          for (var q = 0; q < n; q++) { var v = n36(x.c.charAt(q)); if (v > (Number(rec.per[q]) || 0)) rec.per[q] = v; }
          return;
        }
        if (a + x.k - 1 >= g) return;                    /* a round this page has not reached */
        for (var j = 0; j < mine.length; j++) {          /* the same rounds, kept the same way here: never a part of a fold */
          if (mine[j] === a && readTok(rec.r[j]).k === x.k) {
            var had = readTok(rec.r[j]);
            rec.r[j] = mergeTok(rec.r[j], t, n);
            /* checks by question for rounds whose checks this browser kept only as a number (rec.legacy, from old code):
               the same checks, so they leave rec.legacy (7 Oct 2026, the second audit: they were counted twice) */
            if (!had.c && x.c && lr && a <= lr[1] && a + x.k - 1 >= lr[0]) filled += sum36(x.c);
            return;
          }
        }
      });
      if (want.legacy > (Number(rec.legacy) || 0)) rec.legacy = want.legacy;
      if (filled && Number(rec.legacy) > 0) rec.legacy = Math.max(0, Number(rec.legacy) - filled);
      if (JSON.stringify([rec.r, rec.per || {}, rec.legacy || 0]) !== before) changed++;
    });
    return changed;
  }
  /* Whole-lab resets, kept in this browser under `key` (a lab's own name), and the larger of two counts after a pull */
  var heldResets = {};                                   /* when this browser keeps nothing (site data blocked) */
  function resets(key, add, atLeast) {
    var k = key + '.resets', v = heldResets[k] || 0;
    try { v = Math.max(v, parseInt(localStorage.getItem(k), 10) || 0); } catch (e) {}
    var w = Math.min(999, Math.max(v + (add ? 1 : 0), Math.floor(Number(atLeast) || 0)));
    heldResets[k] = w;
    if (w !== v) { try { localStorage.setItem(k, String(w)); } catch (e) {} }
    return w;
  }
  /* another pupil signs in on this computer: the last one's count goes with their work */
  function clearResets(key) {
    var k = key + '.resets';
    delete heldResets[k];
    try { localStorage.removeItem(k); } catch (e) {}
  }

  /* ---------- read ---------- */
  function parse(snap) {
    var out = {};
    String(snap || '').split('|').forEach(function (part) {
      if (!part) return;
      /* The fingerprint itself contains a colon — it is "<count>:<hash>" — so the split is on
         the LAST one. Splitting on the first quietly produced a sig of "9" and a run of
         characters beginning "x:", which matched nothing and restored nothing, in silence. */
      var colon = part.lastIndexOf(':'); if (colon < 0) return;
      var head = part.slice(0, colon), tail = part.slice(colon + 1);
      var m = tail.match(/^([01tf]*)(?:@(\d{1,4}))?$/);
      if (!m) return;                                    /* not something this file wrote */
      var tilde = head.indexOf('~'), id = tilde < 0 ? head : head.slice(0, tilde);
      if (!id) return;
      var go = m[2] ? Math.max(1, parseInt(m[2], 10)) : 1;
      out[id] = { sig: tilde < 0 ? '' : head.slice(tilde + 1), chars: m[1], go: go };
    });
    return out;
  }

  /* A station moves on to a new go: the page empties, the record does not. Used by Practise
     again and Reset (newGo) and when the records show another computer already moved on. */
  function advance(rec, n, go) {
    upgrade(rec, n);
    var r = records(rec, n), c = checksOf(rec, n), per = rec.per || {};
    if (r.go === 1) rec.g1 = r.here;                     /* the first go is frozen as it stands */
    rec.best = r.best;
    /* the round that ends is kept, small: its letters and its checks at each question (7 Oct 2026); a round this
       computer saw nothing of (another computer moved the station on) is known to have happened, nothing more */
    rec.r.push(any(r.here) || /[^0]/.test(c) ? r.here + '.' + c : '');
    for (var i = 0; i < n; i++) if ((Number(per[i]) || 0) > 35) rec.legacy = (Number(rec.legacy) || 0) + Number(per[i]) - 35;
    var to = Math.max(go || 0, r.go + 1);
    while (span(rec.r) < to - 1) rec.r.push('');        /* rounds made on another computer: they happened */
    rec.r = cap(rec.r, n, rec);
    rec.done = {}; rec.tried = {}; rec.per = {}; rec.one = {};
    rec.go = to;
  }
  /* Practise again. Only a station with something answered in this go moves on — pressing it
     twice does not make a go of nothing. Returns whether it did. */
  function newGo(progress, id, stations) {
    var st = stations[id], rec = progress[id];
    if (!st || !rec) return false;
    var n = (st.activities || []).length;
    if (!any(charsOf(rec, n))) return false;
    advance(rec, n);
    return true;
  }

  /* Fold THIS GO from the records into this browser. Returns what it changed, so the student
     can be told plainly rather than watching numbers move on their own. */
  function merge(progress, snap, stations, sigOf) {
    var got = parse(snap), added = 0, touched = 0, skipped = [], newer = 0;
    Object.keys(got).forEach(function (id) {
      var st = stations[id]; if (!st) return;            /* a station this lab no longer has */
      var want = got[id];
      var sig = sigOf ? sigOf(st) : '';
      if (want.sig && sig && want.sig !== sig) { skipped.push(id); return; }   /* rewritten since */

      var rec = progress[id] || (progress[id] = { done: {}, tried: {}, sig: sig });
      rec.done = rec.done || {}; rec.tried = rec.tried || {};
      var n = (st.activities || []).length, i;
      var here = goOf(rec);
      if (want.go < here) {
        /* the records hold an older go than this browser: nothing of it belongs on the page, but its
           answers still count for the best. NEVER for the first go: letters that arrive as "go 1"
           cannot be told apart from later-go letters an older script or an older page merged into
           one go, and a redo must never make the first go look better. The first go travels on its
           own (mergeFirst), only from records that know what a go is. */
        rec.best = best(rec.best, want.chars, n);
        rec.sig = sig || rec.sig;
        return;
      }
      if (want.go > here) {                               /* started again on another computer */
        advance(rec, n, want.go);
        newer++;
      }
      var before = 0;
      for (i = 0; i < n; i++) if (rec.done[i]) before++;
      for (i = 0; i < n && i < want.chars.length; i++) {
        var c = want.chars.charAt(i);
        if (c === NONE) continue;
        rec.tried[i] = true;
        if (c === DONE || c === FIRST) {
          rec.done[i] = true;
          if (c === FIRST && !(rec.per && rec.per[i] > 1)) { rec.one = rec.one || {}; rec.one[i] = true; }
        }
      }
      var after = 0;
      for (i = 0; i < n; i++) if (rec.done[i]) after++;
      if (after > before) { added += after - before; touched++; }
      rec.sig = sig || rec.sig;
    });
    return { added: added, stations: touched, skipped: skipped, newer: newer };
  }

  /* Fold the records' FIRST GO or BEST EVER into this browser. Adds only; never touches the page
     (this go). A first go can only be told apart once a station has moved past go 1 — before
     that, the first go IS this go, which merge() has already brought back. */
  function mergeInto(which, progress, snap, stations, sigOf) {
    var got = parse(snap), changed = 0;
    Object.keys(got).forEach(function (id) {
      var st = stations[id]; if (!st) return;
      var want = got[id], sig = sigOf ? sigOf(st) : '';
      if (want.sig && sig && want.sig !== sig) return;
      var n = (st.activities || []).length;
      var rec = progress[id] || (progress[id] = { done: {}, tried: {}, sig: sig });
      var field = which === 'first' ? 'g1' : 'best';
      if (which === 'first' && goOf(rec) === 1) {
        /* go 1 here: the records' first go is more of this same go */
        rec.best = best(rec.best, want.chars, n);
        return;
      }
      var was = fit(rec[field], n), now = best(was, want.chars, n);
      if (now !== was) { rec[field] = now; changed++; }
      rec.sig = sig || rec.sig;
    });
    return changed;
  }
  function mergeFirst(progress, snap, stations, sigOf) { return mergeInto('first', progress, snap, stations, sigOf); }
  function mergeBest(progress, snap, stations, sigOf) { return mergeInto('best', progress, snap, stations, sigOf); }

  /* A sentence a student can act on. */
  function say(res) {
    if (!res) return '';
    /* true whether or not the new round has answers yet (those are counted in "Brought back") */
    var again = res.newer ? ' ' + res.newer + ' station' + (res.newer === 1 ? ' was' : 's were') +
      ' started again on another computer, so ' + (res.newer === 1 ? 'it is on its' : 'they are on their') + ' new round here too.' : '';
    /* stations rewritten since the answers were saved are left alone — never "up to date" when some were */
    var left = res.skipped && res.skipped.length ? res.skipped.length + ' station' +
      (res.skipped.length === 1 ? ' has' : 's have') + ' changed since your answers were saved, so ' +
      (res.skipped.length === 1 ? 'it was' : 'they were') + ' left alone.' : '';
    if (!res.added) return left ? 'Nothing new to bring back. ' + left + again
                                : again ? 'Your record is back.' + again : 'Nothing new to bring back — this computer is already up to date.';
    return 'Brought back ' + res.added + ' answer' + (res.added === 1 ? '' : 's') +
           ' across ' + res.stations + ' station' + (res.stations === 1 ? '' : 's') + '.' +
           (res.skipped.length ? ' ' + res.skipped.length + ' station' +
             (res.skipped.length === 1 ? ' has' : 's have') + ' changed since, so ' +
             (res.skipped.length === 1 ? 'it was' : 'they were') + ' left alone.' : '') + again;
  }

  global.LabSync = { snapshot: snapshot, firstSnapshot: firstSnapshot, bestSnapshot: bestSnapshot,
                     parse: parse, merge: merge, mergeFirst: mergeFirst, mergeBest: mergeBest,
                     newGo: newGo, counts: counts, records: records, goOf: goOf, say: say,
                     /* rounds and checks (7 Oct 2026) */
                     roundsSnapshot: roundsSnapshot, parseRounds: parseRounds, mergeRounds: mergeRounds,
                     roundsOf: roundsOf, questionChecks: questionChecks, upgrade: upgrade, resets: resets, clearResets: clearResets,
                     ROUNDS_KEPT: ROUNDS_KEPT };
})(this);
