<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="max-w-lg text-center">
      <img
        src="/emptyData/notfound.svg"
        :alt="t('notFound.title')"
        class="w-full max-w-md mx-auto"
      />

      <h1 class="mt-6 text-4xl font-bold text-gray-800">
        404
      </h1>

      <p class="mt-2 text-xl font-semibold text-gray-700">
        {{ t('notFound.title') }}
      </p>

      <!-- <p class="mt-3 text-gray-500">
        The page you are looking for does not exist or you do not have permission to access it.
      </p> -->

      <div class="mt-8 flex justify-center gap-3">
        <NuxtLink
          to="/"
          class="px-5 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition"
        >
          {{ t('notFound.home') }}
        </NuxtLink>

        <button
          class="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          @click="$router.back()"
        >
          {{ t('notFound.back') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFrontendI18n } from '~/composables/i18n'

definePageMeta({
  layout: false
})

const { t } = useFrontendI18n()
</script>
