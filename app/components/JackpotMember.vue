<template>
  <div class="coin-page">
    <div class="content-wepper flex flex-col gap-2">
      <AppVTable
        :columns="columns"
        :items="bonusData"
        :loading="isLoading"
        :error="errorMessage"
        :page="currentPage"
        :page-size="itemsPerPage"
        :total-pages="totalPages"
        empty-text="No member bonuses found"
        empty-subtext="Create one using the + button."
        @update:page="currentPage = $event"
      >
        <template #cell-amount="{ item }">
          <span class="positive">{{ formatAmount(parseAmount(item.amount)) }}</span>
        </template>

        <template #cell-status_id="{ item }">
          {{ getStatusLabel(item.status_id) }}
        </template>

        <template #cell-created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>
      </AppVTable>
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
    <v-dialog v-model="createDialog" max-width="560">
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
import { computed, onMounted, ref, watch } from 'vue'
import AppVTable, { type TableColumn } from '~/components/AppTableFixed.vue'
import { useSnackbar } from '~/composables/useSnackbar'
import {
  createMemberBonus,
  getMemberBonuses,
  type MemberBonusItem,
} from '~/composables/service/memberBonusApi'

const { showError, showSuccess } = useSnackbar()

const columns: TableColumn<MemberBonusItem>[] = [
  { key: 'index',      label: 'លេខ',       type: 'index' },
  { key: 'member_name',  label: 'Member Name' },
  { key: 'amount',     label: 'Amount' },
  { key: 'status_id',  label: 'Status' },
  { key: 'created_by_name', label: 'Created By' },
  { key: 'created_at', label: 'Time' },
]

const currentPage   = ref(1)
const itemsPerPage  = 10
const totalItems    = ref(0)
const bonusData     = ref<MemberBonusItem[]>([])
const isLoading     = ref(false)
const errorMessage  = ref('')
const createDialog  = ref(false)
const createLoading = ref(false)
const createForm    = ref({ member_id: '', amount: '', note: '' })

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

function sanitizeIntegerInput(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/\D+/g, '')
}

function sanitizeDecimalInput(value: string | number | null | undefined): string {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '')
  if (!cleaned) return ''
  const [integerPart = '', ...fractionParts] = cleaned.split('.')
  const fractionPart = fractionParts.join('')
  if (cleaned.startsWith('.')) return fractionPart ? `0.${fractionPart}` : '0.'
  if (!fractionPart) return integerPart
  return `${integerPart || '0'}.${fractionPart}`
}

function blockNonDecimalKeys(event: KeyboardEvent) {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
  if (!/[\d.]/.test(event.key)) { event.preventDefault(); return }
  if (event.key === '.' && (event.currentTarget as HTMLInputElement | null)?.value?.includes('.')) {
    event.preventDefault()
  }
}

function blockNonIntegerKeys(event: KeyboardEvent) {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
  if (!/^\d$/.test(event.key)) event.preventDefault()
}

function handleDecimalPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/[\d.]/.test(text)) event.preventDefault()
}

function handleIntegerPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/^\d+$/.test(text)) event.preventDefault()
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

function getStatusLabel(statusId: number): string {
  const map: Record<number, string> = { 1: 'Pending', 2: 'Approved', 3: 'Rejected' }
  return map[statusId] ?? `#${statusId}`
}

async function fetchBonuses() {
  isLoading.value    = true
  errorMessage.value = ''
  try {
    const today    = formatDateForInput(new Date())
    const response = await getMemberBonuses(currentPage.value, itemsPerPage, today, today)
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

onMounted(fetchBonuses)

watch(currentPage, fetchBonuses)
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

.create-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 30;
}

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

.form-group.full { grid-column: 1 / -1; }
.form-group.half { min-width: 0; }

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
  .form-grid { grid-template-columns: 1fr; }
  .dialog-actions { flex-direction: column-reverse; }
  .dialog-actions .v-btn { width: 100%; }
  .create-fab { right: 16px; bottom: 16px; }
}
</style>
