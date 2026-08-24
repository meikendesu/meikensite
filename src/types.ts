export type Locale = 'zh-CN' | 'zh-TW' | 'en' | 'ja'
export type SiteMethodCategory = 'contact' | 'donation'
export type SiteMethodAction = 'email' | 'link' | 'copy' | 'crypto'

export interface Project {
  id: number
  slug: string
  tag: string
  name: string
  desc: string
  markdown: string
  published: boolean
  publishedAt: string
  createdAt?: string
  updatedAt: string
  hasExecutable: boolean
  executableFileName: string | null
  executableSize: number | null
  executableUploadedAt: string | null
}

export interface ProjectPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AboutFact {
  label: string
  value: string
}

export interface AboutContent {
  locale: Locale
  heroTitleLine1: string
  heroTitleLine2: string
  heroCopy: string
  introHeading: string
  introParagraph1: string
  introParagraph2: string
  facts: AboutFact[]
  updatedAt?: string
}

export interface SiteMethod {
  id: number | null
  category: SiteMethodCategory
  methodKey: string
  name: string
  description: string
  value: string
  icon: string
  actionType: SiteMethodAction
  qrEnabled: boolean
  enabled: boolean
  sortOrder?: number | null
}

export interface AdminSession {
  authenticated: boolean
  mustChangePassword: boolean
}
