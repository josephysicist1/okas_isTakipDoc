#!/bin/bash

# Firebase Kurulum Scripti
echo "🔥 Firebase Projesi Kurulumu Başlatılıyor..."
echo ""

# 1. Firebase'e giriş yap (eğer giriş yapılmamışsa)
echo "1️⃣ Firebase'e giriş yapılıyor..."
firebase login --reauth

# 2. Mevcut projeleri listele
echo ""
echo "2️⃣ Mevcut Firebase projeleri listeleniyor..."
firebase projects:list

# 3. Yeni proje oluştur veya mevcut projeyi seç
echo ""
echo "3️⃣ Firebase projesi seçiliyor..."
echo "Mevcut bir proje kullanmak için: firebase use --add"
echo "Yeni proje oluşturmak için: firebase projects:create [PROJE_ADI]"
echo ""
read -p "Mevcut bir proje kullanmak istiyor musunuz? (e/h): " use_existing

if [ "$use_existing" = "e" ] || [ "$use_existing" = "E" ]; then
    firebase use --add
else
    read -p "Yeni proje adını girin: " project_name
    firebase projects:create "$project_name"
    firebase use "$project_name"
fi

# 4. Firestore'u başlat
echo ""
echo "4️⃣ Firestore Database başlatılıyor..."
firebase init firestore --project $(firebase use | grep -oP '(?<=\()[^)]+')

# 5. Authentication'ı etkinleştir (Firebase Console'dan manuel olarak yapılmalı)
echo ""
echo "5️⃣ Authentication yapılandırması..."
echo "⚠️  Lütfen Firebase Console'dan Authentication'ı etkinleştirin:"
echo "   - Firebase Console > Authentication > Sign-in method"
echo "   - Email/Password'u etkinleştirin"
echo ""

# 6. Firebase config bilgilerini al
echo "6️⃣ Firebase yapılandırma bilgileri alınıyor..."
PROJECT_ID=$(firebase use | grep -oP '(?<=\()[^)]+')
echo ""
echo "✅ Firebase Proje ID: $PROJECT_ID"
echo ""
echo "📝 Şimdi Firebase Console'dan (https://console.firebase.google.com) şu bilgileri alın:"
echo "   1. API Key"
echo "   2. Auth Domain"
echo "   3. Project ID: $PROJECT_ID"
echo "   4. Storage Bucket"
echo "   5. Messaging Sender ID"
echo "   6. App ID"
echo ""
echo "Bu bilgileri src/firebase/config.js dosyasına ekleyin."
echo ""
echo "✅ Kurulum tamamlandı!"
