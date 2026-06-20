// Trace — service worker minimal
// Met en cache l'app shell pour un chargement rapide et un fonctionnement
// hors-ligne partiel (l'écriture/lecture de notes nécessite Supabase, donc
// le réseau, mais l'interface elle-même se charge même sans connexion).

const CACHE_NAME = 'trace-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
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
  let url;
  try { url = new URL(event.request.url); } catch (e) { return; }

  // Only handle same-origin GET requests. Let everything else (Supabase API,
  // the Supabase CDN, Google Fonts, etc.) go straight to the network.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
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
