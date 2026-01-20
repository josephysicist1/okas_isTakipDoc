import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDoc } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth, db } from '../firebase/config'
import PasswordConfirmModal from './PasswordConfirmModal'
import './Announcements.css'

function AnnouncementCard({ announcement, index, onDeleteAnnouncement }) {
  const [replies, setReplies] = useState([])
  const [showReplies, setShowReplies] = useState(false)
  const [newReply, setNewReply] = useState('')
  const [savingReply, setSavingReply] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [pendingDeleteReplyId, setPendingDeleteReplyId] = useState(null)

  const currentUser = auth.currentUser
  const canDeleteAnnouncement = currentUser && announcement.createdByUid === currentUser.uid

  useEffect(() => {
    if (!announcement.docId) return
    
    const repliesQuery = query(
      collection(db, 'announcements', announcement.docId, 'replies'),
      orderBy('createdAt', 'asc')
    )
    
    const unsubscribe = onSnapshot(repliesQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        docId: d.id,
        ...d.data(),
      }))
      setReplies(data)
    })
    
    return () => unsubscribe()
  }, [announcement.docId])

  const handleAddReply = async () => {
    if (!newReply.trim() || savingReply) return

    setSavingReply(true)
    try {
      await addDoc(collection(db, 'announcements', announcement.docId, 'replies'), {
        content: newReply.trim(),
        createdAt: new Date(),
        createdBy: currentUser?.email || 'Anonim',
        createdByUid: currentUser?.uid || null,
      })
      setNewReply('')
    } catch (err) {
      console.error('Cevap eklenirken hata:', err)
      alert('Cevap eklenirken bir hata oluştu: ' + err.message)
    } finally {
      setSavingReply(false)
    }
  }

  const handleDeleteReplyClick = (replyId) => {
    setPendingDeleteReplyId(replyId)
    setPasswordModalOpen(true)
  }

  const handleDeleteReplyConfirm = async (password) => {
    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        throw new Error('Kullanıcı bilgisi bulunamadı.')
      }

      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)

      await deleteDoc(doc(db, 'announcements', announcement.docId, 'replies', pendingDeleteReplyId))

      const checkDoc = await getDoc(doc(db, 'announcements', announcement.docId, 'replies', pendingDeleteReplyId))
      if (checkDoc.exists()) {
        throw new Error('Cevap silinemedi.')
      }

      setPasswordModalOpen(false)
      setPendingDeleteReplyId(null)
    } catch (error) {
      console.error('Cevap silinirken hata:', error)
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        throw new Error('Hatalı şifre!')
      }
      throw error
    }
  }

  return (
    <>
      <div className="ann-card" style={{ '--card-index': index }}>
        <div className="ann-card-header">
          <h3 className="ann-card-title">{announcement.title}</h3>
          {canDeleteAnnouncement && (
            <button
              className="ann-delete-btn"
              onClick={() => onDeleteAnnouncement(announcement.docId)}
              title="Sil (Şifre Gerekli)"
            >
              🗑️
            </button>
          )}
        </div>
        <p className="ann-card-content">{announcement.content}</p>
        <div className="ann-card-footer">
          <span className="ann-author">Yazan: {announcement.createdBy}</span>
          <span className="ann-date">
            {announcement.createdAt?.toDate
              ? new Date(announcement.createdAt.toDate()).toLocaleDateString('tr-TR')
              : '-'}
          </span>
        </div>

        {/* Replies Section */}
        <div className="ann-replies-section">
          <button
            className="ann-toggle-replies"
            onClick={() => setShowReplies(!showReplies)}
          >
            💬 {replies.length} Cevap {showReplies ? '▲' : '▼'}
          </button>

          {showReplies && (
            <div className="ann-replies-container">
              {replies.map((reply, idx) => {
                const canDeleteReply = currentUser && reply.createdByUid === currentUser.uid
                return (
                  <div key={reply.docId} className="ann-reply" style={{ '--reply-index': idx }}>
                    <div className="ann-reply-header">
                      <span className="ann-reply-author">{reply.createdBy}</span>
                      {canDeleteReply && (
                        <button
                          className="ann-reply-delete"
                          onClick={() => handleDeleteReplyClick(reply.docId)}
                          title="Sil"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <p className="ann-reply-content">{reply.content}</p>
                    <span className="ann-reply-date">
                      {reply.createdAt?.toDate
                        ? new Date(reply.createdAt.toDate()).toLocaleString('tr-TR')
                        : '-'}
                    </span>
                  </div>
                )
              })}

              <div className="ann-reply-input">
                <input
                  type="text"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddReply()
                    }
                  }}
                  placeholder="Cevap yazın..."
                  disabled={savingReply}
                />
                <button
                  onClick={handleAddReply}
                  disabled={!newReply.trim() || savingReply}
                  className="ann-reply-send"
                >
                  ➤
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PasswordConfirmModal
        isOpen={passwordModalOpen}
        title="Cevabı silmek için şifrenizi girin"
        confirmText="Sil"
        onCancel={() => {
          setPasswordModalOpen(false)
          setPendingDeleteReplyId(null)
        }}
        onConfirm={handleDeleteReplyConfirm}
      />
    </>
  )
}

