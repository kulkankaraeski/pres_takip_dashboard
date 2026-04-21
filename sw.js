const CACHE_NAME = 'pres-takip-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // Eski önbellekleri temizleyerek depolama alanını optimize et
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // PWA şartını sağlamak için boş bir fetch dinleyicisi ekliyoruz.
    // Canlı Google Sheets verilerini bozmamak için dosyaları her zaman internetten çekiyoruz.
    event.respondWith(fetch(event.request).catch(() => new Response('Çevrimdışısınız. Bağlantınızı kontrol edin.')));
});