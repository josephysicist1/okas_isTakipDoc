import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  getDocs,
} from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth, db } from '../firebase/config'
import PasswordConfirmModal from './PasswordConfirmModal'
import './ProjectCustomerManagement.css'

function normalize(str) {
  return (str || '').toString().trim().toLowerCase()
}

async function reauthWithPassword(password) {
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.')
  }
  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)
}

function AddModal({ title, isOpen, onClose, onSubmit, initialName = '', initialCode = '' }) {
  const [name, setName] = useState(initialName)
  const [code, setCode] = useState(initialCode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setName(initialName)
    setCode(initialCode)
    setSaving(false)
    setError('')
  }, [isOpen, initialName, initialCode])

  if (!isOpen) return null

  return (
    <div className="pcm-modal-overlay" role="dialog" aria-modal="true">
      <div className="pcm-modal">
        <div className="pcm-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="pcm-modal-body">
          <div className="pcm-field">
            <label>Ad</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Aselsan"
              autoFocus
            />
          </div>
          <div className="pcm-field">
            <label>Kısaltma</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Örn: ASE"
            />
          </div>
          {error ? <div className="pcm-error">{error}</div> : null}
        </div>
        <div className="pcm-modal-actions">
          <button className="pcm-btn pcm-btn-ghost" onClick={onClose} disabled={saving}>
            İptal
          </button>
          <button
            className="pcm-btn pcm-btn-primary"
            disabled={saving}
            onClick={async () => {
              setError('')
              const safeName = name.trim()
              const safeCode = code.trim()
              if (!safeName || !safeCode) {
                setError('Lütfen ad ve kısaltma alanlarını doldurun.')
                return
              }
              try {
                setSaving(true)
                await onSubmit({ name: safeName, code: safeCode })
                onClose()
              } catch (e) {
                setError(e?.message || 'Kaydedilirken hata oluştu.')
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  searchPlaceholder,
  items,
  search,
  setSearch,
  selectedId,
  setSelectedId,
  onAddClick,
  onDeleteClick,
  addLabel,
  deleteLabel,
}) {
  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return items
    return items.filter((x) => normalize(x.name).includes(q) || normalize(x.code).includes(q))
  }, [items, search])

  return (
    <section className="pcm-section">
      <h2 className="pcm-section-title">{title}</h2>
      <div className="pcm-toolbar">
        <div className="pcm-search">
          <span className="pcm-search-icon">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="pcm-actions">
          <button className="pcm-btn pcm-btn-primary" onClick={onAddClick}>
            {addLabel}
          </button>
          <button
            className="pcm-btn pcm-btn-danger"
            onClick={onDeleteClick}
            disabled={!selectedId}
            title={selectedId ? '' : 'Silmek için önce bir kart seçin'}
          >
            {deleteLabel}
          </button>
        </div>
      </div>

      <div className="pcm-card-list">
        {filtered.map((item) => {
          const isSelected = item.id === selectedId
          return (
            <button
              key={item.id}
              type="button"
              className={`pcm-card ${isSelected ? 'is-selected' : ''}`}
              onClick={() => setSelectedId(isSelected ? null : item.id)}
            >
              <div className="pcm-card-title">
                {item.name} ({item.code})
              </div>
            </button>
          )
        })}
        {filtered.length === 0 ? (
          <div className="pcm-empty">Kayıt bulunamadı.</div>
        ) : null}
      </div>
    </section>
  )
}

