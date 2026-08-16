<script setup lang="ts">
import { ref, computed } from 'vue'
import { locale, setLocale, t } from '../i18n'
import type { Locale } from '../types'

const options: Array<{ code: Locale; label: string; short: string }> = [
  { code: 'zh-CN', label: '简体中文', short: '简' },
  { code: 'zh-TW', label: '繁體中文', short: '繁' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語', short: '日' }
]

const current = computed(() => options.find((o) => o.code === locale.value) || options[0])
const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}
function choose(code: Locale) {
  setLocale(code)
  menuOpen.value = false
}
</script>

<template>
  <div v-if="menuOpen" class="lang-backdrop" @click="menuOpen = false"></div>
  <nav class="tabbar" aria-label="页面导航">
    <router-link to="/" exact-active-class="active"
      ><i class="fa-solid fa-house"></i>{{ t('nav.home') }}</router-link
    ><div class="tabbar-spacer"></div>
    <router-link to="/about" exact-active-class="active"
      ><i class="fa-solid fa-circle-info"></i>{{ t('nav.about') }}</router-link
    ><router-link to="/projects" exact-active-class="active"
      ><i class="fa-solid fa-code"></i>{{ t('nav.projects') }}</router-link
    ><router-link to="/contact" exact-active-class="active"
      ><i class="fa-solid fa-message"></i>{{ t('nav.contact') }}</router-link
    ><router-link to="/support" exact-active-class="active"
      ><i class="fa-solid fa-hand-holding-dollar"></i>{{ t('nav.support') }}</router-link
    ><button
      class="lang-btn"
      type="button"
      aria-label="Language"
      :aria-expanded="menuOpen"
      @click="toggleMenu"
      ><i class="fa-solid fa-globe"></i>{{ current.short }}</button
    >
    <div v-if="menuOpen" class="lang-menu" role="menu">
      <button
        v-for="o in options"
        :key="o.code"
        type="button"
        role="menuitem"
        :class="{ active: locale === o.code }"
        @click="choose(o.code)"
      >
        {{ o.label }}
      </button>
    </div>
  </nav>
</template>
