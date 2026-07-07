<template>
  <div class="jackpot flex flex-col gap-3">
    <!-- Page header with Refresh -->
    <div class="page-header">
      <h1 class="page-title text-2xl font-semibold">Jackpot Management</h1>
      <v-btn color="success" variant="flat" class="refresh-btn" :loading="isLoading" @click="fetchCurrentPool">
        <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Top summary strip -->
    <v-row dense class="summary-strip">
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--amber">
          <div class="strip-label">Current Amount</div>
          <div class="strip-value">{{ formatAmount(getCurrentAmount) }}</div>
        </div>
      </v-col>
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--green">
          <div class="strip-label">Threshold</div>
          <div class="strip-value">{{ formatAmount(getThresholdAmount) }}</div>
        </div>
      </v-col>
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--blue">
          <div class="strip-label">Payout %</div>
          <div class="strip-value">{{ formatAmount(getPayoutPercent) }}%</div>
        </div>
      </v-col>
      <v-col cols="6" md="3">
        <div class="strip-card strip-card--violet">
          <div class="strip-label">Fixed Payout</div>
          <div class="strip-value">{{ formatAmount(getFixedPayoutAmount) }}</div>
        </div>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <div class="jackpot-tabs">
      <v-tabs v-model="activeTab" density="compact" color="primary" class="jackpot-tabs__bar">
        <v-tab value="settings" class="tab-item">Global</v-tab>
        <v-tab value="ledger" class="tab-item">Ledger</v-tab>
        <v-tab value="member-bonus" class="tab-item">Member Bonus</v-tab>
        <v-tab value="history" class="tab-item">History</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="jackpot-tabs__window">
        <!-- Global tab: config + reservations -->
        <v-window-item value="settings">
          <!-- Global Jackpot Configuration -->
          <v-card class="config-card mb-3" elevation="0">
            <div class="config-card__header">
              <h2 class="config-card__title">Global Jackpot Configuration</h2>
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
                    Current Amount
                  </div>
                  <div class="tile-value">{{ formatAmount(getCurrentAmount) }}</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--purple">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-flag</v-icon> -->
                    Threshold
                  </div>
                  <div class="tile-value">{{ formatAmount(getThresholdAmount) }}</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--amber">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-dice-multiple</v-icon> -->
                    Win Chance
                  </div>
                  <div class="tile-value">1/{{ poolData?.chance_denom ?? 0 }}</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--green">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-percent</v-icon> -->
                    Payout %
                  </div>
                  <div class="tile-value">{{ formatAmount(getPayoutPercent) }}%</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--red">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-bank-transfer-in</v-icon> -->
                    Company Top-up
                  </div>
                  <div class="tile-value">{{ formatAmount(getCompanyTopupAmount) }}</div>
                </div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="tile tile--indigo">
                  <div class="tile-label">
                    <!-- <v-icon size="14" class="tile-icon">mdi-trophy</v-icon> -->
                    Fixed Payout
                  </div>
                  <div class="tile-value">{{ formatAmount(getFixedPayoutAmount) }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- Jackpot Reservations -->
          <v-card class="reservations-card" elevation="0">
            <div class="reservations-card__header">
              <div>
                <h2 class="reservations-card__title">
                  <!-- <v-icon size="18" class="mr-1" color="amber-darken-2">mdi-crown</v-icon> -->
                  Jackpot Reservations
                </h2>
                <div class="reservations-card__subtitle">
                  Showing {{ reservationsRangeStart }}-{{ reservationsRangeEnd }} of {{ reservationsTotal }}
                </div>
              </div>
            </div>

            <div class="reservations-card__filters">
              <v-text-field v-model="reservationSearch" label="Member Name" placeholder="Search member name"
                prepend-inner-icon="mdi-magnify" density="compact" variant="outlined" hide-details clearable
                class="reservations-search" @keyup.enter="fetchReservations" />
              <v-btn variant="outlined" density="comfortable" class="reset-btn" @click="resetReservationFilters">
                <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
                Reset
              </v-btn>
            </div>

            <v-table class="reservations-table" density="comfortable">
              <thead>
                <tr>
                  <th>Name</th><th>Jackpot</th><th>Updated At</th><th>Status</th><th>Status ID</th><th>Update</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="reservationsLoading">
                  <td colspan="6" class="text-center py-6">
                    <v-progress-circular indeterminate size="20" color="primary" />
                  </td>
                </tr>
                <tr v-else-if="!reservations.length">
                  <td colspan="6" class="text-center py-8">
                    <v-icon size="32" color="grey-lighten-1">mdi-text-box-search-outline</v-icon>
                    <div class="empty-title">No jackpot reservations found</div>
                    <div class="empty-subtitle">Try another member name.</div>
                  </td>
                </tr>
                <tr v-for="row in reservations" v-else :key="row.id">
                  <td>{{ row.name }}</td>
                  <td>{{ formatAmount(row.jackpot) }}</td>
                  <td>{{ formatDateTime(row.updated_at) }}</td>
                  <td>{{ row.status }}</td>
                  <td>{{ row.status_id }}</td>
                  <td>
                    <v-btn size="small" variant="text" color="primary" @click="onUpdateReservation(row)">
                      Update
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
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
import JackpotSettingsDialog, { type JackpotSettingsForm } from "~/components/JackpotSettingsForm.vue";

import { useSnackbar } from "~/composables/useSnackbar";
import {
  createJackpotCompanyTopup,
  getJackpotCurrent,
  type JackpotCurrent,
  type UpdateJackpotCurrentBody,
  updateJackpotCurrent,
} from "~/composables/service/jackpotCurrentPoolApi";

const { showSuccess, showError } = useSnackbar();

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
const reservationsTotal = ref(0);
const reservationsPage = ref(1);
const reservationsPerPage = ref(10);
const reservationsRangeStart = computed(() =>
  reservationsTotal.value === 0 ? 0 : (reservationsPage.value - 1) * reservationsPerPage.value + 1
);
const reservationsRangeEnd = computed(() =>
  Math.min(reservationsPage.value * reservationsPerPage.value, reservationsTotal.value)
);

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
  const amount = parseAmount(value);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
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
    errorMessage.value = error?.message || "Failed to load jackpot pool";
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

    const data = response?.data.value?.data ?? null;
    if (data) poolData.value = data;
    showSuccess(
      companyTopupAmount > 0
        ? "Jackpot settings updated and company top-up added successfully"
        : (response?.data.value?.message || "Jackpot settings updated successfully"),
    );
    showSettings.value = false; // close dialog on success
    await fetchCurrentPool();
  } catch (error: any) {
    console.error("[jackpot-pool] update failed", error);
    showError(error?.message || "Failed to update jackpot settings");
  } finally {
    updateLoading.value = false;
  }
}

// reservations stubs
async function fetchReservations() {
  reservationsLoading.value = true;
  try { /* your API */ } catch (e:any){ showError(e?.message || "Failed to load"); }
  finally { reservationsLoading.value = false; }
}
function resetReservationFilters() {
  reservationSearch.value = "";
  reservationsPage.value = 1;
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
