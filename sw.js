const CACHE_NAME = 'akilli-cuzdan-v2'; // DÜZELTME: sürüm numarası artırıldı, yeni deploy'larda da artırılmalı
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

// DÜZELTME: Bu 'activate' bloğu daha önce hiç yoktu. Bunun iki sonucu vardı:
// 1) self.clients.claim() çağrılmadığı için yeni service worker "activated" olsa bile açık
//    sekmeler ESKİ worker tarafından kontrol edilmeye devam ediyordu. index.html'deki
//    'controllerchange' dinleyicisi (sayfayı otomatik yenileyen kod) bu yüzden hiç tetiklenmiyor,
//    kullanıcı sekmeyi tamamen kapatıp yeniden açana kadar (bazı tarayıcılarda hiç) yeni sürümü
//    görmüyordu. Şimdi clients.claim() ile yeni worker hemen açık sekmelerin kontrolünü alıyor.
// 2) CACHE_NAME değiştirildiğinde eski önbellek (ör. 'akilli-cuzdan-v1') silinmeden kalıyordu.
//    Şimdi eski isimli tüm önbellekler activate sırasında temizleniyor.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
            ),
            self.clients.claim()
        ])
    );
});

// index.html tarafında postMessage({type:'SKIP_WAITING'}) gönderiliyor; burada da karşılığı
// dinlenmeli (skipWaiting zaten install'da otomatik çağrılıyor ama bu dinleyici, ileride
// "kullanıcıya sor, sonra güncelle" akışına geçilirse gerekli olacak, şimdiden ekleniyor).
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    // API çağrılarını (firebase) önbelleğe alma, doğrudan ağa gönder
    if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('identitytoolkit')) {
        return;
    }

    // DÜZELTME: index.html (ve './') için "cache-first" yerine "network-first" stratejisine
    // geçildi. Eskiden HTML de statik varlıklarla (chart.js vb.) aynı şekilde önce önbellekten
    // sunuluyordu; bu da yeni bir service worker henüz devreye girmeden önce kullanıcının hep
    // eski HTML'i görmesine sebep olabiliyordu. Ağdan çekmek başarısız olursa (offline durumu)
    // yine önbelleğe düşülüyor, böylece çevrimdışı çalışma bozulmuyor.
    const istekURL = new URL(event.request.url);
    const sayfaIstegiMi = event.request.mode === 'navigate' || istekURL.pathname.endsWith('/index.html') || istekURL.pathname === '/' || istekURL.pathname.endsWith('/');

    if (sayfaIstegiMi) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Diğer statik varlıklar (chart.js, tesseract.js vb.) için eskisi gibi cache-first devam ediyor.
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, fetchResponse.clone()));
                return fetchResponse;
            });
        })
    );
});
