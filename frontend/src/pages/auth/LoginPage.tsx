import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  GlobeAltIcon,
  ChevronDownIcon,
  PhoneIcon,
  LockClosedIcon,
  TruckIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'

const loginSchema = z.object({
  phoneNumber: z.string().min(10, 'Invalid phone number'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface LoginStats {
  totalShipments: number
  completionRate: number
  activeRoutes: number
}

const languages = [
  { code: 'tm', name: 'Türkmençe', flag: '🇹🇲' },
  { code: 'en', name: 'English',   flag: '🇬🇧' },
  { code: 'ru', name: 'Русский',   flag: '🇷🇺' },
]

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [stats, setStats] = useState<LoginStats | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
  }

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${API_URL}/api/shipments/public-stats`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Failed to load login stats')))
      .then((data: LoginStats) => setStats(data))
      .catch(error => {
        if (error.name !== 'AbortError') setStats(null)
      })

    return () => controller.abort()
  }, [])

  const formatNumber = (value: number) => new Intl.NumberFormat(i18n.language, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: data.phoneNumber, password: data.password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Login failed')
      if (!result.access_token || !result.user) throw new Error('Invalid response format')
      login(result.access_token, result.user)
      toast.success(t('login.success'))
      if (result.user.role === 'super_admin' || result.user.role === 'admin') {
        navigate('/admin-panel', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (error: any) {
      toast.error(t('login.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Sol panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] relative overflow-hidden"
        style={{ background: '#fff', borderRight: '1px solid #e2e8f0', padding: '40px 48px' }}
      >
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Accent blob */}
        <div
          className="absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #dbeafe 0%, transparent 70%)', opacity: 0.6 }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-[280px] h-[280px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #e0e7ff 0%, transparent 70%)', opacity: 0.5 }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#2563eb' }}
          >
            <TruckIcon className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
            {t('login.brand')}
          </span>
        </div>

        {/* Orta */}
        <div className="relative z-10 space-y-8">
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 12 }}>
              {t('login.managementSystem')}
            </p>
            <h2 style={{ fontSize: 40, fontWeight: 700, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-1.2px', margin: '0 0 14px' }}>
              {t('login.smart')}<br />
              <span style={{ color: '#2563eb' }}>{t('login.cargo')}</span><br />
              {t('login.tracking')}
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#64748b', margin: 0 }}>
              {t('login.marketingDescription')}
            </p>
          </div>

          {/* Stat kartları — dashboard card stili */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: stats ? formatNumber(stats.totalShipments) : '-', label: t('login.shipments'), accent: '#6366f1', bg: '#eef2ff' },
              { value: '98%', label: t('login.onTime'), accent: '#10b981', bg: '#d1fae5' },
              { value: stats ? formatNumber(stats.activeRoutes) : '-', label: t('login.activeRoutes'), accent: '#64748b', bg: '#f1f5f9' },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 14px 12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: s.accent, margin: 0, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</p>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, background: s.accent, opacity: 0.4 }} />
              </div>
            ))}
          </div>

          {/* Route — dashboard section stili */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>
                {t('login.liveRoute')}
              </p>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div className="flex items-center gap-3">
                {[
                  { city: t('login.china'), active: true },
                  { city: t('login.kazakhstan'), active: true },
                  { city: t('login.turkmenistan'), active: false },
                ].map((stop, i, arr) => (
                  <Fragment key={stop.city}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: stop.active ? '#2563eb' : '#e2e8f0' }}
                      />
                      <p style={{ fontSize: 10, fontWeight: 600, color: stop.active ? '#2563eb' : '#94a3b8', margin: 0 }}>
                        {stop.city}
                      </p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex-1 h-px" style={{ background: '#e2e8f0', marginBottom: 14 }} />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alt */}
        <div className="relative z-10">
          <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>
            {t('login.fullCopyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>

      {/* ── Sağ panel ── */}
      <div className="flex-1 flex flex-col" style={{ background: '#f8fafc' }}>

        {/* Üst bar */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
          <div className="flex lg:hidden items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#2563eb' }}
            >
              <TruckIcon style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{t('login.brand')}</span>
          </div>
          <div className="hidden lg:block" />

          {/* Dil seçici */}
          <Menu as="div" className="relative">
            <Menu.Button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg transition focus:outline-none"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 13, fontWeight: 600 }}
            >
              <GlobeAltIcon className="h-4 w-4" />
              <span className="text-base leading-none">{currentLang.flag}</span>
              <span className="hidden sm:block text-xs font-medium">{currentLang.name}</span>
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 scale-95 translate-y-1"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-1"
            >
              <Menu.Items
                className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl overflow-hidden focus:outline-none z-50"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              >
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>
                    {t('login.selectLanguage')}
                  </p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {languages.map(lang => {
                    const isActive = i18n.language === lang.code
                    return (
                      <Menu.Item key={lang.code}>
                        {({ active }) => (
                          <button
                            onClick={() => changeLanguage(lang.code)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                            style={{
                              background: isActive ? '#eff6ff' : active ? '#f8fafc' : 'transparent',
                              color: isActive ? '#2563eb' : '#475569',
                              border: 'none', cursor: 'pointer',
                            }}
                          >
                            <span className="text-xl w-7 text-center flex-shrink-0 leading-none">{lang.flag}</span>
                            <div className="flex-1">
                              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{lang.name}</p>
                              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', margin: 0 }}>{lang.code}</p>
                            </div>
                            {isActive && <CheckIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#2563eb' }} />}
                          </button>
                        )}
                      </Menu.Item>
                    )
                  })}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </header>

        {/* Form */}
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[380px]">

            {/* Başlık */}
            <div className="mb-6">
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 6 }}>
                {t('login.welcomeBack')}
              </p>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                {t('login.welcome')}
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                {t('login.help')}
              </p>
            </div>

            {/* Form kartı — dashboard section stili */}
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{t('login.help')}</p>
              </div>

              <div style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                  {/* Telefon */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 7 }}>
                      {t('login.phone')}
                    </label>
                    <div className="relative">
                      <PhoneIcon
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: '#cbd5e1' }}
                      />
                      <input
                        {...register('phoneNumber')}
                        type="tel"
                        placeholder="+993 65 123 456"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg transition focus:outline-none"
                        style={{
                          background: errors.phoneNumber ? '#fef2f2' : '#f8fafc',
                          border: errors.phoneNumber ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                          color: '#0f172a',
                        }}
                        onFocus={e => {
                          if (!errors.phoneNumber) {
                            e.target.style.border = '1px solid #2563eb'
                            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)'
                            e.target.style.background = '#fff'
                          }
                        }}
                        onBlur={e => {
                          if (!errors.phoneNumber) {
                            e.target.style.border = '1px solid #e2e8f0'
                            e.target.style.boxShadow = 'none'
                            e.target.style.background = '#f8fafc'
                          }
                        }}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p style={{ marginTop: 5, fontSize: 12, color: '#ef4444' }}>{errors.phoneNumber.message}</p>
                    )}
                  </div>

                  {/* Şifre */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 7 }}>
                      {t('login.password')}
                    </label>
                    <div className="relative">
                      <LockClosedIcon
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: '#cbd5e1' }}
                      />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg transition focus:outline-none"
                        style={{
                          background: errors.password ? '#fef2f2' : '#f8fafc',
                          border: errors.password ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                          color: '#0f172a',
                        }}
                        onFocus={e => {
                          if (!errors.password) {
                            e.target.style.border = '1px solid #2563eb'
                            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)'
                            e.target.style.background = '#fff'
                          }
                        }}
                        onBlur={e => {
                          if (!errors.password) {
                            e.target.style.border = '1px solid #e2e8f0'
                            e.target.style.boxShadow = 'none'
                            e.target.style.background = '#f8fafc'
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 0, display: 'flex' }}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p style={{ marginTop: 5, fontSize: 12, color: '#ef4444' }}>{errors.password.message}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 focus:outline-none"
                    style={{
                      marginTop: 6,
                      padding: '11px',
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: '.02em',
                      borderRadius: 10,
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      background: isLoading ? '#93c5fd' : '#2563eb',
                      color: '#fff',
                      boxShadow: isLoading ? 'none' : '0 1px 3px rgba(37,99,235,0.30)',
                      transition: 'all .15s',
                      opacity: isLoading ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#1d4ed8' }}
                    onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#2563eb' }}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('login.loading')}
                      </>
                    ) : t('login.submit')}
                  </button>
                </form>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#cbd5e1', marginTop: 20 }}>
              {t('login.shortCopyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
