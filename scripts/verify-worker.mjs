import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import worker from '../worker.js'

const origin = 'https://local.test'
const template = await readFile(new URL('../dist/client/index.html', import.meta.url), 'utf8')

const env = {
  // 使用最小的本地 binding 替身调用 Worker，无需连接 Cloudflare 或真实 D1。
  ASSETS: {
    async fetch(input) {
      const url = new URL(input instanceof Request ? input.url : input)
      if (url.pathname === '/index.html') {
        return new Response(template, { headers: { 'content-type': 'text/html;charset=UTF-8' } })
      }
      if (url.pathname === '/fonts/verify.woff2') {
        return new Response('static asset fallback', { status: 206 })
      }
      return new Response('asset not found', { status: 404 })
    }
  },
  // 不需要真实查询；异常用例会在构造 D1 语句前触发 URL 解码错误。
  DB: {}
}

async function request(pathname) {
  return worker.fetch(
    new Request(`${origin}${pathname}`, { headers: { 'accept-language': 'zh-CN' } }),
    env,
    {}
  )
}

async function assertErrorPage(pathname, expectedStatus, expectedCode) {
  const response = await request(pathname)
  const body = await response.text()
  assert.equal(response.status, expectedStatus, `${pathname} 状态码`)
  assert.match(response.headers.get('content-type') || '', /^text\/html/i, `${pathname} Content-Type`)
  assert.match(body, new RegExp(`<p class="error-code">${expectedCode}</p>`), `${pathname} 错误页`)
}

const home = await request('/')
assert.equal(home.status, 200, '已知路由状态码')
assert.match(await home.text(), /<div id="app">.+<\/div>/s, '已知路由 SSR 内容')

for (const [pathname, expectedText] of [
  ['/admin/projects/new', '正在加载编辑器'],
  ['/admin/projects/1/edit', '正在加载编辑器'],
  ['/admin/methods/new', '正在加载表单'],
  ['/admin/methods/1/edit', '正在加载表单']
]) {
  const response = await request(pathname)
  assert.equal(response.status, 200, `${pathname} 状态码`)
  assert.match(await response.text(), new RegExp(expectedText), `${pathname} SSR 内容`)
}

await assertErrorPage('/route-that-does-not-exist', 404, 404)
await assertErrorPage('/500', 500, 500)
await assertErrorPage('/projects/%E0%A4%A', 500, 500)

const asset = await request('/fonts/verify.woff2')
assert.equal(asset.status, 206, '静态资源回退状态码')
assert.equal(await asset.text(), 'static asset fallback', '静态资源回退响应')

console.log('✓ 已知路由返回 SSR 200')
console.log('✓ Admin 独立新增与编辑路由返回 SSR 200')
console.log('✓ 未知路由渲染现有 404 页并返回 HTTP 404')
console.log('✓ /500 渲染现有 500 页并返回 HTTP 500')
console.log('✓ SSR 异常渲染现有 500 页并返回 HTTP 500')
console.log('✓ 静态资源请求仍由 ASSETS binding 回退处理')
