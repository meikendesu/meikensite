<script setup lang="ts">
import { ref, computed } from 'vue'
import { locale, setLocale } from '../i18n'
import type { Locale } from '../types'

const options: Array<{ code: Locale; label: string; short: string }> = [
  { code: 'zh-CN', label: '简体中文', short: '简' },
  { code: 'zh-TW', label: '繁體中文', short: '繁' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語', short: '日' }
]

const current = computed(() => options.find((o) => o.code === locale.value) || options[0])
const open = ref(false)

function toggle() {
  open.value = !open.value
}
function choose(code: Locale) {
  setLocale(code)
  open.value = false
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-8 bg-transparent" @click="open = false"></div>
  <div class="relative inline-flex">
    <button
      class="inline-flex cursor-pointer items-center gap-[7px] rounded-full border border-separator bg-control px-4 py-2 font-[inherit] text-[13px] text-ink transition-colors duration-150 hover:bg-fill"
      type="button"
      :aria-expanded="open"
      @click="toggle"
    >
      <i class="fa-solid fa-globe"></i>{{ current.short }}
    </button>
    <div
      v-if="open"
      class="absolute right-0 bottom-[calc(100%+8px)] z-9 flex min-w-32 flex-col gap-0.5 rounded-xl border border-separator bg-[var(--bg-window)] p-1.5 shadow-floating backdrop-blur-3xl"
      role="menu"
    >
      <button
        v-for="o in options"
        :key="o.code"
        type="button"
        role="menuitem"
        class="cursor-pointer whitespace-nowrap rounded-lg border-0 bg-transparent px-3 py-2 text-left font-[inherit] text-[13px] hover:bg-fill"
        :class="locale === o.code ? 'font-semibold text-accent' : 'text-ink'"
        @click="choose(o.code)"
      >
        {{ o.label }}
      </button>
    </div>
  </div>
</template>
