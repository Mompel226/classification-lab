/* ============================================================
   sw.template.js — the offline worker both labs share.

   tools/build.mjs fills in the four placeholders below — the lab's name, this build's
   version, the list of stamped files, and a hash per picture — and writes the result to that
   lab's repo root as sw.js. Its scope is therefore exactly /<lab>/ on Pages:
   the most a worker gets by default, this lab and nothing above it. Never edit sw.js.

   ---------------------------------------------------------------------------
   THE ONE DECISION THAT MATTERS: the HTML document is fetched NETWORK-FIRST.

   A service worker on GitHub Pages is the one change that cannot be undone by pushing a fix,
   because we cannot set response headers. The way that goes wrong is always the same: the
   worker serves a cached index.html forever, and every later deploy is invisible. The usual
   defence is a version banner and a kill switch, and the usual result is that a class sits on
   a stale page for a lesson while someone works out why.

   So this worker never prefers the cache for the document while the network is reachable. It
   asks the network first, with a short timeout, and only falls back to what it holds when
   that fails. Online, a student sees exactly what they see today. Offline, they get the lab.

   Everything else IS cache-first, and safely so, because every other URL is immutable by
   construction: index.html carries a ?v= stamp on every script and stylesheet, and the stamp
   changes whenever the file does, so a cached ?v=1 file can never stand in for ?v=2. Pictures
   are keyed by a hash of their own bytes for the same reason.

   The cost is one 12 KB document fetch per online load. That is the price of making the
   unrecoverable failure impossible, and it is worth paying.
   ---------------------------------------------------------------------------

   Cache names are prefixed with the lab, because both labs — and the hubs, and the other
   sims — share the origin mompel226.github.io and therefore share one CacheStorage.
   ============================================================ */
