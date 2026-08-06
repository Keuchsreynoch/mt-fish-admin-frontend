<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useFrontendI18n } from "~/composables/i18n";
import { formatDecimal } from "~/utils/numberFormat";
import type { JackpotCurrent } from "~/composables/service/jackpotCurrentPoolApi";
import {
  ReservedJackpotStatus,
  type ReservedJackpot,
  type ReserveJackpotPayload,
} from "~/composables/service/reservedJackpotApi";

export interface JackpotSettingsForm {
  company_topup_amount: string;
  threshold_amount: string;
  chance_denom: string;
  payout_percent: string;
  jackpot_fixed_payout_amount: string;
  min_eligible_bet_amount: string;
}

interface Props {
  poolData: JackpotCurrent | null;
  updateLoading: boolean;
  reservedJackpots?: ReservedJackpot[];
  reserveLoading?: boolean;
  togglingId?: number | null;
}

interface Emits {
  (e: "submit", form: JackpotSettingsForm): void;
  (e: "cancel"): void;
  (e: "reserve", payload: ReserveJackpotPayload): void;
  (e: "toggle-status", item: ReservedJackpot): void;
}

const props = withDefaults(defineProps<Props>(), {
  reservedJackpots: () => [],
  reserveLoading: false,
  togglingId: null,
});
const emit = defineEmits<Emits>();
const { t } = useFrontendI18n();

