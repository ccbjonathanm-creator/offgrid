/* Off-Grid Autonomie — service worker (hors-ligne + MAJ auto) */
const CACHE = 'offgrid-v7';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/geo.js',
  './js/charts.js',
  './js/questionnaire.js',
  './js/dashboard.js',
  './js/parcours.js',
  './js/calculateurs.js',
  './js/progression.js',
  './js/plan.js',
  './js/licence.js',
  './js/vendeur.js',
  './js/app.js',
  './data/modules.js',
  './data/badges.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Réseau d'abord pour le code (les MAJ arrivent seules), repli cache hors-ligne */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req, { cache: 'reload' })
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
