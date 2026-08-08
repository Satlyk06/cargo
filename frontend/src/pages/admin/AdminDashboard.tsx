import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import {
  TruckIcon, UsersIcon, ShieldCheckIcon,
  ArrowUpTrayIcon, ClockIcon, CheckCircleIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Stats {
  totalShipments: number
  totalUsers: number
  totalAdmins: number
  loaded: number
  shipped: number
  delivered: number
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setStats(await res.json())
      else toast.error(t('admin.stats.error') || 'İstatistikler yüklenemedi')
    } catch {
      toast.error(t('admin.stats.error') || 'İstatistikler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const CARDS = (stats: Stats | null) => [
    { label: t('admin.stats.totalShipments'), value: stats?.totalShipments ?? 0, icon: TruckIcon, accent: '#6366f1', bg: '#eef2ff' },
    { label: t('admin.stats.totalUsers'),    value: stats?.totalUsers ?? 0, icon: UsersIcon, accent: '#0ea5e9', bg: '#e0f2fe' },
    { label: t('admin.stats.totalAdmins'),   value: stats?.totalAdmins ?? 0, icon: ShieldCheckIcon, accent: '#8b5cf6', bg: '#ede9fe' },
    { label: t('admin.stats.loaded'),        value: stats?.loaded ?? 0, icon: ArrowUpTrayIcon, accent: '#f59e0b', bg: '#fef3c7' },
    { label: t('admin.stats.shipped'),       value: stats?.shipped ?? 0, icon: ClockIcon, accent: '#6366f1', bg: '#eef2ff' },
    { label: t('admin.stats.delivered'),     value: stats?.delivered ?? 0, icon: CheckCircleIcon, accent: '#10b981', bg: '#d1fae5' },
  ]

  const cards = CARDS(stats)
  const total = stats?.totalShipments || 1

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>{t('common.controlPanel')}</p>
          <h1 style={s.title}>{t('admin.dashboard')}</h1>
        </div>
        <button onClick={fetchStats} disabled={loading} style={s.refreshBtn}>
          <ArrowPathIcon style={{ width: 14, height: 14, ...(loading ? s.spin : {}) }} />
          {t('admin.refresh')}
        </button>
      </div>

      {/* Stat Cards */}
      <div style={s.grid}>
        {cards.map((card) =>
          loading ? (
            <div key={card.label} style={s.card}>
              <div style={s.skeleton} />
            </div>
          ) : (
            <div key={card.label} style={s.card}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
            >
              <div style={s.cardInner}>
                <div>
                  <p style={s.cardLabel}>{card.label}</p>
                  <p style={{ ...s.cardValue, color: card.accent }}>
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div style={{ ...s.iconWrap, background: card.bg }}>
                  <card.icon style={{ width: 20, height: 20, color: card.accent }} />
                </div>
              </div>
              <div style={{ ...s.accentBar, background: card.accent }} />
            </div>
          )
        )}
      </div>

      {/* Summary Bar */}
      {!loading && stats && stats.totalShipments > 0 && (
        <div style={s.summary}>
          <p style={s.summaryTitle}>{t('admin.summary')}</p>
          <div style={s.dots}>
            {[
              { label: t('admin.stats.loaded'), value: stats.loaded, color: '#f59e0b' },
              { label: t('admin.stats.shipped'), value: stats.shipped, color: '#6366f1' },
              { label: t('admin.stats.delivered'), value: stats.delivered, color: '#10b981' },
              { label: t('admin.stats.totalShipments'), value: stats.totalShipments, color: '#64748b' },
            ].map(item => (
              <div key={item.label} style={s.dotItem}>
                <span style={{ ...s.dot, background: item.color }} />
                <span style={s.dotLabel}>{item.label}:</span>
                <span style={{ ...s.dotVal, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={s.track}>
            {[
              { value: stats.loaded, color: '#f59e0b' },
              { value: stats.shipped, color: '#6366f1' },
              { value: stats.delivered, color: '#10b981' },
            ].map((seg, i) => (
              <div key={i} style={{
                height: '100%',
                width: `${(seg.value / total) * 100}%`,
                background: seg.color,
                opacity: 0.75,
                borderRadius: i === 0 ? '4px 0 0 4px' : i === 2 ? '0 4px 4px 0' : 0,
                transition: 'width .5s ease',
              }} />
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    background: '#f8fafc',
    minHeight: '100vh',
    padding: '28px 24px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: '#6366f1',
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: '#0f172a',
    margin: 0,
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 13px',
    fontSize: 13,
    fontWeight: 500,
    color: '#64748b',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
  },
  spin: { animation: 'spin 1s linear infinite' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: 12,
    marginBottom: 14,
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '18px 18px 14px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'box-shadow .15s',
    cursor: 'default',
  },
  cardInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 6,
  },
  cardValue: { fontSize: 28, fontWeight: 600, letterSpacing: '-1px', lineHeight: 1 },
  iconWrap: {
    width: 40, height: 40,
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  accentBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, opacity: .5 },
  skeleton: { height: 60, borderRadius: 8, background: '#f1f5f9', animation: 'pulse 1.4s ease infinite' },
  summary: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  summaryTitle: {
    fontSize: 11, fontWeight: 600, letterSpacing: '.1em',
    textTransform: 'uppercase', color: '#94a3b8', marginBottom: 14,
  },
  dots: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px 20px', marginBottom: 14 },
  dotItem: { display: 'flex', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block' },
  dotLabel: { fontSize: 13, color: '#64748b' },
  dotVal: { fontSize: 13, fontWeight: 600 },
  track: {
    height: 5, background: '#f1f5f9', borderRadius: 4,
    display: 'flex', overflow: 'hidden', border: '1px solid #e2e8f0',
  },
}