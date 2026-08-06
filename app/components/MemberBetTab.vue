<script setup lang="ts">
import AppTable, { type TableColumn } from "~/components/DynamicTableStyle.vue";
import type { ReportItem } from "~/composables/service/reportApi";
import { useFrontendI18n } from "~/composables/i18n";

const { t } = useFrontendI18n();

defineProps<{
  columns: TableColumn<ReportItem>[];
  items: ReportItem[];
  loading: boolean;
  error: string;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
  formatAmount: (value: string | number | null | undefined) => string;
  parseAmount: (value: string | number | null | undefined) => number;
}>();

const emit = defineEmits<{
  (e: "update:search", value: string): void;
  (e: "search"): void;
  (e: "update:page", page: number): void;
  (e: "bonus", item: ReportItem): void;
}>();
</script>

<template>
  <div>
    <div class="filters-row">
      <v-text-field :model-value="search" density="compact" variant="outlined" hide-details clearable
        prepend-inner-icon="mdi-magnify" :placeholder="t('jackpot.searchMemberName')" class="member-search"
        @update:model-value="(v) => emit('update:search', v ?? '')" @keyup.enter="emit('search')"
        @click:clear="emit('search')" />

      <v-btn color="success" variant="flat" class="refresh-mini-btn" :loading="loading" @click="emit('search')">
        <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
        {{ t('gameConfig.refresh') }}
      </v-btn>
    </div>

    <div class="table-scroll">
      <AppTable :columns="columns" :items="items" :loading="loading" :error="error" :page="page" :page-size="pageSize"
        :total-pages="totalPages" empty-height="450px" @update:page="(p: number) => emit('update:page', p)">
        <template #cell-total_bet_amount="{ item }">
          <span class="positive">{{ formatAmount(parseAmount(item.total_bet_amount)) }}</span>
        </template>
        <template #cell-total_win_lose="{ item }">
          {{ formatAmount(parseAmount(item.total_win_lose)) }}
        </template>
        <template #cell-bonus="{ item }">
          <v-btn size="small" variant="flat" color="create" class="bonus-btn" @click="emit('bonus', item)">
            {{ t('report.addBonus') }}
          </v-btn>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped>
.table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.positive {
  color: #047857;
  font-weight: 600;
}

.bonus-btn {
  text-transform: none;
  border-radius: 6px;
  height: 24px !important;
  min-height: 0 !important;
  font-size: 11px !important;
  padding: 0 10px !important;
}

@media (max-width: 480px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .member-search {
    max-width: 100%;
  }

  .refresh-mini-btn {
    width: 100%;
  }
}
</style>