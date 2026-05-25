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
            (async () => {
                try {
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) return cachedResponse;
                    const networkResponse = await fetch(event.request);
                    // Sadece başarılı (200 OK) veya Opak (0) HTTP yanıtlarını önbelleğe al (404/500 gibi hataları engeller)
                    if (networkResponse && (networkResponse.ok || networkResponse.status === 0)) {
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (error) {
                    console.
            })()
        );
        return;
    }
    
    // Kendi uygulama dosyalarınız (index.html, vs.) için "Ağ Öncelikli (Network First)" stratejisi.
    event.respondWith(
        (async () => {
            try {
                const preloadResponse = await event.preloadResponse;
                if (preloadResponse) {
                    return preloadResponse;
                }
                const networkResponse = await fetch(event.request);
                if (networkResponse && (networkResponse.ok || networkResponse.status === 0)) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            } catch (error) {
                console.warn('SW: Ağ isteği başarısız, önbellek deneniyor.', event.request.url);
                try {
                    // ignoreSearch parametresi "?tab=haftalik" gibi ekleri görmezden gelerek çevrimdışı yüklemeyi kurtarır
                    const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
                    if (cachedResponse) return cachedResponse;
                } catch (e) {
                    console.w
                return new Re
                    statusText/plain;charset=utf-8' })
                });
            }
        })()
    );
});