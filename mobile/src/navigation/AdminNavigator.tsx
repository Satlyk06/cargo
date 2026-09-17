import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen'
import AdminCargoScreen from '../screens/admin/AdminCargoScreen'
import AdminUsersScreen from '../screens/admin/AdminUsersScreen'
import ProfileScreen from '../screens/dashboard/ProfileScreen'

const Tab = createBottomTabNavigator()

const icons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = { AdminHome: 'grid-outline', AdminCargo: 'cube-outline', AdminUsers: 'people-outline', AdminProfile: 'person-outline' }

export default function AdminNavigator() {
  const { t } = useTranslation()
  const labels: Record<string, string> = { AdminHome: t('admin.panel'), AdminCargo: t('admin.cargoManagement'), AdminUsers: t('admin.users'), AdminProfile: t('common.profile') }
  return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: '#6366f1', tabBarInactiveTintColor: '#94a3b8', tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />, tabBarLabel: labels[route.name], tabBarStyle: { height: 74, paddingBottom: 47, paddingTop: 1, backgroundColor: '#fff', borderTopColor: '#e2e8f0' }, tabBarLabelStyle: { fontSize: 10, fontWeight: '500' } })}>
    <Tab.Screen name="AdminHome" component={AdminDashboardScreen} />
    <Tab.Screen name="AdminCargo" component={AdminCargoScreen} />
    <Tab.Screen name="AdminUsers" component={AdminUsersScreen} />
    <Tab.Screen name="AdminProfile" component={ProfileScreen} />
  </Tab.Navigator>
}
