<template>
  <div class="analytics-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('report.title') }}</h1>
      </div>
    </div>

    <div class="content-wepper flex flex-col gap-2">

      <div class="filter-row">
        <div class="filter-left">
          <span class="filter-label">{{ t('report.date') }}</span>
          <v-text-field v-model="filterDate" type="date" density="compact" hide-details variant="outlined"
            style="max-width: 180px" class="slate-input" @update:model-value="handleDateChange" />
        </div>

        <div class="filter-right">
          <PeriodFilterButtons :active-period="activePeriod" @update:active-period="setQuickPeriod" />
        </div>
      </div>

      <AppTable :columns="columns" :items="reportData" :loading="isLoading" :error="errorMessage" :page="currentPage"
        :page-size="itemsPerPage" :total-pages="totalPages" :subtotals="subtotalsRow" :grand-totals="grandTotalsRow"
        @update:page="currentPage = $event">
        <template #cell-total_bet_amount="{ item }">
          <span class="positive">{{ formatAmount(parseAmount(item.total_bet_amount)) }}</span>
        </template>

        <template #cell-total_valid_bet="{ item }">
          <span class="positive">{{ formatAmount(parseAmount(item.total_valid_bet)) }}</span>
        </template>

        <template #cell-total_win_lose="{ item }">
          {{ formatAmount(parseAmount(item.total_win_lose)) }}
        </template>

        <template #cell-jackpot_win_amount="{ item }">
          <span class="positive">{{ formatAmount(parseAmount(item.jackpot_win_amount)) }}</span>
        </template>

        <template #cell-bonus="{ item }">
          <v-btn size="small" variant="flat" color="create" class="bonus-btn" @click="openBonusDialog(item)">
            {{ t('report.addBonus') }}
          </v-btn>
        </template>
      </AppTable>
    </div>

    <!-- Create Bonus Dialog -->
    <MemberBonusDialog
      v-model="bonusDialog"
      :member="selectedMember"
      @created="fetchReports"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import AppTable, { type TableColumn, type TotalRow } from '~/components/DynamicTableStyle.vue'
import MemberBonusDialog, { type BonusMember } from '~/components/MemberBonusDialog.vue'
import { useFrontendI18n } from '~/composables/i18n'
import { getReports, type ReportItem } from '~/composables/service/reportApi'
import PeriodFilterButtons from '~/components/PeriodFilterButtons.vue'
import { formatDecimal } from '~/utils/numberFormat'

const route = useRoute()
const router = useRouter()
const { t } = useFrontendI18n()

const columns = computed<TableColumn<ReportItem>[]>(() => [
  { key: 'index', label: 'លេខរៀង', type: 'index' },
  { key: 'member_name', label: t('members.member') },
  { key: 'total_bet_amount', label: t('report.turnOver'), align: 'right' },
  { key: 'total_valid_bet', label: t('report.validBet'), align: 'right' },
  {
    key: 'total_win_lose',
    label: t('report.winLose'),
    align: 'right',
    cellClass: (item: ReportItem) => parseAmount(item.total_win_lose) >= 0 ? 'positive' : 'negative',
  },
  { key: 'jackpot_win_amount', label: t('report.jackpotWin'), align: 'right' },
  { key: 'bonus', label: t('report.bonus'), align: 'center' },
])

const filterDate = ref(formatDateForInput(new Date()))
const currentPage = ref(1)
const itemsPerPage = 10
const totalItems = ref(0)
const reportData = ref<ReportItem[]>([])
const reportTotal = ref<{ total_bet: string; total_valid_bet: string; total_winlose: string } | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const isRouteSynced = ref(false)
const activePeriod = ref<'custom' | 'today' | 'yesterday' | 'this_week'>('today')

// --- Bonus dialog state ---
const bonusDialog = ref(false)
const selectedMember = ref<BonusMember | null>(null)

function openBonusDialog(item: ReportItem) {
  // NOTE: assumes ReportItem has `member_id`. Adjust if your field is named differently.
  selectedMember.value = { id: (item as any).member_id, name: item.member_name }
  bonusDialog.value = true
}

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / itemsPerPage)),
)

const pageBetTotal = computed(() =>
  reportData.value.reduce((sum, row) => sum + parseAmount(row.total_bet_amount), 0),
)
const pageValidTotal = computed(() =>
  reportData.value.reduce((sum, row) => sum + parseAmount(row.total_valid_bet), 0),
)
const pageWinLoseTotal = computed(() =>
  reportData.value.reduce((sum, row) => sum + parseAmount(row.total_win_lose), 0),
)
const pageJackpotTotal = computed(() =>
  reportData.value.reduce((sum, row) => sum + parseAmount(row.jackpot_win_amount), 0),
)

const subtotalsRow = computed<TotalRow | undefined>(() => {
  if (!reportData.value.length) return undefined

  return {
    labelSpan: 2,
    pageLabel: t('report.pageSubtotal'),
    cols: [
      { key: 'total_bet_amount', value: formatAmount(pageBetTotal.value), class: 'positive' },
      { key: 'total_valid_bet', value: formatAmount(pageValidTotal.value), class: 'positive' },
      {
        key: 'total_win_lose',
        value: formatAmount(pageWinLoseTotal.value),
        class: pageWinLoseTotal.value >= 0 ? 'positive' : 'negative',
      },
      { key: 'jackpot_win_amount', value: formatAmount(pageJackpotTotal.value), class: 'positive' },
      { key: 'bonus', value: '-' },
    ],
  }
})

