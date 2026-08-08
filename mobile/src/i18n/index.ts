import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'

import tm from './locales/tm.json'
import en from './locales/en.json'
import ru from './locales/ru.json'

const resources = {
  tm: { translation: tm },
  en: { translation: en },
  ru: { translation: ru },
}

const LANGUAGE_KEY = '@app_language'

export const getStoredLanguage = async (): Promise<string> => {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY)
    return lang || 'tm'
  } catch {
    return 'tm'
  }
}

export const setStoredLanguage = async (lang: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang)
  } catch (error) {
    console.error('Dil kaydedilirken hata:', error)
  }
}

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'tm',
  interpolation: {
    escapeValue: false,
  },
})

// Başlangıç dilini AsyncStorage'den yükle
getStoredLanguage().then((lang) => {
  i18n.changeLanguage(lang)
})

export default i18n