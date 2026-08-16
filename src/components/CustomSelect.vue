<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  placeholder: { type: String, default: '请选择' },
  ariaLabel: { type: String, default: '选择选项' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
const root = ref(null)
const open = ref(false)
const selected = computed(() => props.options.find((option) => option.value === props.modelValue))

function toggle() {
  if (!props.disabled) open.value = !open.value
}

function choose(value) {
  emit('update:modelValue', value)
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
  <div ref="root" class="custom-dropdown" :class="{ open, disabled }">
    <button
      class="custom-dropdown-trigger"
      type="button"
      :disabled="disabled"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <span>{{ selected?.label || placeholder }}</span>
      <i class="fa-solid fa-chevron-down"></i>
    </button>
    <transition name="dropdown-pop">
      <div v-if="open" class="custom-dropdown-menu" role="listbox" :aria-label="ariaLabel">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          role="option"
          :aria-selected="option.value === modelValue"
          :class="{ selected: option.value === modelValue }"
          @click="choose(option.value)"
        >
          <i v-if="option.icon" :class="option.icon"></i>
          <span>{{ option.label }}</span>
          <i v-if="option.value === modelValue" class="fa-solid fa-check"></i>
        </button>
      </div>
    </transition>
  </div>
</template>
