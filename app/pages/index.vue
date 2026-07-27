<script setup lang="ts">
import { useFrontendI18n } from "~/composables/i18n"
import { getDashboard, type DashboardData } from "~/composables/service/dashboardApi"
import { formatDecimal } from "~/utils/numberFormat"

const { t } = useFrontendI18n()

definePageMeta({
    layout: "default",
    navLabel: "Dashboard",
})

const dashData = ref<DashboardData | null>(null)
const pending = ref(true)

onMounted(async () => {
    try {
        const res = await getDashboard()
        const response = res?.data?.value

        if (response?.success) {
            dashData.value = response.data
        }
    } catch (error) {
        console.error("Failed to load dashboard data:", error)
    } finally {
        pending.value = false
    }
})

function formatCoins(val?: string | number): string {
    if (val === undefined || val === null) return "—"

    const n = typeof val === "string" ? Number(val) : val

    if (Number.isNaN(n)) return "—"

    return formatDecimal(n, {
        maximumFractionDigits: 2,
        fallback: "—",
    })
}

function formatCompactCoins(val?: string | number): string {
    if (val === undefined || val === null) return "—"

    const n = typeof val === "string" ? Number(val) : val

    if (Number.isNaN(n)) return "—"

    if (n >= 1_000_000_000) {
        return formatDecimal(n / 1_000_000_000, { maximumFractionDigits: 2 }) + "B"
    }

    if (n >= 1_000_000) {
        return formatDecimal(n / 1_000_000, { maximumFractionDigits: 2 }) + "M"
    }

    if (n >= 1_000) {
        return formatDecimal(n / 1_000, { maximumFractionDigits: 1 }) + "K"
    }

    return formatDecimal(n, {
        maximumFractionDigits: 2,
        fallback: "—",
    })
}

function formatPercent(value: number, maximumFractionDigits: number): string {
    return formatDecimal(value, { maximumFractionDigits })
}

// The longer the formatted number, the smaller the font — keeps big
// totals (e.g. total_turnover) from overflowing the KPI card.
function kpiFontSize(val?: string | number): string {
    const formatted = formatCoins(val)
    const len = formatted.length

    if (len <= 8) return "24px"
    if (len <= 11) return "20px"
    if (len <= 14) return "17px"
    if (len <= 17) return "15px"
    return "13px"
}

const kpis = computed(() => [
    {
        label: t('dashboard.totalTurnover'),
        value: dashData.value?.total_turnover,
        emoji: "💰",
    },
    {
        label: t('dashboard.totalCompanyProfit'),
        value: dashData.value?.global_company_profit,
        emoji: "📈",
    },
    {
        label: t('dashboard.jackpotPool'),
        value: dashData.value?.current_pool_jackpot,
        emoji: "🎰",
    },
    {
        label: "Member Active",
        value: dashData.value?.member_active?.length ?? 0,
        emoji: "👥",
    }
])

const topWinMembers = computed(() => dashData.value?.top_win_members ?? [])

const houseWinRate = computed(() => {
    const turnover = Number(dashData.value?.total_turnover ?? 0)
    const profit = Number(dashData.value?.total_company_profit ?? 0)

    if (!turnover) return 0

    return (profit / turnover) * 100
})

const jackpotPct = computed(() => {
    const pool = Number(dashData.value?.current_pool_jackpot ?? 0)
    const threshold = Number(dashData.value?.threshold_amount ?? 1)

    if (!threshold) return 0

    return Math.min((pool / threshold) * 100, 100)
})

const quickStats = computed(() => {
    const turnover = Number(dashData.value?.total_turnover ?? 0)
    const payout = Number(dashData.value?.total_payout ?? 0)
    const profit = Number(dashData.value?.total_company_profit ?? 0)
    const jackpot = Number(dashData.value?.current_pool_jackpot ?? 0)

    const total = turnover || 1

    return [
        {
            label: t('dashboard.turnover'),
            pct: 100,
            value: formatCompactCoins(turnover),
        },
        {
            label: t('dashboard.payout'),
            pct: Math.round((payout / total) * 100),
            value: formatCompactCoins(payout),
        },
        {
            label: t('dashboard.profit'),
            pct: Math.round((profit / total) * 100),
            value: formatCompactCoins(profit),
        },
        {
            label: t('dashboard.jackpotPool'),
            pct: Math.round((jackpot / total) * 100),
            value: formatCompactCoins(jackpot),
        },
    ]
})
</script>

