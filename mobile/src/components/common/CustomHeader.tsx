import React from 'react'
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import LanguageSwitcher from './LanguageSwitcher'

interface CustomHeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
}

export default function CustomHeader({ showBack = false, onBack }: CustomHeaderProps) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="arrow-back" size={20} color="#475569" />
        </TouchableOpacity>
      ) : (
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.brandIcon}
          resizeMode="cover"
        />
      )}

      <View style={styles.languageButton}>
        <LanguageSwitcher withLabel />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f5',
  },
  brandIcon: {
    width: 58,
    height: 48,
    borderRadius: 21,
  },
  languageButton: {
    height: 34,
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 9,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
})
