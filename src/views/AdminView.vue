<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MarkdownIt from 'markdown-it'

const status = ref('loading')
const mustChangePassword = ref(false)
const message = ref('')
const error = ref('')
const projects = ref([])
const loginPassword = ref('')
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const editor = reactive(emptyProject())
const md = new MarkdownIt({ html: false, linkify: true })
const preview = computed(() => md.render(editor.markdown || ''))

function emptyProject() {
  return { id: null, slug: '', tag: '', title: '', description: '', markdown: '', published: false }
}

async function api(url, options = {}) {
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

async function checkSession() {
  try {
    const data = await api('/api/admin/session')
    mustChangePassword.value = data.mustChangePassword
    status.value = data.mustChangePassword ? 'change-password' : 'ready'
    if (!data.mustChangePassword) await loadProjects()
  } catch (requestError) {
    status.value = requestError.status === 401 ? 'login' : 'error'
    error.value = requestError.status === 401 ? '' : requestError.message
  }
}

async function login() {
  clearMessages()
  try {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: loginPassword.value })
    })
    loginPassword.value = ''
    mustChangePassword.value = data.mustChangePassword
    status.value = data.mustChangePassword ? 'change-password' : 'ready'
    if (!data.mustChangePassword) await loadProjects()
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
    await api('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    mustChangePassword.value = false
    status.value = 'ready'
    message.value = '密码已更新。'
    await loadProjects()
  } catch (requestError) {
    error.value = requestError.message
  }
}

async function loadProjects() {
  const data = await api('/api/admin/projects')
  projects.value = data.projects || []
}

function editProject(project) {
  Object.assign(editor, {
    id: project.id,
    slug: project.slug,
    tag: project.tag,
    title: project.name,
    description: project.desc,
    markdown: project.markdown,
    published: project.published
  })
  clearMessages()
  document.querySelector('.admin-editor')?.scrollIntoView({ behavior: 'smooth' })
}

function resetEditor(clear = true) {
  Object.assign(editor, emptyProject())
  if (clear) clearMessages()
}

async function saveProject() {
  clearMessages()
  try {
    await api('/api/admin/projects', { method: 'POST', body: JSON.stringify(editor) })
    message.value = editor.published ? '项目已保存并发布。' : '草稿已保存。'
    await loadProjects()
    if (!editor.id) resetEditor(false)
  } catch (requestError) {
    error.value = requestError.message
  }
}

async function deleteProject(project) {
  if (!window.confirm(`确定删除“${project.name}”吗？此操作不可撤销。`)) return
  clearMessages()
  try {
    await api(`/api/admin/projects/${project.id}`, { method: 'DELETE' })
    if (editor.id === project.id) resetEditor()
    await loadProjects()
    message.value = '项目已删除。'
  } catch (requestError) {
    error.value = requestError.message
  }
}

function importMarkdown(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.md') || file.size > 400000) {
    error.value = '请选择不超过 400 KB 的 Markdown 文件。'
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    editor.markdown = String(reader.result || '')
    if (!editor.title) editor.title = file.name.replace(/\.md$/i, '')
  }
  reader.readAsText(file)
  event.target.value = ''
}

async function logout() {
  await api('/api/admin/logout', { method: 'POST', body: '{}' })
  status.value = 'login'
  projects.value = []
  resetEditor()
}

function clearMessages() {
  message.value = ''
  error.value = ''
}

onMounted(checkSession)
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell admin-shell">
    <header class="admin-header">
      <div>
        <p class="overline">ADMIN</p>
        <h1>项目内容管理</h1>
      </div>
      <div class="admin-header-actions">
        <router-link class="work-btn" to="/projects">查看项目页</router-link>
        <button v-if="status === 'ready'" class="work-btn" type="button" @click="logout">退出登录</button>
      </div>
    </header>

    <p v-if="status === 'loading'" class="form-message">正在检查登录状态…</p>
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
          <h2>项目文章</h2>
          <button class="work-btn" type="button" @click="resetEditor">新建项目</button>
        </div>
        <div v-if="projects.length" class="admin-project-list">
          <article v-for="project in projects" :key="project.id">
            <div><strong>{{ project.name }}</strong><small>{{ project.slug }} · {{ project.published ? '已发布' : '草稿' }}</small></div>
            <div><button type="button" @click="editProject(project)">编辑</button><button class="danger" type="button" @click="deleteProject(project)">删除</button></div>
          </article>
        </div>
        <p v-else class="form-message">暂无项目。</p>
      </section>

      <form class="admin-panel admin-editor" @submit.prevent="saveProject">
        <h2>{{ editor.id ? '编辑项目' : '新建项目' }}</h2>
        <div class="admin-fields-grid">
          <label>标题<input v-model="editor.title" maxlength="120" required /></label>
          <label>Slug<input v-model="editor.slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="my-project" required /></label>
          <label>分类标签<input v-model="editor.tag" maxlength="80" /></label>
          <label class="admin-published"><input v-model="editor.published" type="checkbox" /> 公开发布</label>
        </div>
        <label>简介<textarea v-model="editor.description" maxlength="500" rows="3"></textarea></label>
        <div class="markdown-toolbar">
          <span>Markdown 正文</span>
          <label class="file-button">导入 .md<input type="file" accept=".md,text/markdown" @change="importMarkdown" /></label>
        </div>
        <div class="markdown-editor-grid">
          <textarea v-model="editor.markdown" class="markdown-input" maxlength="400000" rows="22" spellcheck="false" required></textarea>
          <article class="markdown-body markdown-preview" v-html="preview"></article>
        </div>
        <button class="admin-primary" type="submit">{{ editor.published ? '保存并发布' : '保存草稿' }}</button>
      </form>
    </template>

    <p v-if="message" class="form-message success" role="status">{{ message }}</p>
    <p v-if="error && status !== 'error'" class="form-message error" role="alert">{{ error }}</p>
  </main>
</template>
