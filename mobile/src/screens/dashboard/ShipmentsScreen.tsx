import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native'
import MainLayout from '../../components/layout/MainLayout'
import { useShipments } from '../../context/ShipmentContext'

interface Shipment {
  id: string
  trackingCode: string
  senderName: string
  receiverName: string
  weight: number
  price: number
  status: string
  route: string[]
  routeStatus: boolean[]
  createdAt: string
}

type RootStackParamList = {
  ShipmentsList: undefined
  ShipmentDetail: { id: string }
}

export default function ShipmentsScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const { shipments, loading, refreshShipments } = useShipments()
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const fetchShipments = useCallback(async () => {
    try {
      await refreshShipments()
    } catch (error) {
      console.error('Kargolar yüklenirken hata:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refreshShipments])

  useFocusEffect(
    useCallback(() => {
      void fetchShipments()
    }, [fetchShipments]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchShipments()
  }

  const filters = [
    { key: 'all', label: t('common.all') },
    { key: 'loaded', label: t('common.loaded') },
    { key: 'shipped', label: t('common.shipped') },
    { key: 'delivered', label: t('common.delivered') },
  ]

  const filteredShipments = shipments
    .filter((s) => activeFilter === 'all' || s.status === activeFilter)
    .filter((s) =>
      s.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded':
        return '#f59e0b'
      case 'shipped':
        return '#6366f1'
      case 'delivered':
        return '#10b981'
      default:
        return '#94a3b8'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'loaded':
        return t('common.loaded')
      case 'shipped':
        return t('common.shipped')
      case 'delivered':
        return t('common.delivered')
      default:
        return status
    }
  }

  const copyTrackingCode = async (trackingCode: string) => {
    await Clipboard.setStringAsync(trackingCode)
    Alert.alert(t('common.copy'), trackingCode)
  }

  const renderShipment = (item: Shipment) => {
    const passedCount = item.routeStatus.filter(Boolean).length
    const totalCount = item.route.length
    const pct = totalCount > 0 ? (passedCount / totalCount) * 100 : 0
    const st = getStatusColor(item.status)

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ShipmentDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => copyTrackingCode(item.trackingCode)} style={styles.trackingCodeButton}>
            <Text style={styles.trackingCode}>{item.trackingCode}</Text>
            <Ionicons name="copy-outline" size={15} color="#6366f1" />
          </TouchableOpacity>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: st + '20' }]}>
              <Text style={[styles.statusText, { color: st }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.senderReceiver}>
          {item.senderName} → {item.receiverName}
        </Text>

        <View style={styles.details}>
          <Text style={styles.detailText}>{item.weight} kg</Text>
          <Text style={styles.detailText}>${item.price}</Text>
          <Text style={styles.detailText}>{item.route.join(' → ')}</Text>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>{t('common.progress')}</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${pct}%`,
                  backgroundColor: pct === 100 ? '#10b981' : '#6366f1',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {passedCount}/{totalCount} {t('common.stops')}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('tr-TR')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <MainLayout title={t('common.shipments')}>
      <View style={styles.container}>
        {/* Arama */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* Filtreler */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterButton, activeFilter === filter.key && styles.filterButtonActive]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : filteredShipments.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('common.noShipments')}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
            }
          >
            {filteredShipments.map((item) => (
              <View key={item.id}>{renderShipment(item)}</View>
            ))}
          </ScrollView>
        )}
      </View>
    </MainLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  searchWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingLeft: 36,
    paddingRight: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterContainer: {
    height: 52,
    flexGrow: 0,
    marginBottom: 12,
  },
  filterContent: {
    paddingLeft: 13,
    gap: 20,
    alignItems: 'center',
     },
  filterButton: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 16,
    gap: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  trackingCodeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  senderReceiver: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 5,
  },
  details: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 7,
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  date: {
    fontSize: 11,
    color: '#94a3b8',
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
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
})
