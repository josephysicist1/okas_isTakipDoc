import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import PasswordConfirmModal from './PasswordConfirmModal'
import { logActivity } from '../utils/logActivity'
import * as XLSX from 'xlsx'
import './WorkTable.css'

// 29 sütun başlıkları
const COLUMNS = [
  'İş No',
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
  'Satıldı/ Sold',
  'Tanımlama'
]

const FIELD_MAP = {
  'İş No': 'workNo',
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
  'Sipariş gözden geçirildi mi?/ Order req. Reviewed (Kapasite yeterli mi? Satınalma ihtiyacı var mı?':
    'orderReviewed',
  'Seri no var mı veya kritik mi Y/N/ Part traceable or critial? Varsa seri no kaydet/ if applicable record serial no.':
    'partTraceable',
  'Notes/ Notlar': 'notes',
  'ÜTF Hazırlayan/ Prepared by': 'preparedBy',
  'ÜTF tarihi/ Date of prs': 'dateOfPrs',
  'NCPR no/ Uygunsuzluk n, Ex or In': 'ncprNo',
  'Hazır/ Finished': 'finished',
  'Denetim isteme': 'denetimIsteme',
  'Satıldı/ Sold': 'sold',
  'Tanımlama': 'tanimlama',
}

const TANIMLAMA_OPTIONS = [
  'Hazır',
  'Üretimde',
  'Denetimi Geçti',
  'Üretime Girmeden İade Edildi',
  'Fatura Edildi',
  'Uygun Olmayan'
]

const FIELD_LABELS = Object.fromEntries(
  Object.entries(FIELD_MAP).map(([label, field]) => [field, label])
)

