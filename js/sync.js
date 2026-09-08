/* ============================================================
   sync.js — carrying a student's work between their devices.
   SHARED: labs-shared/engine/sync.js is the source; each lab's build copies it in.

   A lab keeps what a student has answered in their own browser, so a different
   computer starts from nothing. What they HAND IN goes to the teacher's
   spreadsheet, and that is the only copy anywhere else — so a hand-in also
   carries a snapshot of which questions were right, and signing in on another
   machine brings it back.

   THE SNAPSHOT

     station~sig:cccc|station~sig:cccc|…

   one character per question, in the order the questions appear:

     0  not touched        1  right, after more than one try
     t  tried, not right   f  right first time

   About 370 characters for a full Digestion Lab — well inside one cell.

   `sig` is the station's fingerprint, the same one the lab uses to notice a
   station has been rewritten. A snapshot is only applied to a station whose
   fingerprint still matches, so a student is never credited for a question
   that has since been replaced by a different one.

   MERGING NEVER TAKES ANYTHING AWAY. A question right on either device stays
   right. Pressing Sync can only ever move a student forward, so there is no
   way to lose work by pressing it.

   What is deliberately NOT carried: how many times they pressed Check. That is
   a count of work done on one machine, and adding two machines' counts together
   would say something untrue.
   ============================================================ */
(function (global) {
  'use strict';

  var DONE = '1', FIRST = 'f', TRIED = 't', NONE = '0';

  /* ---------- write ---------- */
  function snapshot(progress, stations, order, sigOf) {
    var out = [];
    (order || []).forEach(function (id) {
      var st = stations[id]; if (!st) return;
      var n = (st.activities || []).length;
      var rec = progress[id];
      if (!rec) return;                                  /* never opened: say nothing about it */
      var s = '';
      for (var i = 0; i < n; i++) {
        s += rec.done && rec.done[i] ? (rec.one && rec.one[i] ? FIRST : DONE)
           : (rec.tried && rec.tried[i] ? TRIED : NONE);
      }
      if (!/[^0]/.test(s)) return;                       /* nothing to say about this station */
      out.push(id + '~' + (sigOf ? sigOf(st) : '') + ':' + s);
    });
    return out.join('|');
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
      var head = part.slice(0, colon), chars = part.slice(colon + 1);
      var tilde = head.indexOf('~');
      out[tilde < 0 ? head : head.slice(0, tilde)] =
        { sig: tilde < 0 ? '' : head.slice(tilde + 1), chars: chars };
    });
    return out;
  }

  /* Fold a snapshot into a progress record. Adds only. Returns what it changed, so the
     student can be told plainly rather than watching numbers move on their own. */
  function merge(progress, snap, stations, sigOf) {
    var got = parse(snap), added = 0, touched = 0, skipped = [];
    Object.keys(got).forEach(function (id) {
      var st = stations[id]; if (!st) return;            /* a station this lab no longer has */
      var want = got[id];
      var sig = sigOf ? sigOf(st) : '';
      if (want.sig && sig && want.sig !== sig) { skipped.push(id); return; }   /* rewritten since */

      var rec = progress[id] || (progress[id] = { done: {}, tried: {}, sig: sig });
      rec.done = rec.done || {}; rec.tried = rec.tried || {};
      var n = (st.activities || []).length, before = 0, i;
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
    return { added: added, stations: touched, skipped: skipped };
  }

  /* A sentence a student can act on. */
  function say(res) {
    if (!res) return '';
    if (!res.added) return 'Nothing new to bring back — this computer is already up to date.';
    return 'Brought back ' + res.added + ' answer' + (res.added === 1 ? '' : 's') +
           ' across ' + res.stations + ' station' + (res.stations === 1 ? '' : 's') + '.' +
           (res.skipped.length ? ' ' + res.skipped.length + ' station' +
             (res.skipped.length === 1 ? ' has' : 's have') + ' changed since, so ' +
             (res.skipped.length === 1 ? 'it was' : 'they were') + ' left alone.' : '');
  }

  global.LabSync = { snapshot: snapshot, parse: parse, merge: merge, say: say };
})(this);
