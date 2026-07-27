<template>
  <div class="coin-page">
    <div class="page-header mt-3">
      <div>
        <h1 class="page-title">{{ t('members.title') }}</h1>
      </div>
      <div class="header-chips">
        <v-chip size="small" variant="tonal">
          {{ t('members.total', { total: totalItems }) }}
        </v-chip>
      </div>
    </div>

    <div class="content-wepper flex flex-col gap-2">
      <AppTable :columns="columns" :items="filteredMembers" :loading="isLoading" :error="errorMessage"
        :page="currentPage" :page-size="itemsPerPage" :total-pages="totalPages" @update:page="currentPage = $event">
        <template #cell-user_name="{ item }">
          <div class="member-cell">
            <div class="member-name">{{ item.user_name }}</div>
          </div>
        </template>

        <template #cell-bonus="{ item }">
          <v-btn size="small" variant="flat" color="create" class="bonus-btn" @click="openBonusDialog(item)">
            {{ t('report.addBonus') }}
          </v-btn>
        </template>

        <template #cell-is_online="{ item }">
          <v-chip :color="item.is_online ? 'success' : undefined" :variant="item.is_online ? 'tonal' : 'outlined'"
            size="small" style="font-weight: 600;">
            {{ item.is_online ? t('members.online') : t('members.offline') }}
          </v-chip>
        </template>
        <template #cell-is_active="{ item }">
          <div class="">
            <v-switch :model-value="item.is_active" color="primary" density="compact" hide-details inset
              :loading="jackpotUpdating[item.id]" :disabled="jackpotUpdating[item.id]"
              @update:model-value="(val) => toggleJackpotStatus(item, val as boolean)" />
          </div>
        </template>

        <template #cell-balances="{ item }">
          <v-menu :close-on-content-click="true" location="bottom center" :offset="4">
            <template #activator="{ props: menuProps, isActive }">
              <button v-bind="menuProps" class="balance-trigger" :class="{ 'balance-trigger--open': isActive }">
                <span class="balance-trigger__amount">{{ formatBalance(getSelectedBalance(item).balance) }}</span>
                <span class="balance-trigger__symbol">{{ getSelectedBalance(item).currency_symbol }}</span>

                <v-icon size="13" class="balance-trigger__chevron" :class="{ 'rotated': isActive }">
                  mdi-chevron-down
                </v-icon>
              </button>
            </template>

            <div class="balance-menu">
              <div v-for="b in item.balances" :key="b.currency_id" class="balance-menu__item"
                :class="{ 'balance-menu__item--active': getSelectedCurrencyId(item.id) === b.currency_id }"
                @click="selectCurrency(item.id, b.currency_id)">
                <span class="balance-menu__amount">{{ formatBalance(b.balance) }}</span>
                <span class="balance-menu__symbol">{{ b.currency_symbol }}</span>
                <v-icon v-if="getSelectedCurrencyId(item.id) === b.currency_id" size="13" class="balance-menu__check">
                  mdi-check
                </v-icon>
              </div>
            </div>
          </v-menu>
        </template>
      </AppTable>
    </div>

    <!-- Create Bonus Dialog -->
    <v-dialog v-model="bonusDialog" max-width="420">
      <v-card class="bonus-dialog-card">
        <v-card-title class="bonus-dialog-title">
          {{ t('report.addBonus') }}
          <div class="bonus-dialog-subtitle">{{ selectedMember?.name }}</div>
        </v-card-title>

        <v-card-text class="pt-2">
          <v-text-field v-model="bonusAmount" :label="t('report.amount')" persistent-hint density="compact"
            hide-details="auto" variant="outlined" class="mb-3 slate-input" />
          <v-textarea v-model="bonusNote" :label="t('report.note')" variant="outlined" density="comfortable" rows="2"
            hide-details class="slate-input" />
          <div v-if="bonusError" class="bonus-error">{{ bonusError }}</div>
        </v-card-text>

        <v-card-actions class="justify-end pb-4 pr-4">
          <v-btn variant="outlined" color="cancel" :disabled="bonusSubmitting" @click="closeBonusDialog">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="primary" class="bonus-confirm-btn" :loading="bonusSubmitting" @click="submitBonus">
            {{ t('report.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import { useFrontendI18n } from '~/composables/i18n'
import { useSnackbar } from '~/composables/useSnackbar'
import { createMemberBonus } from '~/composables/service/memberBonusApi'
import {
  getMembers,
  updateMemberJackpotStatus,
  type MemberItem,
} from '~/composables/service/membersApi'
import { formatDecimal } from '~/utils/numberFormat'

const { showSuccess, showError } = useSnackbar()
const { t } = useFrontendI18n()

const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)
const members = ref<MemberItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')

const selectedCurrencies = ref<Record<number, number>>({})

const columns = computed<TableColumn<MemberItem>[]>(() => [
  { key: 'id', label: t('members.no'), type: 'index', width: '60px' },
  { key: 'user_name', label: t('members.member'), width: '160px' },
  { key: 'login_id', label: t('members.loginId') },
  { key: 'phone_number', label: t('members.phone') },
  { key: 'nickname', label: t('members.nickname'), format: v => v || '-' },
  { key: 'coin_amount', label: t('members.coinAmount'), format: v => formatBalance(v), width: '120px' },
  { key: 'balances', label: t('members.balance'), width: '180px' },
  { key: 'is_online', label: t('members.status'), width: '100px' },
  { key: 'created_at', label: t('members.created'), format: v => formatDate(v) },
  { key: 'is_active', label: t('members.jackpotStatus'), width: '110px', align: 'center' },
  { key: 'bonus', label: t('report.bonus'), width: '140px', align: 'center' },
])

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value))
)