export default function ProjectCustomerManagement() {
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])

  const [projectSearch, setProjectSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')

  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null) // { type: 'project'|'customer', id: string }

  useEffect(() => {
    const projectQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    const unsubProjects = onSnapshot(projectQuery, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    const customerQuery = query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    const unsubCustomers = onSnapshot(customerQuery, (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    return () => {
      unsubProjects()
      unsubCustomers()
    }
  }, [])

  const addProject = async ({ name, code }) => {
    const exists = projects.some((p) => normalize(p.code) === normalize(code))
    if (exists) throw new Error('Bu kısaltma ile zaten bir proje var.')
    await addDoc(collection(db, 'projects'), {
      name,
      code,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const addCustomer = async ({ name, code }) => {
    const exists = customers.some((c) => normalize(c.code) === normalize(code))
    if (exists) throw new Error('Bu kısaltma ile zaten bir müşteri var.')
    await addDoc(collection(db, 'customers'), {
      name,
      code,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const deleteProject = async () => {
    if (!selectedProjectId) return
    if (!window.confirm('Projeyi silmek istediğinize emin misiniz?')) return
    setPendingDelete({ type: 'project', id: selectedProjectId })
    setPasswordModalOpen(true)
  }

  const deleteCustomer = async () => {
    if (!selectedCustomerId) return
    if (!window.confirm('Müşteriyi silmek istediğinize emin misiniz?')) return
    setPendingDelete({ type: 'customer', id: selectedCustomerId })
    setPasswordModalOpen(true)
  }

  return (
    <div className="pcm-page">
      <header className="pcm-appbar">
        <button className="pcm-back" onClick={() => navigate(-1)} aria-label="Geri">
          ←
        </button>
        <div className="pcm-title">Müşteri / Proje Sayfası</div>
        <div className="pcm-right-spacer" />
      </header>

      <main className="pcm-content">
        <Section
          title="Projeler"
          searchPlaceholder="Proje Ara"
          items={projects}
          search={projectSearch}
          setSearch={setProjectSearch}
          selectedId={selectedProjectId}
          setSelectedId={setSelectedProjectId}
          onAddClick={() => setAddProjectOpen(true)}
          onDeleteClick={deleteProject}
          addLabel="Yeni Proje Ekle"
          deleteLabel="Projeyi Sil"
        />

        <Section
          title="Müşteriler"
          searchPlaceholder="Müşteri Ara"
          items={customers}
          search={customerSearch}
          setSearch={setCustomerSearch}
          selectedId={selectedCustomerId}
          setSelectedId={setSelectedCustomerId}
          onAddClick={() => setAddCustomerOpen(true)}
          onDeleteClick={deleteCustomer}
          addLabel="Yeni Müşteri Ekle"
          deleteLabel="Müşteriyi Sil"
        />
      </main>

      <AddModal
        title="Yeni Proje Ekle"
        isOpen={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        onSubmit={addProject}
      />

      <AddModal
        title="Yeni Müşteri Ekle"
        isOpen={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSubmit={addCustomer}
      />

      <PasswordConfirmModal
        isOpen={passwordModalOpen}
        title="Silme işlemini onaylamak için şifrenizi girin"
        confirmText="Sil"
        onCancel={() => {
          setPasswordModalOpen(false)
          setPendingDelete(null)
        }}
        onConfirm={async (password) => {
          try {
            await reauthWithPassword(password)
            if (pendingDelete?.type === 'project') {
              // Önce projeye ait tüm işleri sil (cascade delete)
              const worksQuery = query(
                collection(db, 'works'),
                where('projectId', '==', pendingDelete.id)
              )
              const worksSnapshot = await getDocs(worksQuery)
              
              // Tüm işleri sil
              const deletePromises = worksSnapshot.docs.map((workDoc) =>
                deleteDoc(doc(db, 'works', workDoc.id))
              )
              await Promise.all(deletePromises)
              
              // Sonra projeyi sil
              await deleteDoc(doc(db, 'projects', pendingDelete.id))
              setSelectedProjectId(null)
              
              alert(`Proje ve ${worksSnapshot.size} adet iş kaydı silindi.`)
            } else if (pendingDelete?.type === 'customer') {
              await deleteDoc(doc(db, 'customers', pendingDelete.id))
              setSelectedCustomerId(null)
            }
            setPasswordModalOpen(false)
            setPendingDelete(null)
          } catch (error) {
            if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
              throw new Error('Hatalı şifre! Silme işlemi iptal edildi.')
            }
            if (error?.code === 'auth/too-many-requests') {
              throw new Error('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.')
            }
            throw error
          }
        }}
      />
    </div>
  )
}