const grandTotalsRow = computed<TotalRow | undefined>(() => {
  if (!reportTotal.value) return undefined

  const totalBet = parseAmount(reportTotal.value.total_bet)
  const totalValid = parseAmount(reportTotal.value.total_valid_bet)
  const totalWinLose = parseAmount(reportTotal.value.total_winlose)

  return {
    labelSpan: 2,
    pageLabel: t('report.grandTotal'),
    cols: [
      { key: 'total_bet_amount', value: formatAmount(totalBet), class: 'positive' },
      { key: 'total_valid_bet', value: formatAmount(totalValid), class: 'positive' },
      {
        key: 'total_win_lose',
        value: formatAmount(totalWinLose),
        class: totalWinLose >= 0 ? 'positive' : 'negative',
      },
      { key: 'jackpot_win_amount', value: '-' },
      { key: 'bonus', value: '-' },
    ],
  }
})

function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
}

function formatAmount(value: number): string {
  return formatDecimal(value, { maximumFractionDigits: 3 })
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeQueryValue(value: LocationQueryValue | LocationQueryValue[] | null | undefined): string {
  if (Array.isArray(value)) return normalizeQueryValue(value[0])
  return value ?? ''
}

function syncRouteQuery() {
  const range = getCurrentRange()
  const next = { period: range.period, start: range.start, end: range.end, page: `${currentPage.value}` }
  const current = {
    period: normalizeQueryValue(route.query.period),
    start: normalizeQueryValue(route.query.start),
    end: normalizeQueryValue(route.query.end),
    page: normalizeQueryValue(route.query.page),
  }

  if (
    current.period === next.period &&
    current.start === next.start &&
    current.end === next.end &&
    current.page === next.page
  ) return

  router.replace({ path: route.path, query: next })
}

function syncStateFromRoute() {
  const routePage = Number.parseInt(normalizeQueryValue(route.query.page), 10)
  const routeStart = normalizeQueryValue(route.query.start)
  const routePeriod = normalizeQueryValue(route.query.period)
  const routeEnd = normalizeQueryValue(route.query.end)

  if (!Number.isNaN(routePage) && routePage > 0) currentPage.value = routePage

  activePeriod.value = ['today', 'yesterday', 'this_week'].includes(routePeriod)
    ? routePeriod as 'today' | 'yesterday' | 'this_week'
    : 'today'

  if (activePeriod.value === 'today') filterDate.value = getTodayDate()
  else if (activePeriod.value === 'yesterday') filterDate.value = routeStart || routeEnd || getYesterdayDate()
  else if (activePeriod.value === 'this_week') filterDate.value = routeStart || getSevenDaysAgoDate()
  else if (routeStart) filterDate.value = routeStart
  else if (routeEnd) filterDate.value = routeEnd
}

async function fetchReports() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const range = getCurrentRange()
    const response = await getReports(currentPage.value, itemsPerPage, range.start, range.end)
    const payload = response?.data.value
    reportData.value = payload?.data?.reports ?? []
    reportTotal.value = payload?.data?.total_report ?? null
    totalItems.value = payload?.total ?? 0
  } catch (error: any) {
    console.error('[analytics] failed to load', error)
    reportData.value = []
    reportTotal.value = null
    totalItems.value = 0
    errorMessage.value = error?.message || t('report.failedToLoad')
  } finally {
    isLoading.value = false
  }
}

function handleDateChange() { activePeriod.value = 'custom'; currentPage.value = 1 }
function getTodayDate() { return formatDateForInput(new Date()) }
function getYesterdayDate() { const d = new Date(); d.setDate(d.getDate() - 1); return formatDateForInput(d) }
function getSevenDaysAgoDate() { const d = new Date(); d.setDate(d.getDate() - 6); return formatDateForInput(d) }


function getCurrentRange(period = activePeriod.value) {
  const today = getTodayDate()
  switch (period) {
    case 'today': return { period, start: today, end: today }
    case 'yesterday': return { period, start: getYesterdayDate(), end: getYesterdayDate() }
    case 'this_week': return { period, start: getSevenDaysAgoDate(), end: today }
    default: return { period: 'custom', start: filterDate.value, end: filterDate.value }
  }
}

function setQuickPeriod(period: 'today' | 'yesterday' | 'this_week') {
  activePeriod.value = period
  filterDate.value = getCurrentRange(period).start
  currentPage.value = 1
}

onMounted(async () => {
  syncStateFromRoute()
  await nextTick()
  await fetchReports()
  isRouteSynced.value = true
  syncRouteQuery()
})

watch([filterDate, currentPage, activePeriod], () => {
  if (!isRouteSynced.value) return
  syncRouteQuery()
  fetchReports()
})
</script>

<style scoped>
.analytics-page {
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

.page-subtitle {
  margin-top: 4px;
  color: rgba(17, 24, 39, 0.7);
  font-size: 13px;
}

.content-wepper {
  margin-top: 8px;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-right {
  display: flex;
  align-items: center;
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

.analytics-chip {
  font-weight: 700;
}

:deep(td.positive) {
  color: #1E9C07 !important;
  font-weight: 700 !important;
}

:deep(td.negative) {
  color: #EF4444 !important;
  font-weight: 700 !important;
}

:deep(td.uuid-cell) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
}

.bonus-btn {
  font-weight: 700 !important;
  font-size: 12px !important;
  text-transform: none !important;
  border-radius: 6px !important;
}
</style>