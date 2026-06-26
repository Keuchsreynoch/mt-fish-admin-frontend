<template>
  <div class="members-page">

    <!-- ── Page Header ───────────────────────────────────────── -->
    <div class="page-header">
      <!-- <div class="page-header__left">
        <v-text-field v-model="searchQuery" placeholder="Search by name" prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable style="min-width: 280px;"
          @update:model-value="onSearchChange" />
      </div>
      <div class="page-header__right">
        <h1 class="page-title">Members</h1>
        <span class="page-subtitle">{{ totalItems }} total</span>
      </div> -->
      

    </div>

    <!-- ── Table ─────────────────────────────────────────────── -->
    <div class="table-card">
      <AppTable :columns="columns" :items="filteredMembers" :loading="isLoading" :error="errorMessage"
        :page="currentPage" :page-size="itemsPerPage" :total-pages="totalPages" height="calc(100vh - 200px)"
        @update:page="currentPage = $event">

        <!-- Member column -->
        <template #cell-user_name="{ item }">
          <div class="member-cell">
            <div class="member-name">{{ item.user_name }}</div>
          </div>
        </template>

        <!-- Status column -->
        <template #cell-is_online="{ item }">
          <v-chip :color="item.is_online ? 'success' : undefined" :variant="item.is_online ? 'tonal' : 'outlined'"
            size="small" style="font-weight: 600;">
            {{ item.is_online ? 'Online' : 'Offline' }}
          </v-chip>
        </template>

        <!-- Balance column -->
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import { getMembers, type MemberItem } from '~/composables/service/membersApi'

const itemsPerPage = ref(10)
const currentPage = ref(1)
const totalItems = ref(0)
const members = ref<MemberItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')

const selectedCurrencies = ref<Record<number, number>>({})

const columns: TableColumn<MemberItem>[] = [
  { key: 'id', label: 'NO', type: 'index', width: '60px' },
  { key: 'user_name', label: 'Member', width: '160px' },
  { key: 'login_id', label: 'Login ID' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'nickname', label: 'Nickname', format: v => v || '-' },
  { key: 'coin_amount', label: 'Coin Amount', format: v => formatBalance(v), width: '120px' },
  { key: 'balances', label: 'Balance', width: '180px' },
  { key: 'is_online', label: 'Status', width: '100px' },
  { key: 'timezone', label: 'Timezone', format: v => v || '-' },
  { key: 'created_at', label: 'Created', format: v => formatDate(v) },
]

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

function formatBalance(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
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
    errorMessage.value = e?.message || 'Failed to load'
  } finally {
    isLoading.value = false
  }
}

watch(currentPage, fetchMembers)
onMounted(fetchMembers)
</script>

<style scoped>
.members-page {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  gap: 16px;
}

.page-header__left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-background));
  margin: 0;
  line-height: 1;
}

.page-subtitle {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.page-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-card {
  background: rgb(var(--v-theme-background)) !important;
  color: rgb(var(--v-theme-on-background)) !important;
  overflow: hidden;
}

.member-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.member-name {
  font-weight: 600;
  font-size: 13.5px;
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
</style>