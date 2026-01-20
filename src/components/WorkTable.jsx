import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import './WorkTable.css'

// 27 sütun başlıkları
const COLUMNS = [
  'Geliş Tarihi(Arrival Date)',
  'Beklediği Süre(Waiting Time)',
  'Termin tarihi_1/ Delivery date_1',
  'Termin tarihi_2/ Delivery date_2',
  'Termin tarihi_3/ Delivery date_3',
  'Ana Müşteri Adı/ Main customer name',
  'Müşteri Adı/ Customer name',
  'İrsaliye no/ Waybill no',
  'Parça Numarası/ Part Number',
  'FAI/ Seri',
  'Yapılacak işlem/ Finish code',
  'GKR no',
  'Sipariş no/ PO no',
  'IEM',
  'TAI SOIR no',
  'Miktar/ Qty',
  'TAI sipariş no/ TAI po no',
  'Müşteri onayı/ Cust. approved',
  'Sipariş gözden geçirildi mi?/ Order req. Reviewed (Kapasite yeterli mi? Satınalma ihtiyacı var mı?',
  'Seri no var mı veya kritik mi Y/N/ Part traceable or critial? Varsa seri no kaydet/ if applicable record serial no.',
  'Notes/ Notlar',
  'ÜTF Hazırlayan/ Prepared by',
  'ÜTF tarihi/ Date of prs',
  'NCPR no/ Uygunsuzluk n, Ex or In',
  'Hazır/ Finished',
  'Denetim isteme',
  'Satıldı/ Sold'
]

