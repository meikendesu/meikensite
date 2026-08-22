import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import worker, { verifyTurnstileToken } from '../worker'
import { prewarmTranslations } from './prewarm-translations'

const origin = 'https://local.test'
const template = await readFile(new URL('../dist/client/index.html', import.meta.url), 'utf8')

const projectRow = {
  id: 1,
  slug: 'wawawa',
  tag: '安卓应用',
  title: '摇晃发声程序',
  description: '检测摇晃动作并播放音效。',
  markdown: '## 主要功能\n\n检测摇晃动作并播放音效。',
  is_published: 1,
  published_at: '2026-08-01',
  created_at: '2026-08-01',
  updated_at: '2026-08-16'
}
const aboutRow = {
  locale: 'zh-CN',
  hero_title_line_1: '把复杂的事，',
  hero_title_line_2: '做得清楚一点。',
  hero_copy: '关于本人的一些信息。',
  intro_heading: '一点自我介绍',
  intro_paragraph_1: '我喜欢把想法变成作品。',
  intro_paragraph_2: '持续学习，持续记录。',
  facts_json: JSON.stringify([{ label: '身份', value: '学生' }]),
  updated_at: '2026-08-16'
}
const siteMethodRow = {
  id: 1,
  category: 'contact',
  method_key: 'email',
  name: '电子邮箱',
  description: '通过邮件联系',
  value: 'hello@example.com',
  icon: 'fa-solid fa-envelope',
  action_type: 'email',
  qr_enabled: 0,
  is_enabled: 1,
  sort_order: 10
}
const donationMethodRow = {
  id: 2,
  category: 'donation',
  method_key: 'afdian',
  name: '爱发电',
  description: '通过爱发电支持本站',
  value: 'https://example.com/support',
  icon: 'fa-solid fa-heart',
  action_type: 'external',
  qr_enabled: 0,
  is_enabled: 1,
  sort_order: 10
}

const translationCache = new Map<string, { sourceHash: string; translatedJson: string }>()

function statement(sql: string) {
  let params: unknown[] = []
  return {
    bind(...values: unknown[]) {
      params = values
      return this
    },
    async first() {
      if (sql.includes('FROM translation_cache')) {
        const cached = translationCache.get(`${params[0]}|${params[1]}|${params[2]}`)
        return cached?.sourceHash === params[3] ? { translatedJson: cached.translatedJson } : null
      }
      if (sql.includes('FROM about_content')) return params[0] === 'zh-CN' ? aboutRow : null
      if (sql.includes('COUNT(*) AS count FROM projects')) return { count: 1 }
      if (sql.includes('FROM projects WHERE slug = ?')) return params[0] === projectRow.slug ? projectRow : null
      return null
    },
    async all() {
      if (sql.includes('FROM projects WHERE is_published = 1')) return { results: [projectRow], success: true }
      if (sql.includes('FROM site_methods') && sql.includes('is_enabled = 1')) {
        return { results: [params[0] === 'donation' ? donationMethodRow : siteMethodRow], success: true }
      }
      return { results: [], success: true }
    },
    async run() {
      if (sql.includes('INSERT INTO translation_cache')) {
        translationCache.set(`${params[0]}|${params[1]}|${params[2]}`, {
          sourceHash: String(params[3]),
          translatedJson: String(params[4])
        })
      }
      return { success: true }
    }
  }
}

const mockDb = new Proxy({} as D1Database, {
  get(_target, property) {
    if (property === 'prepare') return (sql: string) => statement(sql)
    if (property === 'batch') return async () => []
    return undefined
  }
})

let aiCalls = 0
const aiModels: string[] = []
function translatedClone(value: unknown, locale: string): unknown {
  if (typeof value === 'string') return `[${locale}] ${value}`
  if (Array.isArray(value)) return value.map((item) => translatedClone(item, locale))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translatedClone(item, locale)]))
  }
  return value
}

const mockAi = {
  async run(model: string, input: { messages: Array<{ content: string }> }) {
    aiCalls += 1
    aiModels.push(model)
    const request = JSON.parse(input.messages[1].content.replace(/\n\/no_think$/, ''))
    return {
      choices: [{
        message: { content: JSON.stringify({ content: translatedClone(request.content, request.targetLocale) }) }
      }]
    }
  }
} as unknown as Ai

const env: Env = {
  TURNSTILE_HOSTNAMES: '983765.xyz',
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
  } as Fetcher,
  // 使用确定性的本地 AI 替身，验证按需翻译和缓存，不把内容发送到外部服务。
  AI: mockAi,
  // D1 替身包含一条项目、关于页、联系方式和内存翻译缓存。
  DB: mockDb
}

