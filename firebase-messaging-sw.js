importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDExT8MXCnvDCckai4MPZaHyWlVb5wifVw",
  projectId: "cuzdan-99641",
  messagingSenderId: "412964017852",
  appId: "1:412964017852:web:4e8e888a81ddd29d44a2b9"
});

const messaging = firebase.messaging();

// Arka plan mesajlarını yakala (uygulama kapalıyken)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Arka plan mesajı geldi ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Varsa bir logo ekleyebilirsiniz
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
