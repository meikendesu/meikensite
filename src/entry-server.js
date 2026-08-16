import { renderToString } from 'vue/server-renderer'
import { createApp } from './app.js'
import { initLocale, locale } from './i18n/index.js'

// 服务端入口：按请求 URL 渲染对应页面为 HTML 字符串
async function loadInitialProjects(url, env) {
  if (!env?.DB) return []
  const pathname = new URL(url, 'https://example.invalid').pathname
  if (pathname === '/projects') {
    const result = await env.DB.prepare(
      `SELECT id, slug, tag, title AS name, description AS desc, markdown,
        is_published AS published, created_at AS createdAt, updated_at AS updatedAt
       FROM projects WHERE is_published = 1 ORDER BY updated_at DESC, id DESC`
    ).all()
    return result.results
  }
  if (pathname.startsWith('/projects/')) {
    const slug = decodeURIComponent(pathname.slice('/projects/'.length))
    const row = await env.DB.prepare(
      `SELECT id, slug, tag, title AS name, description AS desc, markdown,
        is_published AS published, created_at AS createdAt, updated_at AS updatedAt
       FROM projects WHERE slug = ? AND is_published = 1`
    ).bind(slug).first()
    return row ? [row] : []
  }
  return []
}

async function loadInitialSiteMethods(url, env) {
  if (!env?.DB) return []
  const pathname = new URL(url, 'https://example.invalid').pathname
  const category = pathname === '/contact' ? 'contact' : pathname === '/support' ? 'donation' : null
  if (!category) return []
  const result = await env.DB.prepare(
    `SELECT id, category, method_key AS methodKey, name, description, value, icon,
      action_type AS actionType, qr_enabled AS qrEnabled, is_enabled AS enabled,
      sort_order AS sortOrder
     FROM site_methods WHERE category = ? AND is_enabled = 1 ORDER BY sort_order, id`
  ).bind(category).all()
  return result.results.map((method) => ({
    ...method,
    qrEnabled: Boolean(method.qrEnabled),
    enabled: Boolean(method.enabled)
  }))
}

export async function render(url, request, env) {
  // 服务端根据 Accept-Language 确定初始语言
  initLocale(request?.headers?.get?.('accept-language'))

  const projects = await loadInitialProjects(url, env)
  const siteMethods = await loadInitialSiteMethods(url, env)
  const { app, router } = createApp({ url, initialProjects: projects, initialSiteMethods: siteMethods })
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  const status = Number(router.currentRoute.value.meta?.code) || 200
  return { html, locale: locale.value, projects, siteMethods, status }
}
