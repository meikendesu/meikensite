<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CustomSelect from '../components/CustomSelect.vue'
import { adminApi, requireAdminSession } from '../data/adminApi'
import { beginPageLoading } from '../data/pageLoading'
import type { AboutContent, Locale } from '../types'

const router = useRouter()
const status = ref<'loading' | 'ready' | 'error'>('loading')
const error = ref('')
const selectedLocale = ref<Locale>('zh-CN')
const contents = ref<AboutContent[]>([])
const localeOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' }
]
const editor = computed(() => contents.value.find((item) => item.locale === selectedLocale.value))

async function loadEditor() {
  const finishPageLoading = beginPageLoading()
  try {
    if (!(await requireAdminSession(router))) return
    const data = await adminApi<{ contents: AboutContent[] }>('/api/admin/about')
    contents.value = data.contents || []
    if (!editor.value) throw new Error('关于页面内容尚未初始化，请先执行数据库迁移。')
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
  if (!editor.value) return
  error.value = ''
  try {
    await adminApi('/api/admin/about', {
      method: 'POST',
      body: JSON.stringify(editor.value)
    })
    await router.push({ path: '/admin', query: { saved: 'about' } })
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '关于页面内容保存失败。'
  }
}

onMounted(loadEditor)
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell admin-shell admin-editor-page">
    <header v-if="status === 'ready'" class="admin-header">
      <div><p class="overline">ABOUT EDITOR</p><h1>编辑关于页面</h1></div>
      <router-link class="work-btn" to="/admin"><i class="fa-solid fa-arrow-left"></i> 返回管理页</router-link>
    </header>

    <p v-if="status === 'loading'" class="form-message">正在加载关于页面内容…</p>
    <section v-else-if="status === 'error'" class="admin-panel">
      <p class="form-message error" role="alert">{{ error }}</p>
      <router-link class="work-btn" to="/admin">返回管理页</router-link>
    </section>

    <form v-else-if="editor" class="admin-panel admin-editor" @submit.prevent="saveContent">
      <label class="admin-about-locale">编辑语言
        <CustomSelect v-model="selectedLocale" :options="localeOptions" aria-label="选择关于页面语言" />
      </label>

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
        <button class="admin-primary" type="submit">保存关于页面</button>
      </div>
      <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
    </form>
  </main>
</template>
