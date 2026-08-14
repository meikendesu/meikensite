import { renderToString } from 'vue/server-renderer'
import { createApp } from './app.js'
import { initLocale, locale } from './i18n/index.js'

// 服务端入口：按请求 URL 渲染对应页面为 HTML 字符串
export async function render(url, request) {
  // 服务端根据 Accept-Language 确定初始语言
  initLocale(request?.headers?.get?.('accept-language'))

  const { app, router } = createApp({ url })
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  return { html, locale: locale.value }
}
