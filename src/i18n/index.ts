import { ref, shallowReactive } from 'vue'
import { UI_MESSAGES_ZH_CN, type TranslationObject, type TranslationValue } from '../content/uiMessages'
import { versionedTranslationUrl } from '../content/translationConfig'
import type { Locale } from '../types'

const STORAGE_KEY = 'meiken-locale'
const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'zh-TW', 'en', 'ja']
const translatedMessages = shallowReactive<Partial<Record<Locale, TranslationObject>>>({
  'zh-CN': UI_MESSAGES_ZH_CN
})

// SSR 始终输出简体中文源内容，避免首屏渲染期间调用 AI 或产生 hydration 差异。
export const locale = ref<Locale>('zh-CN')

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function initLocale() {
  locale.value = 'zh-CN'
}

function readMessage(tree: TranslationObject | undefined, key: string): string | undefined {
  let value: TranslationValue | undefined = tree
  for (const segment of key.split('.')) {
    value = value && typeof value === 'object' && !Array.isArray(value) ? value[segment] : undefined
  }
  return typeof value === 'string' ? value : undefined
}

export function t(key: string): string {
  return readMessage(translatedMessages[locale.value], key) || readMessage(UI_MESSAGES_ZH_CN, key) || key
}

function applyDocumentLocale(value: Locale) {
  if (typeof document !== 'undefined') document.documentElement.lang = value
}

export async function setLocale(value: Locale) {
  if (value !== 'zh-CN' && !translatedMessages[value]) {
    const response = await fetch(versionedTranslationUrl(`/api/translations/ui?locale=${encodeURIComponent(value)}`))
    const data = await response.json().catch(() => ({})) as { messages?: TranslationObject; error?: string }
    if (!response.ok || !data.messages) throw new Error(data.error || '自动翻译失败，请稍后重试。')
    translatedMessages[value] = data.messages
  }

  locale.value = value
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
  applyDocumentLocale(value)
}

export async function restoreSavedLocale() {
  if (typeof localStorage === 'undefined') return
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && isLocale(saved) && saved !== 'zh-CN') await setLocale(saved)
}
