import { createRouter } from 'vue-router'
import HomeView from './views/HomeView.vue'
import { t } from './i18n/index.js'

// 使用 HTML5 history 路由（URL 无 #）。
// 首页保持同步加载，其余视图按路由拆包，避免首屏下载 markdown-it 等详情页依赖。
const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { titleKey: 'docTitle.home' } },
  { path: '/about', name: 'about', component: () => import('./views/AboutView.vue'), meta: { titleKey: 'docTitle.about', tabbar: true } },
  { path: '/projects', name: 'projects', component: () => import('./views/ProjectsView.vue'), meta: { titleKey: 'docTitle.projects', tabbar: true } },
  { path: '/projects/:id', name: 'project-detail', component: () => import('./views/ProjectDetailView.vue'), meta: { titleKey: 'docTitle.detail' } },
  { path: '/contact', name: 'contact', component: () => import('./views/ContactView.vue'), meta: { titleKey: 'docTitle.contact', tabbar: true } },
  { path: '/support', name: 'support', component: () => import('./views/SupportView.vue'), meta: { titleKey: 'docTitle.support', tabbar: true } },
  { path: '/admin', name: 'admin', component: () => import('./views/AdminView.vue'), meta: { title: 'Admin · MEIKEN' } },
  { path: '/500', name: 'server-error', component: () => import('./views/ErrorView.vue'), meta: { code: 500, titleKey: 'docTitle.error500' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/ErrorView.vue'), meta: { code: 404, titleKey: 'docTitle.error404' } }
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
    if (typeof document !== 'undefined') {
      if (to.meta?.titleKey) document.title = t(to.meta.titleKey)
      else if (to.meta?.title) document.title = to.meta.title
    }
  })
  return router
}
