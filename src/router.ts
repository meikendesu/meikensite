import { createRouter, type RouterHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import { t } from './i18n'
import { beginPageLoading } from './data/pageLoading'

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
  { path: '/admin/about', name: 'admin-about', component: () => import('./views/AdminAboutEditorView.vue'), meta: { title: '关于页面 · Admin · MEIKEN' } },
  { path: '/admin/projects/new', name: 'admin-project-new', component: () => import('./views/AdminProjectEditorView.vue'), meta: { title: '新建项目 · Admin · MEIKEN' } },
  { path: '/admin/projects/:id/edit', name: 'admin-project-edit', component: () => import('./views/AdminProjectEditorView.vue'), meta: { title: '编辑项目 · Admin · MEIKEN' } },
  { path: '/admin/methods/new', name: 'admin-method-new', component: () => import('./views/AdminMethodEditorView.vue'), meta: { title: '添加方式 · Admin · MEIKEN' } },
  { path: '/admin/methods/:id/edit', name: 'admin-method-edit', component: () => import('./views/AdminMethodEditorView.vue'), meta: { title: '编辑方式 · Admin · MEIKEN' } },
  { path: '/500', name: 'server-error', component: () => import('./views/ErrorView.vue'), meta: { code: 500, titleKey: 'docTitle.error500' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/ErrorView.vue'), meta: { code: 404, titleKey: 'docTitle.error404' } }
]

// 工厂函数：服务端传入 createMemoryHistory，客户端传入 createWebHistory
export function createAppRouter(history: RouterHistory) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior(_to, _from, savedPosition) {
      return savedPosition || { top: 0 }
    }
  })
  let finishRouteLoading: (() => void) | null = null
  router.beforeEach(() => {
    if (typeof window === 'undefined') return true
    finishRouteLoading?.()
    finishRouteLoading = beginPageLoading()
    return true
  })
  router.afterEach((to) => {
    if (typeof document !== 'undefined') {
      if (typeof to.meta?.titleKey === 'string') document.title = t(to.meta.titleKey)
      else if (typeof to.meta?.title === 'string') document.title = to.meta.title
      window.setTimeout(() => {
        finishRouteLoading?.()
        finishRouteLoading = null
      }, 160)
    }
  })
  return router
}
