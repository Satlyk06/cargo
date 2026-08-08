import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon, TruckIcon, UsersIcon, UserCircleIcon,
  Bars3Icon, XMarkIcon, ArrowLeftIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function AdminLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const menuItems = [
    { icon: HomeIcon,       label: t('admin.dashboard'),      path: '/admin-panel' },
    { icon: TruckIcon,      label: t('admin.cargoManagement'), path: '/admin-panel/cargo' },
    { icon: UsersIcon,      label: t('admin.users'),   path: '/admin-panel/users' },
    { icon: UserCircleIcon, label: t('admin.profile'),         path: '/admin-panel/profile' },
  ]

  const isActive = (path: string) =>
    path === '/admin-panel'
      ? location.pathname === path
      : location.pathname.startsWith(path)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBackToDashboard = () => {
    setIsSidebarOpen(false)
    navigate('/dashboard')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
        <Link
          to="/admin-panel"
          className="flex items-center gap-2.5"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <TruckIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800 tracking-tight">{t('admin.title')}</span>
        </Link>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">{t('common.menu')}</p>
        {menuItems.map(item => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all relative group ${
                active
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition ${
                active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
              }`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className={`text-sm ${active ? 'font-600' : 'font-medium'}`}>{item.label}</span>
              {active && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Back to user dashboard and logout */}
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition"
        >
          <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
            <ArrowLeftIcon className="h-4 w-4 text-slate-400" />
          </div>
          <span className="text-sm font-medium">{t('admin.backToDashboard')}</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full mt-1 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition"
        >
          <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
            <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-400" />
          </div>
          <span className="text-sm font-medium">{t('admin.logout')}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-200 shadow-xl
        transform transition-transform duration-250 ease-in-out lg:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 leading-none">
                  {t('common.controlPanel')}
                </p>
                <p className="text-sm font-semibold text-slate-800 leading-snug mt-0.5">
                  {t('admin.panel')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <div className="h-6 w-px bg-slate-200 mx-1" />
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-700 leading-none">{t('common.admin')}</span>
                <span className="text-[11px] text-slate-400 mt-0.5">{t('profile.roles.super_admin')}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-500">
                A
              </div>
              <button
                onClick={handleLogout}
                title={t('admin.logout')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 pb-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
