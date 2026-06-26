<!-- components/PeriodFilterButtons.vue -->
<template>
  <div class="flex gap-2">
    <button v-for="btn in buttons" :key="btn.period"
      class="px-3 py-0.5 rounded text-[10px] font-semibold tracking-wide border-2 transition-all duration-200" :style="activePeriod === btn.period
        ? { backgroundColor: btn.color, borderColor: btn.color, color: '#fff' }
        : { backgroundColor: 'transparent', borderColor: btn.color, color: btn.color }"
      @click="$emit('update:activePeriod', btn.period)">
      {{ btn.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
type Period = 'today' | 'yesterday' | 'this_week'

defineProps<{
  activePeriod: Period | 'custom'
}>()

defineEmits<{
  'update:activePeriod': [period: Period]
}>()

const buttons: { period: Period; label: string; color: string }[] = [
  { period: 'today', label: 'Today', color: '#00C2D4' },
  { period: 'yesterday', label: 'Yesterday', color: '#FFD54F' },
  { period: 'this_week', label: 'Week', color: '#FF6B35' },
]
</script>