import { ref } from 'vue'

export const SiteMethodStoreKey = Symbol('site-method-store')

export function createSiteMethodStore(initialMethods = []) {
  const methods = ref(initialMethods)
  const loadedCategories = new Set(initialMethods.map((method) => method.category))

  async function loadMethods(category) {
    if (loadedCategories.has(category)) return methods.value.filter((method) => method.category === category)
    const response = await fetch(`/api/site-methods?category=${encodeURIComponent(category)}`)
    if (!response.ok) throw new Error('站点信息加载失败。')
    const data = await response.json()
    methods.value = [
      ...methods.value.filter((method) => method.category !== category),
      ...(data.methods || [])
    ]
    loadedCategories.add(category)
    return methods.value.filter((method) => method.category === category)
  }

  return { methods, loadMethods }
}
