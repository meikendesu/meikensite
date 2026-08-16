<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { locale, t } from '../i18n'
import { AboutStoreKey } from '../data/about'
import { beginPageLoading } from '../data/pageLoading'

const store = inject(AboutStoreKey)!
const loadError = ref('')
const content = computed(() => store.getAbout(locale.value) || {
  locale: locale.value,
  heroTitleLine1: t('about.title1'),
  heroTitleLine2: t('about.title2'),
  heroCopy: t('about.heroCopy'),
  introHeading: t('about.introHeading'),
  introParagraph1: t('about.p1'),
  introParagraph2: t('about.p2'),
  facts: [
    { label: t('about.fact1Label'), value: t('about.fact1Value') },
    { label: t('about.fact2Label'), value: t('about.fact2Value') },
    { label: t('about.fact3Label'), value: t('about.fact3Value') }
  ]
})

async function loadContent() {
  const finishLoading = beginPageLoading()
  loadError.value = ''
  try {
    await store.loadAbout(locale.value)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '关于页面内容加载失败。'
  } finally {
    finishLoading()
  }
}

onMounted(loadContent)
watch(locale, loadContent)
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell">
    <section class="page-hero">
      <p class="overline">ABOUT</p>
      <h1>{{ content.heroTitleLine1 }}<br />{{ content.heroTitleLine2 }}</h1>
      <p class="hero-copy">{{ content.heroCopy }}</p>
    </section>
    <section class="content-block">
      <h2>{{ content.introHeading }}</h2>
      <p>{{ content.introParagraph1 }}</p>
      <p>{{ content.introParagraph2 }}</p>
    </section>
    <section class="facts-list">
      <div v-for="(fact, index) in content.facts" :key="`${index}-${fact.label}`">
        <span>{{ fact.label }}</span><b>{{ fact.value }}</b>
      </div>
    </section>
    <p v-if="loadError" class="form-message error" role="alert">{{ loadError }}</p>
  </main>
</template>
