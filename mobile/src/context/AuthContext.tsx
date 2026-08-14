import React, { createContext, useState, useContext, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import api from '../services/api'

// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    } as any
  },
})

interface User {
  id: string
  phoneNumber: string
  name: string
  role: string
  isBanned: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: User) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function registerPushToken(userId: string) {
  try {
    if (!Device.isDevice) return

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '0119ec85-53e0-426f-97fd-361333237ea6'
    })

    await api.post('/users/push-token', {
      token: tokenData.data
    })
  } catch (error) {
    console.error('Push token kaydedilemedi:', error)
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStoredData()
  }, [])

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token')
      const storedUser = await AsyncStorage.getItem('user')

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
        // Uygulama açılışında da token yenile
        await registerPushToken(parsedUser.id)
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (newToken: string, newUser: User) => {
    try {
      await AsyncStorage.setItem('token', newToken)
      await AsyncStorage.setItem('user', JSON.stringify(newUser))
      setToken(newToken)
      setUser(newUser)
      // Login olunca push token kaydet
      await registerPushToken(newUser.id)
    } catch (error) {
      console.error('Login hatası:', error)
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token')
      await AsyncStorage.removeItem('user')
      setToken(null)
      setUser(null)
    } catch (error) {
      console.error('Logout hatası:', error)
    }
  }

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}