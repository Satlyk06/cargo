import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { copyToClipboard } from '../../utils/clipboard'
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  Square2StackIcon,
  CubeIcon,
  FunnelIcon,
  ArrowPathIcon,
  XMarkIcon,
  MapPinIcon,
  CheckCircleIcon,
  TruckIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

const API_URL = (import.meta.env.VITE_API_URL || 'https://cargo-qujk.onrender.com').replace(/\/api\/?$/, '')

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
  qrCode: string | null
}

const STATUS_CONFIG = {
  loaded:    { label: 'dashboard.loaded',         color: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-400' },
  shipped:   { label: 'dashboard.shipped',         color: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-400' },
  delivered: { label: 'dashboard.deliveredStatus', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
} as const

// ── Compact vertical route tracker ──────────────────────────────────────────
function RouteTracker({
  route,
  routeStatus,
  currentRouteIndex,
  currentLocationLabel,
}: {
  route: string[]
  routeStatus: boolean[]
  currentRouteIndex: number
  currentLocationLabel: string
}) {
  const passed = routeStatus.filter(Boolean).length
  const total  = route.length
  const pct    = total > 1 ? (passed / (total - 1)) * 100 : 0

  return (
    <div className="w-full">
      {/* Truck + Road */}
      <div className="relative mx-2 mb-4">
        {/* Road bg */}
        <div className="relative h-8 rounded-2xl bg-slate-800 overflow-hidden">
          {/* Road texture — center dashed line */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex gap-2 px-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-0.5 flex-1 rounded-full bg-amber-300/30" />
            ))}
          </div>
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-2xl bg-indigo-600/40 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
          {/* Edge glow */}
          <div className="absolute inset-y-0 left-0 w-8 rounded-l-2xl bg-gradient-to-r from-indigo-500/20 to-transparent" />
        </div>

        {/* Truck badge riding the road */}
        <div
          className="absolute -top-3 z-20 transition-all duration-700"
          style={{
            left: `clamp(0px, calc(${pct}% - 18px), calc(100% - 36px))`,
          }}
        >
          <div className="bg-indigo-600 text-white rounded-lg px-2 py-1 shadow-lg shadow-indigo-300/50 flex items-center gap-1 border border-indigo-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
            <span className="text-[9px] font-bold tracking-wide">
              {Math.round(pct)}%
            </span>
          </div>
          {/* Arrow down */}
          <div className="w-0 h-0 mx-auto border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-indigo-600" />
        </div>
      </div>

      {/* Stops row */}
      <div className="relative flex justify-between">
        {/* Connector lines between nodes */}
        <div className="absolute top-[14px] left-4 right-4 h-px bg-slate-200" />
        {passed > 0 && (
          <div
            className="absolute top-[14px] left-4 h-px bg-emerald-400 transition-all duration-700"
            style={{
              width: `calc((100% - 32px) * ${Math.min(passed - 1, total - 1) / Math.max(total - 1, 1)})`,
            }}
          />
        )}

        {route.map((stop, idx) => {
          const done    = routeStatus[idx]
          const current = idx === currentRouteIndex && !done
          const isFirst = idx === 0
          const isLast  = idx === route.length - 1

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center" style={{ flex: '0 0 auto', width: `${100 / total}%` }}>
              {/* Node */}
              <div className={`
                w-7 h-7 rounded-full border-2 flex items-center justify-center mb-1.5 transition-all duration-300
                ${done
                  ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200'
                  : current
                    ? 'bg-white border-indigo-600 shadow-md shadow-indigo-200'
                    : isLast
                      ? 'bg-white border-slate-300'
                      : 'bg-white border-slate-200'
                }
              `}>
                {done ? (
                  /* checkmark */
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : current ? (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                ) : isLast ? (
                  /* flag / destination */
                  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                  </svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Stop name */}
              <p className={`
                text-center leading-tight px-0.5 max-w-full
                text-[9px] font-semibold
                ${done    ? 'text-emerald-600' :
                  current ? 'text-indigo-700'  :
                  isLast  ? 'text-slate-500'   : 'text-slate-400'}
              `}
                style={{ wordBreak: 'break-word', hyphens: 'auto' }}
              >
                {stop}
              </p>

              {/* "Burada" badge */}
              {current && (
                <span className="mt-1 text-[8px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                  {currentLocationLabel}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ShipmentsPage() {
  const { t, i18n } = useTranslation()
  const { token, user } = useAuth()

  const [shipments, setShipments]               = useState<Shipment[]>([])
  const [loading, setLoading]                   = useState(true)
  const [refreshing, setRefreshing]             = useState(false)
  const [activeTab, setActiveTab]               = useState('all')
  const [searchTerm, setSearchTerm]             = useState('')
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc]           = useState<string | null>(null)

  const fetchShipments = useCallback(async (silent = false) => {
    if (!user?.id || !token) return
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      const res = await fetch(`${API_URL}/api/shipments/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setShipments(data)
      } else {
        toast.error(t('common.shipmentsLoadError'))
      }
    } catch (err) {
      console.error(err)
      toast.error(t('common.shipmentsLoadError'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id, token, t])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  const copyTrackingCode = async (code: string) => {
    try {
      await copyToClipboard(code)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const formatDate = (dateString: string) => {
    const date   = new Date(dateString)
    const lang   = i18n.language || 'tr'
    const locale = lang === 'tm' ? 'tk-TM' : lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'tr-TR'
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: '2-digit' })
  }

  const tabs = [
    { id: 'all',       label: t('dashboard.all') },
    { id: 'loaded',    label: t('dashboard.loaded') },
    { id: 'shipped',   label: t('dashboard.shipped') },
    { id: 'delivered', label: t('dashboard.deliveredStatus') },
  ]

  const counts = {
    all:       shipments.length,
    loaded:    shipments.filter(s => s.status === 'loaded').length,
    shipped:   shipments.filter(s => s.status === 'shipped').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
  }

  const filtered = shipments
    .filter(s => activeTab === 'all' || s.status === activeTab)
    .filter(s =>
      s.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
    )

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-6"
          style={{ margin: 0 }}
          onClick={() => setLightboxSrc(null)}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
            <img
              src={lightboxSrc}
              alt={t('shipments.photo')}
              className="w-full rounded-2xl object-contain shadow-2xl max-h-[60vh]"
            />
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase mb-0.5">
              {t('common.cargoManagement')}
            </p>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {t('shipments.title')}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => fetchShipments(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-2">
          {tabs.map(tab => {
            const count    = counts[tab.id as keyof typeof counts]
            const cfg      = STATUS_CONFIG[tab.id as keyof typeof STATUS_CONFIG]
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`text-left p-2.5 rounded-xl border transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-100'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                }`}
              >
                {cfg && (
                  <span className={`block w-1.5 h-1.5 rounded-full mb-1.5 ${isActive ? 'bg-white/50' : cfg.dot}`} />
                )}
                <p className={`text-xl font-bold leading-none mb-0.5 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {count}
                </p>
                <p className={`text-[10px] font-medium truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {tab.label}
                </p>
              </button>
            )
          })}
        </div>

        {/* ── Search ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('shipments.search')}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 transition-all shadow-sm"
            >
              {t('shipments.clearSearch')}
            </button>
          )}
        </div>

        {/* ── Results label ── */}
        {!loading && (
          <div className="flex items-center gap-1.5">
            <FunnelIcon className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-400 font-medium">
              {filtered.length} {t('shipments.results')}
              {searchTerm && <span className="ml-1 text-indigo-500">"{searchTerm}"</span>}
            </span>
          </div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded-full w-16" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-1 bg-slate-100 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 bg-white border border-slate-200 rounded-xl text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
              <CubeIcon className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-600">{t('dashboard.noShipments')}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {searchTerm ? '' : ''}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(shipment => {
              const isExpanded = expandedShipment === shipment.id
              const passed     = shipment.routeStatus.filter(Boolean).length
              const total      = shipment.route.length
              const pct        = total > 0 ? (passed / total) * 100 : 0
              const cfg        = STATUS_CONFIG[shipment.status as keyof typeof STATUS_CONFIG]
              const st         = cfg
                ? { label: t(cfg.label), color: cfg.color, dot: cfg.dot }
                : { label: shipment.status, color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' }

              return (
                <div
                  key={shipment.id}
                  className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'border-indigo-200 shadow-sm shadow-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}
                    className="px-3.5 py-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-2 h-2 rounded-full ${st.dot}`} />

                      <div className="flex-1 min-w-0">
                        {/* Row 1 */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); copyTrackingCode(shipment.trackingCode) }}
                            className="group inline-flex items-center gap-1 font-mono font-bold text-slate-900 text-xs hover:text-indigo-600 transition-colors"
                          >
                            {shipment.trackingCode}
                            <Square2StackIcon className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                          </button>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>
                            {st.label}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {formatDate(shipment.createdAt)}
                          </span>
                        </div>

                        {/* Row 2 */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {shipment.senderName}
                            <span className="text-slate-300 mx-1">→</span>
                            {shipment.receiverName}
                          </p>
                          <span className="flex-shrink-0 text-[10px] text-slate-400">
                            {passed}/{total} {t('shipments.stops')}
                          </span>
                        </div>

                        {/* Row 3 */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                            {shipment.weight}kg
                          </span>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                            ${shipment.price}
                          </span>
                          <div className="flex-1 flex items-center gap-1.5">
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 tabular-nums flex-shrink-0">
                              %{Math.round(pct)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronDownIcon
                        className={`flex-shrink-0 w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-3.5 py-3 space-y-3 animate-in fade-in duration-150">

                      {/* Photo + Details */}
                      <div className="flex gap-3 items-start">
                        {shipment.qrCode && (
                          <button
                            type="button"
                            onClick={() => setLightboxSrc(shipment.qrCode)}
                            className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-300 transition-all group relative shadow-sm"
                          >
                            <img
                              src={shipment.qrCode}
                              alt={t('shipments.photo')}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <MagnifyingGlassIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                            </div>
                          </button>
                        )}

                        <div className="flex-1 min-w-0 bg-white rounded-lg border border-slate-200 overflow-hidden">
                          {[
                            { label: t('shipments.sender'),   value: shipment.senderName },
                            { label: t('shipments.receiver'), value: shipment.receiverName },
                            { label: t('shipments.weight'),   value: `${shipment.weight} kg` },
                            { label: t('shipments.price'),    value: `$${shipment.price}` },
                            { label: t('shipments.status'),   value: st.label },
                            { label: t('shipments.date'),     value: formatDate(shipment.createdAt) },
                          ].map((item, idx, arr) => (
                            <div
                              key={item.label}
                              className={`flex items-center justify-between px-3 py-1.5 text-[11px] ${idx < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                            >
                              <span className="text-slate-400">{item.label}</span>
                              <span className="font-semibold text-slate-800 truncate ml-2 max-w-[55%] text-right">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Route Tracker ── */}
                      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon className="w-3.5 h-3.5 text-indigo-500" />
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                              {t('shipments.route')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {passed}/{total}
                            </span>
                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <RouteTracker
                          route={shipment.route}
                          routeStatus={shipment.routeStatus}
                          currentRouteIndex={shipment.currentRouteIndex}
                          currentLocationLabel={t('shipments.currentLocation')}
                        />
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
