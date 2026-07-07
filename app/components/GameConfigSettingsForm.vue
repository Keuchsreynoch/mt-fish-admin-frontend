<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="settings-dialog">
      <div class="settings-dialog__header">
        <h2 class="settings-dialog__title">
          <v-icon size="18" class="mr-2">mdi-cog</v-icon>
          Game Configuration Settings
        </h2>
        <v-btn
          icon
          size="small"
          variant="text"
          @click="onCancel"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="settings-dialog__body">
        <v-row dense>
          <v-col cols="6">
            <v-text-field
              v-model="form.rtp_floor"
              label="RTP Floor (%)"
              type="number"
              step="0.01"
              density="compact"
              variant="outlined"
              :error-messages="errors.rtp_floor"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="form.rtp_target"
              label="RTP Target (%)"
              type="number"
              step="0.01"
              density="compact"
              variant="outlined"
              :error-messages="errors.rtp_target"
              hide-details="auto"
            />
          </v-col>
        </v-row>

        <v-text-field
          v-model="form.rtp_ceiling"
          label="RTP Ceiling (%)"
          type="number"
          step="0.01"
          density="compact"
          variant="outlined"
          class="mt-3"
          :error-messages="errors.rtp_ceiling"
          hide-details="auto"
        />

        <v-text-field
          v-model="form.jackpot_rate"
          label="Jackpot Rate (%)"
          type="number"
          step="0.01"
          density="compact"
          variant="outlined"
          class="mt-3"
          :error-messages="errors.jackpot_rate"
          hide-details="auto"
        />

        <div class="status-toggle mt-4">
          <div class="status-toggle__label">Game Status</div>
          <div class="status-toggle__options">
            <v-btn
              :color="form.status_id === 1 ? 'success' : 'grey-lighten-2'"
              :variant="form.status_id === 1 ? 'flat' : 'outlined'"
              size="small"
              class="status-btn"
              @click="form.status_id = 1"
            >
              <v-icon size="14" class="mr-1">mdi-check-circle</v-icon>
              Active
            </v-btn>
            <v-btn
              :color="form.status_id === 0 ? 'error' : 'grey-lighten-2'"
              :variant="form.status_id === 0 ? 'flat' : 'outlined'"
              size="small"
              class="status-btn"
              @click="form.status_id = 0"
            >
              <v-icon size="14" class="mr-1">mdi-close-circle</v-icon>
              Inactive
            </v-btn>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="settings-dialog__actions">
        <v-spacer />
        <v-btn
          variant="outlined"
          color="grey"
          @click="onCancel"
          :disabled="updateLoading"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="updateLoading"
          @click="onSubmit"
        >
          <v-icon size="16" class="mr-1">mdi-content-save</v-icon>
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { GameConfig, UpdateGameConfigBody } from '~/composables/service/gameConfigApi'

interface Props {
  modelValue: boolean
  poolData: GameConfig | null
  updateLoading: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', form: UpdateGameConfigBody): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref<UpdateGameConfigBody>({
  rtp_target: '',
  rtp_floor: '',
  rtp_ceiling: '',
  jackpot_rate: '',
  status_id: 1
})

const errors = ref<Record<string, string>>({})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.poolData) {
    form.value = {
      rtp_target: props.poolData.rtp_target,
      rtp_floor: props.poolData.rtp_floor,
      rtp_ceiling: props.poolData.rtp_ceiling,
      jackpot_rate: props.poolData.jackpot_rate,
      status_id: props.poolData.status_id
    }
    errors.value = {}
  }
})

function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return parseFloat(String(value)) || 0
}

function validate(): boolean {
  const newErrors: Record<string, string> = {}

  const floor = parseAmount(form.value.rtp_floor)
  const target = parseAmount(form.value.rtp_target)
  const ceiling = parseAmount(form.value.rtp_ceiling)
  const jackpot = parseAmount(form.value.jackpot_rate)

  if (isNaN(floor) || floor < 0 || floor > 100) {
    newErrors.rtp_floor = 'RTP Floor must be between 0 and 100'
  }

  if (isNaN(target) || target < 0 || target > 100) {
    newErrors.rtp_target = 'RTP Target must be between 0 and 100'
  }

  if (isNaN(ceiling) || ceiling < 0 || ceiling > 100) {
    newErrors.rtp_ceiling = 'RTP Ceiling must be between 0 and 100'
  }

  if (!isNaN(floor) && !isNaN(target) && floor > target) {
    newErrors.rtp_floor = 'RTP Floor cannot be greater than RTP Target'
  }

  if (!isNaN(target) && !isNaN(ceiling) && target > ceiling) {
    newErrors.rtp_target = 'RTP Target cannot be greater than RTP Ceiling'
  }

  if (isNaN(jackpot) || jackpot < 0 || jackpot > 100) {
    newErrors.jackpot_rate = 'Jackpot Rate must be between 0 and 100'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

function onSubmit() {
  if (validate()) {
    emit('submit', { ...form.value })
  }
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.settings-dialog {
  border-radius: 12px !important;
  overflow: hidden;
}

.settings-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}

.settings-dialog__title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.settings-dialog__body {
  padding: 20px !important;
}

.settings-dialog__actions {
  padding: 12px 20px !important;
}

.status-toggle__label {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}

.status-toggle__options {
  display: flex;
  gap: 8px;
}

.status-btn {
  text-transform: none !important;
  font-weight: 600;
}
</style>
