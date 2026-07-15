<template>
  <div class="jackpot flex flex-col gap-3">
    <!-- Page header with Refresh -->
    <div class="page-header mt-3">
      <h1 class="page-title text-2xl font-semibold">{{ t('jackpot.management') }}</h1>
      <!-- <v-btn color="success" variant="flat" class="refresh-btn" :loading="isLoading" @click="fetchCurrentPool">
        <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
        {{ t('gameConfig.refresh') }}
      </v-btn> -->
    </div>

    <!-- Top summary strip -->
    <v-row dense class="summary-strip">
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--amber">
          <div class="strip-label">{{ t('jackpot.currentAmount') }}</div>
          <div class="strip-value">{{ formatAmount(getCurrentAmount) }}</div>
        </div>
      </v-col>
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--green">
          <div class="strip-label">{{ t('jackpot.threshold') }}</div>
          <div class="strip-value">{{ formatAmount(getThresholdAmount) }}</div>
        </div>
      </v-col>
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--blue">
          <div class="strip-label">{{ t('jackpot.payoutPercent') }}</div>
          <div class="strip-value">{{ formatAmount(getPayoutPercent) }}%</div>
        </div>
      </v-col>
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--violet">
          <div class="strip-label">{{ t('jackpot.fixedPayout') }}</div>
          <div class="strip-value">{{ formatAmount(getFixedPayoutAmount) }}</div>
        </div>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <div class="jackpot-tabs">
      <v-tabs v-model="activeTab" density="compact" color="primary" class="jackpot-tabs__bar">
        <v-tab value="settings" class="tab-item">{{ t('jackpot.global') }}</v-tab>
        <v-tab value="ledger" class="tab-item">{{ t('jackpot.ledger') }}</v-tab>
        <v-tab value="member-bonus" class="tab-item">{{ t('jackpot.memberBonus') }}</v-tab>
        <v-tab value="history" class="tab-item">{{ t('jackpot.history') }}</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="jackpot-tabs__window">
        <!-- Global tab: config + reservations -->
        <v-window-item value="settings">
          <!-- Global Jackpot Configuration -->
          <v-card class="config-card mb-3" elevation="0">
            <div class="config-card__header">
              <h2 class="config-card__title">{{ t('jackpot.globalConfig') }}</h2>
              <!-- THIS IS THE FIX: open dialog, not inline editor -->
              <v-btn
                icon
                size="small"
                color="primary"
                variant="flat"
                class="config-card__settings-btn"
                @click="openSettingsDialog"
              >
                <v-icon size="18">mdi-cog</v-icon>
              </v-btn>
            </div>

            <v-row dense class="config-grid">
              <v-col cols="6" sm="4">
                <div class="tile tile--blue">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-currency-usd</v-icon> -->
                    {{ t('jackpot.currentAmount') }}
                  </div>
                  <div class="tile-value">{{ formatAmount(getCurrentAmount) }}</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--purple">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-flag</v-icon> -->
                    {{ t('jackpot.threshold') }}
                  </div>
                  <div class="tile-value">{{ formatAmount(getThresholdAmount) }}</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--amber">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-dice-multiple</v-icon> -->
                    {{ t('jackpot.winChance') }}
                  </div>
                  <div class="tile-value">1/{{ poolData?.chance_denom ?? 0 }}</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--green">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-percent</v-icon> -->
                    {{ t('jackpot.payoutPercent') }}
                  </div>
                  <div class="tile-value">{{ formatAmount(getPayoutPercent) }}%</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--red">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-bank-transfer-in</v-icon> -->
                    {{ t('jackpot.companyTopup') }}
                  </div>
                  <div class="tile-value">{{ formatAmount(getCompanyTopupAmount) }}</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--indigo">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-trophy</v-icon> -->
                    {{ t('jackpot.fixedPayout') }}
                  </div>
                  <div class="tile-value">{{ formatAmount(getFixedPayoutAmount) }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- Jackpot Reservations -->
          <!-- <v-card class="reservations-card" elevation="0">
            <div class="reservations-card__header">
              <div>
                <h2 class="reservations-card__title">
                  <v-icon size="18" class="mr-1" color="amber-darken-2">mdi-crown</v-icon>
                  {{ t('jackpot.jackpotReservations') }}
                </h2>
                <div class="reservations-card__subtitle">
                  {{ t('jackpot.showingFirst10') }}
                </div>
              </div>
            </div>

            <div class="reservations-card__filters">
              <v-text-field v-model="reservationSearch" :label="t('jackpot.memberName')" :placeholder="t('jackpot.searchMemberName')"
                prepend-inner-icon="mdi-magnify" density="compact" variant="outlined" hide-details clearable
                class="reservations-search" @keyup.enter="fetchReservations" />
              <v-btn variant="outlined" density="comfortable" class="reset-btn" @click="resetReservationFilters">
                <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
                {{ t('common.reset') }}
              </v-btn>
            </div>

            <AppTable
              :columns="reservationColumns"
              :items="reservationRows"
              :loading="reservationsLoading"
            >
              <template #cell-jackpot="{ item }">
                {{ formatAmount(item.jackpot) }}
              </template>

              <template #cell-updated_at="{ item }">
                {{ formatDateTime(item.updated_at) }}
              </template>

              <template #cell-update="{ item }">
                <v-btn size="small" variant="text" color="primary" @click="onUpdateReservation(item)">
                  {{ t('jackpot.update') }}
                </v-btn>
              </template>
            </AppTable>
          </v-card> -->
        </v-window-item>

        <v-window-item value="member-bonus">
          <JackpotMember />
        </v-window-item>

        <v-window-item value="history">
          <JackpotHistory />
        </v-window-item>

        <v-window-item value="ledger">
          <JackpotLeger />
        </v-window-item>
      </v-window>
    </div>

    <!-- FIXED: DIALOG USAGE INSTEAD OF INLINE CompanyPopUp -->
    <JackpotSettingsDialog
      v-model="showSettings"
      :pool-data="poolData"
      :update-loading="updateLoading"
      @submit="onSettingsSubmit"
      @cancel="showSettings = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppTable, { type TableColumn } from "~/components/DynamicTableStyle.vue";
import JackpotSettingsDialog, { type JackpotSettingsForm } from "~/components/JackpotSettingsForm.vue";
import { useFrontendI18n } from "~/composables/i18n";
import { formatDecimal } from "~/utils/numberFormat";

import { useSnackbar } from "~/composables/useSnackbar";
import { createMemberBonus } from "~/composables/service/memberBonusApi";
import {
  createJackpotCompanyTopup,
  getJackpotCurrent,
  type JackpotCurrent,
  type UpdateJackpotCurrentBody,
  updateJackpotCurrent,
} from "~/composables/service/jackpotCurrentPoolApi";

const { showSuccess, showError } = useSnackbar();
const { t } = useFrontendI18n();

const activeTab = ref("settings");
const showSettings = ref(false); // v-model for dialog

const poolData = ref<JackpotCurrent | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");
const updateLoading = ref(false);

// reservations (unchanged)
interface JackpotReservationRow {
  id: string | number;
  name: string;
  jackpot: string | number;
  updated_at: string | null;
  status: string;
  status_id: number;
}
const reservations = ref<JackpotReservationRow[]>([]);
const reservationsLoading = ref(false);
const reservationSearch = ref("");
const reservationRows = computed(() => reservations.value.slice(0, 10));
const reservationColumns = computed<TableColumn<JackpotReservationRow>[]>(() => [
  { key: "name", label: t('jackpot.name') },
  { key: "jackpot", label: t('jackpot.jackpot') },
  { key: "updated_at", label: t('jackpot.updatedAt') },
  { key: "status", label: t('jackpot.status') },
  { key: "status_id", label: t('jackpot.statusId') },
  { key: "update", label: t('jackpot.update') },
]);

function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  return Number.parseFloat(String(value)) || 0;
}

