import { ref, type InjectionKey, type Ref } from 'vue'
import type { AboutContent, Locale } from '../types'

export interface AboutStore {
  contents: Ref<Partial<Record<Locale, AboutContent>>>
  loadAbout(locale: Locale, force?: boolean): Promise<AboutContent | null>
  getAbout(locale: Locale): AboutContent | undefined
}

export const AboutStoreKey: InjectionKey<AboutStore> = Symbol('about-store')

export function createAboutStore(initialContent?: AboutContent | null): AboutStore {
  const contents = ref<Partial<Record<Locale, AboutContent>>>(
    initialContent ? { [initialContent.locale]: initialContent } : {}
  )

  async function loadAbout(locale: Locale, force = false) {
    if (contents.value[locale] && !force) return contents.value[locale] || null
    const response = await fetch(`/api/about?locale=${encodeURIComponent(locale)}`)
    if (!response.ok) throw new Error('关于页面内容加载失败。')
    const data = await response.json() as { content?: AboutContent }
    if (!data.content) return null
    contents.value = { ...contents.value, [locale]: data.content }
    return data.content
  }

  function getAbout(locale: Locale) {
    return contents.value[locale]
  }

  return { contents, loadAbout, getAbout }
}
