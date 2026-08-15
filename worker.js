// Cloudflare Worker：SSR、D1 项目内容与单管理员认证 API。
import { render } from './dist/server/entry-server.js'

const INITIAL_PASSWORD = '123456'
const PASSWORD_ITERATIONS = 120000
const SESSION_COOKIE = 'meiken_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7
const MAX_JSON_BYTES = 512 * 1024
const encoder = new TextEncoder()

function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store', ...headers }
  })
}

function toBase64(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function randomBase64(length = 32) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return toBase64(bytes)
}

async function sha256(value) {
  return toBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))))
}

async function hashPassword(password, salt, iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations },
    key,
    256
  )
  return toBase64(new Uint8Array(bits))
}

function constantTimeEqual(left, right) {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  let mismatch = a.length ^ b.length
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i += 1) mismatch |= (a[i] || 0) ^ (b[i] || 0)
  return mismatch === 0
}

async function ensureAdmin(db) {
  const existing = await db.prepare('SELECT id FROM admin_users WHERE id = 1').first()
  if (existing) return

  const salt = randomBase64(16)
  const passwordHash = await hashPassword(INITIAL_PASSWORD, salt)
  await db.prepare(
    `INSERT OR IGNORE INTO admin_users
      (id, password_hash, password_salt, password_iterations, must_change_password)
     VALUES (1, ?, ?, ?, 1)`
  ).bind(passwordHash, salt, PASSWORD_ITERATIONS).run()
}

function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || ''
  for (const item of cookie.split(';')) {
    const [key, ...value] = item.trim().split('=')
    if (key === name) return value.join('=')
  }
  return null
}

async function getSession(request, db) {
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return null
  const tokenHash = await sha256(token)
  return db.prepare(
    `SELECT s.token_hash, s.expires_at, u.must_change_password
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
  ).bind(tokenHash).first()
}

function sessionCookie(token, request, maxAge = SESSION_MAX_AGE) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly${secure}; SameSite=Strict; Max-Age=${maxAge}`
}

function assertSameOrigin(request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

async function readJson(request) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_JSON_BYTES) throw new Error('PAYLOAD_TOO_LARGE')
  if (!request.body) return {}

  const reader = request.body.getReader()
  const chunks = []
  let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_JSON_BYTES) {
      await reader.cancel()
      throw new Error('PAYLOAD_TOO_LARGE')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder().decode(bytes))
}

