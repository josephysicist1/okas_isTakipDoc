# Firebase CLI ile Proje Kurulumu

Bu rehber, Firebase projesini terminal komutlarıyla sıfırdan oluşturmanızı sağlar.

## Adım 1: Firebase'e Giriş Yapın

```bash
firebase login --reauth
```

Tarayıcı açılacak ve Firebase hesabınızla giriş yapmanız istenecek.

## Adım 2: Mevcut Projeleri Listeleyin

```bash
firebase projects:list
```

## Adım 3: Yeni Proje Oluşturun (veya Mevcut Projeyi Kullanın)

### Yeni Proje Oluşturma:
```bash
firebase projects:create okas-itd
```

### Mevcut Projeyi Kullanma:
```bash
firebase use --add
```
Bu komut size mevcut projelerinizi listeleyecek ve birini seçmenizi isteyecek.

## Adım 4: Projeyi Aktif Hale Getirin

```bash
# Proje ID'sini öğrenmek için
firebase use

# Belirli bir projeyi kullanmak için
firebase use [PROJE_ID]
```

Proje ID'sini `.firebaserc` dosyasına ekleyin veya yukarıdaki komutla otomatik eklenir.

## Adım 5: Firestore'u Başlatın

```bash
firebase init firestore
```

Sorulara şu şekilde yanıt verin:
- ✅ **What file should be used for Firestore Rules?** → `firestore.rules` (Enter)
- ✅ **What file should be used for Firestore indexes?** → `firestore.indexes.json` (Enter)

## Adım 6: Firebase Yapılandırma Bilgilerini Alın

### Yöntem 1: Firebase Console'dan

1. [Firebase Console](https://console.firebase.google.com) → Projenizi seçin
2. ⚙️ **Project Settings** → **General** sekmesi
3. **Your apps** bölümünde **Web app** ikonuna tıklayın (veya yeni bir web app ekleyin)
4. App nickname girin (örn: "okas-itd-web")
5. Config bilgilerini kopyalayın

### Yöntem 2: Firebase CLI ile (Deneysel)

```bash
# Proje bilgilerini görüntüle
firebase projects:list
```

## Adım 7: Config Dosyasını Güncelleyin

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

## Adım 8: Authentication'ı Etkinleştirin

Firebase Console'dan:
1. **Authentication** → **Sign-in method** sekmesi
2. **Email/Password** → **Enable** → **Save**

## Adım 9: Firestore Kurallarını Deploy Edin

```bash
firebase deploy --only firestore
```

## Adım 10: Uygulamayı Çalıştırın

```bash
npm install
npm run dev
```

## Hızlı Komut Referansı

```bash
# Firebase durumu
firebase use

# Projeleri listele
firebase projects:list

# Yeni proje oluştur
firebase projects:create [PROJE_ADI]

# Proje seç
firebase use [PROJE_ID]

# Firestore init
firebase init firestore

# Firestore kurallarını deploy et
firebase deploy --only firestore

# Hosting deploy (build sonrası)
npm run build
firebase deploy --only hosting

# Tüm servisleri deploy et
firebase deploy
```

## Sorun Giderme

### "Authentication Error" hatası alıyorsanız:
```bash
firebase login --reauth
```

### Proje bulunamıyor hatası:
```bash
firebase use --add
```

### Firestore init çalışmıyor:
```bash
# Önce proje seçin
firebase use [PROJE_ID]
firebase init firestore
```

## Tam Otomatik Kurulum (Tek Komut)

Tüm adımları tek seferde yapmak için:

```bash
# 1. Giriş yap
firebase login --reauth

# 2. Yeni proje oluştur (veya mevcut projeyi kullan)
firebase projects:create okas-itd
firebase use okas-itd

# 3. Firestore init (interaktif)
firebase init firestore
# firestore.rules ve firestore.indexes.json seçin

# 4. Config bilgilerini Firebase Console'dan alıp src/firebase/config.js'e ekleyin

# 5. Authentication'ı Firebase Console'dan etkinleştirin

# 6. Deploy
firebase deploy --only firestore
```
