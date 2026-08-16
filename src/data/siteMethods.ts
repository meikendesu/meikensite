import { ref, type InjectionKey, type Ref } from 'vue'
import type { SiteMethod, SiteMethodCategory } from '../types'

export interface SiteMethodStore {
  methods: Ref<SiteMethod[]>
  loadMethods(category: SiteMethodCategory): Promise<SiteMethod[]>
}

export const SiteMethodStoreKey: InjectionKey<SiteMethodStore> = Symbol('site-method-store')

export function createSiteMethodStore(initialMethods: SiteMethod[] = []): SiteMethodStore {
  const methods = ref<SiteMethod[]>(initialMethods)
  const loadedCategories = new Set<SiteMethodCategory>(initialMethods.map((method) => method.category))

  async function loadMethods(category: SiteMethodCategory) {
    if (loadedCategories.has(category)) return methods.value.filter((method) => method.category === category)
    const response = await fetch(`/api/site-methods?category=${encodeURIComponent(category)}`)
    if (!response.ok) throw new Error('站点信息加载失败。')
    const data = await response.json() as { methods?: SiteMethod[] }
    methods.value = [
      ...methods.value.filter((method) => method.category !== category),
      ...(data.methods || [])
    ]
    loadedCategories.add(category)
    return methods.value.filter((method) => method.category === category)
  }

  return { methods, loadMethods }
}
