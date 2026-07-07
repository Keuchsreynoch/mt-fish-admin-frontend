<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="720" persistent>
    <v-card class="jackpot-dialog" elevation="0">
      <!-- Header -->
      <div class="dialog-header">
        <div class="dialog-title">
          <div class="title-icon">
            <v-icon size="16" color="#fff">mdi-crown</v-icon>
          </div>
          <span>Jackpot Settings</span>
        </div>
        <v-btn icon variant="text" size="small" @click="closeDialog">
          <v-icon size="18" color="#9ca3af">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Current Pool Banner -->
      <div class="current-pool-banner">
        <div class="banner-label">Current Pool</div>
        <div class="banner-value">{{ formatAmount(currentAmount) }}</div>
      </div>

      <!-- Scrollable content -->
      <div class="dialog-content">
        <!-- Pool Configuration -->
        <div class="section-card section-card--blue">
          <div class="section-title">
            <div class="section-icon section-icon--blue">
              <v-icon size="14" color="#fff">mdi-cog</v-icon>
            </div>
            <span>Pool Configuration</span>
          </div>

          <div class="section-fields">
            <div class="field-row">
              <div class="field-col">
                <label class="field-label">Company Top-Up</label>
                <v-text-field
                  v-model="localForm.company_topup_amount"
                  type="text"
                  inputmode="decimal"
                  density="compact"
                  variant="outlined"
                  hide-details
                  placeholder=" 0"
                  @keydown="blockNonDecimalKeys"
                  @paste.prevent="handleDecimalPaste"
                />
              </div>

              <div class="field-col">
                <label class="field-label">Threshold</label>
                <div class="input-with-stepper">
                  <v-btn
                    icon
                    size="x-small"
                    variant="outlined"
                    class="stepper-btn stepper-btn--blue"
                    @click="decrementField('threshold_amount')"
                  >
                    <v-icon size="14">mdi-minus</v-icon>
                  </v-btn>
                  <v-text-field
                    v-model="localForm.threshold_amount"
                    type="text"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="0"
                    class="stepper-input"
                    @keydown="blockNonDecimalKeys"
                    @paste.prevent="handleDecimalPaste"
                  />
                  <v-btn
                    icon
                    size="x-small"
                    variant="outlined"
                    class="stepper-btn stepper-btn--blue"
                    @click="incrementField('threshold_amount')"
                  >
                    <v-icon size="14">mdi-plus</v-icon>
                  </v-btn>
                </div>
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
            <span>Win Probability</span>
          </div>

          <div class="section-fields">
            <div class="field-row-single">
              <div class="input-with-stepper input-with-stepper--wide">
                <v-btn
                  icon
                  size="x-small"
                  variant="outlined"
                  class="stepper-btn stepper-btn--purple"
                  @click="decrementField('chance_denom')"
                >
                  <v-icon size="14">mdi-minus</v-icon>
                </v-btn>
                <div class="chance-input-wrapper">
                  <span class="chance-prefix">1 IN</span>
                  <v-text-field
                    v-model="localForm.chance_denom"
                    type="text"
                    inputmode="numeric"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="5,000"
                    class="stepper-input"
                    @keydown="blockNonIntegerKeys"
                    @paste.prevent="handleIntegerPaste"
                  />
                </div>
                <v-btn
                  icon
                  size="x-small"
                  variant="outlined"
                  class="stepper-btn stepper-btn--purple"
                  @click="incrementField('chance_denom')"
                >
                  <v-icon size="14">mdi-plus</v-icon>
                </v-btn>
              </div>
            </div>

            <div class="probability-info">
              <span class="probability-label">Probability:</span>
              <span className="probability-value"> {{ winProbability }}% per spin</span>
            </div>
          </div>
        </div>

        <!-- Payout Settings -->
        <div class="section-card section-card--green">
          <div class="section-title">
            <div class="section-icon section-icon--green">
              <v-icon size="14" color="#fff">mdi-cash-multiple</v-icon>
            </div>
            <span>Payout Settings</span>
          </div>

          <div class="section-fields">
            <div class="field-row">
              <div class="field-col">
                <label class="field-label">Payout Percent</label>
                <div class="input-with-stepper">
                  <v-btn
                    icon
                    size="x-small"
                    variant="outlined"
                    class="stepper-btn stepper-btn--green"
                    @click="decrementField('payout_percent')"
                  >
                    <v-icon size="14">mdi-minus</v-icon>
                  </v-btn>
                  <v-text-field
                    v-model="localForm.payout_percent"
                    type="text"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="0.00"
                    class="stepper-input"
                    @keydown="blockNonDecimalKeys"
                    @paste.prevent="handleDecimalPaste"
                  />
                  <v-btn
                    icon
                    size="x-small"
                    variant="outlined"
                    class="stepper-btn stepper-btn--green"
                    @click="incrementField('payout_percent')"
                  >
                    <v-icon size="14">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>

              <div class="field-col">
                <label class="field-label">Fixed Payout</label>
                <div class="input-with-stepper">
                  <v-btn
                    icon
                    size="x-small"
                    variant="outlined"
                    class="stepper-btn stepper-btn--green"
                    @click="decrementField('jackpot_fixed_payout_amount')"
                  >
                    <v-icon size="14">mdi-minus</v-icon>
                  </v-btn>
                  <v-text-field
                    v-model="localForm.jackpot_fixed_payout_amount"
                    type="text"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="0.00"
                    class="stepper-input"
                    @keydown="blockNonDecimalKeys"
                    @paste.prevent="handleDecimalPaste"
                  />
                  <v-btn
                    icon
                    size="x-small"
                    variant="outlined"
                    class="stepper-btn stepper-btn--green"
                    @click="incrementField('jackpot_fixed_payout_amount')"
                  >
                    <v-icon size="14">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>

            <div class="field-row-single mt-2">
              <div class="field-col" style="max-width: 340px;">
                <label class="field-label">Min Eligible Bet Amount</label>
                <div class="input-with-stepper">
                  <v-btn
                    icon
                    size="x-small"
                    variant="outlined"
                    class="stepper-btn stepper-btn--green"
                    @click="decrementField('min_eligible_bet_amount')"
                  >
                    <v-icon size="14">mdi-minus</v-icon>
                  </v-btn>
                  <v-text-field
                    v-model="localForm.min_eligible_bet_amount"
                    type="text"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="0.00"
                    class="stepper-input"
                    @keydown="blockNonDecimalKeys"
                    @paste.prevent="handleDecimalPaste"
                  />
                  <v-btn
                    icon
                    size="x-small"
                    variant="outlined"
                    class="stepper-btn stepper-btn--green"
                    @click="incrementField('min_eligible_bet_amount')"
                  >
                    <v-icon size="14">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <div class="footer-meta">
          <span class="meta-label">Updated {{ lastUpdatedLabel }}</span>
        </div>
        <div class="footer-actions">
          <v-btn variant="text" color="grey-darken-1" @click="closeDialog" :disabled="updateLoading">
            Cancel
          </v-btn>
          <v-btn
            color="#7c3aed"
            :loading="updateLoading"
            @click="handleSave"
          >
            Save
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";

