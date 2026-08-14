import { createSSRApp } from 'vue'
import { createMemoryHistory, createWebHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router.js'
import PageHeader from './components/PageHeader.vue'

// 共享 App 工厂：服务端（SSR）与客户端（hydration）共用
// 传入 url 表示服务端渲染（memory history），否则为客户端（web history）
export function createApp({ url } = {}) {
  const app = createSSRApp(App)
  app.component('PageHeader', PageHeader)
  const router = createAppRouter(url ? createMemoryHistory() : createWebHistory())
  app.use(router)
  return { app, router }
}
