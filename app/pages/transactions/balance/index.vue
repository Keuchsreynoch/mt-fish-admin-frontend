<template>
    <div>
        {{ t('balance.coinBalance') }}
    </div>
</template>

<script setup lang="ts">
import { useFrontendI18n } from '~/composables/i18n'

const { t } = useFrontendI18n()

</script>

<style scoped></style>
