# Yeni Gmail Hesabı ile Firebase Kurulumu

## Adım 1: Firebase'e Yeni Hesap ile Giriş Yapın

```bash
# Mevcut oturumu kapatın (gerekirse)
firebase logout

# Yeni hesap ile giriş yapın
firebase login
```

Bu komut tarayıcıyı açacak ve yeni Gmail hesabınızla giriş yapmanızı isteyecek.

## Adım 2: Yeni Proje Oluşturun

```bash
firebase projects:create okas-itd
```

Proje adını sorduğunda "okas-itd" yazın veya Enter'a basın.

## Adım 3: Projeyi Aktif Hale Getirin

```bash
firebase use okas-itd
```

## Adım 4: Firestore'u Başlatın

```bash
firebase init firestore
```

Sorulara şu şekilde yanıt verin:
- **What file should be used for Firestore Rules?** → `firestore.rules` (Enter)
- **What file should be used for Firestore indexes?** → `firestore.indexes.json` (Enter)

## Adım 5: Firebase Yapılandırma Bilgilerini Alın

1. [Firebase Console](https://console.firebase.google.com) → Yeni projenizi seçin
2. ⚙️ **Project Settings** → **General** sekmesi
3. **Your apps** bölümünde **Web app** ikonuna tıklayın (veya yeni bir web app ekleyin)
4. App nickname girin (örn: "okas-itd-web")
5. Config bilgilerini kopyalayın

## Adım 6: Config Dosyasını Güncelleyin

`src/firebase/config.js` dosyasını açın ve Firebase Console'dan aldığınız bilgileri ekleyin:

```javascript
const firebaseConfig = {
  apiKey: "AIza...", // Firebase Console'dan
  authDomain: "okas-itd.firebaseapp.com", // Proje ID'niz.firebaseapp.com
  projectId: "okas-itd", // Proje ID'niz
  storageBucket: "okas-itd.appspot.com", // Proje ID'niz.appspot.com
  messagingSenderId: "123456789", // Firebase Console'dan
  appId: "1:123456789:web:abc123" // Firebase Console'dan
}
```

## Adım 7: Authentication'ı Etkinleştirin

Firebase Console'dan:
1. **Authentication** → **Sign-in method** sekmesi
2. **Email/Password** → **Enable** → **Save**

## Adım 8: Firestore Kurallarını Deploy Edin

```bash
firebase deploy --only firestore
```

## Adım 9: Uygulamayı Çalıştırın

```bash
npm install
npm run dev
```

## Hızlı Komut Özeti

```bash
# 1. Çıkış yap (gerekirse)
firebase logout

# 2. Yeni hesap ile giriş
firebase login

# 3. Yeni proje oluştur
firebase projects:create okas-itd

# 4. Projeyi aktif hale getir
firebase use okas-itd

# 5. Firestore init
firebase init firestore

# 6. Config bilgilerini Firebase Console'dan al ve src/firebase/config.js'e ekle

# 7. Authentication'ı Firebase Console'dan etkinleştir

# 8. Deploy
firebase deploy --only firestore

# 9. Çalıştır
npm install
npm run dev
```
