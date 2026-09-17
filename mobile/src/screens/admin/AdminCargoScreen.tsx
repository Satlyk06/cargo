import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../services/api'

type Status = 'loaded' | 'shipped' | 'delivered'
type Shipment = { id: string; trackingCode: string; senderName: string; receiverName: string; receiverPhone: string; weight: number; price: number; status: Status; route: string[]; routeStatus: boolean[]; qrCode?: string | null }
type Form = { senderName: string; receiverName: string; receiverPhone: string; weight: string; price: string; route: string[]; status: Status }
const emptyForm: Form = { senderName: '*', receiverName: '', receiverPhone: '+993', weight: '', price: '', route: ['', ''], status: 'loaded' }
export default function AdminCargoScreen() {
  const { t } = useTranslation()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [form, setForm] = useState<Form>(emptyForm)
  const [editing, setEditing] = useState<Shipment | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<Status>('loaded')
  const [saving, setSaving] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [photoChanged, setPhotoChanged] = useState(false)
  const [routeShipment, setRouteShipment] = useState<Shipment | null>(null)
  const [routeUpdating, setRouteUpdating] = useState(false)
  const [bulkRouteIndex, setBulkRouteIndex] = useState('0')
  const filters: Array<{ id: 'all' | Status; label: string }> = [
    { id: 'all', label: t('common.all') },
    { id: 'loaded', label: t('common.loaded') },
    { id: 'shipped', label: t('common.shipped') },
    { id: 'delivered', label: t('common.delivered') },
  ]

  const load = useCallback(async () => { try { setShipments((await api.get<Shipment[]>('/shipments')).data) } catch (error) { console.error('Unable to load shipments:', error); Alert.alert(t('common.error'), t('adminCargo.loadError')) } finally { setLoading(false) } }, [t])
  useEffect(() => { void load() }, [load])
  const update = (key: keyof Form, value: string | string[]) => setForm(current => ({ ...current, [key]: value } as Form))
  const openCreate = () => { setEditing(null); setForm(emptyForm); setPhotoUri(null); setPhotoChanged(false); setModalOpen(true) }
  const openEdit = (shipment: Shipment) => { setEditing(shipment); setPhotoUri(shipment.qrCode?.startsWith('data:image/') ? shipment.qrCode : null); setPhotoChanged(false); setForm({ senderName: shipment.senderName || '*', receiverName: shipment.receiverName, receiverPhone: shipment.receiverPhone, weight: String(shipment.weight ?? ''), price: String(shipment.price ?? ''), route: shipment.route.length ? shipment.route : ['', ''], status: shipment.status }); setModalOpen(true) }
  const toggleSelection = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const save = async () => {
    const route = form.route.map(stop => stop.trim()).filter(Boolean)
    const price = Number(form.price)
    if (!form.receiverName.trim() || !/^\+\d+$/.test(form.receiverPhone) || !Number.isFinite(price) || price <= 0 || route.length < 2) { Alert.alert(t('common.error'), t('adminCargo.validationError')); return }
    setSaving(true)
    try {
      const payload = { senderName: form.senderName.trim() || '*', receiverName: form.receiverName.trim(), receiverPhone: form.receiverPhone, weight: Number(form.weight) || 0, price, route, routeStatus: editing?.routeStatus?.length === route.length ? editing.routeStatus : route.map(() => false) }
      if (editing) {
        await api.put(`/shipments/${editing.id}`, payload)
        if (photoChanged && photoUri) { const photo = new FormData(); photo.append('photo', { uri: photoUri, name: 'shipment.jpg', type: 'image/jpeg' } as any); await api.post(`/shipments/${editing.id}/photo`, photo, { headers: { 'Content-Type': 'multipart/form-data' } }) }
        if (photoChanged && !photoUri) await api.put(`/shipments/${editing.id}`, { qrCode: null })
      }
      else {
        const created = (await api.post<Shipment>('/shipments', payload)).data
        if (photoUri) { const photo = new FormData(); photo.append('photo', { uri: photoUri, name: 'shipment.jpg', type: 'image/jpeg' } as any); await api.post(`/shipments/${created.id}/photo`, photo, { headers: { 'Content-Type': 'multipart/form-data' } }) }
      }
      setModalOpen(false); await load(); Alert.alert(t('adminCargo.title'), t(editing ? 'adminCargo.shipmentUpdated' : 'adminCargo.shipmentCreated'))
    } catch (error) { console.error('Unable to save shipment:', error); Alert.alert(t('common.error'), t('adminCargo.saveError')) } finally { setSaving(false) }
  }
  const toggleRouteStatus = async (shipment: Shipment, index: number) => {
    const nextStatus = [...shipment.routeStatus]
    const checked = !nextStatus[index]
    for (let i = checked ? 0 : index; i < (checked ? index + 1 : nextStatus.length); i += 1) nextStatus[i] = checked
    setRouteUpdating(true)
    try {
      await api.patch(`/shipments/${shipment.id}/route/${index}/toggle`, { status: checked, fullStatus: nextStatus })
      await load()
      setRouteShipment(current => current ? { ...current, routeStatus: nextStatus } : current)
    } catch { Alert.alert(t('common.error'), t('adminCargo.routeUpdateError')) }
    finally { setRouteUpdating(false) }
  }
  const saveBulk = async () => {
    const index = Number(bulkRouteIndex)
    if (!Number.isInteger(index) || index < 0) { Alert.alert(t('common.error'), t('adminCargo.routeIndexError')); return }
    const selectedShipments = shipments.filter(shipment => selected.includes(shipment.id) && index < shipment.route.length)
    if (!selectedShipments.length) { Alert.alert(t('common.error'), t('adminCargo.routeIndexError')); return }
    setSaving(true)
    try {
      await Promise.all(selectedShipments.map(shipment => {
        const nextStatus = [...shipment.routeStatus]
        const checked = bulkStatus === 'delivered'
        for (let i = checked ? 0 : index; i < (checked ? index + 1 : nextStatus.length); i += 1) nextStatus[i] = checked
        return api.patch(`/shipments/${shipment.id}/route/${index}/toggle`, { status: checked, fullStatus: nextStatus })
      }))
      setSelected([]); setBulkOpen(false); await load(); Alert.alert(t('adminCargo.title'), t('shipments.bulkUpdateSuccess', { count: selectedShipments.length }))
    } catch { Alert.alert(t('common.error'), t('adminCargo.routeUpdateError')) } finally { setSaving(false) }
  }
  const remove = (shipment: Shipment) => Alert.alert(t('common.deleteTitle'), shipment.trackingCode, [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: async () => { try { await api.delete(`/shipments/${shipment.id}`); await load() } catch { Alert.alert(t('common.error'), t('adminCargo.deleteError')) } } }])
  const openCamera = async () => { const permission = await ImagePicker.requestCameraPermissionsAsync(); if (!permission.granted) { Alert.alert(t('common.error'), t('adminCargo.cameraPermission')); return }; const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }); if (!result.canceled) { setPhotoUri(result.assets[0].uri); setPhotoChanged(true) } }
  const visible = shipments.filter(item => (filter === 'all' || item.status === filter) && `${item.trackingCode} ${item.senderName} ${item.receiverName} ${item.receiverPhone}`.toLowerCase().includes(query.toLowerCase()))

  return <MainLayout title={t('adminCargo.title')}><View style={styles.page}>
    <View style={styles.toolbar}><TextInput value={query} onChangeText={setQuery} placeholder={t('adminCargo.search')} style={styles.search} placeholderTextColor="#94a3b8" /><TouchableOpacity onPress={openCreate} style={styles.add}><Ionicons name="add" size={22} color="#fff" /></TouchableOpacity></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filtersRow}>{filters.map(item => <TouchableOpacity key={item.id} onPress={() => setFilter(item.id)} style={[styles.filter, filter === item.id && styles.filterActive]}><Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text></TouchableOpacity>)}</ScrollView>
    {selected.length > 0 && <TouchableOpacity style={styles.bulkButton} onPress={() => setBulkOpen(true)}><Ionicons name="map-outline" size={17} color="#fff" /><Text style={styles.bulkText}>{t('adminCargo.bulkRouteUpdate', { count: selected.length })}</Text></TouchableOpacity>}
    <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {loading ? <ActivityIndicator color="#6366f1" /> : visible.map(item => <View style={styles.card} key={item.id}><View style={styles.cardTop}><TouchableOpacity style={[styles.checkbox, selected.includes(item.id) && styles.checkboxActive]} onPress={() => toggleSelection(item.id)}>{selected.includes(item.id) && <Ionicons name="checkmark" size={15} color="#fff" />}</TouchableOpacity><TouchableOpacity style={styles.info} onPress={() => openEdit(item)}><Text style={styles.code}>{item.trackingCode}</Text><Text style={styles.people}>{item.senderName} → {item.receiverName}</Text></TouchableOpacity><TouchableOpacity onPress={() => setRouteShipment(item)} style={styles.routeAction}><Ionicons name="map-outline" size={20} color="#0f766e" /></TouchableOpacity><TouchableOpacity onPress={() => openEdit(item)}><Ionicons name="create-outline" size={20} color="#6366f1" /></TouchableOpacity><TouchableOpacity onPress={() => remove(item)} style={styles.delete}><Ionicons name="trash-outline" size={19} color="#ef4444" /></TouchableOpacity></View><View style={styles.meta}><Text style={styles.metaText}>{item.weight} kg · ${item.price}</Text><Text style={[styles.status, { color: item.status === 'delivered' ? '#059669' : item.status === 'shipped' ? '#4f46e5' : '#b45309' }]}>{filters.find(x => x.id === item.status)?.label}</Text></View></View>)}
      {!loading && !visible.length && <Text style={styles.empty}>{t('adminCargo.noShipments')}</Text>}
    </ScrollView>
    <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}><ScrollView contentContainerStyle={styles.modal}><View style={styles.modalHead}><Text style={styles.modalTitle}>{editing ? t('adminCargo.editShipment') : t('adminCargo.addShipment')}</Text><TouchableOpacity onPress={() => setModalOpen(false)}><Ionicons name="close" size={25} color="#475569" /></TouchableOpacity></View>
      {([['receiverName', 'Alıcı adı *'], ['receiverPhone', 'Alıcı telefonu *'], ['weight', 'Ağırlık (kg)'], ['price', 'Fiyat ($) *']] as const).map(([key, label]) => <View key={key}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={form[key]} onChangeText={value => update(key, value)} keyboardType={key === 'weight' || key === 'price' || key === 'receiverPhone' ? 'decimal-pad' : 'default'} /></View>)}
      <><Text style={styles.label}>{t('adminCargo.photo')}</Text>{photoUri ? <View style={styles.photoWrap}><Image source={{ uri: photoUri }} style={styles.photo} /><TouchableOpacity style={styles.removePhoto} onPress={() => { setPhotoUri(null); setPhotoChanged(true) }}><Ionicons name="close-circle" size={28} color="#ef4444" /></TouchableOpacity></View> : <TouchableOpacity style={styles.cameraButton} onPress={openCamera}><Ionicons name="camera-outline" size={20} color="#6366f1" /><Text style={styles.cameraText}>{editing ? t('adminCargo.newPhoto') : t('adminCargo.takePhoto')}</Text></TouchableOpacity>}</>
      <Text style={styles.label}>{t('common.route')} *</Text>{form.route.map((stop, index) => <View style={styles.routeRow} key={index}><TextInput style={[styles.input, styles.routeInput]} placeholder={t('adminCargo.stopPlaceholder', { number: index + 1 })} value={stop} onChangeText={value => update('route', form.route.map((item, i) => i === index ? value : item))} />{form.route.length > 2 && <TouchableOpacity onPress={() => update('route', form.route.filter((_, i) => i !== index))}><Ionicons name="remove-circle-outline" size={24} color="#ef4444" /></TouchableOpacity>}</View>)}
      <TouchableOpacity style={styles.addStop} onPress={() => update('route', [...form.route, ''])}><Text style={styles.addStopText}>{t('adminCargo.addStop')}</Text></TouchableOpacity><TouchableOpacity style={styles.save} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{editing ? t('common.save') : t('adminCargo.addShipment')}</Text>}</TouchableOpacity>
    </ScrollView></Modal>
    <Modal visible={bulkOpen} transparent animationType="fade" onRequestClose={() => setBulkOpen(false)}><View style={styles.overlay}><View style={styles.bulkModal}><Text style={styles.bulkTitle}>{t('adminCargo.bulkRouteTitle')}</Text><Text style={styles.bulkHint}>{t('adminCargo.bulkRouteHint', { count: selected.length })}</Text><TextInput value={bulkRouteIndex} onChangeText={setBulkRouteIndex} keyboardType="number-pad" placeholder={t('adminCargo.routeIndex')} style={styles.bulkInput} />{([{ id: 'delivered', label: t('adminCargo.markPassed') }, { id: 'loaded', label: t('adminCargo.markRemaining') }] as { id: Status; label: string }[]).map(option => <TouchableOpacity key={option.id} style={[styles.bulkChoice, bulkStatus === option.id && styles.bulkChoiceActive]} onPress={() => setBulkStatus(option.id)}><Text style={styles.bulkChoiceText}>{option.label}</Text></TouchableOpacity>)}<View style={styles.modalActions}><TouchableOpacity onPress={() => setBulkOpen(false)} style={styles.cancel}><Text style={styles.cancelText}>{t('common.cancel')}</Text></TouchableOpacity><TouchableOpacity onPress={saveBulk} style={styles.saveSmall}><Text style={styles.saveText}>{t('adminCargo.apply')}</Text></TouchableOpacity></View></View></View></Modal>
    <Modal visible={!!routeShipment} animationType="slide" onRequestClose={() => setRouteShipment(null)}><View style={styles.routeModal}><View style={styles.modalHead}><View><Text style={styles.modalTitle}>{t('common.route')}</Text><Text style={styles.routeSubtitle}>{routeShipment?.trackingCode}</Text></View><TouchableOpacity onPress={() => setRouteShipment(null)}><Ionicons name="close" size={25} color="#475569" /></TouchableOpacity></View><ScrollView contentContainerStyle={styles.routeList}>{routeShipment?.route.map((stop, index) => { const passed = Boolean(routeShipment.routeStatus[index]); const isFirst = index === 0; const isLast = index === routeShipment.route.length - 1; return <TouchableOpacity key={`${stop}-${index}`} disabled={routeUpdating || (index > 0 && !routeShipment.routeStatus[index - 1] && !passed)} onPress={() => toggleRouteStatus(routeShipment, index)} style={[styles.routeStop, passed && styles.routeStopPassed]}><View style={[styles.routeDot, passed && styles.routeDotPassed]}><Text style={styles.routeDotText}>{passed ? '✓' : index + 1}</Text></View><View style={styles.routeStopText}><Text style={styles.routeStopName}>{stop}</Text><Text style={styles.routeStopType}>{isFirst ? t('common.start') : isLast ? t('common.destination') : passed ? t('common.passed') : t('common.waiting')}</Text></View><Ionicons name={passed ? 'checkmark-circle' : 'chevron-forward'} size={22} color={passed ? '#059669' : '#94a3b8'} /></TouchableOpacity> })}</ScrollView></View></Modal>
  </View></MainLayout>
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  toolbar: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  search: { flex: 1, height: 44, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, color: '#0f172a' },
  add: { width: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366f1' },

  // ↓↓↓ SADECE BURASI DEĞİŞTİ ↓↓↓
  filtersRow: { flexGrow: 0, flexShrink: 0 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 22, paddingLeft: 9, paddingRight: 0, paddingBottom: 13 },
  filter: { height: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 19, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  // ↑↑↑ SADECE BURASI DEĞİŞTİ ↑↑↑

  filterActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterText: { color: '#64748b', fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  bulkButton: { backgroundColor: '#0f766e', paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginBottom: 10 },
  bulkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { gap: 10, paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 13, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 23, height: 23, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  info: { flex: 1 },
  code: { color: '#0f172a', fontWeight: '700' },
  people: { color: '#64748b', marginTop: 4, fontSize: 13 },
  delete: { marginLeft: 13 },
  routeAction: { marginRight: 13 },
  meta: { borderTopWidth: 1, borderColor: '#f1f5f9', marginTop: 12, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { color: '#64748b', fontSize: 12 },
  status: { fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 30 },
  modal: { padding: 20, gap: 12, backgroundColor: '#f8fafc', flexGrow: 1 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { color: '#0f172a', fontWeight: '700', fontSize: 22 },
  label: { color: '#475569', fontWeight: '600', fontSize: 13, marginBottom: 5 },
  input: { height: 46, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, color: '#0f172a' },
  statusPicker: { flexDirection: 'row', gap: 7 },
  statusOption: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff', borderRadius: 9, borderWidth: 1, borderColor: '#e2e8f0' },
  statusOptionActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  statusOptionText: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  statusOptionTextActive: { color: '#4f46e5' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeInput: { flex: 1 },
  addStop: { alignItems: 'center', paddingVertical: 8 },
  addStopText: { color: '#6366f1', fontWeight: '700' },
  save: { backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 11, alignItems: 'center', marginTop: 6 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cameraButton: { height: 50, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#a5b4fc', backgroundColor: '#eef2ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cameraText: { color: '#4f46e5', fontWeight: '700' },
  photoWrap: { position: 'relative' },
  photo: { height: 180, borderRadius: 12, width: '100%' },
  removePhoto: { position: 'absolute', right: 8, top: 8, backgroundColor: '#fff', borderRadius: 15 },
  overlay: { flex: 1, padding: 24, backgroundColor: 'rgba(15,23,42,.45)', justifyContent: 'center' },
  bulkModal: { backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  bulkTitle: { color: '#0f172a', fontSize: 19, fontWeight: '700' },
  bulkHint: { color: '#64748b', marginTop: 5, marginBottom: 14 },
  bulkInput: { height: 46, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 9, paddingHorizontal: 12, color: '#0f172a', marginBottom: 10 },
  bulkChoice: { padding: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 9, marginBottom: 8 },
  bulkChoiceActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  bulkChoiceText: { color: '#334155', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancel: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelText: { color: '#475569', fontWeight: '700' },
  saveSmall: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#6366f1', alignItems: 'center' },
  routeModal: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  routeSubtitle: { color: '#64748b', fontSize: 13, marginTop: 3 },
  routeList: { gap: 10, paddingBottom: 24 },
  routeStop: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14 },
  routeStopPassed: { borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' },
  routeDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  routeDotPassed: { backgroundColor: '#059669' },
  routeDotText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  routeStopText: { flex: 1 },
  routeStopName: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  routeStopType: { color: '#64748b', fontSize: 11, marginTop: 3 },
})
