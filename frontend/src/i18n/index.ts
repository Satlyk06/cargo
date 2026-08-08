import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import tm from './locales/tm/translation.json'
import en from './locales/en/translation.json'
import ru from './locales/ru/translation.json'

// Mevcut dili kontrol et
const savedLanguage = localStorage.getItem('language') || 'tm'
console.log('🌐 Başlangıç dili:', savedLanguage)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tm: { translation: tm },
      en: { translation: en },
      ru: { translation: ru },
    },
    lng: savedLanguage, // ← Başlangıç dili
    fallbackLng: 'tm',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

// Dil değiştiğinde console'a yaz
i18n.on('languageChanged', (lng) => {
  console.log('🌐 Dil değişti:', lng)
})

export default i18n