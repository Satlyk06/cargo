import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import RouteMap from '../../components/common/RouteMap'
import { toast } from 'react-hot-toast'
import { copyToClipboard } from '../../utils/clipboard'
import { 
  MagnifyingGlassIcon, 
  ChevronDownIcon, 
  Square2StackIcon, 
  CubeIcon 
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Shipment {
  id: string
  trackingCode: string
  senderName: string
  receiverName: string
  receiverPhone: string
  weight: number
  price: number
  route: string[]
  routeStatus: boolean[]
  currentRouteIndex: number
  status: string
  createdAt: string
}

export default function ShipmentsPage() {
  const { t, i18n } = useTranslation()
  const { token, user } = useAuth()
  
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null)

  // Kargoları API'den çekme
  const fetchShipments = useCallback(async () => {
    if (!user?.id || !token) return
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/shipments/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setShipments(data)
      } else {
        toast.error(t('common.error') || 'Kargolar yüklenemedi')
      }
    } catch (err) {
      console.error(err)
      toast.error(t('common.error') || 'Kargolar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [user?.id, token, t])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  // Statü yapılandırması
  const getStatusMap = () => ({
    loaded: { label: t('dashboard.loaded'), color: 'bg-amber-50 text-amber-700 border-amber-200' },
    shipped: { label: t('dashboard.shipped'), color: 'bg-blue-50 text-blue-700 border-blue-200' },
    delivered: { label: t('dashboard.deliveredStatus'), color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  })

  // Takip kodunu kopyala
  const copyTrackingCode = async (trackingCode: string) => {
    try {
      await copyToClipboard(trackingCode)
      toast.success(t('common.copied') || 'Kopyalandı')
    } catch {
      toast.error(t('common.error') || 'Hata oluştu')
    }
  }

  // Tarih formatı
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const lang = i18n.language || 'tr'
    const locale = lang === 'tm' ? 'tk-TM' : lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'tr-TR'
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  const tabs = [
    { id: 'all', label: t('dashboard.all') },
    { id: 'loaded', label: t('dashboard.loaded') },
    { id: 'shipped', label: t('dashboard.shipped') },
    { id: 'delivered', label: t('dashboard.deliveredStatus') },
  ]

  // Filtreleme mantığı
  const filtered = shipments
    .filter(s => activeTab === 'all' || s.status === activeTab)
    .filter(s =>
      s.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
    )

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-5">
        
        {/* Header */}
        <div>
          <p className="text-[11px] font-bold tracking-widest text-indigo-600 uppercase mb-1">
            {t('common.cargoManagement')}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('shipments.title')}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('shipments.search') || 'Kargo ara...'}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all duration-150
                  ${isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }
                `}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Shipments List */}
        {loading ? (
          /* Skeleton Loader */
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-5 bg-slate-200 rounded-full w-20" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-2 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
              <CubeIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              {t('dashboard.noShipments')}
            </p>
          </div>
        ) : (
          /* Cards List */
          <div className="space-y-3">
            {filtered.map(shipment => {
              const isExpanded = expandedShipment === shipment.id
              const passed = shipment.routeStatus.filter(Boolean).length
              const total = shipment.route.length
              const pct = total > 0 ? (passed / total) * 100 : 0

              const statusMap = getStatusMap()
              const st = statusMap[shipment.status as keyof typeof statusMap] || {
                label: shipment.status,
                color: 'bg-slate-100 text-slate-700 border-slate-200'
              }

              return (
                <div
                  key={shipment.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Card Header Clickable Area */}
                  <div
                    onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}
                    className="p-4 sm:p-5 cursor-pointer flex items-start justify-between gap-4 select-none"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Top Row: Tracking code, Status, Stops */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            copyTrackingCode(shipment.trackingCode)
                          }}
                          className="group inline-flex items-center gap-1.5 font-semibold text-slate-900 text-sm hover:text-indigo-600 transition-colors"
                          title={t('common.copied') || 'Kopyala'}
                        >
                          <span>{shipment.trackingCode}</span>
                          <Square2StackIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </button>

                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${st.color}`}>
                          {st.label}
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {passed}/{total} {t('shipments.stops')}
                        </span>
                      </div>

                      {/* Route / Sender-Receiver */}
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {shipment.senderName} <span className="text-slate-400 font-normal">→</span> {shipment.receiverName}
                      </p>

                      {/* Meta Information */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                          {shipment.weight} kg
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                          ${shipment.price}
                        </span>
                        <span className="truncate max-w-[200px] sm:max-w-xs text-slate-400">
                          {shipment.route.join(' → ')}
                        </span>
                        <span className="text-slate-400 ml-auto sm:ml-0">
                          {formatDate(shipment.createdAt)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] font-medium text-slate-400">
                          {t('shipments.progress')}
                        </span>
                        <div className="flex-1 max-w-[180px] sm:max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">
                          %{Math.round(pct)}
                        </span>
                      </div>
                    </div>

                    {/* Expand Chevron Icon */}
                    <div className="flex-shrink-0 pt-1">
                      <ChevronDownIcon
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-indigo-600' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/50 space-y-4 animate-in fade-in duration-150">
                      {/* Visual Route Map Component */}
                      <RouteMap
                        route={shipment.route}
                        routeStatus={shipment.routeStatus}
                        currentRouteIndex={shipment.currentRouteIndex}
                      />

                      {/* Detail Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white rounded-xl border border-slate-200 text-xs">
                        <div className="flex justify-between sm:justify-start sm:gap-2 border-b sm:border-0 pb-1 sm:pb-0 border-slate-100">
                          <span className="text-slate-400">{t('shipments.sender')}:</span>
                          <span className="font-semibold text-slate-800">{shipment.senderName}</span>
                        </div>
                        <div className="flex justify-between sm:justify-start sm:gap-2 border-b sm:border-0 pb-1 sm:pb-0 border-slate-100">
                          <span className="text-slate-400">{t('shipments.receiver')}:</span>
                          <span className="font-semibold text-slate-800">{shipment.receiverName}</span>
                        </div>
                        <div className="flex justify-between sm:justify-start sm:gap-2 border-b sm:border-0 pb-1 sm:pb-0 border-slate-100">
                          <span className="text-slate-400">{t('shipments.weight')}:</span>
                          <span className="font-semibold text-slate-800">{shipment.weight} kg</span>
                        </div>
                        <div className="flex justify-between sm:justify-start sm:gap-2 border-b sm:border-0 pb-1 sm:pb-0 border-slate-100">
                          <span className="text-slate-400">{t('shipments.price')}:</span>
                          <span className="font-semibold text-slate-800">${shipment.price}</span>
                        </div>
                        <div className="flex justify-between sm:justify-start sm:gap-2 border-b sm:border-0 pb-1 sm:pb-0 border-slate-100">
                          <span className="text-slate-400">{t('shipments.status')}:</span>
                          <span className="font-semibold text-slate-800">{st.label}</span>
                        </div>
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span className="text-slate-400">{t('shipments.date')}:</span>
                          <span className="font-semibold text-slate-800">{formatDate(shipment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}