import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const s: Record<string, React.CSSProperties> = {
  page:       { padding: '28px 24px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: 560, margin: '0 auto' },
  eyebrow:    { fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 3 },
  title:      { fontSize: 22, fontWeight: 600, color: '#0f172a', margin: '0 0 24px' },
  card:       { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  avatarWrap: { background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', padding: '32px 0', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', borderBottom: '1px solid #e2e8f0' },
  avatar:     { width: 72, height: 72, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-1px' },
  avatarName: { fontSize: 16, fontWeight: 600, color: '#0f172a' },
  avatarSub:  { fontSize: 12, color: '#64748b', marginTop: 2 },
  body:       { padding: '20px 24px' },
  field:      { marginBottom: 20 },
  label:      { fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6, display: 'block' },
  staticVal:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' },
  staticText: { fontSize: 14, fontWeight: 500, color: '#475569' },
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const initials = (user?.name || user?.phoneNumber || 'U')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  const getRoleConfig = () => ({
    super_admin: { label: t('profile.roles.super_admin'), color: '#6d28d9', bg: '#ede9fe' },
    admin:       { label: t('profile.roles.admin'),       color: '#1e40af', bg: '#dbeafe' },
    user:        { label: t('profile.roles.user'),        color: '#374151', bg: '#f3f4f6' },
  })

  const roleConfig = getRoleConfig()
  const role = roleConfig[user?.role as keyof typeof roleConfig] || roleConfig.user

  return (
    <div style={s.page}>
      <p style={s.eyebrow}>{t('common.user')}</p>
      <h1 style={s.title}>{t('profile.title')}</h1>

      <div style={s.card}>
        {/* Avatar */}
        <div style={s.avatarWrap}>
          <div style={s.avatar}>{initials}</div>
          <p style={s.avatarName}>{user?.name || t('profile.noName')}</p>
          <p style={s.avatarSub}>{user?.phoneNumber}</p>
          <span style={{
            marginTop: 8, fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
            background: role.bg, color: role.color,
          }}>
            {role.label}
          </span>
        </div>

        <div style={s.body}>
          {/* Telefon - hint kaldırıldı */}
          <div style={s.field}>
            <label style={s.label}>{t('profile.phone')}</label>
            <div style={s.staticVal}>
              <span style={s.staticText}>{user?.phoneNumber}</span>
            </div>
          </div>

          {/* İsim - Düzenleme kaldırıldı, sadece gösterim */}
          <div style={s.field}>
            <label style={s.label}>{t('profile.name')}</label>
            <div style={s.staticVal}>
              <span style={s.staticText}>{user?.name || t('profile.noName')}</span>
            </div>
          </div>

          {/* Rol */}
          <div style={s.field}>
            <label style={s.label}>{t('profile.role')}</label>
            <div style={s.staticVal}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: role.bg, color: role.color }}>
                {role.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 