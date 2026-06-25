const CACHE_NAME = 'akilli-cuzdan-v1';
const ASSETS = [
    './',
    './index.html'
    // İkonlarını veya diğer statik dosyalarını buraya ekleyebilirsin
];

// Yükleme aşaması: Dosyaları önbelleğe al
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Fetch aşaması: İnternet yoksa önbellekten getir
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Önbellekte varsa onu döndür, yoksa internetten çek
            return response || fetch(event.request).catch(() => {
                // Eğer hiçbir şey bulunamazsa (null dönerse) 
                // hata yerine boş bir yanıt veya fallback döndür
                return new Response('Çevrimdışı modda içerik bulunamadı.');
            });
        })
    );
});
