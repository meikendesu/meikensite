<script setup>
import { t } from '../i18n/index.js'
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell">
    <section class="page-hero compact">
      <p class="overline">CONTACT</p>
      <h1>{{ t('contact.title') }}</h1>
      <p class="hero-copy">{{ t('contact.heroCopy') }}</p>
    </section>
    <section class="contact-options">
      <a class="contact-row" href="mailto:alphametatech@gmail.com"
        ><span class="row-icon"><i class="fa-regular fa-envelope"></i></span>
        <div><small>{{ t('contact.emailLabel') }}</small><strong>{{ t('contact.emailValue') }}</strong></div>
        <b><i class="fa-solid fa-chevron-right"></i></b
      ></a>
      <a class="contact-row" target="_blank" href="https://github.com/meikendesu" aria-label="Github"
        ><span class="row-icon"><i class="fa-brands fa-github"></i></span>
        <div><small>{{ t('contact.githubLabel') }}</small><strong>MEIKEN</strong></div>
        <b><i class="fa-solid fa-chevron-right"></i></b
      ></a>
      <a class="contact-row" target="_blank" href="https://twitter.com/meikendesu" aria-label="X (Twitter)"
        ><span class="row-icon"><i class="fa-brands fa-x-twitter"></i></span>
        <div><small>{{ t('contact.xLabel') }}</small><strong>めいけん@meikendesu</strong></div>
        <b><i class="fa-solid fa-chevron-right"></i></b
      ></a>
      <a class="contact-row" target="_blank" href="https://t.me/meikendesu" aria-label="Telegram"
        ><span class="row-icon"><i class="fa-brands fa-telegram"></i></span>
        <div><small>{{ t('contact.telegramLabel') }}</small><strong>めいけん</strong></div>
        <b><i class="fa-solid fa-chevron-right"></i></b
      ></a>
      <a class="contact-row" target="_blank" href="https://www.youtube.com/@meikendesu" aria-label="Youtube"
        ><span class="row-icon"><i class="fa-brands fa-youtube"></i></span>
        <div><small>{{ t('contact.youtubeLabel') }}</small><strong>めいけん</strong></div>
        <b><i class="fa-solid fa-chevron-right"></i></b
      ></a>
      <a class="contact-row" target="_blank" href="https://space.bilibili.com/625693351" aria-label="哔哩哔哩"
        ><span class="row-icon"><i class="fa-brands fa-bilibili"></i></span>
        <div><small>{{ t('contact.biliLabel') }}</small><strong>洛鸣希_mxli</strong></div>
        <b><i class="fa-solid fa-chevron-right"></i></b
      ></a>
    </section>
  </main>
</template>
