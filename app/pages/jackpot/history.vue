<template>
  <div fluid class="pa-2">
    <div class="filter-row mb-4">
      <div class="filter-left">
        <span class="text-xl filter-label">កាលបរិច្ឆេទ</span>
        <v-text-field
          v-model="filterDate"
          type="date"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 180px"
          class="ocean-input"
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
      :items="historyData"
      :loading="isLoading"
      :error="errorMessage"
      :page="currentPage"
      :page-size="itemsPerPage"
      :total-pages="totalPages"
      @update:page="currentPage = $event"
    >
      <!-- payout_coin — green -->
      <template #cell-payout_coin="{ item }">
        <span class="positive">{{ formatAmount(parseAmount(item.payout_coin)) }}</span>
      </template>

      <!-- pool_before -->
      <template #cell-pool_before="{ item }">
        {{ formatAmount(parseAmount(item.pool_before)) }}
      </template>

      <!-- pool_after -->
      <template #cell-pool_after="{ item }">
        {{ formatAmount(parseAmount(item.pool_after)) }}
      </template>

      <!-- created_at -->
      <template #cell-created_at="{ item }">
        {{ formatDateTime(item.created_at) }}
      </template>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import PeriodFilterButtons from '~/components/PeriodFilterButtons.vue'
import { getJackpotHistories, type JackpotHistoryItem } from '~/composables/service/jackpotHistoryApi'

const route = useRoute()
const router = useRouter()


const columns: TableColumn<JackpotHistoryItem>[] = [
  { key: 'index',           label: 'លេខ',              type: 'index' },
  { key: 'member_name',     label: 'Member Name' },
  { key: 'fish_type_name',  label: 'Fish' },
  { key: 'jackpot_type_name', label: 'Jackpot Type Name' },
  { key: 'payout_coin',     label: 'Payout Coin' },
  { key: 'pool_before',     label: 'Pool Before' },
  { key: 'pool_after',      label: 'Pool After' },
  { key: 'created_at',      label: 'Created At' },
]

const filterDate   = ref(formatDateForInput(new Date()))
const currentPage  = ref(1)
const itemsPerPage = 20
const totalItems   = ref(0)
const historyData  = ref<JackpotHistoryItem[]>([])
const isLoading    = ref(false)
const errorMessage = ref('')
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

function getTodayDate()     { return formatDateForInput(new Date()) }
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


async function fetchHistories() {
  isLoading.value    = true
  errorMessage.value = ''
  try {
    const response = await getJackpotHistories(currentPage.value, itemsPerPage, filterDate.value, filterDate.value)
    const payload  = response?.data.value
    historyData.value = payload?.data?.histories ?? []
    totalItems.value  = payload?.total ?? 0
  } catch (error: any) {
    console.error('[jackpot-history] failed to load', error)
    historyData.value = []
    totalItems.value  = 0
    errorMessage.value = error?.message || 'Failed to load jackpot history'
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
  await fetchHistories()
  isRouteSynced.value = true
  syncRouteQuery()
})

watch([filterDate, currentPage], () => {
  if (!isRouteSynced.value) return
  syncRouteQuery()
  fetchHistories()
})
</script>

<style scoped>
.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
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
  color: rgb(var(--v-theme-primary));
}

.filter-btn {
  border-width: 1.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  color: white !important;
}

.ocean-input :deep(.v-field) {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.ocean-input :deep(.v-field__outline) {
  color: rgb(var(--v-theme-secondary)) !important;
}

.ocean-input :deep(input) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.positive {
  color: #1E9C07;
  font-weight: 700;
}
</style>
