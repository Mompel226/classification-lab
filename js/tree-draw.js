/* ============================================================
   tree-draw.js — the tree of life, drawn and lit. SHARED.
   The copy in labs-shared/tree/ is the source; the Life on Earth Hub and the
   Classification Lab each copy it in (the hub with tools/sync-shared.mjs, the
   lab with tools/build.mjs). Edit it here, then sync both.

   TreeDraw(svg, TREE, opts) draws window.TREE into an <svg viewBox="-420 -420 840 840">
   and returns an object that lights branches, pins a label, flies the view and
   reports where things are. It knows nothing about cards, tours or stations:
   that is the page's business, wired through opts.on*.

   opts.story   draw the five story steps round the origin (default true)
   opts.map     the element the pinned label is positioned against (default svg.parentNode)
   opts.tag     the pinned label element (a .tag with a .tag__pill inside), or null
   opts.onEnter / onLeave / onClick   function (kind, id)   kind is 'group' | 'story'
   ============================================================ */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg', XL = 'http://www.w3.org/1999/xlink';
  var R = { ring:110, king:170, cls:225, tip:300, lbl:340, far:386, story:62, num:86 };
  var FULL = { x:-420, y:-420, w:840, h:840 };
  var RIM = { from:-10, to:280 };
  var STORY_ANG = [216, 288, 0, 72, 144];

  function f(v) { return Math.round(v * 10) / 10; }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  function P(a, r) { var t = a * Math.PI / 180; return [r * Math.sin(t), -r * Math.cos(t)]; }
  function arc(r, a0, a1, sweep) {
    var p0 = P(a0, r), p1 = P(a1, r), d = ((a1 - a0) % 360 + 360) % 360;
    var large = sweep === 0 ? ((360 - d) > 180 ? 1 : 0) : (d > 180 ? 1 : 0);
    return 'M' + f(p0[0]) + ' ' + f(p0[1]) + ' A' + f(r) + ' ' + f(r) + ' 0 ' + large + ' ' + (sweep === 0 ? 0 : 1) + ' ' + f(p1[0]) + ' ' + f(p1[1]);
  }
  function line(a, r0, r1) {
    var p0 = P(a, r0), p1 = P(a, r1);
    return 'M' + f(p0[0]) + ' ' + f(p0[1]) + ' L' + f(p1[0]) + ' ' + f(p1[1]);
  }

  function TreeDraw(svg, T, opts) {
    opts = opts || {};
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var map = opts.map || svg.parentNode, tag = opts.tag || null;
    var hooks = { enter: opts.onEnter || function () {}, leave: opts.onLeave || function () {}, click: opts.onClick || function () {} };

    /* ---------- the shape ---------- */
    var G = {}, KIDS = {}, TIPS = [];
    (T.groups || []).forEach(function (g) {
      G[g.id] = g;
      if (g.kind === 'tip') TIPS.push(g.id);
      (KIDS[g.parent] = KIDS[g.parent] || []).push(g.id);
    });
    var V = T.viruses; if (V) G.viruses = V;
    var stepA = (RIM.to - RIM.from) / Math.max(1, TIPS.length - 1);
    TIPS.forEach(function (id, i) { G[id].a = RIM.from + i * stepA; });
    function angle(id) {
      var g = G[id];
      if (g.a == null) g.a = KIDS[id].reduce(function (s, k) { return s + angle(k); }, 0) / KIDS[id].length;
      return g.a;
    }
    (KIDS.root || []).forEach(angle);
    function tipsUnder(id) {
      if (id === 'viruses') return ['viruses'];
      if (!G[id]) return [];
      return G[id].kind === 'tip' ? [id] : (KIDS[id] || []).reduce(function (a, k) { return a.concat(tipsUnder(k)); }, []);
    }
    function rSplit(id) { return id === 'root' ? R.ring : (G[id].parent === 'root' ? R.king : R.cls); }
    function kingdomOf(id) {
      if (id === 'viruses') return 'viruses';
      while (G[id] && G[id].parent !== 'root') id = G[id].parent;
      return id;
    }
    function pathOf(id) {
      var names = [], p = G[id] && G[id].parent;
      while (p && p !== 'root') { names.unshift(G[p].label); p = G[p].parent; }
      return names;
    }
    function col(k) { return 'var(--c-' + k + ')'; }

    /* ---------- drawing ---------- */
    var defs = svg.querySelector('defs') || el('defs', {}, svg);
    if (!defs.querySelector('#og')) {
      var og = el('radialGradient', { id:'og', cx:'50%', cy:'50%', r:'50%' }, defs);
      el('stop', { offset:'0', 'stop-color':'#FFD48A', 'stop-opacity':'.55' }, og);
      el('stop', { offset:'.45', 'stop-color':'#FFB661', 'stop-opacity':'.16' }, og);
      el('stop', { offset:'1', 'stop-color':'#FFB661', 'stop-opacity':'0' }, og);
    }
    var ripples = el('g', { 'class':'ripples' }, svg);
    [R.far, R.tip, R.cls, R.king, R.ring, R.story].forEach(function (r, i) {
      el('circle', { 'class':'ripple' + (i === 0 ? ' ripple--far' : ''), r:r }, ripples);
    });
    el('path', { id:'rp-all', d:arc(R.far, -40, 40, 1), fill:'none' }, defs);
    var ringAll = el('text', { 'class':'kl kl--all' }, ripples);
    var ringAllPath = el('textPath', { href:'#rp-all', startOffset:'50%', 'text-anchor':'middle' }, ringAll);
    ringAllPath.setAttributeNS(XL, 'xlink:href', '#rp-all');
    el('circle', { 'class':'origin', r:100 }, svg);

    var treeG = el('g', { 'class':'tree' }, svg);
    function addPath(d, ks, k, cls) {
      el('path', { 'class': cls || 'b', d:d, 'data-tips':ks.join(' '), 'data-k':k }, treeG);
    }
    function segs(r, junction, children, k) {
      var kids = children.slice().sort(function (a, b) { return angle(a) - angle(b); });
      var angs = [junction].concat(kids.map(angle)).sort(function (a, b) { return a - b; });
      for (var i = 0; i + 1 < angs.length; i++) {
        var a0 = angs[i], a1 = angs[i + 1];
        if (a1 - a0 < 1e-6) continue;
        var mid = (a0 + a1) / 2, beyond;
        if (mid < junction) beyond = kids.filter(function (c) { return angle(c) <= a0 + 1e-6; });
        else                beyond = kids.filter(function (c) { return angle(c) >= a1 - 1e-6; });
        var ks = beyond.reduce(function (a, c) { return a.concat(tipsUnder(c)); }, []);
        if (ks.length) addPath(arc(r, a0, a1, 1), ks, k);
      }
    }
    function drawNode(id, rFrom) {
      var g = G[id], k = kingdomOf(id);
      if (g.kind === 'tip') { addPath(line(angle(id), rFrom, R.tip - 24), [id], k); return; }
      var rs = rSplit(id);
      addPath(line(angle(id), rFrom, rs), tipsUnder(id), k);
      segs(rs, angle(id), KIDS[id], k);
      KIDS[id].forEach(function (c) { drawNode(c, rs); });
    }
    addPath(line(180, 16, R.ring), TIPS, 'tree', 'b b--trunk');
    segs(R.ring, 180, KIDS.root || [], 'tree');
    (KIDS.root || []).forEach(function (c) { drawNode(c, R.ring); });

    var labels = el('g', { 'class':'labels' }, svg);
    (T.groups || []).forEach(function (g) {
      if (!g.ring) return;
      var r = (rSplit(g.parent) + rSplit(g.id)) / 2, a = angle(g.id) + (g.shift || 0), half = 42;
      var deg = ((a % 360) + 360) % 360, bottom = deg > 90 && deg < 270;
      var d = bottom ? arc(r + 5, a + half, a - half, 0) : arc(r - 5, a - half, a + half, 1);
      el('path', { id:'rp-' + g.id, d:d, fill:'none' }, defs);
      var t = el('text', { 'class':'kl', 'data-id':g.id, tabindex:0, role:'button', 'aria-label':g.label }, labels);
      var tp = el('textPath', { href:'#rp-' + g.id, startOffset:'50%', 'text-anchor':'middle' }, t);
      tp.setAttributeNS(XL, 'xlink:href', '#rp-' + g.id);
      tp.textContent = g.ring;
      wire(t, 'group', g.id);
    });

    var tipsG = el('g', { 'class':'tips' }, svg);
    function symbolBox(file) {
      var s = document.getElementById('s-' + file);
      if (!s) return [1, 1];
      var vb = s.viewBox.baseVal;
      return [vb.width || 1, vb.height || 1];
    }
    function tipSize(file, target, cap) {
      var wh = symbolBox(file), q = Math.min(wh[0], wh[1]) / Math.max(wh[0], wh[1]);
      return Math.min(cap || 78, (target || 40) / Math.sqrt(q));
    }
    function use(file, x, y, size) {
      var u = el('use', { 'class':'sil', x:f(x - size / 2), y:f(y - size / 2), width:f(size), height:f(size), href:'#s-' + file });
      u.setAttributeNS(XL, 'xlink:href', '#s-' + file);
      return u;
    }
    TIPS.forEach(function (id) {
      var g = G[id], a = angle(id), p = P(a, R.tip), q = P(a, R.lbl), size = tipSize(g.sil.file);
      var grp = el('g', { 'class':'tip', 'data-tip':id, 'data-k':kingdomOf(id), tabindex:0, role:'button', 'aria-label':g.label }, tipsG);
      el('circle', { 'class':'hot', cx:f(p[0]), cy:f(p[1]), r:f(size / 2 + 16) }, grp);
      grp.appendChild(use(g.sil.file, p[0], p[1], size));
      var t = el('text', { 'class':'tl', x:f(q[0]), y:f(q[1]), 'text-anchor': Math.sin(a * Math.PI / 180) >= 0 ? 'start' : 'end' }, grp);
      t.textContent = g.label;
      wire(grp, 'group', id);
    });
    if (V) {
      var vp = P(V.angle, V.r);
      var vg = el('g', { 'class':'tip tip--virus', 'data-tip':'viruses', 'data-k':'viruses', tabindex:0, role:'button', 'aria-label':V.label }, tipsG);
      el('circle', { 'class':'vring', cx:f(vp[0]), cy:f(vp[1]), r:26 }, vg);
      el('circle', { 'class':'hot', cx:f(vp[0]), cy:f(vp[1]), r:34 }, vg);
      vg.appendChild(use(V.sil.file, vp[0], vp[1], 30));
      var vt = el('text', { 'class':'tl', x:f(vp[0]), y:f(vp[1] + 44), 'text-anchor':'middle' }, vg); vt.textContent = V.label;
      var vs = el('text', { 'class':'tl tl--sub', x:f(vp[0]), y:f(vp[1] + 59), 'text-anchor':'middle' }, vg); vs.textContent = V.sub;
      wire(vg, 'group', 'viruses');
    }

    var storyG = el('g', { 'class':'story' }, svg), STORY = {};
    if (opts.story !== false) (T.story || []).forEach(function (s, i) {
      STORY[s.n] = s;
      var a = STORY_ANG[i % STORY_ANG.length], p = P(a, R.story), n = P(a, R.num);
      var g = el('g', { 'class':'st', 'data-step':s.n, tabindex:0, role:'button', 'aria-label':'Step ' + s.n + ' · ' + s.title,
                        transform:'translate(' + f(p[0]) + ' ' + f(p[1]) + ')' }, storyG);
      el('circle', { 'class':'st__disc', r:14 }, g);
      var ico = el('g', { 'class':'st__ico' }, g); ico.innerHTML = s.icon;
      var t = el('text', { 'class':'st__n', x:f(n[0] - p[0]), y:f(n[1] - p[1]), 'text-anchor':'middle', 'dominant-baseline':'middle' }, g);
      t.textContent = s.n;
      wire(g, 'story', s.n);
    });
    el('circle', { 'class':'core', r:4.5 }, storyG);

    function wire(e, kind, id) {
      ['mouseenter', 'focus'].forEach(function (ev) { e.addEventListener(ev, function () { hooks.enter(kind, id); }); });
      ['mouseleave', 'blur'].forEach(function (ev) { e.addEventListener(ev, function () { hooks.leave(kind, id); }); });
      e.addEventListener('click', function (ev) { ev.stopPropagation(); hooks.click(kind, id); });
      e.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); hooks.click(kind, id); }
      });
    }

    /* ---------- lighting ---------- */
    function clear() {
      svg.classList.remove('lit');
      svg.querySelectorAll('.is-on').forEach(function (e) { e.classList.remove('is-on'); });
      ringAll.classList.remove('is-on');
      if (tag) tag.classList.remove('on');
      svg.style.removeProperty('--c');
    }
    function elFor(kind, id) {
      if (kind === 'story') return svg.querySelector('.st[data-step="' + id + '"]');
      return svg.querySelector('.tip[data-tip="' + id + '"] .sil') || svg.querySelector('.kl[data-id="' + id + '"]');
    }
    function pin(elm, text, c) {
      if (!tag) return;
      if (!elm) { tag.classList.remove('on'); return; }
      var o = elm.getBoundingClientRect(), fr = map.getBoundingClientRect();
      tag.style.setProperty('--c', c);
      tag.querySelector('.tag__pill').textContent = text;
      tag.style.left = (o.left + o.width / 2 - fr.left) + 'px';
      tag.style.top  = (o.top - fr.top - 8) + 'px';
      tag.classList.add('on');
    }
    /* light one group: the route from the middle to it, its silhouettes and ring names */
    function light(id, noPin) {
      var g = G[id]; if (!g) return null;
      clear(); svg.classList.add('lit');
      var k = kingdomOf(id), c = col(k), ts = tipsUnder(id);
      svg.style.setProperty('--c', c);
      svg.querySelectorAll('.b').forEach(function (p) {
        var pt = p.getAttribute('data-tips').split(' ');
        if (ts.some(function (t) { return pt.indexOf(t) >= 0; })) p.classList.add('is-on');
      });
      ts.forEach(function (t) {
        var e = svg.querySelector('.tip[data-tip="' + t + '"]');
        if (e) { e.classList.add('is-on'); e.querySelector('.sil').classList.add('is-on'); }
      });
      svg.querySelectorAll('.kl[data-id]').forEach(function (t) {
        var rid = t.getAttribute('data-id');
        if (rid === id || tipsUnder(rid).every(function (x) { return ts.indexOf(x) >= 0; })) t.classList.add('is-on');
      });
      if (!noPin) pin(elFor('group', id), g.label, c);
      return { colour:c, kingdom:k, tips:ts };
    }
    /* light several groups at once, e.g. everything a station is about */
    function lightMany(ids, k) {
      clear(); svg.classList.add('lit');
      var c = col(k || (ids.length === 1 ? kingdomOf(ids[0]) : 'tree'));
      svg.style.setProperty('--c', c);
      var ts = ids.reduce(function (a, id) { return a.concat(tipsUnder(id)); }, []);
      svg.querySelectorAll('.b').forEach(function (p) {
        var pt = p.getAttribute('data-tips').split(' ');
        if (ts.some(function (t) { return pt.indexOf(t) >= 0; })) p.classList.add('is-on');
      });
      ts.forEach(function (t) {
        var e = svg.querySelector('.tip[data-tip="' + t + '"]');
        if (e) { e.classList.add('is-on'); e.querySelector('.sil').classList.add('is-on'); }
      });
      svg.querySelectorAll('.kl[data-id]').forEach(function (t) {
        var rid = t.getAttribute('data-id');
        if (ids.indexOf(rid) >= 0 || tipsUnder(rid).every(function (x) { return ts.indexOf(x) >= 0; })) t.classList.add('is-on');
      });
      return { colour:c, tips:ts };
    }
    function lightStory(n, noPin) {
      var s = STORY[n]; if (!s) return null;
      clear(); svg.classList.add('lit');
      var c = col('story'); svg.style.setProperty('--c', c);
      var e = elFor('story', n); if (e) e.classList.add('is-on');
      if (!noPin && e) pin(e, n + ' · ' + s.title, c);
      return { colour:c, step:s };
    }
    function lightAll(ringText) {
      clear(); svg.classList.add('lit');
      var c = col('tree'); svg.style.setProperty('--c', c);
      svg.querySelectorAll('.b,.sil,.kl[data-id],.tip').forEach(function (e) { e.classList.add('is-on'); });
      ringAllPath.textContent = ringText || '';
      if (ringText) ringAll.classList.add('is-on');
      return { colour:c };
    }

    /* ---------- the flight ---------- */
    var view = { x:FULL.x, y:FULL.y, w:FULL.w, h:FULL.h }, anim = null;
    function setView(v) { svg.setAttribute('viewBox', f(v.x) + ' ' + f(v.y) + ' ' + f(v.w) + ' ' + f(v.h)); }
    function flyTo(to, done) {
      to = to || FULL;
      var zoomed = to.w < FULL.w - 1;
      map.classList.toggle('is-zoomed', zoomed);
      if (still) { view = { x:to.x, y:to.y, w:to.w, h:to.h }; setView(view); if (done) done(); return; }
      if (anim) cancelAnimationFrame(anim);
      var from = { x:view.x, y:view.y, w:view.w, h:view.h }, t0 = null, D = 700;
      map.classList.add('is-flying');
      if (tag) tag.classList.remove('on');
      function tick(now) {
        if (t0 === null) t0 = now;
        var k = Math.min(1, (now - t0) / D), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        view = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
                 w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e };
        setView(view);
        if (k < 1) anim = requestAnimationFrame(tick);
        else { anim = null; map.classList.remove('is-flying'); if (done) done(); }
      }
      anim = requestAnimationFrame(tick);
    }
    function grow(b, x, y, X, Y) {
      return b ? { x:Math.min(b.x, x), y:Math.min(b.y, y), X:Math.max(b.X, X), Y:Math.max(b.Y, Y) } : { x:x, y:y, X:X, Y:Y };
    }
    /* the box round everything that is lit — measured at rest, never mid-flight */
    function boxOfLit(minSize) {
      var b = null;
      svg.querySelectorAll('.b.is-on, .kl.is-on, .tip.is-on .tl').forEach(function (e) {
        var r; try { r = e.getBBox(); } catch (err) { return; }
        if (r.width || r.height) b = grow(b, r.x, r.y, r.x + r.width, r.y + r.height);
      });
      svg.querySelectorAll('.tip.is-on .hot').forEach(function (c) {
        var cx = +c.getAttribute('cx'), cy = +c.getAttribute('cy'), r = +c.getAttribute('r');
        b = grow(b, cx - r, cy - r, cx + r, cy + r);
      });
      svg.querySelectorAll('.st.is-on').forEach(function (g) {
        var m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.getAttribute('transform') || '');
        if (m) b = grow(b, +m[1] - 40, +m[2] - 40, +m[1] + 40, +m[2] + 40);
      });
      if (!b) return FULL;
      var pad = 36, w = b.X - b.x + pad * 2, h = b.Y - b.y + pad * 2, s = Math.max(w, h, minSize || 250);
      if (s >= FULL.w * .85) return FULL;
      var cx = (b.x + b.X) / 2, cy = (b.y + b.Y) / 2;
      return { x:cx - s / 2, y:cy - s / 2, w:s, h:s };
    }

    return {
      G:G, KIDS:KIDS, TIPS:TIPS, STORY:STORY, FULL:FULL, R:R,
      angle:angle, tipsUnder:tipsUnder, kingdomOf:kingdomOf, pathOf:pathOf, colourOf:col, P:P,
      light:light, lightMany:lightMany, lightStory:lightStory, lightAll:lightAll, clear:clear,
      pin:pin, elFor:elFor, flyTo:flyTo, boxOfLit:boxOfLit,
      view: function () { return view; }, isZoomed: function () { return view.w < FULL.w - 1; }
    };
  }

  /* marine snow, drifting up through the water: two layers of small dots */
  TreeDraw.snow = function (svg, n) {
    for (var layer = 0; layer < 2; layer++) {
      var lg = el('g', {}, svg);
      for (var i = 0; i < (n || 45); i++) {
        el('circle', { cx:f(Math.random() * 1000 - 500), cy:f(Math.random() * 2000 - 500),
                       r:f(.7 + Math.random() * 1.2), opacity:f(.12 + Math.random() * .28) }, lg);
      }
    }
  };

  global.TreeDraw = TreeDraw;
})(window);
