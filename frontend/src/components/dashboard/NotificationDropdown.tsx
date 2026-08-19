import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BellIcon,
  TrashIcon,
  CheckIcon,
  ArrowRightIcon,
  InboxIcon,
  TruckIcon,
  CheckCircleIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
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

  // Bildirim mesajını dil değişimine tam duyarlı olarak çevir
  const translateNotification = useCallback((message: string): { text: string; type: 'new' | 'delivered' | 'shipped' | 'loaded' | 'general' } => {
    if (!message) return { text: '', type: 'general' }

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

    if (isNewShipment) return { text: t('notifications.newShipment', { code, defaultValue: message }), type: 'new' }
    if (isDelivered) return { text: t('notifications.deliveredShipment', { code, defaultValue: message }), type: 'delivered' }
    if (isShipped) return { text: t('notifications.shippedShipment', { code, defaultValue: message }), type: 'shipped' }
    if (isLoaded) return { text: t('notifications.loadedShipment', { code, defaultValue: message }), type: 'loaded' }

    return { text: message, type: 'general' }
  }, [t, i18n.language]) // i18n.language eklendi: dil değiştiğinde re-render tetiklenir

  // Bildirim ikonunu tipe göre seç
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delivered':
        return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
      case 'shipped':
        return <TruckIcon className="w-4 h-4 text-blue-500" />
      case 'loaded':
      case 'new':
        return <CubeIcon className="w-4 h-4 text-indigo-500" />
      default:
        return <BellIcon className="w-4 h-4 text-slate-400" />
    }
  }

  // Bildirimleri API'den çek
  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !token) return

    try {
      setLoading(true)
      const [countRes, listRes] = await Promise.all([
        fetch(`${API_URL}/api/notifications/user/${user.id}/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/notifications/user/${user.id}`, {
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
  }, [user?.id, token])

  // Polling
  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user, fetchNotifications])

  // Dışarı tıklama kontrolü
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Optimistic Okundu İşaretleme
  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user?.id }),
      })

      if (res.ok) {
        toast.success(t('notifications.markAsRead', 'Okundu işaretlendi'))
      } else {
        toast.error(t('common.error', 'İşlem başarısız'))
        fetchNotifications()
      }
    } catch (error) {
      console.error(error)
      fetchNotifications()
    }
  }

  // Optimistic Silme
  const deleteNotification = async (id: string) => {
    const deletedItem = notifications.find(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (deletedItem && !deletedItem.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user?.id }),
      })

      if (res.ok) {
        toast.success(t('common.deleted', 'Silindi'))
      } else {
        toast.error(t('common.error', 'Silme işlemi başarısız'))
        fetchNotifications()
      }
    } catch (error) {
      console.error(error)
      fetchNotifications()
    }
  }

  // Optimistic Hepsini Okundu İşaretleme
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      const res = await fetch(`${API_URL}/api/notifications/user/${user?.id}/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success(t('notifications.markAllRead', 'Tümü okundu'))
      } else {
        toast.error(t('common.error', 'İşlem başarısız'))
        fetchNotifications()
      }
    } catch (error) {
      console.error(error)
      fetchNotifications()
    }
  }

  const goToNotifications = () => {
    setIsOpen(false)
    navigate('/dashboard/notifications')
  }

  // Tarih Formatı
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const lang = i18n.language || 'tr'
    const locale = lang === 'tm' ? 'tk-TM' : lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'tr-TR'
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-label={t('notifications.title', '')}
        aria-expanded={isOpen}
        className={`
          relative p-2 rounded-xl border transition-all duration-200 outline-none
          ${isOpen
            ? 'border-indigo-300 bg-indigo-50/80 text-indigo-600 shadow-sm ring-2 ring-indigo-500/10'
            : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }
        `}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-6 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 min-w-[16px] px-1 bg-red-500 text-white text-[10px] font-bold items-center justify-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          tabIndex={-1}
          className="
            fixed top-16 left-1/2 -translate-x-1/2
            w-[calc(100vw-2rem)] max-w-sm
            sm:absolute sm:top-auto sm:left-auto sm:translate-x-0 sm:right-0 sm:mt-2 sm:w-80
            bg-white rounded-2xl border border-slate-200/80
            shadow-xl shadow-slate-900/10 z-50 overflow-hidden
            animate-in fade-in zoom-in-95 duration-150 origin-top-right
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                {t('notifications.title', 'Bildirimler')}
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {unreadCount} {t('notifications.unread', 'Okunmamış')}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="
                  inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600
                  hover:text-indigo-700 transition-colors p-1 rounded-md hover:bg-indigo-50/80
                "
                title={t('notifications.markAllRead', 'Tümünü Okundu İşaretle')}
              >
                <CheckIcon className="h-3.5 w-3.5" />
                <span>{t('notifications.markAllRead', 'Tümünü Oku')}</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-3 bg-slate-100 rounded w-5/6" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 text-slate-300">
                  <InboxIcon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-slate-400">
                  {t('notifications.noNotifications', 'Henüz bildiriminiz yok')}
                </p>
              </div>
            ) : (
              <div className="p-1.5 space-y-1">
                {notifications.map(n => {
                  const translated = translateNotification(n.message)
                  return (
                    <div
                      key={n.id}
                      className={`
                        group relative flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150
                        ${!n.isRead 
                          ? 'bg-indigo-50/50 hover:bg-indigo-50/80 border border-indigo-100/50' 
                          : 'hover:bg-slate-50 border border-transparent'
                        }
                      `}
                    >
                      {/* Left Icon Container */}
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                        ${!n.isRead ? 'bg-white shadow-sm' : 'bg-slate-100/80'}
                      `}>
                        {getNotificationIcon(translated.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-12">
                        <p className={`text-xs leading-relaxed ${
                          !n.isRead ? 'font-semibold text-slate-900' : 'text-slate-600'
                        }`}>
                          {translated.text}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>

                      {/* Actions (Hover da görünür veya okunmamışsa sabit durur) */}
                      <div className="absolute right-2 top-2.5 flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-xs rounded-lg p-0.5 shadow-xs border border-slate-200/50">
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title={t('notifications.markAsRead', 'Okundu işaretle')}
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(n.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title={t('common.delete', 'Sil')}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-50/50 border-t border-slate-100">
            <button
              type="button"
              onClick={goToNotifications}
              className="
                w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl
                text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-white
                border border-transparent hover:border-slate-200/60 shadow-none hover:shadow-xs
                transition-all duration-150
              "
            >
              <span>{t('notifications.viewAll', '')}</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}