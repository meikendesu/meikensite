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
  createdAt?: string
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
