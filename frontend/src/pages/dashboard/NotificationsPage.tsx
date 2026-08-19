import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  TruckIcon,
  CheckCircleIcon,
  CubeIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
import { copyToClipboard } from '../../utils/clipboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Notification {
  id: string
  message: string
  isRead: boolean
  createdAt: string
  shipmentId: string | null
}

type PendingDelete =
  | { type: 'single'; id: string }
  | { type: 'selected' }
  | { type: 'all' }

export default function NotificationsPage() {
  const { t, i18n } = useTranslation()
  const { token, user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/notifications/user/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setNotifications(await res.json())
    } catch { 
      toast.error(t('common.error')) 
    } finally { 
      setLoading(false) 
    }
  }, [user, token, t])

  useEffect(() => { 
    if (user) fetchNotifications() 
  }, [user, fetchNotifications])

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

  // ✅ Bildirimin tipine göre dinamik ikon seçimi
  const getNotificationIcon = (message: string) => {
    const norm = message.toLowerCase()
    if (norm.includes('teslim') || norm.includes('delivered') || norm.includes('доставлен') || norm.includes('eltildi')) {
      return { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' }
    }
    if (norm.includes('yola') || norm.includes('shipped') || norm.includes('отправлен') || norm.includes('çykdy')) {
      return { icon: TruckIcon, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' }
    }
    if (norm.includes('yüklendi') || norm.includes('loaded') || norm.includes('загружен') || norm.includes('ýüklendi')) {
      return { icon: CubeIcon, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' }
    }
    return { icon: BellIcon, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' }
  }

  const copyTrackingCode = async (trackingCode: string) => {
    try {
      await copyToClipboard(trackingCode)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const renderNotificationMessage = (message: string) => {
    const translatedMessage = translateNotification(message)
    const codeMatch = translatedMessage.match(/(CAR-\d{4}-\d{4})/)

    if (!codeMatch) return translatedMessage

    const trackingCode = codeMatch[1]
    const [beforeCode, ...afterCode] = translatedMessage.split(trackingCode)

    return (
      <>
        {beforeCode}
        <button
          type="button"
          onClick={() => copyTrackingCode(trackingCode)}
          className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md bg-indigo-50 border border-indigo-100 font-mono text-xs font-bold text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
          title={t('common.copied')}
        >
          {trackingCode}
        </button>
        {afterCode.join(trackingCode)}
      </>
    )
  }

  // ✅ Tarih formatı
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const lang = i18n.language || 'tm'
    const locale = lang === 'tm' ? 'tk-TM' : lang === 'ru' ? 'ru-RU' : 'en-US'
    return date.toLocaleDateString(locale, {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
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
        toast.success(t('notifications.markAsRead') || 'Okundu')
      }
    } catch { toast.error(t('common.error')) }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/user/${user?.id}/read-all`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        toast.success(t('notifications.markAllRead'))
      }
    } catch { toast.error(t('common.error')) }
  }

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user?.id }),
      })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        setSelectedIds(prev => prev.filter(s => s !== id))
        toast.success(t('common.deleted'))
      }
    } catch { toast.error(t('common.error')) }
  }

  const deleteSelected = async () => {
    if (!selectedIds.length) return
    let ok = 0
    for (const id of selectedIds) {
      try {
        const res = await fetch(`${API_URL}/api/notifications/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId: user?.id }),
        })
        if (res.ok) ok++
      } catch {}
    }
    if (ok) {
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)))
      setSelectedIds([])
      toast.success(`${ok} ${t('common.deleted')}`)
    }
  }

  const deleteAll = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/user/${user?.id}/all`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setNotifications([]); setSelectedIds([]); toast.success(t('common.deleted')) }
    } catch { toast.error(t('common.error')) }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      if (pendingDelete.type === 'single') await deleteNotification(pendingDelete.id)
      if (pendingDelete.type === 'selected') await deleteSelected()
      if (pendingDelete.type === 'all') await deleteAll()
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === notifications.length ? [] : notifications.map(n => n.id))

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t('notifications.title')}
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm shadow-rose-500/20">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-400 mt-1">
              {notifications.length} {t('notifications.total')}
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
              >
                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                <span>{t('notifications.markAllRead')}</span>
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                onClick={() => setPendingDelete({ type: 'selected' })}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
              >
                <TrashIcon className="h-4 w-4" />
                <span>{t('notifications.deleteSelected')} ({selectedIds.length})</span>
              </button>
            )}

            {notifications.length > 0 && selectedIds.length === 0 && (
              <button
                onClick={() => setPendingDelete({ type: 'all' })}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <TrashIcon className="h-4 w-4 text-slate-400" />
                <span>{t('notifications.deleteAll')}</span>
              </button>
            )}

            <button
              onClick={fetchNotifications}
              className="p-2 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
              title={t('common.refresh')}
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          /* Skeleton Loader */
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xl shadow-indigo-500/5 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
              <BellIcon className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {t('notifications.noNotifications')}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {t('notifications.emptyStateSub', { defaultValue: 'Yeni bir bildirim geldiğinde burada görünecektir.' })}
            </p>
          </div>
        ) : (
          /* Notifications List Container */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-indigo-500/5 overflow-hidden">
            
            {/* Select All Bar */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.length === notifications.length && notifications.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 transition cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-500">
                {selectedIds.length > 0 ? `${selectedIds.length} ${t('notifications.selected')}` : t('notifications.selectAll')}
              </span>
            </div>

            {/* Notification Rows */}
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => {
                const iconConfig = getNotificationIcon(notification.message)
                const IconComponent = iconConfig.icon
                const isSelected = selectedIds.includes(notification.id)

                return (
                  <div
                    key={notification.id}
                    className={`group relative p-4 sm:p-5 transition-all flex items-start gap-3.5 sm:gap-4 ${
                      !notification.isRead 
                        ? 'bg-indigo-50/40 hover:bg-indigo-50/70' 
                        : 'hover:bg-slate-50/80'
                    } ${isSelected ? 'bg-slate-50' : ''}`}
                  >
                    {/* Unread Indicator Bar */}
                    {!notification.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r" />
                    )}

                    {/* Checkbox */}
                    <div className="pt-1.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(notification.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 transition cursor-pointer"
                      />
                    </div>

                    {/* Category Icon */}
                    <div className={`w-10 h-10 rounded-2xl border ${iconConfig.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <IconComponent className={`w-5 h-5 ${iconConfig.color}`} />
                    </div>

                    {/* Message Details */}
                    <div className="flex-1 min-w-0 pr-2">
                      <p className={`text-sm leading-relaxed ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                        {renderNotificationMessage(notification.message)}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {formatDate(notification.createdAt)}
                        </span>

                        {!notification.isRead ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            {t('notifications.unread') || 'Yeni'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <CheckIcon className="w-3 h-3 text-emerald-500" />
                            {t('notifications.read') || 'Okundu'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 rounded-xl text-indigo-600 hover:bg-indigo-100/60 transition-colors"
                          title={t('notifications.markAsRead') || 'Okundu İşaretle'}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setPendingDelete({ type: 'single', id: notification.id })}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Confirm Delete Modal ── */}
        {pendingDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-5 animate-slide-up">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {pendingDelete.type === 'single' && t('notifications.deleteOneTitle', { defaultValue: t('common.deleteTitle') })}
                    {pendingDelete.type === 'selected' && t('notifications.deleteSelectedTitle', { defaultValue: t('common.deleteTitle') })}
                    {pendingDelete.type === 'all' && t('notifications.deleteAllTitle', { defaultValue: t('common.deleteTitle') })}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {pendingDelete.type === 'single' && t('notifications.deleteOneConfirm')}
                    {pendingDelete.type === 'selected' && t('notifications.deleteSelectedConfirm', { count: selectedIds.length })}
                    {pendingDelete.type === 'all' && t('notifications.deleteAllConfirm')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {deleting ? t('common.loading') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}