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

async function uploadProjectAsset<T>(projectId: number, asset: 'executable' | 'cover', file: File, fallbackMessage: string): Promise<T> {
  const response = await fetch(`/api/admin/projects/${projectId}/${asset}`, {
    method: 'PUT',
    headers: {
      'content-type': file.type || 'application/octet-stream',
      'x-project-file-name': encodeURIComponent(file.name)
    },
    body: file
  })
  const data = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) {
    throw new AdminApiError(data.error || fallbackMessage, response.status)
  }
  return data
}

export function uploadProjectExecutable<T>(projectId: number, file: File): Promise<T> {
  return uploadProjectAsset(projectId, 'executable', file, '项目文件上传失败。')
}

export function uploadProjectCover<T>(projectId: number, file: File): Promise<T> {
  return uploadProjectAsset(projectId, 'cover', file, '项目封面上传失败。')
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
