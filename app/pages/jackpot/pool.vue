<template>
  <div class="jackpot-pool-page pa-2">
    <!-- <div class="page-header">
      <div>
        <p class="page-eyebrow">Jackpot</p>
        <h1 class="page-title">Pool Management</h1>
        <p class="page-subtitle">
          Manage the current jackpot pool, company top-ups, and pool settings in one place.
        </p>
      </div>

      <div class="header-actions">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          :loading="isLoading"
          @click="fetchCurrentPool"
        >
          Refresh
        </v-btn>
      </div>
    </div> -->

    <v-alert
      v-if="errorMessage"
      class="mb-4"
      type="error"
      variant="tonal"
      border="start"
    >
      {{ errorMessage }}
    </v-alert>

    <v-row dense class="summary-grid">
      <v-col cols="12" md="6" lg="3">
        <v-card class="summary-card summary-card--current" elevation="0">
          <div class="summary-label">Current Amount</div>
          <div class="summary-value">{{ formatAmount(getCurrentAmount) }}</div>
          <div class="summary-caption">Live jackpot balance</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3">
        <v-card class="summary-card" elevation="0">
          <div class="summary-label">Threshold</div>
          <div class="summary-value">{{ formatAmount(getThresholdAmount) }}</div>
          <div class="summary-caption">Target before payout logic kicks in</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3">
        <v-card class="summary-card" elevation="0">
          <div class="summary-label">Payout Percent</div>
          <div class="summary-value">{{ formatAmount(getPayoutPercent) }}%</div>
          <div class="summary-caption">Share of the jackpot pool</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3">
        <v-card class="summary-card" elevation="0">
          <div class="summary-label">Status</div>
          <div class="summary-value">
            <v-chip :color="statusChipColor" variant="flat" size="small" class="status-chip">
              {{ statusLabel }}
            </v-chip>
          </div>
          <div class="summary-caption">Last updated {{ formatDateTime(poolData?.updated_at) }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row dense class="content-grid">
      <v-col cols="12" lg="5">
        <v-card class="panel-card" elevation="0">
          <div class="panel-header">
            <div>
              <h2>Company Top-up</h2>
              <p>Add more balance to the live jackpot pool.</p>
            </div>

            <v-icon size="22" color="var(--pool-accent)">mdi-cash-plus</v-icon>
          </div>

          <v-divider class="panel-divider" />

          <div class="panel-body">
            <div class="field-group">
              <label class="field-label">Amount</label>
              <v-text-field
                :model-value="topupForm.amount"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                placeholder="50000"
                density="compact"
                variant="outlined"
                hide-details="auto"
                @keydown="blockNonDecimalKeys"
                @paste="handleDecimalPaste"
                @update:model-value="topupForm.amount = sanitizeDecimalInput($event)"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Note</label>
              <v-text-field
                v-model="topupForm.note"
                placeholder="Optional note"
                density="compact"
                variant="outlined"
                hide-details="auto"
              />
            </div>

            <div class="mini-stats">
              <div class="mini-stat">
                <span class="mini-stat__label">Before</span>
                <strong>{{ formatAmount(getCurrentAmount) }}</strong>
              </div>
              <div class="mini-stat">
                <span class="mini-stat__label">After</span>
                <strong>{{ formatAmount(predictedTopupAmount) }}</strong>
              </div>
            </div>
          </div>

          <v-divider class="panel-divider" />

          <div class="panel-actions">
            <v-btn
              class="primary-action"
              color="primary"
              :loading="topupLoading"
              @click="submitTopup"
            >
              Add Top-up
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="7">
        <v-card class="panel-card" elevation="0">
          <div class="panel-header">
            <div>
              <h2>Jackpot Settings</h2>
              <p>Update the active pool configuration.</p>
            </div>

            <v-icon size="22" color="var(--pool-accent)">mdi-cog-outline</v-icon>
          </div>

          <v-divider class="panel-divider" />

          <div class="panel-body settings-grid">
            <div class="field-group">
              <label class="field-label">Threshold Amount</label>
              <v-text-field
                :model-value="settingsForm.threshold_amount"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                @keydown="blockNonDecimalKeys"
                @paste="handleDecimalPaste"
                @update:model-value="settingsForm.threshold_amount = sanitizeDecimalInput($event)"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Chance Denominator</label>
              <v-text-field
                :model-value="settingsForm.chance_denom"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                @keydown="blockNonIntegerKeys"
                @paste="handleIntegerPaste"
                @update:model-value="settingsForm.chance_denom = sanitizeIntegerInput($event)"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Payout Percent</label>
              <v-text-field
                :model-value="settingsForm.payout_percent"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                @keydown="blockNonDecimalKeys"
                @paste="handleDecimalPaste"
                @update:model-value="settingsForm.payout_percent = sanitizeDecimalInput($event)"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Min Eligible Bet Amount</label>
              <v-text-field
                :model-value="settingsForm.min_eligible_bet_amount"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                @keydown="blockNonDecimalKeys"
                @paste="handleDecimalPaste"
                @update:model-value="settingsForm.min_eligible_bet_amount = sanitizeDecimalInput($event)"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Jackpot Fixed Payout Amount</label>
              <v-text-field
                :model-value="settingsForm.jackpot_fixed_payout_amount"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                @keydown="blockNonDecimalKeys"
                @paste="handleDecimalPaste"
                @update:model-value="settingsForm.jackpot_fixed_payout_amount = sanitizeDecimalInput($event)"
              />
            </div>

            <div class="field-group field-group--readonly">
              <label class="field-label">Current Pool Progress</label>
              <div class="progress-meta">
                <span>{{ formatAmount(poolProgress) }}%</span>
                <span>{{ formatAmount(getCurrentAmount) }} / {{ formatAmount(getThresholdAmount) }}</span>
              </div>
              <v-progress-linear
                :model-value="poolProgress"
                height="10"
                rounded
                color="primary"
                bg-color="rgba(15, 23, 42, 0.08)"
              />
            </div>
          </div>

          <v-divider class="panel-divider" />

          <div class="panel-actions panel-actions--split">
            <div class="panel-meta">
              <span>Top-up total: {{ formatAmount(getCompanyTopupAmount) }}</span>
              <span>Fixed payout: {{ formatAmount(getFixedPayoutAmount) }}</span>
            </div>

            <v-btn
              class="primary-action"
              color="primary"
              :loading="updateLoading"
              @click="submitSettings"
            >
              Save Settings
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSnackbar } from "~/composables/useSnackbar";
import {
  createJackpotCompanyTopup,
  getJackpotCurrent,
  type JackpotCurrent,
  type UpdateJackpotCurrentBody,
  updateJackpotCurrent,
} from "~/composables/service/jackpotCurrentPoolApi";

