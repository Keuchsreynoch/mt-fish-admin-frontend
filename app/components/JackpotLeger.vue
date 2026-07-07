<template>
  <div class="coin-page">
    <div class="content-wepper flex flex-col gap-2">
      <AppVTable
        :columns="columns"
        :items="ledgerData"
        :loading="isLoading"
        :error="errorMessage"
        :page="currentPage"
        :page-size="itemsPerPage"
        :total-pages="totalPages"
        empty-text="No jackpot ledger found"
        empty-subtext="Try another date."
        @update:page="currentPage = $event"
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
import { computed, onMounted, ref, watch } from 'vue'
import AppVTable, { type TableColumn } from '~/components/AppTableFixed.vue'
import { getJackpotLedgers, type JackpotLedgerItem } from '~/composables/service/jackpotLedgerApi'

const columns: TableColumn<JackpotLedgerItem>[] = [
  { key: 'index',                    label: 'លេខ',               type: 'index' },
  { key: 'member_id',                label: 'Member ID' },
  { key: 'fish_type_name',           label: 'Fish Type' },
  { key: 'source_type',              label: 'Source Type' },
  { key: 'global_contribution_coin', label: 'Contribution Coin' },
  { key: 'pool_before',              label: 'Pool Before' },
  { key: 'pool_after',               label: 'Pool After' },
  { key: 'created_by',               label: 'Created By' },
  { key: 'created_at',               label: 'Created At' },
]

const currentPage  = ref(1)
const itemsPerPage = 10
const totalItems   = ref(0)
const ledgerData   = ref<JackpotLedgerItem[]>([])
const isLoading    = ref(false)
const errorMessage = ref('')

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / itemsPerPage)),
)

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
    const response = await getJackpotLedgers(currentPage.value, itemsPerPage, today, today)
    const payload  = response?.data.value
    ledgerData.value = payload?.data?.ledgers ?? []
    totalItems.value = payload?.total ?? 0
  } catch (error: any) {
    console.error('[analytics-ledger] failed to load', error)
    ledgerData.value = []
    totalItems.value = 0
    errorMessage.value = error?.message || 'Failed to load jackpot ledger'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchLedgers)

watch(currentPage, fetchLedgers)
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
