<script setup lang="ts">
import { ref, onMounted, inject, watch } from 'vue'
import { locale, t } from '../i18n'
import { ProjectStoreKey } from '../data/projects'
import { beginPageLoading } from '../data/pageLoading'
import type { Project } from '../types'

const projectStore = inject(ProjectStoreKey)!
const { projects, pagination } = projectStore
const loadError = ref('')

// 预设柔和色相（蓝/绿/橙/粉/紫/黄/青/红），按项目稳定分配，避免刷新变色与布局闪动。
const HUES = [210, 150, 30, 340, 270, 50, 190, 10]

function projectStyle(project: Project) {
  const seed = String(project.slug || project.id).split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return { '--card-hue': HUES[seed % HUES.length] }
}

async function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) return
  const finishLoading = beginPageLoading()
  loadError.value = ''
  try {
    await projectStore.loadProjects(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : t('projects.listLoadFailed')
  } finally {
    finishLoading()
  }
}

onMounted(async () => {
  const finishLoading = beginPageLoading()
  try {
    await projectStore.loadProjects(1)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : t('projects.listLoadFailed')
  } finally {
    finishLoading()
  }
})

watch(locale, async () => {
  const finishLoading = beginPageLoading()
  loadError.value = ''
  try {
    await projectStore.loadProjects(pagination.value.page, true)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : t('projects.listLoadFailed')
  } finally {
    finishLoading()
  }
})
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell editorial-shell">
    <section class="page-hero compact">
      <h1>{{ t('projects.title1') }}<br />{{ t('projects.title2') }}</h1>
    </section>
    <section class="project-stack">
      <article
        v-for="p in projects"
        :key="p.id"
        class="work-card"
        :style="projectStyle(p)"
      >
        <img
          v-if="p.coverUrl"
          class="project-card-cover"
          :src="p.coverUrl"
          :alt="`${p.name} · ${t('projects.coverImage')}`"
          loading="lazy"
          decoding="async"
        />
        <span class="work-tag">{{ p.tag }}</span>
        <h2>{{ p.name }}</h2>
        <p class="work-desc">{{ p.desc }}</p>
        <p class="work-meta">{{ t('projects.publishedAt') }} {{ p.publishedAt }} · {{ t('projects.updatedAt') }} {{ p.updatedAt }}</p>
        <div class="work-actions">
          <router-link
            class="work-btn"
            :to="`/projects/${p.slug}`"
            :aria-label="`${t('common.viewProject')}：${p.name}`"
            ><i class="fa-solid fa-eye"></i> {{ t('common.viewProject') }}</router-link
          >
        </div>
      </article>
    </section>
    <nav v-if="pagination.totalPages > 1" class="project-pagination" :aria-label="t('projects.pagination')">
      <button type="button" :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">
        <i class="fa-solid fa-chevron-left"></i> {{ t('projects.previous') }}
      </button>
      <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
      <button type="button" :disabled="pagination.page >= pagination.totalPages" @click="goToPage(pagination.page + 1)">
        {{ t('projects.next') }} <i class="fa-solid fa-chevron-right"></i>
      </button>
    </nav>
    <p v-if="loadError" class="form-message error" role="alert">{{ loadError }}</p>
  </main>
</template>