const form = ref<JackpotSettingsForm>({
  company_topup_amount: "",
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

// Inline threshold editing 
const thresholdEditing = ref(false);
const thresholdInputRef = ref<HTMLInputElement | null>(null);

async function startEditThreshold() {
  thresholdEditing.value = true;
  await nextTick();
  thresholdInputRef.value?.focus();
  thresholdInputRef.value?.select();
}

function focusThreshold() {
  if (!thresholdEditing.value) startEditThreshold();
}

function stopEditThreshold() {
  thresholdEditing.value = false;
  form.value.threshold_amount = toAmountString(form.value.threshold_amount);
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

// ── Sync form from incoming poolData ────────────────────
function syncFormFromPool(data: JackpotCurrent | null) {
  if (!data) return;
  form.value = {
    company_topup_amount: "",
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

const lastUpdatedLabel = computed(() => {
  const updatedAt = (props.poolData as any)?.updated_at;
  if (!updatedAt) return "-";
  try {
    return new Date(updatedAt).toLocaleString();
  } catch {
    return "-";
  }
});

// ── Reserved Jackpot ─────────────────────────────────────
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

// ── Actions ──────────────────────────────────────────────
function onSave() {
  const payoutPercent = parseAmount(form.value.payout_percent);
  if (payoutPercent < 0 || payoutPercent > 100) return;
  emit("submit", { ...form.value });
}

function onCancel() {
  syncFormFromPool(props.poolData);
  thresholdEditing.value = false;
  emit("cancel");
}
</script>

<template>
  <v-card class="winner_card jackpot-config-card setti Let me findngs-dialog" elevation="0">
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
      <div class="banner-stat">
        <div class="banner-label">{{ t('jackpot.currentAmount') }}</div>
        <div class="banner-value">{{ formatAmount(poolData?.current_amount) }}</div>
      </div>

      <div class="banner-divider" />

      <div class="banner-stat">
        <div class="banner-label banner-label--editable" @click="focusThreshold">
          {{ t('jackpot.threshold') }}
          <v-icon size="11" class="edit-pencil">mdi-pencil</v-icon>
        </div>

        <div class="banner-edit-wrapper" :class="{ 'is-editing': thresholdEditing }">
          <span v-if="!thresholdEditing" class="banner-value banner-value--editable" @click="startEditThreshold">
            {{ formatAmount(form.threshold_amount) }}
          </span>
          <input v-else ref="thresholdInputRef" v-model="form.threshold_amount" type="text" inputmode="decimal"
            class="banner-inline-input" @keydown="blockNonDecimalKeys" @paste.prevent="handleDecimalPaste"
            @blur="stopEditThreshold" @keydown.enter="stopEditThreshold" />
        </div>
      </div>
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
              <label class="field-label">{{ t('jackpot.winChance') }}</label>
              <div class="chance-input-wrapper">
                <span class="chance-prefix">{{ t('common.oneIn') }}</span>
                <v-text-field v-model="form.chance_denom" type="text" inputmode="numeric" density="compact"
                  variant="outlined" hide-details placeholder="5,000" class="stepper-input"
                  @keydown="blockNonIntegerKeys" @paste.prevent="handleIntegerPaste" />
              </div>
            </div>
          </div>

          <!-- <div class="probability-info">
            <span class="probability-label">{{ t('jackpot.winChance') }}:</span>
            <span class="probability-value">{{ winProbability }}% {{ t('common.perSpin') }}</span>
          </div> -->
        </div>
        <div class="dialog-footer">
          <div class="footer-actions">
            <!-- <v-btn variant="outlined" color="error" @click="onCancel" :disabled="updateLoading">
              {{ t('common.cancel') }}
            </v-btn> -->
            <v-btn color="create" :loading="updateLoading" @click="onSave">
              {{ t('common.save') }}
            </v-btn>
          </div>
        </div>
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
              <!-- {{ t('jackpot.addReservation') }} -->
              {{ t('common.save') }}
            </v-btn>

            <!-- <v-btn color="create" size="small" :loading="reserveLoading" :disabled="!canReserve">
              {{ t('common.save') }}
            </v-btn> -->
          </div>

          <!-- Reserved jackpot chips (Active / Inactive only, Claimed hidden) -->
          <div v-if="visibleReservedJackpots.length" class="reserved-chip-list">
            <div v-for="item in visibleReservedJackpots" :key="item.id" class="reserved-chip"
              :class="{ 'reserved-chip--inactive': item.status_id === ReservedJackpotStatus.Inactive }">
              <div class="chip-icon">
                <v-icon size="12" color="#fff">mdi-treasure-chest</v-icon>
              </div>
              <span class="chip-id">ID: {{ item.member_name }}</span> <span class="chip-amount">
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

    <!-- Footer -->
    <!-- <div class="dialog-footer dialog-footer--split">
      <div class="footer-actions">
        <v-btn variant="outlined" color="error" @click="onCancel" :disabled="updateLoading">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn color="create" :loading="updateLoading" @click="onSave">
          {{ t('common.save') }}
        </v-btn>
      </div>
    </div> -->
  </v-card>
</template>

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

.current-pool-banner {
  margin: 12px 20px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgb(var(--v-theme-navy)), rgb(var(--v-theme-slate)));
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
  display: flex;
  align-items: center;
}

.banner-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.banner-divider {
  width: 1px;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.25);
  margin: 0 16px;
}

.banner-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 4px;
  font-weight: 620;
}

.banner-label--editable {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  width: fit-content;
}

.edit-pencil {
  opacity: 0.65;
}

.banner-value {
  font-size: 20px;
  font-weight: 720;
  color: #ffffff;
  letter-spacing: -0.015em;
}

.banner-value--editable {
  cursor: text;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.4);
  padding-bottom: 1px;
}

.banner-value--editable:hover {
  border-bottom-color: rgba(255, 255, 255, 0.8);
}

.banner-edit-wrapper {
  display: flex;
  align-items: center;
}

.banner-inline-input {
  width: 100%;
  max-width: 140px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 20px;
  font-weight: 720;
  color: #ffffff;
  letter-spacing: -0.015em;
  outline: none;
}

.banner-inline-input:focus {
  border-color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
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
  gap: 5px;
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

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: end;
  padding: 14px 0px;
  border-top: 1px solid #f3f4f6;
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
.player-tabs :deep(.v-slide-group__prev),
.player-tabs :deep(.v-slide-group__next) {
  display: none !important;
}
</style>