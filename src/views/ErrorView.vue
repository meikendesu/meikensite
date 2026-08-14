<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { t } from '../i18n/index.js'

const route = useRoute()

const KEY_MAP = {
  404: { title: 'error.notFoundTitle', desc: 'error.notFoundDesc' },
  500: { title: 'error.serverTitle', desc: 'error.serverDesc' },
  403: { title: 'error.forbiddenTitle', desc: 'error.forbiddenDesc' }
}

const code = computed(() => Number(route.meta?.code) || 404)
const key = computed(() => KEY_MAP[code.value] || KEY_MAP[404])
</script>

<template>
  <main id="main" tabindex="-1" class="shell error-shell">
    <div class="error-box">
      <p class="error-code">{{ code }}</p>
      <h1>{{ t(key.title) }}</h1>
      <p class="error-desc">{{ t(key.desc) }}</p>
      <router-link class="error-home" to="/">{{ t('error.backHome') }}</router-link>
    </div>
  </main>
</template>
