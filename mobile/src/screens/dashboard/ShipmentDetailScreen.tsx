import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../services/api'

interface ShipmentDetail {
  id: string
  trackingCode: string
  senderName: string
  receiverName: string
  receiverPhone: string
  weight: number
  price: number
  route: string[]
  routeStatus: boolean[]
  currentRouteIndex: number
  status: string
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
}

export default function ShipmentDetailScreen() {
  const { t } = useTranslation()
  const route = useRoute()
  const navigation = useNavigation()
  const { id } = route.params as { id: string }
  
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShipmentDetail()
  }, [])

  const fetchShipmentDetail = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/shipments/${id}`)
      setShipment(response.data)
    } catch (error) {
      console.error('Kargo detayı yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
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

  const callPhone = () => {
    if (shipment?.receiverPhone) {
      Linking.openURL(`tel:${shipment.receiverPhone}`)
    }
  }

  const copyTrackingCode = async () => {
    if (!shipment) return
    await Clipboard.setStringAsync(shipment.trackingCode)
    Alert.alert(t('common.copy'), shipment.trackingCode)
  }

  if (loading) {
    return (
      <MainLayout title={t('common.shipments')}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </MainLayout>
    )
  }

  if (!shipment) {
    return (
      <MainLayout title={t('common.shipments')}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Kargo bulunamadı</Text>
        </View>
      </MainLayout>
    )
  }

  const passedCount = shipment.routeStatus.filter(Boolean).length
  const totalCount = shipment.route.length
  const pct = totalCount > 0 ? (passedCount / totalCount) * 100 : 0
  const isComplete = pct === 100
  const st = getStatusColor(shipment.status)

  return (
    <MainLayout title={t('common.shipments')}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity
          style={styles.inlineBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <View style={styles.inlineBackIcon}>
            <Ionicons name="arrow-back" size={18} color="#4f46e5" />
          </View>
          <Text style={styles.inlineBackText}>{t('common.shipments')}</Text>
        </TouchableOpacity>
        {/* Durum */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: st + '20' }]}>
            <Text style={[styles.statusText, { color: st }]}>
              {getStatusText(shipment.status)}
            </Text>
          </View>
          <TouchableOpacity onPress={copyTrackingCode} style={styles.trackingCodeButton}>
            <Text style={styles.trackingCode}>{shipment.trackingCode}</Text>
            <Ionicons name="copy-outline" size={16} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Gönderici - Alıcı */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('common.sender')}</Text>
              <Text style={styles.infoValue}>{shipment.senderName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('common.receiver')}</Text>
              <Text style={styles.infoValue}>{shipment.receiverName}</Text>
              {shipment.receiverPhone && (
                <TouchableOpacity onPress={callPhone} style={styles.callButton}>
                  <Ionicons name="call-outline" size={16} color="#6366f1" />
                  <Text style={styles.callText}>{shipment.receiverPhone}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Detaylar */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('common.weight')}</Text>
              <Text style={styles.detailValue}>{shipment.weight} kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('common.price')}</Text>
              <Text style={styles.detailValue}>${shipment.price}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('common.date')}</Text>
              <Text style={styles.detailValue}>
                {new Date(shipment.createdAt).toLocaleDateString('tr-TR')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('common.route')}</Text>
              <Text style={styles.detailValue}>{shipment.route.join(' → ')}</Text>
            </View>
          </View>
        </View>

        {/* Rota İlerleme */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{t('common.routeStatus')}</Text>
            <View style={[styles.progressBadge, { backgroundColor: isComplete ? '#d1fae5' : '#eef2ff' }]}>
              <Text style={[styles.progressBadgeText, { color: isComplete ? '#065f46' : '#4f46e5' }]}>
                {isComplete ? '✓' : `%${Math.round(pct)}`} {isComplete ? t('common.delivered') : `${passedCount}/${totalCount} ${t('common.stops')}`}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: isComplete ? '#10b981' : '#6366f1',
                  },
                ]}
              />
            </View>
          </View>

          {/* Rota Durakları */}
          <View style={styles.routeStops}>
            {shipment.route.map((stop, index) => {
              const isPassed = shipment.routeStatus[index] || false
              const isCurrent = index === shipment.currentRouteIndex && !isPassed
              const isLast = index === shipment.route.length - 1
              return (
                <View key={index} style={styles.routeStop}>
                  <View style={styles.routeStopLeft}>
                    <View
                      style={[
                        styles.routeDot,
                        isPassed && styles.routeDotPassed,
                        isCurrent && styles.routeDotCurrent,
                      ]}
                    >
                      {isPassed && (
                        <Ionicons name="checkmark" size={8} color="#fff" />
                      )}
                      {isCurrent && (
                        <View style={styles.routeDotPulse} />
                      )}
                    </View>
                    {index < shipment.route.length - 1 && (
                      <View
                        style={[
                          styles.routeLine,
                          isPassed && styles.routeLinePassed,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.routeStopRight}>
                    <Text
                      style={[
                        styles.routeStopName,
                        isPassed && styles.routeStopPassed,
                        isCurrent && styles.routeStopCurrent,
                      ]}
                    >
                      {stop}
                    </Text>
                    <Text
                      style={[
                        styles.routeStopStatus,
                        isPassed && styles.routeStopStatusPassed,
                        isCurrent && styles.routeStopStatusCurrent,
                      ]}
                    >
                      {isPassed ? `✓ ${t('common.passed')}` :
                       isCurrent ? `◉ ${t('common.current')}` :
                       isLast ? t('common.destination') :
                       t('common.remaining')}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>

      </ScrollView>
    </MainLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  inlineBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
    paddingVertical: 3,
    paddingLeft: 6,
    paddingRight: 9,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  inlineBackIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  inlineBackText: {
    color: '#4338ca',
    fontSize: 13,
    fontWeight: '700',
  },
  trackingCodeButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trackingCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  callText: {
    fontSize: 13,
    color: '#6366f1',
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  routeStops: {
    gap: 8,
  },
  routeStop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeStopLeft: {
    alignItems: 'center',
    paddingTop: 4,
  },
  routeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDotPassed: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  routeDotCurrent: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  routeDotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  routeLinePassed: {
    backgroundColor: '#10b981',
  },
  routeStopRight: {
    flex: 1,
    paddingTop: 2,
  },
  routeStopName: {
    fontSize: 14,
    color: '#64748b',
  },
  routeStopPassed: {
    color: '#10b981',
    fontWeight: '600',
  },
  routeStopCurrent: {
    color: '#6366f1',
    fontWeight: '700',
  },
  routeStopStatus: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  routeStopStatusPassed: {
    color: '#10b981',
  },
  routeStopStatusCurrent: {
    color: '#6366f1',
    fontWeight: '600',
  },
})