function normalizeProject(row) {
  return {
    id: row.id,
    slug: row.slug,
    tag: row.tag,
    name: row.title,
    desc: row.description,
    markdown: row.markdown,
    published: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

async function listProjects(db, includeDrafts = false) {
  const where = includeDrafts ? '' : 'WHERE is_published = 1'
  const result = await db.prepare(
    `SELECT id, slug, tag, title, description, markdown, is_published, created_at, updated_at
       FROM projects ${where} ORDER BY updated_at DESC, id DESC`
  ).all()
  return result.results.map(normalizeProject)
}

async function handleApi(request, env, pathname) {
  if (!env.DB) return json({ error: 'D1 数据库尚未绑定。' }, 503)

  if (request.method === 'GET' && pathname === '/api/projects') {
    return json({ projects: await listProjects(env.DB) }, 200, { 'cache-control': 'public, max-age=60' })
  }

  if (request.method === 'GET' && pathname.startsWith('/api/projects/')) {
    const slug = decodeURIComponent(pathname.slice('/api/projects/'.length))
    const row = await env.DB.prepare(
      `SELECT id, slug, tag, title, description, markdown, is_published, created_at, updated_at
         FROM projects WHERE slug = ? AND is_published = 1`
    ).bind(slug).first()
    return row ? json({ project: normalizeProject(row) }, 200, { 'cache-control': 'public, max-age=60' }) : json({ error: '项目不存在。' }, 404)
  }

  if (request.method !== 'GET' && !assertSameOrigin(request)) {
    return json({ error: '请求来源无效。' }, 403)
  }

  if (request.method === 'POST' && pathname === '/api/admin/login') {
    await ensureAdmin(env.DB)
    const { password = '' } = await readJson(request)
    const ipHash = await sha256(request.headers.get('cf-connecting-ip') || 'local-development')
    const attempts = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM admin_login_attempts
        WHERE ip_hash = ? AND attempted_at > datetime('now', '-15 minutes')`
    ).bind(ipHash).first()
    if (Number(attempts?.count || 0) >= 8) return json({ error: '登录尝试过多，请 15 分钟后再试。' }, 429)
    const admin = await env.DB.prepare(
      'SELECT password_hash, password_salt, password_iterations, must_change_password FROM admin_users WHERE id = 1'
    ).first()
    const candidate = await hashPassword(String(password), admin.password_salt, admin.password_iterations)
    if (!constantTimeEqual(candidate, admin.password_hash)) {
      await env.DB.prepare('INSERT INTO admin_login_attempts (ip_hash) VALUES (?)').bind(ipHash).run()
      return json({ error: '密码错误。' }, 401)
    }

    const token = randomBase64(32)
    const tokenHash = await sha256(token)
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO admin_sessions (token_hash, user_id, expires_at)
         VALUES (?, 1, datetime('now', '+7 days'))`
      ).bind(tokenHash),
      env.DB.prepare('DELETE FROM admin_login_attempts WHERE ip_hash = ?').bind(ipHash)
    ])
    return json(
      { authenticated: true, mustChangePassword: Boolean(admin.must_change_password) },
      200,
      { 'set-cookie': sessionCookie(token, request) }
    )
  }

  const session = await getSession(request, env.DB)
  if (!session) return json({ error: '请先登录。' }, 401)

  if (request.method === 'GET' && pathname === '/api/admin/session') {
    return json({ authenticated: true, mustChangePassword: Boolean(session.must_change_password) })
  }

  if (request.method === 'POST' && pathname === '/api/admin/logout') {
    await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(session.token_hash).run()
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', request, 0) })
  }

  if (request.method === 'POST' && pathname === '/api/admin/change-password') {
    const { currentPassword = '', newPassword = '' } = await readJson(request)
    if (String(newPassword).length < 8) return json({ error: '新密码至少需要 8 个字符。' }, 400)
    const admin = await env.DB.prepare(
      'SELECT password_hash, password_salt, password_iterations FROM admin_users WHERE id = 1'
    ).first()
    const currentHash = await hashPassword(String(currentPassword), admin.password_salt, admin.password_iterations)
    if (!constantTimeEqual(currentHash, admin.password_hash)) return json({ error: '当前密码错误。' }, 401)

    const salt = randomBase64(16)
    const passwordHash = await hashPassword(String(newPassword), salt)
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE admin_users SET password_hash = ?, password_salt = ?, password_iterations = ?,
          must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 1`
      ).bind(passwordHash, salt, PASSWORD_ITERATIONS),
      env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash <> ?').bind(session.token_hash)
    ])
    return json({ ok: true, mustChangePassword: false })
  }

  if (session.must_change_password) return json({ error: '首次使用必须先修改密码。' }, 403)

  if (request.method === 'GET' && pathname === '/api/admin/projects') {
    return json({ projects: await listProjects(env.DB, true) })
  }

  if (request.method === 'POST' && pathname === '/api/admin/projects') {
    const body = await readJson(request)
    const slug = String(body.slug || '').trim().toLowerCase()
    const tag = String(body.tag || '').trim()
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const markdown = String(body.markdown || '')
    const published = body.published ? 1 : 0
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json({ error: 'Slug 只能包含小写字母、数字和连字符。' }, 400)
    if (!title || title.length > 120 || tag.length > 80 || description.length > 500 || markdown.length > 400000) {
      return json({ error: '项目字段为空或超过长度限制。' }, 400)
    }

    if (body.id) {
      await env.DB.prepare(
        `UPDATE projects SET slug = ?, tag = ?, title = ?, description = ?, markdown = ?,
          is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(slug, tag, title, description, markdown, published, Number(body.id)).run()
    } else {
      await env.DB.prepare(
        `INSERT INTO projects (slug, tag, title, description, markdown, is_published)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(slug, tag, title, description, markdown, published).run()
    }
    return json({ ok: true })
  }

  if (request.method === 'DELETE' && pathname.startsWith('/api/admin/projects/')) {
    const id = Number(pathname.slice('/api/admin/projects/'.length))
    if (!Number.isInteger(id) || id < 1) return json({ error: '项目 ID 无效。' }, 400)
    await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
    return json({ ok: true })
  }

  return json({ error: '接口不存在。' }, 404)
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname

    try {
      if (pathname.startsWith('/api/')) return await handleApi(request, env, pathname)

      if (/\.[a-zA-Z0-9]+$/.test(pathname)) return env.ASSETS.fetch(request)

      const rendered = await render(pathname + url.search, request, env)
      const templateRes = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin)))
      const template = await templateRes.text()
      const state = JSON.stringify({ projects: rendered.projects }).replace(/</g, '\\u003c')
      const full = template
        .replace('<div id="app"></div>', `<div id="app">${rendered.html}</div>`)
        .replace('<html lang="zh-CN">', `<html lang="${rendered.locale}">`)
        .replace('</body>', `<script>window.__MEIKEN_STATE__=${state}</script></body>`)
      return new Response(full, { headers: { 'content-type': 'text/html;charset=UTF-8' } })
    } catch (error) {
      console.error(JSON.stringify({ event: 'request_error', pathname, message: error?.message }))
      if (pathname.startsWith('/api/')) {
        const status = error?.message === 'PAYLOAD_TOO_LARGE' ? 413 : error instanceof SyntaxError ? 400 : 500
        const message = status === 413 ? '请求内容过大。' : status === 400 ? 'JSON 格式无效。' : '服务器处理失败。'
        return json({ error: message }, status)
      }
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
