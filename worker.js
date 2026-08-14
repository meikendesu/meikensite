// Cloudflare Worker 入口：SSR 渲染页面 + 静态资源回退到 Assets
import { render } from './dist/server/entry-server.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // 带文件扩展名的请求（JS/CSS/图片/字体等）→ 交给静态资产
    if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
      return env.ASSETS.fetch(request)
    }

    // 页面请求 → 服务端渲染
    const { html, locale } = await render(pathname, request)

    // 读取客户端构建的 index.html 作为模板
    const templateRes = await env.ASSETS.fetch(
      new Request(new URL('/index.html', url.origin))
    )
    const template = await templateRes.text()

    const full = template
      .replace('<div id="app"></div>', `<div id="app">${html}</div>`)
      .replace('<html lang="zh-CN">', `<html lang="${locale}">`)

    return new Response(full, {
      headers: { 'content-type': 'text/html;charset=UTF-8' }
    })
  }
}
