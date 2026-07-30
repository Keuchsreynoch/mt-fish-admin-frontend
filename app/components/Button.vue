<!-- components/AppButton.vue -->
<template>
  <v-btn
    :color="resolvedColor"
    :variant="variant"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :prepend-icon="resolvedIcon"
    class="text-capitalize app-btn"
    v-bind="$attrs"
    @click="(e: MouseEvent) => emit('click', e)"
  >
    <slot>{{ label }}</slot>
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ActionType = 'create' | 'submit' | 'cancel' | 'delete' | 'edit' | 'confirm' | 'logout' | 'default'
type BtnVariant = 'flat' | 'outlined' | 'tonal' | 'text' | 'elevated' | 'plain'

const props = withDefaults(defineProps<{
  action?: ActionType
  label?: string
  color?: string // manual override, takes priority over action map
  icon?: string  // manual override, takes priority over action map
  variant?: BtnVariant
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  loading?: boolean
  disabled?: boolean
}>(), {
  action: 'default',
  variant: 'flat',
  size: 'default',
  loading: false,
  disabled: false,
})

const emit = defineEmits<{ click: [e: MouseEvent] }>()

// action -> color (theme color name OR raw hex)
const actionColorMap: Record<ActionType, string> = {
  create: 'create',
  submit: 'primary',
  confirm: 'primary',
  edit: 'info',
  cancel: 'cancel',
  delete: 'error',
  logout: 'cancel',
  default: 'primary',
}

// action -> default icon (optional, override with `icon` prop)
const actionIconMap: Partial<Record<ActionType, string>> = {
  create: 'mdi-plus',
  submit: 'mdi-check',
  confirm: 'mdi-check',
  edit: 'mdi-pencil',
  cancel: 'mdi-close',
  delete: 'mdi-delete',
  logout: 'mdi-logout',
}

const resolvedColor = computed(() => props.color ?? actionColorMap[props.action])
const resolvedIcon = computed(() => props.icon ?? actionIconMap[props.action])
</script>

<style scoped>
.app-btn {
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  border-width: 1.5px !important;
}

/* Only force white text on solid-background variants */
.app-btn.v-btn--variant-flat,
.app-btn.v-btn--variant-elevated {
  color: white !important;
}
</style>
