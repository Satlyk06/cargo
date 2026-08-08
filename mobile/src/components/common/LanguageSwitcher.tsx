import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { setStoredLanguage } from '../../i18n'

const languages = [
  { code: 'tm', flag: '🇹🇲' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'ru', flag: '🇷🇺' },
]

interface LanguageSwitcherProps { withLabel?: boolean }

export default function LanguageSwitcher({ withLabel = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const [modalVisible, setModalVisible] = useState(false)
  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = async (code: string) => {
    await setStoredLanguage(code)
    i18n.changeLanguage(code)
    setModalVisible(false)
  }

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Dil seç"
      >
        <Ionicons name="globe-outline" size={18} color="#94a3b8" />
        {withLabel && <Text style={styles.languageCode}>{currentLang.code.toUpperCase()}</Text>}
        {withLabel && <Ionicons name="chevron-down" size={14} color="#94a3b8" />}
      </TouchableOpacity>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            {languages.map((lang) => {
              const isActive = i18n.language === lang.code
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langItem, isActive && styles.langItemActive]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={18} color="#6366f1" />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  languageCode: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: 108,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 120,
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  langItemActive: {
    backgroundColor: '#eef2ff',
  },
  langFlag: {
    fontSize: 23,
  },
})
