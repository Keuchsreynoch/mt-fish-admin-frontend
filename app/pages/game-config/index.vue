<template>
  <div class="game-config flex flex-col gap-3">
    <!-- Page header with Refresh -->
    <div class="page-header">
      <h1 class="page-title text-2xl font-semibold">Game Configuration</h1>
      <v-btn
        color="success"
        variant="flat"
        class="refresh-btn"
        :loading="isLoading"
        @click="fetchGameConfig"
      >
        <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Top summary strip -->
    <v-row dense class="summary-strip">
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--amber">
          <div class="strip-label">RTP Target</div>
          <div class="strip-value">{{ formatAmount(poolData?.rtp_target) }}%</div>
        </div>
      </v-col>
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--blue">
          <div class="strip-label">Jackpot Rate</div>
          <div class="strip-value">{{ formatAmount(poolData?.jackpot_rate) }}%</div>
        </div>
      </v-col>
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--green">
          <div class="strip-label">RTP Range</div>
          <div class="strip-value">{{ formatAmount(poolData?.rtp_floor) }}% - {{ formatAmount(poolData?.rtp_ceiling) }}%</div>
        </div>
      </v-col>
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--violet">
          <div class="strip-label">Status</div>
          <div class="strip-value flex items-center gap-2">
            <span class="status-dot" :class="poolData?.status_id === 1 ? 'status-dot--active' : 'status-dot--inactive'"></span>
            {{ poolData?.status_id === 1 ? 'Active' : 'Inactive' }}
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <div class="game-config-tabs">
      <v-tabs v-model="activeTab" density="compact" color="primary" class="game-config-tabs__bar">
        <v-tab value="history" class="tab-item">
          <v-icon size="16" class="mr-1">mdi-history</v-icon>
          History
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="game-config-tabs__window">
        <!-- History tab -->
        <v-window-item value="history">
          <v-card class="history-card" elevation="0">
            <div class="history-card__header">
              <div>
                <h2 class="history-card__title">Configuration History</h2>
                <div class="history-card__subtitle">
                  {{ historyData.length }} records
                </div>
              </div>
            </div>

            <v-table class="history-table" density="comfortable">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Updated At</th>
                  <th>Updated By</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!historyData.length">
                  <td colspan="5" class="text-center py-8">
                    <v-icon size="32" color="grey-lighten-1">mdi-history</v-icon>
                    <div class="empty-title">No history records</div>
                    <div class="empty-subtitle">Configuration changes will appear here.</div>
                  </td>
                </tr>
                <tr v-for="row in historyData" :key="row.id">
                  <td class="font-medium">{{ row.field }}</td>
                  <td class="text-red-600 line-through">{{ row.old_value }}</td>
                  <td class="text-emerald-600 font-semibold">{{ row.new_value }}</td>
                  <td>{{ row.updated_at }}</td>
                  <td>{{ row.updated_by }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-window-item>
      </v-window>
    </div>

    <!-- Settings Dialog -->
    <GameConfigSettingsForm
      v-model="showSettings"
      :pool-data="poolData"
      :update-loading="updateLoading"
      @submit="onSettingsSubmit"
      @cancel="showSettings = false"
    />

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getGameConfig,
  updateGameConfig,
  type GameConfig,
  type UpdateGameConfigBody,
} from '~/composables/service/gameConfigApi'


const isLoading = ref(false)

const activeTab = ref('settings')
const showSettings = ref(false)
const updateLoading = ref(false)

const poolData = ref<GameConfig | null>(null)

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Ledger mock data
const ledgerData = ref([
  { id: 1, transaction_type: 'Top-up', amount: '5000.00', balance_before: '10000.00', balance_after: '15000.00', created_at: '2024-01-15 10:30:00', created_by: 'admin_john' },
  { id: 2, transaction_type: 'Payout', amount: '-1250.00', balance_before: '15000.00', balance_after: '13750.00', created_at: '2024-01-15 11:45:00', created_by: 'admin_sarah' },
  { id: 3, transaction_type: 'Adjustment', amount: '250.00', balance_before: '13750.00', balance_after: '14000.00', created_at: '2024-01-15 14:20:00', created_by: 'admin_john' },
  { id: 4, transaction_type: 'Top-up', amount: '3000.00', balance_before: '14000.00', balance_after: '17000.00', created_at: '2024-01-16 09:15:00', created_by: 'admin_mike' }
])
const ledgerLoading = ref(false)
const ledgerTotal = computed(() => ledgerData.value.length)
const ledgerRangeStart = computed(() => ledgerTotal.value === 0 ? 0 : 1)
const ledgerRangeEnd = computed(() => ledgerTotal.value)

// History mock data
const historyData = ref([
  { id: 1, field: 'rtp_target', old_value: '94.00', new_value: '95.50', updated_at: '2024-01-15 10:30:00', updated_by: 'admin_john' },
  { id: 2, field: 'jackpot_rate', old_value: '2.00', new_value: '2.50', updated_at: '2024-01-14 16:45:00', updated_by: 'admin_sarah' },
  { id: 3, field: 'status_id', old_value: '0', new_value: '1', updated_at: '2024-01-13 11:20:00', updated_by: 'admin_john' },
  { id: 4, field: 'rtp_ceiling', old_value: '97.00', new_value: '98.00', updated_at: '2024-01-12 14:30:00', updated_by: 'admin_mike' }
])