function WorkTable({ selectedProject, setSelectedProject }) {
  const navigate = useNavigate()
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [newRowData, setNewRowData] = useState({})
  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [pendingDeleteWorkId, setPendingDeleteWorkId] = useState(null)

  useEffect(() => {
    const selectedProjectId = selectedProject?.id

    const q = selectedProjectId
      ? query(collection(db, 'works'), where('projectId', '==', selectedProjectId), orderBy('workNo', 'asc'))
      : query(collection(db, 'works'), orderBy('workNo', 'asc'))

    const unsub = onSnapshot(
      q,
      (snap) => {
        // Not: bazı eski kayıtlarda "id" alanı doküman içinde bulunabiliyor.
        // Spread sırası yüzünden gerçek Firestore docId ezilebiliyor. Bu yüzden docId ayrı tutuluyor.
        const worksData = snap.docs.map((d) => ({ docId: d.id, ...d.data() }))
        // İş No'ya göre sırala (yoksa en sona at)
        worksData.sort((a, b) => {
          const aNo = a.workNo || 999999
          const bNo = b.workNo || 999999
          return aNo - bNo
        })
        setWorks(worksData)
        setLoading(false)
      },
      (error) => {
        console.error('İşler yüklenirken hata:', error)
        alert('İşler yüklenirken bir hata oluştu: ' + error.message)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [selectedProject?.id])

  useEffect(() => {
    const projectQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    const unsubProjects = onSnapshot(projectQuery, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setProjects(list)

      // Proje seçimi: localStorage -> mevcut proje -> ilk proje
      const storedProjectId = localStorage.getItem('selectedProjectId')
      if (!selectedProject && list.length > 0) {
        const found = storedProjectId ? list.find((p) => p.id === storedProjectId) : null
        const next = found || list[0]
        setSelectedProject?.(next)
      }
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

  // Bekleme sürelerini otomatik güncelle
  useEffect(() => {
    const updateWaitingTimes = async () => {
      if (!works || works.length === 0) return

      for (const work of works) {
        if (work.arrivalDate) {
          const newWaitingTime = calculateWaitingTime(work.arrivalDate)
          if (newWaitingTime !== null && work.waitingTime !== newWaitingTime) {
            try {
              const workRef = doc(db, 'works', work.docId)
              await updateDoc(workRef, {
                waitingTime: newWaitingTime,
                updatedAt: new Date()
              })
            } catch (error) {
              console.error(`Bekleme süresi güncellenirken hata (${work.docId}):`, error)
            }
          }
        }
      }
    }

    // Sayfa yüklendiğinde bir kez çalıştır
    updateWaitingTimes()

    // Her 1 saatte bir kontrol et (gerçek zamanlı güncellik için)
    const interval = setInterval(updateWaitingTimes, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [works])

  // works listesi artık onSnapshot ile gerçek zamanlı geliyor

  // Excel'e aktar fonksiyonu
  const exportToExcel = () => {
    try {
      if (works.length === 0) {
        alert('Aktarılacak veri yok.')
        return
      }

      // Sütun başlıklarını hazırla (COLUMNS zaten string array)
      const headers = COLUMNS

      // Veri satırlarını hazırla
      const dataRows = works.map(work => 
        COLUMNS.map(columnLabel => {
          const fieldName = FIELD_MAP[columnLabel]
          const value = work[fieldName]
          // Tarih alanlarını formatla
          if (value instanceof Date) {
            return value.toLocaleDateString('tr-TR')
          }
          return value !== undefined && value !== null ? value : ''
        })
      )

      // Başlık + veriler
      const worksheetData = [headers, ...dataRows]

      // Worksheet oluştur
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Sütun genişliklerini ayarla
      const columnWidths = COLUMNS.map(col => {
        // Uzun başlıklar için daha geniş sütun
        const minWidth = Math.max(col.length * 0.8, 15)
        return { wch: minWidth }
      })
      worksheet['!cols'] = columnWidths

      // Workbook oluştur
      const workbook = XLSX.utils.book_new()
      const sheetName = selectedProject?.name 
        ? `${selectedProject.name} - İş Takip`
        : 'İş Takip Tablosu'
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 30)) // Excel sheet adı max 31 karakter

      // Dosya adı
      const fileName = selectedProject?.name 
        ? `${selectedProject.name}_Is_Takip_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`
        : `Is_Takip_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`

      // İndir
      XLSX.writeFile(workbook, fileName)
    } catch (error) {
      console.error('Excel aktarım hatası:', error)
      alert('Excel dosyası oluşturulurken bir hata oluştu: ' + error.message)
    }
  }

  const calculateWaitingTime = (arrivalDateStr) => {
    if (!arrivalDateStr) return null
    try {
      const arrivalDate = new Date(arrivalDateStr)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      arrivalDate.setHours(0, 0, 0, 0)
      
      const diffTime = today - arrivalDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return null
      return `${diffDays} gün`
    } catch (error) {
      console.error('Bekleme süresi hesaplanırken hata:', error)
      return null
    }
  }

  const handleCellCommit = async (workDocId, field, value) => {
    try {
      const oldValueRaw = works.find((w) => w.docId === workDocId)?.[field]
      const oldValue =
        oldValueRaw === undefined || oldValueRaw === null ? '' : String(oldValueRaw).substring(0, 200)
      const newValue = value === undefined || value === null ? '' : String(value).substring(0, 200)

      // Değer değişmediyse hiçbir şey yapma (ne DB güncelle, ne log yaz)
      if (oldValue === newValue) {
        return
      }

      const workRef = doc(db, 'works', workDocId)
      const updateData = {
        [field]: value,
        updatedAt: new Date()
      }

      // Eğer Geliş Tarihi güncelleniyorsa, Beklediği Süre'yi otomatik hesapla
      if (field === 'arrivalDate') {
        const waitingTime = calculateWaitingTime(value)
        if (waitingTime !== null) {
          updateData.waitingTime = waitingTime
        }
      }

      await updateDoc(workRef, updateData)
      
      setWorks((prev) =>
        prev.map((work) => 
          work.docId === workDocId 
            ? { ...work, ...updateData } 
            : work
        )
      )
      
      // Log kaydet
      const workForLog = works.find((w) => w.docId === workDocId)
      await logActivity('update', 'works', {
        workDocId,
        workNo: workForLog?.workNo,
        projectId: workForLog?.projectId,
        projectName: workForLog?.projectName || selectedProject?.name || '',
        field,
        fieldLabel: FIELD_LABELS[field] || field,
        oldValue: oldValue || '-',
        newValue: newValue || '-',
      })
    } catch (error) {
      console.error('Hücre güncellenirken hata:', error)
      alert('Güncelleme sırasında bir hata oluştu: ' + error.message)
    }
  }

  const handleAddRow = async () => {
    try {
      if (!selectedProject?.id) {
        alert('Lütfen önce bir proje seçin.')
        return
      }

      // Otomatik İş No hesapla (mevcut en yüksek workNo + 1)
      const maxWorkNo = works.reduce((max, work) => {
        const workNo = work.workNo || 0
        return workNo > max ? workNo : max
      }, 0)
      const nextWorkNo = maxWorkNo + 1

      const newWork = {
        ...newRowData,
        workNo: nextWorkNo,
        projectId: selectedProject.id,
        projectName: selectedProject.name || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Eğer Geliş Tarihi girilmişse, Beklediği Süre'yi otomatik hesapla
      if (newWork.arrivalDate) {
        const waitingTime = calculateWaitingTime(newWork.arrivalDate)
        if (waitingTime !== null) {
          newWork.waitingTime = waitingTime
        }
      }
      
      // Boş değerleri temizle
      Object.keys(newWork).forEach(key => {
        if (newWork[key] === '' || newWork[key] === undefined) {
          delete newWork[key]
        }
      })

      const docRef = await addDoc(collection(db, 'works'), newWork)
      setNewRowData({})
      
      // Log kaydet
      await logActivity('create', 'works', {
        workDocId: docRef.id,
        workNo: nextWorkNo,
        projectId: selectedProject.id,
        projectName: selectedProject.name || '',
        summary: {
          mainCustomerName: newWork.mainCustomerName || '-',
          customerName: newWork.customerName || '-',
          partNumber: newWork.partNumber || '-',
          waybillNo: newWork.waybillNo || '-',
        },
      })
    } catch (error) {
      console.error('Satır eklenirken hata:', error)
      alert('Satır eklenirken bir hata oluştu: ' + error.message)
    }
  }

  const handleDeleteRow = async (workDocId) => {
    if (!window.confirm('Bu satırı silmek istediğinize emin misiniz?')) {
      return
    }
    setPendingDeleteWorkId(workDocId)
    setPasswordModalOpen(true)
  }

  const handleDuplicateRow = async (workDocId) => {
    try {
      if (!selectedProject?.id) {
        alert('Lütfen önce bir proje seçin.')
        return
      }

      const workToDuplicate = works.find(w => w.docId === workDocId)
      if (!workToDuplicate) {
        alert('Çoğaltılacak satır bulunamadı.')
        return
      }

      // Yeni İş No hesapla
      const maxWorkNo = works.reduce((max, work) => {
        const workNo = work.workNo || 0
        return workNo > max ? workNo : max
      }, 0)
      const nextWorkNo = maxWorkNo + 1

      // docId ve timestamp'leri hariç tut, yeni oluştur
      const { docId, createdAt, updatedAt, workNo, ...workData } = workToDuplicate
      
      const newWork = {
        ...workData,
        workNo: nextWorkNo,
        projectId: selectedProject.id,
        projectName: selectedProject.name || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const docRef = await addDoc(collection(db, 'works'), newWork)
      // onSnapshot zaten güncelleyecek, manuel setWorks'e gerek yok
      
      // Log kaydet
      await logActivity('duplicate', 'works', {
        sourceWorkDocId: workDocId,
        sourceWorkNo: workToDuplicate.workNo,
        workDocId: docRef.id,
        workNo: nextWorkNo,
        projectId: selectedProject.id,
        projectName: selectedProject.name || '',
        summary: {
          mainCustomerName: newWork.mainCustomerName || '-',
          customerName: newWork.customerName || '-',
          partNumber: newWork.partNumber || '-',
          waybillNo: newWork.waybillNo || '-',
        },
      })
    } catch (error) {
      console.error('Satır çoğaltılırken hata:', error)
      alert('Satır çoğaltılırken bir hata oluştu: ' + error.message)
    }
  }

  const getFieldName = (column) => {
    return FIELD_MAP[column] || column.toLowerCase().replace(/\s+/g, '')
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

  const isTanimlamaColumn = (column) => column === 'Tanımlama'

  const isDateColumn = (column) =>
    column.toLowerCase().includes('tarih') || column.toLowerCase().includes('date')

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="work-table-container">
      <div className="table-header-actions">
        <div className="project-filter">
          <span className="project-filter-label">Projeler:</span>
          <select
            className="project-filter-select"
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const nextId = e.target.value
              const next = projects.find((p) => p.id === nextId) || null
              setSelectedProject?.(next)
              if (next?.id) {
                localStorage.setItem('selectedProjectId', next.id)
              } else {
                localStorage.removeItem('selectedProjectId')
              }
            }}
          >
            <option value="" disabled>
              Proje seçiniz...
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || '(İsimsiz Proje)'}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleAddRow} className="add-row-button">
          + Yeni İş Ekle
        </button>
        <button
          onClick={() => navigate('/project-customer-management')}
          className="management-button"
        >
          Proje / Müşteri Yönetimi
        </button>
        <button
          onClick={() => navigate('/user-management')}
          className="management-button"
        >
          Kullanıcı Yönetimi
        </button>
        <button
          onClick={exportToExcel}
          className="export-excel-button"
          disabled={works.length === 0}
        >
          📊 Excel'e Aktar
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
                    ) : isTanimlamaColumn(column) ? (
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
                        <option value="">Seçiniz...</option>
                        {TANIMLAMA_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={isDateColumn(column) ? 'date' : 'text'}
                        value={newRowData[fieldName] || ''}
                        onChange={(e) =>
                          setNewRowData({
                            ...newRowData,
                            [fieldName]: e.target.value,
                          })
                        }
                        placeholder={
                          fieldName === 'waitingTime' ? 'Otomatik hesaplanacak' :
                          fieldName === 'workNo' ? 'Otomatik atanacak' :
                          column
                        }
                        className="cell-input"
                        disabled={fieldName === 'waitingTime' || fieldName === 'workNo'}
                        style={
                          (fieldName === 'waitingTime' || fieldName === 'workNo')
                            ? { cursor: 'not-allowed', opacity: 0.6 }
                            : {}
                        }
                      />
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Mevcut işler */}
            {works.map((work, rowIndex) => {
              const getTanimlamaClass = (tanimlama) => {
                switch(tanimlama) {
                  case 'Hazır': return 'row-hazir'
                  case 'Üretimde': return 'row-uretimde'
                  case 'Denetimi Geçti': return 'row-denetim-gecti'
                  case 'Üretime Girmeden İade Edildi': return 'row-iade'
                  case 'Fatura Edildi': return 'row-fatura'
                  case 'Uygun Olmayan': return 'row-uygun-olmayan'
                  default: return ''
                }
              }
              
              return (
              <tr 
                key={work.docId}
                className={getTanimlamaClass(work.tanimlama)}
              >
                <td className="sticky-col action-col">
                  <div className="row-actions">
                    <button
                      onClick={() => handleDuplicateRow(work.docId)}
                      className="action-btn duplicate-btn"
                      title="Satırı Çoğalt"
                    >
                      Çoğalt
                    </button>
                    <button
                      onClick={() => handleDeleteRow(work.docId)}
                      className="action-btn delete-btn"
                      title="Sil (Şifre Gerekli)"
                    >
                      Sil
                    </button>
                  </div>
                </td>
                {COLUMNS.map((column, colIndex) => {
                  const fieldName = getFieldName(column)
                  const cellKey = `${work.docId}-${fieldName}`
                  const isEditing = editingCell === cellKey
                  const cellValue = getCellValue(work, column)

                  return (
                    <td
                      key={colIndex}
                      className={isEditing ? 'editing' : ''}
                      onDoubleClick={() => {
                        // "İş No" ve "Beklediği Süre" sütunları otomatik hesaplandığı için düzenlenemez
                        if (fieldName === 'workNo' || fieldName === 'waitingTime') return
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
                              await handleCellCommit(work.docId, fieldName, next)
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
                        ) : isTanimlamaColumn(column) ? (
                          <select
                            value={editingValue}
                            onChange={async (e) => {
                              const next = e.target.value
                              setEditingValue(next)
                              await handleCellCommit(work.docId, fieldName, next)
                              setEditingCell(null)
                            }}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="cell-select"
                          >
                            <option value="">Seçiniz...</option>
                            {TANIMLAMA_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={isDateColumn(column) ? 'date' : 'text'}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={async () => {
                              await handleCellCommit(work.docId, fieldName, editingValue)
                              setEditingCell(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                ;(async () => {
                                  await handleCellCommit(work.docId, fieldName, editingValue)
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
              )
            })}
          </tbody>
        </table>
      </div>

      {works.length === 0 && (
        <div className="empty-state">
          <p>Henüz iş eklenmemiş. Yeni iş eklemek için üstteki butonu kullanın.</p>
        </div>
      )}

      <PasswordConfirmModal
        isOpen={passwordModalOpen}
        title="Silme işlemini onaylamak için şifrenizi girin"
        confirmText="Sil"
        onCancel={() => {
          setPasswordModalOpen(false)
          setPendingDeleteWorkId(null)
        }}
        onConfirm={async (password) => {
          try {
            if (!pendingDeleteWorkId) {
              throw new Error('Silinecek kayıt seçilemedi. Lütfen tekrar deneyin.')
            }

            const user = auth.currentUser
            if (!user || !user.email) {
              throw new Error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.')
            }

            const credential = EmailAuthProvider.credential(user.email, password)
            await reauthenticateWithCredential(user, credential)

            // Silmeden ÖNCE iş detaylarını al (log için)
            const deletingWork = works.find((w) => w.docId === pendingDeleteWorkId)
            
            const workRef = doc(db, 'works', pendingDeleteWorkId)
            await deleteDoc(workRef)

            // Silme sonrası doğrulama (server'a gidip hala var mı kontrol et)
            const checkSnap = await getDoc(workRef)
            if (checkSnap.exists()) {
              throw new Error('Silme işlemi tamamlanamadı (kayıt hâlâ mevcut). Yetki/kurallar kontrol edilmeli.')
            }

            // Log kaydet
            await logActivity('delete', 'works', {
              workDocId: pendingDeleteWorkId,
              workNo: deletingWork?.workNo,
              projectId: deletingWork?.projectId,
              projectName: deletingWork?.projectName || '',
              summary: deletingWork
                ? {
                    mainCustomerName: deletingWork.mainCustomerName || '-',
                    customerName: deletingWork.customerName || '-',
                    partNumber: deletingWork.partNumber || '-',
                    waybillNo: deletingWork.waybillNo || '-',
                    arrivalDate: deletingWork.arrivalDate || '-',
                    waitingTime: deletingWork.waitingTime || '-',
                    deliveryDate1: deletingWork.deliveryDate1 || '-',
                    poNo: deletingWork.poNo || '-',
                    finishCode: deletingWork.finishCode || '-',
                  }
                : { note: 'İş detayları bulunamadı' },
            })

            setPasswordModalOpen(false)
            setPendingDeleteWorkId(null)
          } catch (error) {
            console.error('Satır silinirken hata:', error)
            if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
              throw new Error('Hatalı şifre! Silme işlemi iptal edildi.')
            }
            if (error?.code === 'auth/too-many-requests') {
              throw new Error('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.')
            }
            if (error?.code === 'permission-denied') {
              throw new Error('Yetki hatası: Silme izni yok. Firestore rules kontrol edin.')
            }
            const code = error?.code ? String(error.code) : ''
            const msg = error?.message ? String(error.message) : 'Bilinmeyen hata'
            throw new Error(`${code ? `${code}: ` : ''}${msg}`)
          }
        }}
      />
    </div>
  )
}

export default WorkTable
