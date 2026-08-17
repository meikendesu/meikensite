<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import PageHeader from '../components/PageHeader.vue'
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
    <template v-if="project && hasContent">
      <section class="page-hero compact">
        <h1>{{ project.name }}</h1>
        <p class="hero-copy">{{ t('projects.publishedAt') }} {{ project.publishedAt }} · {{ t('projects.updatedAt') }} {{ project.updatedAt }}</p>
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
