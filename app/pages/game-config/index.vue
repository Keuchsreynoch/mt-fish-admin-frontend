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
      rtp_target: `${formatPercent(poolData.value.rtp_target)}%`,
      rtp_floor: `${formatPercent(poolData.value.rtp_floor)}%`,
      rtp_ceiling: `${formatPercent(poolData.value.rtp_ceiling)}%`,
      jackpot_rate: `${formatPercent(poolData.value.jackpot_rate)}%`,
      status:
        poolData.value.status_id === 1
          ? t('common.active')
          : t('common.inactive'),
      updated_at: formatDateTime(poolData.value.updated_at),
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

function formatPercent(value: string | number | null | undefined): string {
  return formatDecimal(parseAmount(value) * 100, {
    maximumFractionDigits: 2,
  })
}

function formatDateTime(value: string | number | null | undefined): string {
  if (!value) return '-'

  const date = new Date(value)
  if (isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
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

<template>
  <div class="game-config flex flex-col gap-3">
    <div class="page-header mt-3">
      <h1 class="page-title text-2xl font-semibold">
        {{ t('gameConfig.title') }}
      </h1>
    </div>

    <v-row dense class="summary-strip">
      <v-col cols="6" md="4">
        <div class="strip-card strip-card--amber">
          <div class="strip-label">{{ t('gameConfig.rtpTarget') }}</div>
          <div class="strip-value">{{ formatPercent(poolData?.rtp_target) }}%</div>
        </div>
      </v-col>

      <v-col cols="6" md="4">
        <div class="strip-card strip-card--blue">
          <div class="strip-label">{{ t('gameConfig.jackpotRate') }}</div>
          <div class="strip-value">{{ formatPercent(poolData?.jackpot_rate) }}%</div>
        </div>
      </v-col>

      <v-col cols="6" md="4">
        <div class="strip-card strip-card--pink">
          <div class="strip-label">{{ t('gameConfig.companyProfitRate') }}</div>
          <div class="strip-value">{{ formatPercent(poolData?.company_profit_rate) }}%</div>
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
  background: rgb(var(--v-theme-primary)) !important;
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




