# Firebase Hosting Deploy Rehberi

## ✅ Tamamlanan Adımlar
- [x] Build işlemi tamamlandı (`dist` klasörü oluşturuldu)
- [x] Firebase hosting yapılandırması mevcut (`firebase.json`)

## 🚀 Deploy Adımları

### 1. Build (Zaten Yapıldı)
```bash
npm run build
```

### 2. Firebase Hosting'e Deploy
```bash
firebase deploy --only hosting
```

Bu komut:
- `dist` klasöründeki dosyaları Firebase Hosting'e yükler
- Uygulamanızı canlıya alır
- Size bir URL verecek (örn: `https://okas-itd-1768557071.web.app`)

### 3. Deploy Sonrası

Deploy başarılı olduğunda terminal'de şöyle bir çıktı göreceksiniz:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/okas-itd-1768557071/overview
Hosting URL: https://okas-itd-1768557071.web.app
```

## 📝 Notlar

- **İlk Deploy**: İlk deploy işlemi biraz zaman alabilir (2-5 dakika)
- **Sonraki Deploy'lar**: Sadece değişen dosyalar güncellenir, daha hızlıdır
- **Custom Domain**: İsterseniz Firebase Console'dan özel domain ekleyebilirsiniz

## 🔄 Güncelleme İşlemi

Uygulamayı güncelledikten sonra tekrar deploy etmek için:

```bash
# 1. Değişiklikleri yap
# 2. Build et
npm run build

# 3. Deploy et
firebase deploy --only hosting
```

## 🛠 Sorun Giderme

### "No hosting site found" hatası alıyorsanız:
```bash
firebase init hosting
```

### Proje seçimi yapmanız gerekiyorsa:
```bash
firebase use okas-itd-1768557071
```

### Tüm servisleri deploy etmek isterseniz:
```bash
firebase deploy
```

## 📦 Package.json Scripts

Hızlı deploy için `package.json`'a eklenen scriptler:

```bash
npm run build              # Build
npm run firebase:deploy:hosting    # Sadece hosting deploy
npm run firebase:deploy    # Tüm servisleri deploy
```