const LAB        = 'classification-lab';
const VERSION    = '1788876903';
const SHELL      = LAB + '-shell-v' + VERSION;
const MEDIA      = LAB + '-media';
const PRECACHE   = ["./css/app.css?v=1788876903","./js/config.js?v=1788876903","./js/data/glossary.js?v=1788876903","./js/data/stations.js?v=1788876903","./js/data/photos.js?v=1788876903","./js/tree.js?v=1788876903","./js/tree-draw.js?v=1788876903","./js/terms.js?v=1788876903","./js/marking.js?v=1788876903","./js/sync.js?v=1788876903","./js/engine.js?v=1788876903","./js/learn.js?v=1788876903","./js/engine-ext.js?v=1788876903","./js/plate.js?v=1788876903","./js/app.js?v=1788876903"];      /* every stamped .js and .css, taken from the HTML the build just stamped */
const MEDIA_REV  = {"photos/amphibians-1400.jpg":"32e5a76c","photos/amphibians-1400.webp":"f7dede6a","photos/amphibians-900.jpg":"7e88d232","photos/amphibians-900.webp":"51a8aa86","photos/animals-1400.jpg":"dcc9a527","photos/animals-1400.webp":"1a4b0a47","photos/animals-900.jpg":"60cc5c00","photos/animals-900.webp":"dda4eb88","photos/arachnids-1400.jpg":"12b0e34d","photos/arachnids-1400.webp":"d25beb65","photos/arachnids-900.jpg":"ef099ac5","photos/arachnids-900.webp":"4dd4635e","photos/arthropods-1400.jpg":"f4f92c40","photos/arthropods-1400.webp":"99296886","photos/arthropods-900.jpg":"197fdd27","photos/arthropods-900.webp":"31d94ebe","photos/birds-1400.jpg":"3c08697d","photos/birds-1400.webp":"0923272a","photos/birds-900.jpg":"8ca276b8","photos/birds-900.webp":"6209d98c","photos/crustaceans-1400.jpg":"34d8f13f","photos/crustaceans-1400.webp":"42be0ce1","photos/crustaceans-900.jpg":"876209b4","photos/crustaceans-900.webp":"ed138e30","photos/dicots-1400.jpg":"26f17272","photos/dicots-1400.webp":"3fe7e757","photos/dicots-900.jpg":"d16299a8","photos/dicots-900.webp":"47c12a81","photos/draw-arachnid-1400.jpg":"a1258152","photos/draw-arachnid-1400.webp":"8ae22b34","photos/draw-arachnid-900.jpg":"4d3f5b56","photos/draw-arachnid-900.webp":"ec4a8881","photos/draw-crustacean-1400.jpg":"37bebb58","photos/draw-crustacean-1400.webp":"ed8a574a","photos/draw-crustacean-900.jpg":"47ec0fbd","photos/draw-crustacean-900.webp":"15d9a9fc","photos/draw-insect-1400.jpg":"b73bbe4b","photos/draw-insect-1400.webp":"2d5aee60","photos/draw-insect-900.jpg":"2904e64a","photos/draw-insect-900.webp":"77037921","photos/draw-myriapod-1400.jpg":"815847ab","photos/draw-myriapod-1400.webp":"0c7d377c","photos/draw-myriapod-900.jpg":"3f26528a","photos/draw-myriapod-900.webp":"d1aa5050","photos/ferns-1400.jpg":"004e5f1b","photos/ferns-1400.webp":"d9970807","photos/ferns-900.jpg":"34116c34","photos/ferns-900.webp":"59e01379","photos/finder-arachnids-1400.jpg":"261a3dcb","photos/finder-arachnids-1400.webp":"087ed0f8","photos/finder-arachnids-900.jpg":"225f6dc5","photos/finder-arachnids-900.webp":"d07169c7","photos/finder-crustaceans-1400.jpg":"28650595","photos/finder-crustaceans-1400.webp":"31c33b36","photos/finder-crustaceans-900.jpg":"e4e64c92","photos/finder-crustaceans-900.webp":"6e96fa36","photos/finder-dicots-1400.jpg":"4513e991","photos/finder-dicots-1400.webp":"b879cc4e","photos/finder-dicots-900.jpg":"77646b61","photos/finder-dicots-900.webp":"7c6e7dca","photos/finder-ferns-1400.jpg":"56fad0f1","photos/finder-ferns-1400.webp":"a07e62f2","photos/finder-ferns-900.jpg":"fd425bd4","photos/finder-ferns-900.webp":"ef66ca28","photos/finder-fish-1400.jpg":"ff32dc61","photos/finder-fish-1400.webp":"8ff6422b","photos/finder-fish-900.jpg":"2c1c413c","photos/finder-fish-900.webp":"d3b66de6","photos/finder-insects-1400.jpg":"36169ea6","photos/finder-insects-1400.webp":"1f11c60a","photos/finder-insects-900.jpg":"a69be0db","photos/finder-insects-900.webp":"27b95623","photos/finder-mammals-1400.jpg":"cd0a8935","photos/finder-mammals-1400.webp":"7c1e4ea7","photos/finder-mammals-900.jpg":"9e03e5b2","photos/finder-mammals-900.webp":"3396c801","photos/finder-monocots-1400.jpg":"63a767d9","photos/finder-monocots-1400.webp":"905c69ac","photos/finder-monocots-900.jpg":"57e649f4","photos/finder-monocots-900.webp":"33f25413","photos/finder-myriapods-1400.jpg":"6db7927f","photos/finder-myriapods-1400.webp":"0896e696","photos/finder-myriapods-900.jpg":"56f2e1c4","photos/finder-myriapods-900.webp":"d4a09e20","photos/finder-viruses-1400.jpg":"1d5f8b42","photos/finder-viruses-1400.webp":"641f10fc","photos/finder-viruses-900.jpg":"00f18f7e","photos/finder-viruses-900.webp":"21554b68","photos/fish-1400.jpg":"4d0bf2f7","photos/fish-1400.webp":"616a1463","photos/fish-900.jpg":"e3cac015","photos/fish-900.webp":"cb8f4f18","photos/flowering-1400.jpg":"2ce1fa38","photos/flowering-1400.webp":"214c1b87","photos/flowering-900.jpg":"b17fef05","photos/flowering-900.webp":"6b88c00d","photos/fungi-1400.jpg":"31bb1185","photos/fungi-1400.webp":"674ac990","photos/fungi-900.jpg":"79c0ab5c","photos/fungi-900.webp":"bd58cef2","photos/insects-1400.jpg":"0b543d75","photos/insects-1400.webp":"0b246435","photos/insects-900.jpg":"1b0327c9","photos/insects-900.webp":"c4fd6d6a","photos/linnaeus-900.jpg":"df05da6c","photos/mammals-1400.jpg":"3b97b45c","photos/mammals-1400.webp":"37063a48","photos/mammals-900.jpg":"52bc5704","photos/mammals-900.webp":"e8849a1c","photos/monocots-1400.jpg":"b0ec4169","photos/monocots-1400.webp":"e50b43ff","photos/monocots-900.jpg":"b0bae788","photos/monocots-900.webp":"822c196a","photos/myriapods-1400.jpg":"51297be6","photos/myriapods-1400.webp":"0280a2f4","photos/myriapods-900.jpg":"a153144f","photos/myriapods-900.webp":"1b748d98","photos/orange-bad-1400.jpg":"5b814c8b","photos/orange-bad-1400.webp":"6ea24857","photos/orange-bad-900.jpg":"42b0f2f8","photos/orange-bad-900.webp":"b0246a16","photos/orange-good-1400.jpg":"d3e0cd5b","photos/orange-good-1400.webp":"13977529","photos/orange-good-900.jpg":"dcf2814d","photos/orange-good-900.webp":"97ee513a","photos/peek-amoeba-900.jpg":"1c01e9c1","photos/peek-antenna-900.jpg":"4cb992ba","photos/peek-cephalothorax-900.jpg":"0a2b0f3e","photos/peek-cilia-900.jpg":"75bb2acb","photos/peek-compound-eye-900.jpg":"b80181e5","photos/peek-cotyledon-900.jpg":"9d121215","photos/peek-exoskeleton-900.jpg":"330999f8","photos/peek-feathers-900.jpg":"15aec399","photos/peek-fins-900.jpg":"2222365c","photos/peek-frond-900.jpg":"228696a2","photos/peek-gills-900.jpg":"12e28bfa","photos/peek-hyphae-900.jpg":"1231d6f9","photos/peek-moist-skin-900.jpg":"95e49ce5","photos/peek-mycelium-900.jpg":"be9af6a2","photos/peek-paramecium-900.jpg":"4e0ffff4","photos/peek-plasmodium-900.jpg":"f3de3a18","photos/peek-protein-coat-900.jpg":"8b5ad102","photos/peek-scales-900.jpg":"695e3543","photos/peek-stigma-900.jpg":"81ad7e1e","photos/peek-vascular-900.jpg":"1d3150df","photos/peek-wet-scales-900.jpg":"2c1e4d60","photos/peek-whale-tail-900.jpg":"9464e5c2","photos/peek-wing-bird-900.jpg":"be291ae6","photos/peek-wing-insect-900.jpg":"f05b84d2","photos/peek-yeast-900.jpg":"e937ab3f","photos/plants-1400.jpg":"e2b40636","photos/plants-1400.webp":"542b0595","photos/plants-900.jpg":"91937660","photos/plants-900.webp":"deede7ed","photos/prokaryotes-1400.jpg":"f9ed1b01","photos/prokaryotes-1400.webp":"52dde753","photos/prokaryotes-900.jpg":"47d3e23f","photos/prokaryotes-900.webp":"f6da0c42","photos/protoctists-1400.jpg":"396f3a07","photos/protoctists-1400.webp":"06120f98","photos/protoctists-900.jpg":"31885e7d","photos/protoctists-900.webp":"561d2e43","photos/reptiles-1400.jpg":"2d202c63","photos/reptiles-1400.webp":"b1ebf274","photos/reptiles-900.jpg":"2c2e971b","photos/reptiles-900.webp":"f26a2376","photos/vertebrates-1400.jpg":"317fda32","photos/vertebrates-1400.webp":"dfa8f365","photos/vertebrates-900.jpg":"18879421","photos/vertebrates-900.webp":"dfa53796","photos/viruses-1400.jpg":"79aa5e94","photos/viruses-1400.webp":"2fcb5bff","photos/viruses-900.jpg":"8efce99e","photos/viruses-900.webp":"9c806068","silhouettes/amphibians.svg":"bc788f0f","silhouettes/arachnids.svg":"012ecf93","silhouettes/birds.svg":"792b9c18","silhouettes/crustaceans.svg":"7265381f","silhouettes/dicots.svg":"a0e1ca0e","silhouettes/ferns.svg":"df0f21e9","silhouettes/fish.svg":"9f581b54","silhouettes/fungi.svg":"277b1b4a","silhouettes/insects.svg":"7b7b145d","silhouettes/mammals.svg":"52662340","silhouettes/monocots.svg":"cd4a4326","silhouettes/myriapods.svg":"f6c9ac32","silhouettes/prokaryotes.svg":"6c57edec","silhouettes/protoctists.svg":"106bd24b","silhouettes/reptiles.svg":"b1777d40","silhouettes/viruses.svg":"38755b67"};     /* 'photos/x.jpg' -> a short hash of its bytes */
const DOC_TIMEOUT = 3000;

