<!-- layouts/default.vue -->
<template>
    <v-app theme="slateLight">

        <!-- Background -->
        <div class="omagi-bg" aria-hidden="true" />

        <!-- ───────── Sidebar ───────── -->
        <v-navigation-drawer v-model="drawer" :permanent="!isMobile" :temporary="isMobile" :rail="collapsed"
            :width="252" :rail-width="64" :order="0" elevation="0"  class="omagi-sidebar">
            <div class="sidebar-layout">

                <!-- Scrollable top area -->
                <div class="sidebar-scroll">

                    <!-- Brand -->
                    <div class="brand-area" :class="{ 'brand-area--collapsed': collapsed }">
                        <div class="brand-logo"></div>
                        <template v-if="!collapsed">
                            <div class="brand-text">
                                <div class="brand-name">FishBlast</div>
                                <div class="brand-sub">Admin Console</div>
                            </div>
                        </template>
                        <!-- Collapse toggle -->
                        <v-btn :icon="collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'" variant="text"
                            size="x-small" class="collapse-toggle-btn" @click="toggleCollapse" />
                    </div>

                    <!-- Main nav (from API menus) -->
                    <div class="nav-section">
                        <div v-if="!collapsed" class="nav-label">OPERATIONS</div>

                        <template v-for="item in mainNav" :key="item.menu_uuid">

                            <!-- Item HAS children → toggle -->
                            <div v-if="item.children && item.children.length" class="nav-item" :class="[
                                { 'nav-item--active': route.path.startsWith(item.to) },
                                { 'nav-item--collapsed': collapsed }
                            ]" @click="toggleMenu(item.menu_uuid)">
                                <div class="nav-icon-wrap">
                                    <v-icon size="20">{{ item.icon }}</v-icon>
                                    <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
                                </div>
                                <template v-if="!collapsed">
                                    <div class="nav-info">
                                        <span class="nav-title">{{ item.title }}</span>
                                    </div>
                                    <v-icon size="16" style="margin-left:auto"
                                        :style="openMenus.has(item.menu_uuid) ? 'transform:rotate(180deg)' : ''">
                                        mdi-chevron-down
                                    </v-icon>
                                </template>
                            </div>

                            <!-- Children -->
                            <div v-if="item.children && item.children.length && !collapsed && openMenus.has(item.menu_uuid)"
                                class="nav-children">
                                <NuxtLink v-for="child in item.children" :key="child.menu_uuid" :to="child.to" custom
                                    v-slot="{ navigate, isActive }">
                                    <div class="nav-child-item" :class="{ 'nav-child-item--active': isActive }"
                                        @click="navigate(); if (isMobile) drawer = false">
                                        <div class="nav-child-line" />
                                        <v-icon size="16">{{ child.icon }}</v-icon>
                                        <span class="nav-child-title" :class="{ 'nav-child-title--active': isActive }">
                                            {{ child.title }}
                                        </span>
                                    </div>
                                </NuxtLink>
                            </div>

                            <!-- Item has NO children → normal NuxtLink -->
                            <NuxtLink v-else-if="!item.children || !item.children.length" :to="item.to" custom
                                v-slot="{ navigate, isActive }">
                                <div class="nav-item" :class="[
                                    { 'nav-item--active': isActive },
                                    { 'nav-item--collapsed': collapsed }
                                ]" @click="navigate(); if (isMobile) drawer = false">
                                    <div class="nav-icon-wrap">
                                        <v-icon size="20">{{ item.icon }}</v-icon>
                                        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
                                    </div>
                                    <template v-if="!collapsed">
                                        <div class="nav-info">
                                            <span class="nav-title" :style="isActive ? 'font-weight:600' : ''">
                                                {{ item.title }}
                                            </span>
                                        </div>
                                    </template>
                                </div>
                            </NuxtLink>

                        </template>
                    </div>

                </div>

                <!-- Pinned footer -->
                <div class="sidebar-footer">
                    <div class="user-card" :class="{ 'user-card--collapsed': collapsed }">
                        <v-avatar size="34" class="user-avatar">
                            <img src="https://i.pinimg.com/736x/61/4a/14/614a1425c0dd8f30fd5d030bba584715.jpg"
                                alt="Admin" />
                        </v-avatar>
                        <template v-if="!collapsed">
                            <div class="user-info">
                                <div class="user-name">{{ displayUserName }}</div>
                                <div class="user-role">{{ displayUserRole }}</div>
                            </div>
                            <v-btn icon="mdi-logout" variant="text" size="x-small"
                                style="margin-left: auto; color: rgba(31,41,55,0.4);"
                                @click="showLogoutDialog = true" />
                        </template>
                    </div>
                </div>

            </div>
        </v-navigation-drawer>

        <!-- ───────── Main Content ───────── -->
        <v-main class="omagi-main">
            <div class="content-wrap">
                <slot />
            </div>
        </v-main>

        <!-- ───────── Logout Dialog ───────── -->
        <LogoutDialog v-model="showLogoutDialog" />

    </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/authStore'
