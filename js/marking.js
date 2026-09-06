/* ============================================================
   marking.js — marks answers without holding them. SHARED: the copy in
   labs-shared/engine/ is the source; each lab's build copies it in.

   Each question ships a salted SHA-256 hash of its correct answer. Types: blank, mcq,
   order, match, sort, drag, ph, grid, hotspot.
   We hash what the student did and compare. A wrong answer can be
   reported as wrong; a right answer cannot be read out of the file.

   The answers themselves are not in the site at all — there is no mode
   that shows them, so nothing here can produce one. A student is told
   which parts are wrong and works out the rest.

   The canonical forms below must stay byte-identical to tools/build.mjs.
   ============================================================ */
(function (global) {
  'use strict';

  var enc = new TextEncoder();

  function hex(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
    return s;
  }
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().trim()
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ').replace(/[.,;:!?]+$/, '').replace(/^(the|a|an)\s+/, '');
  }
  function H(parts) {
    var msg = (global.ANSWER_SALT || '') + '|' + parts.join('|');
    return crypto.subtle.digest('SHA-256', enc.encode(msg)).then(function (d) {
      return hex(d).slice(0, 32);
    });
  }

  /* ---------- canonical response for each type ---------- */
  function canon(a, id, r) {
    switch (a.type) {
      case 'mcq':   return H([id, 'mcq', r.slice().sort(function (x, y) { return x - y; }).join(',')]);
      case 'order': return H([id, 'order', r.join('~')]);
      case 'match': return H([id, 'match', r.map(function (p) { return p.join('-'); }).sort().join(',')]);
      case 'sort':  return H([id, 'sort', r.map(function (p) { return norm(p[0]) + '=' + p[1]; }).sort().join(',')]);
      case 'drag':  return H([id, 'drag', r.map(function (t, j) { return j + '=' + norm(t); }).join(',')]);
      /* The slider moves in half units, and an optimum like amylase's 6.8 does
         not sit on that grid. Snap before hashing so marking never depends on
         how the value happened to arrive. */
      case 'ph':    return H([id, 'ph', (Math.round(Number(r) * 2) / 2).toFixed(1)]);
      /* hotspots on a picture: the response is the ids of the regions clicked */
      case 'hotspot': return H([id, 'hotspot', r.slice().sort().join(',')]);
    }
    return Promise.resolve('');
  }

  /* Returns {correct, score, total, gaps?} — never the answer itself. */
  function check(a, id, response) {
    if (a.type === 'blank') {
      var keys = Object.keys(a.k);
      return Promise.all(keys.map(function (g) {
        return H([id, 'g' + g, norm(response[g])]).then(function (h) {
          return a.k[g].indexOf(h) >= 0;
        });
      })).then(function (oks) {
        var right = oks.filter(Boolean).length, gaps = {};
        keys.forEach(function (g, i) { gaps[g] = oks[i]; });
        return { correct: right === keys.length, score: right, total: keys.length, gaps: gaps };
      });
    }
    /* A grid of ticks is marked row by row, like the gaps of a cloze: the response is
       {row: [ticked column indexes]}, and each row's ticks are hashed against its own key,
       so a wrong row can be named without any row being corrected. */
    if (a.type === 'grid') {
      var rows = Object.keys(a.k);
      return Promise.all(rows.map(function (r) {
        var ticked = (response[r] || []).slice().sort(function (x, y) { return x - y; }).join(',');
        return H([id, 'grid', String(r), ticked]).then(function (h) { return h === a.k[r]; });
      })).then(function (oks) {
        var right = oks.filter(Boolean).length, gaps = {};
        rows.forEach(function (r, i) { gaps[r] = oks[i]; });
        return { correct: right === rows.length, score: right, total: rows.length, gaps: gaps };
      });
    }
    if (a.type === 'ph') {
      return canon(a, id, response).then(function (h) {
        var ok = a.k.indexOf(h) >= 0;
        return { correct: ok, score: ok ? 1 : 0, total: 1 };
      });
    }
    return canon(a, id, response).then(function (h) {
      var ok = h === a.k;
      return { correct: ok, score: ok ? 1 : 0, total: 1 };
    });
  }

  global.Marking = { check: check, norm: norm };
})(window);
