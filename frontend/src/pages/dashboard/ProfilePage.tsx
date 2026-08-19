import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import {
  DocumentTextIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  UserIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  ArrowLeftOnRectangleIcon,
  FlagIcon,
  EnvelopeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

// React Portal Kullanılarak Modal en dış DOM (body) katmanına taşındı
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle for Mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, token, login, logout } = useAuth()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [prohibitedOpen, setProhibitedOpen] = useState(false)
  const [userData, setUserData] = useState(user)

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        if (token) login(token, data)
      }
    } catch (error) {
      console.error(t('errors.loadingProfile'), error)
    }
  }, [user?.id, token, login, t])

  useEffect(() => {
    if (user?.id) fetchUserProfile()
  }, [user?.id, fetchUserProfile])

  const initials = (userData?.name || userData?.phoneNumber || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const getRoleConfig = () => ({
    super_admin: { label: t('profile.superAdmin'), color: 'text-purple-600', bg: 'bg-purple-50 ring-purple-200', dot: 'bg-purple-600' },
    admin: { label: t('profile.admin'), color: 'text-blue-600', bg: 'bg-blue-50 ring-blue-200', dot: 'bg-blue-600' },
    user: { label: t('profile.user'), color: 'text-slate-600', bg: 'bg-slate-100 ring-slate-200', dot: 'bg-slate-400' },
  })

  const roleConfig = getRoleConfig()
  const role = roleConfig[(userData?.role as keyof typeof roleConfig)] || roleConfig.user

  const prohibitedItems = [
    { emoji: '🔌', key: 'prohibitedItem1' },
    { emoji: '💉', key: 'prohibitedItem2' },
    { emoji: '🎖️', key: 'prohibitedItem3' },
    { emoji: '🎆', key: 'prohibitedItem4' },
    { emoji: '🔫', key: 'prohibitedItem5' },
    { emoji: '🔥', key: 'prohibitedItem6' },
    { emoji: '🧴', key: 'prohibitedItem7' },
    { emoji: '💊', key: 'prohibitedItem8' },
    { emoji: '🏋️', key: 'prohibitedItem9' },
    { emoji: '📱', key: 'prohibitedItem10' },
    { emoji: '🚁', key: 'prohibitedItem11' },
    { emoji: '🖥️', key: 'prohibitedItem12' },
    { emoji: '🔞', key: 'prohibitedItem13' },
    { emoji: '💨', key: 'prohibitedItem14' },
    { emoji: '🎯', key: 'prohibitedItem15' },
    { emoji: '🍷', key: 'prohibitedItem16' },
    { emoji: '⛽', key: 'prohibitedItem17' },
    { emoji: '🏭', key: 'prohibitedItem18' },
    { emoji: '📦', key: 'prohibitedItem19' },
  ]

  const menuItems = [
    {
      key: 'terms',
      label: t('profile.terms'),
      icon: DocumentTextIcon,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      onPress: () => setTermsOpen(true),
    },
    {
      key: 'prohibited',
      label: t('profile.prohibited'),
      icon: ShieldExclamationIcon,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      onPress: () => setProhibitedOpen(true),
    },
    {
      key: 'about',
      label: t('profile.about'),
      icon: InformationCircleIcon,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      onPress: () => setAboutOpen(true),
    },
  ]

  const handleLogout = async () => {
    await logout()
    toast.success(t('common.logoutSuccess'))
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md mx-auto space-y-5">
        
        {/* Header */}
        <div>
          <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
            {t('common.user')}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('common.profile')}
          </h1>
        </div>

        {/* ── Profile Card ── */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-indigo-500/5 space-y-6">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center text-center">
            <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-100 shadow-lg shadow-indigo-500/20 mb-3">
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold tracking-tight">
                {initials}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900">
              {userData?.name || t('profile.noName')}
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-0.5">
              {userData?.phoneNumber}
            </p>

            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ring-1 ${role.bg}`}>
              <span className={`w-2 h-2 rounded-full ${role.dot}`} />
              <span className={`text-xs font-bold ${role.color}`}>{role.label}</span>
            </div>
          </div>

          {/* Details List */}
          <div className="divide-y divide-slate-100 rounded-2xl bg-slate-50/50 border border-slate-100/80 p-2">
            <div className="flex items-center gap-3.5 p-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100/60 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <PhoneIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('profile.phone')}
                </p>
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {userData?.phoneNumber || '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100/60 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('profile.name')}
                </p>
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {userData?.name || t('profile.noName')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100/60 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('profile.role')}
                </p>
                <p className={`text-sm font-semibold ${role.color}`}>
                  {role.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Menu Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <button
                key={item.key}
                onClick={item.onPress}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50/80 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                  <IconComponent className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <span className="flex-1 text-sm font-semibold text-slate-800">
                  {item.label}
                </span>
                <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
            )
          })}
        </div>

        {/* ── Logout Button ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white hover:bg-rose-50/50 border border-rose-100 rounded-2xl text-rose-600 font-semibold text-sm shadow-sm transition-all active:scale-[0.99]"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          <span>{t('common.logout')}</span>
        </button>

        <p className="text-center text-xs font-medium text-slate-300 pt-2">v1.0.0</p>

        {/* ── About Modal ── */}
        <Modal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} title={t('profile.aboutTitle')}>
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight">{t('common.appName')}</h4>
            <span className="text-xs font-semibold text-slate-400 mt-1">v1.0.0</span>
          </div>

          <p className="text-sm text-slate-600 text-center leading-relaxed">
            {t('profile.aboutDescription')}
          </p>

          <div className="flex items-start gap-3 p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100/50">
            <FlagIcon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-indigo-900 leading-relaxed">
              {t('profile.aboutMission')}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h5 className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              {t('profile.aboutContact')}
            </h5>

            <a href={`tel:${t('profile.aboutPhone')}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <PhoneIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-700">{t('profile.aboutPhone')}</span>
            </a>

            <a href={`mailto:${t('profile.aboutEmail')}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <EnvelopeIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-700">{t('profile.aboutEmail')}</span>
            </a>

            <div className="flex items-center gap-3 p-3 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <MapPinIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-700">{t('profile.aboutAddress')}</span>
            </div>
          </div>
        </Modal>

        {/* ── Terms Modal ── */}
        <Modal isOpen={termsOpen} onClose={() => setTermsOpen(false)} title={t('profile.termsTitle')}>
          <div className="flex flex-col items-center text-center p-6 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 mb-3">
              <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-emerald-950">{t('profile.termsTitle')}</h4>
            <span className="text-xs font-medium text-emerald-600 mt-1">{t('profile.termsLastUpdated')}</span>
          </div>

          <div className="space-y-3">
            {[
              { icon: UserIcon, key: 'termsSection1' },
              { icon: ShieldCheckIcon, key: 'termsSection2' },
              { icon: InformationCircleIcon, key: 'termsSection3' },
              { icon: ExclamationTriangleIcon, key: 'termsSection4' },
            ].map((section, i) => {
              const IconComp = section.icon
              return (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">{t(`profile.${section.key}Title`)}</h5>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{t(`profile.${section.key}Body`)}</p>
                </div>
              )
            })}
          </div>
        </Modal>

        {/* ── Prohibited Modal ── */}
        <Modal isOpen={prohibitedOpen} onClose={() => setProhibitedOpen(false)} title={t('profile.prohibitedTitle')}>
          <div className="flex items-center gap-3.5 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">{t('common.appName')}</h4>
              <p className="text-xs text-rose-600 mt-0.5">{t('profile.prohibitedWarning')}</p>
            </div>
          </div>

          <h5 className="text-sm font-bold text-slate-900 pt-2">{t('profile.prohibitedListTitle')}</h5>

          <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white">
            {prohibitedItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-base flex-shrink-0">
                  {item.emoji}
                </div>
                <span className="text-xs font-medium text-slate-700">{t(`profile.${item.key}`)}</span>
              </div>
            ))}
          </div>

          {/* SOS Warning */}
          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-rose-600 text-white text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md">
                SOS
              </span>
              <h5 className="text-sm font-bold text-amber-900">{t('profile.sosTitle')}</h5>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">{t('profile.sosBody')}</p>
            <div className="space-y-1 pt-1">
              <p className="text-xs font-semibold text-amber-900">• {t('profile.sosBullet1')}</p>
              <p className="text-xs font-semibold text-amber-900">• {t('profile.sosBullet2')}</p>
              <p className="text-xs font-semibold text-amber-900">• {t('profile.sosBullet3')}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-slate-100/70 rounded-xl text-xs text-slate-600">
            <span className="text-sm">📌</span>
            <p className="leading-relaxed">{t('profile.prohibitedFooter')}</p>
          </div>
        </Modal>

      </div>
    </div>
  )
}