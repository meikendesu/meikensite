import { ref, type InjectionKey, type Ref } from 'vue'
import type { AboutContent, Locale } from '../types'

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  locale: 'zh-CN',
  heroTitleLine1: '把复杂的事，',
  heroTitleLine2: '做得清楚一点。',
  heroCopy: '关于本人的一些信息。',
  introHeading: '一点自我介绍',
  introParagraph1: '我喜欢观察人与日常，也喜欢把零散的想法变成可以使用、可以阅读的东西。目前关注品牌、数字产品与有温度的叙事。',
  introParagraph2: '好设计不必大声解释自己；它应该恰好让人觉得，一切都很自然。',
  facts: [
    { label: '在校大学生', value: '黑龙江某职业学院 2026 级新生' },
    { label: '业余开发者', value: '略懂一些编程、AI 和 Linux 等...' },
    { label: '菜鸡音游痴', value: '舞萌 / 中二 / PJSK / DJMAX / ...' }
  ]
}

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
    if (!response.ok) {
      if (locale !== 'zh-CN') return loadAbout('zh-CN', force)
      throw new Error('关于页面内容加载失败。')
    }
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
