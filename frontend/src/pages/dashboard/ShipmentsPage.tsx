import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import QRCodeDisplay from '../../components/common/QRCodeDisplay'
import RouteMap from '../../components/common/RouteMap'
import { toast } from 'react-hot-toast'
import { copyToClipboard } from '../../utils/clipboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Shipment {
  id: string; trackingCode: string; senderName: string; receiverName: string
  receiverPhone: string; weight: number; price: number; route: string[]
  routeStatus: boolean[]; currentRouteIndex: number; status: string
  qrCode: string; createdAt: string
}

const s: Record<string, React.CSSProperties> = {
  page:         { padding: '28px 24px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif" },
  eyebrow:      { fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 3 },
  title:        { fontSize: 22, fontWeight: 600, color: '#0f172a', margin: '0 0 18px' },
  searchWrap:   { position: 'relative', marginBottom: 14 },
  searchInput:  { width: '100%', padding: '9px 12px 9px 36px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', color: '#0f172a', background: '#fff', boxSizing: 'border-box' as const },
  searchIcon:   { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  tabs:         { display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' as const, paddingBottom: 4 },
  tab:          { padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid #e2e8f0', cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all .12s', background: '#fff', color: '#64748b' },
  tabActive:    { background: '#6366f1', color: '#fff', border: '1px solid #6366f1' },
  list:         { display: 'flex', flexDirection: 'column' as const, gap: 10 },
  card:         { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'box-shadow .15s' },
  cardBody:     { padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14 },
  info:         { flex: 1, minWidth: 0 },
  topRow:       { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 3 },
  code:         { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  meta:         { fontSize: 12, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginTop: 4 },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  progressLabel:{ fontSize: 11, color: '#94a3b8', flexShrink: 0 },
  progressTrack:{ flex: 1, maxWidth: 200, height: 4, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, transition: 'width .4s ease' },
  progressCount:{ fontSize: 11, color: '#94a3b8', flexShrink: 0 },
  chevron:      { flexShrink: 0, color: '#94a3b8', transition: 'transform .2s' },
  expanded:     { borderTop: '1px solid #f1f5f9', padding: '16px', background: '#f8fafc' },
  detailGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14, background: '#fff', borderRadius: 8, padding: '12px 14px', border: '1px solid #e2e8f0', fontSize: 13 },
  detailLabel:  { color: '#94a3b8' },
  detailVal:    { fontWeight: 500, color: '#0f172a' },
  emptyState:   { textAlign: 'center', padding: '48px 20px', color: '#94a3b8', fontSize: 14 },
}

export default function ShipmentsPage() {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null)

  useEffect(() => { if (user) fetchShipments() }, [user])

  const fetchShipments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/shipments/user/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setShipments(await res.json())
    } catch { toast.error('Kargolar yüklenemedi') }
    finally { setLoading(false) }
  }

  const getStatusMap = () => ({
    loaded:    { label: t('dashboard.loaded'),          color: '#92400e', bg: '#fef3c7' },
    shipped:   { label: t('dashboard.shipped'),         color: '#1e40af', bg: '#dbeafe' },
    delivered: { label: t('dashboard.deliveredStatus'), color: '#065f46', bg: '#d1fae5' },
  })

  const copyTrackingCode = async (trackingCode: string) => {
    try {
      await copyToClipboard(trackingCode)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const tabs = [
    { id: 'all',       label: t('dashboard.all') },
    { id: 'loaded',    label: t('dashboard.loaded') },
    { id: 'shipped',   label: t('dashboard.shipped') },
    { id: 'delivered', label: t('dashboard.deliveredStatus') },
  ]

  const filtered = shipments
    .filter(s => activeTab === 'all' || s.status === activeTab)
    .filter(s =>
      s.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
    )

  return (
    <div style={s.page}>
      <p style={s.eyebrow}>{t('common.cargoManagement')}</p>
      <h1 style={s.title}>{t('shipments.title')}</h1>

      <div style={s.searchWrap}>
        <svg style={{ ...s.searchIcon, width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input style={s.searchInput} type="text" placeholder={t('shipments.search')}
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#6366f1')}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />
      </div>

      <div style={s.tabs}>
        {tabs.map(tab => (
          <button key={tab.id} style={activeTab === tab.id ? { ...s.tab, ...s.tabActive } : s.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.emptyState}>Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyState}>{t('dashboard.noShipments')}</div>
      ) : (
        <div style={s.list}>
          {filtered.map(shipment => {
            const isExpanded = expandedShipment === shipment.id
            const passed = shipment.routeStatus.filter(Boolean).length
            const total  = shipment.route.length
            const pct    = total > 0 ? (passed / total) * 100 : 0
            const statusMap = getStatusMap()
            const st = statusMap[shipment.status as keyof typeof statusMap] || { label: shipment.status, color: '#475569', bg: '#f1f5f9' }

            return (
              <div key={shipment.id} style={s.card}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)')}
              >
                <div style={s.cardBody} onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}>
                  <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                    <QRCodeDisplay
                      trackingCode={shipment.trackingCode}
                      qrCode={shipment.qrCode || ''}
                      shipmentData={{ senderName: shipment.senderName, receiverName: shipment.receiverName, receiverPhone: shipment.receiverPhone, weight: shipment.weight, route: shipment.route }}
                    />
                  </div>

                  <div style={s.info}>
                    <div style={s.topRow}>
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation()
                          copyTrackingCode(shipment.trackingCode)
                        }}
                        style={{ ...s.code, background: 'none', border: 'none', cursor: 'copy', padding: 0 }}
                        title={t('common.copied')}
                      >
                        {shipment.trackingCode}
                      </button>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{passed}/{total} {t('shipments.stops')}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0' }}>
                      {shipment.senderName} → {shipment.receiverName}
                    </p>
                    <div style={s.meta}>
                      <span>{shipment.weight} kg</span>
                      <span>${shipment.price}</span>
                      <span>{shipment.route.join(' → ')}</span>
                      <span>{new Date(shipment.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div style={s.progressWrap}>
                      <span style={s.progressLabel}>{t('shipments.progress')}</span>
                      <div style={s.progressTrack}>
                        <div style={{ ...s.progressFill, width: `${pct}%`, background: pct === 100 ? '#10b981' : '#6366f1' }} />
                      </div>
                      <span style={s.progressCount}>{passed}/{total}</span>
                    </div>
                  </div>

                  <svg style={{ ...s.chevron, width: 16, height: 16, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isExpanded && (
                  <div style={s.expanded}>
                    <RouteMap route={shipment.route} routeStatus={shipment.routeStatus} currentRouteIndex={shipment.currentRouteIndex} />
                    <div style={s.detailGrid}>
                      {[
                        [t('shipments.sender'),   shipment.senderName],
                        [t('shipments.receiver'),  shipment.receiverName],
                        [t('shipments.weight'),    `${shipment.weight} kg`],
                        [t('shipments.price'),     `$${shipment.price}`],
                        [t('shipments.status'),    st.label],
                        [t('shipments.date'),      new Date(shipment.createdAt).toLocaleDateString('tr-TR')],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <span style={s.detailLabel}>{label}: </span>
                          <span style={s.detailVal}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
