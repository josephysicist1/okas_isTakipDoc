import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase/config'
import './UserManagement.css'

function normalize(str) {
  return (str || '').toString().trim().toLowerCase()
}

function AddUserModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('user')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setEmail('')
    setPassword('')
    setDisplayName('')
    setRole('user')
    setShowPassword(false)
    setSaving(false)
    setError('')
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="pcm-modal-overlay" role="dialog" aria-modal="true">
      <div className="um-modal">
        <div className="um-modal-header">
          <h3>Yeni Kullanıcı Ekle</h3>
        </div>
        <div className="um-modal-body">
          <div className="um-field">
            <label>E-posta</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              type="email"
              autoFocus
            />
          </div>
          <div className="um-field">
            <label>Şifre</label>
            <div className="um-password-row">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
              />
              <button
                type="button"
                className="um-toggle"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? 'Gizle' : 'Göster'}
              </button>
            </div>
            <div className="um-hint">Minimum 6 karakter önerilir.</div>
          </div>
          <div className="um-field">
            <label>Ad Soyad (Opsiyonel)</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Örn: Yusuf Gök"
            />
          </div>
          <div className="um-field">
            <label>Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="um-select">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>

          {error ? <div className="um-error">{error}</div> : null}
        </div>
        <div className="um-modal-actions">
          <button className="um-btn um-btn-ghost" onClick={onClose} disabled={saving}>
            İptal
          </button>
          <button
            className="um-btn um-btn-primary"
            disabled={saving}
            onClick={async () => {
              setError('')
              const safeEmail = email.trim()
              const safePassword = password
              const safeDisplayName = displayName.trim()

              if (!safeEmail || !safePassword) {
                setError('Lütfen e-posta ve şifre alanlarını doldurun.')
                return
              }
              if (safePassword.length < 6) {
                setError('Şifre en az 6 karakter olmalı.')
                return
              }

              try {
                setSaving(true)
                const createUser = httpsCallable(functions, 'createUser')
                await createUser({
                  email: safeEmail,
                  password: safePassword,
                  displayName: safeDisplayName || null,
                  role,
                })
                onClose()
              } catch (e) {
                const code = e?.code ? String(e.code) : ''
                const detailsMsg =
                  typeof e?.details === 'string'
                    ? e.details
                    : e?.details?.message
                      ? String(e.details.message)
                      : ''
                const msg = `${code ? `${code}: ` : ''}${detailsMsg || e?.message || 'Kullanıcı eklenirken hata oluştu.'}`
                setError(msg + ' (Functions deploy edildi mi?)')
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return users
    return users.filter(
      (u) =>
        normalize(u.email).includes(q) ||
        normalize(u.displayName).includes(q) ||
        normalize(u.role).includes(q)
    )
  }, [users, search])

  return (
    <div className="um-page">
      <header className="um-appbar">
        <button className="um-back" onClick={() => navigate(-1)} aria-label="Geri">
          ←
        </button>
        <div className="um-title">Kullanıcı Yönetimi</div>
        <div className="um-right-spacer" />
      </header>

      <main className="um-content">
        <section className="um-section">
          <h2 className="um-section-title">Kullanıcılar</h2>

          <div className="um-toolbar">
            <div className="um-search">
              <span className="um-search-icon">🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kullanıcı Ara" />
            </div>
            <div className="um-actions">
              <button className="um-btn um-btn-primary" onClick={() => setAddOpen(true)}>
                Yeni Kullanıcı Ekle
              </button>
            </div>
          </div>

          <div className="um-card-list">
            {filtered.map((u) => (
              <div key={u.id} className="um-card">
                <div className="um-card-title">{u.displayName || u.email || '—'}</div>
                <div className="um-card-sub">
                  <span className="um-chip">{u.role || 'user'}</span>
                  <span className="um-email">{u.email || ''}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 ? <div className="um-empty">Kayıt bulunamadı.</div> : null}
          </div>
        </section>
      </main>

      <AddUserModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

