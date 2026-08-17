<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useFrontendI18n } from "~/composables/i18n";
import { formatDecimal } from "~/utils/numberFormat";
import type { JackpotCurrent } from "~/composables/service/jackpotCurrentPoolApi";
import {
  ReservedJackpotStatus,
  type ReservedJackpot,
  type ReserveJackpotPayload,
} from "~/composables/service/reservedJackpotApi";

export interface JackpotSettingsForm {
  threshold_amount: string;
  chance_denom: string;
  payout_percent: string;
  jackpot_fixed_payout_amount: string;
  min_eligible_bet_amount: string;
}

export interface CompanyTopupPayload {
  amount: string;
}

interface Props {
  poolData: JackpotCurrent | null;
  updateLoading: boolean;
  reservedJackpots?: ReservedJackpot[];
  reserveLoading?: boolean;
  togglingId?: number | null;
  topupLoading?: boolean;
}

interface Emits {
  (e: "submit", form: JackpotSettingsForm): void;
  (e: "cancel"): void;
  (e: "reserve", payload: ReserveJackpotPayload): void;
  (e: "toggle-status", item: ReservedJackpot): void;
  (e: "topup", payload: CompanyTopupPayload): void;
}

const props = withDefaults(defineProps<Props>(), {
  reservedJackpots: () => [],
  reserveLoading: false,
  togglingId: null,
  topupLoading: false,
});
const emit = defineEmits<Emits>();
const { t } = useFrontendI18n();

const form = ref<JackpotSettingsForm>({
  threshold_amount: "",
  chance_denom: "",
  payout_percent: "",
  jackpot_fixed_payout_amount: "",
  min_eligible_bet_amount: "",
});

const reserveForm = ref<ReserveJackpotPayload>({
  member_name: "",
  amount: "",
});

//  Inline company top-up (no dialog) 
const topupAmount = ref("");

const canTopup = computed(() => parseAmount(topupAmount.value) > 0);

