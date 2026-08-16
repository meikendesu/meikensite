<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'
import { locale, t } from './i18n'

// 根组件：skip-link + 路由出口（带淡入淡出过渡）+ 全局底部导航。
// TabBar 提到此处统一渲染，使每个视图保持单根节点（<transition> 要求单根）。
const route = useRoute()

// 语言切换时同步更新页面标题
watch(locale, () => {
  if (typeof route.meta?.titleKey === 'string') document.title = t(route.meta.titleKey)
})

// TabBar 滚动自动隐藏/显示：向下滚动隐藏，向上滚动显示
const tabbarHidden = ref(false)
let lastScrollY = 0

function onScroll() {
  const y = window.scrollY
  const delta = y - lastScrollY
  if (Math.abs(delta) < 8) return // 阈值，避免轻微滚动闪烁
  tabbarHidden.value = delta > 0
  lastScrollY = y
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <a class="skip-link" href="#main">{{ t('a11y.skip') }}</a>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
  <TabBar v-if="route.meta.tabbar" :class="{ 'tabbar-hidden': tabbarHidden }" />
</template>
