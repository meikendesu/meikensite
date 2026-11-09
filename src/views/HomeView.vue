<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { locale, t } from '../i18n'
import { ProjectStoreKey } from '../data/projects'
import { pageLoading } from '../data/pageLoading'
import AboutView from './AboutView.vue'
import ContactView from './ContactView.vue'
import SupportView from './SupportView.vue'

const store = inject(ProjectStoreKey)!
const route = useRoute()
const initialHash = route.hash
let initialAnchorHandled = false
// 从项目页返回主页时，等各区块完成加载后再校准首次锚点位置。
watch(pageLoading, async loading => {
  if (loading || initialAnchorHandled || !initialHash || route.hash !== initialHash) return
  initialAnchorHandled = true
  await nextTick()
  if (['#home', '#about', '#projects', '#contact', '#support'].includes(initialHash)) {
    document.getElementById(initialHash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }
})
const featured = computed(() => store.projects.value.filter(project => project.published).slice(0, 3))
const error = ref('')
async function loadProjects() {
  error.value = ''
  try { await store.loadProjects(1) }
  catch (requestError) { error.value = requestError instanceof Error ? requestError.message : t('projects.listLoadFailed') }
}
onMounted(loadProjects)
watch(locale, loadProjects)
</script>

<template>
  <main id="main" tabindex="-1" class="home-page">
    <section id="home" class="home-hero" aria-labelledby="home-title">
      <div class="hero-copy-block">
        <h1 id="home-title">{{ t('home.hello') }}<br />{{ t('home.iAm') }} <span>MEIKEN</span></h1>
        <p>{{ t('home.subtitle') }}</p>
        <div class="hero-actions">
          <router-link class="primary-button" to="/#projects">{{ t('home.explore') }} <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></router-link>
          <router-link class="secondary-button" to="/#contact">{{ t('home.contact') }} <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></router-link>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true"><img src="/images/meiken-ribbon.webp" alt="" width="1200" height="800" fetchpriority="high" /></div>
    </section>
    <AboutView />
    <section id="projects" class="home-section featured-section" aria-labelledby="featured-title">
      <div class="section-heading"><h2 id="featured-title">{{ t('home.projects') }}</h2><p>{{ t('projects.title1') }}{{ t('projects.title2') }}</p></div>
      <div class="featured-list">
        <router-link v-for="project in featured" :key="project.slug" class="featured-project" :to="'/projects/' + project.slug">
          <img v-if="project.coverUrl || project.slug === 'wawawa'" :src="project.coverUrl || '/images/wawawa-watch.webp'" :alt="project.name + ' · ' + t('projects.coverImage')" width="900" height="600" loading="lazy" />
          <div v-else class="project-art-placeholder" aria-hidden="true"><i class="fa-solid fa-code"></i></div>
          <div class="featured-project-copy"><span v-if="project.tag" class="work-tag">{{ project.tag }}</span><h3>{{ project.name }}</h3><p>{{ project.desc }}</p><span class="text-action">{{ t('common.viewProject') }} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></div>
        </router-link>
      </div>
      <p v-if="error" class="form-message error" role="alert">{{ error }} <button class="text-button" type="button" @click="loadProjects">{{ t('common.retry') }}</button></p>
      <p v-else-if="!featured.length" class="empty-message">{{ t('home.noProjects') }}</p>
      <router-link class="primary-button more-projects" to="/projects-list">{{ t('home.moreProjects') }} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></router-link>
    </section>
    <ContactView />
    <SupportView />
    <footer class="site-footer"><span>{{ t('home.footer') }}</span><router-link to="/#home">{{ t('home.backTop') }} <i class="fa-solid fa-arrow-up" aria-hidden="true"></i></router-link></footer>
  </main>
</template>
