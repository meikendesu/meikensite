<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { t } from '../i18n/index.js'
import { SiteMethodStoreKey } from '../data/siteMethods.js'

const store = inject(SiteMethodStoreKey)
const methods = computed(() => store.methods.value.filter((method) => method.category === 'donation'))
const note = ref('')
const show = ref(false)
const activeQr = ref(null)
let timer = null

function showNote(message) {
  note.value = message
  show.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (show.value = false), 3200)
}

async function useMethod(method) {
  if (method.value.includes('待填写')) {
    showNote(`${method.name} 收款信息尚未填写。`)
    return
  }
  if (method.actionType === 'link') {
    window.open(method.value, '_blank', 'noopener,noreferrer')
    return
  }
  try {
    await navigator.clipboard.writeText(method.value)
    showNote(`${method.name} 地址已复制。`)
  } catch {
    showNote('复制失败，请手动复制地址。')
  }
}

onMounted(() => store.loadMethods('donation').catch((requestError) => showNote(requestError.message)))
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell">
    <section class="page-hero">
      <p class="overline">DONATE</p>
      <h1>{{ t('support.title') }}</h1>
      <p class="hero-copy">{{ t('support.heroCopy') }}</p>
    </section>
    <section class="payment-list" aria-label="捐助方式">
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
            {{ method.actionType === 'link' ? '打开' : t('common.copy') }}
          </button>
        </div>
      </article>
    </section>

    <div v-if="activeQr" class="qr-modal" role="dialog" aria-modal="true" @click.self="activeQr = null">
      <div class="qr-modal-box">
        <button class="qr-modal-close" type="button" aria-label="关闭" @click="activeQr = null"><i class="fa-solid fa-xmark"></i></button>
        <img class="qr-modal-img" :src="`/api/site-methods/${activeQr.id}/qr`" :alt="`${activeQr.name} 收款二维码`" />
        <p class="qr-modal-title">{{ activeQr.name }}</p>
        <p class="qr-modal-hint">{{ t('support.modalHint') }}</p>
      </div>
    </div>
    <div class="support-note" :class="{ show }" role="status" aria-live="polite">{{ note }}</div>
  </main>
</template>
