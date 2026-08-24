import { renderToString } from 'vue/server-renderer'
import { createApp } from './app'
import { initLocale, locale } from './i18n'
import type { AboutContent, AboutFact, Project, ProjectPagination, SiteMethod, SiteMethodCategory } from './types'

interface ProjectRow {
  id: number
  slug: string
  tag: string
  name: string
  desc: string
  markdown: string
  published: number
  publishedAt: string
  createdAt: string
  updatedAt: string
  hasExecutable: number
  executableFileName: string | null
  executableSize: number | null
  executableUploadedAt: string | null
}

interface AboutContentRow {
  locale: AboutContent['locale']
  heroTitleLine1: string
  heroTitleLine2: string
  heroCopy: string
  introHeading: string
  introParagraph1: string
  introParagraph2: string
  factsJson: string
  updatedAt: string
}

interface SiteMethodRow extends Omit<SiteMethod, 'qrEnabled' | 'enabled'> {
  qrEnabled: number
  enabled: number
}

// 服务端入口：按请求 URL 渲染对应页面为 HTML 字符串
async function loadInitialProjects(url: string, env?: Env): Promise<{ projects: Project[]; pagination: ProjectPagination }> {
  const empty = { projects: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } }
  if (!env?.DB) return empty
  const pathname = new URL(url, 'https://example.invalid').pathname
  if (pathname === '/projects') {
    const [result, countRow] = await Promise.all([
      env.DB.prepare(
      `SELECT id, slug, tag, title AS name, description AS desc, '' AS markdown,
        is_published AS published, published_at AS publishedAt,
        created_at AS createdAt, updated_at AS updatedAt,
        0 AS hasExecutable, NULL AS executableFileName,
        NULL AS executableSize, NULL AS executableUploadedAt
       FROM projects WHERE is_published = 1
       ORDER BY published_at DESC, updated_at DESC, id DESC LIMIT 10`
      ).all<ProjectRow>(),
      env.DB.prepare('SELECT COUNT(*) AS count FROM projects WHERE is_published = 1').first<{ count: number }>()
    ])
    const total = Number(countRow?.count || 0)
    return {
      projects: result.results.map((project) => ({
        ...project,
        published: Boolean(project.published),
        hasExecutable: Boolean(project.hasExecutable)
      })),
      pagination: { page: 1, pageSize: 10, total, totalPages: Math.max(1, Math.ceil(total / 10)) }
    }
  }
  if (pathname.startsWith('/projects/')) {
    const slug = decodeURIComponent(pathname.slice('/projects/'.length))
    const row = await env.DB.prepare(
      `SELECT id, slug, tag, title AS name, description AS desc, markdown,
        is_published AS published, published_at AS publishedAt,
        created_at AS createdAt, updated_at AS updatedAt,
        CASE WHEN executable_object_key IS NOT NULL THEN 1 ELSE 0 END AS hasExecutable,
        executable_file_name AS executableFileName, executable_size AS executableSize,
        executable_uploaded_at AS executableUploadedAt
       FROM projects WHERE slug = ? AND is_published = 1`
    ).bind(slug).first<ProjectRow>()
    return {
      ...empty,
      projects: row ? [{
        ...row,
        published: Boolean(row.published),
        hasExecutable: Boolean(row.hasExecutable)
      }] : []
    }
  }
  return empty
}

function parseFacts(value: string): AboutFact[] {
  try {
    const facts = JSON.parse(value)
    return Array.isArray(facts) ? facts : []
  } catch {
    return []
  }
}

async function loadInitialAbout(url: string, env?: Env): Promise<AboutContent | null> {
  if (!env?.DB || new URL(url, 'https://example.invalid').pathname !== '/about') return null
  const row = await env.DB.prepare(
    `SELECT locale, hero_title_line_1 AS heroTitleLine1, hero_title_line_2 AS heroTitleLine2,
      hero_copy AS heroCopy, intro_heading AS introHeading,
      intro_paragraph_1 AS introParagraph1, intro_paragraph_2 AS introParagraph2,
      facts_json AS factsJson, updated_at AS updatedAt
     FROM about_content WHERE locale = ?`
  ).bind('zh-CN').first<AboutContentRow>()
  if (!row) return null
  const { factsJson, ...content } = row
  return { ...content, facts: parseFacts(factsJson) }
}

async function loadInitialSiteMethods(url: string, env?: Env): Promise<SiteMethod[]> {
  if (!env?.DB) return []
  const pathname = new URL(url, 'https://example.invalid').pathname
  const category: SiteMethodCategory | null = pathname === '/contact' ? 'contact' : pathname === '/support' ? 'donation' : null
  if (!category) return []
  const result = await env.DB.prepare(
    `SELECT id, category, method_key AS methodKey, name, description, value, icon,
      action_type AS actionType, qr_enabled AS qrEnabled, is_enabled AS enabled,
      sort_order AS sortOrder
     FROM site_methods WHERE category = ? AND is_enabled = 1 ORDER BY sort_order, id`
  ).bind(category).all<SiteMethodRow>()
  return result.results.map((method) => ({
    ...method,
    qrEnabled: Boolean(method.qrEnabled),
    enabled: Boolean(method.enabled)
  }))
}

export async function render(url: string, request?: Request, env?: Env) {
  // 服务端只渲染简体中文源内容；访客主动选择语言后再由客户端请求翻译。
  initLocale()

  const [{ projects, pagination: projectPagination }, siteMethods, aboutContent] = await Promise.all([
    loadInitialProjects(url, env),
    loadInitialSiteMethods(url, env),
    loadInitialAbout(url, env)
  ])
  const { app, router } = createApp({
    url,
    initialProjects: projects,
    initialProjectPagination: projectPagination,
    initialSiteMethods: siteMethods,
    initialAboutContent: aboutContent
  })
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  const status = Number(router.currentRoute.value.meta?.code) || 200
  return { html, locale: locale.value, projects, projectPagination, siteMethods, aboutContent, status }
}
