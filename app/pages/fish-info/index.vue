<template>
  <div class="coin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Fish Info</h1>
      </div>
    </div>

    <div class="content-wepper">
      <AppTable
        :columns="columns"
        :items="fishTypes"
        :loading="isLoading"
        :error="errorMessage"
        :page="currentPage"
        :page-size="itemsPerPage"
        :total-pages="1"
      >
        <template #cell-is_boss="{ item }">
          <v-chip v-if="item.is_boss" color="warning" size="small" variant="flat">Boss</v-chip>
          <span v-else class="text-secondary">-</span>
        </template>

        <template #cell-miss_reward_enabled="{ item }">
          <v-chip
            :color="item.miss_reward_enabled ? 'success' : 'default'"
            size="small"
            variant="flat"
          >
            {{ item.miss_reward_enabled ? 'Yes' : 'No' }}
          </v-chip>
        </template>

        <template #cell-min_kill_odd="{ item, index }">
          <v-text-field
            v-if="editingIndex === index"
            :model-value="editBuffer.min_kill_odd"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            density="compact"
            hide-details
            variant="outlined"
            class="edit-input"
            @keydown="blockNonDecimalKeys"
            @paste="handleDecimalPaste"
            @update:model-value="editBuffer.min_kill_odd = sanitizeDecimalInput($event)"
          />
          <span v-else>{{ item.min_kill_odd ?? '-' }}</span>
        </template>

        <template #cell-max_kill_odd="{ item, index }">
          <v-text-field
            v-if="editingIndex === index"
            :model-value="editBuffer.max_kill_odd"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            density="compact"
            hide-details
            variant="outlined"
            class="edit-input"
            @keydown="blockNonDecimalKeys"
            @paste="handleDecimalPaste"
            @update:model-value="editBuffer.max_kill_odd = sanitizeDecimalInput($event)"
          />
          <span v-else>{{ item.max_kill_odd ?? '-' }}</span>
        </template>

        <template #cell-min_miss_reward_odd="{ item, index }">
          <v-text-field
            v-if="editingIndex === index"
            :model-value="editBuffer.min_miss_reward_odd"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            density="compact"
            hide-details
            variant="outlined"
            class="edit-input"
            :disabled="!item.miss_reward_enabled"
            @keydown="blockNonDecimalKeys"
            @paste="handleDecimalPaste"
            @update:model-value="editBuffer.min_miss_reward_odd = sanitizeDecimalInput($event)"
          />
          <span v-else>{{ item.min_miss_reward_odd ?? '-' }}</span>
        </template>

        <template #cell-max_miss_reward_odd="{ item, index }">
          <v-text-field
            v-if="editingIndex === index"
            :model-value="editBuffer.max_miss_reward_odd"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            density="compact"
            hide-details
            variant="outlined"
            class="edit-input"
            :disabled="!item.miss_reward_enabled"
            @keydown="blockNonDecimalKeys"
            @paste="handleDecimalPaste"
            @update:model-value="editBuffer.max_miss_reward_odd = sanitizeDecimalInput($event)"
          />
          <span v-else>{{ item.max_miss_reward_odd ?? '-' }}</span>
        </template>

        <template #cell-action="{ item, index }">
          <div class="action-btns">
            <template v-if="editingIndex === index">
              <v-btn icon size="small" color="success" variant="flat" @click="saveEdit(index)">
                <v-icon size="18">mdi-check</v-icon>
              </v-btn>
              <v-btn icon size="small" color="error" variant="flat" @click="cancelEdit">
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </template>
            <template v-else>
              <v-btn icon size="small" color="primary" variant="flat" @click="startEdit(index, item)">
                <v-icon size="18">mdi-pencil</v-icon>
              </v-btn>
            </template>
          </div>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import { getFishTypes, type FishTypeItem } from '~/composables/service/fishTypeApi'


const columns: TableColumn<FishTypeItem>[] = [
  { key: 'index',               label: 'លេខ',            type: 'index' },
  { key: 'fish_type_name',      label: 'Fish Name',      cellClass: 'fish-name' },
  { key: 'is_boss',             label: 'Boss' },
  { key: 'min_kill_odd',        label: 'Kill Odd (Min)', width: '120px' },
  { key: 'max_kill_odd',        label: 'Kill Odd (Max)', width: '120px' },
  { key: 'base_speed',          label: 'Base Speed' },
  { key: 'miss_reward_enabled', label: 'Miss Reward' },
  { key: 'min_miss_reward_odd', label: 'Miss Odd (Min)', width: '120px' },
  { key: 'max_miss_reward_odd', label: 'Miss Odd (Max)', width: '120px' },
  { key: 'action',              label: 'Action' },
]