const originalFetch = globalThis.fetch
const turnstileRequests: URLSearchParams[] = []
globalThis.fetch = (async (_input, init) => {
  turnstileRequests.push(new URLSearchParams(String(init?.body || '')))
  return Response.json({ success: true, action: 'admin_login', hostname: '983765.xyz' })
}) as typeof fetch
const turnstileEnv = { ...env, TURNSTILE_SECRET: 'local-test-secret' } as Env
const turnstileRequest = new Request('https://983765.xyz/api/admin/login', {
  headers: { 'cf-connecting-ip': '203.0.113.10' }
})
assert.equal(await verifyTurnstileToken(turnstileRequest, turnstileEnv, 'valid-test-token', 'admin_login'), true, 'Turnstile 正常结果应通过')
assert.equal(turnstileRequests[0]?.get('secret'), 'local-test-secret', 'Siteverify 应提交 Worker secret')
assert.equal(turnstileRequests[0]?.get('remoteip'), '203.0.113.10', 'Siteverify 应提交访客 IP')
globalThis.fetch = (async () => Response.json({ success: true, action: 'other_action', hostname: '983765.xyz' })) as typeof fetch
assert.equal(await verifyTurnstileToken(turnstileRequest, turnstileEnv, 'wrong-action-token', 'admin_login'), false, 'Turnstile action 不匹配应拒绝')
globalThis.fetch = (async () => Response.json({ success: true, action: 'admin_login', hostname: 'attacker.example' })) as typeof fetch
assert.equal(await verifyTurnstileToken(turnstileRequest, turnstileEnv, 'wrong-host-token', 'admin_login'), false, 'Turnstile hostname 不匹配应拒绝')
assert.equal(await verifyTurnstileToken(turnstileRequest, turnstileEnv, '', 'admin_login'), false, '缺少 Turnstile token 应拒绝')
globalThis.fetch = originalFetch

