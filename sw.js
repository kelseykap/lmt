// Bumping this version string forces a one-time clean break from any
// previously stuck cache. From now on the strategy below means this
// should never need to happen again via "reset site data".
const CACHE = 'lm-training-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// NETWORK-FIRST for the app shell (index.html / manifest.json):
// always try to fetch the latest version first. Only fall back to the
// cached copy if the network request fails (e.g. offline). This means
// a normal reload/reopen always picks up new deployments automatically —
// no more needing to clear site data (which also wipes localStorage).
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});
