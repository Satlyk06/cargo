import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { PencilIcon, CheckIcon, XMarkIcon, InformationCircleIcon, DocumentTextIcon, XMarkIcon as XIcon } from '@heroicons/react/24/outline'

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
  // Modal stilleri
  overlay:    { position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 },
  modal:      { background: '#fff', borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e2e8f0' },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#0f172a' },
  modalClose: { padding: 6, borderRadius: 8, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'background .2s' },
  modalBody:  { padding: '20px 24px 24px' },
  // About
  aboutLogoWrap: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '24px 0', borderBottom: '1px solid #f1f5f9' },
  aboutLogo: { width: 72, height: 72, borderRadius: 20, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  aboutAppName: { fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' },
  aboutVersion: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  aboutDescription: { fontSize: 14, color: '#475569', lineHeight: 1.6, textAlign: 'center' as const, marginBottom: 16 },
  aboutMissionCard: { display: 'flex', alignItems: 'flex-start', gap: 12, background: '#eef2ff', borderRadius: 12, padding: 14, marginBottom: 16 },
  aboutMissionText: { fontSize: 13, color: '#4338ca', lineHeight: 1.5, fontWeight: 500 },
  aboutSectionTitle: { fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#94a3b8', marginBottom: 12 },
  contactRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  contactIconWrap: { width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactText: { fontSize: 14, color: '#334155', fontWeight: 500 },
  versionFooter: { textAlign: 'center' as const, fontSize: 12, color: '#cbd5e1', marginTop: 20 },
  // Terms
  termsBanner: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '24px 20px', background: '#f0fdf4', borderBottom: '1px solid #dcfce7', borderRadius: '12px 12px 0 0' },
  termsIconWrap: { width: 64, height: 64, borderRadius: 18, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  termsBannerTitle: { fontSize: 20, fontWeight: 800, color: '#14532d', letterSpacing: '-0.3px' },
  termsBannerSub: { fontSize: 12, color: '#4ade80', marginTop: 4 },
  termsSectionCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 12 },
  termsSectionHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  termsSectionIconWrap: { width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  termsSectionTitle: { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  termsSectionBody: { fontSize: 13, color: '#64748b', lineHeight: 1.5 },
  // Menu Butonu
  menuButton: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, marginTop: 8, cursor: 'pointer', transition: 'background .2s' },
  menuButtonLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuButtonText: { fontSize: 14, fontWeight: 600, color: '#1e293b' },
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

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
          {/* Telefon */}
          <div style={s.field}>
            <label style={s.label}>{t('profile.phone')}</label>
            <div style={s.staticVal}>
              <span style={s.staticText}>{user?.phoneNumber}</span>
            </div>
          </div>

          {/* İsim */}
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

      {/* About Button */}
      <div style={{ ...s.menuButton, marginTop: 16 }} onClick={() => setAboutOpen(true)}>
        <div style={s.menuButtonLeft}>
          <div style={{ ...s.menuIconWrap, background: '#eef2ff' }}>
            <InformationCircleIcon style={{ width: 20, height: 20, color: '#6366f1' }} />
          </div>
          <span style={s.menuButtonText}>{t('profile.about')}</span>
        </div>
        <svg style={{ width: 18, height: 18, color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Terms Button */}
      <div style={{ ...s.menuButton, marginTop: 8 }} onClick={() => setTermsOpen(true)}>
        <div style={s.menuButtonLeft}>
          <div style={{ ...s.menuIconWrap, background: '#f0fdf4' }}>
            <DocumentTextIcon style={{ width: 20, height: 20, color: '#16a34a' }} />
          </div>
          <span style={s.menuButtonText}>{t('profile.terms')}</span>
        </div>
        <svg style={{ width: 18, height: 18, color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* About Modal */}
      {aboutOpen && (
        <div style={s.overlay} onClick={() => setAboutOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{t('profile.aboutTitle')}</span>
              <button style={s.modalClose} onClick={() => setAboutOpen(false)}>
                <XIcon style={{ width: 22, height: 22 }} />
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.aboutLogoWrap}>
                <div style={s.aboutLogo}>
                  <svg style={{ width: 36, height: 36, color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>
                <span style={s.aboutAppName}>{t('common.appName')}</span>
                <span style={s.aboutVersion}>v1.0.0</span>
              </div>

              <p style={s.aboutDescription}>{t('profile.aboutDescription')}</p>

              <div style={s.aboutMissionCard}>
                <svg style={{ width: 18, height: 18, color: '#6366f1', flexShrink: 0, marginTop: 2 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span style={s.aboutMissionText}>{t('profile.aboutMission')}</span>
              </div>

              <div>
                <h4 style={s.aboutSectionTitle}>{t('profile.aboutContact')}</h4>
                <div style={s.contactRow}>
                  <div style={s.contactIconWrap}>
                    <svg style={{ width: 18, height: 18, color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span style={s.contactText}>{t('profile.aboutPhone')}</span>
                </div>
                <div style={s.contactRow}>
                  <div style={s.contactIconWrap}>
                    <svg style={{ width: 18, height: 18, color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span style={s.contactText}>{t('profile.aboutEmail')}</span>
                </div>
                <div style={s.contactRow}>
                  <div style={s.contactIconWrap}>
                    <svg style={{ width: 18, height: 18, color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span style={s.contactText}>{t('profile.aboutAddress')}</span>
                </div>
              </div>

              <p style={s.versionFooter}>{t('profile.aboutVersion')} 1.0.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {termsOpen && (
        <div style={s.overlay} onClick={() => setTermsOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{t('profile.termsTitle')}</span>
              <button style={s.modalClose} onClick={() => setTermsOpen(false)}>
                <XIcon style={{ width: 22, height: 22 }} />
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.termsBanner}>
                <div style={s.termsIconWrap}>
                  <svg style={{ width: 32, height: 32, color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span style={s.termsBannerTitle}>{t('profile.termsTitle')}</span>
                <span style={s.termsBannerSub}>{t('profile.termsLastUpdated')}</span>
              </div>

              {[
                { icon: 'person-circle-outline', key: 'termsSection1' },
                { icon: 'lock-closed-outline', key: 'termsSection2' },
                { icon: 'eye-outline', key: 'termsSection3' },
                { icon: 'alert-circle-outline', key: 'termsSection4' },
              ].map((section, i) => (
                <div key={i} style={s.termsSectionCard}>
                  <div style={s.termsSectionHeader}>
                    <div style={s.termsSectionIconWrap}>
                      <svg style={{ width: 18, height: 18, color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                        {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                        {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                        {i === 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
                      </svg>
                    </div>
                    <span style={s.termsSectionTitle}>{t(`profile.${section.key}Title`)}</span>
                  </div>
                  <p style={s.termsSectionBody}>{t(`profile.${section.key}Body`)}</p>
                </div>
              ))}

              <p style={s.versionFooter}>{t('profile.termsLastUpdated')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}