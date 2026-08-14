import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import AboutView from './views/AboutView.vue'
import ProjectsView from './views/ProjectsView.vue'
import ContactView from './views/ContactView.vue'
import SupportView from './views/SupportView.vue'
import ErrorView from './views/ErrorView.vue'
import ProjectDetailView from './views/ProjectDetailView.vue'
import { t } from './i18n/index.js'

// 使用 HTML5 history 路由（URL 无 #）。
// 视图同步 import：体积小，且避免 file:// 直接打开 dist 时 chunk 动态加载失败。
const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { titleKey: 'docTitle.home' } },
  { path: '/about', name: 'about', component: AboutView, meta: { titleKey: 'docTitle.about', tabbar: true } },
  { path: '/projects', name: 'projects', component: ProjectsView, meta: { titleKey: 'docTitle.projects', tabbar: true } },
  { path: '/projects/:id', name: 'project-detail', component: ProjectDetailView, meta: { titleKey: 'docTitle.detail' } },
  { path: '/contact', name: 'contact', component: ContactView, meta: { titleKey: 'docTitle.contact', tabbar: true } },
  { path: '/support', name: 'support', component: SupportView, meta: { titleKey: 'docTitle.support', tabbar: true } },
  { path: '/500', name: 'server-error', component: ErrorView, meta: { code: 500, titleKey: 'docTitle.error500' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: ErrorView, meta: { code: 404, titleKey: 'docTitle.error404' } }
]

// 工厂函数：服务端传入 createMemoryHistory，客户端传入 createWebHistory
export function createAppRouter(history) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior(_to, _from, savedPosition) {
      return savedPosition || { top: 0 }
    }
  })
  router.afterEach((to) => {
    if (to.meta?.titleKey && typeof document !== 'undefined') {
      document.title = t(to.meta.titleKey)
    }
  })
  return router
}