import LogoutDialog from '~/components/LogoutDialog.vue'

const route = useRoute()
const authStore = useAuthStore()
const { currentUser, menus } = storeToRefs(authStore)

// ── Logout dialog ──────────────────────────────────────
const showLogoutDialog = ref(false)

// ── Responsive ────────────────────────────────────────
const isMobile = ref(false)

function syncViewport() {
    isMobile.value = window.innerWidth < 960
    drawer.value = !isMobile.value
    if (isMobile.value) collapsed.value = false
}

onMounted(() => {
    syncViewport()
    window.addEventListener('resize', syncViewport)
})
onUnmounted(() => {
    window.removeEventListener('resize', syncViewport)
})

// ── Drawer & collapse ─────────────────────────────────
const drawer = ref(true)
const collapsed = ref(false)
const openMenus = ref<Set<string>>(new Set())

function toggleMenu(key: string) {
    if (openMenus.value.has(key)) {
        openMenus.value.delete(key)
    } else {
        openMenus.value.add(key)
    }
}

function toggleCollapse() {
    collapsed.value = !collapsed.value
}

interface NavItem {
    menu_uuid: string
    title: string
    icon: string
    to: string
    badge?: string
    children?: NavItem[]
}

const staticChildren: Record<string, NavItem[]> = {
    '/transactions': [
        { menu_uuid: 'static-coin', title: 'Coin', icon: 'mdi-bitcoin', to: '/transactions/coin' },
        { menu_uuid: 'static-balance', title: 'Balance', icon: 'mdi-wallet-outline', to: '/transactions/balance' },
    ],
}

const mainNav = computed<NavItem[]>(() => {
    const all = menus.value ?? []
    const topLevel = all.filter(m => m.parent_id === 0)

    return topLevel.map(m => {
        const apiChildren = all
            .filter(c => c.parent_id === m.id)
            .map(c => ({
                menu_uuid: c.menu_uuid,
                title: c.name,
                icon: c.icon,
                to: c.path,
            }))

        const children = apiChildren.length ? apiChildren : staticChildren[m.path]

        return {
            menu_uuid: m.menu_uuid,
            title: m.name,
            icon: m.icon,
            to: m.path,
            children: children?.length ? children : undefined,
        }
    })
})

const displayUserName = computed(() => currentUser.value?.user_name || currentUser.value?.login_id)
const displayUserRole = computed(() => currentUser.value?.role_name)
</script>

<style scoped lang="css">
.omagi-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    background:
        radial-gradient(ellipse at 20% 80%, rgba(31, 41, 55, 0.05) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, rgba(31, 41, 55, 0.03) 0%, transparent 55%),
        linear-gradient(180deg, #F9FAFB 0%, #F3F4F6 100%);
}