const getCurrentAmount = computed(() => parseAmount(poolData.value?.current_amount));
const getThresholdAmount = computed(() => parseAmount(poolData.value?.threshold_amount));
const getPayoutPercent = computed(() => parseAmount(poolData.value?.payout_percent));
const getCompanyTopupAmount = computed(() => parseAmount(poolData.value?.company_topup_amount));
const getFixedPayoutAmount = computed(() => parseAmount(poolData.value?.jackpot_fixed_payout_amount));

function formatAmount(value: string | number | null | undefined): string {
  return formatDecimal(parseAmount(value), { maximumFractionDigits: 2 });
}
function toAmountString(v: string | number | null | undefined): string {
  return parseAmount(v).toFixed(2);
}
function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(date);
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

// --- DIALOG OPEN ---
function openSettingsDialog() {
  showSettings.value = true;
}

// --- DIALOG SUBMIT (receives payload from dialog) ---
async function onSettingsSubmit(form: JackpotSettingsForm) {
  const chanceDenom = Number.parseInt(form.chance_denom, 10) || 1;
  const companyTopupAmount = parseAmount(form.company_topup_amount);
  const memberBonusAmount = parseAmount(form.member_bonus_amount);
  const memberName = form.member_name.trim();

  const payload: UpdateJackpotCurrentBody = {
    threshold_amount: toAmountString(form.threshold_amount),
    chance_denom: chanceDenom,
    payout_percent: toAmountString(form.payout_percent),
    min_eligible_bet_amount: toAmountString(form.min_eligible_bet_amount),
    jackpot_fixed_payout_amount: toAmountString(form.jackpot_fixed_payout_amount),
  };

  updateLoading.value = true;
  try {
    const response = await updateJackpotCurrent(payload);
    if (companyTopupAmount > 0) {
      await createJackpotCompanyTopup({
        amount: toAmountString(companyTopupAmount),
        note: "",
      });
    }
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

// reservations stubs
async function fetchReservations() {
  reservationsLoading.value = true;
  try { /* your API */ } catch (e:any){ showError(e?.message || t('jackpot.failedToLoadReservations')); }
  finally { reservationsLoading.value = false; }
}
function resetReservationFilters() {
  reservationSearch.value = "";
  fetchReservations();
}
function onUpdateReservation(row: JackpotReservationRow) {
  console.log("update reservation", row);
}

onMounted(() => {
  fetchCurrentPool();
  fetchReservations();
});
</script>

<style scoped>
/* your original styles – unchanged, copy from your file */
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-title { color: rgb(var(--v-theme-primary)); }
.refresh-btn { text-transform: none; }
.summary-strip { margin: 0; }
.strip-card { padding: 10px 14px; background: #fff; border: 1px solid #e5e7eb; border-left-width: 4px; border-radius: 8px; height: 100%; }
.strip-label { font-size: 12px; color: #6b7280; }
.strip-value { font-size: 18px; font-weight: 700; margin-top: 2px; }
.strip-card--amber { border-left-color: #f59e0b; }
.strip-card--amber .strip-value { color: #b45309; }
.strip-card--green { border-left-color: #10b981; }
.strip-card--green .strip-value { color: #047857; }
.strip-card--blue { border-left-color: #3b82f6; }
.strip-card--blue .strip-value { color: #1d4ed8; }
.strip-card--violet { border-left-color: #8b5cf6; }
.strip-card--violet .strip-value { color: #6d28d9; }
.config-card { padding: 16px; border-radius: 10px; background: #fff; border: 1px solid #e5e7eb; }
.config-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.config-card__title { font-size: 14px; font-weight: 600; color: #111827; }
.config-card__settings-btn { background: #2563eb !important; }
.config-grid { margin: 0; }
.tile { border-radius: 8px; padding: 10px 12px; height: 100%; }
.tile-label { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 4px; opacity: 0.85; }
.tile-icon { opacity: 0.9; }
.tile-value { font-size: 18px; font-weight: 700; line-height: 1.2; }
.tile--blue { background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%); color: #1d4ed8; }
.tile--purple { background: linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%); color: #7c3aed; }
.tile--amber { background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); color: #b45309; }
.tile--green { background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%); color: #047857; }
.tile--red { background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%); color: #b91c1c; }
.tile--indigo { background: linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%); color: #4338ca; }
.reservations-card { padding: 16px; border-radius: 10px; background: #fff; border: 1px solid #e5e7eb; }
.reservations-card__header { margin-bottom: 12px; }
.reservations-card__title { display: flex; align-items: center; font-size: 14px; font-weight: 600; color: #111827; }
.reservations-card__subtitle { font-size: 12px; color: #6b7280; margin-top: 2px; }
.reservations-card__filters { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.reservations-search { max-width: 280px; }
.reset-btn { margin-left: auto; text-transform: none; }
.reservations-table { border: 1px solid #e5e7eb; border-radius: 8px; }
.reservations-table :deep(th) { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; color: #6b7280; background: #f9fafb; }
.empty-title { font-size: 13px; font-weight: 600; color: #374151; margin-top: 8px; }
.empty-subtitle { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.jackpot-tabs__bar { border-bottom: 1px solid #e5e7eb; text-transform: capitalize !important; }
.jackpot-tabs__window { padding-top: 12px; }
.tab-item { text-transform: capitalize !important; font-weight: 600; }
</style>
