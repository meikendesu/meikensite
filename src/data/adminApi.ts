import type { Router } from 'vue-router'
import type { AdminSession } from '../types'

export class AdminApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function adminApi<T = Record<string, unknown>>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers }
  })
  const data = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) {
    throw new AdminApiError(data.error || '请求失败。', response.status)
  }
  return data
}

export async function requireAdminSession(router: Router): Promise<AdminSession | null> {
  try {
    const session = await adminApi<AdminSession>('/api/admin/session')
    if (session.mustChangePassword) {
      await router.replace('/admin')
      return null
    }
    return session
  } catch (error) {
    if (error instanceof AdminApiError && (error.status === 401 || error.status === 404)) {
      await router.replace('/admin')
      return null
    }
    throw error
  }
}
