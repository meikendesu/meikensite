<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteNavigation from './components/SiteNavigation.vue'
import LocaleSwitcher from './components/LocaleSwitcher.vue'
import { locale, t } from './i18n'
import { finishInitialPageLoading, pageLoading } from './data/pageLoading'

const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))
const hideNavigation = computed(() => route.meta.hideNavigation === true)
watch(locale, () => {
  if (typeof route.meta.titleKey === 'string') document.title = t(route.meta.titleKey)
})
onMounted(() => window.requestAnimationFrame(finishInitialPageLoading))
</script>

<template>
  <a class="skip-link" href="#main">{{ t('a11y.skip') }}</a>
  <div class="site-layout" :class="{ 'admin-layout': isAdmin, 'standalone-layout': hideNavigation }">
    <SiteNavigation v-if="!hideNavigation" :admin="isAdmin" />
    <div class="site-workspace">
      <header class="site-topbar">
        <router-link to="/" class="site-wordmark" aria-label="MEIKEN">MEIKEN</router-link>
        <span v-if="isAdmin" class="workspace-label">内容管理</span>
        <LocaleSwitcher v-else />
      </header>
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="route.path" />
      </router-view>
    </div>
  </div>
  <transition name="loader-fade">
    <div v-if="pageLoading" class="page-loading" role="status" aria-live="polite" :aria-label="t('a11y.pageLoading')">
      <span class="page-loading-ring" aria-hidden="true"></span>
    </div>
  </transition>
</template>
