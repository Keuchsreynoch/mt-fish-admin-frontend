<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppTable, { type TableColumn } from "~/components/DynamicTableStyle.vue";
import JackpotSettingsDialog, { type JackpotSettingsForm } from "~/components/JackpotSettingsForm.vue";
import MemberBonusDialog, { type BonusMember } from "~/components/MemberBonusDialog.vue";
import { useFrontendI18n } from "~/composables/i18n";
import { formatDecimal } from "~/utils/numberFormat";
import { getReports, type ReportItem } from '~/composables/service/reportApi'
import { useSnackbar } from "~/composables/useSnackbar";
import {
  createMemberBonus,
  getMemberBonuses,
  type MemberBonusItem,
} from "~/composables/service/memberBonusApi";
import {
  getJackpotCurrent,
  type JackpotCurrent,
  type UpdateJackpotCurrentBody,
  updateJackpotCurrent,
} from "~/composables/service/jackpotCurrentPoolApi";
import {
  getJackpotHistories,
  type JackpotHistoryItem,
} from "~/composables/service/jackpotHistoryApi";

const { showSuccess, showError } = useSnackbar();
const { t } = useFrontendI18n();

const showSettings = ref(false);

const poolData = ref<JackpotCurrent | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");
const updateLoading = ref(false);
const reportData = ref<ReportItem[]>([])
const reportTotal = ref<{ total_bet: string; total_valid_bet: string; total_winlose: string } | null>(null)

const reservationSearch = ref("");
const playersLoading = ref(false);

// Jackpot reservations/history (used for the winner-chip grid)
const jackpotHistories = ref<JackpotHistoryItem[]>([]);
const historiesLoading = ref(false);

// Wrap the single JackpotCurrent record into an array so AppTable can render it as one row
const jackpotTableItems = computed<JackpotCurrent[]>(() => (poolData.value ? [poolData.value] : []));

const columnsReport = computed<TableColumn<ReportItem>[]>(() => [
  { key: 'index', label: 'លេខរៀង', type: 'index' },
  { key: 'member_name', label: t('members.member') },
  { key: 'total_bet_amount', label: t('report.turnOver'), align: 'center' },
  {
    key: 'total_win_lose',
    label: t('report.winLose'),
    align: 'center',
    cellClass: (item: ReportItem) => parseAmount(item.total_win_lose) >= 0 ? 'positive' : 'negative',
  },
  { key: 'bonus', label: t('report.bonus'), align: 'center' },
])

const columnsCurrentJackpot = computed<TableColumn<JackpotCurrent>[]>(() => [
  { key: 'index', label: 'លេខរៀង', type: 'index' },
  { key: 'current_amount', label: t('jackpot.current_amount') },
  { key: 'threshold_amount', label: t('jackpot.threshold_amount'), align: 'center' },
  { key: 'chance_denom', label: t('jackpot.chance_denom'), align: 'center' },
])

// --- Bonus dialog (per-player) ---
const bonusDialog = ref(false)
const selectedMember = ref<BonusMember | null>(null)
const memberBonuses = ref<MemberBonusItem[]>([]);

function openBonusDialog(item: ReportItem) {
  selectedMember.value = { id: (item as any).member_id, name: item.member_name }
  bonusDialog.value = true
}

function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  return Number.parseFloat(String(value)) || 0;
}

function formatAmount(value: string | number | null | undefined): string {
  return formatDecimal(parseAmount(value), { maximumFractionDigits: 2 });
}
function toAmountString(v: string | number | null | undefined): string {
  return parseAmount(v).toFixed(2);
}
function toPercentDecimalString(v: string | number | null | undefined): string {
  return Number((parseAmount(v) / 100).toFixed(10)).toString();
}

