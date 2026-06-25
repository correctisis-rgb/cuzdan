const CACHE_NAME = 'akilli-cuzdan-v1';
const ASSETS = [
    './',
    './index.html',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Yeni versiyon yüklendiğinde hemen devreye gir
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (event) => {
    // API çağrılarını (firebase) önbelleğe alma, doğrudan ağa gönder
    if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('identitytoolkit')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Önce önbellekte ara
            return response || fetch(event.request).then(fetchResponse => {
                // Ağdan başarılı gelirse, önbelleği güncelle (Opsiyonel)
                return fetchResponse;
            });
        })
    );
});
