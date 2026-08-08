import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Linking, Pressable
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import MainLayout from '../../components/layout/MainLayout'
import ConfirmModal from '../../components/common/ConfirmModal'

const APP_VERSION = '1.0.0'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [aboutVisible, setAboutVisible] = useState(false)

  const handleLogout = async () => {
    setConfirmVisible(false)
    await logout()
  }

  const initials = (user?.name || user?.phoneNumber || 'U')
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
  const role = roleConfig[user?.role as keyof typeof roleConfig] || roleConfig.user

  return (
    <MainLayout title={t('common.profile')}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.card}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <Text style={styles.avatarName}>{user?.name || t('profile.noName')}</Text>
            <Text style={styles.avatarSub}>{user?.phoneNumber}</Text>
            <View style={[styles.roleBadge, { backgroundColor: role.bg }]}>
              <Text style={[styles.roleBadgeText, { color: role.color }]}>{role.label}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.body}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.phone')}</Text>
              <View style={styles.staticVal}>
                <Ionicons name="call-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                <Text style={styles.staticText}>{user?.phoneNumber}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.name')}</Text>
              <View style={styles.staticVal}>
                <Ionicons name="person-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                <Text style={styles.staticText}>{user?.name || t('profile.noName')}</Text>
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
          style={styles.aboutButton}
          onPress={() => setAboutVisible(true)}
        >
          <View style={styles.aboutButtonLeft}>
            <View style={styles.aboutIconWrap}>
              <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
            </View>
            <Text style={styles.aboutButtonText}>{t('profile.about')}</Text>
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
        <Modal
          visible={aboutVisible}
          animationType="slide"
          transparent
          statusBarTranslucent
          onRequestClose={() => setAboutVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setAboutVisible(false)}>
            <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
              <View style={styles.sheetHandle} />
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('profile.aboutTitle')}</Text>
                <TouchableOpacity onPress={() => setAboutVisible(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Logo area */}
                <View style={styles.aboutLogoWrap}>
                  <View style={styles.aboutLogo}>
                    <Ionicons name="cube" size={36} color="#fff" />
                  </View>
                  <Text style={styles.aboutAppName}>{t('common.appName')}</Text>
                  <Text style={styles.aboutVersion}>v{APP_VERSION}</Text>
                </View>

                {/* Description */}
                <View style={styles.aboutSection}>
                  <Text style={styles.aboutDescription}>{t('profile.aboutDescription')}</Text>
                </View>

                {/* Mission */}
                <View style={styles.aboutMissionCard}>
                  <Ionicons name="flag-outline" size={18} color="#6366f1" />
                  <Text style={styles.aboutMissionText}>{t('profile.aboutMission')}</Text>
                </View>

                {/* Contact */}
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

                {/* Version */}
                <Text style={styles.versionFooter}>{t('profile.aboutVersion')} {APP_VERSION}</Text>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

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
    paddingVertical: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#6366f1',
    marginBottom: 12,
  },
  avatar: {
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
  avatarName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  avatarSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  roleBadge: {
    marginTop: 8,
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
    padding: 20,
    gap: 16,
  },
  field: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 6,
  },
  staticVal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  staticText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  aboutButton: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  aboutButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutButton: {
    marginTop: 12,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 15,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    paddingTop: 48,
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
    paddingTop: 20,
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
})