const filteredMembers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return members.value
  return members.value.filter(m =>
    m.user_name?.toLowerCase().includes(q) ||
    m.login_id?.toLowerCase().includes(q) ||
    m.phone_number?.toLowerCase().includes(q)
  )
})

function onSearchChange() {
  currentPage.value = 1
}

function getSelectedCurrencyId(memberId: number): number {
  return selectedCurrencies.value[memberId] ?? 1
}

function getSelectedBalance(item: MemberItem) {
  const currId = getSelectedCurrencyId(item.id)
  return (
    item.balances?.find(b => b.currency_id === currId) ??
    item.balances?.[0] ?? {
      currency_id: 0, currency_name: '-',
      currency_code: '-', currency_symbol: '-', balance: '0',
    }
  )
}

function selectCurrency(memberId: number, currencyId: number) {
  selectedCurrencies.value[memberId] = currencyId
}

const bonusDialog = ref(false)
const selectedMember = ref<{ id: number; name: string } | null>(null)
const bonusAmount = ref('')
const bonusNote = ref('')
const bonusSubmitting = ref(false)
const bonusError = ref('')
const bonusAmountError = ref('')

function openBonusDialog(item: MemberItem) {
  selectedMember.value = { id: item.id, name: item.user_name }
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

  const memberName = selectedMember.value?.name?.trim() ?? ''
  const amountNum = Number.parseFloat(bonusAmount.value || '0') || 0

  if (!bonusAmount.value || amountNum <= 0) {
    bonusAmountError.value = t('report.invalidAmount')
    return
  }

  if (!memberName || !selectedMember.value?.id) {
    bonusError.value = t('report.invalidMember')
    return
  }

  bonusSubmitting.value = true

  try {
    await createMemberBonus({
      amount: bonusAmount.value,
      member_id: selectedMember.value.id,
      member_name: memberName,
      note: bonusNote.value,
    })

    showSuccess(t('report.bonusCreated'))
    bonusDialog.value = false
    selectedMember.value = null
  }
  catch (e: any) {
    const message = e?.message ?? t('jackpot.failedToCreateMemberBonus')
    showError(message)
    bonusError.value = message
  }
  finally {
    bonusSubmitting.value = false
  }
}

function formatBalance(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return formatDecimal(num, { maximumFractionDigits: 2, fallback: '-' })
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
}

async function fetchMembers() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await getMembers(currentPage.value, itemsPerPage.value)
    const payload = res?.data.value as
      { data: { members: MemberItem[] }; total: number } | undefined
    members.value = payload?.data?.members ?? []
    totalItems.value = payload?.total ?? 0
  } catch (e: any) {
    members.value = []
    totalItems.value = 0
    errorMessage.value = e?.message || t('members.failedToLoad')
  } finally {
    isLoading.value = false
  }
}

const jackpotUpdating = ref<Record<number, boolean>>({})

async function toggleJackpotStatus(item: MemberItem, newValue: boolean) {
  const prevValue = item.is_active
  item.is_active = newValue // optimistic update
  jackpotUpdating.value[item.id] = true

  try {
    const res = await updateMemberJackpotStatus(item.id, newValue)
    const payload = res?.data.value as { data: { is_active: boolean } } | undefined
    item.is_active = payload?.data?.is_active ?? newValue
    showSuccess(t('members.jackpotStatusUpdated'))
  } catch (e: any) {
    item.is_active = prevValue // rollback on failure
    showError(e?.message ?? t('members.failedToUpdateJackpotStatus'))
  } finally {
    jackpotUpdating.value[item.id] = false
  }
}

onMounted(fetchMembers)
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
  color: rgb(var(--v-theme-primary));
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.header-chips {
  display: flex;
  align-items: center;
  gap: 12px;
}

.content-wepper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-name {
  font-weight: 600;
  font-size: 13px;
  color: #111827;
}

.bonus-btn {
  font-weight: 700 !important;
  font-size: 12px !important;
  text-transform: none !important;
  border-radius: 8px !important;
}

.balance-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 7px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, background 0.15s;
  outline: none;
  user-select: none;
}

.balance-trigger:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.28);
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.balance-trigger--open {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.04);
}

.balance-trigger__symbol {
  font-size: 11px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.5);
  letter-spacing: 0.3px;
}

.balance-trigger__amount {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: -0.2px;
}

.balance-trigger__chevron {
  color: rgba(var(--v-theme-on-surface), 0.35) !important;
  transition: transform 0.18s ease;
}

.balance-trigger__chevron.rotated {
  transform: rotate(180deg);
}

.balance-menu {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  min-width: 150px;
  padding: 4px;
}

.balance-menu__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
}

.balance-menu__item:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.balance-menu__item--active {
  background: rgba(var(--v-theme-primary), 0.08);
}

.balance-menu__symbol {
  font-size: 11px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.45);
  min-width: 14px;
  letter-spacing: 0.3px;
}

.balance-menu__amount {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: -0.2px;
}

.balance-menu__check {
  color: rgb(var(--v-theme-primary)) !important;
  flex-shrink: 0;
}

.bonus-dialog-card {
  border-radius: 14px !important;
  overflow: hidden;
}

.bonus-dialog-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.bonus-dialog-subtitle {
  font-size: 12px;
  font-weight: 500;
  color: #9CA3AF;
}

.bonus-confirm-btn {
  font-weight: 700 !important;
  text-transform: none !important;
}

.bonus-error {
  color: #EF4444;
  font-size: 12px;
  margin-top: 8px;
}
</style>
