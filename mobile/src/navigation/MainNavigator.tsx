import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useNotifications } from '../context/NotificationContext'

import DashboardScreen from '../screens/dashboard/DashboardScreen'
import ShipmentsScreen from '../screens/dashboard/ShipmentsScreen'
import NotificationsScreen from '../screens/dashboard/NotificationsScreen'
import ProfileScreen from '../screens/dashboard/ProfileScreen'
import ShipmentDetailScreen from '../screens/dashboard/ShipmentDetailScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function ShipmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShipmentsList" component={ShipmentsScreen} />
      <Stack.Screen name="ShipmentDetail" component={ShipmentDetailScreen} />
    </Stack.Navigator>
  )
}

export default function MainNavigator() {
  const { t } = useTranslation()
  const { unreadCount } = useNotifications()

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home': return t('common.home')
      case 'Shipments': return t('common.shipments')
      case 'Notifications': return t('common.notifications')
      case 'Profile': return t('common.profile')
      default: return routeName
    }
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Shipments') {
            iconName = focused ? 'cube' : 'cube-outline'
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          height: 74,
          paddingBottom: 47,
          paddingTop: 1,
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarLabel: getTabLabel('Home') }}
      />
      <Tab.Screen
        name="Shipments"
        component={ShipmentsStack}
        options={{ tabBarLabel: getTabLabel('Shipments') }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: getTabLabel('Notifications'),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444' },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: getTabLabel('Profile') }}
      />
    </Tab.Navigator>
  )
}