function Announcements() {
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        docId: d.id,
        ...d.data(),
      }))
      setAnnouncements(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleAddAnnouncement = async () => {
    setError('')
    const { title, content } = newAnnouncement

    if (!title.trim() || !content.trim()) {
      setError('Başlık ve içerik zorunludur.')
      return
    }

    setSaving(true)
    try {
      const user = auth.currentUser
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date(),
        createdBy: user?.email || 'Anonim',
        createdByUid: user?.uid || null,
      })

      setNewAnnouncement({ title: '', content: '' })
      setShowAddModal(false)
      setError('')
    } catch (err) {
      console.error('Duyuru eklenirken hata:', err)
      setError('Duyuru eklenirken bir hata oluştu: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (docId) => {
    setPendingDeleteId(docId)
    setPasswordModalOpen(true)
  }

  const handleDeleteConfirm = async (password) => {
    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        throw new Error('Kullanıcı bilgisi bulunamadı.')
      }

      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)

      await deleteDoc(doc(db, 'announcements', pendingDeleteId))

      // Doğrulama: gerçekten silindi mi?
      const checkDoc = await getDoc(doc(db, 'announcements', pendingDeleteId))
      if (checkDoc.exists()) {
        throw new Error('Duyuru silinemedi, veritabanında hâlâ mevcut.')
      }

      setPasswordModalOpen(false)
      setPendingDeleteId(null)
    } catch (error) {
      console.error('Duyuru silinirken hata:', error)
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        throw new Error('Hatalı şifre!')
      }
      if (error?.code === 'auth/too-many-requests') {
        throw new Error('Çok fazla başarısız deneme.')
      }
      throw error
    }
  }

  if (loading) {
    return (
      <div className="ann-page">
        <div className="ann-appbar">
          <button className="ann-back" onClick={() => navigate('/')}>
            ←
          </button>
          <div className="ann-title">Duyurular</div>
          <div className="ann-right-spacer"></div>
        </div>
        <div className="ann-content">
          <div className="ann-loading">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="ann-page">
      <div className="ann-appbar">
        <button className="ann-back" onClick={() => navigate('/')}>
          ←
        </button>
        <div className="ann-title">Duyurular</div>
        <div className="ann-right-spacer"></div>
      </div>

      <div className="ann-content">
        <div className="ann-toolbar">
          <h2 className="ann-section-title">Tüm Duyurular</h2>
          <button className="ann-btn ann-btn-primary" onClick={() => setShowAddModal(true)}>
            + Yeni Duyuru Ekle
          </button>
        </div>

        <div className="ann-list">
          {announcements.length === 0 ? (
            <div className="ann-empty">Henüz duyuru eklenmemiş.</div>
          ) : (
            announcements.map((item, idx) => (
              <AnnouncementCard
                key={item.docId}
                announcement={item}
                index={idx}
                onDeleteAnnouncement={handleDeleteClick}
              />
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="ann-modal-overlay" onClick={() => !saving && setShowAddModal(false)}>
          <div className="ann-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ann-modal-header">
              <h3>Yeni Duyuru Ekle</h3>
            </div>
            <div className="ann-modal-body">
              <div className="ann-field" style={{ '--field-index': 0 }}>
                <label>Başlık</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="Duyuru başlığı"
                  disabled={saving}
                />
              </div>
              <div className="ann-field" style={{ '--field-index': 1 }}>
                <label>İçerik</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Duyuru içeriği"
                  rows="6"
                  disabled={saving}
                  className="ann-textarea"
                />
              </div>
              {error && <div className="ann-error">{error}</div>}
            </div>
            <div className="ann-modal-actions">
              <button
                className="ann-btn ann-btn-ghost"
                onClick={() => setShowAddModal(false)}
                disabled={saving}
              >
                İptal
              </button>
              <button className="ann-btn ann-btn-primary" onClick={handleAddAnnouncement} disabled={saving}>
                {saving ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      <PasswordConfirmModal
        isOpen={passwordModalOpen}
        title="Duyuruyu silmek için şifrenizi girin"
        confirmText="Sil"
        onCancel={() => {
          setPasswordModalOpen(false)
          setPendingDeleteId(null)
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

export default Announcements
