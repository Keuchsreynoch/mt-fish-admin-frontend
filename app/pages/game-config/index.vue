<template>
  <div class="game-config flex flex-col gap-3">
    <div class="page-header mt-3">
      <h1 class="page-title text-2xl font-semibold">
        {{ t('gameConfig.title') }}
      </h1>
    </div>

    <v-row dense class="summary-strip">
      <v-col cols="6" md="4">
        <div class="strip-card strip-card--cyan">
          <div class="strip-label">{{ t('gameConfig.gameName') }}</div>
          <div class="strip-value">{{ poolData?.game_name || '-' }}</div>
        </div>
      </v-col>

      <v-col cols="6" md="4">
        <div class="strip-card strip-card--amber">
          <div class="strip-label">{{ t('gameConfig.rtpTarget') }}</div>
          <div class="strip-value">{{ formatAmount(poolData?.rtp_target) }}%</div>
        </div>
      </v-col>

      <v-col cols="6" md="4">
        <div class="strip-card strip-card--green">
          <div class="strip-label">{{ t('gameConfig.rtpRange') }}</div>
          <div class="strip-value">
            {{ formatAmount(poolData?.rtp_floor) }}% -
            {{ formatAmount(poolData?.rtp_ceiling) }}%
          </div>
        </div>
      </v-col>

      <v-col cols="6" md="4">
        <div class="strip-card strip-card--blue">
          <div class="strip-label">{{ t('gameConfig.jackpotRate') }}</div>
          <div class="strip-value">{{ formatAmount(poolData?.jackpot_rate) }}%</div>
        </div>
      </v-col>

      <v-col cols="6" md="4">
        <div class="strip-card strip-card--pink">
          <div class="strip-label">{{ t('gameConfig.companyProfitRate') }}</div>
          <div class="strip-value">{{ formatAmount(poolData?.company_profit_rate) }}%</div>
        </div>
      </v-col>

      <v-col cols="6" md="4">
        <div class="strip-card strip-card--violet">
          <div class="strip-label">{{ t('gameConfig.status') }}</div>
          <div class="strip-value flex items-center gap-2">
            <span class="status-dot"
              :class="poolData?.status_id === 1 ? 'status-dot--active' : 'status-dot--inactive'" />
            {{ poolData?.status_id === 1 ? t('common.active') : t('common.inactive') }}
          </div>
        </div>
      </v-col>
    </v-row>

    <div class="game-config-tabs">
      <v-card class="history-card" elevation="0">
        <div class="history-card__header">
          <div>
            <h2 class="history-card__title">
              {{ t('gameConfig.configurationHistory') }}
            </h2>
          </div>

          <v-btn icon size="small" color="primary" variant="flat" class="config-card__settings-btn"
            @click="showSettings = true">
            <v-icon size="18">mdi-cog</v-icon>
          </v-btn>
        </div>

        <template v-if="gameConfigurationData.length">
          <AppTable :columns="historyColumns" :items="gameConfigurationData" height="auto" />
        </template>

        <div v-else class="history-empty">
          <v-icon size="32" color="grey-lighten-1">mdi-cog-outline</v-icon>
          <div class="empty-title">{{ t('gameConfig.noHistory') }}</div>
          <div class="empty-subtitle">{{ t('gameConfig.historySubtitle') }}</div>
        </div>
      </v-card>
    </div>

    <GameConfigSettingsForm v-model="showSettings" :pool-data="poolData" :update-loading="updateLoading"
      @submit="onSettingsSubmit" @cancel="showSettings = false" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFrontendI18n } from '~/composables/i18n'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import { formatDecimal } from '~/utils/numberFormat'
import {
  getGameConfig,
  updateGameConfig,
  type GameConfig,
  type UpdateGameConfigBody,
} from '~/composables/service/gameConfigApi'

const { t } = useFrontendI18n()

const isLoading = ref(false)
const showSettings = ref(false)
const updateLoading = ref(false)

