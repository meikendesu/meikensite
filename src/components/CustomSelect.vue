<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type SelectValue = string | number
interface SelectOption { value: SelectValue; label: string; icon?: string }

const props = withDefaults(defineProps<{
  modelValue?: SelectValue
  options: SelectOption[]
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  placeholder: '请选择',
  ariaLabel: '选择选项',
  disabled: false
})
const emit = defineEmits<{ 'update:modelValue': [value: SelectValue] }>()
const root = ref<HTMLElement | null>(null)
const open = ref(false)
const selected = computed(() => props.options.find((option) => option.value === props.modelValue))

function toggle() {
  if (!props.disabled) open.value = !open.value
}

function choose(value: SelectValue) {
  emit('update:modelValue', value)
  open.value = false
}

function closeOnOutside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

function closeOnEscape(event: KeyboardEvent) {
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
