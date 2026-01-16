import React, { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import './WorkTable.css'

// 18 sütun başlıkları
const COLUMNS = [
  'ID',
  'İş Adı',
  'Açıklama',
  'Durum',
  'Öncelik',
  'Atanan Kişi',
  'Başlangıç Tarihi',
  'Bitiş Tarihi',
  'Tahmini Süre (Saat)',
  'Gerçekleşen Süre (Saat)',
  'Kategori',
  'Etiketler',
  'Notlar',
  'Dosya Linki',
  'Müşteri',
  'Proje',
  'Bütçe',
  'Tamamlanma Yüzdesi'
]

function WorkTable() {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState(null)
  const [newRowData, setNewRowData] = useState({})

  useEffect(() => {
    loadWorks()
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

  const handleCellChange = async (workId, field, value) => {
    try {
      const workRef = doc(db, 'works', workId)
      await updateDoc(workRef, {
        [field]: value,
        updatedAt: new Date()
      })
      
      setWorks(works.map(work => 
        work.id === workId ? { ...work, [field]: value } : work
      ))
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

    try {
      await deleteDoc(doc(db, 'works', workId))
      setWorks(works.filter(work => work.id !== workId))
    } catch (error) {
      console.error('Satır silinirken hata:', error)
      alert('Satır silinirken bir hata oluştu: ' + error.message)
    }
  }

  const getFieldName = (column) => {
    const fieldMap = {
      'ID': 'id',
      'İş Adı': 'jobName',
      'Açıklama': 'description',
      'Durum': 'status',
      'Öncelik': 'priority',
      'Atanan Kişi': 'assignedTo',
      'Başlangıç Tarihi': 'startDate',
      'Bitiş Tarihi': 'endDate',
      'Tahmini Süre (Saat)': 'estimatedHours',
      'Gerçekleşen Süre (Saat)': 'actualHours',
      'Kategori': 'category',
      'Etiketler': 'tags',
      'Notlar': 'notes',
      'Dosya Linki': 'fileLink',
      'Müşteri': 'customer',
      'Proje': 'project',
      'Bütçe': 'budget',
      'Tamamlanma Yüzdesi': 'completionPercentage'
    }
    return fieldMap[column] || column.toLowerCase().replace(/\s+/g, '')
  }

  const getCellValue = (work, column) => {
    const fieldName = getFieldName(column)
    return work[fieldName] || ''
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="work-table-container">
      <div className="table-header-actions">
        <button onClick={handleAddRow} className="add-row-button">
          + Yeni İş Ekle
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
                    <input
                      type="text"
                      value={newRowData[fieldName] || ''}
                      onChange={(e) => setNewRowData({
                        ...newRowData,
                        [fieldName]: e.target.value
                      })}
                      placeholder={column}
                      className="cell-input"
                    />
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
                    title="Sil"
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
                      onDoubleClick={() => setEditingCell(cellKey)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={cellValue}
                          onChange={(e) => handleCellChange(work.id, fieldName, e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingCell(null)
                            }
                          }}
                          autoFocus
                          className="cell-input"
                        />
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
