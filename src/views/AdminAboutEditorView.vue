<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi, requireAdminSession } from '../data/adminApi'
import { beginPageLoading } from '../data/pageLoading'
import type { AboutContent } from '../types'

const router = useRouter()
const status = ref<'loading' | 'ready' | 'error'>('loading')
const error = ref('')
const saving = ref(false)
const editor = ref<AboutContent | null>(null)

async function loadEditor() {
  const finishPageLoading = beginPageLoading()
  try {
    if (!(await requireAdminSession(router))) return
    const data = await adminApi<{ content: AboutContent | null }>('/api/admin/about')
    if (!data.content) throw new Error('简体中文关于页面尚未初始化，请先执行数据库迁移。')
    editor.value = data.content
    status.value = 'ready'
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '关于页面内容加载失败。'
    status.value = 'error'
  } finally {
    finishPageLoading()
  }
}

function addFact() {
  if (!editor.value || editor.value.facts.length >= 8) return
  editor.value.facts.push({ label: '', value: '' })
}

function removeFact(index: number) {
  if (!editor.value || editor.value.facts.length <= 1) return
  editor.value.facts.splice(index, 1)
}

async function saveContent() {
  if (!editor.value || saving.value) return
  error.value = ''
  saving.value = true
  try {
    await adminApi('/api/admin/about', {
      method: 'POST',
      body: JSON.stringify({ ...editor.value, locale: 'zh-CN' })
    })
    await router.push({ path: '/admin', query: { saved: 'about' } })
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '关于页面保存失败。'
  } finally {
    saving.value = false
  }
}

onMounted(loadEditor)
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell admin-shell admin-editor-page">
    <header v-if="status === 'ready'" class="admin-header">
      <div><h1>编辑关于页面</h1></div>
      <router-link class="work-btn" to="/admin"><i class="fa-solid fa-arrow-left"></i> 返回管理页</router-link>
    </header>

    <p v-if="status === 'loading'" class="form-message">正在加载关于页面内容…</p>
    <section v-else-if="status === 'error'" class="admin-panel">
      <p class="form-message error" role="alert">{{ error }}</p>
      <router-link class="work-btn" to="/admin">返回管理页</router-link>
    </section>

    <form v-else-if="editor" class="admin-panel admin-editor" @submit.prevent="saveContent">
      <p class="admin-help admin-translation-help">
        后台只维护简体中文源内容。访客选择繁体中文、英语或日语后，Worker 才会自动翻译当前内容并缓存结果；后续修改源内容时缓存会自动失效。
      </p>

      <div class="admin-fields-grid">
        <label>主标题第一行<input v-model="editor.heroTitleLine1" maxlength="120" required /></label>
        <label>主标题第二行<input v-model="editor.heroTitleLine2" maxlength="120" required /></label>
        <label>介绍区标题<input v-model="editor.introHeading" maxlength="120" required /></label>
        <label>标题下说明<input v-model="editor.heroCopy" maxlength="300" /></label>
      </div>
      <label>自我介绍第一段<textarea v-model="editor.introParagraph1" maxlength="2000" rows="5" required></textarea></label>
      <label>自我介绍第二段<textarea v-model="editor.introParagraph2" maxlength="2000" rows="5"></textarea></label>

      <section class="admin-about-facts">
        <div class="admin-section-title">
          <div><h2>个人信息条目</h2><p class="admin-help">公开页面会按这里的顺序显示。</p></div>
          <button class="work-btn" type="button" :disabled="editor.facts.length >= 8" @click="addFact">添加条目</button>
        </div>
        <article v-for="(fact, index) in editor.facts" :key="index" class="admin-about-fact">
          <label>标签<input v-model="fact.label" maxlength="120" required /></label>
          <label>内容<input v-model="fact.value" maxlength="300" required /></label>
          <button class="danger" type="button" :disabled="editor.facts.length <= 1" @click="removeFact(index)">删除</button>
        </article>
      </section>

      <div class="admin-form-actions">
        <router-link class="work-btn" to="/admin">取消</router-link>
        <button class="admin-primary" type="submit" :disabled="saving">
          {{ saving ? '正在保存…' : '保存简体中文内容' }}
        </button>
      </div>
      <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
    </form>
  </main>
</template>
