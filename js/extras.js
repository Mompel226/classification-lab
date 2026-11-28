/* labs-shared/extras/extras.js — the IB-and-beyond switch in every engine lab (28 Nov 2026).
   Daniel, 28 Nov 2026 (the Enzymes Lab session): "I like the IB comments and everything, but show them by default. But maybe
   at some place very visible for the students, add it so that it's toggleable for them to actually not see the IB content
   … there should be a toggle that hides IB and beyond the syllabus. Hide both … by default, it's activated, and so it is
   shown … for all of the labs that have IB and beyond the syllabus content shown the same way, particularly the
   animations". The Enzymes Lab built the model in its own js/app.js; this file is that model, shared.
   NEVER edit a lab's copy (js/extras.js): edit this file, then rebuild the lab. Its tools/build.mjs calls copyExtras
   (./copy.mjs), which copies this file and refuses a page that does not load it just before js/app.js.

   What a pupil sees: one switch, role="switch", at the top of every station's Learn tab, under the colour key: "Show IB
   and beyond the syllabus". The choice is the lab's own (Daniel, 28 Nov 2026, the same evening: "it can be lab related …
   if it's toggled in one lab, it's not toggled in the other … it is always on by default when you enter a lab, and then
   it's the student that needs to decide if in that lab he doesn't want to learn about the IB or extension"; and, asked
   whether a lab keeps a pupil's "off" for the next visit, "Yes, keep it off"). So: on the first time a pupil opens a lab;
   switched off, it stays off in every station of that lab and on their next visit to it; other labs are not affected.
   It is localStorage 'labs.extras.<the lab's folder>' = 'off' (absent = on); a 'storage' listener follows the same lab
   open in another tab.

   How it hides: CSS, under html.no-extras (set before the lab draws anything, so nothing IB flashes on a load). It changes
   no lab's own code. It reads what the lab draws, and marks what the lab does not mark with a class of its own (xs-x).
   Every IB, beyond and extension mark of the labs wears the one extension violet (tools/one-violet.mjs, --ext); that is
   how each one below was found. Off hides, in every lab:
     · the IB, IB HL and Beyond lines of each animation step, their "IB only" tags and the animation's key to them
       (.sp__lv--ib, --ibhl, --bey); a step with no IGCSE line keeps its heading, and its drawing still plays;
     · an animation or a card whose title says "(IB …)" or "(beyond …)", and the cards marked .xcard--ib or .xcard--beyond;
     · the Extension card (.offsyl--extra);
     · the "Beyond the syllabus" part of the Not-in-the-syllabus card (the card too, when that is all it holds); its
       "In older syllabuses" part stays: those can be in past papers;
     · the IB and Beyond items of Going further (the card too, when that is all it holds); an item from an older 0610
       syllabus stays;
     · an animation all of whose steps are IB or beyond (no IGCSE line in any step: the Circulation Lab's ECG);
     · every "Beyond 0610" note fenced under a film or a card (a class ending __fence);
     · an extra pin "not in 0610" on a picture and its name in the list (the shared finder; a found one is let go first);
   and in the labs whose pictures carry their own marks:
     · Molecules: the picture's IB and extension buttons (A wax (IB), Inside starch (extension)) and the extension's row;
     · Inheritance: the violet IB phase names on the dividing cells, and the IGCSE · IB switch of mitosis and meiosis
       (the IGCSE version shows);
     · Immunity: the IGCSE · IB switch above a film (.fmsw; the IGCSE version shows), and the beyond-the-syllabus note
       under it (.fmnote, "Where do the antibody shapes come from?");
     · Plants: the pollen tube's IB detail (.pt__more), the "Did you know?" cards (.curio, fenced "Beyond 0610 and the IB
       guide"), the flower's extra name (nectary) and the cactus's CAM chip (.ad__chip--ext);
     · Circulation: the "Did you know?" cards, the body's "Beyond syllabus" names (#tBeyond, pressed off), the heart's
       "what starts each beat" (.h3__beyond), the ECG's "Name the waves" (.ec__namesb, .ec__names), the coronary artery's
       "Extension · less common" tag on its picture (.ar__extpill) and the body-flow
       picture's purple-italic names, its key line and its "Beyond the syllabus" folds (.bf__lb.is-beyond, .bf__ki--note,
       .bf__beyond);
     · Digestion: the body's own Beyond syllabus button (#tBeyond: hidden, never pressed) and the names of the organs beyond
       the syllabus (.lblg.beyond), except in the station about that organ; that station itself (Epiglottis) and its tag stay:
       a station is the lab's structure, its questions and every pupil's progress;
     · Classification: the purple "not in 0610" names on its diagrams (.diag__lab--extra, .diag__lead--extra) and their
       key (.diag__key: with them gone, every name left is a 0610 word), and the table of the seven ranks (its caption says
       "Beyond the syllabus").
   Never hidden: anything IGCSE, Cambridge's own sentences, the Key words (a "beyond 0610" tag there marks a word the IGCSE
   lines use), the glossary, Practise.
   Switched off while something hidden is open: the card is closed, a film shows its IGCSE version, a picture showing
   an IB or extension view goes back to the view its own row shows, and a hidden IB or beyond toggle that is on (Digestion's
   and Circulation's Beyond syllabus, the pollen tube's IB detail, a found extra pin) is pressed off: each by the lab's own
   button. Switched on again, the toggles this file pressed off are pressed on again.
   The proof: tools/extras-switch.mjs (Biology Hub), every lab, on and off. */
