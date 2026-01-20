import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

// Firebase yapılandırmanızı buraya ekleyin
// Bu değerleri Firebase Console'dan alacaksınız
const firebaseConfig = {
  apiKey: "AIzaSyDx28KYr4ngy_qGTJvQ8ulmFsiVhsXIXEg",
  authDomain: "okas-itd-1768557071.firebaseapp.com",
  projectId: "okas-itd-1768557071",
  storageBucket: "okas-itd-1768557071.firebasestorage.app",
  messagingSenderId: "368882757379",
  appId: "1:368882757379:web:351607b6462200f7c74336"
}

// Firebase'i başlat
const app = initializeApp(firebaseConfig)

// Auth ve Firestore servislerini export et
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'europe-west1')
export default app
