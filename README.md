# İş Takip Tablosu

Web üzerinde çalışan, Firebase entegrasyonlu iş takip tablosu uygulaması.

## Özellikler

- ✅ Firebase Authentication (E-posta/Şifre ile giriş ve kayıt)
- ✅ Firebase Firestore veritabanı entegrasyonu
- ✅ Excel benzeri tablo arayüzü
- ✅ 27 sütunlu iş takip tablosu
- ✅ Çift tıklayarak hücre düzenleme
- ✅ Yeni satır ekleme
- ✅ Güvenli satır silme (şifre doğrulama gerekli)
- ✅ Kullanıcı Yönetimi (Firebase Auth + Firestore)
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
3. Yeni iş eklemek için üstteki "Yeni İş Ekle" butonunu kullanın veya tablonun ilk satırındaki "Kaydet" butonunu kullanın
4. Hücreleri düzenlemek için çift tıklayın (değişiklikler otomatik kaydedilir)
5. Satır silmek için satır başındaki çöp kutusu ikonuna tıklayın
   - **Güvenlik:** Silme işlemi için şifrenizi girmeniz gerekecek
   - Bu, yanlışlıkla silme işlemlerini önler
6. Kullanıcı eklemek için "Kullanıcı Yönetimi" sayfasına gidin
   - Yeni kullanıcılar **Firebase Auth** üzerinde oluşturulur
   - Aynı zamanda **Firestore `users`** koleksiyonuna profil kaydı yazılır

## Sütunlar

Tablo 27 sütundan oluşmaktadır:
1. Geliş Tarihi(Arrival Date)
2. Beklediği Süre(Waiting Time)
3. Termin tarihi_1/ Delivery date_1
4. Termin tarihi_2/ Delivery date_2
5. Termin tarihi_3/ Delivery date_3
6. Ana Müşteri Adı/ Main customer name
7. Müşteri Adı/ Customer name
8. İrsaliye no/ Waybill no
9. Parça Numarası/ Part Number
10. FAI/ Seri
11. Yapılacak işlem/ Finish code
12. GKR no
13. Sipariş no/ PO no
14. IEM
15. TAI SOIR no
16. Miktar/ Qty
17. TAI sipariş no/ TAI po no
18. Müşteri onayı/ Cust. approved
19. Sipariş gözden geçirildi mi?/ Order req. Reviewed (Kapasite yeterli mi? Satınalma ihtiyacı var mı?
20. Seri no var mı veya kritik mi Y/N/ Part traceable or critial? Varsa seri no kaydet/ if applicable record serial no.
21. Notes/ Notlar
22. ÜTF Hazırlayan/ Prepared by
23. ÜTF tarihi/ Date of prs
24. NCPR no/ Uygunsuzluk n, Ex or In
25. Hazır/ Finished
26. Denetim isteme
27. Satıldı/ Sold

## Teknolojiler

- React 18
- Vite
- Firebase (Authentication + Firestore)
- React Router
