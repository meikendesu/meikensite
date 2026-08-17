import { ref, type InjectionKey, type Ref } from 'vue'
import { locale, t } from '../i18n'
import type { SiteMethod, SiteMethodCategory } from '../types'

export interface SiteMethodStore {
  methods: Ref<SiteMethod[]>
  loadMethods(category: SiteMethodCategory, force?: boolean): Promise<SiteMethod[]>
}

export const SiteMethodStoreKey: InjectionKey<SiteMethodStore> = Symbol('site-method-store')

export function createSiteMethodStore(initialMethods: SiteMethod[] = []): SiteMethodStore {
  const methods = ref<SiteMethod[]>(initialMethods)
  const loadedKeys = new Set(initialMethods.map((method) => `zh-CN:${method.category}`))

  async function loadMethods(category: SiteMethodCategory, force = false) {
    const requestedLocale = locale.value
    const cacheKey = `${requestedLocale}:${category}`
    if (loadedKeys.has(cacheKey) && !force) return methods.value.filter((method) => method.category === category)
    const response = await fetch(`/api/site-methods?category=${encodeURIComponent(category)}&locale=${encodeURIComponent(requestedLocale)}`)
    if (!response.ok) throw new Error(category === 'contact' ? t('contact.loadFailed') : t('support.loadFailed'))
    const data = await response.json() as { methods?: SiteMethod[] }
    methods.value = [
      ...methods.value.filter((method) => method.category !== category),
      ...(data.methods || [])
    ]
    loadedKeys.add(cacheKey)
    return methods.value.filter((method) => method.category === category)
  }

  return { methods, loadMethods }
}
