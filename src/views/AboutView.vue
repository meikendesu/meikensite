<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { locale, t } from '../i18n'
import { AboutStoreKey } from '../data/about'
import { beginPageLoading } from '../data/pageLoading'

const store = inject(AboutStoreKey)!
const loadError = ref('')
const content = computed(() => store.getAbout(locale.value))

async function loadContent() {
  const finishLoading = beginPageLoading()
  loadError.value = ''
  try {
    await store.loadAbout(locale.value)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : t('about.loadFailed')
  } finally {
    finishLoading()
  }
}

onMounted(loadContent)
watch(locale, loadContent)
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell editorial-shell about-shell">
    <template v-if="content">
      <section class="page-hero">
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
    </template>
    <p v-if="loadError" class="form-message error" role="alert">{{ loadError }}</p>
  </main>
</template>
