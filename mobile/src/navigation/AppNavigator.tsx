import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from '../context/AuthContext'
import LoginScreen from '../screens/auth/LoginScreen'
import MainNavigator from './MainNavigator'
import AdminNavigator from './AdminNavigator'

const Stack = createStackNavigator()

export default function AppNavigator() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()

  if (isLoading) {
    return null
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={isAdmin ? AdminNavigator : MainNavigator} />
      )}
    </Stack.Navigator>
  )
}
