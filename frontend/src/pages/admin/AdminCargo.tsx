import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { 
  PlusIcon, 
  XMarkIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  PencilIcon,
  MapPinIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Shipment {
  id: string
  senderName: string
  receiverName: string
  receiverPhone: string
  weight: number
  price: number
  route: string[]
  routeStatus: boolean[]
  currentRouteIndex: number
  status: string
  trackingCode: string
  qrCode: string
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
  senderId: string
  receiverId: string
}

export default function AdminCargo() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [selectedShipments, setSelectedShipments] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    senderName: '',
    receiverName: '',
    receiverPhone: '',
    weight: '',
    price: '',
    route: [''] as string[],
    manualPrice: false,
  })

  useEffect(() => {
    fetchShipments()
  }, [])

  const fetchShipments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shipments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setShipments(data)
      }
    } catch (error) {
      console.error('Kargolar yüklenirken hata:', error)
      toast.error(t('common.error') || 'Kargolar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const calculatePrice = (weight: number) => {
    return (weight * 2.5).toFixed(2)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
      return
    }

    let newValue: any = value
    
    if (name === 'weight') {
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) return
      newValue = value
      
      if (!formData.manualPrice && value) {
        const weightNum = parseFloat(value)
        if (!isNaN(weightNum) && weightNum > 0) {
          setFormData(prev => ({
            ...prev,
            price: calculatePrice(weightNum),
            weight: value
          }))
          return
        }
      }
    }

    if (name === 'receiverPhone') {
      if (value !== '' && !/^\+?\d*$/.test(value)) return
    }

    setFormData(prev => ({ ...prev, [name]: newValue }))
  }

  const handleRouteChange = (index: number, value: string) => {
    if (value !== '' && !/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]*$/.test(value)) return
    
    const newRoute = [...formData.route]
    newRoute[index] = value
    setFormData(prev => ({ ...prev, route: newRoute }))
  }

  const addRouteStop = () => {
    setFormData(prev => ({
      ...prev,
      route: [...prev.route, '']
    }))
  }

  const removeRouteStop = (index: number) => {
    if (formData.route.length <= 2) {
      toast.error(t('shipments.routeMinError') || 'En az 2 durak olmalı (nereden-nereye)')
      return
    }
    const newRoute = formData.route.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, route: newRoute }))
  }

  const generateTrackingCode = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `CAR-${year}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.senderName.trim()) {
      toast.error(t('shipments.senderRequired') || 'Gönderici adı gerekli')
      return
    }
    if (!formData.receiverName.trim()) {
      toast.error(t('shipments.receiverRequired') || 'Alıcı adı gerekli')
      return
    }
    if (!formData.receiverPhone.trim()) {
      toast.error(t('shipments.phoneRequired') || 'Alıcı telefon numarası gerekli')
      return
    }
    if (!formData.receiverPhone.startsWith('+') || !/^\+\d+$/.test(formData.receiverPhone)) {
      toast.error(t('shipments.phoneFormatError') || 'Telefon numarası + ile başlamalı ve sadece rakam içermeli')
      return
    }
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      toast.error(t('shipments.weightRequired') || 'Geçerli ağırlık giriniz')
      return
    }
    
    const validRoute = formData.route.filter(r => r.trim() !== '')
    if (validRoute.length < 2) {
      toast.error(t('shipments.routeMinError') || 'En az 2 durak giriniz (nereden-nereye)')
      return
    }

    try {
      const weight = parseFloat(formData.weight)
      const price = formData.manualPrice ? parseFloat(formData.price) : parseFloat(calculatePrice(weight))
      
      const shipmentData = {
        senderName: formData.senderName.trim(),
        receiverName: formData.receiverName.trim(),
        receiverPhone: formData.receiverPhone.trim(),
        weight: weight,
        price: price,
        route: validRoute,
        routeStatus: validRoute.map(() => false),
        trackingCode: generateTrackingCode(),
        status: 'loaded',
      }

      const response = await fetch(`${API_URL}/api/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(shipmentData),
      })

      if (response.ok) {
        toast.success(t('shipments.addSuccess') || 'Kargo başarıyla eklendi!')
        setShowAddModal(false)
        resetForm()
        fetchShipments()
      } else {
        const error = await response.json()
        toast.error(t('common.error'))
      }
    } catch (error) {
      console.error('Kargo eklenirken hata:', error)
      toast.error(t('common.error') || 'Kargo eklenirken bir hata oluştu')
    }
  }

  const resetForm = () => {
    setFormData({
      senderName: '',
      receiverName: '',
      receiverPhone: '',
      weight: '',
      price: '',
      route: ['', ''],
      manualPrice: false,
    })
  }

  const handleDelete = (id: string) => {
    setPendingDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return

    setDeleting(true)
    try {
      const response = await fetch(`${API_URL}/api/shipments/${pendingDeleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        toast.success(t('common.deleted') || 'Kargo silindi')
        fetchShipments()
      } else {
        toast.error(t('common.error') || 'Kargo silinemedi')
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      toast.error(t('common.error') || 'Silme işlemi başarısız')
    } finally {
      setDeleting(false)
      setPendingDeleteId(null)
    }
  }

  const toggleRouteStatus = async (shipmentId: string, routeIndex: number) => {
    setUpdating(true)
    try {
      const currentShipment = shipments.find(s => s.id === shipmentId)
      if (!currentShipment) {
        toast.error(t('common.error') || 'Kargo bulunamadı')
        return
      }

      const newStatus = !currentShipment.routeStatus[routeIndex]
      let updatedStatus = [...currentShipment.routeStatus]
      if (newStatus) {
        for (let i = 0; i <= routeIndex; i++) {
          updatedStatus[i] = true
        }
      } else {
        for (let i = routeIndex; i < updatedStatus.length; i++) {
          updatedStatus[i] = false
        }
      }

      const response = await fetch(`${API_URL}/api/shipments/${shipmentId}/route/${routeIndex}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          fullStatus: updatedStatus 
        }),
      })

      if (response.ok) {
        const updatedShipment = await response.json()
        setShipments(prev => 
          prev.map(s => s.id === shipmentId ? updatedShipment : s)
        )
        if (selectedShipment && selectedShipment.id === shipmentId) {
          setSelectedShipment(updatedShipment)
        }
        const checkedCount = updatedShipment.routeStatus.filter((s: boolean) => s).length
        const totalCount = updatedShipment.route.length
        toast.success(`✅ ${t('shipments.routeUpdated') || 'Rota güncellendi!'} (${checkedCount}/${totalCount})`)
      } else {
        toast.error(t('common.error') || 'Güncelleme başarısız')
      }
    } catch (error) {
      console.error('Rota güncelleme hatası:', error)
      toast.error(t('common.error') || 'Rota güncellenemedi')
    } finally {
      setUpdating(false)
    }
  }

  const bulkUpdateRoute = async (routeIndex: number, status: boolean) => {
    if (selectedShipments.length === 0) {
      toast.error(t('shipments.selectCargo') || 'Lütfen en az bir kargo seçin')
      return
    }

    if (!confirm(`${selectedShipments.length} ${t('shipments.bulkUpdateConfirm') || 'kargonun rota durumunu güncellemek istediğinize emin misiniz?'}`)) return

    setUpdating(true)
    try {
      const updatedShipments: Shipment[] = []
      for (const id of selectedShipments) {
        const currentShipment = shipments.find(s => s.id === id)
        if (!currentShipment) continue

        let updatedStatus = [...currentShipment.routeStatus]
        if (status) {
          for (let i = 0; i <= routeIndex; i++) {
            updatedStatus[i] = true
          }
        } else {
          for (let i = routeIndex; i < updatedStatus.length; i++) {
            updatedStatus[i] = false
          }
        }

        const response = await fetch(`${API_URL}/api/shipments/${id}/route/${routeIndex}/toggle`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: status,
            fullStatus: updatedStatus 
          }),
        })

        if (response.ok) {
          const updated = await response.json()
          updatedShipments.push(updated)
        }
      }

      if (updatedShipments.length > 0) {
        setShipments(prev => 
          prev.map(s => {
            const updated = updatedShipments.find(u => u.id === s.id)
            return updated || s
          })
        )
        toast.success(`${updatedShipments.length} ${t('shipments.bulkUpdateSuccess') || 'kargo güncellendi'}`)
        setSelectedShipments([])
      }
    } catch (error) {
      console.error('Toplu güncelleme hatası:', error)
      toast.error(t('common.error') || 'Toplu güncelleme başarısız')
    } finally {
      setUpdating(false)
    }
  }

  const openRouteModal = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setShowRouteModal(true)
  }

  const filteredShipments = shipments.filter(s => 
    s.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.receiverPhone.includes(searchTerm)
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'loaded':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case 'loaded':
        return t('dashboard.loaded') || 'Ýüklendi'
      case 'shipped':
        return t('dashboard.shipped') || 'Iberildi'
      case 'delivered':
        return t('dashboard.deliveredStatus') || 'Gowşuryldy'
      default:
        return status
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.cargoManagement')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            <PlusIcon className="h-5 w-5" />
            {t('admin.addCargo')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder={t('shipments.search') || 'Kod, iberiji boýunça gözleg...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Bulk Update Buttons */}
      {selectedShipments.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-blue-800">
            {selectedShipments.length} {t('shipments.selected') || 'saýlandy'}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => bulkUpdateRoute(0, true)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
            >
              {t('shipments.firstStop') || 'Ikinji duralga ✓'}
            </button>
            <button
              onClick={() => bulkUpdateRoute(1, true)}
              className="px-3 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600 transition"
            >
              {t('shipments.secondStop') || 'Ikinji duralga ✓'}
            </button>
            <button
              onClick={() => bulkUpdateRoute(2, true)}
              className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition"
            >
              {t('shipments.thirdStop') || 'Üçünji duralga ✓'}
            </button>
            <button
              onClick={() => setSelectedShipments([])}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition"
            >
              {t('common.clear') || 'Arassala'}
            </button>
          </div>
        </div>
      )}

      {/* Shipments Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                <input 
                  type="checkbox" 
                  className="rounded"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedShipments(filteredShipments.map(s => s.id))
                    } else {
                      setSelectedShipments([])
                    }
                  }}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('shipments.code')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('shipments.sender')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('shipments.receiver')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('shipments.weight')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('shipments.price')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('shipments.status')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('shipments.route')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">{t('common.loading')}</td>
              </tr>
            ) : filteredShipments.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">{t('common.noData')}</td>
              </tr>
            ) : (
              filteredShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={selectedShipments.includes(shipment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedShipments([...selectedShipments, shipment.id])
                        } else {
                          setSelectedShipments(selectedShipments.filter(id => id !== shipment.id))
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{shipment.trackingCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{shipment.senderName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{shipment.receiverName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{shipment.weight} kg</td>
                  <td className="px-4 py-3 text-sm text-gray-600">${shipment.price}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(shipment.status)}`}>
                      {getStatusText(shipment.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">
                        {shipment.routeStatus.filter(s => s).length}/{shipment.route.length}
                      </span>
                      <button
                        onClick={() => openRouteModal(shipment)}
                        className="p-1 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded transition"
                        title={t('shipments.editRoute') || 'Ugry täzele'}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <button 
                        className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        onClick={() => handleDelete(shipment.id)}
                        title={t('common.delete') || 'Ýok et'}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pendingDeleteId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirmation-title"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 id="delete-confirmation-title" className="text-lg font-semibold text-slate-900">
                  {t('common.deleteTitle')}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{t('common.deleteConfirm')}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Update Modal */}
      {showRouteModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {t('shipments.editRoute') || 'Ugry täzele'} - {selectedShipment.trackingCode}
              </h2>
              <button
                onClick={() => {
                  setShowRouteModal(false)
                  setSelectedShipment(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Shipment Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">{t('shipments.sender')}:</span>
                    <span className="ml-2 font-medium">{selectedShipment.senderName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('shipments.receiver')}:</span>
                    <span className="ml-2 font-medium">{selectedShipment.receiverName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('shipments.weight')}:</span>
                    <span className="ml-2 font-medium">{selectedShipment.weight} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('shipments.status')}:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedShipment.status === 'loaded' ? 'bg-yellow-100 text-yellow-800' :
                      selectedShipment.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getStatusText(selectedShipment.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Route List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 mb-2">📍 {t('routeMap.title') || 'Ugur ýagdaýy'}</h3>
                {selectedShipment.route.map((stop, index) => {
                  const isChecked = selectedShipment.routeStatus[index] || false
                  const isLast = index === selectedShipment.route.length - 1
                  const isFirst = index === 0
                  const isPreviousChecked = index > 0 && selectedShipment.routeStatus[index - 1]
                  const canCheck = index === 0 || isPreviousChecked

                  return (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                        isChecked 
                          ? 'bg-green-50 border-green-300 shadow-sm' 
                          : canCheck 
                            ? 'bg-gray-50 border-gray-200 hover:border-primary-300'
                            : 'bg-gray-100 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isChecked ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-500 animate-pulse" />
                        ) : isLast ? (
                          <MapPinIcon className="h-6 w-6 text-red-400" />
                        ) : isFirst ? (
                          <TruckIcon className="h-6 w-6 text-blue-400" />
                        ) : (
                          <MapPinIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isChecked ? 'text-green-700' : 'text-gray-700'}`}>
                            {stop}
                          </span>
                          {isFirst && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{t('routeMap.start') || 'Başlangıç'}</span>
                          )}
                          {isLast && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">{t('routeMap.destination') || 'Barjak ýer'}</span>
                          )}
                          {isChecked && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded animate-pulse">
                              ✓ {t('routeMap.passed2') || 'Geçildi'}
                            </span>
                          )}
                          {!canCheck && !isChecked && index > 0 && (
                            <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">
                              ⚠ {t('routeMap.waiting') || 'Garaşylýar'}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (canCheck || isChecked) {
                            toggleRouteStatus(selectedShipment.id, index)
                          } else {
                            toast.error(t('routeMap.waitingError') || 'Öňki duralgasy belläň!')
                          }
                        }}
                        disabled={updating || (!canCheck && !isChecked)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isChecked
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : canCheck
                              ? 'bg-green-100 text-green-600 hover:bg-green-200 hover:scale-105'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        } disabled:opacity-50`}
                      >
                        {isChecked ? '⬅ ' + t('common.undo') || 'Yza gaýtar' : '✅ ' + t('routeMap.passed2') || 'Geçildi'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Progress */}
              <div className="mt-6 bg-gray-100 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('routeMap.progress') || 'Ösüş'}</span>
                  <span className="font-medium">
                    {selectedShipment.routeStatus.filter(s => s).length} / {selectedShipment.route.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(selectedShipment.routeStatus.filter(s => s).length / selectedShipment.route.length) * 100}%` 
                    }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    selectedShipment.routeStatus.filter(s => s).length === 0 ? 'bg-yellow-100 text-yellow-800' :
                    selectedShipment.routeStatus.filter(s => s).length === selectedShipment.route.length ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedShipment.routeStatus.filter(s => s).length === 0 ? '📦 ' + t('dashboard.loaded') || 'Ýüklendi' :
                     selectedShipment.routeStatus.filter(s => s).length === selectedShipment.route.length ? '✅ ' + t('dashboard.deliveredStatus') || 'Gowşuryldy' :
                     '🚚 ' + t('dashboard.shipped') || 'Iberildi'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowRouteModal(false)
                    setSelectedShipment(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  {t('common.close') || 'Ýap'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{t('admin.addCargo') || 'Ýük goş'}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('shipments.sender') || 'Iberiji'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleInputChange}
                  placeholder={t('admin.cargoForm.senderPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  pattern="[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+"
                  title={t('admin.cargoForm.senderPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('shipments.receiver') || 'Alyjy'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={handleInputChange}
                  placeholder={t('admin.cargoForm.receiverPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  pattern="[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+"
                  title={t('admin.cargoForm.receiverPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.cargoForm.receiverPhone')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="receiverPhone"
                  value={formData.receiverPhone}
                  onChange={handleInputChange}
                  placeholder={t('admin.cargoForm.phonePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  pattern="\+\d+"
                  title={t('admin.cargoForm.phoneHint')}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.cargoForm.phoneHint')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('shipments.weight') || 'Agram'} (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder={t('admin.cargoForm.weightPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">{t('shipments.price') || 'Baha'} ($)</label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      name="manualPrice"
                      checked={formData.manualPrice}
                      onChange={handleInputChange}
                      className="rounded"
                    />
                    {t('admin.cargoForm.manualPrice')}
                  </label>
                </div>
                <input
                  type="text"
                  name="price"
                  value={formData.manualPrice ? formData.price : (formData.weight ? calculatePrice(parseFloat(formData.weight)) : '0')}
                  onChange={handleInputChange}
                  disabled={!formData.manualPrice}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    !formData.manualPrice ? 'bg-gray-100' : ''
                  }`}
                />
                {!formData.manualPrice && formData.weight && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('admin.cargoForm.autoPrice')}: {formData.weight}kg × $2.5 = ${calculatePrice(parseFloat(formData.weight))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('shipments.route') || 'Ugur'} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {formData.route.map((stop, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-400 font-medium">
                        {index === 0 ? '📍' : index === formData.route.length - 1 ? '🏁' : '📍'}
                      </span>
                      <input
                        type="text"
                        value={stop}
                        onChange={(e) => handleRouteChange(index, e.target.value)}
                        placeholder={index === 0
                          ? t('admin.cargoForm.originPlaceholder')
                          : index === formData.route.length - 1
                            ? t('admin.cargoForm.destinationPlaceholder')
                            : t('admin.cargoForm.stopPlaceholder', { number: index })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required={index === 0 || index === formData.route.length - 1}
                      />
                      {index > 0 && index < formData.route.length - 1 && (
                        <button
                          type="button"
                          onClick={() => removeRouteStop(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <MinusCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      {index === formData.route.length - 1 && formData.route.length < 8 && (
                        <button
                          type="button"
                          onClick={addRouteStop}
                          className="p-1 text-primary-500 hover:text-primary-700"
                        >
                          <PlusCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <span>🔄</span>
                  <span>
                    {formData.route.filter(r => r.trim()).length > 0 && 
                      `${formData.route.filter(r => r.trim()).join(' → ')}`
                    }
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  {t('admin.addCargo') || 'Ýük goş'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  {t('common.cancel') || 'Ýatyryp goý'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}