import { createApp } from './app.js'
import './styles.css'

// 客户端入口：hydrate 服务端渲染的内容
const initialProjects = window.__MEIKEN_STATE__?.projects || []
const { app, router } = createApp({ initialProjects })

router.isReady().then(() => {
  app.mount('#app')
})
