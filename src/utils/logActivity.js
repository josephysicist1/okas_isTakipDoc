import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase/config'

/**
 * Kullanıcı aktivitesini loglar
 * @param {string} action - create, update, delete, duplicate
 * @param {string} module - works, announcements, projects, customers, users
 * @param {object} details - İşlem detayları
 */
export async function logActivity(action, module, details = {}) {
  try {
    const user = auth.currentUser
    if (!user) {
      console.warn('Log kaydedilemedi: Kullanıcı bulunamadı')
      return
    }

    await addDoc(collection(db, 'logs'), {
      action,
      module,
      details,
      userId: user.uid,
      userEmail: user.email,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error('Log kaydedilirken hata:', error)
    // Log hatası uygulamayı etkilememeli, sessizce geç
  }
}
