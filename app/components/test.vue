<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import JackpotGlobalConfigCard, { type JackpotSettingsForm } from "~/components/JackpotGlobalConfigCard.vue";
import MemberBonusDialog, { type BonusMember } from "~/components/MemberBonusDialog.vue";
import MemberBetTab from "~/components/MemberBetTab.vue";
import TopWinnerTab from "~/components/TopWinnerTab.vue";
import BlacklistMemberTab from "~/components/BlacklistMemberTab.vue";
import { useFrontendI18n } from "~/composables/i18n";
import { formatDecimal } from "~/utils/numberFormat";
import { getReports, type ReportItem } from "~/composables/service/reportApi";
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
import {
  createReservedJackpot,
  getReservedJackpots,
  inactiveReservedJackpot,
  reactivateReservedJackpot,
  ReservedJackpotStatus,
  type ReservedJackpot,
  type ReserveJackpotPayload,
} from "~/composables/service/reservedJackpotApi";
import type { TableColumn } from "~/components/DynamicTableStyle.vue";

const { showSuccess, showError } = useSnackbar();
const { t } = useFrontendI18n();

//  Jackpot pool state 
const poolData = ref<JackpotCurrent | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");
const updateLoading = ref(false);

//  Member bets / report table state 
const reportData = ref<ReportItem[]>([]);
const reportTotal = ref<{ total_bet: string; total_valid_bet: string; total_winlose: string } | null>(null);
const currentPage = ref(1);
const itemsPerPage = 10;
const totalReportPages = ref(1);
const playersLoading = ref(false);
const memberSearch = ref("");

//  Jackpot reservations/history state 
const jackpotHistories = ref<JackpotHistoryItem[]>([]);
const historiesLoading = ref(false);

//  Bonus dialog
const bonusDialog = ref(false);
const selectedMember = ref<BonusMember | null>(null);
const memberBonuses = ref<MemberBonusItem[]>([]);

//  Player card tabs 
const playerTab = ref<"members" | "winners" | "blacklist">("members");

//  Computed
const columnsReport = computed<TableColumn<ReportItem>[]>(() => [
  { key: "index", label: "លេខរៀង", type: "index" },
  { key: "member_name", label: t("members.member") },
  {
    key: "total_win_lose",
    label: t("report.winLose"),
    align: "center",
    cellClass: (item: ReportItem) => {
      const amount = parseAmount(item.total_win_lose);
      return amount > 0
        ? "positive"
        : amount < 0
          ? "negative"
          : "normal";
    },
  },
  {
    key: "jackpot_member_bonus_amount",
    label: "Jackpot",
    align: "center",
    cellClass: (item: ReportItem) => {
      const amount = parseAmount(item.jackpot_member_bonus_amount);

      if (amount > 0) return "positive";
      if (amount < 0) return "negative";
      return "normal";
    },
  },
  { key: "bonus", label: t("report.bonus"), align: "center" },
]);

const sortedJackpotHistories = computed<JackpotHistoryItem[]>(() => {
  return [...jackpotHistories.value]
    .sort((a, b) => parseAmount(a.payout_coin) - parseAmount(b.payout_coin))
    .slice(0, 20);
});

const memberOptionsForBlacklist = computed(() => reportData.value.map((r) => r.member_name));

//  Helpers 
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

function openBonusDialog(item: ReportItem) {
  selectedMember.value = { id: (item as any).member_id, name: item.member_name };
  bonusDialog.value = true;
}

//  Jackpot pool
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
    errorMessage.value = error?.message || t("jackpot.failedToLoad");
    showError(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
}

async function onSettingsSubmit(form: JackpotSettingsForm) {
  const chanceDenom = Number.parseInt(form.chance_denom, 10) || 1;
  const payoutPercent = parseAmount(form.payout_percent);
  const companyTopupAmount = parseAmount(form.company_topup_amount);

  if (payoutPercent < 0 || payoutPercent > 100) {
    showError(t("gameConfig.mustBeBetween", { field: t("jackpot.payoutPercentLabel") }));
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

    const data = response?.data.value?.data ?? null;
    if (data) poolData.value = data;
    showSuccess(
      companyTopupAmount > 0
        ? t("jackpot.updatedAndTopup")
        : response?.data.value?.message || t("jackpot.updatedSuccessfully"),
    );
    await fetchCurrentPool();
  } catch (error: any) {
    console.error("[jackpot-pool] update failed", error);
    showError(error?.message || t("jackpot.failedToUpdate"));
  } finally {
    updateLoading.value = false;
  }
}

