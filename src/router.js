import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import AboutView from './views/AboutView.vue'
import ProjectsView from './views/ProjectsView.vue'
import ContactView from './views/ContactView.vue'
import SupportView from './views/SupportView.vue'
import ErrorView from './views/ErrorView.vue'
import ProjectDetailView from './views/ProjectDetailView.vue'
import { t } from './i18n/index.js'

// 使用 HTML5 history 路由（URL 无 #）。
// 注意：生产部署需服务器配置 SPA fallback（如 Nginx try_files $uri /index.html），
// 否则直接访问/刷新子路由会 404。开发环境（vite dev / vite preview）已内置 fallback。
// 视图改为同步 import：本站体积小，懒加载收益有限，反而会在 file:// 直接打开 dist 时
// 导致 chunk 动态加载失败（首页正常、点菜单白屏）。同步打包更健壮。
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

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

router.afterEach((to) => {
  if (to.meta?.titleKey) document.title = t(to.meta.titleKey)
})

export default router
