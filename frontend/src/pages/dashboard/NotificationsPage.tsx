import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { BellIcon, CheckIcon, TrashIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
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

  useEffect(() => { if (user) fetchNotifications() }, [user])

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
          className="font-semibold text-primary-600 underline decoration-primary-300 underline-offset-2 transition hover:text-primary-800"
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

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/user/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setNotifications(await res.json())
    } catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
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
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-800">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} {unreadCount === 1 ? t('notifications.unread', { defaultValue: 'Unread' }) : t('notifications.unreadPlural', { defaultValue: t('notifications.unread', { defaultValue: 'Unread' }) })}
            </span>
          )}
          <span className="text-sm text-slate-400">({notifications.length} {t('notifications.total')})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
            >
              <CheckIcon className="h-4 w-4" />
              {t('notifications.markAllRead')}
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              onClick={() => setPendingDelete({ type: 'selected' })}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
            >
              <TrashIcon className="h-4 w-4" />
              {t('notifications.deleteSelected')} ({selectedIds.length})
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => setPendingDelete({ type: 'all' })}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              <TrashIcon className="h-4 w-4" />
              {t('notifications.deleteAll')}
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{t('common.loading')}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BellIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t('notifications.noNotifications')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.length === notifications.length && notifications.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-500">
              {selectedIds.length > 0 ? `${selectedIds.length} ${t('notifications.selected')}` : t('notifications.selectAll')}
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-50 transition flex items-start gap-3 ${
                  !notification.isRead ? 'bg-indigo-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notification.id)}
                  onChange={() => toggleSelect(notification.id)}
                  className="mt-1 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                />
                
                <div className="flex-1 min-w-0">
                  <p className={`${!notification.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                    {renderNotificationMessage(notification.message)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">
                      {formatDate(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {t('notifications.unread') || 'Yeni'}
                      </span>
                    )}
                    {notification.isRead && (
                      <span className="text-xs text-slate-400">✓ {t('notifications.read') || 'Okundu'}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition"
                      title={t('common.edit')}
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setPendingDelete({ type: 'single', id: notification.id })}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title={t('common.delete')}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-delete-title"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 id="notification-delete-title" className="text-lg font-semibold text-slate-900">
                  {pendingDelete.type === 'single' && t('notifications.deleteOneTitle', { defaultValue: t('common.deleteTitle') })}
                  {pendingDelete.type === 'selected' && t('notifications.deleteSelectedTitle', { defaultValue: t('common.deleteTitle') })}
                  {pendingDelete.type === 'all' && t('notifications.deleteAllTitle', { defaultValue: t('common.deleteTitle') })}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {pendingDelete.type === 'single' && t('notifications.deleteOneConfirm')}
                  {pendingDelete.type === 'selected' && t('notifications.deleteSelectedConfirm', { count: selectedIds.length })}
                  {pendingDelete.type === 'all' && t('notifications.deleteAllConfirm')}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
