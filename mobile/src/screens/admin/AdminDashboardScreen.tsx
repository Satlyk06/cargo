import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../services/api'

type Stats = { totalShipments: number; totalUsers: number; totalAdmins: number; loaded: number; shipped: number; delivered: number }

export default function AdminDashboardScreen() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const response = await api.get<Stats>('/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Admin istatistikleri yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const cards: Array<{ key: keyof Stats; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string; background: string }> = [
    { key: 'totalShipments', label: t('admin.stats.totalShipments'), icon: 'cube-outline', color: '#6366f1', background: '#eef2ff' },
    { key: 'totalUsers', label: t('admin.stats.totalUsers'), icon: 'people-outline', color: '#0ea5e9', background: '#e0f2fe' },
    { key: 'totalAdmins', label: t('admin.stats.totalAdmins'), icon: 'shield-checkmark-outline', color: '#8b5cf6', background: '#f5f3ff' },
    { key: 'loaded', label: t('admin.stats.loaded'), icon: 'archive-outline', color: '#f59e0b', background: '#fef3c7' },
    { key: 'shipped', label: t('admin.stats.shipped'), icon: 'car-outline', color: '#6366f1', background: '#eef2ff' },
    { key: 'delivered', label: t('admin.stats.delivered'), icon: 'checkmark-circle-outline', color: '#10b981', background: '#d1fae5' },
  ]

  useEffect(() => { void load() }, [load])

  return (
    <MainLayout title={t('admin.title')}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <View style={styles.titleRow}>
          <View><Text style={styles.eyebrow}>{t('admin.management')}</Text><Text style={styles.title}>{t('admin.title')}</Text></View>
          <TouchableOpacity style={styles.refresh} onPress={load}><Ionicons name="refresh" size={18} color="#475569" /></TouchableOpacity>
        </View>
        <View style={styles.grid}>
          {cards.map(card => (
            <View key={card.key} style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: card.background }]}><Ionicons name={card.icon} size={21} color={card.color} /></View>
              <Text style={styles.cardLabel}>{card.label}</Text>
              {loading ? <ActivityIndicator color={card.color} style={styles.loader} /> : <Text style={[styles.value, { color: card.color }]}>{stats?.[card.key] ?? 0}</Text>}
            </View>
          ))}
        </View>
        {!loading && stats && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{t('admin.summary')}</Text>
            {(['loaded', 'shipped', 'delivered'] as const).map((key) => {
              const colors = { loaded: '#f59e0b', shipped: '#6366f1', delivered: '#10b981' }
              const percent = stats.totalShipments ? (stats[key] / stats.totalShipments) * 100 : 0
              return <View key={key} style={styles.statusRow}><View style={[styles.dot, { backgroundColor: colors[key] }]} /><Text style={styles.statusLabel}>{t(`admin.stats.${key}`)}</Text><View style={styles.track}><View style={[styles.progress, { width: `${percent}%`, backgroundColor: colors[key] }]} /></View><Text style={styles.statusValue}>{stats[key]}</Text></View>
            })}
          </View>
        )}
      </ScrollView>
    </MainLayout>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 }, titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: '#6366f1', fontSize: 11, fontWeight: '700', letterSpacing: 1 }, title: { color: '#0f172a', fontSize: 24, fontWeight: '700', marginTop: 3 }, refresh: { padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#fff' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, card: { width: '48%', flexGrow: 1, minHeight: 132, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, backgroundColor: '#fff' }, iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, cardLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' }, value: { fontSize: 28, fontWeight: '700', marginTop: 4 }, loader: { alignSelf: 'flex-start', marginTop: 10 }, summary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 16, gap: 13 }, summaryTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1 }, statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dot: { width: 8, height: 8, borderRadius: 4 }, statusLabel: { color: '#475569', fontSize: 12, width: 94 }, track: { flex: 1, height: 7, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }, progress: { height: '100%', borderRadius: 5 }, statusValue: { color: '#0f172a', fontWeight: '700', width: 24, textAlign: 'right' },
})
