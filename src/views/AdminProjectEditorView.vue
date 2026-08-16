<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import { useRoute, useRouter } from 'vue-router'
import { adminApi, requireAdminSession } from '../data/adminApi'
import CustomSelect from '../components/CustomSelect.vue'
import type { Project } from '../types'

const route = useRoute()
const router = useRouter()
const status = ref('loading')
const error = ref('')
const markdownInput = ref(null)
const headingLevel = ref('')
const editor = reactive({ id: null, slug: '', tag: '', title: '', description: '', markdown: '', published: false })
const md = new MarkdownIt({ html: false, linkify: true })
const preview = computed(() => md.render(editor.markdown || ''))
const isEditing = computed(() => Boolean(route.params.id))
const headingOptions = [
  { value: 1, label: '一级标题' },
  { value: 2, label: '二级标题' },
  { value: 3, label: '三级标题' }
]

async function loadEditor() {
  try {
    if (!(await requireAdminSession(router))) return
    if (isEditing.value) {
      const id = Number(route.params.id)
      if (!Number.isInteger(id) || id < 1) throw new Error('项目 ID 无效。')
      const data = await adminApi<{ projects: Project[] }>('/api/admin/projects')
      const project = (data.projects || []).find((item) => item.id === id)
      if (!project) throw new Error('项目不存在或已被删除。')
      Object.assign(editor, {
        id: project.id,
        slug: project.slug,
        tag: project.tag,
        title: project.name,
        description: project.desc,
        markdown: project.markdown,
        published: project.published
      })
    }
    status.value = 'ready'
  } catch (requestError) {
    error.value = requestError.message
    status.value = 'error'
  }
}

async function saveProject() {
  error.value = ''
  try {
    await adminApi('/api/admin/projects', { method: 'POST', body: JSON.stringify(editor) })
    await router.push({ path: '/admin', query: { saved: 'project' } })
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

async function replaceSelection(before, after = '', placeholder = '文本') {
  const input = markdownInput.value
  if (!input) return
  const start = input.selectionStart
  const end = input.selectionEnd
  const selected = editor.markdown.slice(start, end) || placeholder
  editor.markdown = `${editor.markdown.slice(0, start)}${before}${selected}${after}${editor.markdown.slice(end)}`
  await nextTick()
  input.focus()
  input.setSelectionRange(start + before.length, start + before.length + selected.length)
}

async function insertBlock(content) {
  const input = markdownInput.value
  if (!input) return
  const start = input.selectionStart
  const end = input.selectionEnd
  const before = editor.markdown.slice(0, start)
  const after = editor.markdown.slice(end)
  const prefix = before && !before.endsWith('\n') ? '\n' : ''
  const suffix = after && !after.startsWith('\n') ? '\n' : ''
  editor.markdown = `${before}${prefix}${content}${suffix}${after}`
  await nextTick()
  input.focus()
  input.setSelectionRange(start + prefix.length, start + prefix.length + content.length)
}

function insertHeading() {
  if (!headingLevel.value) return
  insertBlock(`${'#'.repeat(Number(headingLevel.value))} 标题`)
  headingLevel.value = ''
}

function selectHeading(value) {
  headingLevel.value = value
  insertHeading()
}

function insertList(ordered = false) {
  const input = markdownInput.value
  const selected = input ? editor.markdown.slice(input.selectionStart, input.selectionEnd).trim() : ''
  const lines = (selected || '列表项').split('\n')
  insertBlock(lines.map((line, index) => `${ordered ? `${index + 1}.` : '-'} ${line}`).join('\n'))
}

onMounted(loadEditor)
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell admin-shell admin-editor-page">
    <header class="admin-header">
      <div><p class="overline">PROJECT EDITOR</p><h1>{{ isEditing ? '编辑项目' : '新建项目' }}</h1></div>
      <router-link class="work-btn" to="/admin"><i class="fa-solid fa-arrow-left"></i> 返回管理页</router-link>
    </header>

    <p v-if="status === 'loading'" class="form-message">正在加载编辑器…</p>
    <section v-else-if="status === 'error'" class="admin-panel">
      <p class="form-message error" role="alert">{{ error }}</p>
      <router-link class="work-btn" to="/admin">返回管理页</router-link>
    </section>

    <form v-else class="admin-panel admin-editor" @submit.prevent="saveProject">
      <div class="admin-fields-grid">
        <label>标题<input v-model="editor.title" maxlength="120" required /></label>
        <label>Slug<input v-model="editor.slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="my-project" required /></label>
        <label>分类标签<input v-model="editor.tag" maxlength="80" /></label>
        <label class="admin-published"><input v-model="editor.published" type="checkbox" /> 公开发布</label>
      </div>
      <label>简介<textarea v-model="editor.description" maxlength="500" rows="3"></textarea></label>

      <div class="markdown-editor-header">
        <div><strong>Markdown 编辑器</strong><small>输入内容后右侧会立即显示预览</small></div>
        <label class="file-button">导入 .md<input type="file" accept=".md,text/markdown" @change="importMarkdown" /></label>
      </div>
      <div class="markdown-format-toolbar" role="toolbar" aria-label="Markdown 格式工具">
        <CustomSelect class="markdown-heading-select" :model-value="headingLevel" :options="headingOptions" placeholder="标题" aria-label="插入标题" @update:model-value="selectHeading" />
        <button type="button" title="粗体" aria-label="插入粗体" @click="replaceSelection('**', '**', '粗体文本')"><i class="fa-solid fa-bold"></i></button>
        <button type="button" title="斜体" aria-label="插入斜体" @click="replaceSelection('*', '*', '斜体文本')"><i class="fa-solid fa-italic"></i></button>
        <button type="button" title="链接" aria-label="插入链接" @click="replaceSelection('[', '](https://example.com)', '链接文字')"><i class="fa-solid fa-link"></i></button>
        <button type="button" title="无序列表" aria-label="插入无序列表" @click="insertList(false)"><i class="fa-solid fa-list-ul"></i></button>
        <button type="button" title="有序列表" aria-label="插入有序列表" @click="insertList(true)"><i class="fa-solid fa-list-ol"></i></button>
        <button type="button" title="引用" aria-label="插入引用" @click="insertBlock('> 引用内容')"><i class="fa-solid fa-quote-left"></i></button>
        <button type="button" title="行内代码" aria-label="插入行内代码" @click="replaceSelection('`', '`', '代码')"><i class="fa-solid fa-code"></i></button>
        <button type="button" title="代码块" aria-label="插入代码块" @click="insertBlock('```\n代码\n```')"><i class="fa-solid fa-file-code"></i></button>
        <button type="button" title="分隔线" aria-label="插入分隔线" @click="insertBlock('---')"><i class="fa-solid fa-minus"></i></button>
      </div>

      <div class="markdown-editor-grid">
        <div class="markdown-pane">
          <span class="markdown-pane-title">Markdown</span>
          <textarea ref="markdownInput" v-model="editor.markdown" class="markdown-input" maxlength="400000" rows="24" spellcheck="false" required></textarea>
        </div>
        <div class="markdown-pane">
          <span class="markdown-pane-title">实时预览</span>
          <article v-if="editor.markdown" class="markdown-body markdown-preview" v-html="preview"></article>
          <div v-else class="markdown-preview markdown-preview-empty">开始输入 Markdown 后，预览会显示在这里。</div>
        </div>
      </div>

      <div class="admin-form-actions">
        <router-link class="work-btn" to="/admin">取消</router-link>
        <button class="admin-primary" type="submit">{{ editor.published ? '保存并发布' : '保存草稿' }}</button>
      </div>
      <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
    </form>
  </main>
</template>
