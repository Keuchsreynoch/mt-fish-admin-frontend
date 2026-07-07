<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="1040" scrollable persistent>
    <v-card class="funding-dialog" elevation="0">
      <!-- Header -->
      <div class="funding-header">
        <div class="funding-header-left">
          <div class="funding-icon">
            <v-icon size="16" color="#6ee7b7">mdi-wallet-plus-outline</v-icon>
          </div>
          <div>
            <div class="funding-title">Pool Funding Center</div>
            <div class="funding-subtitle">Company Top-up & Member Bonus</div>
          </div>
        </div>
        <div class="funding-header-right">
          <v-btn color="#7c3aed" variant="flat" size="small" class="mr-2" @click="openCreateBonus">
            <v-icon size="14" start>mdi-gift-outline</v-icon>
            Create Member Bonus
          </v-btn>
          <v-btn icon variant="text" size="small" @click="closeDialog">
            <v-icon size="18" color="#9ca3af">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Content grid matches your <v-row dense class="content-grid"> -->
      <div class="funding-body">
        <v-row dense class="content-grid">
          <!-- Company Top-up -->
          <v-col cols="12" lg="5">
            <v-card class="panel-card" elevation="0">
              <div class="panel-header">
                <div>
                  <h2>Company Top-up</h2>
                  <p>Add more balance to the live jackpot pool.</p>
                </div>
                <v-icon size="22" color="var(--pool-accent,#0d9488)">mdi-cash-plus</v-icon>
              </div>

              <v-divider class="panel-divider" />

              <div class="panel-body">
                <div class="field-group">
                  <label class="field-label">Amount</label>
                  <v-text-field
                    v-model="localTopup.amount"
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    placeholder="50000"
                    density="compact"
                    variant="outlined"
                    hide-details="auto"
                    @keydown="blockNonDecimalKeys"
                    @paste.prevent="handleDecimalPaste"
                  />
                </div>

                <div class="field-group">
                  <label class="field-label">Note</label>
                  <v-text-field
                    v-model="localTopup.note"
                    placeholder="Optional note"
                    density="compact"
                    variant="outlined"
                    hide-details="auto"
                  />
                </div>

                <div class="mini-stats">
                  <div class="mini-stat">
                    <span class="mini-stat__label">Before</span>
                    <strong>{{ formatAmount(currentAmount) }}</strong>
                  </div>
                  <div class="mini-stat mini-stat--after">
                    <span class="mini-stat__label">After</span>
                    <strong>{{ formatAmount(predictedAmount) }}</strong>
                  </div>
                </div>
              </div>

              <v-divider class="panel-divider" />

              <div class="panel-actions">
                <v-btn class="primary-action" color="primary" :loading="topupLoading" @click="submitTopup" block>
                  Add Top-up
                </v-btn>
              </div>
            </v-card>
          </v-col>

          <!-- Jackpot Settings quick view -->
          <v-col cols="12" lg="7">
            <v-card class="panel-card" elevation="0">
              <div class="panel-header">
                <div>
                  <h2>Jackpot Settings</h2>
                  <p>Update the active pool configuration.</p>
                </div>
                <v-icon size="22" color="var(--pool-accent,#6366f1)">mdi-cog-outline</v-icon>
              </div>

              <v-divider class="panel-divider" />

              <div class="panel-body settings-grid">
                <div class="field-group">
                  <label class="field-label">Threshold Amount</label>
                  <v-text-field :model-value="display.threshold_amount" readonly density="compact" variant="outlined" hide-details />
                </div>

                <div class="field-group">
                  <label class="field-label">Chance Denominator</label>
                  <v-text-field :model-value="display.chance_denom" readonly density="compact" variant="outlined" hide-details />
                </div>

                <div class="field-group">
                  <label class="field-label">Payout Percent</label>
                  <v-text-field :model-value="display.payout_percent" readonly density="compact" variant="outlined" hide-details />
                </div>

                <div class="field-group">
                  <label class="field-label">Min Eligible Bet Amount</label>
                  <v-text-field :model-value="display.min_eligible_bet_amount" readonly density="compact" variant="outlined" hide-details />
                </div>

                <div class="field-group">
                  <label class="field-label">Jackpot Fixed Payout Amount</label>
                  <v-text-field :model-value="display.jackpot_fixed_payout_amount" readonly density="compact" variant="outlined" hide-details />
                </div>

                <div class="field-group field-group--readonly">
                  <label class="field-label">Current Pool Progress</label>
                  <div class="progress-meta">
                    <span>{{ poolProgress.toFixed(1) }}%</span>
                    <span>{{ formatAmount(currentAmount) }} / {{ formatAmount(thresholdAmount) }}</span>
                  </div>
                  <v-progress-linear :model-value="poolProgress" height="10" rounded color="primary" bg-color="rgba(15, 23, 42, 0.08)" />
                </div>
              </div>

              <v-divider class="panel-divider" />

              <div class="panel-actions panel-actions--split">
                <div class="panel-meta">
                  <span>Top-up total: {{ formatAmount(companyTopupTotal) }}</span>
                  <span>Fixed payout: {{ formatAmount(fixedPayout) }}</span>
                </div>

                <div class="flex gap-2">
                  <v-btn variant="outlined" color="deep-purple" @click="openCreateBonus" size="small">
                    <v-icon size="14" start>mdi-gift-outline</v-icon>
                    Member Bonus
                  </v-btn>
                  <v-btn color="#0f172a" variant="flat" @click="closeDialog">
                    Done
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <div class="funding-footer">
        <span><v-icon size="13" color="#10b981" class="mr-1">mdi-trending-up</v-icon> Live pool sync enabled</span>
        <span> • Jackpot Engine v2.14.7</span>
      </div>
    </v-card>

    <!-- Nested Create Member Bonus Dialog -->
    <v-dialog v-model="createDialog" max-width="560" persistent>
      <v-card class="create-dialog-card">
        <div class="dialog-header">
          <div class="dialog-title-row">
            <v-icon size="20" color="rgb(var(--v-theme-primary))">mdi-cash-plus</v-icon>
            <h2>Create Member Bonus</h2>
          </div>
          <v-btn icon size="small" variant="text" @click="closeCreateDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group half">
              <label class="form-label">Member ID <span class="required">*</span></label>
              <v-text-field
                v-model="createForm.member_id"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                placeholder="1"
                @keydown="blockNonIntegerKeys"
                @paste.prevent="handleIntegerPaste"
              />
            </div>

            <div class="form-group half">
              <label class="form-label">Amount <span class="required">*</span></label>
              <v-text-field
                v-model="createForm.amount"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                density="compact"
                variant="outlined"
                hide-details="auto"
                placeholder="15000"
                @keydown="blockNonDecimalKeys"
                @paste.prevent="handleDecimalPaste"
              />
            </div>

            <div class="form-group full">
              <label class="form-label">Note</label>
              <v-text-field
                v-model="createForm.note"
                density="compact"
                variant="outlined"
                hide-details="auto"
                placeholder="Optional note"
              />
            </div>
          </div>
        </div>

        <v-divider />

        <div class="dialog-actions">
          <v-btn variant="outlined" @click="closeCreateDialog" :disabled="createLoading">Cancel</v-btn>
          <v-btn color="primary" :loading="createLoading" @click="submitCreateBonus">
            Create Bonus
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";

