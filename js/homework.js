/* ============================================================
   homework.js — the homework a signed-in pupil has in THIS lab: coloured on the
   lab's row of stations, and a short note when they open the lab.
   SHARED: labs-shared/engine/homework.js is the source; each lab's build copies it in.

   Daniel, 29 Sep 2026: "as the students logged in, the tabs that they need to do as
   homework are shown with a different colour: red if not started, orange if partially
   completed, and green if everything is completed … when they go into a lab a pop-up
   message could appear on their window saying you have these tabs pending as homework".

   WHERE IT COMES FROM
   The labs script answers `progress` (the call every lab already makes when a pupil
   signs in) with `homework`: the pupil's own open homework, each station scored on the
   spreadsheet by the teacher's own rule (the script's _hwScoreOne_, which the Set
   homework page uses). A script from before sends no `homework`: then nothing here
   shows, and the lab is exactly as it was.

   THE RULE — the same as the teacher's page, so the two never disagree:
     done     every question in the station answered right (the best ever)
     partly   at least one answered right
     none     none yet
   The page takes the larger of the spreadsheet's count and its own best ever, so work
   done since the last save (two minutes at most) shows at once. Both only ever rise.

   HOW A LAB USES IT (three short hooks in its js/app.js)
     LabHomework.init({ lab, score(id) → {done,total}, name(id), open(id), repaint() })
     LabHomework.take(answer.homework, email)   after the `progress` answer arrives
     LabHomework.mark(button, id, done, total)  in paintRail, for each station button
   Signing out, or another account signing in, clears it (init listens to SignIn itself).

   THE NOTE: "You have homework in this lab", the stations still to do (each opens its
   station) and a one-line key to the colours. One press closes it. It shows at most once
   a day for each lab and account (localStorage "<lab>.hwSeen"), and only when something
   in this lab is still to do.
   ============================================================ */
