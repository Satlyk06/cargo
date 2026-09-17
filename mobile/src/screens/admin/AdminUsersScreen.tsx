import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

type User = { id: string; name?: string; phoneNumber: string; role: 'user' | 'admin' | 'super_admin'; isBanned: boolean; banReason?: string }
type Shipment = { id: string; trackingCode: string; senderId: string; receiverId: string; senderName: string; receiverName: string; status: string; price: number }
const statusColors: Record<string, string> = { loaded: '#b45309', shipped: '#4f46e5', delivered: '#059669' }
type PendingAction = { type: 'ban' | 'unban' | 'delete'; user: User }

export default function AdminUsersScreen() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userShipments, setUserShipments] = useState<Shipment[]>([])
  const [shipmentsLoading, setShipmentsLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [banReason, setBanReason] = useState('')
  const [processingAction, setProcessingAction] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [savingUser, setSavingUser] = useState(false)

  const load = useCallback(async () => {
    try { setUsers((await api.get<User[]>('/users')).data) }
    catch (error) { console.error('Unable to load users:', error); Alert.alert(t('common.error'), t('adminUsers.loadError')) }
    finally { setLoading(false) }
  }, [t])
  useEffect(() => { void load() }, [load])

  const protectedUser = (item: User) => item.role === 'super_admin'
  const canManage = (item: User) => !protectedUser(item) && (currentUser?.role === 'super_admin' || item.role === 'user')
  const roleLabel = (role: User['role']) => t(`profile.${role === 'super_admin' ? 'superAdmin' : role}`)
  const statusLabel = (status: string) => t(`common.${status}`)

  const setRole = async (item: User) => {
    if (currentUser?.role !== 'super_admin' || protectedUser(item)) { Alert.alert(t('common.error'), t('common.superAdminProtected')); return }
    const role = item.role === 'user' ? 'admin' : 'user'
    try { await api.put(`/users/${item.id}/role`, { role }); await load(); Alert.alert(t('adminUsers.title'), t('common.roleUpdated')) }
    catch { Alert.alert(t('common.error'), t('adminUsers.roleUpdateError')) }
  }

  const requestAction = (type: PendingAction['type'], item: User) => {
    if (!canManage(item)) { Alert.alert(t('common.error'), t('common.superAdminProtected')); return }
    setBanReason('')
    setPendingAction({ type, user: item })
  }

  const confirmAction = async () => {
    if (!pendingAction) return
    if (pendingAction.type === 'ban' && !banReason.trim()) {
      Alert.alert(t('common.error'), t('common.banReasonRequired'))
      return
    }
    setProcessingAction(true)
    try {
      if (pendingAction.type === 'delete') await api.delete(`/users/${pendingAction.user.id}`)
      else await api.put(`/users/${pendingAction.user.id}/${pendingAction.type}`, pendingAction.type === 'ban' ? { reason: banReason.trim() } : {})
      await load()
      Alert.alert(t('adminUsers.title'), t(pendingAction.type === 'ban' ? 'common.banSuccess' : pendingAction.type === 'unban' ? 'common.unbanSuccess' : 'common.deleted'))
      setPendingAction(null)
    } catch { Alert.alert(t('common.error'), t('adminUsers.actionError')) }
    finally { setProcessingAction(false) }
  }

  const openEdit = (item: User) => {
    if (!canManage(item)) { Alert.alert(t('common.error'), t('common.superAdminProtected')); return }
    setEditName(item.name || '')
    setEditPhone(item.phoneNumber)
    setEditingUser(item)
  }

  const saveUser = async () => {
    if (!editingUser || !editName.trim()) { Alert.alert(t('common.error'), t('common.nameRequired')); return }
    setSavingUser(true)
    try {
      await api.put(`/users/${editingUser.id}`, { name: editName.trim(), phoneNumber: editPhone.trim() })
      await load()
      setEditingUser(null)
      Alert.alert(t('adminUsers.title'), t('common.updateSuccess'))
    } catch { Alert.alert(t('common.error'), t('adminUsers.updateError')) }
    finally { setSavingUser(false) }
  }

  const openUserShipments = async (item: User) => {
    setSelectedUser(item); setUserShipments([]); setShipmentsLoading(true)
    try { setUserShipments((await api.get<Shipment[]>(`/shipments/user/${item.id}`)).data) } catch { Alert.alert(t('common.error'), t('adminUsers.shipmentsLoadError')) } finally { setShipmentsLoading(false) }
  }

  const filtered = users.filter(item => `${item.name || ''} ${item.phoneNumber}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <MainLayout title={t('adminUsers.title')}>
        <View style={styles.page}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder={t('adminUsers.search')}
            placeholderTextColor="#94a3b8"
          />
          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator color="#6366f1" style={{ marginTop: 20 }} />
            ) : (
              filtered.map(item => (
                <View style={styles.card} key={item.id}>
                  {/* ÜST SATIR: avatar + isim/telefon + rol badge + aksiyonlar */}
                  <View style={styles.top}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(item.name || item.phoneNumber).slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name} numberOfLines={1}>{item.name || t('adminUsers.unnamedUser')}</Text>
                      <View style={styles.phoneRow}>
                        <Text style={styles.phone}>{item.phoneNumber}</Text>
                        {item.isBanned && (
                          <View style={styles.banned}>
                            <Text style={styles.bannedText}>{t('common.banned')}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* SAĞ: rol badge + aksiyonlar (admin/ban/delete) yan yana */}
                    <View style={styles.rightBlock}>
                      <View style={[styles.role, item.role === 'super_admin' && styles.superRole]}>
                        <Text style={[styles.roleText, item.role === 'super_admin' && styles.superText]}>
                          {roleLabel(item.role)}
                        </Text>
                      </View>
                      {canManage(item) && (
                        <View style={styles.actions}>
                          <TouchableOpacity style={styles.action} onPress={() => openEdit(item)}>
                            <Ionicons name="pencil-outline" size={16} color="#0f766e" />
                          </TouchableOpacity>
                          {currentUser?.role === 'super_admin' && (
                            <TouchableOpacity style={styles.action} onPress={() => void setRole(item)}>
                              <Ionicons name="shield-outline" size={16} color="#6366f1" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity style={styles.action} onPress={() => requestAction(item.isBanned ? 'unban' : 'ban', item)}>
                            <Ionicons name={item.isBanned ? 'person-add-outline' : 'person-remove-outline'} size={16} color="#f59e0b" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.action} onPress={() => requestAction('delete', item)}>
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* ALT SATIR: Kargoları gör butonu */}
                  <TouchableOpacity style={styles.shipmentsButton} onPress={() => openUserShipments(item)} activeOpacity={0.7}>
                    <Ionicons name="cube-outline" size={15} color="#6366f1" />
                    <Text style={styles.shipmentsButtonText}>{t('adminUsers.viewShipments')}</Text>
                    <Ionicons name="chevron-forward" size={15} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              ))
            )}
            {!loading && !filtered.length && <Text style={styles.empty}>{t('adminUsers.noUsers')}</Text>}
          </ScrollView>
        </View>
      </MainLayout>

      <Modal visible={!!selectedUser} animationType="slide" onRequestClose={() => setSelectedUser(null)}>
        <View style={styles.shipmentModal}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedUser?.name || selectedUser?.phoneNumber}</Text>
              <Text style={styles.modalSubtitle}>{t('adminUsers.relatedShipments')}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <Ionicons name="close" size={25} color="#475569" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.shipmentList} showsVerticalScrollIndicator={false}>
            {shipmentsLoading ? (
              <ActivityIndicator color="#6366f1" style={{ marginTop: 20 }} />
            ) : (
              userShipments.map(shipment => (
                <View key={shipment.id} style={styles.shipment}>
                  <Text style={styles.shipmentCode}>{shipment.trackingCode}</Text>
                  <Text style={styles.shipmentPeople}>{shipment.senderName} → {shipment.receiverName}</Text>
                  <View style={styles.shipmentBottom}>
                    <Text style={[styles.shipmentStatus, { color: statusColors[shipment.status] || '#6366f1' }]}>
                      {statusLabel(shipment.status) || shipment.status}
                    </Text>
                    <Text style={styles.shipmentPrice}>${shipment.price}</Text>
                  </View>
                </View>
              ))
            )}
            {!shipmentsLoading && !userShipments.length && <Text style={styles.empty}>{t('adminUsers.noShipments')}</Text>}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!editingUser} transparent animationType="fade" onRequestClose={() => setEditingUser(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('common.editUser')}</Text>
            <TextInput value={editName} onChangeText={setEditName} placeholder={t('profile.name')} style={styles.dialogInput} />
            <TextInput value={editPhone} onChangeText={setEditPhone} placeholder={t('profile.phone')} keyboardType="phone-pad" style={styles.dialogInput} />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setEditingUser(null)} disabled={savingUser}><Text>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dialogPrimary} onPress={saveUser} disabled={savingUser}>{savingUser ? <ActivityIndicator color="#fff" /> : <Text style={styles.dialogPrimaryText}>{t('common.save')}</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!pendingAction} transparent animationType="fade" onRequestClose={() => setPendingAction(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{pendingAction && t(pendingAction.type === 'delete' ? 'common.deleteUserTitle' : pendingAction.type === 'ban' ? 'common.banTitle' : 'common.unbanTitle')}</Text>
            <Text style={styles.dialogMessage}>{pendingAction && t(pendingAction.type === 'delete' ? 'common.deleteUserConfirm' : pendingAction.type === 'ban' ? 'common.banConfirm' : 'common.unbanConfirm')}</Text>
            {pendingAction?.type === 'ban' && <TextInput value={banReason} onChangeText={setBanReason} placeholder={t('common.banReason')} style={styles.dialogInput} autoFocus />}
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setPendingAction(null)} disabled={processingAction}><Text>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.dialogPrimary, pendingAction?.type !== 'unban' && styles.dialogDanger]} onPress={confirmAction} disabled={processingAction}>{processingAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.dialogPrimaryText}>{pendingAction?.type === 'delete' ? t('common.delete') : pendingAction?.type === 'ban' ? t('common.ban') : t('common.unban')}</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  search: { height: 44, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, color: '#0f172a', marginBottom: 12 },
  list: { gap: 10, paddingBottom: 16 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12 },

  // ÜST SATIR
  top: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff' },
  avatarText: { color: '#6366f1', fontWeight: '700', fontSize: 14 },
  info: { flex: 1, marginLeft: 10 },
  name: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  phone: { color: '#64748b', fontSize: 11 },

  banned: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#fef2f2' },
  bannedText: { color: '#dc2626', fontSize: 9, fontWeight: '700' },

  // SAĞ BLOK: rol + aksiyonlar
  rightBlock: { alignItems: 'flex-end', gap: 6 },
  role: { backgroundColor: '#eff6ff', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  superRole: { backgroundColor: '#f5f3ff' },
  roleText: { color: '#2563eb', fontSize: 10, fontWeight: '700' },
  superText: { color: '#7c3aed' },
  actions: { flexDirection: 'row', gap: 5 },
  action: { width: 30, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 7 },

  // ALT SATIR: Kargoları gör
  shipmentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  shipmentsButtonText: { color: '#4f46e5', fontWeight: '700', fontSize: 12 },

  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 30 },

  // Kargo modal
  shipmentModal: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#0f172a', fontSize: 20, fontWeight: '700' },
  modalSubtitle: { color: '#64748b', fontSize: 13, marginTop: 3 },
  shipmentList: { gap: 10, paddingBottom: 16 },
  shipment: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14 },
  shipmentCode: { color: '#0f172a', fontWeight: '700' },
  shipmentPeople: { color: '#64748b', fontSize: 13, marginTop: 4 },
  shipmentBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 9 },
  shipmentStatus: { fontSize: 12, fontWeight: '700' },
  shipmentPrice: { color: '#0f172a', fontSize: 12, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 18, padding: 20 },
  dialogTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  dialogMessage: { color: '#64748b', fontSize: 13, lineHeight: 19, marginBottom: 16 },
  dialogInput: { height: 46, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, color: '#0f172a', marginTop: 10 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  dialogCancel: { minWidth: 90, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10 },
  dialogPrimary: { minWidth: 90, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', borderRadius: 10 },
  dialogDanger: { backgroundColor: '#dc2626' },
  dialogPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
})
