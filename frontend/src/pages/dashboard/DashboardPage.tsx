import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { copyToClipboard } from '../../utils/clipboard'
import {
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  CubeIcon,
  Square2StackIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Shipment {
  id: string
  trackingCode: string
  senderId: string
  senderName: string
  receiverName: string
  receiverPhone: string
  weight: number
  price: number
  route: string[]
  routeStatus: boolean[]
  status: string
  createdAt: string
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { token, user } = useAuth()
  
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, inTransit: 0, delivered: 0 })

  // Kargoları ve İstatistikleri API'den Çekme
  const fetchShipments = useCallback(async () => {
    if (!user?.id || !token) return
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/shipments/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: Shipment[] = await res.json()
        setShipments(data)
        setStats({
          total: data.length,
          inTransit: data.filter((s) => s.status === 'loaded' || s.status === 'shipped').length,
          delivered: data.filter((s) => s.status === 'delivered').length,
        })
      } else {
        toast.error(t('common.error') || 'Veriler yüklenemedi')
      }
    } catch (error) {
      console.error('Shipments loading error:', error)
      toast.error(t('common.error') || 'Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [user?.id, token, t])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  // Statü Yapılandırması
  const getStatusMap = () => ({
    loaded: { label: t('dashboard.loaded'), color: 'bg-amber-50 text-amber-700 border-amber-200' },
    shipped: { label: t('dashboard.shipped'), color: 'bg-blue-50 text-blue-700 border-blue-200' },
    delivered: { label: t('dashboard.deliveredStatus'), color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  })

  // Takip Kodunu Kopyalama
  const copyTrackingCode = async (trackingCode: string) => {
    try {
      await copyToClipboard(trackingCode)
      toast.success(t('common.copied') || 'Kopyalandı')
    } catch {
      toast.error(t('common.error') || 'Hata oluştu')
    }
  }

  // Tarih Formatı
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

  const statCards = [
    {
      label: t('dashboard.inTransit'),
      value: stats.inTransit,
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      barColor: 'bg-indigo-600',
      icon: <ArrowsRightLeftIcon className="w-5 h-5 text-indigo-600" />
    },
    {
      label: t('dashboard.delivered'),
      value: stats.delivered,
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      barColor: 'bg-emerald-600',
      icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
    },
    {
      label: t('dashboard.total'),
      value: stats.total,
      textColor: 'text-slate-700',
      bgColor: 'bg-slate-100',
      barColor: 'bg-slate-500',
      icon: <CubeIcon className="w-5 h-5 text-slate-600" />
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <p className="text-[11px] font-bold tracking-widest text-indigo-600 uppercase mb-1">
            {t('common.controlPanel')}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('dashboard.welcome')} <span className="font-semibold text-slate-700">{user?.name || user?.phoneNumber}</span>
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            /* Stat Skeleton Loading */
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse space-y-3">
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-7 bg-slate-200 rounded w-1/3" />
              </div>
            ))
          ) : (
            statCards.map(card => (
              <div
                key={card.label}
                className="relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                      {card.label}
                    </p>
                    <p className={`text-3xl font-bold tracking-tight ${card.textColor}`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.bgColor}`}>
                    {card.icon}
                  </div>
                </div>
                {/* Bottom Accent Bar */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-60 ${card.barColor}`} />
              </div>
            ))
          )}
        </div>

        {/* Recent Shipments Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {t('dashboard.recentShipments')}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {shipments.length} {t('dashboard.records')}
            </span>
          </div>

          {/* List Content */}
          {loading ? (
            /* List Skeleton Loading */
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex justify-between items-center p-3 rounded-xl bg-slate-50">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded-full w-20" />
                </div>
              ))}
            </div>
          ) : shipments.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <CubeIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                {t('dashboard.noShipments')}
              </p>
            </div>
          ) : (
            /* Rows List */
            <div className="divide-y divide-slate-100">
              {shipments.slice(0, 5).map(shipment => {
                const statusMap = getStatusMap()
                const st = statusMap[shipment.status as keyof typeof statusMap] || {
                  label: shipment.status,
                  color: 'bg-slate-100 text-slate-700 border-slate-200'
                }
                const isSender = shipment.senderId === user?.id

                return (
                  <div
                    key={shipment.id}
                    className="p-4 sm:px-5 hover:bg-slate-50/80 transition-colors duration-150 flex items-center justify-between gap-4"
                  >
                    {/* Left Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyTrackingCode(shipment.trackingCode)}
                          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                          title={t('common.copied') || 'Kopyala'}
                        >
                          <span>{shipment.trackingCode}</span>
                          <Square2StackIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        {isSender ? (
                          <span className="inline-flex items-center text-indigo-600 gap-0.5">
                            <ArrowUpRightIcon className="w-3 h-3" />
                            {t('dashboard.sender')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-emerald-600 gap-0.5">
                            <ArrowDownLeftIcon className="w-3 h-3" />
                            {t('dashboard.receiver')}
                          </span>
                        )}
                        <span className="text-slate-300">•</span>
                        <span className="truncate">{shipment.senderName} → {shipment.receiverName}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-0.5">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px] font-medium">
                          {shipment.weight} kg
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px] font-medium">
                          ${shipment.price}
                        </span>
                        <span className="truncate max-w-[200px] sm:max-w-xs text-slate-400">
                          {shipment.route.join(' → ')}
                        </span>
                      </div>
                    </div>

                    {/* Right Info */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDate(shipment.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}