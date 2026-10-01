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

   A new go replaces the one before it; only the first go and the best stay, so
   nothing grows however often a student starts again.

   MERGING NEVER TAKES ANYTHING AWAY. Within one go, a question right on either
   device stays right. Between goes, the newer go is what the page shows, and the
   older one's answers still count for the first go and the best. The spreadsheet
   merges by the same rules (the labs script's `_snapMerge_` family).

   What is deliberately NOT carried: how many times they pressed Check. That is
   a count of work done on one machine, and adding two machines' counts together
   would say something untrue. (rec.past — checks made in earlier goes — stays on
   the machine that made them, like rec.per.)
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
    o.checks += Number(rec && rec.past) || 0;
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
    var r = records(rec, n);
    if (r.go === 1) rec.g1 = r.here;                     /* the first go is frozen as it stands */
    rec.best = r.best;
    var per = rec.per || {}, c = 0;
    Object.keys(per).forEach(function (k) { if (+k < n) c += Number(per[k]) || 0; });
    rec.past = (Number(rec.past) || 0) + c;
    rec.done = {}; rec.tried = {}; rec.per = {}; rec.one = {};
    rec.go = Math.max(go || 0, r.go + 1);
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
                     newGo: newGo, counts: counts, records: records, goOf: goOf, say: say };
})(this);
