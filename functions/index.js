import admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'

admin.initializeApp()

/**
 * SECURITY NOTE:
 * This callable currently allows ANY authenticated user to create users.
 * For production, restrict this to admins only (custom claims / allowlist).
 */
export const createUser = onCall({ region: 'europe-west1' }, async (request) => {
  const { auth, data } = request

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Giriş gerekli.')
  }

  const email = (data?.email || '').toString().trim()
  const password = (data?.password || '').toString()
  const displayName = (data?.displayName || '').toString().trim()
  const role = (data?.role || 'user').toString().trim()

  if (!email || !password) {
    throw new HttpsError('invalid-argument', 'email ve password zorunlu.')
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Şifre en az 6 karakter olmalı.')
  }
  const allowedRoles = ['user', 'admin', 'mühendis', 'baş mühendis', 'istasyon sorumlusu']
  if (!allowedRoles.includes(role)) {
    throw new HttpsError('invalid-argument', `Geçersiz rol. İzin verilen roller: ${allowedRoles.join(', ')}`)
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || undefined,
    })

    // optional: set custom claim
    if (role === 'admin') {
      await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true })
    }

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || null,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUid: auth.uid,
    })

    return { uid: userRecord.uid }
  } catch (err) {
    // Normalize common errors
    const code = err?.code || ''
    if (code.includes('email-already-exists')) {
      throw new HttpsError('already-exists', 'Bu e-posta zaten kayıtlı.')
    }
    throw new HttpsError('internal', err?.message || 'Kullanıcı oluşturulamadı.')
  }
})

