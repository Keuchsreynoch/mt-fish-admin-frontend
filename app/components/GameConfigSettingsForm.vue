<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="settings-dialog">
      <div class="settings-dialog__header">
        <h2 class="settings-dialog__title">
          <v-icon size="18" class="mr-2">mdi-cog</v-icon>
          {{ t('gameConfig.title') }}
        </h2>
        <v-btn icon size="small" variant="text" @click="onCancel">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="settings-dialog__body">
        <v-text-field v-model="form.rtp_ceiling" :label="`${t('gameConfig.rtpCeiling')} (%)`" type="text"
          inputmode="decimal" density="compact" variant="outlined" :error-messages="errors.rtp_ceiling"
          hide-details="auto" @keydown="blockNonDecimalKeys" @paste.prevent="handleDecimalPaste"
          @blur="normalizeField('rtp_ceiling')" />

        <v-row dense class="mt-3">
          <v-col cols="6">
            <v-text-field v-model="form.jackpot_rate" :label="`${t('gameConfig.jackpotRate')} (%)`" type="text"
              inputmode="decimal" density="compact" variant="outlined" :error-messages="errors.jackpot_rate"
              hide-details="auto" @keydown="blockNonDecimalKeys" @paste.prevent="handleDecimalPaste"
              @blur="normalizeField('jackpot_rate')" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.company_profit_rate" :label="`${t('gameConfig.companyProfitRate')} (%)`"
              type="text" inputmode="decimal" density="compact" variant="outlined"
              :error-messages="errors.company_profit_rate" hide-details="auto" @keydown="blockNonDecimalKeys"
              @paste.prevent="handleDecimalPaste" @blur="normalizeField('company_profit_rate')" />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="settings-dialog__actions">
        <v-spacer />
        <v-btn variant="outlined" color="cancel" @click="onCancel" :disabled="updateLoading">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="flat" :loading="updateLoading" @click="onSubmit">
          <v-icon size="16" class="mr-1">mdi-content-save</v-icon>
          {{ t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFrontendI18n } from '~/composables/i18n'
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
const { t } = useFrontendI18n()

const form = ref<UpdateGameConfigBody>({
  rtp_target: '',
  rtp_floor: '',
  rtp_ceiling: '',
  jackpot_rate: '',
  company_profit_rate: '',
  status_id: 1
})

const errors = ref<Record<string, string>>({})

type DecimalField = 'rtp_target' | 'rtp_floor' | 'rtp_ceiling' | 'jackpot_rate' | 'company_profit_rate'

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.poolData) {
    form.value = {
      rtp_target: normalizePercentValue(props.poolData.rtp_target),
      rtp_floor: normalizePercentValue(props.poolData.rtp_floor),
      rtp_ceiling: normalizePercentValue(props.poolData.rtp_ceiling),
      jackpot_rate: normalizePercentValue(props.poolData.jackpot_rate),
      company_profit_rate: normalizePercentValue(props.poolData.company_profit_rate),
      status_id: props.poolData.status_id
    }
    errors.value = {}
  }
})

function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return parseFloat(String(value)) || 0
}

function handleDecimalPaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData("text") || "";
  const el = e.target as HTMLInputElement;
  const next = (el.value.slice(0, el.selectionStart ?? 0) + pasted + el.value.slice(el.selectionEnd ?? 0));
  if (!/^\d*\.?\d*$/.test(next)) e.preventDefault();
}

function blockNonDecimalKeys(event: KeyboardEvent) {
  const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End", "."];
  if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
  if (!/^\d$/.test(event.key)) event.preventDefault();
  // prevent second dot
  if (event.key === "." && (event.target as HTMLInputElement).value.includes(".")) {
    event.preventDefault();
  }
}

function normalizeDecimalValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''

  const numericValue = Number.parseFloat(String(value))
  if (Number.isNaN(numericValue)) return ''

  return numericValue.toString()
}

function normalizePercentValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''

  const numericValue = Number.parseFloat(String(value))
  if (Number.isNaN(numericValue)) return ''

  return normalizeDecimalValue(Number((numericValue * 100).toFixed(10)))
}

function toBackendPercent(value: string | number | null | undefined): string {
  return normalizeDecimalValue(Number((parseAmount(value) / 100).toFixed(10)))
}

function normalizeField(field: DecimalField) {
  const value = form.value[field]
  form.value[field] = normalizeDecimalValue(value)
}

function validate(): boolean {
  const newErrors: Record<string, string> = {}

  const floor = parseAmount(form.value.rtp_floor)
  const target = parseAmount(form.value.rtp_target)
  const ceiling = parseAmount(form.value.rtp_ceiling)
  const jackpot = parseAmount(form.value.jackpot_rate)
  const companyProfit = parseAmount(form.value.company_profit_rate)

  if (isNaN(floor) || floor < 0 || floor > 100) {
    newErrors.rtp_floor = t('gameConfig.mustBeBetween', { field: t('gameConfig.rtpFloor') })
  }

  if (isNaN(target) || target < 0 || target > 100) {
    newErrors.rtp_target = t('gameConfig.mustBeBetween', { field: t('gameConfig.rtpTarget') })
  }

  if (isNaN(ceiling) || ceiling < 0 || ceiling > 100) {
    newErrors.rtp_ceiling = t('gameConfig.mustBeBetween', { field: t('gameConfig.rtpCeiling') })
  }

  if (!isNaN(floor) && !isNaN(target) && floor > target) {
    newErrors.rtp_floor = t('gameConfig.cannotBeGreaterThan', {
      left: t('gameConfig.rtpFloor'),
      right: t('gameConfig.rtpTarget'),
    })
  }

  if (!isNaN(target) && !isNaN(ceiling) && target > ceiling) {
    newErrors.rtp_target = t('gameConfig.cannotBeGreaterThan', {
      left: t('gameConfig.rtpTarget'),
      right: t('gameConfig.rtpCeiling'),
    })
  }

  if (isNaN(jackpot) || jackpot < 0 || jackpot > 100) {
    newErrors.jackpot_rate = t('gameConfig.mustBeBetween', { field: t('gameConfig.jackpotRate') })
  }

  if (isNaN(companyProfit) || companyProfit < 0 || companyProfit > 100) {
    newErrors.company_profit_rate = t('gameConfig.mustBeBetween', { field: t('gameConfig.companyProfitRate') })
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

function onSubmit() {
  if (validate()) {
    emit('submit', {
      ...form.value,
      rtp_target: toBackendPercent(form.value.rtp_target),
      rtp_floor: toBackendPercent(form.value.rtp_floor),
      rtp_ceiling: toBackendPercent(form.value.rtp_ceiling),
      jackpot_rate: toBackendPercent(form.value.jackpot_rate),
      company_profit_rate: toBackendPercent(form.value.company_profit_rate),
    })
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
