<template>
  <div class="app-table-wrapper">
    <v-table class="app-table" fixed-header :height="tableHeight">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :style="col.width ? `width: ${col.width}` : ''">
            {{ col.label }}
          </th>
        </tr>
      </thead>

      <tbody>
        <!-- Loading -->
        <tr v-if="loading" class="no-hover">
          <td :colspan="columns.length" class="empty-cell">
            <div class="empty-state">
              <v-progress-circular indeterminate color="#1F2937" size="36" width="3" />
              <div class="empty-text">កំពុងទាញយកទិន្នន័យ...</div>
            </div>
          </td>
        </tr>

        <!-- Error -->
        <tr v-else-if="error" class="no-hover">
          <td :colspan="columns.length" class="empty-cell">
            <div class="empty-state">
              <v-icon size="40" color="#EF4444">mdi-alert-circle-outline</v-icon>
              <div class="empty-text error-text">{{ error }}</div>
            </div>
          </td>
        </tr>

        <!-- Empty -->
        <tr v-else-if="!items.length" class="no-hover">
          <td :colspan="columns.length" class="empty-cell">
            <div class="empty-state">
              <img
                src="https://assets-v2.lottiefiles.com/a/8f195bf4-1179-11ee-88da-277f023b0f0c/z4c7jIndmE.gif"
                alt="No data"
                class="empty-img"
              />
              <div class="empty-text">គ្មានទិន្នន័យ</div>
            </div>
          </td>
        </tr>

        <!-- Rows -->
        <template v-else>
          <tr
            v-for="(item, rowIndex) in items"
            :key="rowIndex"
            :class="{ 'clickable-row': !!onRowClick }"
            @click="onRowClick?.(item)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="getCellClass(col, item)"
              :style="col.align ? `text-align: ${col.align}` : ''"
            >
              <slot :name="`cell-${col.key}`" :item="item" :value="item[col.key]" :index="rowIndex">
                <!-- Badge -->
                <span v-if="col.type === 'badge'" class="cell-badge" :class="getBadgeClass(col, item)">
                  {{ formatCell(col, item) }}
                </span>

                <!-- Index -->
                <span v-else-if="col.type === 'index'">
                  {{ (page - 1) * pageSize + rowIndex + 1 }}
                </span>

                <!-- Default -->
                <span v-else>{{ formatCell(col, item) }}</span>
              </slot>
            </td>
          </tr>

          <!-- Page subtotal row -->
          <tr v-if="subtotals" class="summary-row">
            <td :colspan="subtotals.labelSpan ?? 1" class="summary-label">
              {{ subtotals.pageLabel ?? 'សរុបក្នុងមួយទំព័រ' }}
            </td>
            <td v-for="sub in subtotals.cols" :key="sub.key" :class="sub.class">
              {{ sub.value }}
            </td>
          </tr>

          <!-- Grand total row -->
          <tr v-if="grandTotals" class="summary-row grand-total-row">
            <td :colspan="grandTotals.labelSpan ?? 1" class="summary-label">
              {{ grandTotals.pageLabel ?? 'សរុបទាំងអស់' }}
            </td>
            <td v-for="sub in grandTotals.cols" :key="sub.key" :class="sub.class">
              {{ sub.value }}
            </td>
          </tr>
        </template>
      </tbody>
    </v-table>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <v-pagination
        :model-value="page"
        :length="totalPages"
        :total-visible="5"
        density="compact"
        rounded="circle"
        @update:model-value="$emit('update:page', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'

// ── Types ──────────────────────────────────────────────
export interface TableColumn<T = any> {
  key: string
  label: string
  type?: 'text' | 'index' | 'badge'
  align?: 'left' | 'center' | 'right'
  width?: string
  format?: (value: any, item: T) => string
  cellClass?: string | ((item: T) => string)
  badge?: {
    map: Record<string, string>
    default?: string
  }
}

export interface TotalRow {
  labelSpan?: number
  pageLabel?: string
  cols: { key: string; value: string; class?: string }[]
}

// ── Props ──────────────────────────────────────────────
const props = withDefaults(defineProps<{
  columns:      TableColumn<T>[]
  items:        T[]
  loading?:     boolean
  error?:       string
  height?:      string
  page?:        number
  pageSize?:    number
  totalPages?:  number
  subtotals?:   TotalRow
  grandTotals?: TotalRow
  onRowClick?:  (item: T) => void
  /** Below this many rows, the table sizes to content instead of stretching to fill `height`. */
  minRowsForFixedHeight?: number
}>(), {
  loading:    false,
  error:      '',
  height:     'calc(100vh - 125px)',
  page:       1,
  pageSize:   10,
  totalPages: 1,
  minRowsForFixedHeight: 8,
})

defineEmits<{ 'update:page': [page: number] }>()

// ── Computed ───────────────────────────────────────────

// When there isn't enough data to need a scrollable, fixed-height table
// (loading / error / empty / few rows), let the table size naturally to
// its content instead of stretching to fill the viewport height.
const tableHeight = computed(() => {
  if (props.loading || props.error || !props.items.length) return 'auto'
  if (props.items.length < props.minRowsForFixedHeight) return 'auto'
  return props.height
})

// ── Helpers ────────────────────────────────────────────
function formatCell(col: TableColumn<T>, item: T): string {
  const val = item[col.key]
  if (col.format) return col.format(val, item)
  return val ?? '-'
}

function getCellClass(col: TableColumn<T>, item: T): string {
  if (!col.cellClass) return ''
  return typeof col.cellClass === 'function' ? col.cellClass(item) : col.cellClass
}

