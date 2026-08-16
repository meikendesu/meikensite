<script setup>
import { ref, onMounted, inject } from 'vue'
import { t } from '../i18n/index.js'
import { ProjectStoreKey } from '../data/projects.js'

const projectStore = inject(ProjectStoreKey)
const { projects } = projectStore
const loadError = ref('')

// 预设柔和色相（蓝/绿/橙/粉/紫/黄/青/红），按项目稳定分配，避免刷新变色与布局闪动。
const HUES = [210, 150, 30, 340, 270, 50, 190, 10]

function projectStyle(project) {
  const seed = String(project.slug || project.id).split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return { '--card-hue': HUES[seed % HUES.length] }
}

onMounted(async () => {
  try {
    await projectStore.loadProjects()
  } catch (error) {
    loadError.value = error.message
  }
})
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell">
    <section class="page-hero compact">
      <p class="overline">02 / PROJECT</p>
      <h1>{{ t('projects.title1') }}<br />{{ t('projects.title2') }}</h1>
    </section>
    <section class="project-stack">
      <article
        v-for="p in projects"
        :key="p.id"
        class="work-card"
        :style="projectStyle(p)"
      >
        <span class="work-tag">{{ p.tag }}</span>
        <h2>{{ p.name }}</h2>
        <p class="work-desc">{{ p.desc }}</p>
        <div class="work-actions">
          <router-link
            class="work-btn"
            :to="`/projects/${p.slug}`"
            :aria-label="`${t('common.viewProject')}：${p.name}`"
            ><i class="fa-solid fa-eye"></i> {{ t('common.viewProject') }}</router-link
          ><span
            class="work-btn work-btn-ghost work-btn-unavailable"
            role="status"
            :aria-label="`${t('common.downloadUnavailable')}：${p.name}`"
            ><i class="fa-solid fa-circle-info"></i> {{ t('common.downloadUnavailable') }}</span
          >
        </div>
      </article>
    </section>
    <p v-if="loadError" class="form-message error" role="alert">{{ loadError }}</p>
  </main>
</template>
