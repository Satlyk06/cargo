import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Linking, Pressable, Animated,
  RefreshControl,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import MainLayout from '../../components/layout/MainLayout'
import ConfirmModal from '../../components/common/ConfirmModal'
import api from '../../services/api'

const APP_VERSION = '1.0.0'

function AnimatedModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const slideAnim = useRef(new Animated.Value(600)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [rendered, setRendered] = useState(false)

  React.useEffect(() => {
    if (visible) {
      setRendered(true)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 600,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false))
    }
  }, [visible])

  if (!rendered) return null

  return (
    <Modal
      visible={rendered}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {children}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

export default function ProfileScreen() {
  const { t } = useTranslation()
  const { user, token, login } = useAuth()
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [aboutVisible, setAboutVisible] = useState(false)
  const [termsVisible, setTermsVisible] = useState(false)
  
  // ✅ Yeni state'ler
  const [refreshing, setRefreshing] = useState(false)
  const [userData, setUserData] = useState(user)

  // ✅ Profil verilerini backend'den çek
  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const response = await api.get(`/users/${user.id}`)
      if (response.data) {
        setUserData(response.data)
        // ✅ AuthContext'i de güncelle (token ile birlikte)
        if (token) {
          login(token, response.data)
        }
      }
    } catch (error) {
      console.error('Profil yüklenirken hata:', error)
    }
  }, [user?.id, token])

  // ✅ İlk yüklemede ve user değiştiğinde verileri çek
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile()
    }
  }, [user?.id])

  // ✅ Pull-to-refresh handler
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
    super_admin: { label: t('profile.superAdmin'), color: '#6d28d9', bg: '#ede9fe' },
    admin: { label: t('profile.admin'), color: '#1e40af', bg: '#dbeafe' },
    user: { label: t('profile.user'), color: '#374151', bg: '#f3f4f6' },
  })

  const roleConfig = getRoleConfig()
  const role = roleConfig[userData?.role as keyof typeof roleConfig] || roleConfig.user

  return (
    <MainLayout title={t('common.profile')}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <Text style={styles.avatarName}>{userData?.name || t('profile.noName')}</Text>
            <Text style={styles.avatarSub}>{userData?.phoneNumber}</Text>
            <View style={[styles.roleBadge, { backgroundColor: role.bg }]}>
              <Text style={[styles.roleBadgeText, { color: role.color }]}>{role.label}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.phone')}</Text>
              <View style={styles.staticVal}>
                <Ionicons name="call-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                <Text style={styles.staticText}>{userData?.phoneNumber}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.name')}</Text>
              <View style={styles.staticVal}>
                <Ionicons name="person-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                <Text style={styles.staticText}>{userData?.name || t('profile.noName')}</Text>
              </View>
            </View>

            <View style={[styles.field, { marginBottom: 0 }]}>
              <Text style={styles.label}>{t('profile.role')}</Text>
              <View style={styles.staticVal}>
                <Ionicons name="shield-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                <View style={[styles.roleBadge, { backgroundColor: role.bg, marginTop: 0 }]}>
                  <Text style={[styles.roleBadgeText, { color: role.color }]}>{role.label}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* About Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setAboutVisible(true)}
        >
          <View style={styles.menuButtonLeft}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
            </View>
            <Text style={styles.menuButtonText}>{t('profile.about')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Terms Button */}
        <TouchableOpacity
          style={[styles.menuButton, { marginTop: 8 }]}
          onPress={() => setTermsVisible(true)}
        >
          <View style={styles.menuButtonLeft}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="document-text-outline" size={20} color="#16a34a" />
            </View>
            <Text style={styles.menuButtonText}>{t('profile.terms')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setConfirmVisible(true)}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
        </TouchableOpacity>

        {/* About Modal */}
        <AnimatedModal visible={aboutVisible} onClose={() => setAboutVisible(false)}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('profile.aboutTitle')}</Text>
            <TouchableOpacity onPress={() => setAboutVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.aboutLogoWrap}>
              <View style={styles.aboutLogo}>
                <Ionicons name="cube" size={36} color="#fff" />
              </View>
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

              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${t('profile.aboutPhone')}`)}
              >
                <View style={styles.contactIconWrap}>
                  <Ionicons name="call-outline" size={18} color="#6366f1" />
                </View>
                <Text style={styles.contactText}>{t('profile.aboutPhone')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${t('profile.aboutEmail')}`)}
              >
                <View style={styles.contactIconWrap}>
                  <Ionicons name="mail-outline" size={18} color="#6366f1" />
                </View>
                <Text style={styles.contactText}>{t('profile.aboutEmail')}</Text>
              </TouchableOpacity>

              <View style={styles.contactRow}>
                <View style={styles.contactIconWrap}>
                  <Ionicons name="location-outline" size={18} color="#6366f1" />
                </View>
                <Text style={styles.contactText}>{t('profile.aboutAddress')}</Text>
              </View>
            </View>

            <Text style={styles.versionFooter}>{t('profile.aboutVersion')} {APP_VERSION}</Text>
          </ScrollView>
        </AnimatedModal>

        {/* Terms Modal */}
        <AnimatedModal visible={termsVisible} onClose={() => setTermsVisible(false)}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('profile.termsTitle')}</Text>
            <TouchableOpacity onPress={() => setTermsVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={styles.termsBanner}>
              <View style={styles.termsIconWrap}>
                <Ionicons name="shield-checkmark" size={32} color="#fff" />
              </View>
              <Text style={styles.termsBannerTitle}>{t('profile.termsTitle')}</Text>
              <Text style={styles.termsBannerSub}>{t('profile.termsLastUpdated')}</Text>
            </View>

            {[
              { icon: 'person-circle-outline', key: 'termsSection1' },
              { icon: 'lock-closed-outline', key: 'termsSection2' },
              { icon: 'eye-outline', key: 'termsSection3' },
              { icon: 'alert-circle-outline', key: 'termsSection4' },
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
      </ScrollView>
    </MainLayout>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
 avatarWrap: {
    backgroundColor: '#eef2ff',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#6366f1',
    marginBottom: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  avatarSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  field: {
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 5,
  },
  staticVal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  staticText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  menuButton: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: 32,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
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
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // About Modal
  aboutLogoWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  aboutLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    color: '#cbd5e1',
    marginTop: 24,
    marginBottom: 8,
  },
  // Terms Modal
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
    borderColor: '#e2e8f0',
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
})

function logout() {
  throw new Error('Function not implemented.')
}
