# Akıllı Cüzdan

Gelir ve gider takibi, hesap ve kart bakiyeleri, taksitler, düzenli ödemeler ve raporlar için Türkçe kişisel bütçe uygulaması.

## Özellikler

- Gelir, gider ve taksit işlemleri
- Kategori ve hesap bazında takip
- Aylık grafikler ve PDF/Excel dışa aktarma
- Tekrarlayan ödemeler ve abonelik takibi
- Çevrimdışı kullanım ve cihazlar arası senkronizasyon
- Telefon, masaüstü ve QR ile salt okunur ekran bağlantısı

## Geliştirme

Uygulama statik bir web uygulamasıdır. `index.html` ana arayüzü ve uygulama kodunu içerir; Firebase kimlik doğrulaması ve veritabanı bağlantısı bu sayfada yapılandırılmıştır. Chart.js, jsPDF ve QR araçları CDN üzerinden yüklenir.

Yerel geliştirme için depoyu klonlayıp kök klasörü bir statik HTTP sunucusuyla açın. Örneğin Python kuruluysa:

```sh
python -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın. Firebase özelliklerini kullanmak için projeye ait Firebase yapılandırması ve güvenlik kuralları gerekir.

## Dağıtım

Depo, GitHub Pages ile statik olarak yayınlanabilecek şekilde düzenlenmiştir. Service worker ve manifest dosyaları PWA kurulumunu ve çevrimdışı desteği sağlar.