function WorkTable() {
  const navigate = useNavigate()
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [newRowData, setNewRowData] = useState({})
  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    loadWorks()
  }, [])

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

  const loadWorks = async () => {
    try {
      const q = query(collection(db, 'works'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const worksData = []
      querySnapshot.forEach((doc) => {
        worksData.push({ id: doc.id, ...doc.data() })
      })
      setWorks(worksData)
    } catch (error) {
      console.error('İşler yüklenirken hata:', error)
      alert('İşler yüklenirken bir hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCellCommit = async (workId, field, value) => {
    try {
      const workRef = doc(db, 'works', workId)
      await updateDoc(workRef, {
        [field]: value,
        updatedAt: new Date()
      })
      
      setWorks((prev) =>
        prev.map((work) => (work.id === workId ? { ...work, [field]: value } : work))
      )
    } catch (error) {
      console.error('Hücre güncellenirken hata:', error)
      alert('Güncelleme sırasında bir hata oluştu: ' + error.message)
    }
  }

  const handleAddRow = async () => {
    try {
      const newWork = {
        ...newRowData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Boş değerleri temizle
      Object.keys(newWork).forEach(key => {
        if (newWork[key] === '' || newWork[key] === undefined) {
          delete newWork[key]
        }
      })

      const docRef = await addDoc(collection(db, 'works'), newWork)
      setWorks([{ id: docRef.id, ...newWork }, ...works])
      setNewRowData({})
    } catch (error) {
      console.error('Satır eklenirken hata:', error)
      alert('Satır eklenirken bir hata oluştu: ' + error.message)
    }
  }

  const handleDeleteRow = async (workId) => {
    if (!window.confirm('Bu satırı silmek istediğinize emin misiniz?')) {
      return
    }

    // Kullanıcıdan şifre iste
    const password = window.prompt('Silme işlemini onaylamak için lütfen şifrenizi girin:')
    
    if (!password) {
      return // Kullanıcı iptal etti
    }

    try {
      // Mevcut kullanıcıyı al
      const user = auth.currentUser
      
      if (!user || !user.email) {
        alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.')
        return
      }

      // Kullanıcının kimliğini doğrula
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)

      // Şifre doğru, silme işlemini gerçekleştir
      await deleteDoc(doc(db, 'works', workId))
      setWorks(works.filter(work => work.id !== workId))
      
      alert('Satır başarıyla silindi.')
    } catch (error) {
      console.error('Satır silinirken hata:', error)
      
      // Hata mesajını kullanıcı dostu yap
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert('Hatalı şifre! Silme işlemi iptal edildi.')
      } else if (error.code === 'auth/too-many-requests') {
        alert('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.')
      } else {
        alert('Satır silinirken bir hata oluştu: ' + error.message)
      }
    }
  }


  const getFieldName = (column) => {
    const fieldMap = {
      'Geliş Tarihi(Arrival Date)': 'arrivalDate',
      'Beklediği Süre(Waiting Time)': 'waitingTime',
      'Termin tarihi_1/ Delivery date_1': 'deliveryDate1',
      'Termin tarihi_2/ Delivery date_2': 'deliveryDate2',
      'Termin tarihi_3/ Delivery date_3': 'deliveryDate3',
      'Ana Müşteri Adı/ Main customer name': 'mainCustomerName',
      'Müşteri Adı/ Customer name': 'customerName',
      'İrsaliye no/ Waybill no': 'waybillNo',
      'Parça Numarası/ Part Number': 'partNumber',
      'FAI/ Seri': 'faiSeri',
      'Yapılacak işlem/ Finish code': 'finishCode',
      'GKR no': 'gkrNo',
      'Sipariş no/ PO no': 'poNo',
      'IEM': 'iem',
      'TAI SOIR no': 'taiSoirNo',
      'Miktar/ Qty': 'qty',
      'TAI sipariş no/ TAI po no': 'taiPoNo',
      'Müşteri onayı/ Cust. approved': 'custApproved',
      'Sipariş gözden geçirildi mi?/ Order req. Reviewed (Kapasite yeterli mi? Satınalma ihtiyacı var mı?': 'orderReviewed',
      'Seri no var mı veya kritik mi Y/N/ Part traceable or critial? Varsa seri no kaydet/ if applicable record serial no.': 'partTraceable',
      'Notes/ Notlar': 'notes',
      'ÜTF Hazırlayan/ Prepared by': 'preparedBy',
      'ÜTF tarihi/ Date of prs': 'dateOfPrs',
      'NCPR no/ Uygunsuzluk n, Ex or In': 'ncprNo',
      'Hazır/ Finished': 'finished',
      'Denetim isteme': 'denetimIsteme',
      'Satıldı/ Sold': 'sold'
    }
    return fieldMap[column] || column.toLowerCase().replace(/\s+/g, '')
  }

  const getCellValue = (work, column) => {
    const fieldName = getFieldName(column)
    return work[fieldName] || ''
  }

  const formatOption = (item) => {
    const name = item?.name || ''
    const code = item?.code || ''
    return code ? `${name} (${code})` : name
  }

  const isProjectCustomerDropdownColumn = (column) =>
    column === 'Ana Müşteri Adı/ Main customer name' || column === 'Müşteri Adı/ Customer name'

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="work-table-container">
      <div className="table-header-actions">
        <button onClick={handleAddRow} className="add-row-button">
          + Yeni İş Ekle
        </button>
        <button
          onClick={() => navigate('/project-customer-management')}
          className="management-button"
        >
          Proje / Müşteri Yönetimi
        </button>
      </div>

      <div className="table-wrapper">
        <table className="work-table">
          <thead>
            <tr>
              <th className="sticky-col action-col">İşlemler</th>
              {COLUMNS.map((column, index) => (
                <th key={index}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Yeni satır ekleme satırı */}
            <tr className="new-row">
              <td className="sticky-col action-col">
                <button onClick={handleAddRow} className="save-new-button">
                  Kaydet
                </button>
              </td>
              {COLUMNS.map((column, colIndex) => {
                const fieldName = getFieldName(column)
                return (
                  <td key={colIndex}>
                    {isProjectCustomerDropdownColumn(column) ? (
                      <select
                        value={newRowData[fieldName] || ''}
                        onChange={(e) =>
                          setNewRowData({
                            ...newRowData,
                            [fieldName]: e.target.value,
                          })
                        }
                        className="cell-select"
                      >
                        <option value="" disabled>
                          Seçiniz...
                        </option>
                        <optgroup label="Projeler">
                          {projects.map((p) => (
                            <option key={`p-${p.id}`} value={formatOption(p)}>
                              {formatOption(p)}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Müşteriler">
                          {customers.map((c) => (
                            <option key={`c-${c.id}`} value={formatOption(c)}>
                              {formatOption(c)}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={newRowData[fieldName] || ''}
                        onChange={(e) =>
                          setNewRowData({
                            ...newRowData,
                            [fieldName]: e.target.value,
                          })
                        }
                        placeholder={column}
                        className="cell-input"
                      />
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Mevcut işler */}
            {works.map((work, rowIndex) => (
              <tr key={work.id}>
                <td className="sticky-col action-col">
                  <button
                    onClick={() => handleDeleteRow(work.id)}
                    className="delete-button"
                    title="Sil (Şifre Gerekli)"
                  >
                    🗑️
                  </button>
                </td>
                {COLUMNS.map((column, colIndex) => {
                  const fieldName = getFieldName(column)
                  const cellKey = `${work.id}-${fieldName}`
                  const isEditing = editingCell === cellKey
                  const cellValue = getCellValue(work, column)

                  return (
                    <td
                      key={colIndex}
                      className={isEditing ? 'editing' : ''}
                      onDoubleClick={() => {
                        setEditingCell(cellKey)
                        setEditingValue(cellValue)
                      }}
                    >
                      {isEditing ? (
                        isProjectCustomerDropdownColumn(column) ? (
                          <select
                            value={editingValue}
                            onChange={async (e) => {
                              const next = e.target.value
                              setEditingValue(next)
                              await handleCellCommit(work.id, fieldName, next)
                              setEditingCell(null)
                            }}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="cell-select"
                          >
                            <option value="" disabled>
                              Seçiniz...
                            </option>
                            <optgroup label="Projeler">
                              {projects.map((p) => (
                                <option key={`p-${p.id}`} value={formatOption(p)}>
                                  {formatOption(p)}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Müşteriler">
                              {customers.map((c) => (
                                <option key={`c-${c.id}`} value={formatOption(c)}>
                                  {formatOption(c)}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={async () => {
                              await handleCellCommit(work.id, fieldName, editingValue)
                              setEditingCell(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                ;(async () => {
                                  await handleCellCommit(work.id, fieldName, editingValue)
                                  setEditingCell(null)
                                })()
                              } else if (e.key === 'Escape') {
                                setEditingCell(null)
                              }
                            }}
                            autoFocus
                            className="cell-input"
                          />
                        )
                      ) : (
                        <span className="cell-value">{cellValue || '-'}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {works.length === 0 && (
        <div className="empty-state">
          <p>Henüz iş eklenmemiş. Yeni iş eklemek için üstteki butonu kullanın.</p>
        </div>
      )}
    </div>
  )
}

export default WorkTable
