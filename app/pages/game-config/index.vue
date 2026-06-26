<template>
  <div fluid class="pa-2 game-config-page">
    <div class="page-header mb-3">
      <div>
        <h1 class="page-title">Game Config</h1>
        <p class="page-subtitle">Edit RTP and jackpot settings for the active game.</p>
      </div>
      <div class="header-chips">
        <v-chip size="small" color="primary" variant="flat">
          {{ configForm.game_name || "Loading..." }}
        </v-chip>
        <v-chip size="small" variant="tonal">
          Status {{ configForm.status_id }}
        </v-chip>
      </div>
    </div>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
      density="compact"
    >
      {{ errorMessage }}
    </v-alert>

    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
      density="compact"
    >
      {{ successMessage }}
    </v-alert>

    <div v-if="isLoading" class="loading-state">
      <v-progress-circular indeterminate color="primary" />
      <span>Loading game config...</span>
    </div>

    <v-card v-else class="config-card" elevation="0">
      <div class="card-heading">
        <div>
          <div class="card-title">Current Game Config</div>
          <div class="card-help">
            Last updated by {{ configForm.updated_by_username || "—" }}
          </div>
        </div>
      </div>

      <div class="config-grid">
        <v-text-field
          v-model="configForm.rtp_target"
          label="RTP Target"
          hint="Example: 0.9500"
          persistent-hint
          density="compact"
          hide-details="auto"
          variant="outlined"
          class="ocean-input"
        />

        <v-text-field
          v-model="configForm.rtp_floor"
          label="RTP Floor"
          hint="Example: 0.8200"
          persistent-hint
          density="compact"
          hide-details="auto"
          variant="outlined"
          class="ocean-input"
        />

        <v-text-field
          v-model="configForm.rtp_ceiling"
          label="RTP Ceiling"
          hint="Example: 0.9800"
          persistent-hint
          density="compact"
          hide-details="auto"
          variant="outlined"
          class="ocean-input"
        />

        <v-text-field
          v-model="configForm.jackpot_rate"
          label="Jackpot Rate"
          hint="Example: 0.020000"
          persistent-hint
          density="compact"
          hide-details="auto"
          variant="outlined"
          class="ocean-input"
        />

        <v-text-field
          v-model.number="configForm.status_id"
          type="number"
          label="Status ID"
          hint="Example: 1"
          persistent-hint
          density="compact"
          hide-details="auto"
          variant="outlined"
          class="ocean-input"
        />
      </div>

      <div class="actions-row">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save"
          :loading="isSaving"
          :disabled="!hasChanges"
          @click="saveGameConfig"
        >
          Save Game Config
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import {
  getGameConfig,
  updateGameConfig,
  type GameConfig,
} from "~/composables/service/gameConfigApi"

interface GameConfigState extends GameConfig {
  updated_by_username?: string
}

const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref("")
const successMessage = ref("")
const configForm = ref<GameConfigState>({
  game_name: "",
  rtp_target: "",
  rtp_floor: "",
  rtp_ceiling: "",
  jackpot_rate: "",
  status_id: 1,
  updated_by_username: "",
})
const originalConfig = ref<GameConfigState | null>(null)

const hasChanges = computed(() => {
  if (!originalConfig.value) return false

  return (
    configForm.value.rtp_target !== originalConfig.value.rtp_target ||
    configForm.value.rtp_floor !== originalConfig.value.rtp_floor ||
    configForm.value.rtp_ceiling !== originalConfig.value.rtp_ceiling ||
    configForm.value.jackpot_rate !== originalConfig.value.jackpot_rate ||
    Number(configForm.value.status_id) !== Number(originalConfig.value.status_id)
  )
})

function syncConfig(data: GameConfigState) {
  configForm.value = {
    ...data,
    status_id: Number(data.status_id ?? 1),
  }
  originalConfig.value = {
    ...configForm.value,
  }
}

function showError(message: string) {
  errorMessage.value = message
  successMessage.value = ""
}

function showSuccess(message: string) {
  successMessage.value = message
  errorMessage.value = ""
}

async function loadGameConfig() {
  isLoading.value = true
  try {
    const res = await getGameConfig()
    const response = res?.data?.value
    if (response?.success) {
      syncConfig(response.data)
      errorMessage.value = ""
      successMessage.value = ""
      return
    }

    showError(response?.message || "Failed to load game config")
  } catch (error: any) {
    showError(error?.message || "Failed to load game config")
  } finally {
    isLoading.value = false
  }
}

async function saveGameConfig() {
  if (!configForm.value.rtp_target.trim()) {
    showError("RTP target is required")
    return
  }
  if (!configForm.value.rtp_floor.trim()) {
    showError("RTP floor is required")
    return
  }
  if (!configForm.value.rtp_ceiling.trim()) {
    showError("RTP ceiling is required")
    return
  }
  if (!configForm.value.jackpot_rate.trim()) {
    showError("Jackpot rate is required")
    return
  }
  if (!Number.isFinite(Number(configForm.value.status_id))) {
    showError("Status ID is required")
    return
  }

  isSaving.value = true
  try {
    const res = await updateGameConfig({
      rtp_target: configForm.value.rtp_target.trim(),
      rtp_floor: configForm.value.rtp_floor.trim(),
      rtp_ceiling: configForm.value.rtp_ceiling.trim(),
      jackpot_rate: configForm.value.jackpot_rate.trim(),
      status_id: Number(configForm.value.status_id),
    })
    const response = res?.data?.value
    if (response?.success) {
      syncConfig({
        ...configForm.value,
        ...response.data,
      })
      showSuccess(response.message)
      return
    }

    showError(response?.message || "Failed to update game config")
  } catch (error: any) {
    showError(error?.message || "Failed to update game config")
  } finally {
    isSaving.value = false
  }
}

onMounted(loadGameConfig)
</script>

<style scoped>
.game-config-page {
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.header-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #111827;
}

.page-subtitle {
  margin-top: 6px;
  color: rgba(17, 24, 39, 0.62);
  font-size: 14px;
}

.loading-state {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  color: rgba(17, 24, 39, 0.6);
}

.config-card {
  padding: 18px;
  border: 1px solid rgba(31, 41, 55, 0.1);
  border-radius: 14px;
  background: #fff;
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.card-help {
  margin-top: 3px;
  font-size: 12px;
  color: rgba(31, 41, 55, 0.5);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

:deep(.ocean-input .v-field) {
  background: #FFFFFF !important;
  border-radius: 6px;
}

:deep(.ocean-input .v-field__input) {
  min-height: 28px !important;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
  font-size: 13px;
}

:deep(.ocean-input input) {
  font-size: 13px;
  color: #111827 !important;
}

:deep(.ocean-input .v-field__outline) {
  color: rgba(31, 41, 55, 0.18) !important;
}

:deep(.ocean-input .v-messages) {
  min-height: 16px;
}

:deep(.v-btn) {
  text-transform: none;
}
</style>
