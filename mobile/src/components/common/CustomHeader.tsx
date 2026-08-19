import React, { useEffect, useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ActivityIndicator, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import ConfirmModal from './ConfirmModal'
import LanguageSwitcher from './LanguageSwitcher'

interface CustomHeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  onNotifications?: () => void
  onProfile?: () => void
}

export default function CustomHeader({ showBack = false, onBack, onNotifications, onProfile }: CustomHeaderProps) {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, loading: notificationsLoading, refreshNotifications } = useNotifications()
  const { t } = useTranslation()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  // FIX: header'ın ekrandaki gerçek alt kenarını tutuyoruz
  const [headerBottom, setHeaderBottom] = useState(72)

  const initials = (user?.name || user?.phoneNumber || 'U')
    .split(' ').map((word: string) => word[0]).slice(0, 2).join('').toUpperCase()

  const translateNotification = (message: string): string => {
    const code = message.match(/(?:Takip kody|Tracking code|Код отслеживания):\s*(CAR-\d{4}-\d+)/i)?.[1] || ''
    if (/täze kargo iberildi|new shipment sent|отправлен новый груз/i.test(message))
      return t('notifications.newShipment', { code })
    if (/kargoňyz eltildi|your shipment delivered|ваш груз доставлен/i.test(message))
      return t('notifications.deliveredShipment', { code })
    if (/kargoňyz ýola çykdy|your shipment shipped|ваш груз отправлен/i.test(message))
      return t('notifications.shippedShipment', { code })
    if (/kargoňyz ýüklendi|your shipment loaded|ваш груз загружен/i.test(message))
      return t('notifications.loadedShipment', { code })
    return message
  }

  useEffect(() => {
    if (notificationsOpen) refreshNotifications()
  }, [notificationsOpen, refreshNotifications])

  const openNotifications = async () => {
    setNotificationsOpen(true)
    await refreshNotifications()
  }

  return (
    <View
      style={styles.header}
      // FIX: header render edilince ekrandaki gerçek alt koordinatını ölç
      onLayout={(e) => {
        const { y, height } = e.nativeEvent.layout
        setHeaderBottom(y + height)
      }}
    >
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="arrow-back" size={20} color="#475569" />
        </TouchableOpacity>
      ) : (
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.brandIcon}
          resizeMode="cover"
        />
      )}

      <View style={styles.actions}>
        <View style={styles.languageButton}><LanguageSwitcher /></View>
        <TouchableOpacity style={styles.iconButton} onPress={openNotifications} accessibilityLabel="Bildirimler">
          <Ionicons name="notifications-outline" size={19} color="#94a3b8" />
          {unreadCount > 0 && (
            <View style={styles.badgeBubble}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatar} onPress={onProfile} accessibilityLabel="Profil">
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutConfirm(true)} accessibilityLabel="Çıkış yap">
          <Ionicons name="log-out-outline" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={showLogoutConfirm}
        title={t('common.logout')}
        message={t('common.logoutConfirm')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destructive
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false)
          logout()
        }}
      />

      <Modal
        visible={notificationsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsOpen(false)}
      >
        <Pressable style={styles.dropdownOverlay} onPress={() => setNotificationsOpen(false)}>
          <Pressable
            // FIX: sabit top:72 yerine ölçülen headerBottom + 8px boşluk
            style={[styles.notificationDropdown, { top: headerBottom + 8 }]}
            onPress={() => undefined}
          >
            <View style={styles.dropdownTitleRow}>
              <Text style={styles.dropdownTitle}>{t('notifications.title')}</Text>
              <Ionicons name="notifications-outline" size={17} color="#6366f1" />
            </View>
            {notificationsLoading
              ? <ActivityIndicator color="#6366f1" style={styles.loader} />
              : notifications.slice(0, 4).length
                ? notifications.slice(0, 4).map(item => (
                  <View key={item.id} style={styles.notificationItem}>
                    <View style={[styles.unreadDot, item.isRead && styles.readDot]} />
                    <Text
                      style={[styles.notificationText, !item.isRead && styles.notificationTextUnread]}
                      numberOfLines={2}
                    >
                      {translateNotification(item.message)}
                    </Text>
                  </View>
                ))
                : <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
            }
            <TouchableOpacity
              style={styles.allNotificationsButton}
              onPress={() => { setNotificationsOpen(false); onNotifications?.() }}
            >
              <Text style={styles.allNotificationsText}>{t('notifications.viewAll')}</Text>
              <Ionicons name="arrow-forward" size={15} color="#6366f1" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f5',
  },
  brandIcon: {
    width: 58,
    height: 48,
    borderRadius: 21,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  languageButton: {
    height: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
    position: 'relative',
  },
  badgeBubble: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  avatarText: { color: '#6366f1', fontSize: 13, fontWeight: '700' },
  logoutButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  dropdownOverlay: { flex: 1, backgroundColor: 'transparent' },
  notificationDropdown: {
    position: 'absolute',
    // FIX: top buraya yazılmıyor, inline style olarak headerBottom + 8 geliyor
    right: 16,
    width: 340,
    maxWidth: '92%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
  },
  dropdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownTitle: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
  loader: { paddingVertical: 22 },
  notificationItem: {
    flexDirection: 'row',
    gap: 9,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366f1', marginTop: 5 },
  readDot: { backgroundColor: '#cbd5e1' },
  notificationText: { flex: 1, color: '#475569', fontSize: 13, lineHeight: 18 },
  notificationTextUnread: { color: '#0f172a', fontWeight: '700' },
  emptyText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', paddingVertical: 20 },
  allNotificationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
  },
  allNotificationsText: { color: '#6366f1', fontWeight: '600', fontSize: 13 },
})