<template>
  <div class="coin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('balance.exchangeTitle') }}</h1>
        <!-- <p class="page-subtitle">Edit RTP and jackpot settings for the active game.</p> -->
      </div>
    </div>
    <!-- Filter row -->
    <div class="content-wepper flex flex-col gap-2">
      <div class="filter-row">
        <div class="filter-left">
          <span class="filter-label">{{ t('report.date') }}</span>
          <v-text-field v-model="filterDate" type="date" density="compact" hide-details variant="outlined"
            style="max-width: 150px" class="slate-input" @update:model-value="handleDateChange" />
        </div>

        <div class="filter-right">
          <PeriodFilterButtons :active-period="activePeriod" @update:active-period="setQuickPeriod" />
        </div>
      </div>

      <!-- AppTable -->
      <AppTable :columns="columns" :items="reportData" :loading="isLoading" :error="errorMessage" :page="currentPage"
        :page-size="itemsPerPage" :total-pages="totalPages" @update:page="currentPage = $event">
        <!-- status badge -->
        <template #cell-status_id="{ item }">
          <v-chip :color="Number(item.status_id) === 1 ? 'success' : 'error'" variant="outlined" size="small">
            {{ item.status_id }}
          </v-chip>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import { getCoinTransactions, type CoinTransactionItem } from '~/composables/service/coinTransactionsApi'
import AppTable from '~/components/DynamicTableStyle.vue'
import type { TableColumn } from '~/components/DynamicTableStyle.vue'
import PeriodFilterButtons from '~/components/PeriodFilterButtons.vue'
import { useFrontendI18n } from '~/composables/i18n'
import { formatDecimal } from '~/utils/numberFormat'

const route = useRoute()
const router = useRouter()
const { t } = useFrontendI18n()

const filterDate = ref(formatDateForInput(new Date()))
const currentPage = ref(1)
const itemsPerPage = 20
const totalItems = ref(0)
const reportData = ref<CoinTransactionItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const activePeriod = ref<'custom' | 'today' | 'yesterday' | 'this_week'>('today')
const isRouteSynced = ref(false)

const validPeriods = ['custom', 'today', 'yesterday', 'this_week'] as const

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage)))

// ── Columns ───────────────────────────────────────────────────────────────────

const columns = computed<TableColumn<CoinTransactionItem>[]>(() => [
  { key: 'index', label: 'លេខរៀង', type: 'index' },
  { key: 'username', label: t('users.username'), align: 'left' },
  {
    key: 'before_coin',
    label: t('jackpot.before'),
    format: (v: string) => formatAmount(parseAmount(v)),
    cellClass: (item: CoinTransactionItem) => getAmountClass(item.before_coin),
  },
  {
    key: 'amount',
    label: t('jackpot.amount'),
    format: (v: string) => formatAmount(parseAmount(v)),
    cellClass: (item: CoinTransactionItem) => getAmountClass(item.amount),
  },
  { key: 'reference', label: t('report.note'), align: 'left', format: (v: string) => v || '-' },
  { key: 'status_id', label: t('gameConfig.status') },
  { key: 'order', label: t('report.bonus') },
  { key: 'created_at', label: t('gameConfig.updatedAt'), format: (v: string) => formatDateTime(v) },
])

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
}

function formatAmount(value: number): string {
  return formatDecimal(value, { maximumFractionDigits: 3 })
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

function getTodayDate() { return formatDateForInput(new Date()) }
function getYesterdayDate() { const d = new Date(); d.setDate(d.getDate() - 1); return formatDateForInput(d) }
function getSevenDaysAgoDate() { const d = new Date(); d.setDate(d.getDate() - 6); return formatDateForInput(d) }

function getCurrentRange(period = activePeriod.value) {
  const today = getTodayDate()
  switch (period) {
    case 'today': return { period, start: today, end: today }
    case 'yesterday': { const y = getYesterdayDate(); return { period, start: y, end: y } }
    case 'this_week': return { period, start: getSevenDaysAgoDate(), end: today }
    default: return { period: 'custom', start: filterDate.value, end: filterDate.value }
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
  const cur = {
    period: normalizeQueryValue(route.query.period),
    start: normalizeQueryValue(route.query.start),
    end: normalizeQueryValue(route.query.end),
    page: normalizeQueryValue(route.query.page),
  }
  if (cur.period === next.period && cur.start === next.start && cur.end === next.end && cur.page === next.page) return
  router.replace({ path: route.path, query: next })
}

function syncStateFromRoute() {
  const routePage = Number.parseInt(normalizeQueryValue(route.query.page), 10)
  const routeStart = normalizeQueryValue(route.query.start)
  const routePeriod = normalizeQueryValue(route.query.period)
  const routeEnd = normalizeQueryValue(route.query.end)

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
  isLoading.value = true
  errorMessage.value = ''
  try {
    const range = getCurrentRange()
    const response = await getCoinTransactions(currentPage.value, itemsPerPage, range.start, range.end)
    const payload = response?.data.value
    reportData.value = payload?.data?.transactions ?? []
    totalItems.value = payload?.total ?? reportData.value.length
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[coin-transactions] failed to load', err)
    reportData.value = []
    totalItems.value = 0
    errorMessage.value = err?.message || t('common.noDataFound')
  } finally {
    isLoading.value = false
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────

function handleDateChange() { activePeriod.value = 'custom'; currentPage.value = 1 }

function setQuickPeriod(period: 'today' | 'yesterday' | 'this_week') {
  activePeriod.value = period
  filterDate.value = getCurrentRange(period).start
  currentPage.value = 1
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
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}

.header-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: rgb(var(--v-theme-primary));
}

.coin-page {
  display: flex;
  flex-direction: column;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.filter-label {
  color: #111827 !important;
  font-weight: 600;
  font-size: 13px;   /* ចុះពី text-xl */
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

.slate-input :deep(.v-field) {
  background: #FFFFFF !important;
  color: #111827 !important;
  border-radius: 8px !important;
  font-size: 12px !important;
}

.slate-input :deep(input) {
  color: #111827 !important;
  font-size: 12px !important;
  padding: 2px 6px !important;
}

.slate-input :deep(.v-field__outline) {
  color: rgba(31, 41, 55, 0.3) !important;
}

.slate-input :deep(.v-field--focused .v-field__outline) {
  color: #1F2937 !important;
}

/* .slate-input :deep(input) {
  color: #111827 !important;
} */

:deep(td.positive) {
  color: #1E9C07 !important;
  font-weight: 700 !important;
}

:deep(td.negative) {
  color: #EF4444 !important;
  font-weight: 700 !important;
}
</style>