export interface JackpotCurrent {
  current_amount?: string | number;
  threshold_amount?: string | number;
  chance_denom?: number | string;
  payout_percent?: string | number;
  company_topup_amount?: string | number;
  jackpot_fixed_payout_amount?: string | number;
  min_eligible_bet_amount?: string | number;
  updated_at?: string | null;
}

export interface JackpotSettingsForm {
  threshold_amount: string;
  chance_denom: string;
  payout_percent: string;
  min_eligible_bet_amount: string;
  jackpot_fixed_payout_amount: string;
  company_topup_amount: string;
}

const props = defineProps<{
  modelValue: boolean;
  poolData: JackpotCurrent | null;
  updateLoading?: boolean;
  initialForm?: Partial<JackpotSettingsForm>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", payload: JackpotSettingsForm): void;
  (e: "cancel"): void;
}>();

// local mutable copy – NEVER mutate props directly
const localForm = reactive<JackpotSettingsForm>({
  threshold_amount: "0.00",
  chance_denom: "5000",
  payout_percent: "0.00",
  min_eligible_bet_amount: "0.00",
  jackpot_fixed_payout_amount: "0.00",
  company_topup_amount: "",
});

function syncFromPool(data: JackpotCurrent | null) {
  if (!data) return;
  localForm.threshold_amount = String(data.threshold_amount ?? "0.00");
  localForm.chance_denom = String(data.chance_denom ?? "5000");
  localForm.payout_percent = String(data.payout_percent ?? "0.00");
  localForm.min_eligible_bet_amount = String(data.min_eligible_bet_amount ?? "0.00");
  localForm.jackpot_fixed_payout_amount = String(data.jackpot_fixed_payout_amount ?? "0.00");
  localForm.company_topup_amount = "";
}

// when dialog opens, hydrate local form
watch(() => props.modelValue, (open) => {
  if (open) {
    syncFromPool(props.poolData);
    if (props.initialForm) Object.assign(localForm, props.initialForm);
  }
}, { immediate: true });

// also if pool changes while open
watch(() => props.poolData, (d) => {
  if (props.modelValue) syncFromPool(d);
}, { deep: true });

const currentAmount = computed(() => parseAmount(props.poolData?.current_amount));

const winProbability = computed(() => {
  const denom = Number.parseInt(localForm.chance_denom, 10) || 0;
  if (denom <= 0) return "∞";
  const prob = (1 / denom) * 100;
  return prob < 0.0001 ? prob.toExponential(2) : prob.toFixed(4);
});

const lastUpdatedLabel = computed(() => {
  const v = props.poolData?.updated_at;
  if (!v) return "just now";
  try { return new Date(v).toLocaleTimeString(); } catch { return "just now"; }
});

function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  return Number.parseFloat(String(value)) || 0;
}

