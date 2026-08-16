<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import icons from '../data/freeFontAwesomeIcons.js'

const props = defineProps({ modelValue: { type: String, default: 'fa-solid fa-link' } })
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const query = ref('')
const visibleCount = ref(120)
const searchInput = ref(null)
const root = ref(null)
const selected = computed(() => icons.find(([className]) => className === props.modelValue))
const filtered = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return icons
  return icons.filter(([className, label]) => `${className} ${label}`.toLowerCase().includes(term))
})
const visibleIcons = computed(() => filtered.value.slice(0, visibleCount.value))

watch(query, () => (visibleCount.value = 120))

async function toggle() {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    searchInput.value?.focus()
  }
}

function choose(className) {
  emit('update:modelValue', className)
  open.value = false
}

function closeOnOutside(event) {
  if (!root.value?.contains(event.target)) open.value = false
}

function closeOnEscape(event) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', closeOnOutside)
  document.addEventListener('keydown', closeOnEscape)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeOnOutside)
  document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <div ref="root" class="icon-picker">
    <button class="icon-picker-trigger" type="button" aria-haspopup="dialog" :aria-expanded="open" @click="toggle">
      <span class="icon-picker-current"><i :class="modelValue"></i></span>
      <span><strong>{{ selected?.[1] || '自定义图标' }}</strong><small>{{ modelValue }}</small></span>
      <i class="fa-solid fa-chevron-down"></i>
    </button>
    <transition name="dropdown-pop">
      <section v-if="open" class="icon-picker-panel" role="dialog" aria-label="选择 Font Awesome 免费图标">
        <div class="icon-picker-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input ref="searchInput" v-model="query" type="search" placeholder="搜索图标名称或类名…" />
          <button type="button" aria-label="关闭图标选择器" @click="open = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="icon-picker-count">{{ filtered.length }} 个免费图标</p>
        <div class="icon-picker-grid">
          <button
            v-for="[className, label] in visibleIcons"
            :key="className"
            type="button"
            :class="{ selected: className === modelValue }"
            :title="`${label} · ${className}`"
            :aria-label="label"
            @click="choose(className)"
          ><i :class="className"></i><span>{{ label }}</span></button>
        </div>
        <button v-if="visibleIcons.length < filtered.length" class="icon-picker-more" type="button" @click="visibleCount += 120">
          显示更多（{{ filtered.length - visibleIcons.length }}）
        </button>
        <p v-if="!filtered.length" class="form-message">没有找到匹配图标。</p>
      </section>
    </transition>
  </div>
</template>
