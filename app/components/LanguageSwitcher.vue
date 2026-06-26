<template>
  <div class="lang-switcher">
    <button
      type="button"
      class="lang-switcher__btn"
      :class="{ 'lang-switcher__btn--active': locale === 'en' }"
      @click="setLocale('en')"
    >
      {{ t('common.english') }}
    </button>
    <button
      type="button"
      class="lang-switcher__btn"
      :class="{ 'lang-switcher__btn--active': locale === 'km' }"
      @click="setLocale('km')"
    >
      {{ t('common.khmer') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useFrontendI18n } from "~/composables/i18n";

const { locale, setLocale, t } = useFrontendI18n()
</script>

<style scoped>
.lang-switcher {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100001;
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  border: 1px solid rgba(127, 201, 235, 0.18);
  border-radius: 999px;
  background: rgba(6, 19, 30, 0.82);
  backdrop-filter: blur(14px);
}

.lang-switcher__btn {
  min-width: 48px;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(218, 242, 255, 0.72);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.lang-switcher__btn--active {
  background: linear-gradient(135deg, #44d7c5, #378add);
  color: #04101a;
}
</style>
