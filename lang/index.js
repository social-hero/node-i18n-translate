import { createI18n } from 'vue-i18n'
import en from './en'
import zh from './zh'
// import settings from '@/settings'
const messages = {
  en: {
    ...en
  },
  zh: {
    ...zh
  },
 

}

const localeData = {
  globalInjection: true, // 如果设置true, $t() 函数将注册到全局
  legacy: false, // 如果想在composition api中使用需要设置为false
  // 默认语言
  locale: localStorage.getItem('b2cLang') || 'en',
  messages // set locale messages
}

export const i18n = createI18n(localeData)
