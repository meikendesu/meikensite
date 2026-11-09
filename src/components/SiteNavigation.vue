<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { locale, t } from '../i18n'

const props = defineProps<{ admin: boolean }>()
const route = useRoute()
const activeSection = ref('home')
const links = ref<HTMLElement | null>(null)
const indicator = ref<Record<string, string>>({ opacity: '0' })
let resizeObserver: ResizeObserver | undefined
function updateIndicator() {
  const active = links.value?.querySelector<HTMLElement>('a.active')
  indicator.value = active ? {
    opacity: '1', width: `${active.offsetWidth}px`, height: `${active.offsetHeight}px`,
    transform: `translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`
  } : { opacity: '0' }
}
const publicItems = [
  { id: 'home', key: 'nav.home', icon: 'fa-house' },
  { id: 'about', key: 'home.about', icon: 'fa-user' },
  { id: 'projects', key: 'home.projects', icon: 'fa-cubes' },
  { id: 'contact', key: 'home.contact', icon: 'fa-envelope' },
  { id: 'support', key: 'home.support', icon: 'fa-heart' }
]
const adminItems = [
  { id: 'overview', label: '内容总览', icon: 'fa-table-cells-large', to: '/admin' },
  { id: 'about', label: '关于内容', icon: 'fa-user', to: '/admin/about' },
  { id: 'projects', label: '项目文章', icon: 'fa-code', to: '/admin#admin-projects' },
  { id: 'contact', label: '联系方式', icon: 'fa-envelope', to: '/admin#admin-contact' },
  { id: 'donation', label: '捐助方式', icon: 'fa-heart', to: '/admin#admin-donation' }
]
const selected = computed(() => {
  if (route.path.startsWith('/projects')) return 'projects'
  return activeSection.value
})
function isAdminSelected(item: typeof adminItems[number]) {
  if (item.id === 'about') return route.path === '/admin/about'
  if (item.id === 'projects') return route.path.includes('/admin/projects') || route.hash === '#admin-projects'
  if (item.id === 'contact' || item.id === 'donation') return route.hash === '#admin-' + item.id
  return route.path === '/admin' && !route.hash
}
// 用一个被动滚动监听和 rAF 更新当前区块，不在滚动路径上反复渲染。
let frame = 0
function updateSection() {
  frame = 0
  if (props.admin || route.path !== '/') return
  let current = 'home'
  for (const item of publicItems) {
    const element = document.getElementById(item.id)
    if (element && element.getBoundingClientRect().top <= Math.min(window.innerHeight * 0.32, 240)) current = item.id
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 12) current = 'support'
  activeSection.value = current
}
function onScroll() { if (!frame) frame = window.requestAnimationFrame(updateSection) }
watch(() => route.fullPath, () => {
  if (route.hash) activeSection.value = route.hash.slice(1)
  else activeSection.value = 'home'
})
watch([selected, () => route.fullPath, locale], () => nextTick(updateIndicator), { flush: 'post' })
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  updateSection()
  updateIndicator()
  if (links.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(links.value)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
})
</script>

<template>
  <aside class="site-sidebar">
    <router-link class="sidebar-brand" to="/" aria-label="MEIKEN">
      <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
        <defs><linearGradient id="brand-blue" x1="0" x2="1" y2="1"><stop stop-color="#007aff"/><stop offset=".5" stop-color="#58b8ff"/><stop offset="1" stop-color="#b2dfff"/></linearGradient></defs>
        <path d="M9 36V14c0-3 4-4 6-1l9 14 9-14c2-3 6-2 6 1v22" fill="none" stroke="url(#brand-blue)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>MEIKEN<small v-if="admin">ADMIN</small></span>
    </router-link>
    <nav ref="links" class="sidebar-links" :class="{ 'has-indicator': indicator.opacity === '1' }" :aria-label="admin ? '管理导航' : t('a11y.navigation')">
      <span class="nav-indicator" :style="indicator" aria-hidden="true"></span>
      <template v-if="admin">
        <router-link v-for="item in adminItems" :key="item.id" :to="item.to" :class="{ active: isAdminSelected(item) }" :aria-current="isAdminSelected(item) ? 'page' : undefined">
          <i class="fa-solid" :class="item.icon" aria-hidden="true"></i><span>{{ item.label }}</span>
        </router-link>
      </template>
      <template v-else>
        <router-link v-for="item in publicItems" :key="item.id" :to="{ path: '/', hash: '#' + item.id }" :class="{ active: selected === item.id }" :aria-current="selected === item.id ? 'location' : undefined">
          <i class="fa-solid" :class="item.icon" aria-hidden="true"></i><span>{{ t(item.key) }}</span>
        </router-link>
      </template>
    </nav>
    <router-link v-if="admin" class="sidebar-return" to="/"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> 查看网站</router-link>
  </aside>
</template>
