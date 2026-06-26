<template>
  <div class="coin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Statements</h1>
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
        :items="reportData"
        :loading="isLoading"
        :error="errorMessage"
        :page="currentPage"
        :page-size="itemsPerPage"
        :total-pages="totalPages"
        :subtotals="subtotalsRow"
        :grand-totals="grandTotalsRow"
        @update:page="currentPage = $event"
      >
        <template #cell-is_kill="{ item }">
          <span :style="{ color: item.is_kill ? '#1E9C07' : '#EF4444', fontWeight: 700 }">
            {{ item.is_kill ? 'Yes' : 'No' }}
          </span>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import { getStatements, type StatementItem } from '~/composables/service/statementApi'
import AppTable from '~/components/DynamicTableStyle.vue'
import type { TableColumn, TotalRow } from '~/components/DynamicTableStyle.vue'
import PeriodFilterButtons from '~/components/PeriodFilterButtons.vue'

const route = useRoute()
const router = useRouter()

const filterDate = ref(formatDateForInput(new Date()))
const currentPage = ref(1)
const itemsPerPage = 20
const totalItems = ref(0)
const reportData = ref<StatementItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const activePeriod = ref('today')
const isRouteSynced = ref(false)

const allBetTotal = ref(0)
const allValidTotal = ref(0)
const allWinLoseTotal = ref(0)

// ── Columns ────────────────────────────────────────────
const columns: TableColumn<StatementItem>[] = [
  { key: 'index', label: 'លេខ', type: 'index' },
  { key: 'session_no', label: 'Session No' },
  { key: 'bet_no', label: 'Bet No' },
  { key: 'ticket_no', label: 'Ticket No' },
  { key: 'fish_type_name', label: 'Fish' },
  { key: 'bet_amount', label: 'លុយចាក់', format: (v: string) => formatAmount(parseAmount(v)) },
  { key: 'bet_valid', label: 'Valid Bet', format: (v: string) => formatAmount(parseAmount(v)) },
  { key: 'bet_invalid', label: 'Invalid Bet', format: (v: string) => formatAmount(parseAmount(v)) },
  { key: 'is_kill', label: 'Kill' },
  {
    key: 'reward',
    label: 'Reward',
    format: (_v: string, item: StatementItem) => formatAmount(getRewardAmount(item)),
  },
  {
    key: 'total_win_lose',
    label: 'ឈ្នះ/ចាញ់',
    format: (v: string) => formatAmount(parseAmount(v)),
    cellClass: (item: StatementItem) => parseAmount(item.total_win_lose) >= 0 ? 'positive' : 'negative',
  },
  {
    key: 'created_at',
    label: 'Time',
    format: (v: string) => formatDateTime(v),
  },
]

const pageBetTotal = computed(() =>
  reportData.value.reduce((s, i) => s + parseAmount(i.bet_amount), 0),
)
const pageValidTotal = computed(() =>
  reportData.value.reduce((s, i) => s + parseAmount(i.bet_valid), 0),
)
const pageInvalidTotal = computed(() =>
  reportData.value.reduce((s, i) => s + parseAmount(i.bet_invalid), 0),
)
const pageWinLoseTotal = computed(() =>
  reportData.value.reduce((s, i) => s + parseAmount(i.total_win_lose), 0),
)

const subtotalsRow = computed<TotalRow | undefined>(() => {
  if (!reportData.value.length) return undefined
  return {
    labelSpan: 5,
    pageLabel: 'សរុបក្នុងមួយទំព័រ',
    cols: [
      { key: 'bet_amount', value: formatAmount(pageBetTotal.value) },
      { key: 'bet_valid', value: formatAmount(pageValidTotal.value) },
      { key: 'bet_invalid', value: formatAmount(pageInvalidTotal.value) },
      { key: 'is_kill', value: '-' },
      { key: 'win_lose', value: '-' },
      { key: 'reward', value: '-' },
      {
        key: 'total_win_lose',
        value: formatAmount(pageWinLoseTotal.value),
        class: pageWinLoseTotal.value >= 0 ? 'positive' : 'negative',
      },
      { key: 'created_at', value: '' },
    ],
  }
})