function formatAmount(value: string | number | null | undefined): string {
  const amount = parseAmount(value);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function blockNonDecimalKeys(event: KeyboardEvent) {
  const allowed = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End","."];
  if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
  if (!/^\d$/.test(event.key)) event.preventDefault();
  // prevent second dot
  if (event.key === "." && (event.target as HTMLInputElement).value.includes(".")) {
    event.preventDefault();
  }
}
function blockNonIntegerKeys(event: KeyboardEvent) {
  const allowed = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"];
  if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
  if (!/^\d$/.test(event.key)) event.preventDefault();
}
function handleDecimalPaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData("text") || "";
  const el = e.target as HTMLInputElement;
  const next = (el.value.slice(0, el.selectionStart ?? 0) + pasted + el.value.slice(el.selectionEnd ?? 0));
  if (!/^\d*\.?\d*$/.test(next)) e.preventDefault();
}
function handleIntegerPaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData("text") || "";
  if (!/^\d+$/.test(pasted)) e.preventDefault();
}

function incrementField(field: keyof JackpotSettingsForm) {
  const current = Number.parseFloat(localForm[field]) || 0;
  const step = field === "chance_denom" ? 100 : field === "payout_percent" ? 0.1 : 1000;
  const newVal = current + step;
  localForm[field] = field === "chance_denom" ? String(Math.round(newVal)) : newVal.toFixed(2);
}
function decrementField(field: keyof JackpotSettingsForm) {
  const current = Number.parseFloat(localForm[field]) || 0;
  const step = field === "chance_denom" ? 100 : field === "payout_percent" ? 0.1 : 1000;
  const newVal = Math.max(0, current - step);
  localForm[field] = field === "chance_denom" ? String(Math.round(newVal)) : newVal.toFixed(2);
}

function closeDialog() {
  emit("update:modelValue", false);
  emit("cancel");
}
function handleSave() {
  emit("submit", { ...localForm });
  // parent decides when to close (after successful save)
}
</script>

<style scoped>
.jackpot-dialog {
  border-radius: 14px;
  overflow: hidden;
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
  box-shadow: 0 2px 8px rgba(124,58,237,.25);
}

/* Current Pool Banner */
.current-pool-banner {
  margin: 12px 20px;
  padding: 14px 18px;
  background: #0f172a;
  border-radius: 12px;
}

.banner-label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.banner-value {
  font-size: 22px;
  font-weight: 720;
  color: #34d399;
  letter-spacing: -0.015em;
}

/* Dialog Content */
.dialog-content {
  padding: 0 20px 16px;
  max-height: 52vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-content::-webkit-scrollbar { width: 6px; }
.dialog-content::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
.dialog-content::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

/* Section Cards */
.section-card {
  border-radius: 12px;
  padding: 14px 16px;
}
.section-card--blue { background: #eef2ff; border: 1px solid #e0e7ff; }
.section-card--purple { background: #faf5ff; border: 1px solid #f3e8ff; }
.section-card--green { background: #f0fdf4; border: 1px solid #dcfce7; }

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
  width: 22px; height: 22px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
}
.section-icon--blue { background: #3b82f6; }
.section-icon--purple { background: #7c3aed; }
.section-icon--green { background: #10b981; }

/* Fields */
.section-fields { display: flex; flex-direction: column; gap: 10px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 560px){ .field-row{ grid-template-columns: 1fr; } }
.field-row-single { display: flex; flex-direction: column; }
.field-col { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 11px; font-weight: 500; color: #6b7280; }

/* Input with Stepper */
.input-with-stepper {
  display: flex; align-items: center; gap: 6px;
  background: #fff; border-radius: 10px; padding: 5px 6px; border: 1px solid #e5e7eb;
}
.input-with-stepper--wide { flex-direction: row; }

.stepper-btn {
  min-width: 26px !important; width: 26px !important; height: 26px !important; border-radius: 7px !important;
}
.stepper-btn--blue { color: #3b82f6 !important; border-color: #bfdbfe !important; }
.stepper-btn--purple { color: #7c3aed !important; border-color: #e9d5ff !important; }
.stepper-btn--green { color: #10b981 !important; border-color: #a7f3d0 !important; }

.stepper-input { flex: 1; }
.stepper-input :deep(.v-field) {
  box-shadow: none !important; border: none !important; padding: 0 4px !important; min-height: 28px !important;
}
.stepper-input :deep(.v-field__input) { padding: 2px 4px !important; font-size: 13.5px; }

/* Chance Input */
.chance-input-wrapper { display: flex; align-items: center; gap: 8px; flex: 1; }
.chance-prefix { font-size: 12px; font-weight: 700; color: #6b7280; white-space: nowrap; }

/* Probability Info */
.probability-info { margin-top: 8px; font-size: 12px; color: #6b7280; }
.probability-label { color: #9ca3af; }
.probability-value { font-weight: 650; color: #7c3aed; }

/* Footer */
.dialog-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-top: 1px solid #f3f4f6; background: #fafafa;
}
.footer-meta { font-size: 12px; color: #9ca3af; }
.footer-actions { display: flex; align-items: center; gap: 8px; }
.mt-2 { margin-top: 8px; }
</style>
