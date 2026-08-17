<script setup lang="ts">
import { t } from '../i18n'
import LocaleSwitcher from './LocaleSwitcher.vue'
</script>

<template>
  <nav class="tabbar" :aria-label="t('a11y.navigation')">
    <router-link to="/" exact-active-class="active"
      ><i class="fa-solid fa-house"></i>{{ t('nav.home') }}</router-link
    ><div class="tabbar-spacer"></div>
    <router-link to="/about" exact-active-class="active"
      ><i class="fa-solid fa-circle-info"></i>{{ t('nav.about') }}</router-link
    ><router-link to="/projects" exact-active-class="active"
      ><i class="fa-solid fa-code"></i>{{ t('nav.projects') }}</router-link
    ><router-link to="/contact" exact-active-class="active"
      ><i class="fa-solid fa-message"></i>{{ t('nav.contact') }}</router-link
    ><router-link to="/support" exact-active-class="active"
      ><i class="fa-solid fa-hand-holding-dollar"></i>{{ t('nav.support') }}</router-link
    ><LocaleSwitcher />
  </nav>
</template>
