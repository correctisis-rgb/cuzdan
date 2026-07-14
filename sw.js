const CACHE_NAME = 'akilli-cuzdan-v3'; // DÜZELTME: sürüm numarası artırıldı (v2 -> v3, aşağıdaki clone/race düzeltmesi için), yeni deploy'larda da artırılmalı
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
                    // DÜZELTME: "Failed to execute 'clone' on 'Response': Response body is
                    // already used" hatası burada bir YARIŞ DURUMUNDAN kaynaklanıyordu. Önceden
                    // clone() işlemi caches.open(...).then(...) İÇİNDE, yani ASENKRON olarak
                    // yapılıyordu; ama networkResponse hemen (senkron) return ediliyor ve tarayıcı
                    // sayfayı çizmek için body'yi okumaya hemen başlıyordu. caches.open() birkaç
                    // milisaniye bile gecikse, clone() çalıştığında body artık "kullanılmış"
                    // (bodyUsed) oluyor ve hata veriyordu — bu yüzden bazen oluşuyor bazen
                    // oluşmuyordu (klasik yarış durumu belirtisi). Şimdi clone() response daha
                    // döndürülmeden, İLK İŞ olarak senkron şekilde yapılıyor; önbelleğe yazma
                    // klonlanmış kopya üzerinden, ayrı ve bağımsız olarak yürüyor.
                    const cacheKopyasi = networkResponse.clone();
                    // Cache API sadece GET isteklerini destekliyor; başka bir metodla (nadiren
                    // olsa da) buraya düşülürse cache.put() "unsupported method" hatası fırlatıp
                    // yakalanmamış (unhandled) bir promise reddi olarak konsolu kirletiyordu.
                    // .catch() ile bu tür hatalar artık sessizce yutuluyor (önbellekleme best-
                    // effort'tur, başarısız olması sayfanın çalışmasını engellememeli).
                    if (event.request.method === 'GET') {
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, cacheKopyasi))
                            .catch((e) => console.warn('SW: sayfa önbelleğe yazılamadı:', e.message));
                    }
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
                // DÜZELTME: Aynı yarış durumu (bkz. yukarıdaki sayfa isteği bloğundaki not) burada
                // da vardı; aynı şekilde clone() İLK İŞ olarak senkron yapılıyor ve önbelleğe
                // yazma hatası artık sessizce yutuluyor.
                const cacheKopyasi = fetchResponse.clone();
                if (event.request.method === 'GET') {
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.put(event.request, cacheKopyasi))
                        .catch((e) => console.warn('SW: statik varlık önbelleğe yazılamadı:', e.message));
                }
                return fetchResponse;
            });
        })
    );
});
