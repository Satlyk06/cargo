import React from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import CustomHeader from '../common/CustomHeader'

interface MainLayoutProps {
  children: React.ReactNode  // ← Burada
  title: string
  showBack?: boolean
  onBack?: () => void
}

export default function MainLayout({ 
  children, 
  title, 
  showBack = false, 
  onBack
}: MainLayoutProps) {
  const navigation = useNavigation<any>()
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <CustomHeader 
        title={title} 
        showBack={showBack} 
        onBack={onBack}
        onNotifications={() => navigation.navigate('Notifications')}
        onProfile={() => navigation.navigate('Profile')}
      />
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 30,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
})
