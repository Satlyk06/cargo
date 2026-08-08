import { useState, useEffect, useRef } from 'react'
import { BellIcon, TrashIcon, CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Notification {
  id: string
  message: string
  isRead: boolean
  createdAt: string
  shipmentId: string | null
}

export default function NotificationDropdown() {
  const { t, i18n } = useTranslation()
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ✅ Bildirim mesajını çevir
  const translateNotification = (message: string): string => {
    const normalizedMessage = message.toLowerCase()
    const codeMatch = message.match(/(CAR-\d{4}-\d{4})/)
    const code = codeMatch ? codeMatch[1] : ''

    const isNewShipment = [
      'yeni kargo gönderildi',
      'new shipment sent',
      'отправлен новый груз',
      'täze kargo iberildi',
      'taze kargo iberildi',
    ].some(keyword => normalizedMessage.includes(keyword))

    const isDelivered = [
      'kargonuz teslim edildi',
      'your shipment delivered',
      'ваш груз доставлен',
      'kargoňyz eltildi',
      'kargonyz eltildi',
    ].some(keyword => normalizedMessage.includes(keyword))

    const isShipped = [
      'kargonuz yola çıktı',
      'your shipment shipped',
      'ваш груз отправлен',
      'kargoňyz ýola çykdy',
      'kargonyz yola cikdi',
    ].some(keyword => normalizedMessage.includes(keyword))

    const isLoaded = [
      'kargonuz yüklendi',
      'your shipment loaded',
      'ваш груз загружен',
      'kargoňyz ýüklendi',
      'kargonyz yuklendi',
    ].some(keyword => normalizedMessage.includes(keyword))

    if (isNewShipment) return t('notifications.newShipment', { code })
    if (isDelivered) return t('notifications.deliveredShipment', { code })
    if (isShipped) return t('notifications.shippedShipment', { code })
    if (isLoaded) return t('notifications.loadedShipment', { code })

    return message
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const [countRes, listRes] = await Promise.all([
        fetch(`${API_URL}/api/notifications/user/${user?.id}/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/notifications/user/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (countRes.ok) {
        const data = await countRes.json()
        setUnreadCount(data.count)
      }
      if (listRes.ok) {
        const data = await listRes.json()
        setNotifications(data.slice(0, 5))
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user?.id }),
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        toast.success(t('notifications.markAsRead') || 'Okundu işaretlendi')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user?.id }),
      })
      if (res.ok) {
        const deleted = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1))
        toast.success(t('common.deleted') || 'Silindi')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/user/${user?.id}/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast.success(t('notifications.markAllRead') || 'Tümü okundu')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const goToNotifications = () => {
    setIsOpen(false)
    navigate('/dashboard/notifications')
  }

  // Tarih formatı
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const lang = i18n.language || 'tm'
    const locale = lang === 'tm' ? 'tk-TM' : lang === 'ru' ? 'ru-RU' : 'en-US'
    return date.toLocaleDateString(locale, {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`
          relative w-9 h-9 flex items-center justify-center rounded-lg
          border transition-all duration-150
          ${isOpen
            ? 'border-indigo-200 bg-indigo-50 text-indigo-500'
            : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }
        `}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1
            min-w-[18px] h-[18px] px-1
            bg-red-500 text-white
            text-[10px] font-bold rounded-full
            flex items-center justify-center
            border-2 border-white
          ">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            fixed top-[4.5rem] left-1/2 -translate-x-1/2
            w-[min(calc(100vw-2rem),20rem)]
            sm:absolute sm:top-auto sm:left-auto sm:translate-x-0 sm:right-0 sm:mt-2 sm:w-80
            bg-white rounded-2xl
            border border-slate-200
            shadow-[0_12px_35px_rgba(15,23,42,0.12)]
            z-50 overflow-hidden
          "
          style={{ animation: 'dropIn .15s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <p className="text-[13px] sm:text-sm font-semibold text-slate-800">
                {t('notifications.title')}
              </p>
              {unreadCount > 0 && (
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                  {unreadCount} {unreadCount === 1 ? t('notifications.unread', { defaultValue: 'Unread' }) : t('notifications.unreadPlural', { defaultValue: t('notifications.unread', { defaultValue: 'Unread' }) })}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="
                  flex items-center gap-1 px-2 py-1 rounded-lg
                  text-[10px] sm:text-[11px] font-semibold text-indigo-500
                  hover:bg-indigo-50 transition
                "
                title={t('notifications.markAllRead')}
              >
                <CheckIcon className="h-3.5 w-3.5" />
                {t('notifications.markAllRead') || 'Hepsini oku'}
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-3 p-2">
                    <div className="w-2 h-2 rounded-full bg-slate-100 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-100 rounded-md w-4/5" />
                      <div className="h-2.5 bg-slate-100 rounded-md w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                  <BellIcon className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">{t('notifications.noNotifications')}</p>
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`
                      flex items-start gap-3 px-3 py-2.5 rounded-xl
                      transition-colors duration-100
                      ${!n.isRead ? 'bg-indigo-50' : 'hover:bg-slate-50'}
                    `}
                  >
                    {/* Unread dot */}
                    <div className="flex-shrink-0 mt-1.5">
                      <span className={`
                        block w-2 h-2 rounded-full
                        ${!n.isRead ? 'bg-indigo-500' : 'bg-slate-200'}
                      `} />
                    </div>

                    {/* Content - Çevrilmiş mesaj */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${
                        !n.isRead ? 'font-semibold text-slate-800' : 'text-slate-500'
                      }`}>
                        {translateNotification(n.message)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-0.5 flex-shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-400 hover:bg-indigo-100 transition"
                          title={t('common.edit')}
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 p-2">
            <button
              onClick={goToNotifications}
              className="
                w-full flex items-center justify-center gap-1.5
                py-2 rounded-xl
                text-xs font-semibold text-indigo-500
                hover:bg-indigo-50 transition
              "
            >
              {t('notifications.viewAll') || 'Tüm bildirimleri gör'}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
