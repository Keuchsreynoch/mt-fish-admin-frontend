<template>
  <v-card class="app-table-card" elevation="0">
    <v-table class="app-table" :density="density" hover>
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[col.thClass, alignClass(col.align)]"
            :style="col.width ? { width: col.width } : undefined"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>

      <tbody>
        <!-- Loading -->
        <tr v-if="loading">
          <td :colspan="columns.length" class="text-center py-8">
            <v-progress-circular indeterminate size="24" color="primary" />
          </td>
        </tr>

        <!-- Error -->
        <tr v-else-if="error">
          <td :colspan="columns.length" class="text-center py-8">
            <v-icon size="28" color="red-lighten-1" class="mb-1">mdi-alert-circle-outline</v-icon>
            <div class="app-table__empty-title">{{ error }}</div>
          </td>
        </tr>

        <!-- Empty -->
        <tr v-else-if="!items.length">
          <td :colspan="columns.length" class="text-center py-8">
            <slot name="empty">
              <v-icon size="32" color="grey-lighten-1">mdi-text-box-search-outline</v-icon>
              <div class="app-table__empty-title">{{ emptyText }}</div>
              <div class="app-table__empty-subtitle">{{ emptySubtext }}</div>
            </slot>
          </td>
        </tr>

        <!-- Rows -->
        <tr
          v-for="(item, rowIndex) in items"
          v-else
          :key="getRowKey(item, rowIndex)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[col.tdClass, alignClass(col.align)]"
          >
            <!-- index column -->
            <template v-if="col.type === 'index'">
              {{ (page - 1) * pageSize + rowIndex + 1 }}
            </template>

            <!-- custom slot: #cell-<key> -->
            <slot
              v-else
              :name="`cell-${col.key}`"
              :item="item"
              :value="(item as any)[col.key]"
              :index="rowIndex"
            >
              {{ (item as any)[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="app-table__pagination">
      <v-pagination
        :model-value="page"
        :length="totalPages"
        :total-visible="totalVisible"
        density="comfortable"
        rounded="circle"
        @update:model-value="$emit('update:page', $event)"
      />
    </div>
  </v-card>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
export interface TableColumn<Row = any> {
  key: string
  label: string
  type?: 'index' | 'default'
  align?: 'start' | 'center' | 'end'
  width?: string
  thClass?: string
  tdClass?: string
  /** optional: used to compute the row key */
  _row?: Row
}

const props = withDefaults(defineProps<{
  columns: TableColumn<T>[]
  items: T[]
  loading?: boolean
  error?: string
  page?: number
  pageSize?: number
  totalPages?: number
  totalVisible?: number
  density?: 'default' | 'comfortable' | 'compact'
  rowKey?: string
  emptyText?: string
  emptySubtext?: string
}>(), {
  loading: false,
  error: '',
  page: 1,
  pageSize: 10,
  totalPages: 1,
  totalVisible: 6,
  density: 'comfortable',
  rowKey: 'id',
  emptyText: 'No data found',
  emptySubtext: 'Try adjusting your filters.',
})

defineEmits<{ (e: 'update:page', value: number): void }>()

function alignClass(align?: string) {
  if (align === 'center') return 'text-center'
  if (align === 'end') return 'text-end'
  return 'text-start'
}

function getRowKey(item: T, index: number): string | number {
  const key = props.rowKey
  return (item?.[key] as string | number) ?? index
}
</script>

<style scoped>
.app-table-card {
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.app-table {
  width: 100%;
}

.app-table :deep(thead th) {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #6b7280 !important;
  background: #f9fafb;
  white-space: nowrap;
}

.app-table :deep(tbody td) {
  font-size: 13px;
  color: #374151;
}

.app-table :deep(tbody tr:hover) {
  background: #f9fafb;
}

.app-table__empty-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-top: 8px;
}

.app-table__empty-subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.app-table__pagination {
  display: flex;
  justify-content: center;
  padding: 12px 8px;
  border-top: 1px solid #e5e7eb;
}
</style>