interface Props {
  modelValue: boolean;
  currentAmount: number;
  thresholdAmount: number;
  companyTopupTotal: number;
  fixedPayout: number;
  poolData?: any;
  topupLoading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  topupLoading: false,
});
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "topup", payload: { amount: string; note: string }): void;
  (e: "create-bonus", payload: { member_id: string; amount: string; note: string }): void;
}>();

const localTopup = reactive({ amount: "", note: "" });
watch(() => props.modelValue, open => { if(open){ localTopup.amount=""; localTopup.note=""; }});

const predictedAmount = computed(() => {
  const add = parseFloat(localTopup.amount) || 0;
  return props.currentAmount + add;
});
const poolProgress = computed(() => {
  if (props.thresholdAmount <= 0) return 0;
  return Math.min(100, (props.currentAmount / props.thresholdAmount) * 100);
});

const display = computed(() => ({
  threshold_amount: formatAmount(props.poolData?.threshold_amount),
  chance_denom: `1 in ${props.poolData?.chance_denom ?? 0}`,
  payout_percent: `${formatAmount(props.poolData?.payout_percent)}%`,
  min_eligible_bet_amount: formatAmount(props.poolData?.min_eligible_bet_amount) + " KHR",
  jackpot_fixed_payout_amount: formatAmount(props.fixedPayout) + " KHR",
}));

function formatAmount(v:any){ const n = Number.parseFloat(String(v ?? 0))||0; return new Intl.NumberFormat("en-US",{minimumFractionDigits:2, maximumFractionDigits:2}).format(n); }