function getBadgeClass(col: TableColumn<T>, item: T): string {
  const val = String(item[col.key] ?? '').toLowerCase()
  return col.badge?.map?.[val] ?? col.badge?.default ?? ''
}
</script>

<style scoped>
/* ── Wrapper ── */
.app-table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Table ── */
.app-table {
  background: transparent !important;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(31, 41, 55, 0.12);
}

.app-table :deep(table) {
  border-collapse: collapse;
  width: 100%;
  height: 100%;
}

/* Cap the scroll wrapper to the intended max height even when the table
   itself is sized to 'auto' — prevents runaway growth if rows are added
   dynamically, while still letting small tables shrink to fit content. */
.app-table :deep(.v-table__wrapper) {
  max-height: v-bind('height');
}

.app-table :deep(thead th) {
  background: #1F2937 !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  text-align: center !important;
  border: 1.5px solid rgba(31, 41, 55, 0.3) !important;
  white-space: nowrap;
  padding: 6px 10px !important;
  line-height: 1.2 !important;
  height: 36px !important;
}

.app-table :deep(tbody) {
  height: 100%;
}

.app-table :deep(tbody td) {
  background: #FFFFFF !important;
  color: #111827 !important;
  border: 1px solid rgba(31, 41, 55, 0.08) !important;
  text-align: center !important;
  font-size: 12px !important;
  padding: 4px 10px !important;
  line-height: 1.2 !important;
  height: 36px !important;
}

.app-table :deep(tbody td.positive) {
  color: #1E9C07 !important;
  font-weight: 700 !important;
}

.app-table :deep(tbody td.negative) {
  color: #EF4444 !important;
  font-weight: 700 !important;
}

.app-table :deep(tbody tr:nth-child(even) td) {
  background: rgba(31, 41, 55, 0.02) !important;
}

.app-table :deep(tbody tr:hover td) {
  background: rgba(31, 41, 55, 0.05) !important;
  transition: background 0.2s ease;
}

.app-table :deep(tbody tr.clickable-row) {
  cursor: pointer;
}

/* ── No hover for state rows ── */
.app-table :deep(tbody tr.no-hover:hover td) {
  background: #FFFFFF !important;
  cursor: default;
}

/* ── Summary rows ── */
.app-table :deep(tbody tr.summary-row td) {
  background: rgba(31, 41, 55, 0.06) !important;
  font-weight: 700 !important;
}

.app-table :deep(tbody tr.grand-total-row td) {
  background: rgba(31, 41, 55, 0.12) !important;
}

.app-table :deep(tbody tr.summary-row td.summary-label) {
  text-align: right !important;
  color: #1F2937 !important;
  padding-right: 12px !important;
}

.app-table :deep(tbody tr.summary-row td.positive),
.app-table :deep(tbody tr.grand-total-row td.positive) {
  color: #1E9C07 !important;
  font-weight: 700 !important;
}

.app-table :deep(tbody tr.summary-row td.negative),
.app-table :deep(tbody tr.grand-total-row td.negative) {
  color: #EF4444 !important;
  font-weight: 700 !important;
}

/* ── Empty state ── */
.empty-cell {
  background: #FFFFFF !important;
  padding: 0 !important;
  border: none !important;
  height: 1px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  background: #FFFFFF;
  height: 100%;
  min-height: 340px;
  box-sizing: border-box;
}

.empty-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  opacity: 0.85;
}

.empty-text {
  font-size: 22px;
  font-weight: 600;
  color: #6B7280;
}

.error-text {
  color: #EF4444;
}

/* ── Badge cells ── */
.cell-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

:deep(.badge--green)  { background: rgba(0, 200, 100, 0.12); color: #00c853; }
:deep(.badge--red)    { background: rgba(239, 68, 68, 0.1);  color: #EF4444; }
:deep(.badge--yellow) { background: rgba(255, 160, 0, 0.1);  color: #ffb300; }
:deep(.badge--grey)   { background: rgba(31, 41, 55, 0.08);  color: #374151; }

/* ── Pagination ── */
.pagination {
  display: flex;
  justify-content: center;
  /* margin-top: 12px; */
}

.pagination :deep(.v-pagination__item button),
.pagination :deep(.v-pagination__prev button),
.pagination :deep(.v-pagination__next button) {
  background: #FFFFFF !important;
  color: #1F2937 !important;
  border: 1px solid rgba(31, 41, 55, 0.2) !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  font-size: 12px !important;
}

.pagination :deep(.v-pagination__item--is-active button) {
  background: #1F2937 !important;
  color: #FFFFFF !important;
  border-color: #1F2937 !important;
}

.pagination :deep(.v-pagination__item button:hover),
.pagination :deep(.v-pagination__prev button:hover),
.pagination :deep(.v-pagination__next button:hover) {
  background: rgba(31, 41, 55, 0.07) !important;
}

.pagination :deep(.v-pagination__prev button),
.pagination :deep(.v-pagination__next button) {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
}

.pagination :deep(.v-pagination__prev .v-icon),
.pagination :deep(.v-pagination__next .v-icon) {
  font-size: 16px !important;
}

/* ── Scrollbar ── */
.app-table :deep(.v-table__wrapper)::-webkit-scrollbar       { width: 5px; height: 5px; }
.app-table :deep(.v-table__wrapper)::-webkit-scrollbar-track { background: rgba(31, 41, 55, 0.06); border-radius: 10px; }
.app-table :deep(.v-table__wrapper)::-webkit-scrollbar-thumb { background: #4B5563; border-radius: 10px; }
.app-table :deep(.v-table__wrapper)::-webkit-scrollbar-thumb:hover { background: #374151; }
</style>