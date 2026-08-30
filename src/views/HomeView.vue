<script setup lang="ts">
import { t } from '../i18n'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
</script>

<template>
  <main id="main" tabindex="-1" class="shell home-shell">
    <section class="home-intro">
      <div class="home-intro-text">
        <h1>{{ t('home.hello') }}<br />{{ t('home.iAm') }} <em>MEIKEN</em></h1>
        <p>{{ t('home.subtitle') }}</p>
      </div>
      <div class="home-avatar" aria-hidden="true">M</div>
    </section>

    <nav class="module-grid home-index" :aria-label="t('a11y.modules')">
      <router-link class="module-card about-card" to="/about"
        ><i class="fa-solid fa-circle-info"></i><strong>{{ t('home.about') }}</strong
        ><small>{{ t('home.aboutSub') }}</small
        ><b><i class="fa-solid fa-chevron-right"></i></b
      ></router-link>
      <router-link class="module-card projects-card" to="/projects"
        ><i class="fa-solid fa-code"></i><strong>{{ t('home.projects') }}</strong
        ><small>{{ t('home.projectsSub') }}</small
        ><b><i class="fa-solid fa-chevron-right"></i></b
      ></router-link>
      <router-link class="module-card contact-card" to="/contact"
        ><i class="fa-solid fa-message"></i><strong>{{ t('home.contact') }}</strong
        ><small>{{ t('home.contactSub') }}</small
        ><b><i class="fa-solid fa-chevron-right"></i></b
      ></router-link>
      <router-link class="module-card support-card" to="/support"
        ><i class="fa-solid fa-hand-holding-dollar"></i><strong>{{ t('home.support') }}</strong
        ><small>{{ t('home.supportSub') }}</small
        ><b><i class="fa-solid fa-chevron-right"></i></b
      ></router-link>
    </nav>

    <footer class="site-footer">{{ t('home.footer') }}</footer>
    <div class="home-locale"><LocaleSwitcher /></div>
  </main>
</template>
