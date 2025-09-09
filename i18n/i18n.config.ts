import en from './locales/en.js'
import cn from './locales/cn.js'

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  messages: {
    en,
    cn
  }
}))
