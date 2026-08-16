export async function adminApi(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const requestError = new Error(data.error || '请求失败。')
    requestError.status = response.status
    throw requestError
  }
  return data
}

export async function requireAdminSession(router) {
  try {
    const session = await adminApi('/api/admin/session')
    if (session.mustChangePassword) {
      await router.replace('/admin')
      return null
    }
    return session
  } catch (error) {
    if (error.status === 401) {
      await router.replace('/admin')
      return null
    }
    throw error
  }
}
