import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

export interface NotificationItem {
  id: string
  message: string
  isRead: boolean
  createdAt?: string
  shipmentId?: string | null
  [key: string]: any
}

interface NotificationContextType {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const SCHOOL_KEYWORDS = ['okul', 'school', 'edu', 'education', 'eğitim', 'mektep']

export function shouldDisplayNotification(notification?: Partial<NotificationItem> | null): boolean {
  if (!notification) return false
  const haystack = `${notification.message || ''} ${notification.title || ''} ${notification.body || ''}`.toLowerCase()
  return !SCHOOL_KEYWORDS.some(keyword => haystack.includes(keyword))
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/notifications/user/${user.id}`)
      const items = Array.isArray(response.data) ? response.data : []
      const visibleNotifications = items.filter(shouldDisplayNotification)
      setNotifications(visibleNotifications)
      setUnreadCount(visibleNotifications.filter(notification => !notification.isRead).length)
    } catch (error) {
      console.error('Bildirimler yenilenirken hata:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
  }), [notifications, unreadCount, loading, refreshNotifications])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}
