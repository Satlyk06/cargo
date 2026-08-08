import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HomeIcon, TruckIcon, UserIcon,
  Cog6ToothIcon, ArrowRightOnRectangleIcon, BellIcon
} from '@heroicons/react/24/outline'
import LanguageSwitcher from '../components/common/LanguageSwitcher'
import NotificationDropdown from '../components/dashboard/NotificationDropdown'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin, logout } = useAuth()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = (user?.name || user?.phoneNumber || 'U')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  const roleLabel =
  user?.role === 'super_admin' ? t('profile.roles.super_admin') :
  user?.role === 'admin'       ? t('profile.roles.admin') :
                                 t('profile.roles.user')

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === path
      : location.pathname.startsWith(path)

  const cargoLabel = t('common.cargoManagementShort', { defaultValue: 'Ýükler' })

  const navItems = [
  { icon: HomeIcon,  label: t('common.home'),          path: '/dashboard' },
  { icon: TruckIcon, label: cargoLabel, path: '/dashboard/shipments' },
  { icon: BellIcon,  label: t('common.notifications'),  path: '/dashboard/notifications' },
  { icon: UserIcon,  label: t('profile.title'),         path: '/dashboard/profile' },
  ...(isAdmin
    ? [{ icon: Cog6ToothIcon, label: t('common.admin'), path: '/admin-panel' }]
    : []
  ),
]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Top navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-0 min-h-16 flex flex-wrap items-center justify-between gap-3">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <TruckIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-tight hidden sm:block">
              Cargo
            </span>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
            <LanguageSwitcher />
            <NotificationDropdown />

            <div className="h-6 w-px bg-slate-200 mx-1" />

            {/* User info — sadece sm+ */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700 leading-none">
                  {user?.name || user?.phoneNumber}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{roleLabel}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-500 flex-shrink-0">
                {initials}
              </div>
            </div>

            {/* Mobile avatar */}
            <div className="sm:hidden w-8 h-8 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-500">
              {initials}
            </div>

            {isAdmin && (
              <Link
                to="/admin-panel"
                title="Admin Paneli"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 transition"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </Link>
            )}

            <button
              onClick={handleLogout}
              title="Çıkış"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-50 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-1 sm:px-2">
          {navItems.map(item => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-all ${
                  active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <item.icon className="h-6 w-6" />
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                  )}
                </div>
                <span className={`text-[10px] sm:text-[11px] leading-tight text-center ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}