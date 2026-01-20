import React, { useEffect, useState } from 'react'
import './PasswordConfirmModal.css'

export default function PasswordConfirmModal({
  isOpen,
  title = 'Silme işlemini onaylamak için şifrenizi girin',
  confirmText = 'Onayla',
  cancelText = 'İptal',
  onCancel,
  onConfirm,
}) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setPassword('')
    setShow(false)
    setSubmitting(false)
    setError('')
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="pcm-modal-overlay" role="dialog" aria-modal="true">
      <div className="pcf-modal">
        <div className="pcf-header">
          <h3>{title}</h3>
        </div>

        <div className="pcf-body">
          <div className="pcf-field">
            <label>Şifre</label>
            <div className="pcf-password-row">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
              <button
                type="button"
                className="pcf-toggle"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
                title={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {show ? 'Gizle' : 'Göster'}
              </button>
            </div>
            <div className="pcf-hint">İsterseniz “Göster” ile şifreyi görünür yapabilirsiniz.</div>
          </div>

          {error ? <div className="pcf-error">{error}</div> : null}
        </div>

        <div className="pcf-actions">
          <button className="pcf-btn pcf-btn-ghost" onClick={onCancel} disabled={submitting}>
            {cancelText}
          </button>
          <button
            className="pcf-btn pcf-btn-primary"
            disabled={submitting}
            onClick={async () => {
              setError('')
              if (!password) {
                setError('Lütfen şifrenizi girin.')
                return
              }
              try {
                setSubmitting(true)
                await onConfirm(password)
              } catch (e) {
                setError(e?.message || 'İşlem sırasında hata oluştu.')
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {submitting ? 'Onaylanıyor...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

