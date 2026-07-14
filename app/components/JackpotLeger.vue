<template>
  <div class="coin-page">
    <div class="content-wepper flex flex-col gap-2">
      <AppVTable
        :columns="columns"
        :items="ledgerData.slice(0, 10)"
        :loading="isLoading"
        :error="errorMessage"
      >
        <template #cell-global_contribution_coin="{ item }">
          <span class="positive">{{ formatAmount(parseAmount(item.global_contribution_coin)) }}</span>
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
import { getJackpotLedgers, type JackpotLedgerItem } from '~/composables/service/jackpotLedgerApi'

const { t } = useFrontendI18n()

const columns = computed<TableColumn<JackpotLedgerItem>[]>(() => [
  { key: 'index',                    label: 'លេខ',               type: 'index' },
  { key: 'member_id',                label: t('members.loginId') },
  { key: 'fish_type_name',           label: t('fish.fishName') },
  { key: 'source_type',              label: t('jackpot.sourceType') },
  { key: 'global_contribution_coin', label: t('jackpot.amount') },
  { key: 'pool_before',              label: t('jackpot.before') },
  { key: 'pool_after',               label: t('jackpot.after') },
  { key: 'created_by',               label: t('gameConfig.updatedBy') },
  { key: 'created_at',               label: t('gameConfig.updatedAt') },
])

const ledgerData   = ref<JackpotLedgerItem[]>([])
const isLoading    = ref(false)
const errorMessage = ref('')

function formatDateForInput(date: Date): string {
  const year  = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day   = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
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

async function fetchLedgers() {
  isLoading.value    = true
  errorMessage.value = ''
  try {
    const today    = formatDateForInput(new Date())
    const response = await getJackpotLedgers(1, 10, today, today)
    const payload  = response?.data.value
    ledgerData.value = (payload?.data?.ledgers ?? []).slice(0, 10)
  } catch (error: any) {
    console.error('[analytics-ledger] failed to load', error)
    ledgerData.value = []
    errorMessage.value = error?.message || t('jackpot.failedToLoadLedger')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchLedgers)
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
