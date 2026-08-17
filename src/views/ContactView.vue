<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { locale, t } from '../i18n'
import { SiteMethodStoreKey } from '../data/siteMethods'
import type { SiteMethod } from '../types'
import { beginPageLoading } from '../data/pageLoading'

const store = inject(SiteMethodStoreKey)
const error = ref('')
const methods = computed(() => store.methods.value.filter((method) => method.category === 'contact'))

function methodHref(method: SiteMethod) {
  if (method.actionType === 'email') return `mailto:${method.value}`
  if (method.actionType === 'link') return method.value
  return null
}

async function copyValue(method: SiteMethod) {
  try {
    await navigator.clipboard.writeText(method.value)
  } catch {
    error.value = t('contact.copyFailed')
  }
}

async function loadMethods(force = false) {
  const finishPageLoading = beginPageLoading()
  error.value = ''
  try {
    await store.loadMethods('contact', force)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : t('contact.loadFailed')
  } finally {
    finishPageLoading()
  }
}

onMounted(() => loadMethods())
watch(locale, () => loadMethods(true))
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell">
    <section class="page-hero compact">
      <h1>{{ t('contact.title') }}</h1>
      <p class="hero-copy">{{ t('contact.heroCopy') }}</p>
    </section>
    <section class="contact-options">
      <a
        v-for="method in methods.filter(methodHref)"
        :key="method.id"
        class="contact-row"
        :href="methodHref(method)"
        :target="method.actionType === 'link' ? '_blank' : undefined"
        :rel="method.actionType === 'link' ? 'noopener noreferrer' : undefined"
      >
        <span class="row-icon"><i :class="method.icon"></i></span>
        <div><small>{{ method.description }}</small><strong>{{ method.name }}</strong></div>
        <b><i class="fa-solid fa-chevron-right"></i></b>
      </a>
      <button
        v-for="method in methods.filter((item) => !methodHref(item))"
        :key="method.id"
        class="contact-row contact-row-button"
        type="button"
        @click="copyValue(method)"
      >
        <span class="row-icon"><i :class="method.icon"></i></span>
        <div><small>{{ method.description }}</small><strong>{{ method.name }}</strong></div>
        <b><i class="fa-regular fa-copy"></i></b>
      </button>
    </section>
    <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
  </main>
</template>
