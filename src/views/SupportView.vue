<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { locale, t } from '../i18n'
import { SiteMethodStoreKey } from '../data/siteMethods'
import type { SiteMethod } from '../types'
import { beginPageLoading } from '../data/pageLoading'

const store = inject(SiteMethodStoreKey)
const methods = computed(() => store.methods.value.filter((method) => method.category === 'donation'))
const note = ref('')
const show = ref(false)
const activeQr = ref<SiteMethod | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
function isUnset(method: SiteMethod) { return !method.value.trim() || method.value.includes('待填写') }
async function openQr(method: SiteMethod) {
  activeQr.value = method
  await nextTick()
  dialog.value?.showModal()
}
let timer: ReturnType<typeof setTimeout> | undefined

function showNote(message: string) {
  note.value = message
  show.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => (show.value = false), 3200)
}

async function useMethod(method: SiteMethod) {
  if (isUnset(method)) {
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
  <section id="support" class="home-section support-section" aria-labelledby="support-title">
    <div class="support-heading">
      <h2 id="support-title">{{ t('home.support') }}</h2>
      <h3>{{ t('support.title') }}</h3>
      <p class="hero-copy">{{ t('support.heroCopy') }}</p>
    </div>
    <div class="payment-list" :aria-label="t('support.paymentMethods')">
      <article v-for="method in methods" :key="method.id" class="payment-card" :class="method.methodKey">
        <div class="payment-heading">
          <span class="payment-icon"><i :class="method.icon"></i></span>
          <div><h3>{{ method.name }}</h3><p>{{ method.description }}</p></div>
        </div>
        <button v-if="method.qrEnabled && !isUnset(method)" class="qr-show-btn" type="button" @click="openQr(method)">
          <i class="fa-solid fa-qrcode"></i> {{ t('support.showQr') }}
        </button>
        <p v-if="isUnset(method)" class="payment-unset">{{ t('support.methodUnset') }}</p>
        <div v-else class="wallet-line">
          <code>{{ method.value }}</code>
          <button type="button" @click="useMethod(method)">
            <i :class="method.actionType === 'link' ? 'fa-solid fa-arrow-up-right-from-square' : 'fa-regular fa-copy'"></i>
            {{ method.actionType === 'link' ? t('common.open') : t('common.copy') }}
          </button>
        </div>
      </article>
    </div>

    <dialog ref="dialog" class="qr-modal" :aria-label="t('support.qrCode')" @close="activeQr = null" @click="($event.target === dialog) && dialog?.close()">
      <template v-if="activeQr">
      <div class="qr-modal-box">
        <button class="dialog-close" type="button" :aria-label="t('common.close')" @click="dialog?.close()"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        <img class="qr-modal-img" :src="`/api/site-methods/${activeQr.id}/qr`" :alt="`${activeQr.name} ${t('support.qrCode')}`" />
        <p class="qr-modal-title">{{ activeQr.name }}</p>
      </div>
      </template>
    </dialog>
    <div class="support-note" :class="{ show }" role="status" aria-live="polite">{{ note }}</div>
  </section>
</template>
