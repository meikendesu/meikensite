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
  <section id="about" class="home-section about-section" aria-labelledby="about-title">
    <h2 id="about-title">{{ t('home.about') }}</h2>
    <template v-if="content">
      <div class="about-intro">
        <div><h3>{{ content.heroTitleLine1 }}<br />{{ content.heroTitleLine2 }}</h3><p v-if="content.heroCopy" class="about-caption">{{ content.heroCopy }}</p></div>
        <div class="about-prose"><h4>{{ content.introHeading }}</h4><p>{{ content.introParagraph1 }}</p><p v-if="content.introParagraph2">{{ content.introParagraph2 }}</p></div>
      </div>
      <div class="facts-list">
        <div v-for="(fact, index) in content.facts" :key="`${index}-${fact.label}`">
          <span>{{ fact.label }}</span><b>{{ fact.value }}</b>
        </div>
      </div>
    </template>
    <p v-if="loadError" class="form-message error" role="alert">{{ loadError }} <button class="text-button" type="button" @click="loadContent">{{ t('common.retry') }}</button></p>
  </section>
</template>
