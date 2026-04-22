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
    // Sadece GET isteklerini işle (POST veri aktarımlarında Service Worker çakışmasını önler)
    if (event.request.method !== 'GET') return;

    // Canlı Google Sheets verilerini bozmamak için Google isteklerini önbelleğe almıyoruz.
    if (event.request.url.includes('google') || event.request.url.includes('script.google.com')) {
        event.respondWith(fetch(event.request).catch(() => new Response('Çevrimdışısınız. Bağlantınızı kontrol edin.')));
        return;
    }
    
    // Diğer statik dosyalar için "Ağ Öncelikli (Network First)" stratejisi.
    // Bu sayede uygulama dosyaları önbelleğe alınır, açılış hızı ciddi oranda artar.
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return response;
            })
            .catch(() => caches.match(event.request).then(res => res || new Response('Çevrimdışısınız. Bağlantınızı kontrol edin.')))
    );
});