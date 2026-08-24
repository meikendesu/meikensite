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
  updated_at: '2026-08-16',
  executable_object_key: 'projects/1/wawawa.apk' as string | null,
  executable_file_name: 'wawawa.apk' as string | null,
  executable_content_type: 'application/vnd.android.package-archive' as string | null,
  executable_size: 17 as number | null,
  executable_uploaded_at: '2026-08-24 12:00:00' as string | null
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
const executableBody = new TextEncoder().encode('mock-apk-download')

function projectRowForSsr() {
  return {
    id: projectRow.id,
    slug: projectRow.slug,
    tag: projectRow.tag,
    name: projectRow.title,
    desc: projectRow.description,
    markdown: projectRow.markdown,
    published: projectRow.is_published,
    publishedAt: projectRow.published_at,
    createdAt: projectRow.created_at,
    updatedAt: projectRow.updated_at,
    hasExecutable: projectRow.executable_object_key ? 1 : 0,
    executableFileName: projectRow.executable_file_name,
    executableContentType: projectRow.executable_content_type,
    executableSize: projectRow.executable_size,
    executableUploadedAt: projectRow.executable_uploaded_at
  }
}

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
      if (sql.includes('FROM admin_sessions s')) {
        return { token_hash: String(params[0]), expires_at: '2099-01-01 00:00:00', must_change_password: 0 }
      }
      if (sql.includes('FROM about_content')) return params[0] === 'zh-CN' ? aboutRow : null
      if (sql.includes('COUNT(*) AS count FROM projects')) return { count: 1 }
      if (sql.includes('title AS name') && sql.includes('FROM projects WHERE slug = ?')) {
        return params[0] === projectRow.slug ? projectRowForSsr() : null
      }
      if (sql.includes('FROM projects WHERE id = ?') && sql.includes('executable_object_key')) {
        return Number(params[0]) === projectRow.id
          ? {
              id: projectRow.id,
              objectKey: projectRow.executable_object_key,
              fileName: projectRow.executable_file_name
            }
          : null
      }
      if (sql.includes('executable_object_key AS objectKey')) {
        return params[0] === projectRow.slug && projectRow.executable_object_key
          ? { objectKey: projectRow.executable_object_key, fileName: projectRow.executable_file_name }
          : null
      }
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
      if (sql.includes('UPDATE projects SET executable_object_key = ?')) {
        projectRow.executable_object_key = String(params[0])
        projectRow.executable_file_name = String(params[1])
        projectRow.executable_content_type = String(params[2])
        projectRow.executable_size = Number(params[3])
        projectRow.executable_uploaded_at = '2026-08-24 13:00:00'
      }
      if (sql.includes('UPDATE projects SET executable_object_key = NULL')) {
        projectRow.executable_object_key = null
        projectRow.executable_file_name = null
        projectRow.executable_content_type = null
        projectRow.executable_size = null
        projectRow.executable_uploaded_at = null
      }
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

interface MockR2Value {
  bytes: Uint8Array
  contentType: string
}

const mockR2Values = new Map<string, MockR2Value>([[
  projectRow.executable_object_key!,
  { bytes: executableBody, contentType: projectRow.executable_content_type! }
]])

function mockR2Object(key: string, value: MockR2Value) {
  return {
    key,
    size: value.bytes.byteLength,
    httpEtag: '"mock-etag"',
    uploaded: new Date('2026-08-24T13:00:00.000Z'),
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(value.bytes)
        controller.close()
      }
    }),
    writeHttpMetadata(headers: Headers) {
      headers.set('content-type', value.contentType)
    }
  }
}

const mockProjectFiles = {
  async get(key: string) {
    const value = mockR2Values.get(key)
    return value ? mockR2Object(key, value) : null
  },
  async put(key: string, body: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob, options?: R2PutOptions) {
    const bytes = new Uint8Array(await new Response(body as BodyInit).arrayBuffer())
    const contentType = options?.httpMetadata instanceof Headers
      ? options.httpMetadata.get('content-type') || 'application/octet-stream'
      : options?.httpMetadata?.contentType || 'application/octet-stream'
    const value = { bytes, contentType }
    mockR2Values.set(key, value)
    return mockR2Object(key, value)
  },
  async delete(key: string | string[]) {
    for (const item of Array.isArray(key) ? key : [key]) mockR2Values.delete(item)
  }
} as unknown as R2Bucket

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

