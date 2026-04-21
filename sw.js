const CACHE_NAME = 'pres-takip-v1';

self.addEventListener('install', event => {
    self.skipWaiting(); // Beklemeden hemen kur
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim()); // Hemen kontrolü ele al
});

self.addEventListener('fetch', event => {
    // PWA şartını sağlamak için boş bir fetch dinleyicisi ekliyoruz.
    // Canlı Google Sheets verilerini bozmamak için dosyaları her zaman internetten çekiyoruz.
    event.respondWith(
        fetch(event.request).catch(() => 
            new Response('Çevrimdışısınız. Bağlantınızı kontrol edin.')
        )
    );
});