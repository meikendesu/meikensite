<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import { t } from '../i18n/index.js'
import { SiteMethodStoreKey } from '../data/siteMethods.js'

const store = inject(SiteMethodStoreKey)
const error = ref('')
const methods = computed(() => store.methods.value.filter((method) => method.category === 'contact'))

function methodHref(method) {
  if (method.actionType === 'email') return `mailto:${method.value}`
  if (method.actionType === 'link') return method.value
  return null
}

async function copyValue(method) {
  try {
    await navigator.clipboard.writeText(method.value)
  } catch {
    error.value = '复制失败，请手动复制。'
  }
}

onMounted(() => store.loadMethods('contact').catch((requestError) => (error.value = requestError.message)))
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell">
    <section class="page-hero compact">
      <p class="overline">CONTACT</p>
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