<template>
    <div class="dashboard gap-3">

        <!-- Header -->
        <div class="dash-header mt-3">
            <div>
                <h1 class="dash-title">{{ t('dashboard.title') }}</h1>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
                <div class="kpi-top">
                    <span class="kpi-emoji">{{ kpi.emoji }}</span>
                </div>
                <div class="kpi-value" :style="{ fontSize: kpiFontSize(kpi.value) }">
                    {{ formatCoins(kpi.value) }}
                </div>
                <div class="kpi-label">{{ kpi.label }}</div>
            </div>
        </div>

        <!-- Middle row -->
        <div class="mid-grid">
            <!-- Quick Stats -->
            <div class="ocean-card">
                <div class="card-header">
                    <div class="card-title">📊 {{ t('dashboard.profitBreakdown') }}</div>
                </div>
                <div class="stats-list">
                    <div v-for="stat in quickStats" :key="stat.label" class="stat-row">
                        <span class="stat-label">{{ stat.label }}</span>
                        <div class="stat-bar-wrap">
                            <div class="stat-bar" :style="{ width: stat.pct + '%' }" />
                        </div>
                        <span class="stat-val">{{ stat.value }}</span>
                    </div>
                </div>
                <!-- <div class="divider-h" />
                <div class="win-rate">
                    <div class="wr-label">{{ t('dashboard.houseWinRate') }}</div>
                    <div class="wr-ring">
                        <svg viewBox="0 0 80 80" class="wr-svg">
                            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(31,41,55,0.12)" stroke-width="7" />
                            <circle cx="40" cy="40" r="32" fill="none" stroke="#0097A7" stroke-width="7"
                                :stroke-dasharray="201" :stroke-dashoffset="201 - (201 * houseWinRate / 100)"
                                stroke-linecap="round" transform="rotate(-90 40 40)" />
                        </svg>
                        <div class="wr-value">{{ formatPercent(houseWinRate, 1) }}%</div>
                    </div>
                </div> -->
            </div>

            <!-- Top Players -->
            <div class="ocean-card">
                <div class="card-header">
                    <div class="card-title">🏆 {{ t('dashboard.topWinMembers') }}</div>
                </div>
                <div v-if="pending" class="loading-state">{{ t('common.loading') }}</div>
                <div v-else-if="topWinMembers.length === 0" class="empty-state">{{ t('common.noData') }}</div>
                <div v-else class="player-list">
                    <div v-for="(player, i) in topWinMembers" :key="player.member_id" class="player-row">
                        <span class="player-rank">{{ i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}` }}</span>
                                <div class="player-avatar-placeholder">
                                    {{ player.username.slice(0, 2).toUpperCase() }}
                                </div>
                                <div class="player-info">
                                    <div class="player-name">{{ player.username }}</div>
                                    <div class="player-games">{{ t('dashboard.wins', { count: player.win_count }) }}
                                    </div>
                                </div>
                                <div class="player-col">
                                    <div class="player-win">+{{ formatCoins(player.total_win_amount) }}</div>
                                    <div class="player-bet">{{ t('dashboard.bet', {
                                        amount:
                                            formatCoins(player.total_bet_amount)
                                    }) }}</div>
                                </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Jackpot Pool -->
        <div class="ocean-card jackpot-card">
            <div class="card-header">
                <div class="card-title">🎰 {{ t('dashboard.jackpotPool') }}</div>
            </div>
            <div class="jackpot-body">
                <div class="jackpot-stat">
                    <div class="jackpot-stat-label">{{ t('dashboard.currentPool') }}</div>
                    <div class="jackpot-stat-value pink">{{ formatCoins(dashData?.current_pool_jackpot) }}</div>
                </div>
                <div class="jackpot-divider" />
                <div class="jackpot-stat">
                    <div class="jackpot-stat-label">{{ t('dashboard.threshold') }}</div>
                    <div class="jackpot-stat-value">{{ formatCoins(dashData?.threshold_amount) }}</div>
                </div>
                <div class="jackpot-divider" />
                <div class="jackpot-progress-wrap">
                    <div class="jackpot-progress-label">
                        <span>{{ t('dashboard.poolProgress') }}</span>
                        <span class="jackpot-pct">{{ formatPercent(jackpotPct, 2) }}%</span>
                    </div>
                    <div class="jackpot-bar-bg">
                        <div class="jackpot-bar-fill" :style="{ width: jackpotPct + '%' }" />
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
/* ═══════════ LAYOUT ═══════════ */
.dashboard {
    display: flex;
    flex-direction: column;
}

.dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
}

.dash-title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: rgb(var(--v-theme-primary)) !important;
}

/* ═══════════ KPI CARDS ═══════════ */
.kpi-grid {
    display: flex;
    flex-wrap: nowrap;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 4px;
}

.kpi-card {
    flex: 1 1 0;
    min-width: 140px;
    padding: 16px;
    border-radius: 14px;
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    transition: transform 0.2s, box-shadow 0.2s;
}

@media (max-width: 1100px) {
    .kpi-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 640px) {
    .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

.kpi-card {
    padding: 16px;
    border-radius: 14px;
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    transition: transform 0.2s, box-shadow 0.2s;
    min-width: 0;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(var(--v-theme-on-surface), 0.1);
}

.kpi-top {
    margin-bottom: 12px;
}

.kpi-emoji {
    font-size: 26px;
}

.kpi-value {
    font-weight: 800;
    color: rgb(var(--v-theme-on-surface));
    letter-spacing: -0.5px;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: font-size 0.15s ease;
}

.kpi-label {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.45);
    margin-top: 6px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ═══════════ GRIDS ═══════════ */
.mid-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 16px;
}

@media (max-width: 800px) {
    .mid-grid {
        grid-template-columns: 1fr;
    }
}

/* ═══════════ OCEAN CARD ═══════════ */
.ocean-card {
    border-radius: 14px;
    padding: 20px;
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.card-title {
    font-size: 14px;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
}

/* ═══════════ STATS ═══════════ */
.stats-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 16px;
}

.stat-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.stat-label {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.55);
    width: 90px;
    flex-shrink: 0;
}

.stat-bar-wrap {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    background: rgba(var(--v-theme-on-surface), 0.08);
}

.stat-bar {
    height: 100%;
    border-radius: 3px;
    background: rgb(var(--v-theme-primary));
    transition: width 0.6s ease;
}

.stat-val {
    font-size: 12px;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
    width: 40px;
    text-align: right;
    flex-shrink: 0;
}

.divider-h {
    height: 1px;
    background: rgba(var(--v-theme-on-surface), 0.08);
    margin: 4px 0 16px;
}

.win-rate {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.wr-label {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.wr-ring {
    position: relative;
    width: 80px;
    height: 80px;
    flex-shrink: 0;
}

.wr-svg {
    width: 80px;
    height: 80px;
}

.wr-value {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 800;
    color: rgb(var(--v-theme-on-surface));
}

/* ═══════════ PLAYERS ═══════════ */
.loading-state,
.empty-state {
    font-size: 13px;
    color: rgba(var(--v-theme-on-surface), 0.4);
    text-align: center;
    padding: 24px 0;
}

.player-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.player-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 9px;
    transition: background 0.2s;
}

.player-row:hover {
    background: rgba(var(--v-theme-on-surface), 0.04);
}

.player-rank {
    font-size: 16px;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
}

.player-avatar-placeholder {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(var(--v-theme-primary), 0.12);
    color: rgb(var(--v-theme-primary));
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.player-info {
    flex: 1;
    min-width: 0;
}

.player-name {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.player-games {
    font-size: 10.5px;
    color: rgba(var(--v-theme-on-surface), 0.4);
}

.player-col {
    text-align: right;
}

.player-win {
    font-size: 13px;
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
}

.player-bet {
    font-size: 10.5px;
    color: rgba(var(--v-theme-on-surface), 0.35);
}

/* ═══════════ JACKPOT ═══════════ */
.jackpot-card {}

.jackpot-body {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
}

.jackpot-stat {
    min-width: 100px;
}

.jackpot-stat-label {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
    font-weight: 500;
    margin-bottom: 4px;
}

.jackpot-stat-value {
    font-size: 22px;
    font-weight: 800;
    color: rgb(var(--v-theme-on-surface));
    letter-spacing: -0.5px;
}

.jackpot-stat-value.pink {
    color: rgb(var(--v-theme-primary));
}

.jackpot-divider {
    width: 1px;
    height: 40px;
    background: rgba(var(--v-theme-on-surface), 0.1);
    flex-shrink: 0;
}

.jackpot-progress-wrap {
    flex: 1;
    min-width: 180px;
}

.jackpot-progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
    margin-bottom: 8px;
}

.jackpot-pct {
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
}

.jackpot-bar-bg {
    height: 8px;
    border-radius: 4px;
    background: rgba(var(--v-theme-primary), 0.12);
    overflow: hidden;
}

.jackpot-bar-fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
    transition: width 0.8s ease;
}
</style>