(function () {
  'use strict';
  /* the lab, from its address (…/membrane-lab/…): its own choice, and the marks only it has (below) */
  var LAB = (location.pathname.match(/\/([^/]+-lab)\//) || [])[1] || 'lab';
  var KEY = 'labs.extras.' + LAB, ROOT = document.documentElement;
  function on() { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } }
  ROOT.classList.toggle('no-extras', !on());

  var X = 'html.no-extras ';
  /* what off hides: in every lab, then each lab's own marks (the header above says why each one) */
  var HIDE = ['.xs-x', '.sp__lv--ib', '.sp__lv--ibhl', '.sp__lv--bey', '.xcard--ib', '.xcard--beyond', '.offsyl--extra',
    '[class*="__fence"]', '.pin--extra', '.pins__item--extra',
    '.memv__btn--ext',                                                                      /* Molecules */
    '.phtag', '.lvw__bar',                                                                  /* Inheritance */
    '.fmsw', '.fmnote',                                                                     /* Immunity */
    '.pt__more', '.curio', '.fl__lab--extra', '.fl__lead--extra', '.ad__chip--ext',         /* Plants */
    '.h3__beyond', '.ec__namesb', '.ec__names', '.bf__lb.is-beyond', '.bf__ki--note', '.bf__beyond', '.ar__extpill',   /* Circulation */
    '.diag__lab--extra', '.diag__lead--extra', '.diag__key'];                               /* Classification */
  /* the same id in two labs: Circulation's and Digestion's own Beyond syllabus button. Digestion's is hidden, never pressed:
     off, it would take the epiglottis away, even in the epiglottis's own station; its other names go by CSS instead */
  if (LAB === 'circulation-lab' || LAB === 'digestion-lab') HIDE.push('#tBeyond');
  if (LAB === 'digestion-lab') HIDE.push('.lblg.beyond:not(.is-active)');
  /* the toggles off presses off when they are on, each by its own button (and on again when the switch is on) */
  var TOGGLES = ['.pt__more[aria-expanded="true"]', '.ec__namesb[aria-expanded="true"]', '.pin--extra[aria-pressed="true"]'];
  if (LAB === 'circulation-lab') TOGGLES.push('#tBeyond[aria-pressed="true"]');
  var HIDDEN = HIDE.join(',');
  /* hidden by the switch, not by a closed card or a station that is not showing */
  function off(el) { return !!(el && el.closest && el.closest(HIDDEN)); }
  var CSS =
    '.xswitch{display:flex;align-items:center;gap:6px 14px;flex-wrap:wrap;margin:0 0 12px;padding:8px 12px;border:1px solid var(--edge);border-radius:12px;background:var(--card)}' +
    '.xswitch__b{display:inline-flex;align-items:center;gap:10px;font:inherit;font-size:14px;font-weight:600;color:var(--ink);background:none;border:0;padding:4px 2px;cursor:pointer;text-align:left}' +
    '.xswitch__track{position:relative;flex:none;width:40px;height:22px;border-radius:11px;background:var(--grey);transition:background .2s}' +
    '.xswitch__knob{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--card);box-shadow:0 1px 2px rgba(0,0,0,.3);transition:left .2s}' +
    '.xswitch__b[aria-checked="true"] .xswitch__track{background:var(--ext)}' +
    '.xswitch__b[aria-checked="true"] .xswitch__knob{left:21px}' +
    '.xswitch__b:focus-visible{outline:2px solid var(--accent,var(--green,currentColor));outline-offset:3px;border-radius:8px}' +
    '.xswitch__ib,.xswitch__bey{color:var(--ext)}' +
    '.xswitch__s{font-size:12.5px;color:var(--grey)}' +
    '@media (prefers-reduced-motion:reduce){.xswitch__track,.xswitch__knob{transition:none}}' +
    /* what off hides */
    HIDE.map(function (sel) { return X + sel; }).join(',') + '{display:none!important}' +
    /* a step with no IGCSE line: its button loses the violet tint with its words (the lab's own on and done colours still win) */
    X + ':where(.sp__step--ib,.sp__step--ibhl,.sp__step--bey)>.sp__stepb{background:var(--c23,var(--card))}';
  var css = document.createElement('style'); css.id = 'xs-css'; css.textContent = CSS;
  (document.head || ROOT).appendChild(css);

  var RX_TITLE = /\((?:IB|beyond)\b/i;
  function text(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* ---------- marking what the lab does not mark itself ---------- */
  function all(root, sel) {
    var out = Array.prototype.slice.call(root.querySelectorAll(sel));
    if (root.matches(sel)) out.unshift(root);
    return out;
  }
  function mark(root) {
    /* Going further: an IB or Beyond item (an item from an older syllabus shows its own badge, never these) */
    all(root, '.later__ref--ib, .later__ref--beyond').forEach(function (r) {
      var li = r.closest('.later__list > li'); if (li) li.classList.add('xs-x');   /* only Going further's own items: the same chip
        sits elsewhere too (the Immunity Lab's note under the first meeting, which is hidden by its own class) */
    });
    all(root, '.later').forEach(function (c) {
      var li = c.querySelectorAll('.later__list > li');
      if (li.length && Array.prototype.every.call(li, function (x) { return x.classList.contains('xs-x'); })) c.classList.add('xs-x');
    });
    /* Not in the syllabus: the "Beyond the syllabus" part, from its heading to the next heading */
    all(root, '.offsyl:not(.offsyl--extra)').forEach(function (c) {
      var hs = c.querySelectorAll(':scope > .offsyl__h'), kept = 0;
      Array.prototype.forEach.call(hs, function (h) {
        if (!/^Beyond/.test(text(h))) { kept++; return; }
        for (var e = h; e && !(e !== h && e.classList.contains('offsyl__h')); e = e.nextElementSibling) e.classList.add('xs-x');
      });
      if (hs.length && !kept) c.classList.add('xs-x');
    });
    /* a card or an animation whose title says (IB …) or (beyond …); its kind ("Animation · 4 steps") is not its title */
    all(root, '.xcard').forEach(function (c) {
      var t = c.querySelector('.xcard__t'); if (!t) return;
      var k = t.cloneNode(true); Array.prototype.forEach.call(k.querySelectorAll('.xcard__kind'), function (x) { x.remove(); });
      if (RX_TITLE.test(text(k))) c.classList.add('xs-x');
    });
    /* an animation with no IGCSE line in any step: its card. Never a card with an IGCSE and an IB version (.fmsw, .lvw,
       .ixw: the Immunity Lab's first meeting, Inheritance's mitosis and meiosis): there the bar goes and the IGCSE film shows */
    all(root, '.sp__steps').forEach(function (l) {
      var c = l.closest('.xcard'); if (!c || c.querySelector('.fmsw, .lvw, .ixw')) return;
      var st = c.querySelectorAll('.sp__step');
      if (st.length && Array.prototype.every.call(st, function (x) { return /\bsp__step--(?:ib|ibhl|bey)\b/.test(x.className); })) c.classList.add('xs-x');
    });
    /* a table whose caption says it is beyond the syllabus (the Classification Lab's seven ranks) */
    all(root, 'table').forEach(function (t) {
      var cap = t.querySelector('caption'); if (cap && /^Beyond the syllabus/.test(text(cap))) (t.closest('.ctable') || t).classList.add('xs-x');
    });
    /* an extension note on a sentence (the Inheritance Lab) */
    all(root, '.exam-inote').forEach(function (n) { if (n.querySelector('.sup--ext')) n.classList.add('xs-x'); });
    /* a picture's row made only of extension buttons (the Molecules Lab's Inside starch) */
    all(root, '.vbar').forEach(function (r) {
      var bs = r.querySelectorAll('button');
      if (bs.length && Array.prototype.every.call(bs, function (x) { return /--ext\b/.test(x.className); })) r.classList.add('xs-x');
    });
  }

  /* ---------- the switch ---------- */
  function learnPane(p) {
    var t = p.previousElementSibling;
    while (t && !t.classList.contains('tabs')) t = t.previousElementSibling;
    var first = t && t.querySelector('.tab');
    return !first || first.getAttribute('aria-selected') === 'true';
  }
  function addSwitch(p) {
    if (p.querySelector(':scope > .xswitch') || !learnPane(p)) return;
    var xs = document.createElement('div'); xs.className = 'xswitch';
    xs.innerHTML = '<button type="button" class="xswitch__b" role="switch" aria-checked="' + (on() ? 'true' : 'false') + '">' +
      '<span class="xswitch__track" aria-hidden="true"><span class="xswitch__knob"></span></span>' +
      '<span class="xswitch__t">Show <b class="xswitch__ib">IB</b> and <b class="xswitch__bey">beyond the syllabus</b></span></button>' +
      '<span class="xswitch__s">Off: only the IGCSE lines and cards, in every station of this lab. This lab remembers your choice.</span>';
    xs.querySelector('button').addEventListener('click', function () { set(!on()); });
    var key = p.querySelector(':scope > .keybar');
    if (key) key.insertAdjacentElement('afterend', xs); else p.insertBefore(xs, p.firstChild);
  }

  /* ---------- switched off while something now hidden is open ---------- */
  function gone(el) { for (var e = el; e && e.nodeType === 1; e = e.parentElement) if (getComputedStyle(e).display === 'none') return true; return false; }
  /* the extra pins hidden, the others numbered 1, 2, 3 … with no gap (their own numbers back when the switch is on) */
  function renumber(hide) {
    Array.prototype.forEach.call(document.querySelectorAll('.pins__item--extra'), function (x) {
      var list = x.parentElement; if (!list || list.__xsN === hide) return; list.__xsN = hide;
      var wrap = list.closest('.pins') || document, k = 0;
      Array.prototype.forEach.call(list.querySelectorAll(':scope > .pins__item'), function (li) {
        var n = li.querySelector('.n'), b = li.querySelector('.pins__txt b'); if (!n) return;
        if (!li.hasAttribute('data-xs-n')) li.setAttribute('data-xs-n', n.textContent);
        var to = hide ? (li.classList.contains('pins__item--extra') ? null : String(++k)) : li.getAttribute('data-xs-n');
        if (to == null) return;
        n.textContent = to;
        var name = b ? text(b) : '', pins = (wrap.querySelector('.pin') ? wrap : document).querySelectorAll('.pin');
        Array.prototype.forEach.call(pins, function (pin) {
          var al = pin.getAttribute('aria-label') || '';
          if (name && al.slice(al.indexOf(': ') + 2) === name) { pin.textContent = to; pin.setAttribute('aria-label', al.replace(/\d+(?=: )/, to)); }
        });
      });
    });
  }
  function leave() {
    /* an open card that is now hidden: closed by its own heading */
    Array.prototype.forEach.call(document.querySelectorAll('.xcard.is-open'), function (c) {
      var h = c.querySelector('.xcard__h'); if (h && off(c)) h.click();
    });
    /* a film with an IGCSE and an IB version: the IGCSE one */
    Array.prototype.forEach.call(document.querySelectorAll('.lvw'), function (b) {
      if (b.__level && b.querySelector('.lvw__b[aria-pressed="true"] .sup--ext')) b.__level('igcse');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.fmsw'), function (b) {
      var ig = b.querySelector('.fmsw__b:not(.fmsw__b--ib)'), ib = b.querySelector('.fmsw__b--ib');
      if (ig && ib && ib.getAttribute('aria-pressed') === 'true') ig.click();
    });
    /* a toggle of IB or beyond that is on (Circulation's Beyond syllabus, the pollen tube's IB detail, the ECG's wave names,
       a found extra pin): pressed off, and kept, so that switching on again presses it on again */
    Array.prototype.forEach.call(document.querySelectorAll(TOGGLES.join(',')), function (b) {
      b.click(); if (b.getAttribute('aria-pressed') !== 'true' && b.getAttribute('aria-expanded') !== 'true') undo.push(b);
    });
    /* the cactus's CAM chip, chosen: the first feature of its plant that is not an extension */
    Array.prototype.forEach.call(document.querySelectorAll('.ad__chip--ext.is-on'), function (c) {
      var o = c.parentElement && c.parentElement.querySelector('.ad__chip:not(.ad__chip--ext)'); if (o) o.click();
    });
    /* a picture showing an IB or extension view: the first view its row still shows, or the view the row above shows */
    Array.prototype.forEach.call(document.querySelectorAll('.vbar button[aria-pressed="true"]'), function (b) {
      if (!off(b)) return;
      var bar = b.closest('.vbar'), mine = firstShown(bar);
      if (mine) { mine.click(); return; }
      /* the rows of the same picture, the nearest one above first */
      var root = bar.parentElement; while (root && root.querySelectorAll('.vbar').length < 2) root = root.parentElement;
      var rows = root ? Array.prototype.slice.call(root.querySelectorAll('.vbar')) : [];
      for (var i = rows.indexOf(bar) - 1; i >= 0; i--) {
        if (gone(rows[i])) continue;
        var p = rows[i].querySelector('button[aria-pressed="true"]') || firstShown(rows[i]); if (p) { p.click(); return; }
      }
    });
  }
  function firstShown(bar) { var bs = bar ? bar.querySelectorAll('button') : []; for (var i = 0; i < bs.length; i++) if (!gone(bs[i])) return bs[i]; return null; }

  var undo = [];
  function paint(v) {
    ROOT.classList.toggle('no-extras', !v);
    Array.prototype.forEach.call(document.querySelectorAll('.xswitch__b'), function (b) { b.setAttribute('aria-checked', v ? 'true' : 'false'); });
    renumber(!v);
    if (!v) { leave(); return; }
    undo.splice(0).forEach(function (b) { if (b.isConnected && b.getAttribute('aria-pressed') !== 'true' && b.getAttribute('aria-expanded') !== 'true') b.click(); });
  }
  function set(v) {
    try { if (v) localStorage.removeItem(KEY); else localStorage.setItem(KEY, 'off'); } catch (e) {}
    paint(v);
  }
  window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === null) paint(on()); });

  /* ---------- watching what the lab draws ---------- */
  function look(node) {
    if (node.nodeType !== 1 || node instanceof SVGElement) return;
    if (node.classList.contains('tabpane')) addSwitch(node);
    Array.prototype.forEach.call(node.querySelectorAll('.tabpane'), addSwitch);
    mark(node);
    if (!on() && node.querySelector('.pins__item--extra')) renumber(true);
  }
  function start() {
    look(document.body);
    new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) for (var j = 0; j < recs[i].addedNodes.length; j++) look(recs[i].addedNodes[j]);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  window.LabExtras = { on: on, set: set };
})();