/* ---------- install: take a complete, self-consistent copy ---------- */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const c = await caches.open(SHELL);
    /* cache:'reload' is not optional. A Request built from a plain string uses the default
       cache mode, so './' would come from the browser's own HTTP cache — which Pages lets it
       hold for ten minutes — while the never-before-seen ?v= urls come from the network. That
       pairs an old document with new files, which is the exact failure this worker exists to
       avoid. */
    const doc = await fetch('./', { cache: 'reload' });
    if (!doc.ok) throw new Error('index responded ' + doc.status);
    await c.put('./', doc.clone());
    await c.addAll(PRECACHE);
    /* And then check what is ACTUALLY in the cache, not what the server said. If the document
       we hold does not name this worker's own version, throw: a failed install simply never
       activates, and the lab goes on behaving exactly as it does without a worker. */
    const held = await (await c.match('./')).text();
    const m = held.match(/stations\.js\?v=(\d+)/);
    if (!m || m[1] !== VERSION) {
      await caches.delete(SHELL);
      throw new Error('cached index is v' + (m && m[1]) + ' but this worker is v' + VERSION);
    }
  })());
});

/* ---------- activate: drop this lab's old shells, and only this lab's ---------- */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys())
      if (k.indexOf(LAB + '-shell-v') === 0 && k !== SHELL) await caches.delete(k);
    /* forget pictures that are no longer in the build */
    const media = await caches.open(MEDIA);
    const want = new Set(Object.keys(MEDIA_REV).map(p => p + '?r=' + MEDIA_REV[p]));
    for (const req of await media.keys()) {
      const u = new URL(req.url);
      const rel = u.pathname.split('/assets/')[1];
      if (rel && !want.has(rel + u.search)) await media.delete(req);
    }
    /* clients.matchAll is scoped to the ORIGIN, not to this worker: both labs live on
       mompel226.github.io, so an unfiltered broadcast would pop a "newer version" banner in
       the OTHER lab's tab, whose Reload button would then do nothing for ever. */
    const cs = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const c of cs)
      if (c.url.indexOf(self.registration.scope) === 0)
        c.postMessage({ type: 'VERSION', lab: LAB, version: VERSION });
  })());
});

