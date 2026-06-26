<template>
  <div class="coin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Member Bonus</h1>
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
        :items="bonusData"
        :loading="isLoading"
        :error="errorMessage"
        :page="currentPage"
        :page-size="itemsPerPage"
        :total-pages="totalPages"
        @update:page="currentPage = $event"
      >
        <template #cell-amount="{ item }">
          <span class="positive">{{ formatAmount(parseAmount(item.amount)) }}</span>
        </template>

        <template #cell-note="{ item }">
          {{ item.note || '-' }}
        </template>

        <template #cell-status_id="{ item }">
          {{ getStatusLabel(item.status_id) }}
        </template>

        <template #cell-created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>
      </AppTable>
    </div>

    <!-- FAB -->
    <v-btn
      class="create-fab"
      color="primary"
      icon="mdi-plus"
      size="large"
      elevation="8"
      aria-label="Create member bonus"
      @click="openCreateDialog"
    />

    <!-- Create dialog -->
    <v-dialog v-model="createDialog" max-width="560" >
      <v-card class="create-dialog-card">
        <div class="dialog-header">
          <div class="dialog-title-row">
            <v-icon size="20" color="rgb(var(--v-theme-primary))">mdi-cash-plus</v-icon>
            <h2>Create Member Bonus</h2>
          </div>
          <v-btn icon size="small" variant="text" @click="closeCreateDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group half">
              <label class="form-label">Member ID <span class="required">*</span></label>
              <v-text-field
                :model-value="createForm.member_id"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                placeholder="1"
                @keydown="blockNonIntegerKeys"
                @paste="handleIntegerPaste"
                @update:model-value="createForm.member_id = sanitizeIntegerInput($event)"
              />
            </div>

            <div class="form-group half">
              <label class="form-label">Amount <span class="required">*</span></label>
              <v-text-field
                :model-value="createForm.amount"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                placeholder="15000"
                @keydown="blockNonDecimalKeys"
                @paste="handleDecimalPaste"
                @update:model-value="createForm.amount = sanitizeDecimalInput($event)"
              />
            </div>

            <div class="form-group full">
              <label class="form-label">Note</label>
              <v-text-field
                v-model="createForm.note"
                density="compact"
                variant="outlined"
                hide-details="auto"
                placeholder="Optional note"
              />
            </div>
          </div>
        </div>

        <v-divider />

        <div class="dialog-actions">
          <v-btn variant="outlined" @click="closeCreateDialog">Cancel</v-btn>
          <v-btn color="primary" :loading="createLoading" @click="submitCreateBonus">
            Create Bonus
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import PeriodFilterButtons from '~/components/PeriodFilterButtons.vue'
import { useSnackbar } from '~/composables/useSnackbar'
import {
  createMemberBonus,
  getMemberBonuses,
  type MemberBonusItem,
} from '~/composables/service/memberBonusApi'

const { showError, showSuccess } = useSnackbar()
const route  = useRoute()
const router = useRouter()

// ── Columns ───────────────────────────────────────────────────────────────────

const columns: TableColumn<MemberBonusItem>[] = [
  { key: 'index',      label: 'លេខ',       type: 'index' },
  { key: 'member_id',  label: 'Member ID' },
  { key: 'amount',     label: 'Amount' },
  { key: 'note',       label: 'Note' },
  { key: 'order',      label: 'Order' },
  { key: 'status_id',  label: 'Status' },
  { key: 'created_by', label: 'Created By' },
  { key: 'created_at', label: 'Time' },
]

// ── State ─────────────────────────────────────────────────────────────────────

const filterDate    = ref(formatDateForInput(new Date()))
const currentPage   = ref(1)
const itemsPerPage  = 20
const totalItems    = ref(0)
const bonusData     = ref<MemberBonusItem[]>([])
const isLoading     = ref(false)
const errorMessage  = ref('')
const isRouteSynced = ref(false)
const activePeriod  = ref<'custom' | 'today' | 'yesterday' | 'this_week'>('today')
const createDialog  = ref(false)
const createLoading = ref(false)
const createForm    = ref({
  member_id: '',
  amount: '',
  note: '',
})