const poolData = ref<GameConfig | null>(null)
interface GameConfigurationRow {
  game_name: string
  rtp_target: string
  rtp_floor: string
  rtp_ceiling: string
  jackpot_rate: string
  status: string
  updated_by: string
  updated_at: string

}

const gameConfigurationData = computed<GameConfigurationRow[]>(() => {
  if (!poolData.value) return []

  return [
    {
      game_name: poolData.value.game_name || '-',
      rtp_target: `${formatAmount(poolData.value.rtp_target)}%`,
      rtp_floor: `${formatAmount(poolData.value.rtp_floor)}%`,
      rtp_ceiling: `${formatAmount(poolData.value.rtp_ceiling)}%`,
      jackpot_rate: `${formatAmount(poolData.value.jackpot_rate)}%`,
      status:
        poolData.value.status_id === 1
          ? t('common.active')
          : t('common.inactive'),
      updated_at: poolData.value.updated_at || '-',
      updated_by: poolData.value.updated_by_username || '-',
    },
  ]
})

const historyColumns = computed<TableColumn<GameConfigurationRow>[]>(() => [
  {
    key: 'game_name',
    label: t('gameConfig.gameName'),
    cellClass: 'font-medium',
  },
  {
    key: 'rtp_target',
    label: t('gameConfig.rtpTarget'),
    cellClass: 'font-semibold text-amber-700',
  },
  {
    key: 'rtp_floor',
    label: t('gameConfig.rtpFloor'),
  },
  {
    key: 'rtp_ceiling',
    label: t('gameConfig.rtpCeiling'),
  },
  {
    key: 'jackpot_rate',
    label: t('gameConfig.jackpotRate'),
    cellClass: 'font-semibold text-blue-700',
  },
  {
    key: 'status',
    label: t('gameConfig.status'),
    cellClass: 'font-semibold',
  },
  {
    key: 'updated_by',
    label: t('gameConfig.updatedBy'),
  },
  {
    key: 'updated_at',
    label: t('gameConfig.updatedAt'),
  },

])

function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return parseFloat(String(value)) || 0
}

function formatAmount(value: string | number | null | undefined): string {
  return formatDecimal(parseAmount(value), {
    maximumFractionDigits: 2,
  })
}

async function fetchGameConfig() {
  isLoading.value = true

  try {
    const response = await getGameConfig()
    const payload = response?.data.value
    poolData.value = payload?.data ?? null
  } catch (error: any) {
    console.error('[game-config] failed to load', error)
  } finally {
    isLoading.value = false
  }
}

async function onSettingsSubmit(form: UpdateGameConfigBody) {
  updateLoading.value = true

  try {
    const response = await updateGameConfig(form)
    const payload = response?.data.value

    if (payload?.success) {
      poolData.value = {
        ...(poolData.value || {
          game_name: '',
          rtp_target: '',
          rtp_floor: '',
          rtp_ceiling: '',
          jackpot_rate: '',
          company_profit_rate: '',
          status_id: 1,
        }),
        game_name: poolData.value?.game_name || '',
        rtp_target: payload.data.rtp_target,
        rtp_floor: payload.data.rtp_floor,
        rtp_ceiling: payload.data.rtp_ceiling,
        jackpot_rate: payload.data.jackpot_rate,
        company_profit_rate: payload.data.company_profit_rate,
        status_id: payload.data.status_id,
        updated_at: payload.data.updated_at,
        updated_by: payload.data.updated_by,
        updated_by_username: payload.data.updated_by_username,
      }

      showSettings.value = false
    }
  } catch (error: any) {
    console.error('[game-config] update failed', error)
  } finally {
    updateLoading.value = false
  }
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

.page-title {
  color: rgb(var(--v-theme-primary));
}

.refresh-btn {
  text-transform: none;
}

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
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.history-empty {
  padding: 28px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
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
