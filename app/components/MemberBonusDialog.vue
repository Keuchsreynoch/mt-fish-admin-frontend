<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="onDialogUpdate">
    <v-card class="bonus-dialog-card">
      <v-card-title class="bonus-dialog-title">
        {{ t('report.addBonus') }}
        <div class="bonus-dialog-subtitle">{{ member?.name }}</div>
      </v-card-title>

      <v-card-text class="pt-2">
        <v-text-field
          v-model="amount"
          :label="t('report.amount')"
          :error-messages="amountError ? [amountError] : []"
          persistent-hint
          density="compact"
          hide-details="auto"
          variant="outlined"
          color="error"
          class="mb-3 slate-input"
        />
        <v-textarea
          v-model="note"
          :label="t('report.note')"
          variant="outlined"
          density="comfortable"
          rows="2"
          hide-details
          class="slate-input"
        />
        <div v-if="error" class="bonus-error">{{ error }}</div>
      </v-card-text>

      <v-card-actions class="justify-end pb-4 pr-4">
        <v-btn variant="outlined" color="error" :disabled="submitting" @click="close">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn variant="flat" color="create" class="bonus-confirm-btn" :loading="submitting" @click="submit">
          {{ t('report.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from 'vuetify-sonner'
import { useFrontendI18n } from '~/composables/i18n'
import { createMemberBonus } from '~/composables/service/memberBonusApi'

export interface BonusMember {
  id: number
  name: string
}

const props = defineProps<{
  modelValue: boolean
  member: BonusMember | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created'): void
}>()

const { t } = useFrontendI18n()

const amount = ref('')
const note = ref('')
const submitting = ref(false)
const error = ref('')
const amountError = ref('')

function resetForm() {
  amount.value = ''
  note.value = ''
  error.value = ''
  amountError.value = ''
}

// Reset the form fields every time the dialog is opened for a (possibly new) member
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetForm()
  },
)

function onDialogUpdate(value: boolean) {
  if (submitting.value) return
  emit('update:modelValue', value)
}

function close() {
  if (submitting.value) return
  emit('update:modelValue', false)
}

function parseAmount(value: string): number {
  return Number.parseFloat(value) || 0
}

async function submit() {
  error.value = ''
  amountError.value = ''

  if (!props.member) {
    error.value = t('report.invalidMember')
    return
  }

  const amountNum = parseAmount(amount.value)
  if (!amount.value || amountNum <= 0) {
    amountError.value = t('report.invalidAmount')
    return
  }

  submitting.value = true

  try {
    await createMemberBonus({
      amount: amount.value,
      member_id: props.member.id,
      member_name: props.member.name.trim(),
      note: note.value,
    })

    toast.success(t('report.bonusCreated'))
    emit('update:modelValue', false)
    emit('created')
  } catch (err: any) {
    console.error('[bonus] failed to create', err)
    error.value = err?.message || t('jackpot.failedToCreateMemberBonus')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.slate-input :deep(.v-field) {
  background: #FFFFFF !important;
  color: #111827 !important;
  border-radius: 8px !important;
  font-size: 12px !important;
}

.slate-input :deep(.v-field__outline) {
  color: rgba(31, 41, 55, 0.3) !important;
}

.slate-input :deep(.v-field--focused .v-field__outline) {
  color: #1F2937 !important;
}

.slate-input :deep(input) {
  color: #111827 !important;
  font-size: 12px !important;
  padding: 2px 6px !important;
}

.bonus-dialog-card {
  border-radius: 12px;
}

.bonus-dialog-title {
  font-weight: 800;
  color: #111827;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bonus-dialog-subtitle {
  font-size: 12px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.6);
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