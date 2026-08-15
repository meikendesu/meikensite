<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { t } from '../i18n/index.js'

// 上线前替换为公开收款地址；不要在仓库中保存钱包私钥或 PayPal 密钥。
const methods = [
  { id: 'usdt', name: 'USDT', desc: 'TRC20', value: '待填写 USDT 地址', icon: 'fa-solid fa-dollar-sign', qr: '/payment/usdt-qr.svg' },
  { id: 'eth', name: 'Ethereum', desc: 'ETH Mainnet', value: '待填写 ETH 地址', icon: 'fa-brands fa-ethereum' },
  { id: 'btc', name: 'Bitcoin', desc: 'BTC Mainnet', value: '待填写 BTC 地址', icon: 'fa-brands fa-bitcoin' },
  { id: 'paypal', name: 'PayPal', desc: 'PayPal.Me', value: '待填写 PayPal.Me 链接', icon: 'fa-brands fa-paypal', link: true }
]

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
  if (method.link) {
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
      <article v-for="method in methods" :key="method.id" class="payment-card" :class="method.id">
        <div class="payment-heading">
          <span class="payment-icon"><i :class="method.icon"></i></span>
          <div><h2>{{ method.name }}</h2><p>{{ method.desc }}</p></div>
        </div>
        <button v-if="method.qr" class="qr-show-btn" type="button" @click="activeQr = method">
          <i class="fa-solid fa-qrcode"></i> {{ t('support.showQr') }}
        </button>
        <div class="wallet-line">
          <code>{{ method.value }}</code>
          <button type="button" @click="useMethod(method)">
            <i :class="method.link ? 'fa-solid fa-arrow-up-right-from-square' : 'fa-regular fa-copy'"></i>
            {{ method.link ? '打开' : t('common.copy') }}
          </button>
        </div>
      </article>
    </section>

    <div v-if="activeQr" class="qr-modal" role="dialog" aria-modal="true" @click.self="activeQr = null">
      <div class="qr-modal-box">
        <button class="qr-modal-close" type="button" aria-label="关闭" @click="activeQr = null"><i class="fa-solid fa-xmark"></i></button>
        <img class="qr-modal-img" :src="activeQr.qr" :alt="`${activeQr.name} 收款二维码`" />
        <p class="qr-modal-title">{{ activeQr.name }}</p>
        <p class="qr-modal-hint">{{ t('support.modalHint') }}</p>
      </div>
    </div>
    <div class="support-note" :class="{ show }" role="status" aria-live="polite">{{ note }}</div>
  </main>
</template>
