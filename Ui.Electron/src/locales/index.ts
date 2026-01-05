import { createI18n } from 'vue-i18n'
import en from './en.json'
import zhCN from './zh-CN.json'

const getLocale = () => {
  const language = navigator.language
  if (language === 'zh-CN' || language === 'zh') {
    return 'zh-CN'
  }
  return 'en'
}

const i18n = createI18n({
  legacy: false, // Vue 3 Composition API
  locale: getLocale(), // Default locale based on browser
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN
  }
})

export default i18n