// POST /jackpot/reserved-jackpots  { member_name, amount }
const reserveLoading = ref(false);
const togglingId = ref<number | null>(null);
const reservedJackpots = ref<ReservedJackpot[]>([]);

async function onReserveJackpot(payload: ReserveJackpotPayload) {
  reserveLoading.value = true;
  try {
    const response = await createReservedJackpot({
      member_name: payload.member_name,
      amount: payload.amount,
    });
    const result = response?.data.value;

    if (!result?.success) {
      const errMsg = (result?.data as any)?.error || result?.message || t("jackpot.failedToReserve");
      showError(errMsg);
      return;
    }

    showSuccess(result.message || t("jackpot.reservationAdded"));
    await fetchReservedJackpots();
  } catch (error: any) {
    console.error("[jackpot-pool] reserve failed", error);
    showError(error?.message || t("jackpot.failedToReserve"));
  } finally {
    reserveLoading.value = false;
  }
}

async function onToggleReservedStatus(item: ReservedJackpot) {
  togglingId.value = item.id;
  try {
    const response =
      item.status_id === ReservedJackpotStatus.Active
        ? await inactiveReservedJackpot(item.id)
        : await reactivateReservedJackpot(item.id);

    const payload = response?.data.value;
    showSuccess(payload?.message || t("jackpot.statusUpdated"));
    await fetchReservedJackpots();
  } catch (error: any) {
    console.error("[jackpot-pool] toggle reserved status failed", error);
    showError(error?.message || t("jackpot.failedToUpdateStatus"));
  } finally {
    togglingId.value = null;
  }
}

async function fetchReservedJackpots() {
  try {
    const response = await getReservedJackpots();
    const payload = response?.data.value;
    reservedJackpots.value = payload?.data?.reserved_jackpots ?? [];
  } catch (error: any) {
    console.error("[jackpot-pool] fetch reserved jackpots failed", error);
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
    showError(e?.message || t("jackpot.failedToLoadReservations"));
  } finally {
    historiesLoading.value = false;
  }
}

//  Member bonuses
async function fetchBonuses() {
  try {
    const response = await getMemberBonuses(1, 10, "", "", {
      filters: [{ property: "b.status_id", operator: "eq", value: 1 }],
    });
    const payload = response?.data.value;
    memberBonuses.value = payload?.data?.bonuses ?? [];
  } catch (e: any) {
    memberBonuses.value = [];
    showError(e?.message || t("jackpot.failedToLoadReservations"));
  }
}

//  Player / report list
async function fetchPlayers(page = 1) {
  playersLoading.value = true;
  errorMessage.value = "";

  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await getReports(
      page,
      itemsPerPage,
      today,
      today,
      memberSearch.value
        ? { filters: [{ property: "member_name", operator: "like", value: memberSearch.value }] }
        : undefined,
    );

    const payload = response?.data.value;

    reportData.value = payload?.data?.reports ?? [];
    reportTotal.value = payload?.data?.total_report ?? null;

    const totalCount = (payload?.data as any)?.total ?? (payload?.data as any)?.total_report?.total_count ?? 0;

    totalReportPages.value =
      totalCount > 0
        ? Math.max(1, Math.ceil(totalCount / itemsPerPage))
        : reportData.value.length < itemsPerPage
          ? page
          : page + 1;

    currentPage.value = page;
  } catch (e: any) {
    reportData.value = [];
    reportTotal.value = null;
    showError(e?.message || t("report.failedToLoad"));
  } finally {
    playersLoading.value = false;
  }
}

function onPageChange(page: number) {
  fetchPlayers(page);
}

function onSearchSubmit() {
  fetchPlayers(1);
}
function onAddBlacklist(payload: { member_name: string; reason: string }) {
  console.log("[jackpot-pool] blacklist add", payload);
}

function onRemoveBlacklist(item: { member_name: string; reason: string; blocked_at: string }) {
  console.log("[jackpot-pool] blacklist remove", item);
}

onMounted(() => {
  fetchCurrentPool();
  fetchBonuses();
  fetchPlayers();
  fetchJackpotHistories();
  fetchReservedJackpots();
});
</script>