function blockNonDecimalKeys(e: KeyboardEvent){
  const ok = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End","."];
  if (ok.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
  if (e.key==="." && (e.target as HTMLInputElement).value.includes(".")) e.preventDefault();
}
function blockNonIntegerKeys(e: KeyboardEvent){
  const ok = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"];
  if (ok.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}
function handleDecimalPaste(e: ClipboardEvent){
  const t = e.clipboardData?.getData("text") || "";
  if (!/^\d*\.?\d*$/.test(t)) e.preventDefault();
}
function handleIntegerPaste(e: ClipboardEvent){
  const t = e.clipboardData?.getData("text") || "";
  if (!/^\d+$/.test(t)) e.preventDefault();
}

function submitTopup(){
  emit("topup", { ...localTopup });
}
function closeDialog(){ emit("update:modelValue", false); }

/* Create Member Bonus nested */
const createDialog = ref(false);
const createLoading = ref(false);
const createForm = reactive({ member_id:"", amount:"", note:"" });

function openCreateBonus(){ createDialog.value = true; }
function closeCreateDialog(){ if(!createLoading.value) createDialog.value=false; }

async function submitCreateBonus(){
  if (!createForm.member_id.trim() || !(parseFloat(createForm.amount)>0)) return;
  createLoading.value = true;
  try {
    emit("create-bonus", { ...createForm });
    // parent should close - we optimistically close
    createDialog.value = false;
    createForm.member_id=""; createForm.amount=""; createForm.note="";
  } finally {
    createLoading.value = false;
  }
}
</script>

<style scoped>
.funding-dialog { border-radius: 18px; overflow:hidden; background:#f7f8fb; }
.funding-header { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; background:#fff; border-bottom:1px solid #e5e7eb; }
.funding-header-left{ display:flex; align-items:center; gap:12px; }
.funding-icon{ width:36px; height:36px; border-radius:10px; background:#0f172a; display:flex; align-items:center; justify-content:center; }
.funding-title{ font-size:16px; font-weight:640; color:#111827; }
.funding-subtitle{ font-size:12.5px; color:#6b7280; margin-top:1px; }
.funding-header-right{ display:flex; align-items:center; }

.funding-body{ padding:20px 22px; }
.content-grid{ --pool-accent:#0d9488; }

.panel-card{ border:1px solid #e5e7eb; border-radius:14px; background:#fff; height:100%; display:flex; flex-direction:column; }
.panel-header{ padding:18px 18px 12px; display:flex; align-items:flex-start; justify-content:space-between; }
.panel-header h2{ font-size:15.5px; font-weight:640; color:#111827; margin:0; }
.panel-header p{ font-size:12.5px; color:#6b7280; margin:4px 0 0; }
.panel-divider{ opacity:.7; }
.panel-body{ padding:16px 18px; flex:1; }
.settings-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:640px){ .settings-grid{ grid-template-columns:1fr; } }
.field-group{ display:flex; flex-direction:column; gap:6px; }
.field-label{ font-size:11.5px; font-weight:550; color:#4b5563; }
.mini-stats{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px; }
.mini-stat{ border:1px solid #e5e7eb; background:#f9fafb; border-radius:10px; padding:12px; }
.mini-stat--after{ background:#ecfdf5; border-color:#a7f3d0; }
.mini-stat__label{ display:block; font-size:10.5px; text-transform:uppercase; letter-spacing:.04em; font-weight:650; color:#6b7280; margin-bottom:4px; }
.mini-stat strong{ font-size:15px; color:#111827; }
.mini-stat--after strong{ color:#047857; }
.progress-meta{ display:flex; justify-content:space-between; font-size:11.5px; color:#4b5563; margin-bottom:6px; font-weight:500; }
.panel-actions{ padding:14px 18px; }
.panel-actions--split{ display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
.panel-meta{ font-size:11.5px; color:#6b7280; display:flex; gap:18px; flex-wrap:wrap; }
.panel-meta span strong, .panel-meta{ /* */ }
.primary-action{ text-transform:none !important; font-weight:600 !important; }

.funding-footer{ padding:12px 22px; background:#fff; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:11.5px; color:#6b7280; }

/* Create Bonus dialog */
.create-dialog-card{ border-radius:16px; overflow:hidden; }
.dialog-header{ display:flex; align-items:center; justify-content:space-between; padding:14px 18px; }
.dialog-title-row{ display:flex; align-items:center; gap:10px; }
.dialog-title-row h2{ font-size:15.5px; font-weight:620; margin:0; color:#111827; }
.dialog-body{ padding:18px; }
.form-grid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.form-group.full{ grid-column:1 / -1; }
.form-group.half{ }
@media (max-width:560px){ .form-grid{ grid-template-columns:1fr; } }
.form-label{ font-size:11.5px; font-weight:550; color:#4b5563; display:block; margin-bottom:6px; }
.required{ color:#ef4444; }
.dialog-actions{ display:flex; justify-content:flex-end; gap:8px; padding:13px 18px; background:#f9fafb; }
</style>
