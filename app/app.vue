<template>
  <v-app class="app-root">
    <VSonner position="top-right" :visible-toasts="4" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>

<script setup lang="ts">
import { VSonner } from "vuetify-sonner";
</script>

<style scoped>
</style>
