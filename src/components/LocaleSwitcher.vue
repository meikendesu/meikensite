<script setup>
import { ref, computed } from 'vue'
import { locale, setLocale } from '../i18n/index.js'

const options = [
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
function choose(code) {
  setLocale(code)
  open.value = false
}
</script>

<template>
  <div v-if="open" class="locale-backdrop" @click="open = false"></div>
  <div class="locale-switcher">
    <button class="locale-btn" type="button" :aria-expanded="open" @click="toggle">
      <i class="fa-solid fa-globe"></i>{{ current.short }}
    </button>
    <div v-if="open" class="locale-menu" role="menu">
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
  </div>
</template>

<style>
.locale-switcher {
  position: relative;
  display: inline-flex;
}
.locale-backdrop {
  position: fixed;
  inset: 0;
  z-index: 8;
  background: transparent;
}
.locale-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid var(--separator);
  background: var(--bg-control);
  color: var(--label-1);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.locale-btn:hover {
  background: var(--fill);
}
.locale-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  z-index: 9;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 128px;
  padding: 6px;
  border: 1px solid var(--separator);
  border-radius: 12px;
  background: var(--bg-window);
  box-shadow: var(--shadow-2);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
}
.locale-menu button {
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--label-1);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
}
.locale-menu button:hover {
  background: var(--fill);
}
.locale-menu button.active {
  color: var(--accent);
  font-weight: 600;
}
</style>
