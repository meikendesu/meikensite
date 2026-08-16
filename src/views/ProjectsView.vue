<script setup>
import { ref, onMounted, inject } from 'vue'
import { t } from '../i18n/index.js'
import { ProjectStoreKey } from '../data/projects.js'

const projectStore = inject(ProjectStoreKey)
const { projects } = projectStore
const loadError = ref('')

// 预设柔和色相（蓝/绿/橙/粉/紫/黄/青/红），随机分配
const HUES = [210, 150, 30, 340, 270, 50, 190, 10]
const colors = ref({})

onMounted(async () => {
  try {
    await projectStore.loadProjects()
  } catch (error) {
    loadError.value = error.message
  }
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const shuffled = [...HUES].sort(() => Math.random() - 0.5)
  projects.forEach((p, i) => {
    const hue = shuffled[i % shuffled.length]
    colors.value[p.id] = isDark
      ? { background: `hsla(${hue}, 45%, 26%, 0.6)`, color: `hsl(${hue}, 70%, 78%)` }
      : { background: `hsla(${hue}, 78%, 92%, 0.8)`, color: `hsl(${hue}, 44%, 30%)` }
  })
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
        :style="colors[p.id]"
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
