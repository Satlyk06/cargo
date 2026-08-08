import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { copyToClipboard } from '../../utils/clipboard'

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

const s: Record<string, React.CSSProperties> = {
  page:        { padding: '28px 24px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif" },
  eyebrow:     { fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 3 },
  title:       { fontSize: 22, fontWeight: 600, color: '#0f172a', margin: 0 },
  subtitle:    { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 24 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 },
  card:        { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 18px 14px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow .15s', cursor: 'default' },
  cardInner:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel:   { fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 },
  cardValue:   { fontSize: 28, fontWeight: 600, letterSpacing: '-1px', lineHeight: 1 },
  iconWrap:    { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  accentBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, opacity: .5 },
  section:     { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  sectionHeader: { padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  { fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 },
  row:         { padding: '14px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'background .12s' },
  trackingCode: { fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 },
  rowMeta:     { fontSize: 12, color: '#64748b', display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginTop: 3 },
  emptyState:  { padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 },
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, inTransit: 0, delivered: 0 })

  useEffect(() => { if (user) fetchShipments() }, [user])

  const fetchShipments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/shipments/user/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setShipments(data)
        setStats({
          total: data.length,
          inTransit: data.filter((s: Shipment) => s.status === 'loaded' || s.status === 'shipped').length,
          delivered: data.filter((s: Shipment) => s.status === 'delivered').length,
        })
      }
    } catch { toast.error(t('notifications.noNotifications')) }
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

  const statCards = [
    {
      label: t('dashboard.inTransit'), value: stats.inTransit, accent: '#6366f1', bg: '#eef2ff',
      icon: <svg style={{width:20,height:20,color:'#6366f1'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
    },
    {
      label: t('dashboard.delivered'), value: stats.delivered, accent: '#10b981', bg: '#d1fae5',
      icon: <svg style={{width:20,height:20,color:'#10b981'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    },
    {
      label: t('dashboard.total'), value: stats.total, accent: '#64748b', bg: '#f1f5f9',
      icon: <svg style={{width:20,height:20,color:'#64748b'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
    },
  ]

  return (
    <div style={s.page}>
      <p style={s.eyebrow}>{t('common.controlPanel')}</p>
      <h1 style={s.title}>{t('dashboard.title')}</h1>
      <p style={s.subtitle}>{t('dashboard.welcome')} {user?.name || user?.phoneNumber}</p>

      <div style={s.grid}>
        {statCards.map(card => (
          <div key={card.label} style={s.card}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
          >
            <div style={s.cardInner}>
              <div>
                <p style={s.cardLabel}>{card.label}</p>
                <p style={{ ...s.cardValue, color: card.accent }}>{card.value}</p>
              </div>
              <div style={{ ...s.iconWrap, background: card.bg }}>{card.icon}</div>
            </div>
            <div style={{ ...s.accentBar, background: card.accent }} />
          </div>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <p style={s.sectionTitle}>{t('dashboard.recentShipments')}</p>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{shipments.length} {t('dashboard.records')}</span>
        </div>
        {loading ? (
          <div style={s.emptyState}>Yükleniyor...</div>
        ) : shipments.length === 0 ? (
          <div style={s.emptyState}>{t('dashboard.noShipments')}</div>
        ) : (
          shipments.slice(0, 5).map(shipment => {
            const statusMap = getStatusMap()
            const st = statusMap[shipment.status as keyof typeof statusMap] || { label: shipment.status, color: '#64748b', bg: '#f1f5f9' }
            const isSender = shipment.senderId === user?.id
            return (
              <div key={shipment.id} style={s.row}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <div style={{ flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => copyTrackingCode(shipment.trackingCode)}
                    style={{ ...s.trackingCode, background: 'none', border: 'none', cursor: 'copy', padding: 0 }}
                    title={t('common.copied')}
                  >
                    {shipment.trackingCode}
                  </button>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0' }}>
                    {isSender ? `↑ ${t('dashboard.sender')}` : `↓ ${t('dashboard.receiver')}`} · {shipment.senderName} → {shipment.receiverName}
                  </p>
                  <div style={s.rowMeta}>
                    <span>{shipment.weight} kg</span>
                    <span>${shipment.price}</span>
                    <span>{shipment.route.join(' → ')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(shipment.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
