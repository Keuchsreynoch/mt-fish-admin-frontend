<!-- components/PeriodFilterButtons.vue -->
<template>
  <div class="filter-right">
    <!-- Mobile: dropdown -->
    <v-select
      v-if="mobile"
      :model-value="activePeriod"
      :items="buttons"
      item-title="label"
      item-value="period"
      variant="outlined"
      density="compact"
      hide-details
      class="filter-select text-capitalize"
      @update:model-value="onSelect"
    >
      <template #selection="{ item }">
        <span class="filter-select-dot" :style="{ background: item.raw.color }" />
        {{ item.raw.label }}
      </template>
      <template #item="{ item, props }">
        <v-list-item v-bind="props" :title="undefined">
          <template #prepend>
            <span class="filter-select-dot" :style="{ background: item.raw.color }" />
          </template>
          <v-list-item-title>{{ item.raw.label }}</v-list-item-title>
        </v-list-item>
      </template>
    </v-select>

    <!-- Desktop: buttons -->
    <template v-else>
      <v-btn
        v-for="btn in buttons"
        :key="btn.period"
        :color="btn.color"
        class="text-capitalize filter-btn"
        variant="flat"
        @click="$emit('update:activePeriod', btn.period)"
      >
        {{ btn.label }}
      </v-btn>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useFrontendI18n } from '~/composables/i18n'

type Period = 'today' | 'yesterday' | 'this_week'
type ActivePeriod = Period | 'custom'

defineProps<{
  activePeriod: ActivePeriod
}>()

const emit = defineEmits<{
  'update:activePeriod': [period: Period]
}>()

const { t } = useFrontendI18n()
const { mobile } = useDisplay()

const buttons = computed<{ period: Period; label: string; color: string }[]>(() => [
  {
    period: 'today',
    label: t('common.today'),
    color: '#00C2D4',
  },
  {
    period: 'yesterday',
    label: t('common.yesterday'),
    color: '#FFD54F',
  },
  {
    period: 'this_week',
    label: t('common.week'),
    color: '#FF6B35',
  },
])

function onSelect(val: ActivePeriod) {
  if (val === 'custom') return
  emit('update:activePeriod', val)
}
</script>

<style scoped>
.filter-right {
  display: flex;
  gap: 8px;
  width: 100%;
}

.filter-btn {
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  color: white !important;
  border-width: 1.5px !important;
}

.filter-label {
  color: rgb(var(--v-theme-primary)) !important;
}

.filter-select {
  max-width: 220px;
}

.filter-select :deep(.v-field) {
  --v-input-control-height: 36px;
  min-height: 36px;
}

.filter-select :deep(.v-field__input) {
  min-height: 36px;
  padding-top: 6px;
  padding-bottom: 6px;
  font-size: 13px;
}

.filter-select-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}
</style>
