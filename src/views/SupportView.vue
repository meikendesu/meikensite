<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { t } from '../i18n/index.js'

// TODO: 填写真实 USDT (TRC20) 钱包地址后即可启用复制
const walletAddress = 'shili'
const note = ref('')
const show = ref(false)
let timer = null

function showNote(message) {
  note.value = message
  show.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (show.value = false), 3200)
}

async function copyWallet() {
  if (walletAddress.includes('待填写')) {
    showNote(t('support.noteFill'))
    return
  }
  try {
    await navigator.clipboard.writeText(walletAddress)
    showNote(t('support.noteCopied'))
  } catch {
    showNote(t('support.noteCopyFailed'))
  }
}

// 二维码弹窗：二维码隐藏，点「展示二维码」弹窗查看
const QR_MAP = {
  wechat: { nameKey: 'support.wechat', qr: '/payment/wechat-qr.svg', alt: '微信收款二维码' },
  alipay: { nameKey: 'support.alipay', qr: '/payment/alipay-qr.svg', alt: '支付宝收款二维码' },
  usdt: { nameKey: 'support.usdt', qr: '/payment/usdt-qr.svg', alt: 'USDT 收款二维码' }
}
const activeQr = ref(null)

function showQr(id) {
  activeQr.value = QR_MAP[id]
}
function closeQr() {
  activeQr.value = null
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
      <article class="payment-card wechat">
        <div class="payment-heading">
          <span class="payment-icon"><i class="fa-brands fa-weixin"></i></span>
          <div>
            <h2>{{ t('support.wechat') }}</h2>
            <p>{{ t('support.wechatDesc') }}</p>
          </div>
        </div>
        <button class="qr-show-btn" type="button" @click="showQr('wechat')">
          <i class="fa-solid fa-qrcode"></i> {{ t('support.showQr') }}
        </button>
      </article>
      <article class="payment-card alipay">
        <div class="payment-heading">
          <span class="payment-icon"><i class="fa-brands fa-alipay"></i></span>
          <div>
            <h2>{{ t('support.alipay') }}</h2>
            <p>{{ t('support.alipayDesc') }}</p>
          </div>
        </div>
        <button class="qr-show-btn" type="button" @click="showQr('alipay')">
          <i class="fa-solid fa-qrcode"></i> {{ t('support.showQr') }}
        </button>
      </article>
      <article class="payment-card usdt" id="usdt-address">
        <div class="payment-heading">
          <span class="payment-icon"><div class="usdt-icon"></div></span>
          <div>
            <h2>{{ t('support.usdt') }}</h2>
            <p>{{ t('support.usdtDesc') }}</p>
          </div>
        </div>
        <button class="qr-show-btn" type="button" @click="showQr('usdt')">
          <i class="fa-solid fa-qrcode"></i> {{ t('support.showQr') }}
        </button>
        <div class="wallet-line">
          <code>{{ walletAddress }}</code>
          <button type="button" @click="copyWallet">
            <i class="fa-regular fa-copy"></i> {{ t('common.copy') }}
          </button>
        </div>
      </article>
    </section>

    <div v-if="activeQr" class="qr-modal" role="dialog" aria-modal="true" @click.self="closeQr">
      <div class="qr-modal-box">
        <button class="qr-modal-close" type="button" aria-label="关闭" @click="closeQr">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <img class="qr-modal-img" :src="activeQr.qr" :alt="activeQr.alt" />
        <p class="qr-modal-title">{{ t(activeQr.nameKey) }}</p>
        <p class="qr-modal-hint">{{ t('support.modalHint') }}</p>
      </div>
    </div>

    <div class="support-note" :class="{ show }" role="status" aria-live="polite">
      {{ note }}
    </div>
  </main>
</template>
