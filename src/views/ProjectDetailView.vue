<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { locale, t } from '../i18n'
import { ProjectStoreKey } from '../data/projects'
import { beginPageLoading } from '../data/pageLoading'

const route = useRoute()
const projectStore = inject(ProjectStoreKey)!
const slug = computed(() => String(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id || ''))
const loadError = ref('')
const project = computed(() => projectStore.getProjectBySlug(slug.value))
const hasContent = computed(() => Boolean(project.value?.markdown.trim()))
const loading = ref(!hasContent.value)

async function loadProject(force = false) {
  if (hasContent.value && !force) return
  const finishPageLoading = beginPageLoading()
  loadError.value = ''
  loading.value = true
  try {
    await projectStore.loadProject(slug.value, force)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : t('detail.loadFailed')
  } finally {
    loading.value = false
    finishPageLoading()
  }
}

onMounted(() => loadProject())
watch(locale, () => loadProject(true))

// 管理后台内容按不可信输入处理，禁用原始 HTML，避免存储型 XSS。
const md = new MarkdownIt({ html: false, linkify: true })
const rendered = computed(() => (project.value ? md.render(project.value.markdown) : ''))

function formatFileSize(size: number | null) {
  if (!size || size < 1) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell editorial-shell detail-shell">
    <router-link class="detail-back-float" to="/projects" :aria-label="t('common.backProjects')">
      <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
      <span>{{ t('common.backProjects') }}</span>
    </router-link>
    <template v-if="project && hasContent">
      <section class="page-hero compact">
        <h1>{{ project.name }}</h1>
        <p class="hero-copy">{{ t('projects.publishedAt') }} {{ project.publishedAt }} · {{ t('projects.updatedAt') }} {{ project.updatedAt }}</p>
      </section>
      <img
        v-if="project.coverUrl"
        class="project-detail-cover"
        :src="project.coverUrl"
        :alt="`${project.name} · ${t('projects.coverImage')}`"
        decoding="async"
      />
      <section v-if="project.hasExecutable" class="detail-download" :aria-label="t('detail.executableFile')">
        <div>
          <strong>{{ project.executableFileName }}</strong>
          <small v-if="project.executableSize">{{ formatFileSize(project.executableSize) }}</small>
        </div>
        <a
          class="work-btn detail-download-button"
          :href="`/api/projects/${encodeURIComponent(project.slug)}/download`"
          :download="project.executableFileName || undefined"
        ><i class="fa-solid fa-download"></i> {{ t('common.downloadProject') }}</a>
      </section>
      <article class="markdown-body" v-html="rendered"></article>
    </template>
    <p v-else-if="loading" class="form-message">{{ t('detail.loading') }}</p>
    <p v-else-if="loadError" class="form-message error" role="alert">{{ loadError }}</p>
    <template v-else>
      <section class="page-hero compact">
        <h1>{{ t('detail.notFound') }}</h1>
        <p class="hero-copy">{{ t('detail.notFoundDesc') }}</p>
      </section>
    </template>
  </main>
</template>