function onTopup() {
  if (!canTopup.value) return;
  emit("topup", { amount: toAmountString(topupAmount.value) });
  topupAmount.value = "";
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

//  Sync form from incoming poolData 
function syncFormFromPool(data: JackpotCurrent | null) {
  if (!data) return;
  form.value = {
    threshold_amount: toAmountString(data.threshold_amount),
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

//  Reserved Jackpot 
const visibleReservedJackpots = computed(() =>
  (props.reservedJackpots ?? []).filter(
    (item) =>
      item.status_id === ReservedJackpotStatus.Active ||
      item.status_id === ReservedJackpotStatus.Inactive
  )
);

const canReserve = computed(() => {
  const nameOk = reserveForm.value.member_name.trim().length > 0;
  const amountOk = parseAmount(reserveForm.value.amount) > 0;
  return nameOk && amountOk;
});

function onReserve() {
  if (!canReserve.value) return;
  emit("reserve", {
    member_name: reserveForm.value.member_name.trim(),
    amount: toAmountString(reserveForm.value.amount),
  });
  reserveForm.value = { member_name: "", amount: "" };
}

function onToggleStatus(item: ReservedJackpot) {
  emit("toggle-status", item);
}

//  Actions 
function onSave() {
  const payoutPercent = parseAmount(form.value.payout_percent);
  if (payoutPercent < 0 || payoutPercent > 100) return;
  form.value.threshold_amount = toAmountString(form.value.threshold_amount);
  emit("submit", { ...form.value });
}

function onCancel() {
  syncFormFromPool(props.poolData);
  emit("cancel");
}
</script>

<template>
  <v-card class="winner_card jackpot-config-card settings-dialog" elevation="0">
    <div class="dialog-content mt-3">
      <!-- Pool Configuration -->
      <div class="pool-pill-group">
        <div class="pool-pill pool-pill--green pool-pill--current">
          <div class="pool-pill-text">
            <span class="pool-pill-label">{{ t('jackpot.currentAmount') }}</span>
            <span class="pool-pill-value">{{ formatAmount(poolData?.current_amount) }}</span>
          </div>
          <div class="topup-inline">
            <v-text-field v-model="topupAmount" type="text" inputmode="decimal" density="compact" variant="plain"
              hide-details placeholder="0.00" class="pool-pill-input topup-inline-input"
              :title="t('jackpot.companyTopup')" @keydown.enter="onTopup" @keydown="blockNonDecimalKeys"
              @paste.prevent="handleDecimalPaste" />
            <button type="button" class="topup-inline-btn" :title="t('jackpot.companyTopup')"
              :disabled="!canTopup || topupLoading" @click="onTopup">
              <v-icon size="18">mdi-plus-circle</v-icon>
            </button>
          </div>
        </div>

        <div class="pool-pill pool-pill--blue">
          <div class="pool-pill-text">
            <span class="pool-pill-label">{{ t('jackpot.threshold') }}</span>
            <v-text-field v-model="form.threshold_amount" type="text" inputmode="decimal" density="compact"
              variant="plain" hide-details placeholder="0" class="pool-pill-input" @keydown="blockNonDecimalKeys"
              @paste.prevent="handleDecimalPaste" />
          </div>
        </div>

        <div class="pool-pill pool-pill--indigo">
          <div class="pool-pill-text">
            <span class="pool-pill-label">{{ t('jackpot.winChance') }}</span>
            <span class="unit-text">{{ t('common.oneIn') }}</span>
            <v-text-field v-model="form.chance_denom" type="text" inputmode="numeric" density="compact" variant="plain"
              hide-details placeholder="5000" class="pool-pill-input"
              @keydown="blockNonIntegerKeys" @paste.prevent="handleIntegerPaste" />
          </div>
        </div>

        <div class="pool-pill pool-pill--pink">
          <div class="pool-pill-text">
            <span class="pool-pill-label">{{ t('jackpot.payoutPercent') }}</span>
            <v-text-field v-model="form.payout_percent" type="text" inputmode="decimal" density="compact"
              variant="plain" hide-details placeholder="0" class="pool-pill-input"
              @keydown="blockNonDecimalKeys" @paste.prevent="handleDecimalPaste" />
            <span class="unit-text">%</span>
          </div>
        </div>
        <div class="pool-pill pool-pill--purple">
          <div class="pool-pill-text">
            <span class="pool-pill-label">{{ t('jackpot.fixedPayout') }}</span>
            <v-text-field v-model="form.jackpot_fixed_payout_amount" type="text" inputmode="decimal" density="compact"
              variant="plain" hide-details placeholder="0" class="pool-pill-input" @keydown="blockNonDecimalKeys"
              @paste.prevent="handleDecimalPaste" />
          </div>
        </div>

        <button type="button" class="pool-pill pool-pill--save" :disabled="updateLoading" @click="onSave">
          <v-icon size="20">mdi-content-save-outline</v-icon>
          <span class="pool-pill-save-text">{{ t('common.save') }}</span>
        </button>
      </div>

      <!-- Reserved Jackpot -->
      <div class="section-card section-card--amber">
        <div class="section-title">
          <div class="section-icon section-icon--amber">
            <v-icon size="14" color="#fff">mdi-treasure-chest</v-icon>
          </div>
          <span>{{ t('jackpot.reservedJackpot') }}</span>
        </div>

        <div class="section-fields">
          <div class="field-row">
            <div class="field-col">
              <label class="field-label">{{ t('members.member') }}</label>
              <v-text-field :model-value="reserveForm.member_name" type="text" density="compact" variant="outlined"
                hide-details :placeholder="t('common.memberNamePlaceholder')" class="stepper-input"
                @update:model-value="reserveForm.member_name = normalizeMemberName($event)" />
            </div>

            <div class="field-col">
              <label class="field-label">{{ t('jackpot.amount') }}</label>
              <v-text-field v-model="reserveForm.amount" type="text" inputmode="decimal" density="compact"
                variant="outlined" hide-details placeholder="0.00" class="stepper-input" @keydown="blockNonDecimalKeys"
                @paste.prevent="handleDecimalPaste" />
            </div>
          </div>

          <div class="reserve-action">
            <v-btn color="create" size="small" :loading="reserveLoading" :disabled="!canReserve" @click="onReserve">
              {{ t('common.save') }}
            </v-btn>
          </div>

          <!-- Reserved jackpot chips (Active / Inactive only, Claimed hidden) -->
          <div v-if="visibleReservedJackpots.length" class="reserved-chip-list">
            <div v-for="item in visibleReservedJackpots" :key="item.id" class="reserved-chip"
              :class="{ 'reserved-chip--inactive': item.status_id === ReservedJackpotStatus.Inactive }">
              <div class="chip-icon">
                <v-icon size="12" color="#fff">mdi-treasure-chest</v-icon>
              </div>
              <span class="chip-id">ID: {{ item.member_name }}</span>
              <span class="chip-amount">
                <v-icon size="11" color="#16a34a">mdi-cash-multiple</v-icon>
                {{ formatAmount(item.amount) }}
              </span>

              <button v-if="item.status_id === ReservedJackpotStatus.Active" type="button"
                class="chip-action chip-action--inactive" :disabled="togglingId === item.id"
                @click="onToggleStatus(item)">
                <v-icon size="12">mdi-pause-circle-outline</v-icon>
              </button>
              <button v-else-if="item.status_id === ReservedJackpotStatus.Inactive" type="button"
                class="chip-action chip-action--reactivate" :disabled="togglingId === item.id"
                @click="onToggleStatus(item)">
                <v-icon size="12">mdi-refresh</v-icon>
              </button>
            </div>
          </div>
          <div v-else class="reserved-empty">
            {{ t('jackpot.noActiveReservations') }}
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.settings-dialog {
  border-radius: 12px !important;
  overflow: hidden;
}

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

/* ── Pool Configuration — bordered badge/pill style ── */
.pool-pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.pool-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1.5px solid transparent;
  border-radius: 10px;
  padding: 12px;
  box-shadow: none;
  flex: 0 0 auto;
  width: auto;
  transition: border-color .18s ease, transform .18s ease;
}

.pool-pill :deep(.v-icon) {
  flex-shrink: 0;
}

.pool-pill-text {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pool-pill--current {
  position: relative;
  justify-content: space-between;
  flex-wrap: wrap;
}

.topup-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding-left: 8px;
  border-left: 1px dashed #bbf7d0;
}

.topup-inline-input {
  max-width: 80px;
}

.topup-inline-input :deep(input) {
  text-align: right;
}

.topup-inline-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #16a34a;
  padding: 2px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background .15s ease, transform .15s ease;
}

.topup-inline-btn:hover:not(:disabled) {
  background: rgba(22, 163, 74, .12);
  transform: scale(1.05);
}

.topup-inline-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pool-pill-label {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.pool-pill-value {
  font-size: 14.5px;
  font-weight: 500;
}

.pool-pill--green {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.pool-pill--green :deep(.v-icon) {
  color: #16a34a;
}

.pool-pill--green .pool-pill-label {
  color: #16a34a;
}

.pool-pill--green .pool-pill-value {
  color: #15803d;
}

.pool-pill--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.pool-pill--blue :deep(.v-icon) {
  color: #2563eb;
}

.pool-pill--blue .pool-pill-label {
  color: #2563eb;
}

.pool-pill--indigo {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.pool-pill--indigo :deep(.v-icon) {
  color: #4f46e5;
}

.pool-pill--indigo .pool-pill-label {
  color: #4f46e5;
}

.pool-pill--pink {
  background: #fdf2f8;
  border-color: #fbcfe8;
}

.pool-pill--pink :deep(.v-icon) {
  color: #db2777;
}

.pool-pill--pink .pool-pill-label {
  color: #db2777;
}

.pool-pill--purple {
  background: #faf5ff;
  border-color: #e9d5ff;
}

.pool-pill--purple :deep(.v-icon) {
  color: #7c3aed;
}

.pool-pill--purple .pool-pill-label {
  color: #7c3aed;
}

.unit-text {
  font-size: 12.5px;
  font-weight: 600;
  color: currentColor;
  opacity: 0.7;
  white-space: nowrap;
  line-height: 1;
}

.pool-pill-input {
  margin: 0;
  flex: 0 1 auto;
  width: auto;
  min-width: 0;
}

.pool-pill-input :deep(.v-field) {
  display: inline-flex;
  width: auto;
  box-shadow: none !important;
  padding: 0 !important;
  min-height: 20px !important;
  background: transparent !important;
}

.pool-pill-input :deep(.v-field__field) {
  display: inline-flex;
  width: auto;
}

.pool-pill-input :deep(.v-field__input) {
  padding: 0 !important;
  font-size: 14.5px;
  font-weight: 600;
  min-height: 20px;
  width: auto;
  flex: 0 0 auto;
}

.pool-pill-input :deep(input) {
  /* Grow/shrink to fit whatever is typed, instead of filling the pill */
  field-sizing: content;
  min-width: 2ch;
  max-width: 100%;
  width: auto;
}

.pool-pill--save {
  cursor: pointer;
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}

.pool-pill--save :deep(.v-icon) {
  color: #fff;
}

.pool-pill-save-text {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.pool-pill--save:hover {
  filter: brightness(1.05);
}

.pool-pill--save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.section-card {
  border-radius: 12px;
  padding: 14px 16px;
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

.section-icon--amber {
  background: #f59e0b;
}

.section-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

@media (max-width: 560px) {
  .field-row {
    grid-template-columns: 1fr;
  }
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

.reserve-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

.reserved-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.reserved-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 10px;
  background: #ffffff;
  border: 1px dashed #fbbf24;
  border-radius: 999px;
  font-size: 12px;
}

.reserved-chip--inactive {
  opacity: 0.6;
  border-style: solid;
  border-color: #d1d5db;
}

.chip-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chip-id {
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.chip-amount {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #dcfce7;
  color: #16a34a;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.chip-action {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.chip-action--inactive {
  background: #fee2e2;
  color: #dc2626;
}

.chip-action--reactivate {
  background: #dbeafe;
  color: #2563eb;
}

.chip-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reserved-empty {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}
</style>