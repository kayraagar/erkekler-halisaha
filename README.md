# ERKEKLER

Arkadaş grupları için Ultimate Team tarzında, Türkçe halı saha kadro yönetim uygulaması.

## Özellikler

- Oyuncu ve yetenek puanı yönetimi
- Mevkiye göre otomatik overall hesabı
- Fotoğraf yükleme, kırpma ve konumlandırma
- Sürükle-bırak kadro oluşturma
- 6'ya 6, 7'ye 7 ve 8'e 8 formatları
- Kilitli oyuncuları koruyan dengeli takım oluşturma
- Maç arşivi ve işlem geçmişi
- Tarayıcıda kalıcı kayıt

## Yerel çalıştırma

```bash
python3 -m http.server 4173 --directory dist
```

Ardından `http://localhost:4173` adresini açın.

## Vercel

Depoyu Vercel'e bağlayıp **Deploy** demeniz yeterlidir. `vercel.json`, yayın klasörünü `dist` olarak tanımlar; ek bir build komutu gerekmez.

> Oyuncu ve maç verileri tarayıcının `localStorage` alanında tutulur. Bu nedenle farklı cihaz ve tarayıcılar arasında otomatik eşitlenmez.