async function request(pathname) {
  return worker.fetch(
    new Request(`${origin}${pathname}`, { headers: { 'accept-language': 'zh-CN' } }),
    env,
    {} as ExecutionContext
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

for (const pathname of ['/projects', '/projects/wawawa']) {
  const response = await request(pathname)
  const body = await response.text()
  assert.equal(response.status, 200, `${pathname} 状态码`)
  assert.doesNotMatch(body, /work-btn-unavailable|暂未提供下载|下载应用/, `${pathname} 不应包含下载入口`)
}

const aiTranslationCases = [
  ['/api/translations/ui?locale=en', 'messages', '[en] 首页'],
  ['/api/about?locale=ja', 'content', '[ja] 把复杂的事，'],
  ['/api/projects/wawawa?locale=en', 'project', '[en] ## 主要功能']
] as const

for (const [pathname, key, expected] of aiTranslationCases) {
  const response = await request(pathname)
  assert.equal(response.status, 200, `${pathname} 翻译状态码`)
  const data = await response.json() as Record<string, unknown>
  assert.match(JSON.stringify(data[key]), new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${pathname} 翻译内容`)
}
assert.equal(aiCalls, aiTranslationCases.length, '英语和日语内容首次请求各调用一次 AI')
assert.ok(aiModels.every((model) => model === '@cf/qwen/qwen3-30b-a3b-fp8'), '英语和日语翻译统一使用 Qwen3 30B')

const traditionalResponse = await request('/api/projects?page=1&locale=zh-TW')
assert.equal(traditionalResponse.status, 200, '繁体中文项目状态码')
const traditionalData = await traditionalResponse.json() as { projects: Array<{ name: string; desc: string }> }
assert.equal(traditionalData.projects[0]?.name, '搖晃發聲程式', '繁体中文标题使用台湾词汇转换')
assert.equal(traditionalData.projects[0]?.desc, '檢測搖晃動作並播放音效。', '繁体中文说明使用台湾词汇转换')

for (const [pathname, key, expected] of [
  ['/api/translations/ui?locale=zh-TW', 'messages', '首頁'],
  ['/api/about?locale=zh-TW', 'content', '把複雜的事，'],
  ['/api/projects/wawawa?locale=zh-TW', 'project', '檢測搖晃動作並播放音效。'],
  ['/api/site-methods?category=donation&locale=zh-TW', 'methods', '通過愛發電支援本站']
] as const) {
  const response = await request(pathname)
  assert.equal(response.status, 200, `${pathname} 繁体中文状态码`)
  const data = await response.json() as Record<string, unknown>
  assert.match(JSON.stringify(data[key]), new RegExp(expected), `${pathname} 使用台湾词汇转换`)
}
assert.equal(aiCalls, aiTranslationCases.length, '繁体中文转换不调用 AI')

const contactResponse = await request('/api/site-methods?category=contact&locale=en')
assert.equal(contactResponse.status, 200, '联系方式状态码')
const contactData = await contactResponse.json() as { methods: Array<{ name: string; description: string }> }
assert.deepEqual(
  contactData.methods.map(({ name, description }) => ({ name, description })),
  [{ name: siteMethodRow.name, description: siteMethodRow.description }],
  '联系方式的 strong 和 small 内容保持简体中文'
)
assert.equal(aiCalls, aiTranslationCases.length, '联系方式无需调用 AI 翻译')

const donationResponse = await request('/api/site-methods?category=donation&locale=en')
assert.equal(donationResponse.status, 200, '捐助方式状态码')
const donationData = await donationResponse.json() as { methods: Array<{ name: string; description: string }> }
assert.equal(donationData.methods[0]?.name, donationMethodRow.name, '捐助方式 h2 保持简体中文')
assert.equal(donationData.methods[0]?.description, `[en] ${donationMethodRow.description}`, '捐助方式说明按语言翻译')
assert.equal(aiCalls, aiTranslationCases.length + 1, '捐助方式首次请求只翻译说明')

await request('/api/translations/ui?locale=en')
assert.equal(aiCalls, aiTranslationCases.length + 1, '相同源内容和语言应命中 D1 翻译缓存')

for (const [pathname, expectedText] of [
  ['/admin', '正在检查登录状态'],
  ['/admin/about', '正在加载关于页面内容'],
  ['/admin/projects/new', '正在加载编辑器'],
  ['/admin/projects/1/edit', '正在加载编辑器'],
  ['/admin/methods/new', '正在加载表单'],
  ['/admin/methods/1/edit', '正在加载表单']
]) {
  const response = await request(pathname)
  assert.equal(response.status, 404, `${pathname} 未授权状态码`)
  assert.match(await response.text(), new RegExp(expectedText), `${pathname} SSR 内容`)
}

await assertErrorPage('/route-that-does-not-exist', 404, 404)
await assertErrorPage('/500', 500, 500)
await assertErrorPage('/projects/%E0%A4%A', 500, 500)

const asset = await request('/fonts/verify.woff2')
assert.equal(asset.status, 206, '静态资源回退状态码')
assert.equal(await asset.text(), 'static asset fallback', '静态资源回退响应')

const prewarmRequests: string[] = []
const prewarmResult = await prewarmTranslations(origin, (async (input) => {
  const url = new URL(input instanceof Request ? input.url : input)
  prewarmRequests.push(`${url.pathname}${url.search}`)
  if (url.pathname === '/api/projects' && url.searchParams.get('locale') === 'zh-CN') {
    return Response.json({
      projects: [{ slug: projectRow.slug }],
      pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
    })
  }
  return Response.json({ ok: true })
}) as typeof fetch)
assert.deepEqual(prewarmResult, { origin, requests: 18, projects: 1, pages: 1 }, '预热摘要')
assert.equal(prewarmRequests.length, 19, '预热应先读取简体中文项目索引，再覆盖全部目标语言内容')
assert.ok(prewarmRequests.includes('/api/projects/wawawa?locale=ja'), '预热应覆盖项目详情')
assert.ok(prewarmRequests.includes('/api/site-methods?category=donation&locale=en'), '预热应覆盖捐助方式')

console.log('✓ 已知路由返回 SSR 200')
console.log('✓ Turnstile 校验要求正确 action、hostname、token 与 Worker secret')
console.log('✓ 项目列表与项目详情均不再包含下载入口')
console.log('✓ 界面、关于、项目列表、项目文章和捐助说明按语言翻译并命中缓存')
console.log('✓ 繁体中文使用 OpenCC 台湾词汇转换且不调用 AI')
console.log('✓ 英语与日语使用 Qwen3 30B，兼容结构化 choices 输出')
console.log('✓ 联系方式名称与说明、捐助方式标题保持简体中文')
console.log('✓ 未授权 Admin 与独立编辑路由返回 HTTP 404')
console.log('✓ 未知路由渲染现有 404 页并返回 HTTP 404')
console.log('✓ /500 渲染现有 500 页并返回 HTTP 500')
console.log('✓ SSR 异常渲染现有 500 页并返回 HTTP 500')
console.log('✓ 静态资源请求仍由 ASSETS binding 回退处理')
console.log('✓ 部署后预热覆盖三种目标语言及全部公开内容')
