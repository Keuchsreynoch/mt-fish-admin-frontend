<template>
  <DynamicTableStyle
    v-bind="props"
    @update:page="emit('update:page', $event)"
  >
    <template
      v-for="(_, slotName) in slots"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps" />
    </template>
  </DynamicTableStyle>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { useSlots } from "vue";
import DynamicTableStyle, { type TableColumn, type TotalRow } from "~/components/DynamicTableStyle.vue";

const props = withDefaults(defineProps<{
  columns: TableColumn<T>[];
  items: T[];
  loading?: boolean;
  error?: string;
  height?: string;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  subtotals?: TotalRow;
  grandTotals?: TotalRow;
  onRowClick?: (item: T) => void;
}>(), {
  loading: false,
  error: "",
  height: "calc(100vh - 125px)",
  page: 1,
  pageSize: 10,
  totalPages: 1,
});

const emit = defineEmits<{ "update:page": [page: number] }>();
const slots = useSlots();
</script>
