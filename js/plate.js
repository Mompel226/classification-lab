/* ============================================================
   plate.js — the tree of life as this lab's plate.
   The drawing and the lighting are the shared js/tree-draw.js; this file decides
   what the lab does with them: a station lights the groups it is about, a group you
   click opens the station that teaches it, and the view flies to whatever is lit.
   ============================================================ */
(function (global) {
  'use strict';

  var T = global.TREE || { groups: [] };
  var tree = null, svg, map, tag, said, whole, hint;
  var onPick = function () {};
  var current = null;          /* the station being shown */
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function say(name, note, c) {
    if (!said) return;
    if (c) said.style.setProperty('--c', c); else said.style.removeProperty('--c');
    said.innerHTML = '<span class="said__name">' + esc(name) + '</span><span class="said__note">' + esc(note) + '</span>';
  }

  function init(opts) {
    svg = document.getElementById('tree'); map = document.getElementById('map'); tag = document.getElementById('tag');
    said = document.getElementById('said'); whole = document.getElementById('tWhole'); hint = document.getElementById('plateHint');
    onPick = (opts && opts.onPick) || onPick;
    if (!svg || !global.TreeDraw) return;
    tree = global.TreeDraw(svg, T, {
      story: false, map: map, tag: tag,
      /* pointing names the group; it does not change what the station has lit */
      onEnter: function (kind, id) {
        var g = tree.G[id]; if (!g) return;
        tree.pin(tree.elFor('group', id), g.label, tree.colourOf(tree.kingdomOf(id)));
      },
      onLeave: function () { if (tag) tag.classList.remove('on'); },
      onClick: function (kind, id) { onPick(id); }
    });
    var snow = document.getElementById('snow');
    if (snow) global.TreeDraw.snow(snow, 40);
    if (whole) whole.addEventListener('click', function () { flyHome(); });
    window.addEventListener('resize', function () { if (tag) tag.classList.remove('on'); });
  }

  function groupsOf(st) {
    if (!st || !st.tree) return [];
    return Array.isArray(st.tree) ? st.tree : [];
  }

  /* what a station lights: its groups in their kingdom's colour, or the whole tree */
  function showStation(st) {
    if (!tree) return;
    current = st;
    var ids = groupsOf(st);
    if (st.tree === 'all') {
      tree.lightAll(st.ring || '');
      say(st.name, 'every branch', tree.colourOf('tree'));
      tree.flyTo(tree.FULL);
    } else if (!ids.length) {
      tree.clear();
      say(st.name, st.plateNote || 'the whole tree', null);
      tree.flyTo(tree.FULL);
    } else {
      var kinds = {}; ids.forEach(function (id) { kinds[tree.kingdomOf(id)] = 1; });
      var k = Object.keys(kinds).length === 1 ? Object.keys(kinds)[0] : 'tree';
      var r = tree.lightMany(ids, k);
      var note = ids.length === 1
        ? (ids[0] === 'viruses' ? ((T.viruses && T.viruses.path) || 'in no kingdom')
           : (tree.G[ids[0]].kind === 'tip' ? tree.pathOf(ids[0]).join(' · ') : tree.tipsUnder(ids[0]).length + ' groups on this branch'))
        : ids.length + ' kingdoms · the whole tree';
      say(st.name, note, r.colour);
      tree.flyTo(tree.boxOfLit(300));
    }
    if (whole) whole.hidden = !tree.isZoomed() && !(ids.length && st.tree !== 'all');
    setTimeout(function () { if (whole) whole.hidden = !tree.isZoomed(); }, still ? 0 : 760);
  }

  /* one group, named and pinned: the student clicked it on the tree or in the text */
  function focus(id) {
    if (!tree || !tree.G[id]) return;
    var r = tree.light(id);
    var g = tree.G[id];
    say(g.label, id === 'viruses' ? (T.viruses && T.viruses.path) || '' : (tree.pathOf(id).join(' · ') || 'Kingdom'), r.colour);
    tree.flyTo(tree.boxOfLit(260), function () { tree.pin(tree.elFor('group', id), g.label, r.colour); });
    if (whole) whole.hidden = false;
  }

  function flyHome() {
    if (!tree) return;
    if (current) showStation(current); else { tree.clear(); tree.flyTo(tree.FULL); }
  }

  global.Plate = { init: init, showStation: showStation, focus: focus, home: flyHome,
                   groupsOf: groupsOf, tree: function () { return tree; } };
})(window);
