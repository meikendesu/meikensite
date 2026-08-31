<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { locale, t } from '../i18n'
import { SiteMethodStoreKey } from '../data/siteMethods'
import type { SiteMethod } from '../types'
import { beginPageLoading } from '../data/pageLoading'

const store = inject(SiteMethodStoreKey)
const methods = computed(() => store.methods.value.filter((method) => method.category === 'donation'))
const note = ref('')
const show = ref(false)
const activeQr = ref<SiteMethod | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

function showNote(message: string) {
  note.value = message
  show.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => (show.value = false), 3200)
}

async function useMethod(method: SiteMethod) {
  if (method.value.includes('待填写')) {
    showNote(`${method.name} ${t('support.methodUnset')}`)
    return
  }
  if (method.actionType === 'link') {
    window.open(method.value, '_blank', 'noopener,noreferrer')
    return
  }
  try {
    await navigator.clipboard.writeText(method.value)
    showNote(`${method.name} ${t('support.addressCopied')}`)
  } catch {
    showNote(t('support.copyFailed'))
  }
}

async function loadMethods(force = false) {
  const finishPageLoading = beginPageLoading()
  try {
    await store.loadMethods('donation', force)
  } catch (requestError) {
    showNote(requestError instanceof Error ? requestError.message : t('support.loadFailed'))
  } finally {
    finishPageLoading()
  }
}

onMounted(() => loadMethods())
watch(locale, () => loadMethods(true))
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell editorial-shell">
    <section class="page-hero">
      <h1>{{ t('support.title') }}</h1>
      <p class="hero-copy">{{ t('support.heroCopy') }}</p>
    </section>
    <section class="payment-list" :aria-label="t('support.paymentMethods')">
      <article v-for="method in methods" :key="method.id" class="payment-card" :class="method.methodKey">
        <div class="payment-heading">
          <span class="payment-icon"><i :class="method.icon"></i></span>
          <div><h2>{{ method.name }}</h2><p>{{ method.description }}</p></div>
        </div>
        <button v-if="method.qrEnabled" class="qr-show-btn" type="button" @click="activeQr = method">
          <i class="fa-solid fa-qrcode"></i> {{ t('support.showQr') }}
        </button>
        <div class="wallet-line">
          <code>{{ method.value }}</code>
          <button type="button" @click="useMethod(method)">
            <i :class="method.actionType === 'link' ? 'fa-solid fa-arrow-up-right-from-square' : 'fa-regular fa-copy'"></i>
            {{ method.actionType === 'link' ? t('common.open') : t('common.copy') }}
          </button>
        </div>
      </article>
    </section>

    <div v-if="activeQr" class="qr-modal" role="dialog" aria-modal="true" @click.self="activeQr = null">
      <div class="qr-modal-box">
        <img class="qr-modal-img" :src="`/api/site-methods/${activeQr.id}/qr`" :alt="`${activeQr.name} ${t('support.qrCode')}`" />
        <p class="qr-modal-title">{{ activeQr.name }}</p>
      </div>
    </div>
    <div class="support-note" :class="{ show }" role="status" aria-live="polite">{{ note }}</div>
  </main>
</template>
