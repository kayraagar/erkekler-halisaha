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
- Linki kullanan herkes için ortak ve canlıya yakın veri

## Yerel çalıştırma

```bash
python3 -m http.server 4173 --directory dist
```

Ardından `http://localhost:4173` adresini açın.

## Vercel

1. Depoyu Vercel'e bağlayın.
2. Projenin **Storage** bölümünden özel erişimli bir **Blob** deposu oluşturun ve projeye bağlayın. Vercel, `BLOB_READ_WRITE_TOKEN` değişkenini otomatik ekler.
3. Deploy edin. `vercel.json`, yayın klasörünü `dist` olarak tanımlar; ek bir build komutu gerekmez.

Oyuncular, fotoğraflar, maçlar, kadrolar ve işlem geçmişi Vercel Blob üzerindeki tek ortak kayıtta tutulur. Açık istemciler yaklaşık üç saniyede bir güncellenir. Ağ veya depolama geçici olarak kullanılamazsa arayüz yerel moda geçer ve bunu üst çubukta gösterir.
