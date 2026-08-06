<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import AppTable, { type TableColumn } from "~/components/DynamicTableStyle.vue";
import { useFrontendI18n } from "~/composables/i18n";
import { formatDecimal } from "~/utils/numberFormat";
import { getTotalPayout, type TotalPayoutItem } from "~/composables/service/reportApi";

const { t } = useFrontendI18n();

const topWinners = ref<TotalPayoutItem[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const searchMemberName = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const total = ref(0);

const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / itemsPerPage.value))
);

const columnsTopWinner: TableColumn<TotalPayoutItem>[] = [
    { key: "index", label: "លេខរៀង", type: "index" },
    { key: "member_name", label: t("members.member") },
    { key: "total_payout_amount", label: t("dashboard.payout"), align: "center" },
];

function formatAmount(value: string | number): string {
    return formatDecimal(Number(value), { maximumFractionDigits: 2 });
}

async function fetchTopWinners() {
    loading.value = true;
    errorMessage.value = "";

    try {
        const res = await getTotalPayout(
            currentPage.value,
            itemsPerPage.value,
            "",
            "",
            searchMemberName.value,
        );

        const payload = res?.data.value;
        topWinners.value = payload?.data.payouts ?? [];
        total.value = payload?.total ?? 0;
    } catch (err: any) {
        console.error("Failed to fetch top winners:", err);
        topWinners.value = [];
        errorMessage.value = err?.message || t("members.failedToLoad");
    } finally {
        loading.value = false;
    }
}

watch(searchMemberName, () => {
    currentPage.value = 1;
    fetchTopWinners();
});

watch(currentPage, fetchTopWinners);

onMounted(fetchTopWinners);
</script>

<template>
    <div class="flex-col gap-3">
        <div class="filters-row">
            <v-text-field v-model="searchMemberName" density="compact" variant="outlined" hide-details clearable
                prepend-inner-icon="mdi-magnify" :placeholder="t('jackpot.searchMemberName')" class="member-search" />

            <v-btn color="success" variant="flat" class="refresh-mini-btn" :loading="loading" @click="fetchTopWinners">
                <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
                {{ t('gameConfig.refresh') }}
            </v-btn>
        </div>
        <div class="table-scroll">
            <AppTable :columns="columnsTopWinner" :items="topWinners" :loading="loading" :error="errorMessage"
                :page="currentPage" :page-size="itemsPerPage" :total-pages="totalPages" empty-height="450px"
                @update:page="currentPage = $event">
                <template #cell-total_payout_amount="{ item }">
                    <span class="positive">{{ formatAmount(item.total_payout_amount) }}</span>
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
</style>