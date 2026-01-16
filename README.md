# İş Takip Tablosu

Web üzerinde çalışan, Firebase entegrasyonlu iş takip tablosu uygulaması.

## Özellikler

- ✅ Firebase Authentication (E-posta/Şifre ile giriş ve kayıt)
- ✅ Firebase Firestore veritabanı entegrasyonu
- ✅ Excel benzeri tablo arayüzü
- ✅ 18 sütunlu iş takip tablosu
- ✅ Çift tıklayarak hücre düzenleme
- ✅ Yeni satır ekleme
- ✅ Satır silme
- ✅ Gerçek zamanlı veri senkronizasyonu

## Kurulum

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Firebase CLI ile Proje Kurulumu

#### Seçenek A: Otomatik Kurulum Scripti (Önerilen)
```bash
# Firebase'e giriş yapın (gerekirse)
firebase login --reauth

# Kurulum scriptini çalıştırın
./setup-firebase.sh
```

#### Seçenek B: Manuel Kurulum

**Adım 1: Firebase'e Giriş Yapın**
```bash
firebase login --reauth
```

**Adım 2: Firebase Projesi Oluşturun veya Seçin**

Mevcut bir proje kullanmak için:
```bash
firebase use --add
```

Yeni proje oluşturmak için:
```bash
firebase projects:create [PROJE_ADI]
firebase use [PROJE_ID]
```

**Adım 3: Firestore'u Başlatın**
```bash
firebase init firestore
```
Seçenekler:
- Use an existing rules file: **Yes** → `firestore.rules`
- Use an existing indexes file: **Yes** → `firestore.indexes.json`

**Adım 4: Firebase Yapılandırma Bilgilerini Alın**

1. [Firebase Console](https://console.firebase.google.com) → Projenizi seçin
2. Project Settings (⚙️) → General → Your apps → Web app (veya yeni bir web app ekleyin)
3. Config bilgilerini kopyalayın
4. `src/firebase/config.js` dosyasındaki placeholder değerleri gerçek değerlerle değiştirin

**Adım 5: Authentication'ı Etkinleştirin**

Firebase Console → Authentication → Sign-in method → Email/Password → Enable

### 3. Uygulamayı Çalıştırın
```bash
npm run dev
```

## Firebase CLI Komutları

```bash
# Firebase'e giriş
npm run firebase:login

# Firebase projesini başlat
npm run firebase:init

# Firestore kurallarını deploy et
npm run firebase:deploy:firestore

# Hosting'i deploy et (build sonrası)
npm run build
npm run firebase:deploy:hosting

# Tüm servisleri deploy et
npm run firebase:deploy
```

## Kullanım

1. İlk kullanımda kayıt olun (e-posta ve şifre ile)
2. Giriş yaptıktan sonra iş takip tablosu görüntülenecek
3. Yeni iş eklemek için üstteki "Yeni İş Ekle" butonunu kullanın
4. Hücreleri düzenlemek için çift tıklayın
5. Satır silmek için satır başındaki çöp kutusu ikonuna tıklayın

## Sütunlar

Tablo 18 sütundan oluşmaktadır:
1. ID
2. İş Adı
3. Açıklama
4. Durum
5. Öncelik
6. Atanan Kişi
7. Başlangıç Tarihi
8. Bitiş Tarihi
9. Tahmini Süre (Saat)
10. Gerçekleşen Süre (Saat)
11. Kategori
12. Etiketler
13. Notlar
14. Dosya Linki
15. Müşteri
16. Proje
17. Bütçe
18. Tamamlanma Yüzdesi

## Teknolojiler

- React 18
- Vite
- Firebase (Authentication + Firestore)
- React Router
