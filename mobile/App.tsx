import React, { useEffect, useCallback } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import * as NavigationBar from 'expo-navigation-bar'
import { AppState, Platform, View, Text } from 'react-native'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { NotificationProvider, useNotifications } from './src/context/NotificationContext'
import { ShipmentProvider, useShipments } from './src/context/ShipmentContext'
import AppNavigator from './src/navigation/AppNavigator'
import { registerForPushNotificationsAsync, requestNotificationPermission, setupNotificationListeners } from './src/services/notificationService'
import './src/i18n'

SplashScreen.preventAutoHideAsync()

function AppContent() {
  const { user } = useAuth()
  const { refreshNotifications } = useNotifications()
  const { refreshShipments } = useShipments()
  const [appIsReady, setAppIsReady] = React.useState(false)

  useEffect(() => {
    const hideNavigationBar = async () => {
      if (Platform.OS === 'android') {
        await NavigationBar.setVisibilityAsync('hidden')
      }
    }

    const prepareApp = async () => {
      try {
        await hideNavigationBar()

        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.warn('Hazırlık hatası:', error)
      } finally {
        setAppIsReady(true)
        await SplashScreen.hideAsync()
      }
    }

    prepareApp()

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        void hideNavigationBar()
      }
    })

    return () => appStateSubscription.remove()
  }, [])

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // ✅ Push bildirimleri
  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync()
    }

    const cleanup = setupNotificationListeners(
      async (notification) => {
        console.log('📨 Bildirim alındı:', notification)
        await refreshNotifications()
        await refreshShipments()
      },
      async (response) => {
        const data = response.notification.request.content.data
        console.log('👆 Bildirim tıklandı:', data)
        await refreshNotifications()
        await refreshShipments()

        if (data?.shipmentId) {
          // Navigation yapılabilir
        }
      }
    )

    return cleanup
  }, [user, refreshNotifications, refreshShipments])

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>🚚 Cargo</Text>
        <Text style={{ color: '#fff', fontSize: 14, marginTop: 8, opacity: 0.7 }}>Yükleniyor...</Text>
      </View>
    )
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <ShipmentProvider>
            <AppContent />
          </ShipmentProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
