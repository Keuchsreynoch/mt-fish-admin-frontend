<template>
  <div class="coin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('jackpot.history') }}</h1>
      </div>
    </div>

    <div class="content-wepper flex flex-col gap-2">
      <div class="filter-row">
        <div class="filter-left">
          <span class="filter-label">{{ t('report.date') }}</span>
          <v-text-field
            v-model="filterDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 180px"
            class="slate-input"
            @update:model-value="handleDateChange"
          />
        </div>

        <div class="filter-right">
          <PeriodFilterButtons
            :active-period="activePeriod"
            @update:active-period="setQuickPeriod"
          />
        </div>
      </div>

      <AppTable
        :columns="columns"
        :items="historyData.slice(0, 10)"
        :loading="isLoading"
        :error="errorMessage"
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
      </AppTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import PeriodFilterButtons from '~/components/PeriodFilterButtons.vue'
import { useFrontendI18n } from '~/composables/i18n'
import { getJackpotHistories, type JackpotHistoryItem } from '~/composables/service/jackpotHistoryApi'
import { formatDecimal } from '~/utils/numberFormat'

const { t } = useFrontendI18n()

const columns = computed<TableColumn<JackpotHistoryItem>[]>(() => [
  { key: 'index',           label: 'លេខ',              type: 'index' },
  { key: 'member_name',     label: t('members.member') },
  { key: 'fish_type_name',  label: t('fish.fishName') },
  { key: 'jackpot_type_name', label: t('jackpot.jackpot') },
  { key: 'payout_coin',     label: t('jackpot.amount') },
  { key: 'pool_before',     label: t('jackpot.before') },
  { key: 'pool_after',      label: t('jackpot.after') },
  { key: 'created_at',      label: t('gameConfig.updatedAt') },
])

const filterDate   = ref(formatDateForInput(new Date()))
const historyData  = ref<JackpotHistoryItem[]>([])
const isLoading    = ref(false)
const errorMessage = ref('')
const activePeriod = ref<'custom' | 'today' | 'yesterday' | 'this_week'>('today')

function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
}

function formatAmount(value: number): string {
  return formatDecimal(value, { maximumFractionDigits: 2 })
}

function formatDateForInput(date: Date): string {
  const year  = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day   = `${date.getDate()}`.padStart(2, '0')
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

function getTodayDate() { return formatDateForInput(new Date()) }
function getYesterdayDate() { const d = new Date(); d.setDate(d.getDate() - 1); return formatDateForInput(d) }
function getSevenDaysAgoDate() { const d = new Date(); d.setDate(d.getDate() - 6); return formatDateForInput(d) }

function getCurrentRange(period = activePeriod.value) {
  const today = getTodayDate()
  switch (period) {
    case 'today':     return { period, start: today,               end: today }
    case 'yesterday': return { period, start: getYesterdayDate(),  end: getYesterdayDate() }
    case 'this_week': return { period, start: getSevenDaysAgoDate(), end: today }
    default:          return { period: 'custom', start: filterDate.value, end: filterDate.value }
  }
}

async function fetchHistories() {
  isLoading.value    = true
  errorMessage.value = ''
  try {
    const response = await getJackpotHistories(1, 10, filterDate.value, filterDate.value)
    const payload  = response?.data.value
    historyData.value = (payload?.data?.histories ?? []).slice(0, 10)
  } catch (error: any) {
    console.error('[jackpot-history] failed to load', error)
    historyData.value = []
    errorMessage.value = error?.message || t('jackpot.failedToLoadHistory')
  } finally {
    isLoading.value = false
  }
}


function handleDateChange() { activePeriod.value = 'custom' }

function setQuickPeriod(period: 'today' | 'yesterday' | 'this_week') {
  activePeriod.value = period
  filterDate.value   = getCurrentRange(period).start
}

onMounted(fetchHistories)

watch(filterDate, fetchHistories)
</script>

<style scoped>
.coin-page {
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: rgb(var(--v-theme-primary));
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-right {
  display: flex;
  gap: 10px;
}

.filter-label {
  color: #111827 !important;
  font-weight: 600;
  font-size: 13px;
}

.slate-input :deep(.v-field) {
  background: #FFFFFF !important;
  color: #111827 !important;
  border-radius: 8px !important;
  font-size: 12px !important;
}

.slate-input :deep(.v-field__outline) {
  color: rgba(31, 41, 55, 0.3) !important;
}

.slate-input :deep(.v-field--focused .v-field__outline) {
  color: #1F2937 !important;
}

.slate-input :deep(input) {
  color: #111827 !important;
  font-size: 12px !important;
  padding: 2px 6px !important;
}

.positive {
  color: #1E9C07;
  font-weight: 700;
}
</style>