.omagi-sidebar {
    overflow: visible !important;
    background: #FFFFFF !important;
    border-right: 1px solid rgba(31, 41, 55, 0.1) !important;
    box-shadow: 4px 0 24px rgba(31, 41, 55, 0.06) !important;
}

.sidebar-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    position: relative;
}

.sidebar-scroll {
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
}

.sidebar-scroll::-webkit-scrollbar {
    display: none;
}

.brand-area {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 12px 13px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(31, 41, 55, 0.08);
}

.brand-area--collapsed {
    justify-content: center;
    padding: 14px 8px 13px;
}

.brand-logo {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.brand-name {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.3px;
    color: #111827;
}

.brand-sub {
    font-size: 9px;
    color: rgba(31, 41, 55, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 500;
}

.nav-section {
    padding: 4px 8px 0;
}

.nav-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: rgba(31, 41, 55, 0.3);
    padding: 10px 8px 3px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 8px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
    position: relative;
    margin-bottom: 2px;
    border: 1px solid transparent;
    min-height: 42px;
}

.nav-item--collapsed {
    justify-content: center;
    padding: 10px 8px;
}

.nav-item:hover {
    background: rgba(31, 41, 55, 0.05);
}

.nav-item--active {
    background: rgba(31, 41, 55, 0.07) !important;
    border-color: rgba(31, 41, 55, 0.14) !important;
}

.nav-item--active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 18%;
    height: 64%;
    width: 3px;
    background: #111827;
    border-radius: 0 3px 3px 0;
}

.nav-icon-wrap {
    position: relative;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-icon-wrap :deep(.v-icon) {
    color: rgba(31, 41, 55, 0.4) !important;
}

.nav-item--active .nav-icon-wrap :deep(.v-icon) {
    color: #111827 !important;
}

.nav-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background: #374151;
    color: #FFFFFF;
    font-size: 8px;
    font-weight: 700;
    min-width: 15px;
    height: 15px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
}

.nav-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
}

.nav-title {
    font-size: 13px;
    font-weight: 500;
    color: rgba(31, 41, 55, 0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.nav-item--active .nav-title {
    color: #111827;
    font-weight: 600;
}

.nav-sub {
    font-size: 10px;
    color: rgba(31, 41, 55, 0.38);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.nav-children {
    display: flex;
    flex-direction: column;
    padding: 2px 0 4px 0;
}

.nav-child-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px 7px 28px;
    cursor: pointer;
    border-radius: 8px;
    margin: 1px 8px;
    transition: background 0.15s;
    position: relative;
}

.nav-child-item:hover {
    background: rgba(31, 41, 55, 0.05);
}

.nav-child-item--active {
    background: rgba(31, 41, 55, 0.07);
}

.nav-child-line {
    position: absolute;
    left: 20px;
    top: 0;
    bottom: 0;
    width: 1.5px;
    background: rgba(31, 41, 55, 0.15);
}

.nav-child-title {
    font-size: 13px;
    color: rgba(31, 41, 55, 0.55);
}

.nav-child-title--active {
    color: #111827;
    font-weight: 600;
}

.sidebar-footer {
    flex-shrink: 0;
    padding: 10px 10px 12px;
    border-top: 1px solid rgba(31, 41, 55, 0.08);
    background: #FFFFFF;
}

.user-card {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 8px;
    border-radius: 10px;
    background: rgba(31, 41, 55, 0.04);
    border: 1px solid rgba(31, 41, 55, 0.1);
}

.user-card--collapsed {
    justify-content: center;
}

.user-avatar {
    border: 1.5px solid rgba(31, 41, 55, 0.2);
    flex-shrink: 0;
}

.user-name {
    font-size: 12px;
    font-weight: 600;
    color: #111827;
    line-height: 1.2;
}

.user-role {
    font-size: 9.5px;
    color: rgba(31, 41, 55, 0.45);
}

.user-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.omagi-main {
    background: transparent !important;
    position: relative;
    z-index: 1;
}

.content-wrap {
    padding: 2px 24px;
    min-height: 100%;
}
</style>