// Trace — service worker minimal
// Met en cache l'app shell pour un chargement rapide et un fonctionnement
// hors-ligne partiel (l'écriture/lecture de notes nécessite Supabase, donc
// le réseau, mais l'interface elle-même se charge même sans connexion).

const CACHE_NAME = 'trace-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache Supabase API calls — always go to network for live data
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Network-first for the HTML shell, so updates show up quickly
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for static assets (icons, manifest)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