const currentPage  = ref(1)
const itemsPerPage = 50
const totalItems   = ref(0)
const fishTypes    = ref<FishTypeItem[]>([])
const isLoading    = ref(false)
const errorMessage = ref('')

const editingIndex = ref<number | null>(null)
const editBuffer   = ref({
  min_kill_odd:        '',
  max_kill_odd:        '',
  min_miss_reward_odd: '',
  max_miss_reward_odd: '',
})


function startEdit(index: number, item: FishTypeItem) {
  editingIndex.value = index
  editBuffer.value = {
    min_kill_odd:        toFieldValue(item.min_kill_odd),
    max_kill_odd:        toFieldValue(item.max_kill_odd),
    min_miss_reward_odd: toFieldValue(item.min_miss_reward_odd),
    max_miss_reward_odd: toFieldValue(item.max_miss_reward_odd),
  }
}

function saveEdit(index: number) {
  // fishTypes.value[index] = { ...fishTypes.value[index], ...editBuffer.value }
  // editingIndex.value = null
}

function cancelEdit() {
  editingIndex.value = null
}

function sanitizeDecimalInput(value: string | number | null | undefined): string {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '')
  if (!cleaned) return ''

  const [integerPart = '', ...fractionParts] = cleaned.split('.')
  const fractionPart = fractionParts.join('')

  if (cleaned.startsWith('.')) {
    return fractionPart ? `0.${fractionPart}` : '0.'
  }

  if (!fractionPart) {
    return integerPart
  }

  return `${integerPart || '0'}.${fractionPart}`
}

function toFieldValue(value: number | string | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}

function blockNonDecimalKeys(event: KeyboardEvent) {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ]

  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
  if (!/[\d.]/.test(event.key)) {
    event.preventDefault()
    return
  }

  if (event.key === '.' && (event.currentTarget as HTMLInputElement | null)?.value?.includes('.')) {
    event.preventDefault()
  }
}

function handleDecimalPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/[\d.]/.test(text)) {
    event.preventDefault()
  }
}


async function fetchFishTypes() {
  isLoading.value    = true
  errorMessage.value = ''
  try {
    const response = await getFishTypes(currentPage.value, itemsPerPage)
    const payload  = response?.data.value
    const raw      = payload?.data?.fish_types ?? []

    fishTypes.value = raw
      .filter((f) => !f.fish_type_name.startsWith('Event Fish'))
      .sort((a, b) => Number(a.is_boss) - Number(b.is_boss))

    totalItems.value = payload?.total ?? 0
  } catch (error: any) {
    console.error('[fish-type] failed to load', error)
    fishTypes.value  = []
    totalItems.value = 0
    errorMessage.value = error?.message || 'Failed to load fish types'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => fetchFishTypes())
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
  color: #111827;
}

.content-wepper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(tbody td.fish-name) {
  font-weight: 600 !important;
  color: #1F2937 !important;
}


:deep(tbody tr.boss-row td) {
  background: rgba(255, 160, 0, 0.08) !important;
}

:deep(tbody tr.boss-row:hover td) {
  background: rgba(255, 160, 0, 0.18) !important;
}

.edit-input {
  min-width: 64px;
  max-width: 80px;
}

.edit-input :deep(.v-field) {
  background: #FFFFFF !important;
  border-radius: 6px;
  --v-field-padding-start: 6px;
  --v-field-padding-end: 6px;
}

.edit-input :deep(.v-field__input) {
  min-height: 28px !important;
  padding: 0 4px !important;
  font-size: 12px;
}

.edit-input :deep(.v-field__outline) {
  color: #1F2937 !important;
}

.edit-input :deep(input) {
  text-align: center;
  font-size: 12px;
  color: #111827 !important;
}

.action-btns {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.action-btns :deep(.v-btn) {
  width: 24px !important;
  height: 24px !important;
}

.action-btns :deep(.v-icon) {
  font-size: 14px !important;
}
</style>
