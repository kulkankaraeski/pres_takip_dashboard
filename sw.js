const CACHE_NAME = 'pres-takip-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-512.png'
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
    if (event.request.url.includes('google') || event.request.url.includes('script.google.com') || event.request.url.includes('allorigins')) {
        return; // event.respondWith ÇAĞRILMAZ, tarayıcı isteği normal şekilde yapar ve CORS hataları index.html'de yakalanır.
    }

    // 'chrome-extension' gibi HTTP olmayan protokolleri yoksay
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    const url = new URL(event.request.url);
    
    // Sabit dış kütüphaneler ve fontlar için "Önce Önbellek (Cache First)" stratejisi
    if (url.hostname.includes('cdn.tailwindcss.com') || url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                    return networkResponse;
                });
            })
        );
        return;
    }
    
    // Kendi uygulama dosyalarınız (index.html, vs.) için "Ağ Öncelikli (Network First)" stratejisi.
    event.respondWith(
        (async () => {
            if (event.preloadResponse) {
                const preloadRes = await event.preloadResponse;
                if (preloadRes) return preloadRes;
            }
            return fetch(event.request).then(response => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return response;
            }).catch(() => caches.match(event.request).then(res => res || new Response('Çevrimdışısınız. Bağlantınızı kontrol edin.')));
        })()
    );
});