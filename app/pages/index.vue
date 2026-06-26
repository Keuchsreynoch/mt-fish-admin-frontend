<template>
    <div class="dashboard">

        <!-- Header -->
        <div class="dash-header">
            <div>
                <h1 class="dash-title">Welcome To Admin Dashboard</h1>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
                <div class="kpi-top">
                    <span class="kpi-emoji">{{ kpi.emoji }}</span>
                </div>
                <div class="kpi-value">{{ formatCoins(kpi.value) }}</div>
                <div class="kpi-label">{{ kpi.label }}</div>
            </div>
        </div>

        <!-- Middle row -->
        <div class="mid-grid">
            <!-- Quick Stats -->
            <div class="ocean-card">
                <div class="card-header">
                    <div class="card-title">📊 Profit Breakdown</div>
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
                <div class="divider-h" />
                <div class="win-rate">
                    <div class="wr-label">House Win Rate</div>
                    <div class="wr-ring">
                        <svg viewBox="0 0 80 80" class="wr-svg">
                            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(31,41,55,0.12)" stroke-width="7" />
                            <circle cx="40" cy="40" r="32" fill="none" stroke="#E879B0" stroke-width="7"
                                :stroke-dasharray="201" :stroke-dashoffset="201 - (201 * houseWinRate / 100)"
                                stroke-linecap="round" transform="rotate(-90 40 40)" />
                        </svg>
                        <div class="wr-value">{{ houseWinRate.toFixed(1) }}%</div>
                    </div>
                </div>
            </div>

            <!-- Top Players -->
            <div class="ocean-card">
                <div class="card-header">
                    <div class="card-title">🏆 Top Win Members</div>
                </div>
                <div v-if="pending" class="loading-state">Loading...</div>
                <div v-else-if="topWinMembers.length === 0" class="empty-state">No data</div>
                <div v-else class="player-list">
                    <div v-for="(player, i) in topWinMembers" :key="player.member_id" class="player-row">
                        <span class="player-rank">{{ i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}` }}</span>
                                <div class="player-avatar-placeholder">
                                    {{ player.username.slice(0, 2).toUpperCase() }}
                                </div>
                                <div class="player-info">
                                    <div class="player-name">{{ player.username }}</div>
                                    <div class="player-games">{{ player.win_count }} wins</div>
                                </div>
                                <div class="player-col">
                                    <div class="player-win">+{{ formatCoins(player.total_win_amount) }}</div>
                                    <div class="player-bet">Bet {{ formatCoins(player.total_bet_amount) }}</div>
                                </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Jackpot Pool -->
        <div class="ocean-card jackpot-card">
            <div class="card-header">
                <div class="card-title">🎰 Jackpot Pool</div>
            </div>
            <div class="jackpot-body">
                <div class="jackpot-stat">
                    <div class="jackpot-stat-label">Current Pool</div>
                    <div class="jackpot-stat-value pink">{{ formatCoins(dashData?.current_pool_jackpot) }}</div>
                </div>
                <div class="jackpot-divider" />
                <div class="jackpot-stat">
                    <div class="jackpot-stat-label">Threshold</div>
                    <div class="jackpot-stat-value">{{ formatCoins(dashData?.threshold_amount) }}</div>
                </div>
                <div class="jackpot-divider" />
                <div class="jackpot-progress-wrap">
                    <div class="jackpot-progress-label">
                        <span>Pool Progress</span>
                        <span class="jackpot-pct">{{ jackpotPct.toFixed(2) }}%</span>
                    </div>
                    <div class="jackpot-bar-bg">
                        <div class="jackpot-bar-fill" :style="{ width: jackpotPct + '%' }" />
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { getDashboard, type DashboardData } from "~/composables/service/dashboardApi"

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

    return n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

function formatCompactCoins(val?: string | number): string {
    if (val === undefined || val === null) return "—"

    const n = typeof val === "string" ? Number(val) : val

    if (Number.isNaN(n)) return "—"

    if (n >= 1_000_000_000) {
        return (n / 1_000_000_000).toFixed(2) + "B"
    }

    if (n >= 1_000_000) {
        return (n / 1_000_000).toFixed(2) + "M"
    }

    if (n >= 1_000) {
        return (n / 1_000).toFixed(1) + "K"
    }

    return n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

const kpis = computed(() => [
    {
        label: "Total Turnover",
        value: dashData.value?.total_turnover,
        emoji: "💰",
    },
    {
        label: "Total Payout",
        value: dashData.value?.total_payout,
        emoji: "💸",
    },
    {
        label: "Company Profit",
        value: dashData.value?.total_company_profit,
        emoji: "📈",
    },
    {
        label: "Jackpot Pool",
        value: dashData.value?.current_pool_jackpot,
        emoji: "🎰",
    },
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
            label: "Turnover",
            pct: 100,
            value: formatCompactCoins(turnover),
        },
        {
            label: "Payout",
            pct: Math.round((payout / total) * 100),
            value: formatCompactCoins(payout),
        },
        {
            label: "Profit",
            pct: Math.round((profit / total) * 100),
            value: formatCompactCoins(profit),
        },
        {
            label: "Jackpot Pool",
            pct: Math.round((jackpot / total) * 100),
            value: formatCompactCoins(jackpot),
        },
    ]
})
</script>

<style scoped>
/* ═══════════ LAYOUT ═══════════ */
.dashboard {
    display: flex;
    flex-direction: column;
    gap: 24px;
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
    color: #111827;
}

/* ═══════════ KPI CARDS ═══════════ */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

@media (max-width: 900px) {
    .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 520px) {
    .kpi-grid {
        grid-template-columns: 1fr;
    }
}

.kpi-card {
    padding: 20px;
    border-radius: 14px;
    background: #FFFFFF;
    border: 1px solid rgba(31, 41, 55, 0.12);
    transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(31, 41, 55, 0.1);
}

.kpi-top {
    margin-bottom: 12px;
}

.kpi-emoji {
    font-size: 26px;
}

.kpi-value {
    font-size: 26px;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.5px;
    line-height: 1;
}

.kpi-label {
    font-size: 12px;
    color: rgba(31, 41, 55, 0.45);
    margin-top: 6px;
    font-weight: 500;
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
    background: #FFFFFF;
    border: 1px solid rgba(31, 41, 55, 0.1);
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
    color: #111827;
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
    color: rgba(31, 41, 55, 0.55);
    width: 90px;
    flex-shrink: 0;
}

.stat-bar-wrap {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    background: rgba(31, 41, 55, 0.08);
}

.stat-bar {
    height: 100%;
    border-radius: 3px;
    background: #E879B0;
    transition: width 0.6s ease;
}

.stat-val {
    font-size: 12px;
    font-weight: 700;
    color: #111827;
    width: 40px;
    text-align: right;
    flex-shrink: 0;
}

.divider-h {
    height: 1px;
    background: rgba(31, 41, 55, 0.08);
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
    color: #111827;
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
    color: #111827;
}

/* ═══════════ PLAYERS ═══════════ */
.loading-state,
.empty-state {
    font-size: 13px;
    color: rgba(31, 41, 55, 0.4);
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
    background: rgba(31, 41, 55, 0.04);
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
    background: rgba(232, 121, 176, 0.12);
    color: #993556;
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
    color: #111827;
}

.player-games {
    font-size: 10.5px;
    color: rgba(31, 41, 55, 0.4);
}

.player-col {
    text-align: right;
}

.player-win {
    font-size: 13px;
    font-weight: 700;
    color: #E879B0;
}

.player-bet {
    font-size: 10.5px;
    color: rgba(31, 41, 55, 0.35);
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
    color: rgba(31, 41, 55, 0.45);
    font-weight: 500;
    margin-bottom: 4px;
}

.jackpot-stat-value {
    font-size: 22px;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.5px;
}

.jackpot-stat-value.pink {
    color: #E879B0;
}

.jackpot-divider {
    width: 1px;
    height: 40px;
    background: rgba(31, 41, 55, 0.1);
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
    color: rgba(31, 41, 55, 0.5);
    margin-bottom: 8px;
}

.jackpot-pct {
    font-weight: 700;
    color: #E879B0;
}

.jackpot-bar-bg {
    height: 8px;
    border-radius: 4px;
    background: rgba(232, 121, 176, 0.12);
    overflow: hidden;
}

.jackpot-bar-fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, #E879B0, #993556);
    transition: width 0.8s ease;
}
</style>
