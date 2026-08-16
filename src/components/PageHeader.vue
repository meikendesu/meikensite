<script setup lang="ts">
import { t } from '../i18n'

// 子页顶部栏：返回按钮 + 页面标题 + 头像入口
defineProps({
  title: { type: String, required: true },
  backTo: { type: String, default: '/' },
  backLabel: { type: String, default: () => t('common.backHome') },
  avatarTo: { type: String, default: '/contact' },
  avatarLabel: { type: String, default: () => t('nav.contact') }
})
</script>

<template>
  <header class="topbar">
    <router-link class="back-link" :to="backTo"
      ><i class="fa-solid fa-chevron-left"></i> {{ backLabel }}</router-link
    ><span class="page-title">{{ title }}</span
    ><router-link class="avatar-link" :to="avatarTo" :aria-label="avatarLabel">M</router-link>
  </header>
</template>
