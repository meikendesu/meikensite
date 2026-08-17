import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const TARGET_LOCALES = ['zh-TW', 'en', 'ja'] as const
const DEFAULT_SITE_URL = 'https://983765.xyz'

type FetchLike = typeof fetch
type ProjectListResponse = {
  projects?: Array<{ slug?: string }>
  pagination?: { totalPages?: number }
}

function normalizeOrigin(value: string) {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('预热地址必须使用 http 或 https。')
  return url.origin
}

async function requestJson(fetchImpl: FetchLike, url: URL, attempts = 3): Promise<Record<string, unknown>> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { accept: 'application/json', 'user-agent': 'meikensite-translation-prewarm/1.0' },
        signal: AbortSignal.timeout(120_000)
      })
      const data = await response.json().catch(() => ({})) as Record<string, unknown>
      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : `HTTP ${response.status}`
        throw new Error(`${url.pathname}${url.search}: ${message}`)
      }
      return data
    } catch (error) {
      lastError = error
      if (attempt < attempts) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1000))
    }
  }
  throw lastError
}

async function runWithConcurrency<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>) {
  let nextIndex = 0
  async function worker() {
    while (nextIndex < items.length) {
      const item = items[nextIndex]
      nextIndex += 1
      await task(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
}

export async function prewarmTranslations(
  siteUrl = process.env.MEIKEN_SITE_URL || DEFAULT_SITE_URL,
  fetchImpl: FetchLike = fetch
) {
  const origin = normalizeOrigin(siteUrl)
  const projectSlugs = new Set<string>()
  const sourcePage = async (page: number) => {
    const url = new URL('/api/projects', origin)
    url.searchParams.set('page', String(page))
    url.searchParams.set('locale', 'zh-CN')
    const data = await requestJson(fetchImpl, url) as ProjectListResponse
    for (const project of data.projects || []) {
      if (project.slug) projectSlugs.add(project.slug)
    }
    return Math.max(1, Number(data.pagination?.totalPages || 1))
  }

  const totalPages = await sourcePage(1)
  for (let page = 2; page <= totalPages; page += 1) await sourcePage(page)

  const requests: URL[] = []
  for (const locale of TARGET_LOCALES) {
    for (const pathname of ['/api/translations/ui', '/api/about']) {
      const url = new URL(pathname, origin)
      url.searchParams.set('locale', locale)
      requests.push(url)
    }
    for (const category of ['contact', 'donation']) {
      const url = new URL('/api/site-methods', origin)
      url.searchParams.set('category', category)
      url.searchParams.set('locale', locale)
      requests.push(url)
    }
    for (let page = 1; page <= totalPages; page += 1) {
      const url = new URL('/api/projects', origin)
      url.searchParams.set('page', String(page))
      url.searchParams.set('locale', locale)
      requests.push(url)
    }
    for (const slug of projectSlugs) {
      const url = new URL(`/api/projects/${encodeURIComponent(slug)}`, origin)
      url.searchParams.set('locale', locale)
      requests.push(url)
    }
  }

  let completed = 0
  await runWithConcurrency(requests, 2, async (url) => {
    await requestJson(fetchImpl, url)
    completed += 1
    console.log(`[翻译预热 ${completed}/${requests.length}] ${url.pathname}${url.search}`)
  })

  return { origin, requests: requests.length, projects: projectSlugs.size, pages: totalPages }
}

const entryUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (entryUrl === import.meta.url) {
  prewarmTranslations().then((result) => {
    console.log(`✓ 翻译预热完成：${result.requests} 个目标，${result.projects} 个项目，${result.pages} 页项目列表。`)
  }).catch((error) => {
    console.error(`✗ 翻译预热失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
