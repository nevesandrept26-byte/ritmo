/* RITMO · Service worker: cache dos ficheiros locais para utilização offline. */
const CACHE_NAME = 'ritmo-shell-v14';
const APP_FILES = [
  './', './index.html', './manifest.webmanifest', './sw.js', './install-qwen3.5-4b.bat',
  './assets/icons/ritmo.svg',
  './assets/css/variables.css', './assets/css/base.css', './assets/css/layout.css',
  './assets/css/components.css', './assets/css/responsive.css', './assets/css/gym.css', './assets/css/library-reader.css', './assets/css/nutrition.css', './assets/css/gamification.css', './assets/css/planner-recovery.css', './assets/css/suite.css',
  './assets/js/core.js', './assets/js/gamification.js', './assets/js/navigation.js', './assets/js/dashboard.js',
  './assets/js/bible-reader.js', './assets/js/faith.js', './assets/js/gym.js', './assets/js/discipline.js',
  './assets/js/habits.js', './assets/js/nutrition.js', './assets/js/recovery.js', './assets/js/planner.js', './assets/js/journal.js',
  './assets/js/insights.js', './assets/js/records.js', './assets/js/backup.js', './assets/js/suite.js', './assets/js/app.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('ritmo-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Não guardar respostas da API: pesquisas e análises devem ir sempre ao servidor.
  if (new URL(event.request.url).pathname.startsWith('/api/')) return;
  const requestUrl = new URL(event.request.url);
  if (event.request.destination === 'image' && requestUrl.hostname === 'raw.githubusercontent.com' && requestUrl.pathname.startsWith('/yuhonas/free-exercise-db/')) {
    event.respondWith(caches.open('ritmo-exercise-images-v1').then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    if (requestUrl.origin === self.location.origin) caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