function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return parseFloat(String(value)) || 0
}

function formatAmount(value: string | number | null | undefined): string {
  const amount = parseAmount(value)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

async function fetchGameConfig() {
  isLoading.value = true
  try {
    const response = await getGameConfig()
    const payload = response?.data.value
    poolData.value = payload?.data ?? null
  } catch (error: any) {
    console.error('[game-config] failed to load', error)
    showSnackbar(error?.message || 'Failed to load game configuration', 'error')
  } finally {
    isLoading.value = false
  }
}

function openSettingsDialog() {
  showSettings.value = true
}

async function onSettingsSubmit(form: UpdateGameConfigBody) {
  updateLoading.value = true
  try {
    const response = await updateGameConfig(form)
    const payload = response?.data.value
    if (payload?.success) {
      // Update local data
      if (poolData.value) {
        poolData.value = {
          ...poolData.value,
          rtp_target: form.rtp_target,
          rtp_floor: form.rtp_floor,
          rtp_ceiling: form.rtp_ceiling,
          jackpot_rate: form.jackpot_rate,
          status_id: form.status_id,
          updated_by_username: payload.data.updated_by_username
        }
      }
      
      // Add to history
      const historyEntries = []
      if (poolData.value?.rtp_target !== form.rtp_target) {
        historyEntries.push({
          id: historyData.value.length + 1,
          field: 'rtp_target',
          old_value: poolData.value?.rtp_target || '',
          new_value: form.rtp_target,
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          updated_by: payload.data.updated_by_username
        })
      }
      // Add more history entries for other changed fields...
      
      showSnackbar(payload.message || 'Game configuration updated successfully', 'success')
      showSettings.value = false
    }
  } catch (error: any) {
    console.error('[game-config] update failed', error)
    showSnackbar(error?.message || 'Failed to update game configuration', 'error')
  } finally {
    updateLoading.value = false
  }
}

function showSnackbar(message: string, color: 'success' | 'error' = 'success') {
  snackbar.value = { show: true, message, color }
}

onMounted(() => {
  fetchGameConfig()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.refresh-btn {
  text-transform: none;
}

/* Summary Strip */
.summary-strip {
  margin: 0;
}

.strip-card {
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-left-width: 4px;
  border-radius: 8px;
  height: 100%;
}

.strip-label {
  font-size: 12px;
  color: #6b7280;
}

.strip-value {
  font-size: 18px;
  font-weight: 700;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.strip-card--amber {
  border-left-color: #f59e0b;
}

.strip-card--amber .strip-value {
  color: #b45309;
}

.strip-card--blue {
  border-left-color: #3b82f6;
}

.strip-card--blue .strip-value {
  color: #1d4ed8;
}

.strip-card--green {
  border-left-color: #10b981;
}

.strip-card--green .strip-value {
  color: #047857;
}

.strip-card--violet {
  border-left-color: #8b5cf6;
}

.strip-card--violet .strip-value {
  color: #6d28d9;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot--active {
  background: #10b981;
}

.status-dot--inactive {
  background: #ef4444;
}

/* Config Card */
.config-card {
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.config-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.config-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.config-card__settings-btn {
  background: #2563eb !important;
}

.config-grid {
  margin: 0;
}

/* Tiles */
.tile {
  border-radius: 8px;
  padding: 10px 12px;
  height: 100%;
}

.tile-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
  opacity: 0.85;
}

.tile-icon {
  opacity: 0.9;
}

.tile-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.tile--blue {
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  color: #1d4ed8;
}

.tile--purple {
  background: linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%);
  color: #7c3aed;
}

.tile--amber {
  background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
  color: #b45309;
}

.tile--green {
  background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%);
  color: #047857;
}

.tile--red {
  background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
  color: #b91c1c;
}

.tile--indigo {
  background: linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%);
  color: #4338ca;
}

/* Status Card */
.status-card {
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.status-card__header {
  margin-bottom: 12px;
}

.status-card__title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.status-card__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator__dot--active {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.status-indicator__dot--inactive {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.status-indicator__text {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
}

/* Tabs */
.game-config-tabs__bar {
  border-bottom: 1px solid #e5e7eb;
  text-transform: capitalize !important;
}

.game-config-tabs__window {
  padding-top: 12px;
}

.tab-item {
  text-transform: capitalize !important;
  font-weight: 600;
}

/* Ledger Card */
.ledger-card,
.history-card {
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.ledger-card__header,
.history-card__header {
  margin-bottom: 12px;
}

.ledger-card__title,
.history-card__title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.ledger-card__subtitle,
.history-card__subtitle {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.ledger-table,
.history-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.ledger-table :deep(th),
.history-table :deep(th) {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #6b7280;
  background: #f9fafb;
}

.empty-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-top: 8px;
}

.empty-subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}
</style>
