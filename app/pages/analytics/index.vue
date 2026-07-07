<template>
  <div class="analytics-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Report Management</h1>
      </div>
    </div>

    <div class="content-wepper flex flex-col gap-2">

      <div class="filter-row">
        <div class="filter-left">
          <span class="filter-label">កាលបរិច្ឆេទ</span>
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
          <v-btn size="small" variant="flat" class="bonus-btn" @click="openBonusDialog(item)">
            + Bonus
          </v-btn>
        </template>
      </AppTable>
    </div>

    <!-- Create Bonus Dialog -->
    <v-dialog v-model="bonusDialog" max-width="420" persistent>
      <v-card class="bonus-dialog-card">
        <v-card-title class="bonus-dialog-title">
          បន្ថែម Bonus
          <div class="bonus-dialog-subtitle">{{ selectedMember?.name }}</div>
        </v-card-title>

        <v-card-text class="pt-2">
          <v-text-field v-model="bonusAmount" label="ចំនួនទឹកប្រាក់" persistent-hint
            density="compact" hide-details="auto" variant="outlined" class="mb-3 slate-input" />
          <v-textarea v-model="bonusNote" label="Note" variant="outlined" density="comfortable" rows="2" hide-details
            class="slate-input" />
          <div v-if="bonusError" class="bonus-error">{{ bonusError }}</div>
        </v-card-text>

        <v-card-actions class="justify-end pb-4 pr-4">
          <v-btn variant="text" :disabled="bonusSubmitting" @click="closeBonusDialog">
            បោះបង់
          </v-btn>
          <v-btn class="bonus-confirm-btn" :loading="bonusSubmitting" @click="submitBonus">
            រក្សាទុក
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import { toast } from 'vue-sonner'
import AppTable, { type TableColumn, type TotalRow } from '~/components/DynamicTableStyle.vue'
import { getReports, type ReportItem } from '~/composables/service/reportApi'
import { createMemberBonus } from '~/composables/service/memberBonusApi'
import PeriodFilterButtons from '~/components/PeriodFilterButtons.vue'

const route = useRoute()
const router = useRouter()

const columns: TableColumn<ReportItem>[] = [
  { key: 'index', label: 'លេខ', type: 'index' },
  { key: 'member_name', label: 'Member Name' },
  { key: 'total_bet_amount', label: 'Turn Over', align: 'right' },
  { key: 'total_valid_bet', label: 'Valid Bet', align: 'right' },
  {
    key: 'total_win_lose',
    label: 'Win/Lose',
    align: 'right',
    cellClass: (item: ReportItem) => parseAmount(item.total_win_lose) >= 0 ? 'positive' : 'negative',
  },
  { key: 'jackpot_win_amount', label: 'Jackpot Win', align: 'right' },
  { key: 'bonus', label: 'Bonus', align: 'center' },
]

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
const selectedMember = ref<{ id: number; name: string } | null>(null)
const bonusAmount = ref('')
const bonusNote = ref('')
const bonusSubmitting = ref(false)
const bonusError = ref('')
const bonusAmountError = ref('')

function openBonusDialog(item: ReportItem) {
  // NOTE: assumes ReportItem has `member_id`. Adjust if your field is named differently.
  selectedMember.value = { id: (item as any).member_id, name: item.member_name }
  bonusAmount.value = ''
  bonusNote.value = ''
  bonusError.value = ''
  bonusAmountError.value = ''
  bonusDialog.value = true
}

function closeBonusDialog() {
  if (bonusSubmitting.value) return
  bonusDialog.value = false
  selectedMember.value = null
}

async function submitBonus() {
  bonusError.value = ''
  bonusAmountError.value = ''

  const amountNum = parseAmount(bonusAmount.value)
  if (!bonusAmount.value || amountNum <= 0) {
    bonusAmountError.value = 'សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រឹមត្រូវ'
    return
  }
  if (!selectedMember.value?.id) {
    bonusError.value = 'Member ID មិនត្រឹមត្រូវ'
    return
  }

  bonusSubmitting.value = true
  try {
    await createMemberBonus({
      amount: bonusAmount.value,
      member_id: selectedMember.value.id,
      note: bonusNote.value,
    })
    toast.success('បន្ថែម Bonus ជោគជ័យ')
    bonusDialog.value = false
    selectedMember.value = null
    await fetchReports()
  } catch (error: any) {
    console.error('[bonus] failed to create', error)
    bonusError.value = error?.message || 'Failed to create bonus'
  } finally {
    bonusSubmitting.value = false
  }
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
    pageLabel: 'សរុបក្នុងមួយទំព័រ',
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
    pageLabel: 'សរុបទាំងអស់',
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
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value)
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
    errorMessage.value = error?.message || 'Failed to load analytics report'
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
  color: #111827;
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
  background: #E879B0 !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  text-transform: none !important;
  border-radius: 6px !important;
}

.bonus-dialog-card {
  border-radius: 12px;
}

.bonus-dialog-title {
  font-weight: 800;
  color: #111827;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bonus-dialog-subtitle {
  font-size: 12px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.6);
}

.bonus-confirm-btn {
  background: #E879B0 !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
  text-transform: none !important;
}

.bonus-error {
  color: #EF4444;
  font-size: 12px;
  margin-top: 8px;
}
</style>