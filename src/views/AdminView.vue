<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApi } from '../data/adminApi'
import { beginPageLoading } from '../data/pageLoading'
import type { AdminSession, Project, SiteMethod, SiteMethodCategory } from '../types'

const route = useRoute()
const router = useRouter()
const status = ref<'loading' | 'hidden' | 'login' | 'change-password' | 'ready' | 'error'>('loading')
const message = ref('')
const error = ref('')
const projects = ref<Project[]>([])
const siteMethods = ref<SiteMethod[]>([])
const loginPassword = ref('')
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const methodGroups = [
  { category: 'contact', title: '联系方式', icon: 'fa-solid fa-address-book', empty: '暂无联系方式。' },
  { category: 'donation', title: '捐助方式', icon: 'fa-solid fa-hand-holding-heart', empty: '暂无捐助方式。' }
] as const
const dragState = reactive<{ category: SiteMethodCategory | ''; id: number | null; overId: number | null; saving: boolean }>({ category: '', id: null, overId: null, saving: false })

async function checkSession() {
  try {
    const data = await adminApi<AdminSession>('/api/admin/session')
    status.value = data.mustChangePassword ? 'change-password' : 'ready'
    if (!data.mustChangePassword) await loadAdminData()
  } catch (requestError) {
    if (requestError.status === 404) {
      status.value = 'hidden'
      error.value = ''
    } else {
      status.value = requestError.status === 401 ? 'login' : 'error'
      error.value = requestError.status === 401 ? '' : requestError.message
    }
  }
}

async function login() {
  clearMessages()
  try {
    const data = await adminApi<AdminSession>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: loginPassword.value })
    })
    loginPassword.value = ''
    status.value = data.mustChangePassword ? 'change-password' : 'ready'
    if (!data.mustChangePassword) await loadAdminData()
  } catch (requestError) {
    error.value = requestError.message
  }
}

async function changePassword() {
  clearMessages()
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = '两次输入的新密码不一致。'
    return
  }
  try {
    await adminApi('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
    })
    Object.assign(passwordForm, { currentPassword: '', newPassword: '', confirmPassword: '' })
    status.value = 'ready'
    message.value = '密码已更新。'
    await loadAdminData()
  } catch (requestError) {
    error.value = requestError.message
  }
}

async function loadAdminData() {
  const [projectData, methodData] = await Promise.all([
    adminApi<{ projects: Project[] }>('/api/admin/projects'),
    adminApi<{ methods: SiteMethod[] }>('/api/admin/site-methods')
  ])
  projects.value = projectData.projects || []
  siteMethods.value = methodData.methods || []
}

async function deleteProject(project: Project) {
  if (!window.confirm(`确定删除“${project.name}”吗？此操作不可撤销。`)) return
  clearMessages()
  try {
    await adminApi(`/api/admin/projects/${project.id}`, { method: 'DELETE' })
    await loadAdminData()
    message.value = '项目已删除。'
  } catch (requestError) {
    error.value = requestError.message
  }
}

async function deleteSiteMethod(method: SiteMethod) {
  if (!window.confirm(`确定删除“${method.name}”吗？此操作不可撤销。`)) return
  clearMessages()
  try {
    await adminApi(`/api/admin/site-methods/${method.id}`, { method: 'DELETE' })
    await loadAdminData()
    message.value = '方式已删除。'
  } catch (requestError) {
    error.value = requestError.message
  }
}

function methodsFor(category: SiteMethodCategory) {
  return siteMethods.value.filter((method) => method.category === category)
}

function startMethodDrag(event: DragEvent, method: SiteMethod) {
  dragState.category = method.category
  dragState.id = method.id
  dragState.overId = method.id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(method.id))
  }
}

async function dropMethod(category: SiteMethodCategory, targetId: number | null, event: DragEvent) {
  if (dragState.saving || dragState.category !== category || !dragState.id) return
  if (targetId === dragState.id) {
    endMethodDrag()
    return
  }
  const original = [...siteMethods.value]
  const reordered = methodsFor(category)
  const fromIndex = reordered.findIndex((method) => method.id === dragState.id)
  if (fromIndex < 0) return
  const [moved] = reordered.splice(fromIndex, 1)
  if (targetId === null) {
    reordered.push(moved)
  } else {
    const targetIndex = reordered.findIndex((method) => method.id === targetId)
    if (targetIndex < 0) reordered.push(moved)
    else {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const insertAfter = event.clientY > rect.top + rect.height / 2
      reordered.splice(targetIndex + (insertAfter ? 1 : 0), 0, moved)
    }
  }
  const otherCategory = category === 'contact' ? 'donation' : 'contact'
  siteMethods.value = category === 'contact' ? [...reordered, ...methodsFor(otherCategory)] : [...methodsFor(otherCategory), ...reordered]
  dragState.saving = true
  try {
    await adminApi('/api/admin/site-methods/reorder', {
      method: 'POST',
      body: JSON.stringify({ category, orderedIds: reordered.map((method) => method.id) })
    })
    message.value = `${category === 'contact' ? '联系方式' : '捐助方式'}排序已保存。`
  } catch (requestError) {
    siteMethods.value = original
    error.value = requestError.message
  } finally {
    endMethodDrag()
  }
}

function endMethodDrag() {
  dragState.category = ''
  dragState.id = null
  dragState.overId = null
  dragState.saving = false
}

async function logout() {
  await adminApi('/api/admin/logout', { method: 'POST', body: '{}' })
  status.value = 'hidden'
  projects.value = []
  siteMethods.value = []
  clearMessages()
}

function clearMessages() {
  message.value = ''
  error.value = ''
}