const { showSuccess, showError } = useSnackbar();

const poolData = ref<JackpotCurrent | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");
const topupLoading = ref(false);
const updateLoading = ref(false);

const topupForm = ref({
  amount: "",
  note: "",
});

const settingsForm = ref({
  threshold_amount: "0.00",
  chance_denom: "1",
  payout_percent: "0.00",
  min_eligible_bet_amount: "0.00",
  jackpot_fixed_payout_amount: "0.00",
});

const getCurrentAmount = computed(() => parseAmount(poolData.value?.current_amount));
const getThresholdAmount = computed(() => parseAmount(poolData.value?.threshold_amount));
const getPayoutPercent = computed(() => parseAmount(poolData.value?.payout_percent));
const getCompanyTopupAmount = computed(() => parseAmount(poolData.value?.company_topup_amount));
const getFixedPayoutAmount = computed(() => parseAmount(poolData.value?.jackpot_fixed_payout_amount));
const poolProgress = computed(() => {
  const threshold = getThresholdAmount.value;
  if (!threshold) return 0;
  return Math.min(100, (getCurrentAmount.value / threshold) * 100);
});

const predictedTopupAmount = computed(() => {
  const amount = parseAmount(topupForm.value.amount);
  return getCurrentAmount.value + amount;
});

const statusLabel = computed(() => {
  const statusId = poolData.value?.status_id;
  if (statusId === 1) return "Active";
  if (statusId === 2) return "Inactive";
  return statusId ? `Status #${statusId}` : "-";
});

const statusChipColor = computed(() => {
  const statusId = poolData.value?.status_id;
  if (statusId === 1) return "success";
  if (statusId === 2) return "warning";
  return "default";
});

function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  return Number.parseFloat(String(value)) || 0;
}

function sanitizeIntegerInput(value: string | number | null | undefined): string {
  return String(value ?? "").replace(/\D+/g, "");
}

function sanitizeDecimalInput(value: string | number | null | undefined): string {
  const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const [integerPart = "", ...fractionParts] = cleaned.split(".");
  const fractionPart = fractionParts.join("");

  if (cleaned.startsWith(".")) {
    return fractionPart ? `0.${fractionPart}` : "0.";
  }

  if (!fractionPart) {
    return integerPart;
  }

  return `${integerPart || "0"}.${fractionPart}`;
}

function blockNonDecimalKeys(event: KeyboardEvent) {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ]

  if (
    allowedKeys.includes(event.key)
    || event.ctrlKey
    || event.metaKey
  ) {
    return
  }

  if (!/[\d.]/.test(event.key)) {
    event.preventDefault()
    return
  }

  if (event.key === '.' && (event.currentTarget as HTMLInputElement | null)?.value?.includes('.')) {
    event.preventDefault()
  }
}

