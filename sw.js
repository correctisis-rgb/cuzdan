const CACHE_NAME = 'cuzdan-cache-v1';

// Arayüz dosyalarını önbelleğe alır
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Önce ağdan en güncel halini çekmeyi dener
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          // Gelen yeni veriyi önbelleğe kaydeder
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // Eğer tamamen internetsiz isek önbellekteki dosyayı gösterir
        return cachedResponse;
      });
      // Ağdan cevap gelene kadar önbellektekini göster (Stale-while-revalidate mantığı)
      return cachedResponse || fetchPromise;
    })
  );
});