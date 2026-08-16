<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import PageHeader from '../components/PageHeader.vue'
import { t } from '../i18n'
import { ProjectStoreKey } from '../data/projects'
import { beginPageLoading } from '../data/pageLoading'

const route = useRoute()
const projectStore = inject(ProjectStoreKey)
const slug = computed(() => String(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id || ''))
const loading = ref(!projectStore.getProjectBySlug(slug.value))
const loadError = ref('')
const project = computed(() => projectStore.getProjectBySlug(slug.value))

onMounted(async () => {
  if (project.value) return
  const finishPageLoading = beginPageLoading()
  try {
    await projectStore.loadProject(slug.value)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '项目详情加载失败。'
  } finally {
    loading.value = false
    finishPageLoading()
  }
})

// 管理后台内容按不可信输入处理，禁用原始 HTML，避免存储型 XSS。
const md = new MarkdownIt({ html: false, linkify: true })
const rendered = computed(() => (project.value ? md.render(project.value.markdown) : ''))
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell detail-shell">
    <PageHeader
      :title="t('detail.title')"
      back-to="/projects"
      :back-label="t('common.backProjects')"
      avatar-to="/contact"
      :avatar-label="t('nav.contact')"
    />
    <template v-if="project">
      <section class="page-hero compact">
        <p class="overline">{{ project.tag }}</p>
        <h1>{{ project.name }}</h1>
        <p class="hero-copy">{{ t('projects.publishedAt') }} {{ project.publishedAt }} · {{ t('projects.updatedAt') }} {{ project.updatedAt }}</p>
      </section>
      <article class="markdown-body" v-html="rendered"></article>
      <div class="detail-actions">
        <span
          class="work-btn work-btn-unavailable"
          role="status"
          :aria-label="`${t('common.downloadUnavailable')}：${project.name}`"
          ><i class="fa-solid fa-circle-info"></i> {{ t('common.downloadUnavailable') }}</span
        >
      </div>
    </template>
    <p v-else-if="loading" class="form-message">正在加载项目…</p>
    <p v-else-if="loadError" class="form-message error" role="alert">{{ loadError }}</p>
    <template v-else>
      <section class="page-hero compact">
        <p class="overline">404 / NOT FOUND</p>
        <h1>{{ t('detail.notFound') }}</h1>
        <p class="hero-copy">{{ t('detail.notFoundDesc') }}</p>
      </section>
    </template>
  </main>
</template>
