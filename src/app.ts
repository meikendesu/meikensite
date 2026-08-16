import { createSSRApp } from 'vue'
import { createMemoryHistory, createWebHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router'
import PageHeader from './components/PageHeader.vue'
import { createProjectStore, ProjectStoreKey } from './data/projects'
import { createSiteMethodStore, SiteMethodStoreKey } from './data/siteMethods'
import { createAboutStore, AboutStoreKey } from './data/about'
import type { AboutContent, Project, ProjectPagination, SiteMethod } from './types'

interface CreateAppOptions {
  url?: string
  initialProjects?: Project[]
  initialProjectPagination?: ProjectPagination
  initialSiteMethods?: SiteMethod[]
  initialAboutContent?: AboutContent | null
}

// 共享 App 工厂：服务端（SSR）与客户端（hydration）共用
// 传入 url 表示服务端渲染（memory history），否则为客户端（web history）
export function createApp({
  url,
  initialProjects = [],
  initialProjectPagination,
  initialSiteMethods = [],
  initialAboutContent = null
}: CreateAppOptions = {}) {
  const app = createSSRApp(App)
  app.component('PageHeader', PageHeader)
  app.provide(ProjectStoreKey, createProjectStore(initialProjects, initialProjectPagination))
  app.provide(SiteMethodStoreKey, createSiteMethodStore(initialSiteMethods))
  app.provide(AboutStoreKey, createAboutStore(initialAboutContent))
  const router = createAppRouter(url ? createMemoryHistory() : createWebHistory())
  app.use(router)
  return { app, router }
}
