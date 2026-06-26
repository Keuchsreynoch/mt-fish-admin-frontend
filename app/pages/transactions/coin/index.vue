<template>
  <div class="coin-page">
    <!-- Filter row -->
    <div class="filter-row">
      <div class="filter-left">
        <span class="text-xl filter-label">កាលបរិច្ឆេទ</span>
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

    <!-- AppTable -->
    <AppTable
      :columns="columns"
      :items="reportData"
      :loading="isLoading"
      :error="errorMessage"
      :page="currentPage"
      :page-size="itemsPerPage"
      :total-pages="totalPages"
      @update:page="currentPage = $event"
    >
      <!-- status badge -->
      <template #cell-status_id="{ item }">
        <v-chip
          :color="Number(item.status_id) === 1 ? 'success' : 'error'"
          variant="outlined"
          size="small"
        >
          {{ item.status_id }}
        </v-chip>
      </template>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import { getCoinTransactions, type CoinTransactionItem } from '~/composables/service/coinTransactionsApi'
import AppTable from '~/components/DynamicTableStyle.vue'
import type { TableColumn } from '~/components/DynamicTableStyle.vue'
import PeriodFilterButtons from '~/components/PeriodFilterButtons.vue'

const route = useRoute()
const router = useRouter()

const filterDate    = ref(formatDateForInput(new Date()))
const currentPage   = ref(1)
const itemsPerPage  = 10
const totalItems    = ref(0)
const reportData    = ref<CoinTransactionItem[]>([])
const isLoading     = ref(false)
const errorMessage  = ref('')
const activePeriod  = ref<'custom' | 'today' | 'yesterday' | 'this_week'>('today')
const isRouteSynced = ref(false)

const validPeriods = ['custom', 'today', 'yesterday', 'this_week'] as const

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage)))

// ── Columns ───────────────────────────────────────────────────────────────────

const columns: TableColumn<CoinTransactionItem>[] = [
  { key: 'index',      label: 'លេខ',        type: 'index' },
  { key: 'username',   label: 'Username',   align: 'left' },
  {
    key: 'before_coin',
    label: 'Before Coin',
    format: (v: string) => formatAmount(parseAmount(v)),
    cellClass: (item: CoinTransactionItem) => getAmountClass(item.before_coin),
  },
  {
    key: 'amount',
    label: 'Amount',
    format: (v: string) => formatAmount(parseAmount(v)),
    cellClass: (item: CoinTransactionItem) => getAmountClass(item.amount),
  },
  { key: 'reference',  label: 'Reference',  align: 'left', format: (v: string) => v || '-' },
  { key: 'status_id',  label: 'Status' },
  { key: 'order',      label: 'Order' },
  { key: 'created_at', label: 'Created At', format: (v: string) => formatDateTime(v) },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value)
}

function getAmountClass(value: string | undefined | null): string {
  return parseAmount(value) >= 0 ? 'positive' : 'negative'
}

function formatDateForInput(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTodayDate()        { return formatDateForInput(new Date()) }
function getYesterdayDate()    { const d = new Date(); d.setDate(d.getDate() - 1); return formatDateForInput(d) }
function getSevenDaysAgoDate() { const d = new Date(); d.setDate(d.getDate() - 6); return formatDateForInput(d) }

function getCurrentRange(period = activePeriod.value) {
  const today = getTodayDate()
  switch (period) {
    case 'today':     return { period, start: today,                 end: today }
    case 'yesterday': { const y = getYesterdayDate(); return { period, start: y, end: y } }
    case 'this_week': return { period, start: getSevenDaysAgoDate(), end: today }
    default:          return { period: 'custom', start: filterDate.value, end: filterDate.value }
  }
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

function isValidPeriod(value: string): value is (typeof validPeriods)[number] {
  return (validPeriods as readonly string[]).includes(value)
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
  activePeriod.value = isValidPeriod(routePeriod) ? routePeriod : 'today'

  if (isValidPeriod(routePeriod) && routeStart) {
    filterDate.value = routeStart
  } else if (routePeriod === 'this_week' && routeEnd) {
    filterDate.value = routeEnd
  } else if (routePeriod === 'today' || routePeriod === 'yesterday' || !routePeriod) {
    filterDate.value = getTodayDate()
  }

  if (['today', 'yesterday', 'this_week'].includes(routePeriod)) {
    if (routePeriod === 'this_week' && routeStart) { filterDate.value = routeStart; return }
    if (routeEnd) filterDate.value = routeEnd
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchCoinTransactions() {
  isLoading.value    = true
  errorMessage.value = ''
  try {
    const range    = getCurrentRange()
    const response = await getCoinTransactions(currentPage.value, itemsPerPage, range.start, range.end)
    const payload  = response?.data.value
    reportData.value = payload?.data?.transactions ?? []
    totalItems.value = payload?.total ?? reportData.value.length
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[coin-transactions] failed to load', err)
    reportData.value = []
    totalItems.value = 0
    errorMessage.value = err?.message || 'Failed to load coin transactions'
  } finally {
    isLoading.value = false
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────

function handleDateChange() { activePeriod.value = 'custom'; currentPage.value = 1 }

function setQuickPeriod(period: 'today' | 'yesterday' | 'this_week') {
  activePeriod.value = period
  filterDate.value   = getCurrentRange(period).start
  currentPage.value  = 1
}

onMounted(async () => {
  syncStateFromRoute()
  await nextTick()
  await fetchCoinTransactions()
  isRouteSynced.value = true
  syncRouteQuery()
})

watch([filterDate, currentPage, activePeriod], () => {
  if (!isRouteSynced.value) return
  syncRouteQuery()
  fetchCoinTransactions()
})
</script>

<style scoped>
.coin-page {
  display: flex;
  flex-direction: column;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.filter-left  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.filter-right { display: flex; gap: 10px; }

.filter-label {
  color: #111827 !important;
  font-weight: 600;
}

.slate-input :deep(.v-field)                            { background: #FFFFFF !important; color: #111827 !important; border-radius: 10px !important; }
.slate-input :deep(.v-field__outline)                   { color: rgba(31, 41, 55, 0.3) !important; }
.slate-input :deep(.v-field--focused .v-field__outline) { color: #1F2937 !important; }
.slate-input :deep(input)                               { color: #111827 !important; }

:deep(td.positive) { color: #1E9C07 !important; font-weight: 700 !important; }
:deep(td.negative) { color: #EF4444 !important; font-weight: 700 !important; }
</style>