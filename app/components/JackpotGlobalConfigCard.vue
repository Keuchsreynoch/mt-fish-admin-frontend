<template>
  <v-card class="winner_card jackpot-config-card settings-dialog" elevation="0">
    <div class="settings-dialog__header">
      <div class="dialog-title">
        <div class="title-icon">
          <v-icon size="16" color="#fff">mdi-crown</v-icon>
        </div>
        <span>{{ t('jackpot.globalConfig') }}</span>
      </div>
    </div>

    <!-- Current pool banner -->
    <div class="current-pool-banner">
      <div class="banner-label">{{ t('jackpot.currentAmount') }}</div>
      <div class="banner-value">{{ formatAmount(poolData?.current_amount) }}</div>
    </div>

    <div class="dialog-content">
      <!-- Pool Configuration -->
      <div class="section-card section-card--blue">
        <div class="section-title">
          <div class="section-icon section-icon--blue">
            <v-icon size="14" color="#fff">mdi-cog</v-icon>
          </div>
          <span>{{ t('jackpot.globalConfig') }}</span>
        </div>

        <div class="section-fields">
          <div class="field-row">
            <div class="field-col">
              <label class="field-label">{{ t('jackpot.companyTopup') }}</label>
              <v-text-field v-model="form.company_topup_amount" type="text" inputmode="decimal" density="compact"
                variant="outlined" hide-details placeholder="0" class="stepper-input" @keydown="blockNonDecimalKeys"
                @paste.prevent="handleDecimalPaste" />
            </div>

            <div class="field-col">
              <label class="field-label">{{ t('jackpot.threshold') }}</label>
              <v-text-field v-model="form.threshold_amount" type="text" inputmode="decimal" density="compact"
                variant="outlined" hide-details placeholder="0" class="stepper-input" @keydown="blockNonDecimalKeys"
                @paste.prevent="handleDecimalPaste" />
            </div>
          </div>
        </div>
      </div>

      <!-- Win Probability -->
      <div class="section-card section-card--purple">
        <div class="section-title">
          <div class="section-icon section-icon--purple">
            <v-icon size="14" color="#fff">mdi-dice-multiple</v-icon>
          </div>
          <span>{{ t('jackpot.winChance') }}</span>
        </div>

        <div class="section-fields">
          <div class="chance-input-wrapper">
            <span class="chance-prefix">{{ t('common.oneIn') }}</span>
            <v-text-field v-model="form.chance_denom" type="text" inputmode="numeric" density="compact"
              variant="outlined" hide-details placeholder="5,000" class="stepper-input" @keydown="blockNonIntegerKeys"
              @paste.prevent="handleIntegerPaste" />
          </div>

          <div class="probability-info">
            <span class="probability-label">{{ t('jackpot.winChance') }}:</span>
            <span class="probability-value">{{ winProbability }}% {{ t('common.perSpin') }}</span>
          </div>
        </div>
      </div>

      <!-- Create Member Bonus -->
      <div class="section-card section-card--amber">
        <div class="section-title">
          <div class="section-icon section-icon--amber">
            <v-icon size="14" color="#fff">mdi-gift-outline</v-icon>
          </div>
          <span>{{ t('jackpot.createMemberBonus') }}</span>
        </div>

        <div class="section-fields">
          <div class="field-row">
            <div class="field-col">
              <label class="field-label">{{ t('members.member') }}</label>
              <v-text-field :model-value="form.member_name" type="text" density="compact" variant="outlined"
                hide-details :placeholder="t('common.memberNamePlaceholder')" class="stepper-input"
                @update:model-value="form.member_name = normalizeMemberName($event)" />
            </div>

            <div class="field-col">
              <label class="field-label">{{ t('jackpot.amount') }}</label>
              <v-text-field v-model="form.member_bonus_amount" type="text" inputmode="decimal" density="compact"
                variant="outlined" hide-details placeholder="0.00" class="stepper-input" @keydown="blockNonDecimalKeys"
                @paste.prevent="handleDecimalPaste" />
            </div>
          </div>
        </div>
      </div>

      <!-- Payout Settings -->
      <!-- <div class="section-card section-card--green">
        <div class="section-title">
          <div class="section-icon section-icon--green">
            <v-icon size="14" color="#fff">mdi-cash-multiple</v-icon>
          </div>
          <span>{{ t('jackpot.payoutSettings') }}</span>
        </div>

        <div class="section-fields">
          <div class="field-row">
            <div class="field-col">
              <label class="field-label">{{ t('jackpot.payoutPercentLabel') }}</label>
              <v-text-field v-model="form.payout_percent" type="text" inputmode="decimal"
                density="compact" variant="outlined" hide-details placeholder="0.00" class="stepper-input"
                @keydown="blockNonDecimalKeys" @paste.prevent="handleDecimalPaste" />
            </div>

            <div class="field-col">
              <label class="field-label">{{ t('jackpot.fixedPayout') }}</label>
              <v-text-field v-model="form.jackpot_fixed_payout_amount" type="text" inputmode="decimal"
                density="compact" variant="outlined" hide-details placeholder="0.00" class="stepper-input"
                @keydown="blockNonDecimalKeys" @paste.prevent="handleDecimalPaste" />
            </div>
          </div>

          <div class="field-row-single mt-2">
            <div class="field-col">
              <label class="field-label">{{ t('jackpot.minEligibleBetAmount') }}</label>
              <v-text-field v-model="form.min_eligible_bet_amount" type="text" inputmode="decimal"
                density="compact" variant="outlined" hide-details placeholder="0.00" class="stepper-input"
                @keydown="blockNonDecimalKeys" @paste.prevent="handleDecimalPaste" />
            </div>
          </div>
        </div>
      </div> -->
    </div>

    <!-- Footer -->
    <div class="dialog-footer dialog-footer--split">
      <span class="meta-label">{{ t('gameConfig.updatedAt') }} {{ lastUpdatedLabel }}</span>
      <div class="footer-actions">
        <v-btn variant="outlined" color="error" @click="onCancel" :disabled="updateLoading">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn color="create" :loading="updateLoading" @click="onSave">
          {{ t('common.save') }}
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useFrontendI18n } from "~/composables/i18n";
import { formatDecimal } from "~/utils/numberFormat";
import type { JackpotCurrent } from "~/composables/service/jackpotCurrentPoolApi";

