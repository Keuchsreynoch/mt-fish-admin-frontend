<template>
  <div class="coin-page">
    <div class="content-wepper flex flex-col gap-2">
      <AppVTable
        :columns="columns"
        :items="historyData.slice(0, 10)"
        :loading="isLoading"
        :error="errorMessage"
        height="calc(100vh - 125px)"
      >
        <template #cell-payout_coin="{ item }">
          <span class="positive">{{ formatAmount(parseAmount(item.payout_coin)) }}</span>
        </template>

        <template #cell-pool_before="{ item }">
          {{ formatAmount(parseAmount(item.pool_before)) }}
        </template>

        <template #cell-pool_after="{ item }">
          {{ formatAmount(parseAmount(item.pool_after)) }}
        </template>

        <template #cell-created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>
      </AppVTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppVTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import { useFrontendI18n } from '~/composables/i18n'
import { getJackpotHistories, type JackpotHistoryItem } from '~/composables/service/jackpotHistoryApi'
import { formatDecimal } from '~/utils/numberFormat'

const { t } = useFrontendI18n()

const columns = computed<TableColumn<JackpotHistoryItem>[]>(() => [
  { key: 'index',             label: 'លេខរៀង',               type: 'index' },
  { key: 'member_name',       label: t('members.member') },
  { key: 'fish_type_name',    label: t('fish.fishName') },
  { key: 'jackpot_type_name', label: t('jackpot.jackpot') },
  { key: 'payout_coin',       label: t('jackpot.amount') },
  // { key: 'pool_before',       label: t('jackpot.before') },
  // { key: 'pool_after',        label: t('jackpot.after') },
  { key: 'created_at',        label: t('gameConfig.updatedAt') },
])

const filterDate = ref(formatDateForInput(new Date()))
const historyData = ref<JackpotHistoryItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
}

function formatAmount(value: number): string {
  return formatDecimal(value, { maximumFractionDigits: 2 })
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(date)
}

async function fetchHistories() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await getJackpotHistories(1, 10, filterDate.value, filterDate.value)
    const payload = response?.data.value
    historyData.value = (payload?.data?.histories ?? []).slice(0, 10)
  } catch (error: any) {
    console.error('[jackpot-history] failed to load', error)
    historyData.value = []
    errorMessage.value = error?.message || t('jackpot.failedToLoadHistory')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchHistories)
</script>

<style scoped>
.coin-page {
  display: flex;
  flex-direction: column;
}

.positive {
  color: #1E9C07;
  font-weight: 700;
}
</style>