<template>
  <div class="jackpot flex flex-col gap-3">
    <div class="jackpot-tabs">
      <div class="settings-flex-row">
        <!-- Jackpot global config -->
        <div class="flex flex-col gap-3">
          <JackpotGlobalConfigCard :pool-data="poolData" :update-loading="updateLoading"
            :reserved-jackpots="reservedJackpots" :reserve-loading="reserveLoading" :toggling-id="togglingId"
            @submit="onSettingsSubmit" @reserve="onReserveJackpot" @toggle-status="onToggleReservedStatus" />
          <v-card class="reservations-jackpot-card" elevation="0">
            <div class="recent-winners">
              <h3 class="recent-winners__title">
                <span class="text-2xl">👑</span>
                {{ t('jackpot.recentWinners') }}
              </h3>

              <div v-if="!sortedJackpotHistories.length" class="empty-state">
                <img src="/emptyData/empty_data.svg" :alt="t('common.noData')" class="empty-img" />
                <div class="empty-text">{{ t('common.noData') }}</div>
              </div>

              <div v-else class="recent-winners__grid">
                <div v-for="(history, idx) in sortedJackpotHistories"
                  :key="`${history.id}-${history.payout_coin}-${idx}`" class="winner-chip">
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


        <v-card class="players-card" elevation="0">
          <div class="winner_card__header">
            <h2 class="winner_card__title">
              <span class="text-2xl">🎮</span>
              {{ t('jackpot.playerActivity') }}
            </h2>
          </div>
          <v-tabs v-model="playerTab" density="compact" show-arrows="false" grow class="player-tabs">
            <v-tab class="text-capitalize text-body-medium " value="members">{{ t('jackpot.memberBet') }}</v-tab>
            <v-tab class="text-capitalize text-body-medium " value="winners">{{ t('jackpot.topWinner') }}</v-tab>
            <v-tab class="text-capitalize text-body-medium " value="blacklist">{{ t('jackpot.blacklistMember')
            }}</v-tab>
          </v-tabs>

          <v-window v-model="playerTab">
            <!-- Member Bet -->
            <v-window-item value="members">
              <MemberBetTab :columns="columnsReport" :items="reportData" :loading="playersLoading" :error="errorMessage"
                :page="currentPage" :page-size="itemsPerPage" :total-pages="totalReportPages" :search="memberSearch"
                :format-amount="formatAmount" :parse-amount="parseAmount" @update:search="memberSearch = $event"
                @search="onSearchSubmit" @update:page="onPageChange" @bonus="openBonusDialog" />
            </v-window-item>

            <!-- Top Winner -->
            <v-window-item value="winners">
              <TopWinnerTab />
            </v-window-item>

            <!-- Blacklist Member -->
            <v-window-item value="blacklist">
              <BlacklistMemberTab :member-options="memberOptionsForBlacklist" @add="onAddBlacklist"
                @remove="onRemoveBlacklist" />
            </v-window-item>
          </v-window>
        </v-card>
      </div>
    </div>

    <MemberBonusDialog v-model="bonusDialog" :member="selectedMember" @created="() => fetchPlayers(currentPage)" />
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

.settings-flex-row {
  display: flex;
  align-items: stretch;
  gap: 12px;
  width: 100%;
}

.settings-flex-row>.players-card {
  flex: 1 1 0;
  min-width: 0;
}

.settings-flex-row> :deep(.jackpot-config-card) {
  flex: 1 1 0;
  min-width: 0;
}

@media (max-width: 960px) {
  .settings-flex-row {
    flex-direction: column;
  }

  .settings-flex-row>.players-card,
  .settings-flex-row> :deep(.jackpot-config-card) {
    flex: 1 1 auto;
    width: 100%;
  }
}

.players-card {
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  min-width: 0;
}

.player-tabs {
  margin-bottom: 12px;
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
  padding: 8px 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px dashed rgba(var(--v-theme-primary), 0.4);
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

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

  .recent-winners__grid {
    gap: 8px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
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
  color: rgb(var(--v-theme-primary));
  opacity: 0.7;
}

.player-tabs :deep(.v-slide-group__prev),
.player-tabs :deep(.v-slide-group__next) {
  display: none !important;
}
</style>