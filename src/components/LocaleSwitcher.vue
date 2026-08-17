<script setup lang="ts">
import { ref, computed } from 'vue'
import { locale, setLocale, t } from '../i18n'
import { beginPageLoading } from '../data/pageLoading'
import type { Locale } from '../types'

const options: Array<{ code: Locale; label: string; short: string }> = [
  { code: 'zh-CN', label: '简体中文', short: '简' },
  { code: 'zh-TW', label: '繁體中文', short: '繁' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語', short: '日' }
]

const current = computed(() => options.find((o) => o.code === locale.value) || options[0])
const open = ref(false)
const switching = ref(false)
const error = ref('')

function toggle() {
  open.value = !open.value
}
async function choose(code: Locale) {
  if (switching.value || code === locale.value) {
    open.value = false
    return
  }
  const finishLoading = beginPageLoading()
  switching.value = true
  error.value = ''
  try {
    await setLocale(code)
    open.value = false
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : t('language.failed')
  } finally {
    switching.value = false
    finishLoading()
  }
}
</script>

<template>
  <div class="locale-switcher">
    <div v-if="open" class="lang-backdrop" @click="open = false"></div>
    <button
      class="locale-switcher-trigger"
      type="button"
      :aria-label="t('language.label')"
      :aria-expanded="open"
      @click="toggle"
    >
      <i class="fa-solid fa-globe"></i>{{ current.short }}
    </button>
    <div
      v-if="open"
      class="locale-switcher-menu"
      role="menu"
    >
      <button
        v-for="o in options"
        :key="o.code"
        type="button"
        role="menuitem"
        :disabled="switching"
        :class="{ active: locale === o.code }"
        @click="choose(o.code)"
      >
        {{ o.label }}
      </button>
    </div>
    <p v-if="error" class="locale-switcher-error" role="alert">{{ error }}</p>
  </div>
</template>