onMounted(async () => {
  const finishPageLoading = beginPageLoading()
  if (route.query.saved === 'project') message.value = '项目已保存。'
  if (route.query.saved === 'method') message.value = '方式已保存。'
  if (route.query.saved === 'about') message.value = '关于页面内容已保存。'
  try {
    const accessKey = new URLSearchParams(window.location.hash.slice(1)).get('access')
    if (accessKey) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      await adminApi('/api/admin/access', {
        method: 'POST',
        body: JSON.stringify({ key: accessKey })
      })
    }
    await checkSession()
    if (route.query.saved) await router.replace('/admin')
  } catch {
    status.value = 'hidden'
    error.value = ''
  } finally {
    finishPageLoading()
  }
})
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell admin-shell">
    <header v-if="status !== 'hidden' && status !== 'loading'" class="admin-header">
      <div><h1>站点内容管理</h1></div>
      <div class="admin-header-actions">
        <router-link class="work-btn" to="/projects">查看项目页</router-link>
        <button v-if="status === 'ready'" class="work-btn" type="button" @click="logout">退出登录</button>
      </div>
    </header>

    <section v-if="status === 'hidden'" class="error-box admin-hidden-error">
      <p class="error-code">404</p>
      <h1>页面不存在</h1>
      <p class="error-desc">你要找的页面可能已被移动、删除，或者地址输入有误。</p>
      <router-link class="error-home" to="/">返回首页</router-link>
    </section>
    <p v-else-if="status === 'loading'" class="form-message">正在检查登录状态…</p>
    <p v-else-if="status === 'error'" class="form-message error" role="alert">{{ error }}</p>

    <form v-else-if="status === 'login'" class="admin-panel auth-panel" @submit.prevent="login">
      <h2>管理员登录</h2>
      <p>首次登录密码为 <code>123456</code>，登录后必须立即修改。</p>
      <label>密码<input v-model="loginPassword" type="password" autocomplete="current-password" required /></label>
      <button class="admin-primary" type="submit">登录</button>
    </form>

    <form v-else-if="status === 'change-password'" class="admin-panel auth-panel" @submit.prevent="changePassword">
      <h2>首次使用：修改密码</h2>
      <p>新密码至少 8 个字符。完成修改前不能进入发布后台。</p>
      <label>当前密码<input v-model="passwordForm.currentPassword" type="password" autocomplete="current-password" required /></label>
      <label>新密码<input v-model="passwordForm.newPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
      <label>确认新密码<input v-model="passwordForm.confirmPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
      <button class="admin-primary" type="submit">保存新密码</button>
    </form>

    <template v-else-if="status === 'ready'">
      <section class="admin-panel">
        <div class="admin-section-title">
          <div><h2>关于页面</h2><p class="admin-help">维护简体中文源内容，保存后自动生成繁体中文、英语和日语。</p></div>
          <router-link class="work-btn" to="/admin/about">编辑关于页面</router-link>
        </div>
      </section>
      <section class="admin-panel">
        <div class="admin-section-title">
          <h2>项目文章</h2>
          <router-link class="work-btn" to="/admin/projects/new">新建项目</router-link>
        </div>
        <div v-if="projects.length" class="admin-project-list">
          <article v-for="project in projects" :key="project.id">
            <div><strong>{{ project.name }}</strong><small>{{ project.slug }} · {{ project.published ? '已发布' : '草稿' }} · 发布 {{ project.publishedAt }} · 更新 {{ project.updatedAt }}</small></div>
            <div class="admin-list-actions">
              <router-link :to="`/admin/projects/${project.id}/edit`">编辑</router-link>
              <button class="danger" type="button" @click="deleteProject(project)">删除</button>
            </div>
          </article>
        </div>
        <p v-else class="form-message">暂无项目。</p>
      </section>

      <section v-for="group in methodGroups" :key="group.category" class="admin-panel admin-method-group">
        <div class="admin-section-title">
          <div class="admin-group-heading"><span><i :class="group.icon"></i></span><div><h2>{{ group.title }}</h2><small>拖动卡片可调整公开页面顺序</small></div></div>
          <router-link class="work-btn" :to="`/admin/methods/new?category=${group.category}`">添加{{ group.title }}</router-link>
        </div>
        <div v-if="methodsFor(group.category).length" class="admin-project-list admin-sortable-list">
          <article
            v-for="method in methodsFor(group.category)"
            :key="method.id"
            :class="{ dragging: dragState.id === method.id, 'drag-over': dragState.overId === method.id && dragState.id !== method.id }"
            @dragover.prevent="dragState.overId = method.id"
            @drop.prevent="dropMethod(group.category, method.id, $event)"
          >
            <button
              class="admin-drag-handle"
              type="button"
              draggable="true"
              :aria-label="`拖动${method.name}调整排序`"
              @dragstart="startMethodDrag($event, method)"
              @dragend="endMethodDrag"
            ><i class="fa-solid fa-grip-vertical"></i></button>
            <span class="admin-method-icon"><i :class="method.icon"></i></span>
            <div class="admin-list-copy"><strong>{{ method.name }}</strong><small>{{ method.methodKey }} · {{ method.enabled ? '已显示' : '已隐藏' }}</small></div>
            <div class="admin-list-actions">
              <router-link :to="`/admin/methods/${method.id}/edit`">编辑</router-link>
              <button class="danger" type="button" @click="deleteSiteMethod(method)">删除</button>
            </div>
          </article>
          <div class="admin-sort-drop-end" @dragover.prevent @drop.prevent="dropMethod(group.category, null, $event)">拖到这里置于末尾</div>
        </div>
        <p v-else class="form-message">{{ group.empty }}</p>
      </section>
    </template>

    <p v-if="message" class="form-message success" role="status">{{ message }}</p>
    <p v-if="error && status !== 'error'" class="form-message error" role="alert">{{ error }}</p>
  </main>
</template>
