<template>
  <div class="coin-page">
    <div class="content-wepper flex flex-col gap-2">
      <AppVTable
        :columns="columns"
        :items="bonusData.slice(0, 10)"
        :loading="isLoading"
        :error="errorMessage"
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
      color="create"
      icon="mdi-plus"
      size="large"
      elevation="8"
      :aria-label="t('jackpot.createMemberBonus')"
      @click="openCreateDialog"
    />

    <!-- Create dialog -->
    <v-dialog v-model="createDialog" max-width="560">
      <v-card class="create-dialog-card">
        <div class="dialog-header">
          <div class="dialog-title-row">
            <v-icon size="20" color="rgb(var(--v-theme-primary))">mdi-cash-plus</v-icon>
            <h2>{{ t('jackpot.createMemberBonus') }}</h2>
          </div>
          <v-btn icon size="small" variant="text" @click="closeCreateDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group half">
              <label class="form-label">{{ t('members.member') }} <span class="required">*</span></label>
              <v-text-field
                :model-value="createForm.member_name"
                type="text"
                inputmode="text"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :placeholder="t('common.memberNamePlaceholder')"
                @update:model-value="createForm.member_name = normalizeMemberName($event)"
              />
            </div>

            <div class="form-group half">
              <label class="form-label">{{ t('jackpot.amount') }} <span class="required">*</span></label>
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
              <label class="form-label">{{ t('jackpot.note') }}</label>
              <v-text-field
                v-model="createForm.note"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :placeholder="t('common.optionalNote')"
              />
            </div>
          </div>
        </div>

        <v-divider />

        <div class="dialog-actions">
          <v-btn variant="outlined" color="cancel" @click="closeCreateDialog">{{ t('common.cancel') }}</v-btn>
          <v-btn color="create" :loading="createLoading" @click="submitCreateBonus">
            {{ t('jackpot.createMemberBonus') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppVTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import { useFrontendI18n } from '~/composables/i18n'
import { useSnackbar } from '~/composables/useSnackbar'
import {
  createMemberBonus,
  getMemberBonuses,
  type MemberBonusItem,
} from '~/composables/service/memberBonusApi'
import { formatDecimal } from '~/utils/numberFormat'

const { showError, showSuccess } = useSnackbar()
const { t } = useFrontendI18n()

const columns = computed<TableColumn<MemberBonusItem>[]>(() => [
  { key: 'index',      label: t('members.no'),       type: 'index' },
  { key: 'member_name',  label: t('members.member') },
  { key: 'amount',     label: t('jackpot.amount') },
  { key: 'status_id',  label: t('gameConfig.status') },
  { key: 'created_by_name', label: t('gameConfig.updatedBy') },
  { key: 'created_at', label: t('gameConfig.updatedAt') },
])

const bonusData     = ref<MemberBonusItem[]>([])
const isLoading     = ref(false)
const errorMessage  = ref('')
const createDialog  = ref(false)
const createLoading = ref(false)
const createForm    = ref({ member_name: '', amount: '', note: '' })

function formatDateForInput(date: Date): string {
  const year  = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day   = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseAmount(value: string | undefined | null): number {
  return Number.parseFloat(value ?? '0') || 0
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

function normalizeMemberName(value: string | number | null | undefined): string {
  return String(value ?? '').toUpperCase()
}

function blockNonDecimalKeys(event: KeyboardEvent) {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
  if (!/[\d.]/.test(event.key)) { event.preventDefault(); return }
  if (event.key === '.' && (event.currentTarget as HTMLInputElement | null)?.value?.includes('.')) {
    event.preventDefault()
  }
}

function handleDecimalPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/[\d.]/.test(text)) event.preventDefault()
}

function formatAmount(value: number): string {
  return formatDecimal(value, { maximumFractionDigits: 2 })
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
  const map: Record<number, string> = {
    1: t('common.pending'),
    2: t('common.approved'),
    3: t('common.rejected'),
  }
  return map[statusId] ?? `#${statusId}`
}

async function fetchBonuses() {
  isLoading.value    = true
  errorMessage.value = ''
  try {
    const today    = formatDateForInput(new Date())
    const response = await getMemberBonuses(1, 10, today, today)
    const payload  = response?.data.value
    bonusData.value  = (payload?.data?.bonuses ?? []).slice(0, 10)
  } catch (error: any) {
    console.error('[member-bonuses] failed to load', error)
    bonusData.value  = []
    errorMessage.value = error?.message || t('jackpot.failedToLoadHistory')
  } finally {
    isLoading.value = false
  }
}

function openCreateDialog() {
  createForm.value = { member_name: '', amount: '', note: '' }
  createDialog.value = true
}

function closeCreateDialog() {
  createDialog.value = false
}

async function submitCreateBonus() {
  const amount   = parseAmount(createForm.value.amount)
  if (!createForm.value.member_name.trim() || amount <= 0) {
    showError(t('report.invalidAmount'))
    return
  }
  createLoading.value = true
  try {
    const response = await createMemberBonus({
      member_name: normalizeMemberName(createForm.value.member_name).trim(),
      amount:    createForm.value.amount,
      note:      createForm.value.note ?? '',
    })
    const payload = response?.data.value
    showSuccess(payload?.message || t('jackpot.memberBonusCreated'))
    createDialog.value = false
    await fetchBonuses()
  } catch (error: any) {
    console.error('[member-bonuses] create failed', error)
    showError(error?.message || t('jackpot.failedToCreateMemberBonus'))
  } finally {
    createLoading.value = false
  }
}

onMounted(fetchBonuses)
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
