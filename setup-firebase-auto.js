#!/usr/bin/env node

/**
 * Firebase Otomatik Kurulum Scripti
 * Bu script Firebase projesini otomatik olarak yapılandırır
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function execCommand(command, options = {}) {
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return output;
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`❌ Hata: ${error.message}`);
      process.exit(1);
    }
    return null;
  }
}

function updateFirebaseConfig(projectId) {
  const configPath = join(__dirname, 'src', 'firebase', 'config.js');
  let configContent = readFileSync(configPath, 'utf-8');
  
  // Project ID'yi güncelle
  configContent = configContent.replace(
    /projectId:\s*"[^"]*"/,
    `projectId: "${projectId}"`
  );
  
  // Auth domain'i güncelle
  const authDomain = `${projectId}.firebaseapp.com`;
  configContent = configContent.replace(
    /authDomain:\s*"[^"]*"/,
    `authDomain: "${authDomain}"`
  );
  
  // Storage bucket'i güncelle
  const storageBucket = `${projectId}.appspot.com`;
  configContent = configContent.replace(
    /storageBucket:\s*"[^"]*"/,
    `storageBucket: "${storageBucket}"`
  );
  
  writeFileSync(configPath, configContent);
  console.log(`✅ Firebase config dosyası güncellendi: ${projectId}`);
}

async function main() {
  console.log('🔥 Firebase Otomatik Kurulum Başlatılıyor...\n');

  // 1. Firebase login kontrolü
  console.log('1️⃣ Firebase giriş durumu kontrol ediliyor...');
  try {
    execCommand('firebase login:list', { silent: true });
  } catch (error) {
    console.log('⚠️  Firebase\'e giriş yapmanız gerekiyor.');
    console.log('   Şu komutu çalıştırın: firebase login --reauth');
    process.exit(1);
  }

  // 2. Mevcut projeleri listele
  console.log('\n2️⃣ Mevcut Firebase projeleri:');
  try {
    const projects = execCommand('firebase projects:list', { silent: true });
    console.log(projects);
  } catch (error) {
    console.log('⚠️  Projeler listelenemedi. Firebase\'e giriş yapın: firebase login --reauth');
  }

  // 3. Proje seçimi veya oluşturma
  console.log('\n3️⃣ Firebase projesi yapılandırması...');
  console.log('   Mevcut bir proje kullanmak için: firebase use --add');
  console.log('   Yeni proje oluşturmak için: firebase projects:create [PROJE_ADI]');
  
  // 4. Firestore init
  console.log('\n4️⃣ Firestore başlatılıyor...');
  console.log('   Manuel olarak şu komutu çalıştırın:');
  console.log('   firebase init firestore');
  console.log('   Seçenekler:');
  console.log('   - Use an existing rules file: Yes (firestore.rules)');
  console.log('   - File: firestore.rules');
  console.log('   - Use an existing indexes file: Yes (firestore.indexes.json)');
  console.log('   - File: firestore.indexes.json');

  // 5. .firebaserc güncelleme talimatı
  console.log('\n5️⃣ Proje ID\'sini .firebaserc dosyasına ekleyin:');
  console.log('   firebase use [PROJE_ID]');

  // 6. Config dosyası güncelleme
  console.log('\n6️⃣ Firebase yapılandırma bilgileri:');
  console.log('   Firebase Console\'dan (https://console.firebase.google.com) şu bilgileri alın:');
  console.log('   - Project Settings > General > Your apps > Web app');
  console.log('   - API Key, App ID, Messaging Sender ID');
  console.log('   - Bu bilgileri src/firebase/config.js dosyasına ekleyin');

  // 7. Authentication etkinleştirme
  console.log('\n7️⃣ Authentication yapılandırması:');
  console.log('   Firebase Console > Authentication > Sign-in method');
  console.log('   - Email/Password\'u etkinleştirin');

  console.log('\n✅ Kurulum adımları tamamlandı!');
  console.log('\n📝 Sonraki adımlar:');
  console.log('   1. firebase login --reauth (gerekirse)');
  console.log('   2. firebase use --add (mevcut proje için) veya firebase projects:create [AD] (yeni proje için)');
  console.log('   3. firebase init firestore');
  console.log('   4. Firebase Console\'dan config bilgilerini alıp src/firebase/config.js\'e ekleyin');
  console.log('   5. Firebase Console\'dan Authentication\'ı etkinleştirin');
}

main().catch(console.error);
