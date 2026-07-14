// Compat yerine doğrudan modüler yapıyı kullanmak daha sağlıklıdır
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDExT8MXCnvDCckai4MPZaHyWlVb5wifVw",
  projectId: "cuzdan-99641",
  messagingSenderId: "412964017852",
  appId: "1:412964017852:web:4e8e888a81ddd29d44a2b9"
});

const messaging = firebase.messaging();

// Arka plan mesajı geldiğinde otomatik bildirim oluşturur.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Arka plan mesajı geldi ', payload);

  // DÜZELTME: Önceden "payload.notification.title" doğrudan okunuyordu. FCM'de
  // sadece "data" alanı içeren (notification alanı olmayan) mesajlar göndermek de
  // geçerli ve yaygın bir kullanımdır (ör. sessizce rozet/okundu durumu güncellemek
  // için); böyle bir mesaj geldiğinde payload.notification undefined olur ve bu satır
  // TypeError fırlatarak tüm arka plan bildirim işleyicisini sessizce çökertirdi.
  // Şimdi hem notification hem data alanından güvenli biçimde (fallback'li) okuyoruz.
  const bildirim = payload.notification || {};
  const veri = payload.data || {};
  const notificationTitle = bildirim.title || veri.title || 'Yeni bildirim';
  const notificationBody = bildirim.body || veri.body || '';

  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png', // DÜZELTME: boş string yerine gerçek bir ikon yolu; projenizdeki
                            // gerçek ikon dosyasının yoluyla değiştirin.
    badge: '/icon-192.png',
    // DÜZELTME: "tag" verilmediğinde art arda gelen her bildirim ayrı ayrı yığılıyordu.
    // Aynı konudaki bildirimleri (ör. aynı sohbet/ticket) tek bildirimde güncellemek için
    // sunucu tarafında payload.data.tag gönderiliyorsa onu kullan, yoksa zaman damgasıyla
    // benzersiz kalsın (yığılmayı istemiyorsanız sabit bir tag kullanabilirsiniz).
    tag: veri.tag || undefined,
    // DÜZELTME: notificationclick işleyicisinde hangi URL'nin açılacağını belirlemek için
    // veriyi bildirim nesnesine taşıyoruz.
    data: { url: veri.url || '/' }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// DÜZELTME: Önceden bildirime tıklandığında hiçbir şey olmuyordu (ne uygulama açılıyor
// ne de var olan sekmeye odaklanıyordu). Artık: uygulama zaten açık bir sekmede ise ona
// odaklanıyor, değilse yeni bir sekmede açıyor.
self.addEventListener('notificationclick', (event) => {
  const hedefUrl = (event.notification.data && event.notification.data.url) || '/';
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(hedefUrl);
      }
    })
  );
});
