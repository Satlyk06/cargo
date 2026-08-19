import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Linking, Pressable, Animated,
  RefreshControl, Dimensions, Image,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import MainLayout from '../../components/layout/MainLayout'
import ConfirmModal from '../../components/common/ConfirmModal'
import api from '../../services/api'

const APP_VERSION = '1.0.0'
const SCREEN_HEIGHT = Dimensions.get('window').height

function AnimatedModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [rendered, setRendered] = useState(false)

  React.useEffect(() => {
    if (visible) {
      setRendered(true)
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true }),
      ]).start(() => setRendered(false))
    }
  }, [visible])

  if (!rendered) return null

  return (
    <Modal visible={rendered} animationType="none" transparent statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

export default function ProfileScreen() {
  const { t } = useTranslation()
  const { user, token, login, logout } = useAuth()
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [aboutVisible, setAboutVisible] = useState(false)
  const [termsVisible, setTermsVisible] = useState(false)
  const [prohibitedVisible, setProhibitedVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [userData, setUserData] = useState(user)

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const response = await api.get(`/users/${user.id}`)
      if (response.data) {
        setUserData(response.data)
        if (token) login(token, response.data)
      }
    } catch (error) {
      console.error(t('errors.loadingProfile'), error)
    }
  }, [user?.id, token])

  useEffect(() => {
    if (user?.id) fetchUserProfile()
  }, [user?.id])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchUserProfile()
    setRefreshing(false)
  }, [fetchUserProfile])

  const handleLogout = async () => {
    setConfirmVisible(false)
    await logout()
  }

  const initials = (userData?.name || userData?.phoneNumber || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const getRoleConfig = () => ({
    super_admin: { label: t('profile.superAdmin'), color: '#7c3aed', bg: '#f5f3ff', dot: '#7c3aed' },
    admin:       { label: t('profile.admin'),      color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
    user:        { label: t('profile.user'),        color: '#475569', bg: '#f1f5f9', dot: '#94a3b8' },
  })

  const roleConfig = getRoleConfig()
  const role = roleConfig[userData?.role as keyof typeof roleConfig] || roleConfig.user

  const prohibitedItems = [
    { emoji: '🔌', key: 'prohibitedItem1' },
    { emoji: '💉', key: 'prohibitedItem2' },
    { emoji: '🎖️', key: 'prohibitedItem3' },
    { emoji: '🎆', key: 'prohibitedItem4' },
    { emoji: '🔫', key: 'prohibitedItem5' },
    { emoji: '🔥', key: 'prohibitedItem6' },
    { emoji: '🧴', key: 'prohibitedItem7' },
    { emoji: '💊', key: 'prohibitedItem8' },
    { emoji: '🏋️', key: 'prohibitedItem9' },
    { emoji: '📱', key: 'prohibitedItem10' },
    { emoji: '🚁', key: 'prohibitedItem11' },
    { emoji: '🖥️', key: 'prohibitedItem12' },
    { emoji: '🔞', key: 'prohibitedItem13' },
    { emoji: '💨', key: 'prohibitedItem14' },
    { emoji: '🎯', key: 'prohibitedItem15' },
    { emoji: '🍷', key: 'prohibitedItem16' },
    { emoji: '⛽', key: 'prohibitedItem17' },
    { emoji: '🏭', key: 'prohibitedItem18' },
    { emoji: '📦', key: 'prohibitedItem19' },
  ]

  const menuItems = [
    {
      key: 'terms',
      label: t('profile.terms'),
      description: t('profile.termsTitle'),
      icon: 'document-text-outline' as const,
      iconColor: '#16a34a',
      iconBg: '#f0fdf4',
      onPress: () => setTermsVisible(true),
    },
    {
      key: 'prohibited',
      label: t('profile.prohibited'),
      description: t('profile.prohibitedTitle'),
      icon: 'ban-outline' as const,
      iconColor: '#ef4444',
      iconBg: '#fff1f2',
      onPress: () => setProhibitedVisible(true),
    },
    {
      key: 'about',
      label: t('profile.about'),
      description: t('profile.aboutTitle'),
      icon: 'information-circle-outline' as const,
      iconColor: '#6366f1',
      iconBg: '#eef2ff',
      onPress: () => setAboutVisible(true),
    },
  ]

  return (
    <MainLayout title={t('common.profile')}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} tintColor="#6366f1" />
        }
      >
        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <View style={styles.avatarInfo}>
              <Text style={styles.userName}>{userData?.name || t('profile.noName')}</Text>
              <Text style={styles.userPhone}>{userData?.phoneNumber}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: role.bg }]}>
              <View style={[styles.roleDot, { backgroundColor: role.dot }]} />
              <Text style={[styles.roleText, { color: role.color }]}>{role.label}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.fieldsSection}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconWrap}>
                <Ionicons name="call-outline" size={14} color="#6366f1" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('profile.phone')}</Text>
                <Text style={styles.fieldValue}>{userData?.phoneNumber}</Text>
              </View>
            </View>

            <View style={styles.fieldSeparator} />

            <View style={styles.fieldRow}>
              <View style={styles.fieldIconWrap}>
                <Ionicons name="person-outline" size={14} color="#6366f1" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('profile.name')}</Text>
                <Text style={styles.fieldValue}>{userData?.name || t('profile.noName')}</Text>
              </View>
            </View>

            <View style={styles.fieldSeparator} />

            <View style={styles.fieldRow}>
              <View style={styles.fieldIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#6366f1" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('profile.role')}</Text>
                <Text style={[styles.fieldValue, { color: role.color }]}>{role.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FIX: 'MENÜ' text kaldırıldı, sectionLabel yok */}

        {/* ── Menu Card ── */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <React.Fragment key={item.key}>
              <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.6}>
                <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuArrow}>
                  <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                </View>
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => setConfirmVisible(true)} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={17} color="#ef4444" />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.versionTag}>v{APP_VERSION}</Text>
      </ScrollView>

      {/* ── About Modal ── */}
      <AnimatedModal visible={aboutVisible} onClose={() => setAboutVisible(false)}>
        <View style={styles.sheetHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('profile.aboutTitle')}</Text>
          <TouchableOpacity onPress={() => setAboutVisible(false)} style={styles.modalClose}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.aboutLogoWrap}>
            {/* FIX: Ionicons cube yerine assets/icon.png */}
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.aboutLogoImage}
              resizeMode="cover"
            />
            <Text style={styles.aboutAppName}>{t('common.appName')}</Text>
            <Text style={styles.aboutVersion}>v{APP_VERSION}</Text>
          </View>
          <View style={styles.aboutSection}>
            <Text style={styles.aboutDescription}>{t('profile.aboutDescription')}</Text>
          </View>
          <View style={styles.aboutMissionCard}>
            <Ionicons name="flag-outline" size={18} color="#6366f1" />
            <Text style={styles.aboutMissionText}>{t('profile.aboutMission')}</Text>
          </View>
          <View style={styles.aboutSection}>
            <Text style={styles.aboutSectionTitle}>{t('profile.aboutContact')}</Text>
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${t('profile.aboutPhone')}`)}>
              <View style={styles.contactIconWrap}><Ionicons name="call-outline" size={18} color="#6366f1" /></View>
              <Text style={styles.contactText}>{t('profile.aboutPhone')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${t('profile.aboutEmail')}`)}>
              <View style={styles.contactIconWrap}><Ionicons name="mail-outline" size={18} color="#6366f1" /></View>
              <Text style={styles.contactText}>{t('profile.aboutEmail')}</Text>
            </TouchableOpacity>
            <View style={styles.contactRow}>
              <View style={styles.contactIconWrap}><Ionicons name="location-outline" size={18} color="#6366f1" /></View>
              <Text style={styles.contactText}>{t('profile.aboutAddress')}</Text>
            </View>
          </View>
          <Text style={styles.versionFooter}>{t('profile.aboutVersion')} {APP_VERSION}</Text>
        </ScrollView>
      </AnimatedModal>

      {/* ── Terms Modal ── */}
      <AnimatedModal visible={termsVisible} onClose={() => setTermsVisible(false)}>
        <View style={styles.sheetHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('profile.termsTitle')}</Text>
          <TouchableOpacity onPress={() => setTermsVisible(false)} style={styles.modalClose}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.termsBanner}>
            <View style={styles.termsIconWrap}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
            </View>
            <Text style={styles.termsBannerTitle}>{t('profile.termsTitle')}</Text>
            <Text style={styles.termsBannerSub}>{t('profile.termsLastUpdated')}</Text>
          </View>
          {[
            { icon: 'person-circle-outline', key: 'termsSection1' },
            { icon: 'lock-closed-outline',   key: 'termsSection2' },
            { icon: 'eye-outline',            key: 'termsSection3' },
            { icon: 'alert-circle-outline',   key: 'termsSection4' },
          ].map((section, i) => (
            <View key={i} style={styles.termsSectionCard}>
              <View style={styles.termsSectionHeader}>
                <View style={styles.termsSectionIconWrap}>
                  <Ionicons name={section.icon as any} size={18} color="#16a34a" />
                </View>
                <Text style={styles.termsSectionTitle}>{t(`profile.${section.key}Title`)}</Text>
              </View>
              <Text style={styles.termsSectionBody}>{t(`profile.${section.key}Body`)}</Text>
            </View>
          ))}
          <Text style={styles.versionFooter}>{t('profile.termsLastUpdated')}</Text>
        </ScrollView>
      </AnimatedModal>

      {/* ── Prohibited Modal ── */}
      <AnimatedModal visible={prohibitedVisible} onClose={() => setProhibitedVisible(false)}>
        <View style={styles.sheetHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('profile.prohibitedTitle')}</Text>
          <TouchableOpacity onPress={() => setProhibitedVisible(false)} style={styles.modalClose}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.prohibitedWarningBanner}>
            <View style={styles.prohibitedWarningIconWrap}>
              <Ionicons name="warning" size={26} color="#fff" />
            </View>
            <View style={styles.prohibitedWarningTextWrap}>
              <Text style={styles.prohibitedWarningTitle}>{t('common.appName')}</Text>
              <Text style={styles.prohibitedWarningSub}>{t('profile.prohibitedWarning')}</Text>
            </View>
          </View>
          <Text style={styles.prohibitedListTitle}>{t('profile.prohibitedListTitle')}</Text>
          <View style={styles.prohibitedListContainer}>
            {prohibitedItems.map((item, i) => (
              <View key={i} style={[styles.prohibitedItemRow, i === prohibitedItems.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.prohibitedEmojiWrap}>
                  <Text style={styles.prohibitedEmoji}>{item.emoji}</Text>
                </View>
                <Text style={styles.prohibitedItemText}>{t(`profile.${item.key}`)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.sosWarningBox}>
            <View style={styles.sosWarningHeader}>
              <View style={styles.sosBadge}>
                <Text style={styles.sosBadgeText}>SOS</Text>
              </View>
              <Text style={styles.sosWarningTitle}>{t('profile.sosTitle')}</Text>
            </View>
            <Text style={styles.sosWarningBody}>{t('profile.sosBody')}</Text>
            <View style={styles.sosBulletList}>
              <Text style={styles.sosBulletItem}>— {t('profile.sosBullet1')}</Text>
              <Text style={styles.sosBulletItem}>— {t('profile.sosBullet2')}</Text>
              <Text style={styles.sosBulletItem}>— {t('profile.sosBullet3')}</Text>
            </View>
          </View>
          <View style={styles.prohibitedFooterBox}>
            <Text style={styles.prohibitedFooterIcon}>📌</Text>
            <Text style={styles.prohibitedFooterText}>{t('profile.prohibitedFooter')}</Text>
          </View>
        </ScrollView>
      </AnimatedModal>

      <ConfirmModal
        visible={confirmVisible}
        title={t('common.logout')}
        message={t('common.logoutConfirm')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destructive
        onConfirm={handleLogout}
        onCancel={() => setConfirmVisible(false)}
      />
    </MainLayout>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,       // FIX: 12 → 8
    paddingBottom: 40,
  },

  // ── Profile Card ──
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 24,      // FIX: 32 → 24
    paddingBottom: 20,   // FIX: 24 → 20
    paddingHorizontal: 20,
  },
  avatarOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
  },
  avatarInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  userPhone: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '400',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f8fafc',
  },
  fieldsSection: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  fieldIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#cbd5e1',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  fieldSeparator: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginLeft: 42,
  },

  // FIX: sectionLabel tamamen kaldırıldı

  // ── Menu Card ──
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    marginTop: 12,       // FIX: sectionLabel gidince boşluk buraya taşındı
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginLeft: 66,
  },

  // ── Logout ──
  logoutButton: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#fee2e2',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Version ──
  versionTag: {
    textAlign: 'center',
    fontSize: 11,
    color: '#e2e8f0',
    marginTop: 20,
    fontWeight: '500',
  },

  // ── Modal shared ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: SCREEN_HEIGHT * 0.88,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── About Modal ──
  aboutLogoWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  // FIX: aboutLogo (View+icon) kaldırıldı, Image kullanılıyor
  aboutLogoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  aboutAppName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  aboutVersion: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  aboutSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    textAlign: 'center',
  },
  aboutMissionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 14,
  },
  aboutMissionText: {
    flex: 1,
    fontSize: 13,
    color: '#4338ca',
    lineHeight: 20,
    fontWeight: '500',
  },
  aboutSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 24,
    marginBottom: 8,
  },

  // ── Terms Modal ──
  termsBanner: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  termsIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  termsBannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14532d',
    letterSpacing: -0.3,
  },
  termsBannerSub: {
    fontSize: 12,
    color: '#4ade80',
    marginTop: 4,
  },
  termsSectionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  termsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  termsSectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  termsSectionBody: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },

  // ── Prohibited Modal ──
  prohibitedWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 14,
    gap: 12,
  },
  prohibitedWarningIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prohibitedWarningTextWrap: { flex: 1 },
  prohibitedWarningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7f1d1d',
  },
  prohibitedWarningSub: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
    lineHeight: 18,
  },
  prohibitedListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  prohibitedListContainer: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  prohibitedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  prohibitedEmojiWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prohibitedEmoji: { fontSize: 18 },
  prohibitedItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  sosWarningBox: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fefce8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 16,
  },
  sosWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sosBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sosBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosWarningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#713f12',
  },
  sosWarningBody: {
    fontSize: 13,
    color: '#a16207',
    lineHeight: 20,
    marginBottom: 10,
  },
  sosBulletList: { gap: 6 },
  sosBulletItem: {
    fontSize: 13,
    color: '#a16207',
    lineHeight: 20,
    fontWeight: '500',
  },
  prohibitedFooterBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  prohibitedFooterIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  prohibitedFooterText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
})