import { createApp } from './app'
import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
import '@fortawesome/fontawesome-free/css/solid.min.css'
import '@fortawesome/fontawesome-free/css/regular.min.css'
import '@fortawesome/fontawesome-free/css/brands.min.css'
import './styles.css'
import { restoreSavedLocale } from './i18n'

// 客户端入口：hydrate 服务端渲染的内容
const initialProjects = window.__MEIKEN_STATE__?.projects || []
const initialProjectPagination = window.__MEIKEN_STATE__?.projectPagination
const initialSiteMethods = window.__MEIKEN_STATE__?.siteMethods || []
const initialAboutContent = window.__MEIKEN_STATE__?.aboutContent || null
const { app, router } = createApp({ initialProjects, initialProjectPagination, initialSiteMethods, initialAboutContent })

router.isReady().then(() => {
  app.mount('#app')
  void restoreSavedLocale().catch((error) => console.error('恢复语言设置失败：', error))
})
