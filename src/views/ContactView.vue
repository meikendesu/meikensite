<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { locale, t } from '../i18n'
import { SiteMethodStoreKey } from '../data/siteMethods'
import type { SiteMethod } from '../types'
import { beginPageLoading } from '../data/pageLoading'

const store = inject(SiteMethodStoreKey)
const error = ref('')
const note = ref('')
const methods = computed(() => store.methods.value.filter((method) => method.category === 'contact'))

function methodHref(method: SiteMethod) {
  if (method.actionType === 'email') return `mailto:${method.value}`
  if (method.actionType === 'link') return method.value
  return null
}

async function copyValue(method: SiteMethod) {
  try {
    await navigator.clipboard.writeText(method.value)
    note.value = t('common.copied')
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
  <section id="contact" class="home-section contact-section" aria-labelledby="contact-title">
    <h2 id="contact-title">{{ t('home.contact') }}</h2>
    <div class="section-heading">
      <h3>{{ t('contact.title') }}</h3>
      <p class="hero-copy">{{ t('contact.heroCopy') }}</p>
    </div>
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
    <p v-if="note" class="form-message success" role="status">{{ note }}</p>
  </section>
</template>