async function fetchCurrentPool() {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await getJackpotCurrent();
    const payload = response?.data.value;
    poolData.value = payload?.data ?? null;
  } catch (error: any) {
    console.error("[jackpot-pool] failed to load", error);
    poolData.value = null;
    errorMessage.value = error?.message || t('jackpot.failedToLoad');
    showError(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
}

function openSettingsDialog() {
  showSettings.value = true;
}

async function onSettingsSubmit(form: JackpotSettingsForm) {
  const chanceDenom = Number.parseInt(form.chance_denom, 10) || 1;
  const payoutPercent = parseAmount(form.payout_percent);
  const companyTopupAmount = parseAmount(form.company_topup_amount);
  const memberBonusAmount = parseAmount(form.member_bonus_amount);
  const memberName = form.member_name.trim();

  if (payoutPercent < 0 || payoutPercent > 100) {
    showError(t('gameConfig.mustBeBetween', { field: t('jackpot.payoutPercentLabel') }));
    return;
  }

  const payload: UpdateJackpotCurrentBody = {
    threshold_amount: toAmountString(form.threshold_amount),
    chance_denom: chanceDenom,
    payout_percent: toPercentDecimalString(payoutPercent),
    min_eligible_bet_amount: toAmountString(form.min_eligible_bet_amount),
    jackpot_fixed_payout_amount: toAmountString(form.jackpot_fixed_payout_amount),
  };

  updateLoading.value = true;
  try {
    const response = await updateJackpotCurrent(payload);
    if (memberName && memberBonusAmount > 0) {
      await createMemberBonus({
        member_name: memberName,
        amount: toAmountString(memberBonusAmount),
        note: "",
      });
    }

    const data = response?.data.value?.data ?? null;
    if (data) poolData.value = data;
    showSuccess(
      companyTopupAmount > 0
        ? t('jackpot.updatedAndTopup')
        : (response?.data.value?.message || t('jackpot.updatedSuccessfully')),
    );
    showSettings.value = false; // close dialog on success
    await fetchCurrentPool();
  } catch (error: any) {
    console.error("[jackpot-pool] update failed", error);
    showError(error?.message || t('jackpot.failedToUpdate'));
  } finally {
    updateLoading.value = false;
  }
}

async function fetchJackpotHistories() {
  historiesLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await getJackpotHistories(1, 10);
    const payload = response?.data.value;
    jackpotHistories.value = payload?.data?.histories ?? [];
  } catch (e: any) {
    jackpotHistories.value = [];
    showError(e?.message || t('jackpot.failedToLoadReservations'));
  } finally {
    historiesLoading.value = false;
  }
}

async function fetchBonuses() {
  try {
    const response = await getMemberBonuses(1, 10, "", "", {
      filters: [
        {
          property: "b.status_id",
          operator: "eq",
          value: 1,
        },
      ],
    });
    const payload = response?.data.value;
    memberBonuses.value = payload?.data?.bonuses ?? [];
  } catch (e: any) {
    memberBonuses.value = [];
    showError(e?.message || t('jackpot.failedToLoadReservations'));
  }
}

// --- player list ---
async function fetchPlayers() {
  playersLoading.value = true
  errorMessage.value = ""

  try {
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

    const response = await getReports(
      1,        // page
      10,       // page size
      today,    // start date
      today     // end date
    )

    const payload = response?.data.value

    reportData.value = payload?.data?.reports ?? []
    reportTotal.value = payload?.data?.total_report ?? null

  } catch (e: any) {
    reportData.value = []
    reportTotal.value = null
    showError(e?.message || t("report.failedToLoad"))
  } finally {
    playersLoading.value = false
  }
}

onMounted(() => {
  fetchCurrentPool();
  fetchBonuses();
  fetchPlayers();
  fetchJackpotHistories();
});
</script>

