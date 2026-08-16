<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import PageHeader from '../components/PageHeader.vue'
import { t } from '../i18n/index.js'
import { ProjectStoreKey } from '../data/projects.js'

const route = useRoute()
const projectStore = inject(ProjectStoreKey)
const loading = ref(!projectStore.getProjectBySlug(route.params.id))
const loadError = ref('')
const project = computed(() => projectStore.getProjectBySlug(route.params.id))

onMounted(async () => {
  if (project.value) return
  try {
    await projectStore.loadProject(route.params.id)
  } catch (error) {
    loadError.value = error.message
  } finally {
    loading.value = false
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