// ── Computed ──────────────────────────────────────────────────────────────────

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / itemsPerPage)),
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
}

function sanitizeIntegerInput(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/\D+/g, '')
}

function sanitizeDecimalInput(value: string | number | null | undefined): string {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '')
  if (!cleaned) return ''

  const [integerPart = '', ...fractionParts] = cleaned.split('.')
  const fractionPart = fractionParts.join('')

  if (cleaned.startsWith('.')) {
    return fractionPart ? `0.${fractionPart}` : '0.'
  }

  if (!fractionPart) {
    return integerPart
  }

  return `${integerPart || '0'}.${fractionPart}`
}

function blockNonDecimalKeys(event: KeyboardEvent) {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ]

  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
  if (!/[\d.]/.test(event.key)) {
    event.preventDefault()
    return
  }

  if (event.key === '.' && (event.currentTarget as HTMLInputElement | null)?.value?.includes('.')) {
    event.preventDefault()
  }
}

function blockNonIntegerKeys(event: KeyboardEvent) {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ]

  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

function handleDecimalPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/[\d.]/.test(text)) {
    event.preventDefault()
  }
}

function handleIntegerPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/^\d+$/.test(text)) {
    event.preventDefault()
  }
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
    case 'today':     return { period, start: today,                end: today }
    case 'yesterday': return { period, start: getYesterdayDate(),   end: getYesterdayDate() }
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

function getStatusLabel(statusId: number): string {
  const map: Record<number, string> = {
    1: 'Pending',
    2: 'Approved',
    3: 'Rejected',
  }
  return map[statusId] ?? `#${statusId}`
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchBonuses() {
  isLoading.value    = true
  errorMessage.value = ''
  try {
    const response = await getMemberBonuses(currentPage.value, itemsPerPage, filterDate.value, filterDate.value)
    const payload  = response?.data.value
    bonusData.value  = payload?.data?.bonuses ?? []
    totalItems.value = payload?.total ?? 0
  } catch (error: any) {
    console.error('[member-bonuses] failed to load', error)
    bonusData.value  = []
    totalItems.value = 0
    errorMessage.value = error?.message || 'Failed to load member bonuses'
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

function openCreateDialog() {
  createForm.value = { member_id: '', amount: '', note: '' }
  createDialog.value = true
}

function closeCreateDialog() {
  createDialog.value = false
}

async function submitCreateBonus() {
  const memberId = Number.parseInt(createForm.value.member_id, 10)
  const amount   = parseAmount(createForm.value.amount)

  if (!Number.isFinite(memberId) || memberId < 1 || amount <= 0) {
    showError('Member ID and amount are required')
    return
  }
  createLoading.value = true
  try {
    const response = await createMemberBonus({
      member_id: memberId,
      amount:    createForm.value.amount,
      note:      createForm.value.note ?? '',
    })
    const payload = response?.data.value
    showSuccess(payload?.message || 'Member bonus created successfully')
    createDialog.value = false
    await fetchBonuses()
  } catch (error: any) {
    console.error('[member-bonuses] create failed', error)
    showError(error?.message || 'Failed to create member bonus')
  } finally {
    createLoading.value = false
  }
}

onMounted(async () => {
  syncStateFromRoute()
  await nextTick()
  await fetchBonuses()
  isRouteSynced.value = true
  syncRouteQuery()
})

watch([filterDate, currentPage], () => {
  if (!isRouteSynced.value) return
  syncRouteQuery()
  fetchBonuses()
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

/* ── FAB ── */
.create-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 30;
}

/* ── Dialog ── */
.create-dialog-card {
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
}

.dialog-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dialog-title-row h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.dialog-body {
  padding: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full  { grid-column: 1 / -1; }
.form-group.half  { min-width: 0; }

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.required {
  color: rgb(var(--v-theme-error));
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px 20px;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }

  .dialog-actions .v-btn {
    width: 100%;
  }

  .create-fab {
    right: 16px;
    bottom: 16px;
  }
}
</style>
