import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

export interface Shipment {
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

interface ShipmentContextType {
  shipments: Shipment[]
  loading: boolean
  refreshShipments: () => Promise<void>
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined)

export const ShipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(false)

  const refreshShipments = useCallback(async () => {
    if (!user?.id) {
      setShipments([])
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/shipments/user/${user.id}`)
      setShipments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Kargolar yenilenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
  void refreshShipments()

  // Her 30 saniyede otomatik yenile
  const interval = setInterval(() => {
    void refreshShipments()
  }, 30000)

  return () => clearInterval(interval)
}, [refreshShipments])

  const value = useMemo(() => ({ shipments, loading, refreshShipments }), [shipments, loading, refreshShipments])

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>
}

export const useShipments = () => {
  const context = useContext(ShipmentContext)
  if (!context) throw new Error('useShipments must be used within ShipmentProvider')
  return context
}
