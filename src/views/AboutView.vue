<script setup>
import { t } from '../i18n/index.js'
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell">
    <section class="page-hero">
      <p class="overline">ABOUT</p>
      <h1>{{ t('about.title1') }}<br />{{ t('about.title2') }}</h1>
      <p class="hero-copy">{{ t('about.heroCopy') }}</p>
    </section>
    <section class="content-block">
      <h2>{{ t('about.introHeading') }}</h2>
      <p>{{ t('about.p1') }}</p>
      <p>{{ t('about.p2') }}</p>
    </section>
    <section class="facts-list">
      <div><span>{{ t('about.fact1Label') }}</span><b>{{ t('about.fact1Value') }}</b></div>
      <div><span>{{ t('about.fact2Label') }}</span><b>{{ t('about.fact2Value') }}</b></div>
      <div><span>{{ t('about.fact3Label') }}</span><b>{{ t('about.fact3Value') }}</b></div>
    </section>
  </main>
</template>
