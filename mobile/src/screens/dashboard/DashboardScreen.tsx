import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../services/api'

interface Shipment {
  id: string
  trackingCode: string
  senderId: string
  senderName: string
  receiverName: string
  weight: number
  price: number
  status: string
  route: string[]
  routeStatus: boolean[]
  createdAt: string
}

export default function DashboardScreen() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchShipments = useCallback(async () => {
    try {
      if (!user?.id) return
      const response = await api.get(`/shipments/user/${user.id}`)
      setShipments(response.data)
    } catch (error) {
      console.error('Kargolar yüklenirken hata:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      void fetchShipments()
    }, [fetchShipments]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchShipments()
  }

  const stats = {
    inTransit: shipments.filter(s => s.status === 'loaded' || s.status === 'shipped').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    total: shipments.length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded': return '#f59e0b'
      case 'shipped': return '#6366f1'
      case 'delivered': return '#10b981'
      default: return '#94a3b8'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'loaded': return t('common.loaded')
      case 'shipped': return t('common.shipped')
      case 'delivered': return t('common.delivered')
      default: return status
    }
  }

  const statCards = [
    {
      label: t('common.inTransit'),
      value: stats.inTransit,
      accent: '#6366f1',
      bg: '#eef2ff',
      icon: 'swap-horizontal' as const,
    },
    {
      label: t('common.delivered'),
      value: stats.delivered,
      accent: '#10b981',
      bg: '#d1fae5',
      icon: 'checkmark-circle' as const,
    },
    {
      label: t('common.total'),
      value: stats.total,
      accent: '#64748b',
      bg: '#f1f5f9',
      icon: 'cube' as const,
    },
  ]

  return (
    <MainLayout title={t('common.home')}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
        }
      >
        <Text style={styles.eyebrow}>{t('common.controlPanel')}</Text>
        <Text style={styles.title}>{t('dashboard.title')}</Text>
        <Text style={styles.welcome}>
          {t('dashboard.welcome')} {user?.name || user?.phoneNumber}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {statCards.map(card => (
            <View key={card.label} style={styles.statCard}>
              <View style={styles.statCardInner}>
                <Text style={styles.statLabel} numberOfLines={1}>
                  {card.label}
                </Text>
                <View style={styles.statValueRow}>
                  <Text style={[styles.statValue, { color: card.accent }]}>{card.value}</Text>
                  <View style={[styles.statIcon, { backgroundColor: card.bg }]}>
                    <Ionicons name={card.icon} size={20} color={card.accent} />
                  </View>
                </View>
              </View>
              <View style={[styles.accentBar, { backgroundColor: card.accent }]} />
            </View>
          ))}
        </View>

        {/* Recent Shipments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('common.recentShipments')}</Text>
            <Text style={styles.sectionCount}>{shipments.length} {t('dashboard.records')}</Text>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : shipments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('common.noShipments')}</Text>
            </View>
          ) : (
            shipments.slice(0, 5).map(shipment => {
              const isSender = shipment.senderId === user?.id
              const st = getStatusColor(shipment.status)
              return (
                <View key={shipment.id} style={styles.shipmentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackingCode}>{shipment.trackingCode}</Text>
                    <Text style={styles.shipmentMeta}>
                      {isSender ? `↑ ${t('dashboard.sender')}` : `↓ ${t('dashboard.receiver')}`} · {shipment.senderName} → {shipment.receiverName}
                    </Text>
                    <View style={styles.shipmentDetails}>
                      <Text style={styles.shipmentDetail}>{shipment.weight} kg</Text>
                      <Text style={styles.shipmentDetail}>${shipment.price}</Text>
                      <Text style={styles.shipmentDetail}>{shipment.route.join(' → ')}</Text>
                    </View>
                  </View>
                  <View style={styles.shipmentRight}>
                    <View style={[styles.statusBadge, { backgroundColor: st + '20' }]}>
                      <Text style={[styles.statusText, { color: st }]}>{getStatusText(shipment.status)}</Text>
                    </View>
                    <Text style={styles.shipmentDate}>
                      {new Date(shipment.createdAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                </View>
              )
            })
          )}
        </View>
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
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#6366f1',
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  welcome: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
  },
  statCardInner: {
    alignItems: 'stretch',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 4,
    lineHeight: 12,
    flexShrink: 0,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    opacity: 0.5,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  sectionCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  shipmentRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  trackingCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  shipmentMeta: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 3,
  },
  shipmentDetails: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  shipmentDetail: {
    fontSize: 11,
    color: '#94a3b8',
  },
  shipmentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  shipmentDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyCard: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
})