self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

/* ---------- fetch ---------- */
function inScope(url) { return url.href.indexOf(self.registration.scope) === 0; }

async function fromNetworkFirst(request) {
  /* the document. Online it is always the live one; offline it is the last one we held. */
  const cache = await caches.open(SHELL);
  try {
    const net = await Promise.race([
      fetch(request, { cache: 'no-store' }),
      new Promise((_, no) => setTimeout(() => no(new Error('slow')), DOC_TIMEOUT))
    ]);
    if (net && net.ok) { cache.put('./', net.clone()); return net; }
    throw new Error('document responded ' + (net && net.status));
  } catch (e) {
    const held = await cache.match('./');
    if (held) return held;
    throw e;
  }
}

async function cacheFirst(request, cacheName) {
  /* Anything unexpected in here — CacheStorage refused in a private window, quota, a bug —
     must end in an ordinary network fetch. A respondWith that rejects does not fall back to
     the network: it fails the request outright, which would be a blank lab. */
  try {
    const cache = await caches.open(cacheName);
    const hit = await cache.match(request);
    if (hit) return hit;
    const net = await fetch(request);
    if (net && net.ok && net.type === 'basic') cache.put(request, net.clone());
    return net;
  } catch (e) {
    return fetch(request);
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  /* A Range request is how Safari on iOS plays and scrubs a video. Answering one from a whole
     cached body breaks playback silently on exactly that browser, so never touch them. */
  if (req.headers.has('range')) return;
  const url = new URL(req.url);
  /* cross-origin — the Google sign-in client, the font stylesheet — is never this worker's
     business. Letting it through untouched is what keeps sign-in working. */
  if (url.origin !== location.origin || !inScope(url)) return;

  if (req.mode === 'navigate') { event.respondWith(fromNetworkFirst(req)); return; }

  const rel = url.pathname.slice(new URL(self.registration.scope).pathname.length);

  /* stamped code: the url changes whenever the file does, so the cache can never be stale */
  if (url.search.indexOf('v=') >= 0 && /\.(js|css)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(req, SHELL)); return;
  }
  /* pictures, video posters, silhouettes: keyed by a hash of their own bytes */
  if (rel.indexOf('assets/') === 0) {
    const key = rel.slice('assets/'.length);
    const rev = MEDIA_REV[key];
    if (rev) {
      const keyed = new Request(url.origin + url.pathname + '?r=' + rev, { mode: 'same-origin' });
      event.respondWith((async () => {
        try {
          const cache = await caches.open(MEDIA);
          const hit = await cache.match(keyed);
          if (hit) return hit;
          const net = await fetch(req);
          /* the put has to be held open by the event: mobile Chrome and iOS Safari stop the
             worker the moment respondWith settles, so a detached put is dropped on exactly
             the devices this is for, while working every time on a Mac. */
          if (net && net.ok && net.type === 'basic') event.waitUntil(cache.put(keyed, net.clone()));
          return net;
        } catch (e) { return fetch(req); }
      })());
      return;
    }
  }
  /* version.txt above all: it is how the page learns a deploy has happened */
  /* everything else goes straight to the network */
});