(function (global) {
  'use strict';

  var WORDS = { none: 'not started', partly: 'part done', done: 'done' };

  /* the teacher's rule for one station (the labs script's _hwScoreOne_ gives the same state) */
  function stateOf(done, total) {
    done = +done || 0; total = +total || 0;
    return (total && done >= total) ? 'done' : (done > 0 ? 'partly' : 'none');
  }

  /* This lab's part of the answer: each homework with the stations it sets HERE. Anything
     that is not the right shape is left out, never trusted. */
  function forLab(list, labId) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (hw) {
      if (!hw || typeof hw !== 'object') return;
      var st = (Array.isArray(hw.stations) ? hw.stations : []).filter(function (s) {
        return s && typeof s === 'object' && s.lab === labId && s.id;
      }).map(function (s) {
        return { id: String(s.id), name: String(s.name || s.id),
                 done: Math.max(0, +s.done || 0), total: Math.max(0, +s.total || 0) };
      });
      if (st.length) out.push({ id: String(hw.id || ''), title: String(hw.title || ''), due: String(hw.due || ''),
                                overdue: !!hw.overdue, stations: st });
    });
    return out;
  }

  /* One station: the spreadsheet's count or this page's best ever, whichever is larger, out of
     the published total (the teacher's), or the page's own when none came. */
  function merge(server, local) {
    var total = (server && +server.total) || (local && +local.total) || 0;
    var done = Math.max((server && +server.done) || 0, (local && +local.done) || 0);
    if (total) done = Math.min(done, total);
    return { done: done, total: total, state: stateOf(done, total) };
  }

  /* ---------- what this page holds ---------- */
  var cfg = null, list = [], owner = '';

  function call(fn, a) { try { return fn ? fn(a) : null; } catch (e) { return null; } }
  function station(id) {
    for (var i = 0; i < list.length; i++)
      for (var j = 0; j < list[i].stations.length; j++) if (list[i].stations[j].id === id) return list[i].stations[j];
    return null;
  }
  /* each homework station here, as it stands now: [{ id, name, done, total, state }] in the order set */
  function stations() {
    var out = [], seen = {};
    list.forEach(function (hw) {
      hw.stations.forEach(function (s) {
        if (seen[s.id]) return; seen[s.id] = 1;
        var m = merge(s, cfg ? call(cfg.score, s.id) : null);
        out.push({ id: s.id, name: (cfg && call(cfg.name, s.id)) || s.name, done: m.done, total: m.total, state: m.state });
      });
    });
    return out;
  }

  var hooked = false;
  function init(o) {
    cfg = o || null;
    css();
    /* signed out, or another account signed in (here or in another tab of the site): that pupil's homework goes */
    if (!hooked && global.SignIn && typeof global.SignIn.on === 'function') {
      hooked = true;
      global.SignIn.on(function (v) { if (!v || (owner && v.email !== owner)) clear(); });
    }
  }

  /* the `progress` answer's homework (null or missing: nothing), for the account signed in */
  function take(hw, email) {
    list = cfg ? forLab(hw, cfg.lab) : [];
    owner = list.length ? String(email || '') : '';
    if (cfg) call(cfg.repaint);
    if (list.length) popup(false);
  }
  function clear() {
    if (!list.length) return;
    list = []; owner = '';
    closePopup();
    if (cfg) call(cfg.repaint);
  }
  /* one station button on the lab's row: coloured if it is homework, and said for a screen reader */
  function mark(el, id, done, total) {
    if (!el || !el.classList) return;
    el.classList.remove('hw', 'hw--none', 'hw--partly', 'hw--done');
    var s = station(id);
    if (!s) return;
    var m = merge(s, { done: done, total: total });
    el.classList.add('hw', 'hw--' + m.state);
    if (el.ownerDocument) {
      var sr = el.ownerDocument.createElement('span');
      sr.className = 'hw__sr';
      sr.textContent = ' (homework: ' + WORDS[m.state] + ')';
      el.appendChild(sr);
    }
    if (el.title) el.title += ' · Homework: ' + WORDS[m.state];
  }

  /* ---------- once a day, per lab and account ---------- */
  function today(now) {
    var d = now ? new Date(now) : new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function seenKey() { return (cfg && cfg.lab ? cfg.lab : 'lab') + '.hwSeen'; }
  function seenToday(now) {
    try { return global.localStorage.getItem(seenKey()) === today(now) + ' ' + owner; } catch (e) { return false; }
  }
  function markSeen(now) {
    try { global.localStorage.setItem(seenKey(), today(now) + ' ' + owner); } catch (e) {}
  }

  /* ---------- the note ---------- */
  var box = null, before = null;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function dot(state) { return '<i class="hwdot hwdot--' + state + '" aria-hidden="true"></i>'; }
  function closePopup() {
    if (!box) return;
    if (box.parentNode) box.parentNode.removeChild(box);
    box = null;
    document.removeEventListener('keydown', onKey, true);
    if (before && before.focus) { try { before.focus(); } catch (e) {} }
    before = null;
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); closePopup(); } }
  /* Shows the note when something here is still to do and it has not been shown today (force: show it anyway).
     Returns whether it is showing. */
  function popup(force) {
    if (!cfg || !list.length || typeof document === 'undefined' || !document.body) return false;
    var now = stations(), state = {}, todo = [];
    now.forEach(function (s) { state[s.id] = s; });
    if (!now.some(function (s) { return s.state !== 'done'; })) return false;
    if (!force && seenToday()) return false;
    markSeen();
    closePopup();
    var html = '';
    list.forEach(function (hw) {
      var left = hw.stations.filter(function (s) { return state[s.id] && state[s.id].state !== 'done'; });
      if (!left.length) return;
      html += '<p class="hwpop__hw"><b>' + esc(hw.title || 'Homework') + '</b>' +
              (hw.due ? ' · ' + (hw.overdue ? 'it was due ' : 'due ') + esc(hw.due) : '') + '</p><ul class="hwpop__list">';
      left.forEach(function (s) {
        var x = state[s.id];
        todo.push(s.id);
        html += '<li><button type="button" class="hwpop__st" data-hwgo="' + esc(s.id) + '">' + dot(x.state) +
                '<span>' + esc(x.name) + '</span><small>' + WORDS[x.state] +
                (x.state === 'partly' ? ': ' + x.done + ' of ' + x.total : '') + '</small></button></li>';
      });
      html += '</ul>';
    });
    box = document.createElement('div');
    box.className = 'modal hwpop';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'hwpopT');
    box.innerHTML = '<div class="modal__box modal__box--sm">' +
      '<h2 id="hwpopT">You have homework in this lab</h2>' +
      '<p class="hwpop__lead">Still to do:</p>' + html +
      '<p class="hwpop__key">In the row of stations, your homework is coloured: ' + dot('none') + ' red, not started; ' +
        dot('partly') + ' orange, part done; ' + dot('done') + ' green, done.</p>' +
      '<div class="dlgrow"><button type="button" class="btn" id="hwpopOk">OK</button></div></div>';
    box.addEventListener('click', function (e) {
      var go = e.target && e.target.closest ? e.target.closest('[data-hwgo]') : null;
      if (go) { var id = go.getAttribute('data-hwgo'); closePopup(); if (cfg) call(cfg.open, id); return; }
      if (e.target === box || (e.target && e.target.id === 'hwpopOk')) closePopup();
    });
    before = document.activeElement;
    document.body.appendChild(box);
    document.addEventListener('keydown', onKey, true);
    var ok = document.getElementById('hwpopOk');
    if (ok && ok.focus) ok.focus();
    return todo.length > 0;
  }

  /* ---------- how it looks: one small style block, the same in every lab ---------- */
  function css() {
    if (typeof document === 'undefined' || !document.head || document.getElementById('hw-style')) return;
    var st = document.createElement('style');
    st.id = 'hw-style';
    st.textContent =
      '.rstep.hw--none{border-color:#C0392B;background:#FDECEA;box-shadow:inset 0 0 0 1px #C0392B}' +
      '.rstep.hw--partly{border-color:#B45309;background:#FDF1E4;box-shadow:inset 0 0 0 1px #B45309}' +
      '.rstep.hw--done{border-color:#1E7A3E;background:#E8F5EC;box-shadow:inset 0 0 0 1px #1E7A3E}' +
      '.rstep.hw[aria-current="true"]{background:var(--green,#14572B);color:#fff}' +
      '.rstep.hw--none .rstep__n{background:#C0392B;color:#fff}' +
      '.rstep.hw--partly .rstep__n{background:#B45309;color:#fff}' +
      '.rstep.hw--done .rstep__n{background:#1E7A3E;color:#fff}' +
      '.hw__sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
      '.hwdot{display:inline-block;width:12px;height:12px;border-radius:50%;flex:none;vertical-align:-1px}' +
      '.hwdot--none{background:#C0392B}.hwdot--partly{background:#B45309}.hwdot--done{background:#1E7A3E}' +
      '.hwpop__lead{margin:8px 0 0;font-size:15px}' +
      '.hwpop__hw{margin:12px 0 4px;font-size:14.5px}' +
      '.hwpop__list{list-style:none;padding:0;margin:4px 0 6px}' +
      '.hwpop__list li{margin:0 0 5px}' +
      '.hwpop__st{display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:1px solid var(--edge,#E7DFD1);' +
        'background:#fff;border-radius:10px;padding:9px 12px;font:inherit;font-size:14.5px;color:inherit;cursor:pointer}' +
      '.hwpop__st:hover,.hwpop__st:focus-visible{border-color:var(--green-2,#1E7A3E)}' +
      '.hwpop__st small{margin-left:auto;color:#5B5B5B;font-size:12.5px;white-space:nowrap;padding-left:8px}' +
      '.hwpop__key{font-size:13px;line-height:1.7;color:#4A4A4A;margin:12px 0 0}';
    document.head.appendChild(st);
  }

  global.LabHomework = {
    WORDS: WORDS, stateOf: stateOf, forLab: forLab, merge: merge,
    init: init, take: take, clear: clear, mark: mark, stations: stations, popup: popup,
    /* for the unit tests */
    _seenToday: seenToday, _markSeen: markSeen, _today: today
  };
})(typeof window !== 'undefined' ? window : this);
