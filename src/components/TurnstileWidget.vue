<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const props = defineProps<{ siteKey: string; action: string }>()
const emit = defineEmits<{
  verified: [token: string]
  expired: []
  error: []
}>()

const container = ref<HTMLElement | null>(null)
let widgetId: string | null = null
let scriptPromise: Promise<TurnstileApi> | null = null

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-meiken-turnstile]')
    const script = existing || document.createElement('script')
    const handleLoad = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile 未加载。'))
    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', () => reject(new Error('Turnstile 脚本加载失败。')), { once: true })
    if (!existing) {
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.meikenTurnstile = 'true'
      document.head.appendChild(script)
    }
  })
  return scriptPromise
}

function reset() {
  if (widgetId && window.turnstile) window.turnstile.reset(widgetId)
}

defineExpose({ reset })

onMounted(async () => {
  try {
    const turnstile = await loadTurnstile()
    if (!container.value) return
    widgetId = turnstile.render(container.value, {
      sitekey: props.siteKey,
      action: props.action,
      theme: 'auto',
      callback: (token: string) => emit('verified', token),
      'expired-callback': () => emit('expired'),
      'error-callback': () => emit('error')
    })
  } catch {
    emit('error')
  }
})

onBeforeUnmount(() => {
  if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
  widgetId = null
})
</script>

<template>
  <div ref="container" class="turnstile-widget" aria-label="人机验证"></div>
</template>
