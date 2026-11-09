<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteNavigation from './components/SiteNavigation.vue'
import LocaleSwitcher from './components/LocaleSwitcher.vue'
import { locale, t } from './i18n'
import { finishInitialPageLoading, pageLoading } from './data/pageLoading'
import { enterPage, installSiteMotion } from './motion/siteMotion'

const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))
const hideNavigation = computed(() => route.meta.hideNavigation === true)
const layout = ref<HTMLElement | null>(null)
let stopMotion: (() => void) | undefined
watch(locale, () => {
  if (typeof route.meta.titleKey === 'string') document.title = t(route.meta.titleKey)
})
onMounted(() => {
  if (layout.value) stopMotion = installSiteMotion(layout.value)
  window.requestAnimationFrame(finishInitialPageLoading)
})
onBeforeUnmount(() => stopMotion?.())
</script>

<template>
  <a class="skip-link" href="#main">{{ t('a11y.skip') }}</a>
  <div ref="layout" class="site-layout" :class="{ 'admin-layout': isAdmin, 'standalone-layout': hideNavigation }">
    <SiteNavigation v-if="!hideNavigation" :admin="isAdmin" />
    <div class="site-workspace">
      <header class="site-topbar">
        <router-link to="/" class="site-wordmark" aria-label="MEIKEN">MEIKEN</router-link>
        <span v-if="isAdmin" class="workspace-label">内容管理</span>
        <LocaleSwitcher v-else />
      </header>
      <router-view v-slot="{ Component }">
        <Transition :css="false" @enter="enterPage">
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </div>
  </div>
  <transition name="loader-fade">
    <div v-if="pageLoading" class="page-loading" role="status" aria-live="polite" :aria-label="t('a11y.pageLoading')">
      <span class="page-loading-ring" aria-hidden="true"></span>
    </div>
  </transition>
</template>
