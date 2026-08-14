<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import PageHeader from '../components/PageHeader.vue'
import { t } from '../i18n/index.js'
import { getProjectById } from '../data/projects.js'

const route = useRoute()
const project = computed(() => getProjectById(route.params.id))

const md = new MarkdownIt({ html: true, linkify: true })
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
        <a class="work-btn" href="#" :aria-label="`${t('common.downloadApp')}：${project.name}`"
          ><i class="fa-solid fa-download"></i> {{ t('common.downloadApp') }}</a
        >
      </div>
    </template>
    <template v-else>
      <section class="page-hero compact">
        <p class="overline">404 / NOT FOUND</p>
        <h1>{{ t('detail.notFound') }}</h1>
        <p class="hero-copy">{{ t('detail.notFoundDesc') }}</p>
      </section>
    </template>
  </main>
</template>