export interface JackpotSettingsForm {
  company_topup_amount: string;
  threshold_amount: string;
  member_name: string;
  member_bonus_amount: string;
  chance_denom: string;
  payout_percent: string;
  jackpot_fixed_payout_amount: string;
  min_eligible_bet_amount: string;
}

interface Props {
  poolData: JackpotCurrent | null;
  updateLoading: boolean;
}

interface Emits {
  (e: "submit", form: JackpotSettingsForm): void;
  (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useFrontendI18n();

const form = ref<JackpotSettingsForm>({
  company_topup_amount: "",
  threshold_amount: "",
  member_name: "",
  member_bonus_amount: "",
  chance_denom: "",
  payout_percent: "",
  jackpot_fixed_payout_amount: "",
  min_eligible_bet_amount: "",
});

// ── Helpers ──────────────────────────────────────────────
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

function normalizePercentValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const numericValue = Number.parseFloat(String(value));
  if (Number.isNaN(numericValue)) return "";
  return Number((numericValue * 100).toFixed(10)).toString();
}

function normalizeMemberName(value: string): string {
  return value.replace(/\s+/g, " ").trimStart();
}

function blockNonDecimalKeys(event: KeyboardEvent) {
  const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End", "."];
  if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
  if (!/^\d$/.test(event.key)) event.preventDefault();
  if (event.key === "." && (event.target as HTMLInputElement).value.includes(".")) {
    event.preventDefault();
  }
}

function handleDecimalPaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData("text") || "";
  const el = e.target as HTMLInputElement;
  const next = el.value.slice(0, el.selectionStart ?? 0) + pasted + el.value.slice(el.selectionEnd ?? 0);
  if (!/^\d*\.?\d*$/.test(next)) e.preventDefault();
}

function blockNonIntegerKeys(event: KeyboardEvent) {
  const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
  if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
  if (!/^\d$/.test(event.key)) event.preventDefault();
}

function handleIntegerPaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData("text") || "";
  const el = e.target as HTMLInputElement;
  const next = el.value.slice(0, el.selectionStart ?? 0) + pasted + el.value.slice(el.selectionEnd ?? 0);
  if (!/^\d*$/.test(next)) e.preventDefault();
}

// ── Sync form from incoming poolData ────────────────────
function syncFormFromPool(data: JackpotCurrent | null) {
  if (!data) return;
  form.value = {
    company_topup_amount: "",
    threshold_amount: toAmountString(data.threshold_amount),
    member_name: "",
    member_bonus_amount: "",
    chance_denom: String(data.chance_denom ?? ""),
    payout_percent: normalizePercentValue((data as any).payout_percent),
    jackpot_fixed_payout_amount: toAmountString((data as any).jackpot_fixed_payout_amount),
    min_eligible_bet_amount: toAmountString((data as any).min_eligible_bet_amount),
  };
}

watch(() => props.poolData, (val) => syncFormFromPool(val), { immediate: true });

const winProbability = computed(() => {
  const denom = Number.parseInt(form.value.chance_denom, 10);
  if (!denom || denom <= 0) return "0";
  return (100 / denom).toFixed(4);
});

const lastUpdatedLabel = computed(() => {
  const updatedAt = (props.poolData as any)?.updated_at;
  if (!updatedAt) return "-";
  try {
    return new Date(updatedAt).toLocaleString();
  } catch {
    return "-";
  }
});

// ── Actions ──────────────────────────────────────────────
function onSave() {
  const payoutPercent = parseAmount(form.value.payout_percent);
  if (payoutPercent < 0 || payoutPercent > 100) return;
  emit("submit", { ...form.value });
}

function onCancel() {
  syncFormFromPool(props.poolData);
  emit("cancel");
}
</script>

<style scoped>
.settings-dialog {
  border-radius: 12px !important;
  overflow: hidden;
}

.settings-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white !important;
  color: rgb(var(--v-theme-primary)) !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Header */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15.5px;
  font-weight: 600;
  color: #1f2937;
}

.title-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(124, 58, 237, .25);
}

/* Current Pool Banner */
.current-pool-banner {
  margin: 12px 20px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgb(var(--v-theme-navy)), rgb(var(--v-theme-slate)));
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.banner-label {
  font-size: 16px;
  color: #fff;
  margin-bottom: 4px;
  font-weight: 720;
}

.banner-value {
  font-size: 22px;
  font-weight: 720;
  color: #ffffff;
  letter-spacing: -0.015em;
}

/* Dialog Content */
.dialog-content {
  padding: 0 20px 16px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

/* Section Cards */
.section-card {
  border-radius: 12px;
  padding: 14px 16px;
}

.section-card--blue {
  background: #eef2ff;
  border: 1px solid #e0e7ff;
}

.section-card--purple {
  background: #faf5ff;
  border: 1px solid #f3e8ff;
}

.section-card--green {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
}

.section-card--amber {
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.section-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-icon--blue {
  background: #3b82f6;
}

.section-icon--purple {
  background: #7c3aed;
}

.section-icon--green {
  background: #10b981;
}

.section-icon--amber {
  background: #f59e0b;
}

/* Fields */
.section-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 560px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

.field-row-single {
  display: flex;
  flex-direction: column;
}

.field-col {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
}

/* Input with Stepper */
.input-with-stepper {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border-radius: 10px;
  padding: 5px 6px;
  border: 1px solid #e5e7eb;
}

.input-with-stepper--wide {
  flex-direction: row;
}

.stepper-input {
  flex: 1;
}

.stepper-input :deep(.v-field) {
  box-shadow: none !important;
  border: none !important;
  padding: 0 4px !important;
  min-height: 28px !important;
}

.stepper-input :deep(.v-field__input) {
  padding: 2px 4px !important;
  font-size: 13.5px;
}

/* Chance Input */
.chance-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.chance-prefix {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  white-space: nowrap;
}

/* Probability Info */
.probability-info {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.probability-label {
  color: #9ca3af;
}

.probability-value {
  font-weight: 650;
  color: #7c3aed;
}

/* Footer */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid #f3f4f6;
  /* background: #fafafa; */
}

.footer-meta {
  font-size: 12px;
  color: #9ca3af;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mt-2 {
  margin-top: 8px;
}
</style>