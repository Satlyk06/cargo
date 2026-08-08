import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import api from './api'

type NotificationsModule = typeof import('expo-notifications')

// SDK 53+ Expo Go no longer includes Android remote-push native support.
const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo'

function getNotifications(): NotificationsModule | null {
  if (isExpoGo) return null
  // Keep this lazy: a static import triggers Expo Go's red error overlay.
  return require('expo-notifications') as NotificationsModule
}

export async function requestNotificationPermission() {
  const Notifications = getNotifications()
  if (!Notifications || !Device.isDevice) return false
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.MAX })
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  if (existingStatus === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function registerForPushNotificationsAsync() {
  const Notifications = getNotifications()
  if (!Notifications || !Device.isDevice || !(await requestNotificationPermission())) return null
  const token = (await Notifications.getExpoPushTokenAsync()).data
  try { await api.post('/users/push-token', { token }) } catch (error) { console.error('Push token gönderilemedi:', error) }
  return token
}

export function setupNotificationListeners(
  onNotification: (notification: import('expo-notifications').Notification) => void,
  onResponse: (response: import('expo-notifications').NotificationResponse) => void,
) {
  const Notifications = getNotifications()
  if (!Notifications) return () => {}
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
  })
  const received = Notifications.addNotificationReceivedListener(onNotification)
  const response = Notifications.addNotificationResponseReceivedListener(onResponse)
  return () => { received.remove(); response.remove() }
}

export async function sendTestNotification(title: string, body: string, data?: Record<string, unknown>) {
  const Notifications = getNotifications()
  if (!Notifications) return
  await Notifications.scheduleNotificationAsync({ content: { title, body, data, sound: 'default' }, trigger: null })
}
