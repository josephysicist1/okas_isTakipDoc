import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import PasswordConfirmModal from './PasswordConfirmModal'
import './LogRecords.css'

const ACTION_LABELS = {
  create: 'Ekleme',
  update: 'Güncelleme',
  delete: 'Silme',
  duplicate: 'Çoğaltma',
}

const MODULE_LABELS = {
  works: 'İş Tablosu',
  announcements: 'Duyurular',
  projects: 'Projeler',
  customers: 'Müşteriler',
  users: 'Kullanıcılar',
}

const SUMMARY_LABELS = {
  mainCustomerName: 'Ana Müşteri',
  customerName: 'Müşteri',
  partNumber: 'Parça No',
  waybillNo: 'İrsaliye No',
  arrivalDate: 'Geliş Tarihi',
  waitingTime: 'Bekleme Süresi',
  deliveryDate1: 'Termin 1',
  poNo: 'Sipariş No',
  finishCode: 'İşlem Kodu',
}

function LogRecords() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('all')
  const [filterModule, setFilterModule] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState(null)

  useEffect(() => {
    // Kullanıcı rolünü kontrol et
    const checkUserRole = async () => {
      const user = auth.currentUser
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setIsAdmin(userData.role === 'admin')
          }
        } catch (error) {
          console.error('Kullanıcı rolü alınırken hata:', error)
        }
      }
    }
    checkUserRole()

    const logsQuery = query(
      collection(db, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(200)
    )

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      setLogs(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Tüm kullanıcıları çek
    const usersQuery = query(collection(db, 'users'))
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      }))
      setUsers(usersData)
    })

    return () => unsubscribe()
  }, [])

  const userOptions = useMemo(() => {
    return users
      .map((u) => u.email)
      .filter((email) => email) // Boş email'leri filtrele
      .sort((a, b) => String(a).localeCompare(String(b), 'tr'))
  }, [users])

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false
    if (filterModule !== 'all' && log.module !== filterModule) return false
    if (filterUser !== 'all' && log.userEmail !== filterUser) return false
    return true
  })

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Bu log kaydını silmek istediğinize emin misiniz?')) {
      return
    }
    setPendingDeleteLogId(logId)
    setPasswordModalOpen(true)
  }

  const formatTimestamp = (ts) => {
    if (!ts) return '-'
    if (typeof ts?.toDate === 'function') {
      return new Date(ts.toDate()).toLocaleString('tr-TR')
    }
    if (ts instanceof Date) {
      return ts.toLocaleString('tr-TR')
    }
    return '-'
  }

  const toShortId = (id) => {
    if (!id) return null
    const s = String(id)
    return s.length > 10 ? `${s.slice(0, 10)}…` : s
  }

  const normalizeDetails = (log) => {
    const d = log?.details || {}
    // Eski format desteği: { field, value } veya { action: '...' }
    if (log?.action === 'update' && d.field && (d.newValue === undefined && d.oldValue === undefined)) {
      return {
        ...d,
        fieldLabel: d.fieldLabel || d.field,
        oldValue: d.oldValue ?? '-',
        newValue: d.newValue ?? d.value ?? '-',
      }
    }
    if (!d.summary && d.action && typeof d.action === 'string') {
      return { ...d, message: d.action }
    }
    return d
  }

  const formatDetails = (log) => {
    const d = normalizeDetails(log)
    const moduleLabel = MODULE_LABELS[log?.module] || log?.module || '-'
    if (!d || Object.keys(d).length === 0) return <span className="logs-muted">-</span>

    const isUpdate = log.action === 'update'
    const isCreate = log.action === 'create'
    const isDelete = log.action === 'delete'
    const isDuplicate = log.action === 'duplicate'

    const targetId = d.workDocId || d.docId || d.id
    const shortTargetId = toShortId(targetId)
    const workNo = d.workNo

    const summaryPairs = d.summary
      ? Object.entries(d.summary)
          .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
          .map(([k, v]) => `${SUMMARY_LABELS[k] || k}: ${v}`)
      : []

    const primaryLine = (() => {
      if (isUpdate) {
        const fieldLabel = d.fieldLabel || d.field || 'Alan'
        return `Satır güncellendi • ${fieldLabel}`
      }
      if (isCreate) return 'Yeni satır eklendi'
      if (isDelete) return 'Satır silindi'
      if (isDuplicate) return 'Satır çoğaltıldı'
      return d.message || d.action || 'İşlem'
    })()

    return (
      <div className="logs-detail">
        <div className="logs-detail-title">
          <span className="logs-detail-primary">{primaryLine}</span>
          <span className="logs-detail-secondary">
            {moduleLabel}
            {workNo ? (
              <span className="logs-pill">İş No: {workNo}</span>
            ) : shortTargetId ? (
              <span className="logs-pill">ID: {shortTargetId}</span>
            ) : null}
          </span>
        </div>

        {isUpdate ? (
          <div className="logs-detail-grid">
            <div className="logs-detail-row">
              <span className="logs-detail-k">Önce</span>
              <span className="logs-detail-v logs-old">{d.oldValue ?? '-'}</span>
            </div>
            <div className="logs-detail-row">
              <span className="logs-detail-k">Sonra</span>
              <span className="logs-detail-v logs-new">{d.newValue ?? '-'}</span>
            </div>
          </div>
        ) : null}

        {summaryPairs.length ? (
          <div className="logs-summary">
            {summaryPairs.slice(0, 4).map((t) => (
              <span key={t} className="logs-summary-pill">
                {t}
              </span>
            ))}
          </div>
        ) : null}

        {isDuplicate && d.sourceWorkDocId && d.workDocId ? (
          <div className="logs-dup">
            <span className="logs-detail-k">Kopya</span>
            <span className="logs-detail-v logs-mono">
              {toShortId(d.sourceWorkDocId)} → {toShortId(d.workDocId)}
            </span>
          </div>
        ) : null}

        {/* Gelişmiş görünüm (debug / eski kayıtlar) */}
        <details className="logs-raw">
          <summary>Ham detay</summary>
          <pre>{JSON.stringify(d, null, 2)}</pre>
        </details>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="logs-page">
        <div className="logs-appbar">
          <button className="logs-back" onClick={() => navigate('/')}>
            ←
          </button>
          <div className="logs-title">Log Kayıtları</div>
          <div className="logs-right-spacer"></div>
        </div>
        <div className="logs-content">
          <div className="logs-loading">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="logs-page">
      <div className="logs-appbar">
        <button className="logs-back" onClick={() => navigate('/')}>
          ←
        </button>
        <div className="logs-title">Log Kayıtları</div>
        <div className="logs-right-spacer"></div>
      </div>

      <div className="logs-content">
        <div className="logs-filters">
          <div className="logs-filter">
            <label>İşlem Türü:</label>
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              <option value="all">Tümü</option>
              <option value="create">Ekleme</option>
              <option value="update">Güncelleme</option>
              <option value="delete">Silme</option>
              <option value="duplicate">Çoğaltma</option>
            </select>
          </div>

          <div className="logs-filter">
            <label>Modül:</label>
            <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
              <option value="all">Tümü</option>
              <option value="works">İş Tablosu</option>
              <option value="announcements">Duyurular</option>
              <option value="projects">Projeler</option>
              <option value="customers">Müşteriler</option>
              <option value="users">Kullanıcılar</option>
            </select>
          </div>

          <div className="logs-filter">
            <label>Kullanıcı:</label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="all">Tümü</option>
              {userOptions.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="logs-stats">
          <span className="logs-count">Toplam {filteredLogs.length} kayıt</span>
        </div>

        <div className="logs-table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Tarih/Saat</th>
                <th>İşlem</th>
                <th>Modül</th>
                <th>Kullanıcı</th>
                <th>Detaylar</th>
                {isAdmin && <th>İşlemler</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? "6" : "5"} className="logs-empty">
                    Kayıt bulunamadı
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id} style={{ '--row-index': idx }}>
                    <td className="logs-timestamp">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td>
                      <span className={`logs-action-badge action-${log.action}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td>
                      <span className="logs-module">{MODULE_LABELS[log.module] || log.module}</span>
                    </td>
                    <td className="logs-user">{log.userEmail || 'Bilinmiyor'}</td>
                    <td className="logs-details">{formatDetails(log)}</td>
                    {isAdmin && (
                      <td className="logs-actions">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="log-delete-btn"
                          title="Log Kaydını Sil"
                        >
                          Sil
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PasswordConfirmModal
        isOpen={passwordModalOpen}
        title="Log kaydını silmek için şifrenizi girin"
        confirmText="Sil"
        onCancel={() => {
          setPasswordModalOpen(false)
          setPendingDeleteLogId(null)
        }}
        onConfirm={async (password) => {
          try {
            if (!pendingDeleteLogId) {
              throw new Error('Silinecek log kaydı seçilemedi.')
            }

            const user = auth.currentUser
            if (!user || !user.email) {
              throw new Error('Kullanıcı bilgisi bulunamadı.')
            }

            // Şifre doğrulama
            const credential = EmailAuthProvider.credential(user.email, password)
            await reauthenticateWithCredential(user, credential)

            // Log kaydını sil
            const logRef = doc(db, 'logs', pendingDeleteLogId)
            await deleteDoc(logRef)

            setPasswordModalOpen(false)
            setPendingDeleteLogId(null)
          } catch (error) {
            console.error('Log kaydı silinirken hata:', error)
            if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
              throw new Error('Hatalı şifre!')
            }
            throw new Error(error?.message || 'Log kaydı silinemedi.')
          }
        }}
      />
    </div>
  )
}

export default LogRecords
