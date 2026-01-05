import { createI18n } from 'vue-i18n'
import { watch } from 'vue'
import en from './en.json'
import zhCN from './zh-CN.json'
import zhTW from './zh-TW.json'
import ja from './ja.json'

const LOCALE_STORAGE_KEY = '1remote-locale'

const getLocale = () => {
  // First check localStorage
  const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (savedLocale) {
    return savedLocale
  }

  // Fall back to browser language
  const language = navigator.language
  if (language === 'zh-CN' || language === 'zh') {
    return 'zh-CN'
  }
  if (language === 'zh-TW' || language === 'zh-Hant') {
    return 'zh-TW'
  }
  if (language === 'ja' || language === 'ja-JP') {
    return 'ja'
  }
  return 'en'
}

const i18n = createI18n({
  legacy: false, // Vue 3 Composition API
  locale: getLocale(), // Default locale from localStorage or browser
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    ja,
  }
})

// Watch for locale changes and persist to localStorage
watch(() => i18n.global.locale.value, (newLocale) => {
  localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
})

export default i18n