<template>
  <div class="jackpot flex flex-col gap-3">
    <div class="page-header mt-3">
      <h1 class="page-title text-2xl font-semibold">{{ t('jackpot.management') }}</h1>
      <v-btn color="success" variant="flat" class="refresh-btn" :loading="isLoading" @click="fetchCurrentPool">
        <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
        {{ t('gameConfig.refresh') }}
      </v-btn>
    </div>

    <div class="jackpot-tabs">
      <div class="settings-flex-row mt-3">
        <v-card class="players-card" elevation="0">
          <div class="winner_card__header">
            <h2 class="winner_card__title">
              <span class="text-2xl">🎮</span>
              Member Bets
            </h2>
          </div>

          <div class="table-scroll">
            <AppTable :columns="columnsReport" :items="reportData" :loading="playersLoading" :error="errorMessage">
              <template #cell-total_bet_amount="{ item }">
                <span class="positive">{{ formatAmount(parseAmount(item.total_bet_amount)) }}</span>
              </template>
              <template #cell-total_win_lose="{ item }">
                {{ formatAmount(parseAmount(item.total_win_lose)) }}
              </template>
              <template #cell-bonus="{ item }">
                <v-btn size="small" variant="flat" color="create" class="bonus-btn" @click="openBonusDialog(item)">
                  {{ t('report.addBonus') }}
                </v-btn>
              </template>
            </AppTable>
          </div>
        </v-card>

        <!-- Jackpot global config -->
        <v-card class="winner_card" elevation="0">
          <div class="winner_card__header">
            <h2 class="winner_card__title">
              <span class="text-2xl">🎰</span>
              <span class="config-card__title">{{ t('jackpot.globalConfig') }}</span>
            </h2>

            <v-btn icon size="small" color="primary" variant="flat" class="config-card__settings-btn"
              @click="openSettingsDialog">
              <v-icon size="18">mdi-cog</v-icon>
            </v-btn>
          </div>
          <div class="pool-summary">
            <AppTable :columns="columnsCurrentJackpot" :items="jackpotTableItems" :loading="isLoading"
              :error="errorMessage">
              <template #cell-current_amount="{ item }">
                <span class="positive">{{ formatAmount(item.current_amount) }}</span>
              </template>
              <template #cell-threshold_amount="{ item }">
                {{ formatAmount(item.threshold_amount) }}
              </template>
              <template #cell-chance_denom="{ item }">
                <v-chip size="small" variant="tonal" color="primary">
                  1 / {{ item.chance_denom }}
                </v-chip>
              </template>
            </AppTable>
          </div>
        </v-card>
      </div>

      <v-card class="reservations-jackpot-card mt-3" elevation="0">
        <div class="recent-winners">
          <h3 class="recent-winners__title">
            <span class="text-2xl">👑</span>
            {{ t('jackpot.jackpotReservations') }}
          </h3>

          <div class="recent-winners__grid">
            <div v-for="(history, idx) in jackpotHistories" :key="`${history.id}-${history.payout_coin}-${idx}`"
              class="winner-chip">
              <v-icon size="14" color="amber-darken-2">mdi-ticket-confirmation-outline</v-icon>
              <span class="winner-chip__id">ID: {{ history.member_name }}</span>

              <span class="winner-chip__amount">
                <v-icon size="14" color="success">mdi-cash-multiple</v-icon>
                {{ formatAmount(history.payout_coin) }}
              </span>
            </div>
          </div>
        </div>
      </v-card>
    </div>

    <JackpotSettingsDialog v-model="showSettings" :pool-data="poolData" :update-loading="updateLoading"
      @submit="onSettingsSubmit" @cancel="showSettings = false" />
    <MemberBonusDialog v-model="bonusDialog" :member="selectedMember" @created="fetchPlayers" />
  </div>
</template>
<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.page-title {
  color: rgb(var(--v-theme-primary));
}

.refresh-btn {
  text-transform: none;
}

.config-card__title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.settings-flex-row {
  display: flex;
  align-items: stretch;
  gap: 12px;
  width: 100%;
}

.settings-flex-row>.players-card,
.settings-flex-row>.winner_card {
  flex: 1 1 0;
  min-width: 0;
}

@media (max-width: 960px) {
  .settings-flex-row {
    flex-direction: column;
  }

  .settings-flex-row>.players-card,
  .settings-flex-row>.winner_card {
    flex: 1 1 auto;
    width: 100%;
  }
}

/* Player list */
.players-card {
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  min-width: 0;
}

.positive {
  color: #047857;
  font-weight: 600;
}

.negative {
  color: #b91c1c;
  font-weight: 600;
}

.bonus-btn {
  text-transform: none;
  border-radius: 6px;
}

/* Winner / config card */
.winner_card {
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  min-width: 0;
}

.winner_card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.winner_card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.pool-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pool-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.pool-summary__row dt {
  color: #6b7280;
}

.pool-summary__row dd {
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

/* Filter row: search + refresh button, wraps on small screens */
.winner_card__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.reservations-search {
  flex: 1 1 200px;
  min-width: 0;
  max-width: 280px;
}

.refresh-mini-btn {
  flex: 0 0 auto;
  white-space: nowrap;
}

/* Small screens: stack search + refresh full width */
@media (max-width: 480px) {
  .winner_card__filters {
    flex-direction: column;
    align-items: stretch;
  }

  .reservations-search {
    max-width: 100%;
  }

  .refresh-mini-btn {
    width: 100%;
  }
}

/* Let tables scroll horizontally instead of breaking layout */
.table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.reservations-jackpot-card {
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.recent-winners__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 10px;
}

.recent-winners__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.winner-chip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px dashed rgba(var(--v-theme-primary), 0.4);
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* left accent bar like a stub edge */
.winner-chip::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 8px 0 0 8px;
  background: rgb(var(--v-theme-primary));
}

.winner-chip__id {
  color: #374151;
  font-weight: 600;
}

.winner-chip__amount {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
  font-weight: 800;
}

@media (max-width: 600px) {
  .winner-chip {
    flex: 1 1 calc(50% - 8px);
    justify-content: space-between;
  }
}

@media (max-width: 600px) {
  .recent-winners__grid {
    gap: 8px;
  }
}
</style>