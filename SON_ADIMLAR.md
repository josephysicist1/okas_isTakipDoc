# Firebase Kurulum - Son Adımlar

## ✅ Tamamlananlar
- [x] Firebase projesi oluşturuldu: `okas-itd-1768557071`
- [x] Config bilgileri eklendi

## 🔄 Yapılacaklar

### 1. Authentication'ı Etkinleştirin
Firebase Console → **Authentication** → **Sign-in method** → **Email/Password** → **Enable** → **Save**

### 2. Firestore'u Başlatın
Terminal'de:
```bash
firebase init firestore
```

Sorulara:
- **What file should be used for Firestore Rules?** → `firestore.rules` (Enter)
- **What file should be used for Firestore indexes?** → `firestore.indexes.json` (Enter)

### 3. Firestore Kurallarını Deploy Edin
```bash
firebase deploy --only firestore
```

### 4. Bağımlılıkları Yükleyin
```bash
npm install
```

### 5. Uygulamayı Çalıştırın
```bash
npm run dev
```

## 🎉 Hazır!
Uygulama çalıştığında:
- http://localhost:5173 adresinde açılacak
- Kayıt ol / Giriş yap sayfası görünecek
- Giriş yaptıktan sonra iş takip tablosu görünecek
