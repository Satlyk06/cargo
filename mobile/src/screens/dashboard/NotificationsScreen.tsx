import React, { useState, useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { Ionicons } from '@expo/vector-icons'
import MainLayout from '../../components/layout/MainLayout'
import ConfirmModal from '../../components/common/ConfirmModal'
import api from '../../services/api'

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { notifications, loading, refreshNotifications } = useNotifications()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmState, setConfirmState] = useState<{ type: 'deleteOne' | 'deleteSelected' | 'deleteAll'; id?: string } | null>(null)
  const lastFetched = useRef<number>(0)

  const fetchNotifications = useCallback(async () => {
    try {
      await refreshNotifications()
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refreshNotifications])

  useFocusEffect(
    useCallback(() => {
      const now = Date.now()
      if (now - lastFetched.current > 30_000) {
        lastFetched.current = now
        void fetchNotifications()
      }
    }, [fetchNotifications]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    lastFetched.current = Date.now()
    fetchNotifications()
  }

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
      const response = await api.put(`/notifications/${id}/read`, { userId: user?.id })
      if (response.status === 200) await refreshNotifications()
    } catch (error) {
      console.error('Bildirim okunurken hata:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await api.put(`/notifications/user/${user?.id}/read-all`)
      if (response.status === 200) await refreshNotifications()
    } catch (error) {
      console.error('Bildirimler okunurken hata:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    setConfirmState({ type: 'deleteOne', id })
  }

  const deleteAll = async () => {
    setConfirmState({ type: 'deleteAll' })
  }

  const copyNotification = async (message: string) => {
    await Clipboard.setStringAsync(translateNotification(message))
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id])
  }

  const deleteSelected = async () => {
    if (!selectedIds.length) return
    setConfirmState({ type: 'deleteSelected' })
  }

  const handleConfirmAction = async () => {
    if (!confirmState) return
    try {
      if (confirmState.type === 'deleteOne' && confirmState.id) {
        const response = await api.delete(`/notifications/${confirmState.id}`, {
          data: { userId: user?.id },
        })
        if (response.status === 200) await refreshNotifications()
      } else if (confirmState.type === 'deleteSelected') {
        const ids = selectedIds
        if (!ids.length) return
        await Promise.all(ids.map(id => api.delete(`/notifications/${id}`, { data: { userId: user?.id } })))
        setSelectedIds([])
        await refreshNotifications()
      } else if (confirmState.type === 'deleteAll') {
        const response = await api.delete(`/notifications/user/${user?.id}/all`)
        if (response.status === 200) await refreshNotifications()
      }
    } catch (error) {
      console.error('Bildirimler silinirken hata:', error)
    } finally {
      setConfirmState(null)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <MainLayout title={t('common.notifications')}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t('notifications.title')}</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
            <Text style={styles.totalText}>({notifications.length} {t('notifications.total')})</Text>
          </View>
          <View style={styles.headerActions}>
            {selectedIds.length > 0 && (
              <TouchableOpacity style={styles.actionButton} onPress={deleteSelected}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>{selectedIds.length}</Text>
              </TouchableOpacity>
            )}
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.actionButton} onPress={markAllAsRead}>
                <Ionicons name="checkmark-done" size={16} color="#6366f1" />
                <Text style={styles.actionButtonText}>{t('notifications.markAllRead')}</Text>
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity style={styles.actionButton} onPress={deleteAll}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>{t('notifications.deleteAll')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={32} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
            }
          >
            {notifications.map(notification => (
              <View
                key={notification.id}
                style={[styles.notificationCard, !notification.isRead && styles.notificationCardUnread]}
              >
                <TouchableOpacity
                  style={[styles.selectBox, selectedIds.includes(notification.id) && styles.selectBoxActive]}
                  onPress={() => toggleSelection(notification.id)}
                >
                  {selectedIds.includes(notification.id) && <Ionicons name="checkmark" size={12} color="#fff" />}
                </TouchableOpacity>
                <View style={styles.notificationDot}>
                  <View style={[styles.dot, !notification.isRead && styles.dotUnread]} />
                </View>

                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationMessage, !notification.isRead && styles.notificationMessageUnread]}>
                    {translateNotification(notification.message)}
                  </Text>
                  <View style={styles.notificationMeta}>
                    <Text style={styles.notificationDate}>
                      {notification.createdAt ? formatDate(notification.createdAt) : ''}
                    </Text>
                    {!notification.isRead && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>{t('notifications.new')}</Text>
                      </View>
                    )}
                    {notification.isRead && (
                      <Text style={styles.readText}>✓ {t('notifications.read')}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.notificationActions}>
                  <TouchableOpacity style={styles.actionIconButton} onPress={() => copyNotification(notification.message)}>
                    <Ionicons name="copy-outline" size={17} color="#6366f1" />
                  </TouchableOpacity>
                  {!notification.isRead && (
                    <TouchableOpacity style={styles.actionIconButton} onPress={() => markAsRead(notification.id)}>
                      <Ionicons name="checkmark" size={18} color="#6366f1" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionIconButton} onPress={() => deleteNotification(notification.id)}>
                    <Ionicons name="trash-outline" size={18} color="#f87171" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <ConfirmModal
        visible={Boolean(confirmState)}
        title={confirmState?.type === 'deleteSelected'
          ? t('notifications.deleteSelectedTitle')
          : confirmState?.type === 'deleteAll'
            ? t('notifications.deleteAllTitle')
            : t('notifications.deleteOneTitle')
        }
        message={confirmState?.type === 'deleteSelected'
          ? t('notifications.deleteSelectedConfirm', { count: selectedIds.length })
          : confirmState?.type === 'deleteAll'
            ? t('notifications.deleteAllConfirm')
            : t('notifications.deleteOneConfirm')
        }
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        destructive
        onCancel={() => setConfirmState(null)}
        onConfirm={handleConfirmAction}
      />
    </MainLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  totalText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  listContent: {
    paddingBottom: 16,
    gap: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  notificationCardUnread: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  notificationDot: {
    paddingTop: 4,
  },
  selectBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  selectBoxActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  dotUnread: {
    backgroundColor: '#6366f1',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  notificationMessageUnread: {
    color: '#0f172a',
    fontWeight: '600',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  newBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  readText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
})