const grandTotalsRow = computed<TotalRow | undefined>(() => {
  if (!reportData.value.length) return undefined
  return {
    labelSpan: 5,
    pageLabel: 'សរុបទាំងអស់',
    cols: [
      { key: 'bet_amount', value: formatAmount(allBetTotal.value) },
      { key: 'bet_valid', value: formatAmount(allValidTotal.value) },
      { key: 'bet_invalid', value: '-' },
      { key: 'is_kill', value: '-' },
      { key: 'win_lose', value: '-' },
      { key: 'reward', value: '-' },
      {
        key: 'total_win_lose',
        value: formatAmount(allWinLoseTotal.value),
        class: allWinLoseTotal.value >= 0 ? 'positive' : 'negative',
      },
      { key: 'created_at', value: '' },
    ],
  }
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage)))

// ── Helpers ────────────────────────────────────────────
function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value)
}

function formatDateForInput(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTodayDate() { return formatDateForInput(new Date()) }
function getYesterdayDate() {
  const d = new Date(); d.setDate(d.getDate() - 1); return formatDateForInput(d)
}
function getSevenDaysAgoDate() {
  const d = new Date(); d.setDate(d.getDate() - 6); return formatDateForInput(d)
}

function getRewardAmount(item: StatementItem): number {
  return parseAmount(item.is_kill ? item.kill_reward : item.miss_reward) + parseAmount(item.jackpot)
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date)
}

function getCurrentRange(period = activePeriod.value) {
  const today = getTodayDate()
  switch (period) {
    case 'today': return { period, start: today, end: today }
    case 'yesterday': { const y = getYesterdayDate(); return { period, start: y, end: y } }
    case 'this_week': return { period, start: getSevenDaysAgoDate(), end: today }
    default: return { period: 'custom', start: filterDate.value, end: filterDate.value }
  }
}

function normalizeQueryValue(value: LocationQueryValue | LocationQueryValue[] | null | undefined): string {
  if (Array.isArray(value)) return normalizeQueryValue(value[0])
  return value ?? ''
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

  if (!Number.isNaN(routePage) && routePage > 0) currentPage.value = routePage
  activePeriod.value = routePeriod || 'today'

  if (routeStart) {
    filterDate.value = routeStart
  } else if (!routePeriod || routePeriod === 'today') {
    filterDate.value = getTodayDate()
  }

  if (['today', 'yesterday', 'this_week'].includes(routePeriod)) {
    const routeEnd = normalizeQueryValue(route.query.end)
    if (routePeriod === 'this_week' && routeStart) return
    if (routeEnd) filterDate.value = routeEnd
  }
}

async function fetchStatements() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const range = getCurrentRange()
    const quickRangeFilters =
      range.period === 'custom'
        ? {}
        : {
          filters: [
            { property: 's.created_at', operator: 'gte', value: `${range.start}T00:00:00` },
            { property: 's.created_at', operator: 'lte', value: `${range.end}T23:59:59` },
          ],
        }

    const response = await getStatements(
      currentPage.value,
      itemsPerPage,
      range.period === 'custom' ? range.start : '',
      quickRangeFilters,
    )
    const payload = response?.data.value
    const statementData = payload?.data
    const report = statementData?.total_report

    reportData.value = statementData?.statements ?? []
    totalItems.value = payload?.total ?? reportData.value.length
    allBetTotal.value = parseAmount(report?.total_bet)
    allValidTotal.value = parseAmount(report?.total_valid_bet)
    allWinLoseTotal.value = parseAmount(report?.total_winlose)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[statements] failed to load', err)
    reportData.value = []
    totalItems.value = allBetTotal.value = allValidTotal.value = allWinLoseTotal.value = 0
    errorMessage.value = err?.message || 'Failed to load statements'
  } finally {
    isLoading.value = false
  }
}

function handleDateChange() { activePeriod.value = 'custom'; currentPage.value = 1 }

function setQuickPeriod(period: 'today' | 'yesterday' | 'this_week') {
  activePeriod.value = period
  filterDate.value = getCurrentRange(period).start
  currentPage.value = 1
}

onMounted(async () => {
  syncStateFromRoute()
  await nextTick()
  await fetchStatements()
  isRouteSynced.value = true
  syncRouteQuery()
})

watch([filterDate, currentPage, activePeriod], () => {
  if (!isRouteSynced.value) return
  syncRouteQuery()
  fetchStatements()
})

defineExpose({
  open: async () => {
    if (currentPage.value !== 1) { currentPage.value = 1; return }
    await fetchStatements()
  },
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

:deep(td.positive) {
  color: #1E9C07 !important;
  font-weight: 700 !important;
}

:deep(td.negative) {
  color: #EF4444 !important;
  font-weight: 700 !important;
}
</style>