const env = {
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
  DB: mockDb,
  // R2 替身包含当前项目的可执行文件。
  PROJECT_FILES: mockProjectFiles
} as Env & { PROJECT_FILES: R2Bucket }

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
globalThis.fetch = (async () => Response.json({ success: true, action: 'site_access', hostname: '983765.xyz' })) as typeof fetch
const siteAccessResponse = await worker.fetch(
  new Request(`${origin}/api/site/access`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': '203.0.113.10',
      origin
    },
    body: JSON.stringify({ turnstileToken: 'valid-site-token' })
  }),
  turnstileEnv,
  {} as ExecutionContext
)
assert.equal(siteAccessResponse.status, 200, '全站 Turnstile 验证应成功')
const siteGateSetCookie = siteAccessResponse.headers.get('set-cookie') || ''
assert.match(siteGateSetCookie, /^meiken_site_gate=/, '全站验证应签发 HttpOnly 门禁 Cookie')
assert.match(siteGateSetCookie, /HttpOnly/, '全站门禁 Cookie 不应暴露给客户端脚本')
const siteGateCookie = siteGateSetCookie.split(';')[0]
globalThis.fetch = originalFetch

async function request(pathname, includeSiteGate = true, cookie = siteGateCookie) {
  const headers = new Headers({ 'accept-language': 'zh-CN' })
  if (includeSiteGate) headers.set('cookie', cookie)
  return worker.fetch(
    new Request(`${origin}${pathname}`, { headers }),
    turnstileEnv,
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

const challenge = await request('/', false)
const challengeBody = await challenge.text()
assert.equal(challenge.status, 200, '未验证首访应返回验证页')
assert.match(challengeBody, /请先完成人机验证/, '验证页应显示明确提示')
assert.match(challengeBody, /action:'site_access'/, '验证页应使用独立 Turnstile action')
assert.doesNotMatch(challengeBody, /<div id="app">/, '验证前不应返回 Vue SSR 内容')
assert.match(challenge.headers.get('cache-control') || '', /no-store/, '验证页不应缓存')

const directIndex = await request('/index.html', false)
assert.equal(directIndex.status, 308, '直接访问 index.html 应重定向到受保护首页')
assert.equal(directIndex.headers.get('location'), `${origin}/`, 'index.html 重定向目标应为首页')

const tamperedGate = `${siteGateCookie.slice(0, -1)}${siteGateCookie.endsWith('A') ? 'B' : 'A'}`
const tamperedResponse = await request('/', true, tamperedGate)
assert.match(await tamperedResponse.text(), /请先完成人机验证/, '被篡改的门禁 Cookie 应被拒绝')

const home = await request('/')
assert.equal(home.status, 200, '已知路由状态码')
assert.match(await home.text(), /<div id="app">.+<\/div>/s, '已知路由 SSR 内容')

const projectsPage = await request('/projects')
assert.equal(projectsPage.status, 200, '/projects 状态码')
assert.doesNotMatch(await projectsPage.text(), /\/api\/projects\/wawawa\/download/, '项目列表不直接显示下载入口')

const projectDetailPage = await request('/projects/wawawa')
const projectDetailBody = await projectDetailPage.text()
assert.equal(projectDetailPage.status, 200, '/projects/wawawa 状态码')
assert.match(projectDetailBody, /\/api\/projects\/wawawa\/download/, '具有可执行文件的项目详情应显示下载入口')
assert.match(projectDetailBody, /下载项目文件/, '项目详情下载按钮应有清晰文案')

const projectDetailApi = await request('/api/projects/wawawa?locale=zh-CN')
assert.equal(projectDetailApi.status, 200, '项目详情 API 状态码')
const projectDetailData = await projectDetailApi.json() as {
  project: { hasExecutable: boolean; executableFileName: string; executableSize: number; executableObjectKey?: string }
}
assert.equal(projectDetailData.project.hasExecutable, true, '项目 API 应标记已上传可执行文件')
assert.equal(projectDetailData.project.executableFileName, 'wawawa.apk', '项目 API 应返回下载文件名')
assert.equal(projectDetailData.project.executableSize, executableBody.byteLength, '项目 API 应返回文件大小')
assert.equal(projectDetailData.project.executableObjectKey, undefined, '项目 API 不应暴露 R2 对象键')

const projectDownload = await request('/api/projects/wawawa/download')
assert.equal(projectDownload.status, 200, '项目文件下载状态码')
assert.equal(await projectDownload.text(), 'mock-apk-download', '下载响应应流式返回 R2 对象内容')
assert.match(projectDownload.headers.get('content-disposition') || '', /attachment/, '下载响应应强制保存为附件')
assert.match(projectDownload.headers.get('content-disposition') || '', /wawawa\.apk/, '下载响应应保留管理员上传的文件名')
assert.equal(projectDownload.headers.get('x-content-type-options'), 'nosniff', '下载响应应禁止 MIME 嗅探')

async function adminRequest(pathname: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('origin', origin)
  headers.set('cookie', 'meiken_admin_session=mock-admin-token')
  return worker.fetch(
    new Request(`${origin}${pathname}`, { ...init, headers }),
    turnstileEnv,
    {} as ExecutionContext
  )
}

const replacementBody = new TextEncoder().encode('replacement-apk')
const uploadResponse = await adminRequest('/api/admin/projects/1/executable', {
  method: 'PUT',
  headers: {
    'content-type': 'application/vnd.android.package-archive',
    'x-project-file-name': encodeURIComponent('新版 Wawawa.apk')
  },
  body: replacementBody
})
assert.equal(uploadResponse.status, 200, '管理员应能上传并替换项目可执行文件')
const uploadData = await uploadResponse.json() as { fileName: string; size: number }
assert.equal(uploadData.fileName, '新版 Wawawa.apk', '上传响应应保留原始文件名')
assert.equal(uploadData.size, replacementBody.byteLength, '上传响应应返回 R2 实际对象大小')
assert.equal(mockR2Values.has('projects/1/wawawa.apk'), false, '替换成功后应删除旧 R2 对象')
assert.ok(projectRow.executable_object_key && mockR2Values.has(projectRow.executable_object_key), 'D1 应关联新 R2 对象键')

const replacementDownload = await request('/api/projects/wawawa/download')
assert.equal(await replacementDownload.text(), 'replacement-apk', '公开下载应立即返回替换后的 R2 对象')
assert.match(replacementDownload.headers.get('content-disposition') || '', /%E6%96%B0%E7%89%88%20Wawawa\.apk/, '中文文件名应使用 RFC 5987 编码')

const removeResponse = await adminRequest('/api/admin/projects/1/executable', { method: 'DELETE' })
assert.equal(removeResponse.status, 200, '管理员应能移除项目可执行文件')
assert.equal(projectRow.executable_object_key, null, '移除后 D1 不应继续标记项目具有可执行文件')
assert.equal(mockR2Values.size, 0, '移除后 R2 不应残留当前项目对象')

const removedDownload = await request('/api/projects/wawawa/download')
assert.equal(removedDownload.status, 404, '没有可执行文件的项目下载接口应返回 404')
const projectWithoutDownload = await request('/projects/wawawa')
assert.doesNotMatch(await projectWithoutDownload.text(), /\/api\/projects\/wawawa\/download/, '移除文件后项目详情不应显示下载按钮')

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
  const response = await request(pathname, false)
  assert.equal(response.status, 404, `${pathname} 未授权状态码`)
  assert.match(await response.text(), new RegExp(expectedText), `${pathname} SSR 内容`)
}

await assertErrorPage('/route-that-does-not-exist', 404, 404)
await assertErrorPage('/500', 500, 500)
await assertErrorPage('/projects/%E0%A4%A', 500, 500)

const asset = await request('/fonts/verify.woff2', false)
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
console.log('✓ 公开页面在 Turnstile 验证前不返回 SSR 内容，验证后使用签名 HttpOnly Cookie 放行')
console.log('✓ 项目详情按 D1 元数据显示下载按钮，并通过私有 R2 binding 流式下载文件')
console.log('✓ 管理员可上传、替换和移除项目文件，D1 与 R2 状态同步更新')
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