function blockNonIntegerKeys(event: KeyboardEvent) {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ]

  if (
    allowedKeys.includes(event.key)
    || event.ctrlKey
    || event.metaKey
  ) {
    return
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

function handleDecimalPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/[\d.]/.test(text)) {
    event.preventDefault()
  }
}

function handleIntegerPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/^\d+$/.test(text)) {
    event.preventDefault()
  }
}

function formatAmount(value: string | number | null | undefined): string {
  const amount = parseAmount(value);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function toAmountString(value: string | number | null | undefined): string {
  return parseAmount(value).toFixed(2);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function syncSettingsForm(data: JackpotCurrent) {
  settingsForm.value = {
    threshold_amount: data.threshold_amount ?? "0.00",
    chance_denom: String(data.chance_denom ?? 1),
    payout_percent: data.payout_percent ?? "0.00",
    min_eligible_bet_amount: data.min_eligible_bet_amount ?? "0.00",
    jackpot_fixed_payout_amount: data.jackpot_fixed_payout_amount ?? "0.00",
  };
}

async function fetchCurrentPool() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await getJackpotCurrent();
    const payload = response?.data.value;
    poolData.value = payload?.data ?? null;

    if (poolData.value) {
      syncSettingsForm(poolData.value);
    }
  } catch (error: any) {
    console.error("[jackpot-pool] failed to load", error);
    poolData.value = null;
    errorMessage.value = error?.message || "Failed to load jackpot pool";
  } finally {
    isLoading.value = false;
  }
}

async function submitTopup() {
  const amount = parseAmount(topupForm.value.amount);
  if (amount <= 0) {
    showError("Please enter a valid top-up amount");
    return;
  }

  topupLoading.value = true;
  try {
    const response = await createJackpotCompanyTopup({
      amount: amount.toFixed(2),
      note: topupForm.value.note ?? "",
    });

    const message = response?.data.value?.message || "Top-up created successfully";
    showSuccess(message);
    topupForm.value.amount = "";
    topupForm.value.note = "";
    await fetchCurrentPool();
  } catch (error: any) {
    console.error("[jackpot-pool] top-up failed", error);
    showError(error?.message || "Failed to create jackpot top-up");
  } finally {
    topupLoading.value = false;
  }
}

async function submitSettings() {
  const chanceDenom = Number.parseInt(settingsForm.value.chance_denom, 10) || 1;

  const payload: UpdateJackpotCurrentBody = {
    threshold_amount: toAmountString(settingsForm.value.threshold_amount),
    chance_denom: chanceDenom,
    payout_percent: toAmountString(settingsForm.value.payout_percent),
    min_eligible_bet_amount: toAmountString(settingsForm.value.min_eligible_bet_amount),
    jackpot_fixed_payout_amount: toAmountString(settingsForm.value.jackpot_fixed_payout_amount),
  };

  updateLoading.value = true;
  try {
    const response = await updateJackpotCurrent(payload);
    const data = response?.data.value?.data ?? null;
    if (data) {
      poolData.value = data;
      syncSettingsForm(data);
    }

    showSuccess(response?.data.value?.message || "Jackpot settings updated successfully");
    await fetchCurrentPool();
  } catch (error: any) {
    console.error("[jackpot-pool] update failed", error);
    showError(error?.message || "Failed to update jackpot settings");
  } finally {
    updateLoading.value = false;
  }
}

onMounted(fetchCurrentPool);
</script>

<style scoped>
.jackpot-pool-page {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.page-eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.page-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.page-subtitle {
  margin: 10px 0 0;
  max-width: 720px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-grid,
.content-grid {
  margin-top: 0;
}

.summary-card,
.panel-card {
  border-radius: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.75));
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.summary-card {
  padding: 18px;
  min-height: 140px;
}

.summary-card--current {
  background: radial-gradient(circle at top right, rgba(0, 194, 212, 0.14), transparent 45%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.78));
}

.summary-label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.55);
  letter-spacing: 0.08em;
}

.summary-value {
  margin-top: 12px;
  font-size: 28px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.summary-caption {
  margin-top: 10px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 13px;
}

.status-chip {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.panel-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 22px 18px;
  gap: 12px;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.panel-header p {
  margin: 6px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.panel-divider {
  opacity: 0.18;
}

.panel-body {
  padding: 20px 22px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-group--readonly {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.mini-stat {
  border-radius: 16px;
  padding: 14px 16px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.mini-stat__label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(var(--v-theme-on-surface), 0.54);
  margin-bottom: 6px;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px 22px 22px;
}

.panel-actions--split {
  justify-content: space-between;
  flex-wrap: wrap;
}

.panel-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 13px;
}

.primary-action {
  min-width: 150px;
  font-weight: 700;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.66);
  margin-bottom: 8px;
}

:deep(.v-field) {
  border-radius: 14px;
}

@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .mini-stats {
    grid-template-columns: 1fr;
  }

  .panel-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .panel-actions--split {
    align-items: flex-start;
  }
}
</style>
