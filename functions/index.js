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

/**
 * Delete user - Admin only
 */
export const deleteUser = onCall({ region: 'europe-west1' }, async (request) => {
  const { auth, data } = request

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Giriş gerekli.')
  }

  // Check if caller is admin
  const callerDoc = await admin.firestore().collection('users').doc(auth.uid).get()
  const callerRole = callerDoc.data()?.role
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Bu işlem için admin yetkisi gerekli.')
  }

  const targetUid = (data?.uid || '').toString().trim()
  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'uid zorunlu.')
  }

  // Prevent self-deletion
  if (targetUid === auth.uid) {
    throw new HttpsError('invalid-argument', 'Kendi hesabınızı silemezsiniz.')
  }

  try {
    // Delete from Auth
    await admin.auth().deleteUser(targetUid)
    
    // Delete from Firestore
    await admin.firestore().collection('users').doc(targetUid).delete()

    return { success: true, uid: targetUid }
  } catch (err) {
    const code = err?.code || ''
    if (code.includes('user-not-found')) {
      throw new HttpsError('not-found', 'Kullanıcı bulunamadı.')
    }
    throw new HttpsError('internal', err?.message || 'Kullanıcı silinemedi.')
  }
})

/**
 * Update user role - Admin only
 */
export const updateUserRole = onCall({ region: 'europe-west1' }, async (request) => {
  const { auth, data } = request

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Giriş gerekli.')
  }

  // Check if caller is admin
  const callerDoc = await admin.firestore().collection('users').doc(auth.uid).get()
  const callerRole = callerDoc.data()?.role
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Bu işlem için admin yetkisi gerekli.')
  }

  const targetUid = (data?.uid || '').toString().trim()
  const newRole = (data?.role || '').toString().trim()

  if (!targetUid || !newRole) {
    throw new HttpsError('invalid-argument', 'uid ve role zorunlu.')
  }

  const allowedRoles = ['user', 'admin', 'mühendis', 'baş mühendis', 'istasyon sorumlusu']
  if (!allowedRoles.includes(newRole)) {
    throw new HttpsError('invalid-argument', `Geçersiz rol. İzin verilen roller: ${allowedRoles.join(', ')}`)
  }

  try {
    // Update custom claims
    const customClaims = newRole === 'admin' ? { admin: true } : {}
    await admin.auth().setCustomUserClaims(targetUid, customClaims)

    // Update Firestore
    await admin.firestore().collection('users').doc(targetUid).update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedByUid: auth.uid,
    })

    return { success: true, uid: targetUid, role: newRole }
  } catch (err) {
    const code = err?.code || ''
    if (code.includes('user-not-found')) {
      throw new HttpsError('not-found', 'Kullanıcı bulunamadı.')
    }
    throw new HttpsError('internal', err?.message || 'Rol güncellenemedi.')
  }
})
