<template>
  <div class="coin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Jackpot Ledger</h1>
      </div>
    </div>

    <div class="content-wepper flex flex-col gap-2">
      <div class="filter-row">
        <div class="filter-left">
          <span class="filter-label">កាលបរិច្ឆេទ</span>
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
        :items="ledgerData"
        :loading="isLoading"
        :error="errorMessage"
        :page="currentPage"
        :page-size="itemsPerPage"
        :total-pages="totalPages"
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
      </AppTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import PeriodFilterButtons from '~/components/PeriodFilterButtons.vue'
import { getJackpotLedgers, type JackpotLedgerItem } from '~/composables/service/jackpotLedgerApi'

const route  = useRoute()
const router = useRouter()

const columns: TableColumn<JackpotLedgerItem>[] = [
  { key: 'index',                      label: 'លេខ',                type: 'index' },
  { key: 'member_id',                  label: 'Member ID' },
  { key: 'fish_type_name',             label: 'Fish Type' },
  { key: 'source_type',                label: 'Source Type' },
  { key: 'global_contribution_coin',   label: 'Contribution Coin' },
  { key: 'pool_before',                label: 'Pool Before' },
  { key: 'pool_after',                 label: 'Pool After' },
  { key: 'created_by',                 label: 'Created By' },
  { key: 'created_at',                 label: 'Created At' },
]

const filterDate    = ref(formatDateForInput(new Date()))
const currentPage   = ref(1)
const itemsPerPage  = 20
const totalItems    = ref(0)
const ledgerData    = ref<JackpotLedgerItem[]>([])
const isLoading     = ref(false)
const errorMessage  = ref('')
const isRouteSynced = ref(false)
const activePeriod  = ref<'custom' | 'today' | 'yesterday' | 'this_week'>('today')


const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / itemsPerPage)),
)


function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
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

function normalizeQueryValue(value: LocationQueryValue | LocationQueryValue[] | null | undefined): string {
  if (Array.isArray(value)) return normalizeQueryValue(value[0])
  return value ?? ''
}

function getTodayDate()        { return formatDateForInput(new Date()) }
function getYesterdayDate()    { const d = new Date(); d.setDate(d.getDate() - 1); return formatDateForInput(d) }
function getSevenDaysAgoDate() { const d = new Date(); d.setDate(d.getDate() - 6); return formatDateForInput(d) }

function getCurrentRange(period = activePeriod.value) {
  const today = getTodayDate()
  switch (period) {
    case 'today':     return { period, start: today,                 end: today }
    case 'yesterday': return { period, start: getYesterdayDate(),    end: getYesterdayDate() }
    case 'this_week': return { period, start: getSevenDaysAgoDate(), end: today }
    default:          return { period: 'custom', start: filterDate.value, end: filterDate.value }
  }
}

function syncRouteQuery() {
  const range = getCurrentRange()
  const next = { period: range.period, start: range.start, end: range.end, page: `${currentPage.value}` }
  const cur  = {
    period: normalizeQueryValue(route.query.period),
    start:  normalizeQueryValue(route.query.start),
    end:    normalizeQueryValue(route.query.end),
    page:   normalizeQueryValue(route.query.page),
  }
  if (cur.period === next.period && cur.start === next.start && cur.end === next.end && cur.page === next.page) return
  router.replace({ path: route.path, query: next })
}

function syncStateFromRoute() {
  const routePage   = Number.parseInt(normalizeQueryValue(route.query.page), 10)
  const routeStart  = normalizeQueryValue(route.query.start)
  const routePeriod = normalizeQueryValue(route.query.period)
  const routeEnd    = normalizeQueryValue(route.query.end)

  if (!Number.isNaN(routePage) && routePage > 0) currentPage.value = routePage
  activePeriod.value = ['today', 'yesterday', 'this_week'].includes(routePeriod)
    ? routePeriod as 'today' | 'yesterday' | 'this_week'
    : 'today'

  if      (activePeriod.value === 'today')     filterDate.value = getTodayDate()
  else if (activePeriod.value === 'yesterday') filterDate.value = routeStart || routeEnd || getYesterdayDate()
  else if (activePeriod.value === 'this_week') filterDate.value = routeStart || getSevenDaysAgoDate()
  else if (routeStart)                         filterDate.value = routeStart
  else if (routeEnd)                           filterDate.value = routeEnd
}


async function fetchLedgers() {
  isLoading.value    = true
  errorMessage.value = ''
  try {
    const response = await getJackpotLedgers(currentPage.value, itemsPerPage, filterDate.value, filterDate.value)
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

function handleDateChange() { activePeriod.value = 'custom'; currentPage.value = 1 }

function setQuickPeriod(period: 'today' | 'yesterday' | 'this_week') {
  activePeriod.value = period
  filterDate.value   = getCurrentRange(period).start
  currentPage.value  = 1
}

onMounted(async () => {
  syncStateFromRoute()
  await nextTick()
  await fetchLedgers()
  isRouteSynced.value = true
  syncRouteQuery()
})

watch([filterDate, currentPage], () => {
  if (!isRouteSynced.value) return
  syncRouteQuery()
  fetchLedgers()
})
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
  color: #111827;
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
